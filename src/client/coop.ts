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
import { TICK } from '../shared/tuning';
import { ArenaRoom } from '../sim/room';
import type { Run } from '../sim/run';
import { NO_INTENT, type FightEvent, type Intent } from '../sim/types';
import { RelaySocket, type RelayMsg } from './relay';
import { Decoder, Encoder, stateOf, type Patch } from './snap';

const SEND_EVERY = 0.08, FULL_EVERY = 4, GRACE = 60, LOST = 20, KEEP = 2;
/** A friend in the leader's room. */
export interface Friend { name: string; profile: Profile | null; intent: Intent; heard: number; fresh: boolean; gone: boolean }
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
    } else if (d.t === 'in' && d.i && typeof d.i === 'object') f.intent = { ...NO_INTENT, ...d.i };
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
    for (const [id, f] of this.friends) names[id] = f.name;
    const body = { p, f: full ? 1 : 0, k: g.roomKey, map: full ? { ...room.map, blocks: [] } : undefined, t: room.time, x: room.exitOpen ? 1 : 0, run: g.run, goal: g.goalText(), ev: this.evs, names };
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
    let body: { p: Patch; f: number; k: number; map?: ArenaRoom['map']; t: number; x: number; run: Run | null; goal: string; ev: FightEvent[]; names: Record<string, string> };
    try {
      body = JSON.parse(d.s.split('"me"').join('"@lead"').split(`"${this.myId}"`).join('"me"'));
    } catch {
      return;
    }
    if (!body.f && !this.room) return;
    if (body.f && (body.k !== this.key || !this.room) && body.map) {
      this.room = new ArenaRoom(1, { map: body.map });
      this.key = body.k;
    }
    const room = this.room!;
    for (const h of room.heroes) room.prev.set('h:' + h.id, [h.x, h.y]);
    for (const e of room.enemies) room.prev.set('e:' + e.id, [e.x, e.y]);
    const s = this.dec.apply(body.p, !!body.f) as unknown as Record<string, unknown[]>;
    const r = room as unknown as Record<string, unknown>;
    for (const [c, list] of Object.entries(s)) if (c === 'blocks') room.map.blocks = list as typeof room.map.blocks;
    else r[c] = list;
    // (The names came through the same swap: the leader's under '@lead', mine under 'me'.)
    for (const h of room.heroes) h.tag = body.names[h.id] ?? h.tag;
    room.time = body.t;
    room.exitOpen = !!body.x;
    this.run = body.run;
    this.goal = body.goal;
    this.events.push(...body.ev);
    this.gap = Math.min(0.3, Math.max(SEND_EVERY, this.now - this.lastAt));
    this.lastAt = this.now;
  }

  /** Each frame: send my input (when it changes, and now and then), and draw between patches. */
  frame(now: number, intent: Intent): void {
    this.now = now;
    const s = JSON.stringify(intent);
    if (s !== this.said || now - this.saidAt > KEEP) (this.sock.send(this.lead, { t: 'in', i: intent }), (this.said = s), (this.saidAt = now));
    // No room yet: keep saying hello (the leader may still be getting there).
    if (!this.room && now - this.helloAt > 2) this.hello();
    if (this.room) (this.room as unknown as { acc: number }).acc = TICK * Math.min(1, (now - this.lastAt) / this.gap);
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
