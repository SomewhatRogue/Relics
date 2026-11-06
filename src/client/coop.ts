/**
 * A job with friends: the leader's browser runs the fight (Come Bye's host model), and each friend's
 * browser draws it and sends their input. No codes: the party room comes from the board (parties.ts).
 *
 * - CoopHost (the leader): friends say hello with their hero (their profile); the game puts them in
 *   the room and feeds it their Intents. Each player is in whichever room they walked into (the street
 *   or a house off it: jobrooms.ts), and each friend is sent only theirs: about 12 times a second a
 *   patch of what changed (snap.ts), a full one every few seconds, for anyone new and for anyone who's
 *   just gone through a door, with that room's events for their effects and sounds. The street's
 *   patch says who's indoors, over which door. A friend silent a minute is gone (a phone that lost signal has
 *   that long to come back to the same hero).
 * - CoopGuest (a friend): keeps a copy of the leader's room from the patches and draws it; sends
 *   its Intent when a button changes (from the press itself, input.ts, marked urgent so the relay
 *   doesn't hold it for its next batch), when the stick sets off or stops (at once), when it or the aim
 *   moves (at most 10 times a second: the leader's room runs on the latest, and presses are counted, so
 *   none is lost), and every 2 s regardless. Each carries `vt`, the leader's time its screen is showing
 *   (sim/lagcomp.ts judges a blow on it by that). Its own hero is `me` in its copy, so the rest of the
 *   game can't tell, and it's drawn ahead of the leader's word (ownhero.ts: walking, a dodge, a blow, a
 *   guard). The leader quiet 20 s, and the job ends for it as a loss.
 * - The leader keeps each friend's lag (its room's time less their `vt` as their input comes), and a
 *   press of theirs a tick has used sends their patch at once.
 * - Handing on: every 2 s the leader also sends the whole job (the run and the room, saveRoom).
 *   The leader quiet 9 s, the friend first in line (by id) takes the room over from that and leads
 *   (Game.takeOver); the others hear who leads now and follow them. The old leader, back, follows
 *   them; a leader whose page only reloaded leads again from the job as it kept it (Game.resume).
 * - Out of sight with friends (hidehost.ts), the leader hands the job on at once: the whole job to
 *   everyone, a goodbye naming the friend first in line (who takes it the moment the relay says the
 *   leader's gone), and back in sight it follows them. "The leader" here is whoever hosts the room: the
 *   member with the best link at setting out (shared/hostpick.ts), the party's leader unless beaten.
 */
import type { Job } from '../shared/jobs';
import type { Profile } from '../shared/progress';
import { LAGCOMP, TICK } from '../shared/tuning';
import { Rng } from '../shared/rng';
import type { Hero } from '../sim/types';
import { ArenaRoom } from '../sim/room';
import type { Run } from '../sim/run';
import { NO_INTENT, type FightEvent, type Intent } from '../sim/types';
import { RelaySocket, type RelayMsg } from './relay';
import { Decoder, Encoder, stateOf, type Patch } from './snap';
import { keepJob } from './session';
import { OwedBook } from './owed';
import type { DoorMark } from './jobrooms';
import { BigSend } from './bigsend';
import { isBig, loud, mergeBlocks, quiet } from './interest';
import { expedPlan } from '../shared/expedmap';
import { themeUnder } from '../shared/expedsky';
import type { ExpedState } from '../sim/exped';
import { asGuest } from './asguest';
import { rejoinAfter } from './backoff';
import { Playout } from './playout';
import { OwnHero } from './ownhero';

/** Everyone gets the whole job this often; the friend first in line every SAVE_EVERY. */
const SAVE_ALL = 8;
/** A save due waits at most this long (s) for a frame without a patch. */
const SAVE_WAIT = 0.2;
const AWAY = 5, BYE_WAIT = 2.5, SEND_EVERY = 0.05, FULL_EVERY = 4, GRACE = 60, LOST = 20, KEEP = 2, SAVE_EVERY = 2, TAKE = 9, TAKE_NEXT = 5;
const NO_PLAYOUT = typeof location !== 'undefined' && new URLSearchParams(location.search).get('playout') === '0';
/** A friend's stick and aim go to the leader at most this often (seconds); a button at once. */
const STICK_EVERY = 0.1;
/** An Intent's buttons (everything but the stick, the aim and its moment), to tell a press from a nudge of the stick. */
const buttons = (i: Intent) => JSON.stringify({ ...i, mx: 0, my: 0, ax: 0, ay: 0, vt: 0 });
const r2 = (v: number) => Math.round(v * 100) / 100;
/** The page's clock (s), the one frames are given. */
const clock = () => performance.now() / 1000;
/** The run as a patch carries it: without the heroes' board, which rides whole in the end and the saves (sim/score.ts). */
const lean = (r: Run | null): Run | null => (r?.board ? { ...r, board: undefined } : r);
/** A hero's fields that are their kit (client/keepkit.ts). */
const KIT = ['weapon', 'arms', 'bag', 'armor', 'rings', 'belt', 'glow', 'relics', 'augments', 'found', 'relicItem'];
/** A friend in the leader's room. */
export interface Friend {
  name: string; profile: Profile | null; intent: Intent; heard: number; fresh: boolean; gone: boolean;
  /** Their clock on the newest input used (handed back, so they can time the trip). */
  at?: number;
  /** How far behind this room their screen is when their input gets here (sim/lagcomp.ts): this room's time less their `vt`, smoothed. */
  lag?: number;
  /** A press of theirs came at this tick of their room: once a tick has used it, their patch goes at once. */
  pressTick?: number;
}
/** What the leader's game tells the host to send, and is told by it. */
export interface HostGame {
  /** The leader's own room. */
  room: ArenaRoom;
  run: Run | null;
  /** Counts up as rooms change (a takeover starts past the old leader's). */
  roomKey: number;
  goalText(): string;
  /** The caged and freed in the street's houses, by door (for the way-pointer on friends' screens). */
  houses(): { x: number; y: number; caged: number; waiting: number }[];
  addFriend(id: string, f: Friend): void;
  dropFriend(id: string): void;
  /** The room a player's hero is in. */
  roomOf(id: string): ArenaRoom | undefined;
  /** A room's own number (friends rebuild their copy when theirs changes). */
  keyOf(room: ArenaRoom): number;
  /** Each room's events from the latest step. */
  stepped: Map<ArenaRoom, FightEvent[]>;
  /** Who's indoors, over which door of the street. */
  doorMarks(): DoorMark[];
  /** The street and its houses, to hand the job on. */
  jobSave(): { room: Record<string, unknown>; houses: unknown };
}

export class CoopHost {
  readonly friends = new Map<string, Friend>();
  private sock: RelaySocket;
  /** Each room being sent: its own encoder (patches are against what was last sent of it) and last full. */
  private sending = new Map<ArenaRoom, { enc: Encoder; fullAt: number; said: Record<string, string> }>();
  /** Events since the last send, by room. */
  private evs = new Map<ArenaRoom, FightEvent[]>();
  /** The room each friend was last sent whole (a different one now: they get the whole of it). */
  private sentKey = new Map<string, number>();
  private sentAt = -9;
  private now = 0;
  /** Big rooms (an expedition): each friend their own, near only (bigsend.ts). */
  private big = new BigSend();

  private savedAt = -99;
  private savedAllAt = -99;
  /** What the job owes each of us, kept on the server as it goes (owed.ts). */
  private book: OwedBook;

  constructor(readonly room: string, private myId: string, private myName: string, private game: HostGame, readonly members: [string, string][], want: 'host' | 'take' = 'host') {
    const now = performance.now() / 1000;
    this.book = new OwedBook(room, myId);
    for (const [id, name] of members) if (id !== myId) this.friends.set(id, { name, profile: null, intent: NO_INTENT, heard: now, fresh: true, gone: false });
    this.sock = new RelaySocket(room, myId, want);
    this.sock.onMessage = (m) => this.heard(m);
  }

  /** Taking a job on, and the relay says its leader is still there after all: follow them again. */
  onRefused: (lead: string) => void = () => {};

  /** Online play went off (the month's budget is used up): the friends are out of reach, so the job goes on here, alone. */
  cutOff(): void {
    for (const [id, f] of this.friends) if (!f.gone) (f.gone = true), this.game.dropFriend(id);
  }

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
    } else if (d.t === 'in' && d.i && typeof d.i === 'object') {
      const i: Intent = { ...NO_INTENT, ...d.i }, r = this.game.roomOf(m.from) ?? this.game.room;
      // Their lag: this room's time now less the time their screen was showing as they sent it.
      const lag = typeof i.vt === 'number' ? r.time - i.vt : NaN;
      if (lag >= 0 && lag < LAGCOMP.most) f.lag = f.lag === undefined ? lag : f.lag * 0.8 + lag * 0.2;
      if (buttons(i) !== buttons(f.intent)) f.pressTick = r.tick;
      (f.intent = i), (f.at = typeof (d as { at?: unknown }).at === 'number' ? (d as { at: number }).at : f.at);
    }
  }

  /** Send this room whole next time (its map changed under it: a house set alight with someone inside). */
  fresh(room: ArenaRoom): void {
    this.sending.delete(room);
    this.big.reset(room);
  }

  /** Each frame, after the rooms have run: collect their events; send each friend their room when it's time. */
  frame(now: number): void {
    this.now = now;
    for (const [r, ev] of this.game.stepped) {
      const l = this.evs.get(r) ?? [];
      l.push(...ev);
      if (l.length > 200) l.splice(0, l.length - 200);
      this.evs.set(r, l);
    }
    this.game.stepped = new Map();
    for (const [id, f] of this.friends) if (!f.gone && now - f.heard > GRACE) (f.gone = true), this.game.dropFriend(id);
    this.book.frame(now, this.game.run, this.still());
    // The whole job, now and then, for a friend to take on if this browser goes: every SAVE_EVERY to the
    // friend first in line (the one who'd take it on: CoopGuest.shouldTake's order), everyone every
    // SAVE_ALL. An expedition's is 37 to 80 KB in parts, and every friend getting it every 2 s held their
    // next patch behind it. Never in the same frame as a patch: it waits for a frame without one, and a
    // slow page (a patch every frame) sends it and holds that frame's patch to the next.
    // A friend's press that a tick has used: their patch goes now, not at the next send (it isn't marked
    // urgent, so a split party's relay still batches it: the Redis budget, docs/REALTIME-REDIS-BUDGET.md).
    const used = [...this.friends].filter(([id, f]) => f.pressTick !== undefined && (this.game.roomOf(id) ?? this.game.room).tick > f.pressTick);
    if (now - this.savedAt > SAVE_EVERY && this.company) {
      const patchDue = now - this.sentAt >= SEND_EVERY || used.length > 0;
      if (!patchDue || now - this.savedAt > SAVE_EVERY + SAVE_WAIT) {
        this.savedAt = now;
        const save = this.saved(), all = now - this.savedAllAt > SAVE_ALL;
        if (all) (this.savedAllAt = now), this.sock.send('*', { save });
        else {
          const first = this.firstInLine();
          if (first) this.sock.send(first, { save });
        }
        // (Kept here too, for this page to lead again after a reload.)
        keepJob(save);
        if (patchDue) return;
      }
    }
    if (now - this.sentAt < SEND_EVERY && !used.length) return;
    for (const [, f] of used) f.pressTick = undefined;
    const g = this.game, groups = new Map<ArenaRoom, string[]>();
    // Each friend's own room (one not in any yet, the leader's: they're brought to it).
    for (const [id, f] of this.friends) if (!f.gone) groups.set(g.roomOf(id) ?? g.room, [...(groups.get(g.roomOf(id) ?? g.room) ?? []), id]);
    const names: Record<string, string> = { me: this.myName };
    const acks: Record<string, number> = {};
    for (const [id, f] of this.friends) (names[id] = f.name), f.at !== undefined && (acks[id] = f.at);
    const hc = g.houses(), dm = g.doorMarks(), goal = g.goalText();
    for (const [room, ids] of groups) {
      if (isBig(room)) {
        // A big room: each friend only what's near them, the map from its seed (bigsend.ts).
        const k = g.keyOf(room), out = !room.indoors;
        const common = { k, t: room.time, x: room.exitOpen ? 1 : 0, in: room.indoors ? 1 : 0, hc: out ? hc : [], dm: out ? dm : [], run: lean(g.run), goal, names, acks };
        for (const id of ids) {
          const f = this.friends.get(id)!, m = this.big.body(room, id, now, f.fresh || this.sentKey.get(id) !== k, common, this.evs.get(room) ?? []);
          this.sock.send(id, { s: m.s });
          if (m.full) this.sentKey.set(id, k), (f.fresh = false);
        }
        continue;
      }
      const k = g.keyOf(room), st = this.sending.get(room) ?? { enc: new Encoder(), fullAt: -99, said: {} };
      this.sending.set(room, st);
      const full = now - st.fullAt > FULL_EVERY || ids.some((id) => this.friends.get(id)!.fresh || this.sentKey.get(id) !== k);
      // (Quiet clocks, as a big room's: a goblin's act and its blow go as when they began, interest.ts.)
      const p = st.enc.encode(quiet(stateOf(room), room.time), full), out = !room.indoors;
      // The run, the banner, names and the houses only when they change (or with a whole room), as a
      // big room sends them (bigsend.ts): a friend keeps what it last heard.
      const slow: Record<string, unknown> = {};
      for (const [key, v] of Object.entries({ hc: out ? hc : [], dm: out ? dm : [], run: lean(g.run), goal, names })) {
        const j = JSON.stringify(v);
        if (full || st.said[key] !== j) (slow[key] = v), (st.said[key] = j);
      }
      const body = { p, f: full ? 1 : 0, k, map: full ? { ...room.map, blocks: [] } : undefined, t: room.time, x: room.exitOpen ? 1 : 0, in: room.indoors ? 1 : 0, ...slow, ev: this.evs.get(room) ?? [], acks };
      const s = JSON.stringify(body);
      // Everyone in the one room: one message for them all; else each their own.
      if (groups.size === 1) this.sock.send('*', { s });
      else for (const id of ids) this.sock.send(id, { s });
      if (full) (st.fullAt = now), ids.forEach((id) => (this.sentKey.set(id, k), (this.friends.get(id)!.fresh = false)));
    }
    // A room nobody's in any more starts afresh if anyone goes back.
    for (const r of [...this.sending.keys()]) if (!groups.has(r)) this.sending.delete(r);
    this.evs.clear();
    this.sentAt = now;
  }

  /** The friend first in line to take the job on (the one the save goes to: CoopGuest.shouldTake's order). */
  firstInLine(): string | undefined {
    return [...this.friends.keys()].filter((id) => !this.away(id)).sort()[0];
  }

  /**
   * Leaving the job to the friends still in it: the whole job as it stands, then goodbye. `stay`: this
   * page is only going out of sight (hidehost.ts): the friend first in line takes it on, my hero stays
   * in the job, and back in sight I follow them; the socket closes at once, so the room is free for them
   * now (a phone freezes the page before a timer could close it). Returns who takes it on.
   */
  handOver(stay = false): string | undefined {
    const to = this.firstInLine();
    this.sock.send('*', { save: this.saved() });
    this.sock.send('*', stay ? { bye: 1, stay: 1, to } : { bye: 1 });
    if (stay) this.sock.close();
    else this.close();
    return to;
  }

  /** The whole job as it stands. */
  private saved(): string {
    return jobJson({ run: this.game.run, ...this.game.jobSave(), members: this.members, key: this.game.roomKey });
  }

  /** A friend gone, or not heard from in AWAY seconds (a closed tab, a locked phone): the party won't wait for them. */
  away(id: string): boolean {
    const f = this.friends.get(id);
    return !!f && (f.gone || this.now - f.heard > AWAY);
  }

  /** Everyone still with the job now (me too): what it owes them goes on growing. */
  still(): string[] {
    return [this.myId, ...[...this.friends.keys()].filter((id) => !this.away(id))];
  }

  /** Anyone still with me (not gone). */
  get company(): boolean {
    return [...this.friends.values()].some((f) => !f.gone);
  }

  /** The job is over: tell everyone how it went (their game pays them from the run). */
  end(won: boolean, run: Run): void {
    this.sock.send('*', { end: { won, run } });
    this.book.end(won, run, this.still());
  }

  close(): void {
    // A moment for the last word to go out.
    const s = this.sock;
    setTimeout(() => s.close(), 1500);
  }
}

/** A patch from the leader, as a friend reads it (ids swapped: theirs `@lead`, mine `me`). */
type Body = { p: Patch; f: number; k: number; map?: ArenaRoom['map']; ms?: number; blaze?: ArenaRoom['map']['blaze']; xs?: ExpedState; t: number; x: number; in?: number; hc?: CoopGuest['houses']; dm?: DoorMark[]; run: Run | null; goal: string; ev: FightEvent[]; names: Record<string, string>; acks?: Record<string, number> };

export class CoopGuest {
  room: ArenaRoom | null = null;
  run: Run | null = null;
  goal = '';
  /** The leader's count of the caged and freed in this room's houses. */
  houses: { x: number; y: number; caged: number; waiting: number }[] = [];
  /** Out in the street: who's indoors, over which door. */
  doorMarks: DoorMark[] = [];
  ended: { won: boolean; run: Run } | null = null;
  /** Counts up each time the leader's word changes my kit (so the game needn't compare it every frame). */
  kitSeq = 0;
  /** Told the moment the end is heard (a hidden page only acts on it when it's back: jobbank.ts keeps it meanwhile). */
  onEnd: (e: { won: boolean; run: Run }) => void = () => {};
  private sock: RelaySocket;
  private dec = new Decoder();
  /** A big room: its buildings as the seed made them, and what the leader has said of each since. */
  private base: ArenaRoom['map']['blocks'] | null = null;
  private known = new Map<number, ArenaRoom['map']['blocks'][number]>();
  private key = -1;
  private lastAt = 0;
  private gap = SEND_EVERY;
  private events: FightEvent[] = [];
  private said = '';
  private saidButtons = '';
  private saidMoving = false;
  private stick = '0,0';
  private stickAt = 0;
  private saidAt = -9;
  /** Online play went off (the month's budget is used up): take the job on here, alone, from the last whole job heard. */
  cut = false;
  private names: Record<string, string> = {};
  private helloAt = -9;
  private now = 0;
  private firstAt = -1;
  /** My hero, drawn ahead of the leader's word (ownhero.ts). */
  private own = new OwnHero();
  /** The leader's times on the last two patches applied (what's drawn is between them: `vt`). */
  private prevT = 0;
  private curT = 0;

  /** The newest whole job from the leader (to take it on), and when the leader was last heard. */
  save: string | null = null;
  /** My hero as the leader last had it, and whether their room has let it go. */
  private mine: Hero | null = null;
  private missing = false;
  /** The leader said goodbye (went home): whoever takes it on lets their hero go. */
  left = false;
  /** The leader handed the job to this friend by name (their page went out of sight): they take it first. */
  private named: string | undefined;
  /** The relay said the leader's last connection went (`left`): the room is free to take at once. */
  private leadLeft = false;
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
    // The leader's gone from the room: after a goodbye naming whoever takes it on, they needn't wait.
    if (m.t === 'left' && m.id === this.lead) return void ((this.leadLeft = true), this.named && (this.heardLead = Math.min(this.heardLead, clock() - TAKE)));
    if (m.t !== 'msg' || m.from !== this.lead) return;
    // (The clock now, not the last frame's: a page out of sight draws no frames but still hears, and back
    // in sight it mustn't think the leader quiet all that while and take the job on.)
    const now = clock();
    this.heardLead = now;
    // (Heard: the next time the leader goes quiet, a rejoin starts from the first wait again.)
    if (this.rejoins) (this.rejoins = 0), (this.rejoinWait = -1);
    const d = m.d as { s?: string; end?: { won: boolean; run: Run }; save?: string; bye?: number; stay?: number; to?: unknown };
    // The leader's headed home and left the job to us: as good as gone, so whoever's first takes it
    // on in a moment (once their goodbye has freed the room).
    // (`stay`: their page only went out of sight. They hand it to the friend they name, keep their hero
    // in it, and follow whoever takes it when they're back: hidehost.ts.)
    // (Its socket closes with it, so the relay frees the room at once: whoever's named takes it the moment
    // the relay says they've gone, or BYE_WAIT after the goodbye if that word is slow.)
    if (d.bye) return void ((this.left = !d.stay), (this.named = d.stay && typeof d.to === 'string' ? d.to : undefined), (this.heardLead = now - TAKE + (this.named && this.leadLeft ? 0 : BYE_WAIT)));
    // (The end's run swaps ids like a patch does, so my own tallies are under `me`.)
    if (d.end) return void ((this.ended = asGuest(d.end, this.myId)), this.onEnd(this.ended!));
    if (typeof d.save === 'string') return void (this.save = d.save);
    if (typeof d.s !== 'string') return;
    // The leader's own hero is `me` in their room; in mine, I am. (Ids are quoted whole, so only ids change.)
    let body: Body;
    try {
      body = JSON.parse(d.s.split('"me"').join('"@lead"').split(`"${this.myId}"`).join('"me"'));
    } catch {
      return;
    }
    // Played at the pace the leader made it, not the pace it came (playout.ts): applied in frame().
    // (`?playout=0`: applied as it comes, as before: the lag harness compares the two.)
    if (NO_PLAYOUT) return this.apply(body);
    // (Its events, hits and sounds, don't wait: a blow lands on my screen as soon as it's heard.)
    // (Only for the room I have: a patch of another goes whole, in its turn.)
    // (A dodge or blow of mine already shown here isn't shown again: ownhero.ts.)
    if (body.ev?.length && this.room && body.k === this.key) this.events.push(...this.notMine(body.ev)), (body.ev = []);
    this.playout.push(body, Number(body.t) || 0, body.k, performance.now() / 1000);
  }

  /** A patch from the leader, its turn come: into my copy of their room. */
  private apply(body: Body): void {
    // (Only a whole room to start from: a new leader's changes mean nothing without it.)
    if (!body.f && (!this.room || this.key < 0 || body.k !== this.key)) return;
    if (body.f && (body.k !== this.key || !this.room) && (body.map || (body.ms && body.run))) {
      // A big room's map is built here from the job's seed, never sent (shared/expedmap.ts); its buildings come near only.
      const map = body.map ?? expedPlan(body.run!.job).map;
      this.room = new ArenaRoom(1, { map });
      this.base = body.ms ? map.blocks : null;
      this.known = new Map();
      this.key = body.k;
      this.own.reset();
      this.prevT = this.curT = body.t;
    } else if (body.f && body.map && this.room) this.room.map.blaze = body.map.blaze;
    else if (body.f && body.ms && this.room) this.room.map.blaze = body.blaze;
    if (body.xs && this.room) this.room.exped = body.xs;
    // (The same room whole again: a house set alight from outside with me in it now burns: houseindoors.ts.)
    const room = this.room!;
    for (const h of room.heroes) room.prev.set('h:' + h.id, [h.x, h.y]);
    for (const e of room.enemies) room.prev.set('e:' + e.id, [e.x, e.y]);
    for (const s of room.survivors) room.prev.set('s:' + s.id, [s.x, s.y]);
    // Where the leader has me, when this patch says (my hero's own x, y get my walk between patches).
    const mine = body.p.heroes?.u.find(([k]) => k === 'me')?.[1] as { x?: number; y?: number } | undefined;
    // My kit touched (a whole room, or a patch with my pack, hands or belt in it): my save looks again.
    if (body.f || (mine && KIT.some((f) => f in mine))) this.kitSeq++;
    const s = this.dec.apply(body.p, !!body.f) as unknown as Record<string, unknown[]>;
    const meNow = (s.heroes as Hero[] | undefined)?.find((h) => h.id === 'me');
    // The leader's word on my hero (and the trip, from the newest input of mine it has used): ownhero.ts.
    this.own.patch(mine as Record<string, unknown> | undefined, meNow, !!body.f, body.t, body.acks?.me, this.now);
    const r = room as unknown as Record<string, unknown>;
    for (const [c, list] of Object.entries(s)) if (c === 'blocks') room.map.blocks = this.base ? mergeBlocks(this.base, list as Record<string, unknown>[], this.known) : (list as typeof room.map.blocks);
    else r[c] = list;
    // Quiet clocks: each goblin's act timer, and its blow's, from when they began (interest.ts).
    loud(room.enemies as unknown as Record<string, unknown>[], body.t);
    // My hero let go (I was away over a minute): it stays drawn where it was, and I say hello till
    // the leader brings it back (this copy is only drawn; the fight is the leader's).
    const mineNow = room.heroes.find((h) => h.id === 'me');
    this.missing = !mineNow && !!this.mine;
    if (mineNow) this.mine = mineNow;
    else if (this.mine) room.heroes.push(this.mine);
    // (The names came through the same swap: the leader's under '@lead', mine under 'me'.)
    // A big room's run, banner, names and houses come only when they change (bigsend.ts): keep the last.
    if (body.names) this.names = body.names;
    for (const h of room.heroes) h.tag = this.names[h.id] ?? h.tag;
    room.time = body.t;
    (this.prevT = this.curT), (this.curT = body.t);
    // An expedition's weather as it stands (it may have turned): the same call as the leader's (shared/expedsky.ts).
    if (room.exped?.wx) room.map.theme = themeUnder(room.map.theme, room.exped.wx, room.time);
    room.exitOpen = !!body.x;
    room.indoors = !!body.in;
    if ('hc' in body) this.houses = body.hc ?? [];
    if ('dm' in body) this.doorMarks = body.dm ?? [];
    if ('run' in body) this.run = body.run;
    if ('goal' in body) this.goal = body.goal;
    this.events.push(...this.notMine(body.ev));
    this.gap = Math.min(0.3, Math.max(SEND_EVERY, this.now - this.lastAt));
    this.lastAt = this.now;
  }

  /** Each frame: send my input (when it changes, and now and then), and draw between patches. */
  frame(now: number, intent: Intent): void {
    this.now = now;
    for (const b of this.playout.due(now)) this.apply(b);
    this.send(intent, now);
    // No room yet, or no hero of mine in it (away over a minute, a locked phone): keep saying hello
    // (the leader may still be getting there, or let my hero go and will bring it back).
    if ((!this.room || this.missing) && now - this.helloAt > 2) this.hello();
    // The leader quiet a while, though my own socket answers: connect afresh (the relay says again who
    // leads, maybe from another instance) before anyone thinks of taking the job on. (Seen live: a
    // friend whose socket got there before the leader's claim heard nothing, ever, on the one he had.)
    // Waiting for the first whole room, a leader across the country gets longer (REJOIN.welcome); then
    // each rejoin in a row waits twice as long, jittered (backoff.ts): a relay instance gone deaf was
    // rejoined every 5 s until the job was lost on 2026-11-05.
    if (this.rejoinWait < 0) this.rejoinWait = rejoinAfter(this.rejoins, !!this.room);
    if (this.quiet(now) > this.rejoinWait && now - this.rejoinAt > this.rejoinWait) {
      (this.rejoinAt = now), this.rejoins++, (this.rejoinWait = -1);
      this.sock.reconnect();
    }
    const dt = now - (this.frameAt < 0 ? now : this.frameAt);
    this.frameAt = now;
    const room = this.room;
    if (!room) return;
    const a = this.alpha(now);
    (room as unknown as { acc: number }).acc = TICK * a;
    // One time for everything drawn of the leader's room: the bodies are between its last two patches,
    // and so are the goblins' clocks (a telegraph's fill, a wind-up's pose), not at the newest.
    const vt = this.prevT + (this.curT - this.prevT) * a;
    loud(room.enemies as unknown as Record<string, unknown>[], vt);
    this.own.frame(room, intent, now, dt, a, this.saidAt, this.curT + (now - this.lastAt), this.events, this.stickAt);
  }

  /** How far from the leader's second-last patch to its last the drawing is now (0 to 1). */
  private alpha(now: number): number {
    return Math.min(1, Math.max(0, (now - this.lastAt) / this.gap));
  }

  /** The name of whoever hosts, as their patches say it ('' till then). */
  get leadName(): string {
    return this.names['@lead'] ?? '';
  }

  /** The trip there and back (ownhero.ts times it; the lag scripts read it here). */
  get trip(): number {
    return this.own.trip;
  }

  /** The leader's time my screen is showing now (sent with each input: sim/lagcomp.ts judges by it). */
  viewTime(now: number): number | undefined {
    return this.room ? this.prevT + (this.curT - this.prevT) * this.alpha(now) : undefined;
  }

  /**
   * My input to the leader: a button at once (urgent), the stick and aim a few times a second, and every
   * KEEP s regardless (the leader counts me as still here, and the trip there and back stays timed).
   * Called each frame, and from the press itself (input.ts), so a press never waits for the next frame.
   */
  send(intent: Intent, now: number): void {
    const i = { ...intent, mx: r2(intent.mx), my: r2(intent.my), ax: r2(intent.ax), ay: r2(intent.ay) }, s = JSON.stringify(i), b = buttons(i);
    // (Setting off and stopping go at once too, not at the stick's pace: the leader walks you as long as
    // it thinks the stick is held, and the difference is a pull back on your screen.)
    const press = b !== this.saidButtons, moving = !!(i.mx || i.my), turn = moving !== this.saidMoving, stick = `${i.mx},${i.my}`;
    // (When the stick last changed: my hero walks the old way till then, ownhero.ts.)
    if (stick !== this.stick) (this.stick = stick), (this.stickAt = now);
    if (!press && !turn && !(s !== this.said && now - this.saidAt >= STICK_EVERY) && now - this.saidAt <= KEEP) return;
    this.saidMoving = moving;
    const vt = this.viewTime(now);
    this.sock.send(this.lead, { t: 'in', i: vt === undefined ? i : { ...i, vt: Math.round(vt * 1000) / 1000 }, at: now }, press);
    (this.said = s), (this.saidButtons = b), (this.saidAt = now);
  }

  private frameAt = -1;
  private rejoinAt = -99;
  /** The leader's patches, waiting their turn (playout.ts). */
  private playout = new Playout<Body>();
  /** Rejoins in a row without hearing the leader, and the wait before the next (-1: work it out). */
  private rejoins = 0;
  private rejoinWait = -1;

  /** The leader's events, less those for a dodge or blow of mine already shown here. */
  private notMine(ev: FightEvent[]): FightEvent[] {
    return ev.filter((e) => !this.own.owes(e, this.now));
  }

  private follow(id: string): void {
    this.lead = id;
    this.playout.clear();
    this.dec = new Decoder();
    this.key = -1;
    this.own.reset();
    // A new leader: give them their own time before anyone thinks them gone too.
    this.heardLead = clock();
    this.left = false;
    this.named = undefined;
    this.leadLeft = false;
    this.mine = null;
    // (Their names come with their first whole room: not the old leader's under '@lead' meanwhile.)
    this.names = {};
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
    if (this.cut) return true;
    const line = [this.myId, ...this.room.heroes.map((h) => h.id).filter((id) => id !== 'me' && id !== '@lead' && id !== 'squire')].sort();
    // (Named by a leader handing on: them first, the rest in their order after.)
    const at = this.named ? (this.named === this.myId ? 0 : 1 + line.indexOf(this.myId)) : line.indexOf(this.myId);
    return this.quiet(now) > TAKE + at * TAKE_NEXT;
  }

  /** The leader has gone quiet too long (or never came): the job is lost. */
  lost(now: number): boolean {
    return (this.cut && !this.save) || this.quiet(now) > LOST + TAKE_NEXT * 3;
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

/**
 * The whole room as plain data, to hand the job on (its maps of positions and inputs start fresh). The
 * pack rushes' clocks are Maps, which JSON would empty: they go as lists (a friend taking the job on in a
 * fight used to load `{}` there and stop dead on its first tick: tests/hostpick.test.ts).
 */
export function saveRoom(room: ArenaRoom): Record<string, unknown> {
  const o = Object.fromEntries(Object.entries(room).filter(([k]) => k !== 'prev' && k !== 'intents' && k !== 'events' && k !== 'houseIn'));
  const r = room.rushes;
  if (r) o.rushes = { ...r, fought: [...r.fought], due: [...r.due] };
  return o;
}

/**
 * The whole job as JSON. JSON has no Infinity (a barrel that never fades, a hero down for good), and wrote
 * it as null, so a friend taking a street on found every barrel and oil jar gone a tick later
 * (`now >= null`): it goes as a word, and loadRoom brings it back.
 */
export const jobJson = (v: unknown): string => JSON.stringify(v, (_k, x) => (x === Infinity ? INF : x === -Infinity ? NEG_INF : x));
const INF = '+Inf', NEG_INF = '-Inf';
/** Infinity back where jobJson wrote it as a word (in place). */
function revive(o: unknown): void {
  if (!o || typeof o !== 'object') return;
  const r = o as Record<string, unknown>;
  for (const k of Object.keys(r)) {
    const v = r[k];
    if (v === INF) r[k] = Infinity;
    else if (v === NEG_INF) r[k] = -Infinity;
    else if (v && typeof v === 'object') revive(v);
  }
}

/** The rushes' clocks back as Maps (an old save's emptied `{}` as none). */
const asMap = (v: unknown) => new Map<number, number>(Array.isArray(v) ? (v as [number, number][]) : []);

/** A room back from saveRoom: the same goblins, props, chests and dice where they were. */
export function loadRoom(o: Record<string, unknown>): ArenaRoom {
  revive(o);
  const room = new ArenaRoom(1, { map: o.map as ArenaRoom['map'] }), r = room as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(o)) {
    if (k === 'map') continue;
    if (r[k] instanceof Rng) Object.assign(r[k] as object, v);
    else if (k === 'rushes' && v && typeof v === 'object') {
      const x = v as Record<string, unknown>;
      room.rushes = { ...(x as unknown as ArenaRoom['rushes']), fought: asMap(x.fought), due: asMap(x.due) };
    } else r[k] = v;
  }
  return room;
}
