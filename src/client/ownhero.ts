/**
 * Your own hero on a friend's screen, ahead of the leader's word. The leader's room is a trip there and
 * back behind you, so what you do shows here at once, by the room's own rules, and the leader's word
 * catches up with it:
 *
 * - Walking (ownwalk.ts): the same pace and the same swept move as the room's (creeping, a block held,
 *   the shallows, the oil). The leader's word on where you are is a trip old, so the walking you've done
 *   since is added on top of it (`walked`: everything you've moved here, frame by frame, for a second);
 *   your hero eases toward that and snaps if it's far off.
 * - A dodge pressed: it starts here at once (its reach, its time, its sound and dust), gated by the last
 *   word on your breath, being winded and the dodge's cooldown. A blow (a tap, let go) the same, with its
 *   whoosh and its lunge; a press during a blow goes on the combo as the room's would. A block held raises
 *   the guard at once (only a kit that holds one).
 * - The leader's patch shows the act: it's carried on from. Its steps here count on top of the leader's
 *   word for as far as the leader's room has yet to go with it (by its own progress in the patch, not
 *   the trip's guess, so a dodge never wobbles). The leader has had the press a while and the act never
 *   came (it was refused: no breath, a blow landed first): it's taken back, and your hero eases back to
 *   where the leader has it.
 * - Hit, stunned, down, carried, dashing: the leader's room moves you, and you're drawn where it says.
 *
 * Only drawing: hits, damage and kills are the leader's alone (coop.ts sends the presses; the room decides).
 */
import { collide, useMap } from '../shared/arena';
import { travel } from '../shared/sweep';
import { CHARGE, DODGE, HERO, INPUT_BUFFER, TICK, WEAPONS, dodgeOf } from '../shared/tuning';
import { statsOf } from '../sim/gearstats';
import { currentSwing, face, rollDir } from '../sim/hero';
import { dodgeBreath, dodgeReach } from '../sim/knacks';
import type { ArenaRoom } from '../sim/room';
import type { FightEvent, Hero, Intent } from '../sim/types';
import { actPace, guardUp } from '../sim/walkspeed';
import { walkStep, type Body, type Slip } from './ownwalk';

/**
 * `ease` a second toward the leader's word (`settleEase` standing still); snap past `snap` tiles (`far`
 * while an act of mine is in play or settling back); `follow` a second after the leader's room moving you.
 */
export const PREDICT = { ease: 12, settleEase: 6, snap: 1.5, far: 3.5, trip: 0.15, follow: 25, settle: 0.6 };
/** Acts the leader's room does to you: drawn where it says, never walked here. */
const FOLLOW = new Set(['hurt', 'stun', 'down', 'zip', 'bash', 'carry', 'slam']);
/** What this screen draws ahead of the leader's word (put back from its word each frame first). */
const DRAWN = ['act', 'actT', 'blocking', 'rollDx', 'rollDy', 'fx', 'fy', 'combo', 'heavy', 'moving'] as const;

interface Own {
  id: number;
  kind: 'roll' | 'attack';
  /** This page's clock when it began; how far in; the newest input sent by then. */
  start: number;
  t: number;
  sent: number;
  /** The leader's time when its ack first covered the press (-1: not yet). */
  ackT: number;
  confirmed: boolean;
  done: boolean;
  dead?: boolean;
  fx: number;
  fy: number;
  /** A dodge: its way, pace (tiles a second), time, breath; the leader's last dodge when it began. */
  dx: number;
  dy: number;
  speed: number;
  time: number;
  cost: number;
  before: number;
  combo: number;
  /** The event shown here for it (the leader's own, when it comes, isn't shown again). */
  ev: string;
  /** How far into it the leader's room is, by its latest patch (Infinity: done there); its start there. */
  prog: number;
  began: number;
}

export class OwnHero {
  /** The leader's word on my hero, field by field. */
  private srv: Record<string, unknown> | null = null;
  private server: { x: number; y: number } | null = null;
  private prevServer: { x: number; y: number } | null = null;
  private p: Body | null = null;
  /** [this page's clock, dx, dy, the act it was part of (0: walking), the stretch of that act it covers (from, to)]. */
  private walked: [number, number, number, number, number, number][] = [];
  /** The stick last frame. */
  private was: Intent | null = null;
  /** When the latest patch was applied here (its word stands till the next: walking since is on top). */
  private appliedAt = 0;
  /** The trip there and back (from the newest input of mine the leader has used). */
  trip = PREDICT.trip;
  private ack = -1;
  private slip: Slip = {};
  private acts: Own[] = [];
  private seq = 0;
  private rollSeq = NaN;
  private attackSeq = NaN;
  private rollQ = -9;
  private attackQ = -9;
  private lastRoll = -9;
  private settleUntil = -9;
  private owed: { k: string; at: number }[] = [];

  /** A new room or a new leader: start over. */
  reset(): void {
    this.srv = this.server = this.prevServer = this.p = null;
    this.walked = [];
    this.acts = [];
    this.owed = [];
  }

  /** A patch applied: `mine` what it said of my hero, `meNow` my hero as decoded, `t` the leader's time, `ack` my newest input used. */
  patch(mine: Record<string, unknown> | undefined, meNow: Hero | undefined, full: boolean, t: number, ack: number | undefined, now: number): void {
    if (!meNow) return;
    if (full || !this.srv) this.srv = { ...meNow } as unknown as Record<string, unknown>;
    else if (mine) Object.assign(this.srv, mine);
    const s = this.srv, at = { x: s.x as number, y: s.y as number };
    this.prevServer = this.server ?? at;
    this.server = at;
    if (ack !== undefined && ack !== this.ack) (this.ack = ack), (this.trip = this.trip * 0.7 + Math.min(1, Math.max(0, now - ack)) * 0.3);
    this.appliedAt = now;
    for (const o of this.acts) {
      if (o.dead) continue;
      if (!o.confirmed) {
        if (o.kind === 'roll' && s.lastRollAt !== o.before) (o.confirmed = true), (o.began = s.lastRollAt as number);
        else if (o.kind === 'attack' && ((s.act === 'attack' && s.combo === o.combo) || s.act === 'charge')) o.confirmed = true;
        else if (ack !== undefined && ack >= o.sent) {
          // (The room keeps a press INPUT_BUFFER, for a busy moment to pass: give it that.)
          if (o.ackT < 0) o.ackT = t;
          else if (t - o.ackT > INPUT_BUFFER + 2 * TICK) this.cancel(o, now);
        }
      }
      if (o.confirmed) o.prog = o.kind === 'roll' ? (s.act === 'roll' && s.lastRollAt === o.began ? t - o.began : Infinity) : s.act === 'attack' && s.combo === o.combo ? (s.actT as number) : Infinity;
    }
    // Done here and done there: all of it is in the leader's word now.
    const over = new Set(this.acts.filter((o) => o.dead || (o.done && o.confirmed && o.prog === Infinity)).map((o) => o.id));
    if (over.size) (this.acts = this.acts.filter((o) => !over.has(o.id))), (this.walked = this.walked.filter((w) => !over.has(w[3])));
  }

  /** Taken back: its steps forgotten, its sound owed no more; my hero eases back. */
  private cancel(o: Own, now: number): void {
    o.dead = o.done = true;
    this.walked = this.walked.filter((w) => w[3] !== o.id);
    this.settleUntil = now + PREDICT.settle;
    const i = this.owed.findIndex((x) => x.k === o.ev);
    if (i >= 0) this.owed.splice(i, 1);
    if (o.kind === 'roll') this.lastRoll = -9;
  }

  /** The leader's event for something already shown here (my dodge, my blow): not shown again. */
  owes(e: FightEvent, now: number): boolean {
    if (e.k !== 'roll' && e.k !== 'blink' && e.k !== 'swing') return false;
    this.owed = this.owed.filter((o) => now - o.at < 1.5);
    const i = this.owed.findIndex((o) => o.k === e.k), s = this.server;
    if (i < 0 || !s || Math.hypot(e.x - s.x, e.y - s.y) > 2.5) return false;
    this.owed.splice(i, 1);
    return true;
  }

  /**
   * Each frame: my hero drawn ahead of the leader's word. `alpha` how far between the leader's last two
   * patches; `sent` the newest input sent; `lead` the leader's time about now; `ev` my events (shown here).
   */
  frame(room: ArenaRoom, intent: Intent, now: number, dt: number, alpha: number, sent: number, lead: number, ev: FightEvent[], stickAt = now): void {
    const h = room.heroes.find((x) => x.id === 'me'), s = this.srv, sv = this.server;
    if (!h || !s || !sv) return;
    const d = h as unknown as Record<string, unknown>;
    for (const f of DRAWN) if (f in s) d[f] = s[f];
    const p = (this.p ??= { ...sv, z: (s.z as number) ?? 0 }), w = WEAPONS[h.weapon];
    useMap(room.map);
    if (intent.rollSeq !== this.rollSeq) (Number.isNaN(this.rollSeq) || (this.rollQ = now)), (this.rollSeq = intent.rollSeq);
    if (intent.attackSeq !== this.attackSeq) (Number.isNaN(this.attackSeq) || (this.attackQ = now)), (this.attackSeq = intent.attackSeq);
    this.walked = this.walked.filter((x) => x[0] > now - 1.2 || this.acts.some((o) => o.id === x[3]));
    // The leader's room moving me (a blow, a stun, a carry): where it says, between its patches.
    if (FOLLOW.has(s.act as string) || h.carrying || h.lifting) {
      for (const o of this.acts) if (!o.done) (o.done = true), o.confirmed || this.cancel(o, now);
      const pv = this.prevServer ?? sv, tx = pv.x + (sv.x - pv.x) * alpha, ty = pv.y + (sv.y - pv.y) * alpha;
      const k = Math.hypot(tx - p.x, ty - p.y) > PREDICT.snap ? 1 : Math.min(1, dt * PREDICT.follow);
      (p.x += (tx - p.x) * k), (p.y += (ty - p.y) * k), (p.z = (s.z as number) ?? 0);
      this.walked.push([now, 0, 0, 0, 0, 0]);
      return this.put(room, h, p);
    }
    let cur = this.acts.find((o) => !o.done);
    // Past a dodge or blow of mine the leader's still showing: on my clock it's over.
    if (!cur && (s.act === 'roll' || s.act === 'attack') && this.acts.some((o) => o.done && o.confirmed && o.kind === s.act && o.prog !== Infinity)) (h.act = 'idle'), (h.actT = 0), (h.heavy = false);
    cur = this.startRoll(h, cur, intent, now, sent, p, ev) ?? this.startSwing(room, h, cur, intent, now, sent, p, ev);
    let mx = 0, my = 0, from = 0, to = 0;
    if (cur) [mx, my, from, to] = this.run(h, cur, p, dt);
    // Walking, at the pace of what I'm doing (none mid-dodge, or mid-blow but for a wand's cast).
    h.blocking = h.act === 'idle' && guardUp(h, intent);
    if (h.act === 'idle') face(h, intent, room.enemies, h.blocking);
    // (The stick moved between frames, at `stickAt`, and went to the leader then: the walk till then is
    // the last frame's stick, after it this one's, as the leader's room will have it.)
    const was = this.was ?? intent, split = Math.max(0, Math.min(dt, dt - (now - stickAt)));
    this.was = intent;
    let [wx, wy] = split > 0 && split < dt ? walkStep(h, p, was, this.slip, split, lead, actPace(h, was)) : [0, 0];
    const [ux, uy] = walkStep(h, p, intent, this.slip, split > 0 && split < dt ? dt - split : dt, lead, actPace(h, intent));
    (wx += ux), (wy += uy);
    h.moving = !!(wx || wy);
    if (cur) this.walked.push([now, mx, my, cur.id, from, to]);
    this.walked.push([now, wx, wy, 0, 0, 0]);
    // Where the leader will have me once what I've done since it last looked reaches it: my walking since
    // the trip before its latest patch, and of each act of mine what its room has yet to go through (all
    // of one it hasn't begun yet, however long ago it began here). A frame's step of an act counts only
    // for the part of it past where the leader's room is with it: counted whole, a frame half done there
    // put the target up to a frame's dodge past the end, and the hero ran on and eased back (2026-11-06).
    let tx = sv.x, ty = sv.y;
    const edge = this.appliedAt - this.trip, acts = new Map(this.acts.map((o) => [o.id, o]));
    for (const [t, dx, dy, id, from, to] of this.walked) {
      const o = id ? acts.get(id) : undefined;
      const k = !id ? (t > edge ? 1 : 0) : !o ? 0 : !o.confirmed ? 1 : to > from ? Math.min(1, Math.max(0, (to - o.prog) / (to - from))) : to > o.prog ? 1 : 0;
      if (k) (tx += dx * k), (ty += dy * k);
    }
    const far = now < this.settleUntil || this.acts.length ? PREDICT.far : PREDICT.snap;
    if (Math.hypot(tx - p.x, ty - p.y) > far) (p.x = tx), (p.y = ty), (p.z = (s.z as number) ?? 0);
    else {
      // (Standing still with nothing of mine in play, what's left, a tick's worth of walking or so, settles gently.)
      const still = !wx && !wy && !this.acts.length;
      const k = Math.min(1, dt * (still ? PREDICT.settleEase : PREDICT.ease));
      (p.x += (tx - p.x) * k), (p.y += (ty - p.y) * k);
    }
    collide(p, HERO.radius);
    this.put(room, h, p);
  }

  private put(room: ArenaRoom, h: Hero, p: Body): void {
    (h.x = p.x), (h.y = p.y);
    // (Drawn exactly here: between patches the scene lerps from `prev`, and my hero moves every frame.)
    room.prev.set('h:me', [p.x, p.y]);
  }

  /** A dodge pressed, and the room would let it go now (as sim/hero.ts does: free, or a blow's recovery). */
  private startRoll(h: Hero, cur: Own | undefined, intent: Intent, now: number, sent: number, p: Body, ev: FightEvent[]): Own | undefined {
    const w = WEAPONS[h.weapon], s = this.srv!;
    if (now - this.rollQ >= INPUT_BUFFER || !dodgeOf(w) || s.winded) return;
    const breath = (s.stamina as number) - this.acts.filter((o) => o.kind === 'roll' && !o.confirmed && !o.dead).reduce((n, o) => n + o.cost, 0);
    if (breath < 1 || now - this.lastRoll < w.dodge.cooldown * (1 - statsOf(h).dodge)) return;
    if (cur?.kind === 'roll') return;
    // A SPRINT walks on, faster: the room's word on it (sprintUntil) comes with its next state.
    if (w.dodge.kind === 'sprint') return void ((this.rollQ = -9), (this.lastRoll = now), (h.sprintUntil = now + w.dodge.time));
    if (cur) {
      const sw = currentSwing(h);
      if (cur.t < sw.windup + sw.active) return;
      cur.done = true;
    } else if (h.act !== 'idle' && h.act !== 'charge' && !(h.act === 'attack' && h.actT >= currentSwing(h).windup + currentSwing(h).active)) return;
    (h.act = 'idle'), (h.heavy = false);
    // (The room moves a dodge whole ticks till its time is up: as many here, at its pace.)
    const [dx, dy] = rollDir(h, intent), kind = w.dodge.kind;
    const o = this.add({ kind: 'roll', start: now, sent, dx, dy, speed: dodgeReach(h) / w.dodge.time, time: Math.ceil(w.dodge.time / TICK - 1e-9) * TICK, cost: w.dodge.stamina * DODGE.cost * dodgeBreath(h), before: s.lastRollAt as number, combo: 0, fx: kind === 'backstep' ? h.fx : dx, fy: kind === 'backstep' ? h.fy : dy, ev: kind === 'blink' ? 'blink' : 'roll' });
    (this.rollQ = -9), (this.lastRoll = now);
    ev.push({ k: o.ev as 'roll', x: p.x, y: p.y });
    return o;
  }

  /** A blow: a tap let go (a crossbow on the press), or the next of the combo pressed during this one. */
  private startSwing(room: ArenaRoom, h: Hero, cur: Own | undefined, intent: Intent, now: number, sent: number, p: Body, ev: FightEvent[]): Own | undefined {
    const w = WEAPONS[h.weapon];
    if (this.attackQ < 0 || (intent.attack && !w.noCharge)) return cur;
    let combo = 0;
    if (cur?.kind === 'attack') {
      const sw = currentSwing(h);
      if (cur.t < sw.windup + sw.active || this.attackQ <= cur.start || now - this.attackQ >= INPUT_BUFFER || cur.combo >= w.combo.length - 1) return cur;
      (cur.done = true), (combo = cur.combo + 1);
    } else if (cur || h.act !== 'idle' || now - this.attackQ >= CHARGE.start + INPUT_BUFFER) return cur;
    // Turned to a goblin in reach, as the room turns you (sim/hero.ts startSwing).
    const first = w.combo[0];
    face(h, intent, room.enemies, true, first.shot ? first.range * 0.9 : first.thrust && first.lunge > 1.5 ? first.range + first.lunge : 3.2);
    Object.assign(h, { act: 'attack', actT: 0, heavy: false, combo });
    const o = this.add({ kind: 'attack', start: now, sent, dx: 0, dy: 0, speed: 0, time: 0, cost: 0, before: 0, combo, fx: h.fx, fy: h.fy, ev: 'swing' });
    this.attackQ = -9;
    ev.push({ k: 'swing', x: p.x, y: p.y, src: !currentSwing(h).shot && w.cls === 'RANGER' ? 'sword' : h.weapon, heavy: false });
    return o;
  }

  private add(o: Omit<Own, 'id' | 't' | 'ackT' | 'confirmed' | 'done' | 'prog' | 'began'>): Own {
    const n: Own = { ...o, id: ++this.seq, t: 0, ackT: -1, confirmed: false, done: false, prog: -1, began: NaN };
    this.acts.push(n);
    this.owed.push({ k: n.ev, at: n.start });
    return n;
  }

  /** My act this frame: drawn, and its own move (a dodge's reach, a blow's lunge), with the stretch of the act's time it moved through. */
  private run(h: Hero, o: Own, p: Body, dt: number): [number, number, number, number] {
    const x0 = p.x, y0 = p.y, from = o.t;
    let to = o.t;
    (h.fx = o.fx), (h.fy = o.fy);
    if (o.kind === 'roll') {
      const step = Math.max(0, Math.min(dt, o.time - o.t));
      to = o.t + step;
      travel(p, o.dx * o.speed * step, o.dy * o.speed * step, HERO.radius);
      o.t += dt;
      Object.assign(h, { act: 'roll', actT: Math.min(o.t, o.time), rollDx: o.dx, rollDy: o.dy });
      if (o.t >= o.time) (o.done = true), (h.act = 'idle'), (h.actT = 0);
    } else {
      Object.assign(h, { act: 'attack', heavy: false, combo: o.combo });
      const sw = currentSwing(h), step = Math.max(0, Math.min(dt, sw.windup - o.t));
      to = o.t + step;
      if (step > 0) (p.x += o.fx * (sw.lunge / sw.windup) * step), (p.y += o.fy * (sw.lunge / sw.windup) * step), collide(p, HERO.radius);
      o.t += dt;
      h.actT = o.t;
      if (o.t >= sw.windup + sw.active + sw.recover) (o.done = true), (h.act = 'idle'), (h.actT = 0);
    }
    return [p.x - x0, p.y - y0, from, to];
  }
}
