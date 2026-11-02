/**
 * A job with friends: the leader's browser runs the fight (Come Bye's host model), and each friend's
 * browser draws it and sends their input. No codes: the party room comes from the board (parties.ts).
 *
 * - CoopHost (the leader): friends say hello with their hero (their profile); the game puts them in
 *   the room and feeds it their Intents. About 12 times a second the room goes out as a patch of
 *   what changed (snap.ts), a full one every few seconds and for anyone new, with the tick's events
 *   for their effects and sounds. A friend silent a minute is gone (a phone that lost signal has
 *   that long to come back to the same hero).
 * - CoopGuest (a friend): keeps a copy of the leader's room from the patches and draws it; sends
 *   its Intent when it changes (and every 2 s). Its own hero is `me` in its copy, so the rest of the
 *   game can't tell. The leader quiet 20 s, and the job ends for it as a loss.
 */
import type { Job } from '../shared/jobs';
import type { Profile } from '../shared/progress';
import { HERO, TICK, WEAPONS } from '../shared/tuning';
import { collide, useMap } from '../shared/arena';
import { statsOf } from '../sim/gearstats';
import type { Hero } from '../sim/types';
import { ArenaRoom } from '../sim/room';
import type { Run } from '../sim/run';
import { NO_INTENT, type FightEvent, type Intent } from '../sim/types';
import { RelaySocket, type RelayMsg } from './relay';
import { Decoder, Encoder, stateOf, type Patch } from './snap';

const SEND_EVERY = 0.05, FULL_EVERY = 4, GRACE = 60, LOST = 20, KEEP = 2;
/**
 * Your own hero, on a friend's screen, moves the moment you press. The leader's word on where you
 * are is a trip there and back old, so the walking you've done here since then is added on top of
 * it (the trip is timed: each input carries this browser's clock, and the leader hands back the
 * newest it has used). Your hero eases toward that (`ease` a second) and snaps if it's more than
 * `snap` tiles off (a knockback, a pull). Rolls, swings and hits are the leader's alone.
 */
const PREDICT = { ease: 12, snap: 1.5, trip: 0.15 };
/** A friend in the leader's room. */
export interface Friend { name: string; profile: Profile | null; intent: Intent; heard: number; fresh: boolean; gone: boolean; /** Their clock on the newest input used (handed back, so they can time the trip). */ at?: number }
/** What the leader's game tells the host to send, and is told by it. */
export interface HostGame {
  room: ArenaRoom;
  run: Run | null;
  /** Which room this is (changes when the party moves on or goes indoors). */
  roomKey: number;
  goalText(): string;
  addFriend(id: string, f: Friend): void;
  dropFriend(id: string): void;
}

export class CoopHost {
  readonly friends = new Map<string, Friend>();
  private sock: RelaySocket;
  private enc = new Encoder();
  private evs: FightEvent[] = [];
  private sentAt = -9;
  private fullAt = -99;
  private sentKey = -1;
  private now = 0;

  constructor(readonly room: string, private myId: string, private myName: string, private game: HostGame, members: [string, string][]) {
    for (const [id, name] of members) if (id !== myId) this.friends.set(id, { name, profile: null, intent: NO_INTENT, heard: 0, fresh: true, gone: false });
    this.sock = new RelaySocket(room, myId, 'host');
    this.sock.onMessage = (m) => this.heard(m);
  }

  private heard(m: RelayMsg): void {
    if (m.t !== 'msg') return;
    const f = this.friends.get(m.from), d = m.d as { t?: string; profile?: Profile; i?: Intent } | null;
    if (!f || !d) return;
    f.heard = this.now;
    if (d.t === 'hello' && d.profile && typeof d.profile === 'object') {
      const first = !f.profile || f.gone;
      Object.assign(f, { profile: d.profile, fresh: true, gone: false });
      if (first) this.game.addFriend(m.from, f);
    } else if (d.t === 'in' && d.i && typeof d.i === 'object') (f.intent = { ...NO_INTENT, ...d.i }), (f.at = typeof (d as { at?: unknown }).at === 'number' ? (d as { at: number }).at : f.at);
  }

  /** Each frame, after the room has run: collect its events; send a patch when it's time. */
  frame(now: number, ev: FightEvent[]): void {
    this.now = now;
    this.evs.push(...ev);
    if (this.evs.length > 200) this.evs.splice(0, this.evs.length - 200);
    for (const [id, f] of this.friends) if (f.profile && !f.gone && now - f.heard > GRACE) (f.gone = true), this.game.dropFriend(id);
    if (now - this.sentAt < SEND_EVERY) return;
    const g = this.game, room = g.room, full = now - this.fullAt > FULL_EVERY || g.roomKey !== this.sentKey || [...this.friends.values()].some((f) => f.fresh);
    const p = this.enc.encode(stateOf(room), full);
    const names: Record<string, string> = { me: this.myName };
    const acks: Record<string, number> = {};
    for (const [id, f] of this.friends) (names[id] = f.name), f.at !== undefined && (acks[id] = f.at);
    const body = { p, f: full ? 1 : 0, k: g.roomKey, map: full ? { ...room.map, blocks: [] } : undefined, t: room.time, x: room.exitOpen ? 1 : 0, run: g.run, goal: g.goalText(), ev: this.evs, names, acks };
    this.sock.send('*', { s: JSON.stringify(body) });
    this.evs = [];
    this.sentAt = now;
    if (full) (this.fullAt = now), (this.sentKey = g.roomKey), this.friends.forEach((f) => (f.fresh = false));
  }

  /** The job is over: tell everyone how it went (their game pays them from the run). */
  end(won: boolean, run: Run): void {
    this.sock.send('*', { end: { won, run } });
  }

  close(): void {
    // A moment for the last word to go out.
    const s = this.sock;
    setTimeout(() => s.close(), 1500);
  }
}

export class CoopGuest {
  room: ArenaRoom | null = null;
  run: Run | null = null;
  goal = '';
  ended: { won: boolean; run: Run } | null = null;
  private sock: RelaySocket;
  private dec = new Decoder();
  private key = -1;
  private lastAt = 0;
  private gap = SEND_EVERY;
  private events: FightEvent[] = [];
  private said = '';
  private saidAt = -9;
  private helloAt = -9;
  private now = 0;
  private firstAt = -1;
  /** My hero where I've walked it, and where the leader's game last said it was. */
  private pred: { x: number; y: number } | null = null;
  private server: { x: number; y: number } | null = null;

  constructor(readonly code: string, private myId: string, readonly lead: string, private profile: () => Profile, readonly job: Job) {
    this.sock = new RelaySocket(code, myId, 'join');
    this.sock.onMessage = (m) => this.heard(m);
  }

  private hello(): void {
    this.helloAt = this.now;
    this.sock.send(this.lead, { t: 'hello', profile: this.profile() });
  }

  private heard(m: RelayMsg): void {
    if (m.t === 'role' && m.role === 'guest') return this.hello();
    if (m.t !== 'msg' || m.from !== this.lead) return;
    const d = m.d as { s?: string; end?: { won: boolean; run: Run } };
    if (d.end) return void (this.ended = d.end);
    if (typeof d.s !== 'string') return;
    // The leader's own hero is `me` in their room; in mine, I am. (Ids are quoted whole, so only ids change.)
    let body: { p: Patch; f: number; k: number; map?: ArenaRoom['map']; t: number; x: number; run: Run | null; goal: string; ev: FightEvent[]; names: Record<string, string>; acks?: Record<string, number> };
    try {
      body = JSON.parse(d.s.split('"me"').join('"@lead"').split(`"${this.myId}"`).join('"me"'));
    } catch {
      return;
    }
    if (!body.f && !this.room) return;
    if (body.f && (body.k !== this.key || !this.room) && body.map) {
      this.room = new ArenaRoom(1, { map: body.map });
      this.key = body.k;
      this.pred = this.server = null;
    }
    const room = this.room!;
    for (const h of room.heroes) room.prev.set('h:' + h.id, [h.x, h.y]);
    for (const e of room.enemies) room.prev.set('e:' + e.id, [e.x, e.y]);
    // Where the leader has me, when this patch says (my hero's own x, y get my walk between patches).
    const mine = body.p.heroes?.u.find(([k]) => k === 'me')?.[1] as { x?: number; y?: number } | undefined;
    const s = this.dec.apply(body.p, !!body.f) as unknown as Record<string, unknown[]>;
    const meNow = (s.heroes as Hero[] | undefined)?.find((h) => h.id === 'me');
    if (meNow && (body.f || mine?.x !== undefined || mine?.y !== undefined || !this.server)) this.server = { x: mine?.x ?? meNow.x, y: mine?.y ?? meNow.y };
    // Between frames too, my hero stays where I've walked it (the leader's word is in `server`).
    if (meNow && this.pred && meNow.act === 'idle') (meNow.x = this.pred.x), (meNow.y = this.pred.y);
    const r = room as unknown as Record<string, unknown>;
    for (const [c, list] of Object.entries(s)) if (c === 'blocks') room.map.blocks = list as typeof room.map.blocks;
    else r[c] = list;
    // (The names came through the same swap: the leader's under '@lead', mine under 'me'.)
    for (const h of room.heroes) h.tag = body.names[h.id] ?? h.tag;
    room.time = body.t;
    room.exitOpen = !!body.x;
    this.run = body.run;
    this.goal = body.goal;
    // The trip there and back, from the newest input of mine the leader has used.
    const ack = body.acks?.me;
    if (ack !== undefined && ack !== this.ack) (this.ack = ack), (this.trip = this.trip * 0.7 + Math.min(1, Math.max(0, this.now - ack)) * 0.3);
    this.events.push(...body.ev);
    this.gap = Math.min(0.3, Math.max(SEND_EVERY, this.now - this.lastAt));
    this.lastAt = this.now;
  }

  /** Each frame: send my input (when it changes, and now and then), and draw between patches. */
  frame(now: number, intent: Intent): void {
    this.now = now;
    const s = JSON.stringify(intent);
    // Every 0.5 s even unchanged, so the trip there and back stays timed.
    if (s !== this.said || now - this.saidAt > Math.min(KEEP, 0.5)) (this.sock.send(this.lead, { t: 'in', i: intent, at: now }), (this.said = s), (this.saidAt = now));
    // No room yet: keep saying hello (the leader may still be getting there).
    if (!this.room && now - this.helloAt > 2) this.hello();
    if (this.room) (this.room as unknown as { acc: number }).acc = TICK * Math.min(1, (now - this.lastAt) / this.gap);
    this.predict(intent, now - (this.frameAt < 0 ? now : this.frameAt));
    this.frameAt = now;
  }

  private frameAt = -1;
  private ack = -1;
  private trip = PREDICT.trip;
  /** My walking here, frame by frame, for the last second. */
  private walked: [number, number, number][] = [];

  /** Walk my own hero here, now, and ease it toward the leader's word (see PREDICT). */
  private predict(intent: Intent, dt: number): void {
    const room = this.room, h = room?.heroes.find((x) => x.id === 'me'), s = this.server;
    if (!room || !h || !s) return;
    const free = h.act === 'idle' && !h.carrying && !h.lifting;
    const m = Math.min(1, Math.hypot(intent.mx, intent.my)), l = Math.hypot(intent.mx, intent.my) || 1;
    const sp = free && m >= 0.05 ? HERO.speed * WEAPONS[h.weapon].speed * statsOf(h).speed * m : 0, vx = (intent.mx / l) * sp, vy = (intent.my / l) * sp;
    const p = (this.pred ??= { ...s });
    // Busy (rolling, swinging, hit, down): exactly where the leader has me.
    const now = this.now;
    this.walked.push([now, free ? vx * dt : 0, free ? vy * dt : 0]);
    while (this.walked.length && this.walked[0][0] < now - 1) this.walked.shift();
    // Where the leader will have me once my walking since it last looked reaches it.
    let tx = s.x, ty = s.y;
    for (const [t, dx, dy] of this.walked) if (t > now - this.trip) (tx += dx), (ty += dy);
    if (!free || Math.hypot(tx - p.x, ty - p.y) > PREDICT.snap) (p.x = free ? tx : s.x), (p.y = free ? ty : s.y);
    else {
      useMap(room.map);
      (p.x += vx * dt), (p.y += vy * dt);
      const k = Math.min(1, dt * PREDICT.ease);
      (p.x += (tx - p.x) * k), (p.y += (ty - p.y) * k);
      collide(p, HERO.radius);
      if (sp) (h.fx = vx / sp), (h.fy = vy / sp), (h.moving = true);
    }
    (h.x = p.x), (h.y = p.y);
    room.prev.set('h:me', [p.x, p.y]);
  }

  /** The leader has gone quiet too long (or never came): the job is lost. */
  lost(now: number): boolean {
    if (this.firstAt < 0) this.firstAt = now;
    return now - (this.lastAt || this.firstAt) > LOST;
  }

  /** The leader's events since last asked (effects and sounds). */
  take(): FightEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  close(): void {
    this.sock.close();
  }
}
