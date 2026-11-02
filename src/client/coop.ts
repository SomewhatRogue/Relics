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
 * - Handing on: every 2 s the leader also sends the whole job (the run and the room, saveRoom).
 *   The leader quiet 9 s, the friend first in line (by id) takes the room over from that and leads
 *   (Game.takeOver); the others hear who leads now and follow them. The old leader, back, follows
 *   them; a leader whose page only reloaded leads again from the job as it kept it (Game.resume).
 */
import type { Job } from '../shared/jobs';
import type { Profile } from '../shared/progress';
import { HERO, TICK, WEAPONS } from '../shared/tuning';
import { Rng } from '../shared/rng';
import { collide, useMap } from '../shared/arena';
import { statsOf } from '../sim/gearstats';
import type { Hero } from '../sim/types';
import { ArenaRoom } from '../sim/room';
import type { Run } from '../sim/run';
import { NO_INTENT, type FightEvent, type Intent } from '../sim/types';
import { RelaySocket, type RelayMsg } from './relay';
import { Decoder, Encoder, stateOf, type Patch } from './snap';
import { keepJob } from './session';

const AWAY = 5, REJOIN = 5, BYE_WAIT = 2.5, SEND_EVERY = 0.05, FULL_EVERY = 4, GRACE = 60, LOST = 20, KEEP = 2, SAVE_EVERY = 2, TAKE = 9, TAKE_NEXT = 5;
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
  /** The caged and freed in this room's houses, by door (for the way-pointer on friends' screens). */
  houses(): { x: number; y: number; caged: number; waiting: number }[];
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

  private savedAt = -99;

  constructor(readonly room: string, private myId: string, private myName: string, private game: HostGame, readonly members: [string, string][], want: 'host' | 'take' = 'host') {
    const now = performance.now() / 1000;
    for (const [id, name] of members) if (id !== myId) this.friends.set(id, { name, profile: null, intent: NO_INTENT, heard: now, fresh: true, gone: false });
    this.sock = new RelaySocket(room, myId, want);
    this.sock.onMessage = (m) => this.heard(m);
  }

  /** Taking a job on, and the relay says its leader is still there after all: follow them again. */
  onRefused: (lead: string) => void = () => {};

  private heard(m: RelayMsg): void {
    if (m.t === 'role' && m.role === 'guest' && m.host && m.host !== this.myId) return this.onRefused(m.host);
    if (m.t !== 'msg') return;
    const f = this.friends.get(m.from), d = m.d as { t?: string; profile?: Profile; i?: Intent } | null;
    if (!f || !d) return;
    f.heard = this.now;
    // A friend headed home: out of the fight now, not in a minute.
    if (d.t === 'bye') return void (f.gone || ((f.gone = true), this.game.dropFriend(m.from)));
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
    for (const [id, f] of this.friends) if (!f.gone && now - f.heard > GRACE) (f.gone = true), this.game.dropFriend(id);
    // The whole job, now and then, for a friend to take on if this browser goes.
    if (now - this.savedAt > SAVE_EVERY && this.company) {
      this.savedAt = now;
      const save = this.saved();
      this.sock.send('*', { save });
      // (Kept here too, for this page to lead again after a reload.)
      keepJob(save);
    }
    if (now - this.sentAt < SEND_EVERY) return;
    const g = this.game, room = g.room, full = now - this.fullAt > FULL_EVERY || g.roomKey !== this.sentKey || [...this.friends.values()].some((f) => f.fresh);
    const p = this.enc.encode(stateOf(room), full);
    const names: Record<string, string> = { me: this.myName };
    const acks: Record<string, number> = {};
    for (const [id, f] of this.friends) (names[id] = f.name), f.at !== undefined && (acks[id] = f.at);
    const body = { p, f: full ? 1 : 0, k: g.roomKey, map: full ? { ...room.map, blocks: [] } : undefined, t: room.time, x: room.exitOpen ? 1 : 0, in: room.indoors ? 1 : 0, hc: g.houses(), run: g.run, goal: g.goalText(), ev: this.evs, names, acks };
    this.sock.send('*', { s: JSON.stringify(body) });
    this.evs = [];
    this.sentAt = now;
    if (full) (this.fullAt = now), (this.sentKey = g.roomKey), this.friends.forEach((f) => (f.fresh = false));
  }

  /** Leaving the job to the friends still in it: the whole job as it stands, then goodbye. */
  handOver(): void {
    this.sock.send('*', { save: this.saved() });
    this.sock.send('*', { bye: 1 });
    this.close();
  }

  /** The whole job as it stands. */
  private saved(): string {
    return JSON.stringify({ run: this.game.run, room: saveRoom(this.game.room), members: this.members, key: this.game.roomKey });
  }

  /** A friend gone, or not heard from in AWAY seconds (a closed tab, a locked phone): the party won't wait for them. */
  away(id: string): boolean {
    const f = this.friends.get(id);
    return !!f && (f.gone || this.now - f.heard > AWAY);
  }

  /** Anyone still with me (not gone). */
  get company(): boolean {
    return [...this.friends.values()].some((f) => !f.gone);
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
  /** The leader's count of the caged and freed in this room's houses. */
  houses: { x: number; y: number; caged: number; waiting: number }[] = [];
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

  /** The newest whole job from the leader (to take it on), and when the leader was last heard. */
  save: string | null = null;
  /** My hero as the leader last had it, and whether their room has let it go. */
  private mine: Hero | null = null;
  private missing = false;
  /** The leader said goodbye (went home): whoever takes it on lets their hero go. */
  left = false;
  private heardLead = -1;

  constructor(readonly code: string, readonly myId: string, public lead: string, private profile: () => Profile, readonly job: Job) {
    this.sock = new RelaySocket(code, myId, 'join');
    this.sock.onMessage = (m) => this.heard(m);
  }

  private hello(): void {
    this.helloAt = this.now;
    this.sock.send(this.lead, { t: 'hello', profile: this.profile() });
  }

  private heard(m: RelayMsg): void {
    // Whoever hosts is who I follow (a page coming back after a reload may not know yet).
    if (m.t === 'role' && m.role === 'guest') return void (m.host && m.host !== this.lead && this.follow(m.host)), this.hello();
    // Someone else leads now (a friend took the job on): follow them.
    if (m.t === 'hosted' && m.id !== this.myId) return this.follow(m.id), this.hello();
    if (m.t !== 'msg' || m.from !== this.lead) return;
    this.heardLead = this.now;
    const d = m.d as { s?: string; end?: { won: boolean; run: Run }; save?: string; bye?: number };
    // The leader's headed home and left the job to us: as good as gone, so whoever's first takes it
    // on in a moment (once their goodbye has freed the room).
    if (d.bye) return void ((this.left = true), (this.heardLead = this.now - TAKE + BYE_WAIT));
    // (The end's run swaps ids like a patch does, so my own tallies are under `me`.)
    if (d.end) return void (this.ended = JSON.parse(JSON.stringify(d.end).split('"me"').join('"@lead"').split(`"${this.myId}"`).join('"me"')));
    if (typeof d.save === 'string') return void (this.save = d.save);
    if (typeof d.s !== 'string') return;
    // The leader's own hero is `me` in their room; in mine, I am. (Ids are quoted whole, so only ids change.)
    let body: { p: Patch; f: number; k: number; map?: ArenaRoom['map']; t: number; x: number; in?: number; hc?: CoopGuest['houses']; run: Run | null; goal: string; ev: FightEvent[]; names: Record<string, string>; acks?: Record<string, number> };
    try {
      body = JSON.parse(d.s.split('"me"').join('"@lead"').split(`"${this.myId}"`).join('"me"'));
    } catch {
      return;
    }
    // (Only a whole room to start from: a new leader's changes mean nothing without it.)
    if (!body.f && (!this.room || this.key < 0)) return;
    if (body.f && (body.k !== this.key || !this.room) && body.map) {
      this.room = new ArenaRoom(1, { map: body.map });
      this.key = body.k;
      this.pred = this.server = null;
    }
    const room = this.room!;
    for (const h of room.heroes) room.prev.set('h:' + h.id, [h.x, h.y]);
    for (const e of room.enemies) room.prev.set('e:' + e.id, [e.x, e.y]);
    for (const s of room.survivors) room.prev.set('s:' + s.id, [s.x, s.y]);
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
    // My hero let go (I was away over a minute): it stays drawn where it was, and I say hello till
    // the leader brings it back (this copy is only drawn; the fight is the leader's).
    const mineNow = room.heroes.find((h) => h.id === 'me');
    this.missing = !mineNow && !!this.mine;
    if (mineNow) this.mine = mineNow;
    else if (this.mine) room.heroes.push(this.mine);
    // (The names came through the same swap: the leader's under '@lead', mine under 'me'.)
    for (const h of room.heroes) h.tag = body.names[h.id] ?? h.tag;
    room.time = body.t;
    room.exitOpen = !!body.x;
    room.indoors = !!body.in;
    this.houses = body.hc ?? [];
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
    // No room yet, or no hero of mine in it (away over a minute, a locked phone): keep saying hello
    // (the leader may still be getting there, or let my hero go and will bring it back).
    if ((!this.room || this.missing) && now - this.helloAt > 2) this.hello();
    // The leader quiet a while, though my own socket answers: connect afresh (the relay says again who
    // leads, maybe from another instance) before anyone thinks of taking the job on. (Seen live: a
    // friend whose socket got there before the leader's claim heard nothing, ever, on the one he had.)
    if (this.quiet(now) > REJOIN && now - this.rejoinAt > REJOIN) (this.rejoinAt = now), this.sock.reconnect();
    if (this.room) (this.room as unknown as { acc: number }).acc = TICK * Math.min(1, (now - this.lastAt) / this.gap);
    this.predict(intent, now - (this.frameAt < 0 ? now : this.frameAt));
    this.frameAt = now;
  }

  private frameAt = -1;
  private rejoinAt = -99;
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

  private follow(id: string): void {
    this.lead = id;
    this.dec = new Decoder();
    this.key = -1;
    this.pred = this.server = null;
    // A new leader: give them their own time before anyone thinks them gone too.
    this.heardLead = this.now;
    this.left = false;
    this.mine = null;
  }

  /** How long the leader has been quiet. */
  quiet(now: number): number {
    if (this.firstAt < 0) this.firstAt = now;
    return now - (this.heardLead > 0 ? this.heardLead : this.firstAt);
  }

  /**
   * Time to take the job on: the leader quiet TAKE seconds, I've a save, and I'm first in line among
   * the friends still in it (by id; the next one waits TAKE_NEXT longer, in case the first is gone too).
   */
  shouldTake(now: number): boolean {
    if (!this.save || !this.room) return false;
    const line = [this.myId, ...this.room.heroes.map((h) => h.id).filter((id) => id !== 'me' && id !== '@lead' && id !== 'squire')].sort();
    return this.quiet(now) > TAKE + line.indexOf(this.myId) * TAKE_NEXT;
  }

  /** The leader has gone quiet too long (or never came): the job is lost. */
  lost(now: number): boolean {
    return this.quiet(now) > LOST + TAKE_NEXT * 3;
  }

  /** The leader's events since last asked (effects and sounds). */
  take(): FightEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  /** Headed home: tell the leader (so my hero leaves the fight now), then go. */
  leave(): void {
    this.sock.send(this.lead, { t: 'bye' });
    const s = this.sock;
    setTimeout(() => s.close(), 1500);
  }

  close(): void {
    this.sock.close();
  }
}

/** The whole room as plain data, to hand the job on (its maps of positions and inputs start fresh). */
export function saveRoom(room: ArenaRoom): Record<string, unknown> {
  return Object.fromEntries(Object.entries(room).filter(([k]) => k !== 'prev' && k !== 'intents' && k !== 'events'));
}

/** A room back from saveRoom: the same goblins, props, chests and dice where they were. */
export function loadRoom(o: Record<string, unknown>): ArenaRoom {
  const room = new ArenaRoom(1, { map: o.map as ArenaRoom['map'] }), r = room as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(o)) {
    if (k === 'map') continue;
    if (r[k] instanceof Rng) Object.assign(r[k] as object, v);
    else r[k] = v;
  }
  return room;
}
