/**
 * The room relay, as Vercel's docs lay out for realtime on Functions: each player holds a WebSocket
 * to a Vercel Function; any instance may hold any player, so instances share rooms through Redis
 * (one pub/sub channel per room for messages, keys for who hosts). Each instance delivers to its
 * own sockets first and publishes with its origin id, skipping its own echoes.
 *
 * The game itself runs in the host's browser (the GameRoom); the relay only routes messages:
 * friends' input to the host, the host's snapshots and events to friends.
 *
 * Player URL: /api/room?room=CODE&id=PLAYER&want=host|take|join|peer
 *   host: made this room (or hosted it on this device); take: was playing in it and its host left;
 *   join: opened someone's code. Only host/take may claim the room; join waits for a host.
 *   peer: a room with no host at all, where everyone just tells everyone (the shared town: each
 *   browser runs Wickhold itself, and only says where its own hero is).
 * To the player: {t:'role', role:'host'} | {t:'role', role:'guest', host, far?} | {t:'role', role:'peer'} | {t:'nohost'} |
 *   {t:'hosted', id, far?} | {t:'left', id} | {t:'msg', from, d} | {t:'info', shared}
 *   (`far: 1`: the host is on another instance)
 *   | {t:'full'} (Redis's plan is used up for the month: the socket closes with 4429; play on alone)
 * From the player: {to: '*' | id, d, u?: 1} (`u`: urgent, a button pressed: what waits for the bus goes now)
 *
 * Redis is metered (_meter.ts, docs/REALTIME-REDIS-BUDGET.md): what goes to other instances is
 * coalesced into one PUBLISH a tenth of a second (_outbox.ts), a host's liveness is one SET every few
 * seconds, and each instance adds its count to the month's key now and then.
 */

import { randomUUID } from 'node:crypto';
import { guarded, type Backend } from './_backends.js';
import { HERE_MS, Presence } from './_presence.js';
import { Outbox, unbatch } from './_outbox.js';
import { MONTH_LIMIT, Meter, isLimit, metered, monthKey, monthUsed } from './_meter.js';
export { memoryBackend, redisBackend, type Backend, type Bus, type Store } from './_backends.js';

/** The bits of a WebSocket the relay uses (the `ws` package's WebSocket fits). */
export interface Sock {
  send(data: string): void;
  close(code?: number): void;
  on(ev: 'message', fn: (data: unknown) => void): void;
  on(ev: 'close' | 'pong', fn: () => void): void;
  readyState: number;
  ping?(): void;
  terminate?(): void;
}

/**
 * The claim itself only needs to outlast its host: liveness is the seen time (STALE_MS), so the claim
 * is refreshed only every CLAIM_MS (one EXPIRE), and lapses HOST_TTL after its host has gone.
 */
const HOST_TTL = 900, CLAIM_MS = 300_000;
/** The seen time's own keeping (it's judged by its value; the TTL only tidies up). */
const SEEN_TTL = 30;
/**
 * A host's seen time is written (one SET) at most every TOUCH of the stale time: 3.5 s of 8. The
 * game's heartbeat is every 4 s, so a host saying nothing else is written on each one, and is never
 * more than about 4 s old when a friend asks; a host gone quiet is stale 8 s on, as before.
 */
export const TOUCH = 7 / 16;
/** Told the plan is used up: refuse players, without trying Redis, this long before trying again. */
export const FULL_MS = 10 * 60_000;
/** How long a new claim holds before its host has said anything. */
const CLAIM_GRACE_MS = 1500;
/** A host that hasn't sent anything this long (a phone frozen in the background) may be replaced. */
export const STALE_MS = 8000;
const ROOM = /^[A-Z0-9]{3,12}$/;
const ID = /^[\w-]{6,64}$/;
const MAX_MSG = 64_000;

type Conn = { sock: Sock; id: string; room: string; host: boolean; touchedAt: number; claimedAt: number; nonce: string; alive: boolean };
/** `cn`: the sender's connection, so a player can tell a stale goodbye (an old connection) from a real one. */
type Envelope = { k: 'msg'; from: string; to: string; d: unknown; o: string; cn: string } | { k: 'hosted' | 'left'; id: string; o: string; cn?: string }
  /** Between instances only (_presence.ts): this instance has players in the room, or no longer. */
  | { k: 'here' | 'away'; o: string }
  /** A batch (_outbox.ts): the envelopes in order. */
  | { k: 'b'; o: string; e: Envelope[] };

const hostKey = (room: string) => `rl:host:${room}`;
const seenKey = (room: string) => `rl:seen:${room}`;
/** The newest connection of a player: a dead old one that closes late mustn't say they left. */
const connKey = (room: string, id: string) => `rl:conn:${room}:${id}`;
const log = (o: Record<string, unknown>) => console.log(JSON.stringify({ relay: 1, ...o }));
/**
 * Work started from a socket event, with nobody awaiting it. Redis can drop its connection (it
 * reconnects by itself); a command in flight then fails, and an uncaught failure would take down
 * the whole instance and every player on it (seen live: "Socket closed unexpectedly", then exit).
 */
const safe = (p: Promise<unknown>, what: string) => void p.catch((e) => log({ ev: 'err', what, msg: String((e as Error)?.message ?? e) }));
const chan = (room: string) => `rl:room:${room}`;

export class Relay {
  private rooms = new Map<string, Set<Conn>>();
  /** Which rooms have players on other instances too, so their messages need the bus. */
  private presence = new Presence();
  /**
   * This instance's name on the bus (its own echoes are skipped by it). Counted out by the store, not
   * drawn from Math.random: Vercel starts instances from one snapshot, so their Math.random runs alike,
   * and two instances both named "evqgzyea" each took the other's messages for its own echo and
   * dropped them (seen live: a friend on one froze, the leader on the other never heard him).
   */
  origin = '';
  private ready: Promise<void>;
  private seq = 0;

  private staleMs: number;
  /** Redis's meter: batches published, the messages in them, and messages kept local, since the last log line. */
  private sent = { pub: 0, msgs: 0, kept: 0 };
  /** Every command this instance sends Redis, counted (and added to the month's key now and then). */
  readonly meter: Meter;
  private b: Backend;
  private outbox: Outbox;
  /** Until when the plan is used up (Upstash refused a command for its limit). */
  private fullUntil = 0;

  constructor(backend: Backend, opts: { staleMs?: number; meter?: Meter; batchMs?: number } = {}) {
    this.staleMs = opts.staleMs ?? STALE_MS;
    const raw = guarded(backend, isLimit, () => this.trip());
    this.meter = opts.meter ?? new Meter(raw.store);
    if (backend.shared) this.meter.start();
    this.b = metered(raw, this.meter);
    this.outbox = new Outbox(() => this.origin, (room, text, n) => this.publish(room, text, n), opts.batchMs === undefined ? undefined : { ms: opts.batchMs, max: 192_000 });
    this.ready = this.b.store.incr('rl:inst').then(
      (n) => void (this.origin = n.toString(36) + randomUUID().slice(0, 4)),
      () => void (this.origin = randomUUID().slice(0, 6) + process.hrtime.bigint().toString(36).slice(-4)),
    );
    // Each room this instance has players in says 'here' when it has said nothing else for a while.
    const beat = setInterval(() => {
      const now = Date.now();
      if (this.full) return;
      for (const room of this.presence.due(now)) safe(this.send(room, { k: 'here', o: this.origin }), 'here');
    }, Math.min(1000, HERE_MS / 4));
    (beat as { unref?: () => void }).unref?.();
    const meter = setInterval(() => {
      if (this.sent.pub || this.sent.kept) log({ ev: 'meter', inst: this.origin, rooms: this.rooms.size, ...this.sent, cmds: this.meter.total });
      this.sent = { pub: 0, msgs: 0, kept: 0 };
    }, 5 * 60_000);
    (meter as { unref?: () => void }).unref?.();
  }

  /** A player's socket arrived. */
  async attach(sock: Sock, url: URL): Promise<void> {
    const room = (url.searchParams.get('room') ?? '').toUpperCase();
    const id = url.searchParams.get('id') ?? '';
    const want = url.searchParams.get('want') ?? 'join';
    if (!ROOM.test(room) || !ID.test(id)) return sock.close(4000);
    // The month's commands are used up: say so (the game plays on alone), and don't try Redis.
    if (this.full) return this.refuse(sock);
    const c: Conn = { sock, id, room, host: false, touchedAt: 0, claimedAt: 0, nonce: '', alive: true };
    // Listening from the first moment: what the player says (or a goodbye) while this is still being
    // set up waits for it, rather than being lost.
    let live = false, closed = false;
    const early: string[] = [];
    sock.on('message', (data) => (live ? safe(this.fromPlayer(c, String(data)), 'message') : early.push(String(data))));
    sock.on('close', () => {
      clearInterval(beat);
      closed = true;
      if (live) safe(this.gone(c), 'gone');
    });
    // A phone can vanish without closing its socket: ping it, and drop it if it stops answering.
    sock.on('pong', () => (c.alive = true));
    const beat = setInterval(() => {
      if (!c.alive) return void (sock.terminate ? sock.terminate() : sock.close());
      c.alive = false;
      try {
        sock.ping?.();
      } catch { /* closing */ }
    }, 15000);
    try {
      await this.ready;
      c.nonce = `${this.origin}.${++this.seq}`;
      await this.b.store.set(connKey(room, id), c.nonce, 3600);
      log({ ev: 'join', room, id: id.slice(0, 8), want, inst: this.origin });
      let set = this.rooms.get(room);
      if (!set) {
        this.rooms.set(room, (set = new Set()));
        this.presence.joined(room, Date.now());
        await this.b.bus.subscribe(chan(room), (raw) => this.fromBus(room, raw));
        // Any other instance with players here answers, and from then on this room's messages reach them.
        safe(this.send(room, { k: 'here', o: this.origin }), 'here');
      }
      set.add(c);
      this.tell(c, { t: 'info', shared: this.b.shared });
      await this.decide(c, want);
    } catch (e) {
      // Over the plan's limit (trip() has told everyone here): this one too, and no error to log.
      if (!this.full) throw e;
      this.refuse(sock);
      return;
    } finally {
      live = true;
      if (closed) safe(this.gone(c), 'gone');
    }
    for (const raw of early.splice(0)) safe(this.fromPlayer(c, raw), 'message');
  }

  /** Is the month's budget used up (as last heard from Redis)? */
  get full(): boolean {
    return Date.now() < this.fullUntil;
  }

  private refuse(sock: Sock): void {
    if (sock.readyState === 1) sock.send('{"t":"full"}');
    sock.close(4429);
  }

  /** Redis said the plan's limit is reached: every player here is told, and plays on alone. */
  private trip(): void {
    if (this.full) return;
    this.fullUntil = Date.now() + FULL_MS;
    log({ ev: 'full', inst: this.origin, cmds: this.meter.total });
    for (const set of this.rooms.values()) for (const c of set) this.refuse(c.sock);
  }

  /** What `/api/room?meter=1` answers: the month's commands so far (one GET), and this instance's own. */
  async meterView(): Promise<Record<string, unknown>> {
    const mine = { total: this.meter.total, pending: this.meter.pending, by: this.meter.by, deliveries: this.meter.deliveries };
    let used: number | null = null;
    if (!this.full) used = await monthUsed((k) => this.b.store.get(k).catch(() => null), this.meter);
    return { month: monthKey().slice(-7), used, limit: MONTH_LIMIT, full: this.full, instance: mine };
  }

  private tell(c: Conn, m: unknown): void {
    if (c.sock.readyState === 1) c.sock.send(JSON.stringify(m));
  }

  /** Host, guest, or wait for a host. */
  private async decide(c: Conn, want: string): Promise<void> {
    const { room, id } = c;
    // Nobody hosts a peer room: no claim, no Redis, nothing to take over when someone goes.
    if (want === 'peer') return this.tell(c, { t: 'role', role: 'peer' });
    let holder = await this.b.store.get(hostKey(room));
    const had = holder === id;
    if (want === 'host' || want === 'take') {
      if (!holder) holder = await this.b.store.setNx(hostKey(room), id, HOST_TTL);
      else if (holder !== id && (await this.stale(room))) {
        await this.b.store.set(hostKey(room), id, HOST_TTL);
        holder = id;
      }
    } else if (holder && holder !== id && (await this.stale(room))) holder = null;
    log({ ev: 'decide', room, id: id.slice(0, 8), want, holder: holder ? holder.slice(0, 8) : null });
    if (holder === id) return this.becomeHost(c, !had);
    // `far`: the host is on another instance, so everything between them crosses Redis; the friend
    // may connect again to try to land with them (relay.ts HOPS).
    if (holder) return this.tell(c, { t: 'role', role: 'guest', host: holder, ...(this.hostHere(room, holder) ? {} : { far: 1 }) });
    this.tell(c, { t: 'nohost' });
  }

  /** Is this player hosting the room from this instance? */
  private hostHere(room: string, id: string): boolean {
    for (const c of this.rooms.get(room) ?? []) if (c.id === id && c.host) return true;
    return false;
  }

  private async stale(room: string): Promise<boolean> {
    const seen = Number(await this.b.store.get(seenKey(room))) || 0;
    return Date.now() - seen > this.staleMs;
  }

  /**
   * `claimed`: the room is newly theirs, so it starts fresh. A host coming back to a room it already
   * holds doesn't refresh it just by connecting: only what it sends proves it's alive. (Seen in the
   * stress test: a crashed page whose timers still ran reconnected every 10 s, never sent a thing,
   * and kept the room from everyone.)
   */
  private async becomeHost(c: Conn, claimed: boolean): Promise<void> {
    c.host = true;
    // A new claim gets a moment's grace (so two friends asking at once don't swap it back and
    // forth), not the full stale time: a live host speaks at once, and its first message refreshes
    // it. Several crashed pages that kept reconnecting each won it for 8 s this way, in turn.
    if (claimed) {
      const grace = Math.min(CLAIM_GRACE_MS, this.staleMs / 2);
      c.claimedAt = Date.now();
      await Promise.all([this.b.store.expire(hostKey(c.room), HOST_TTL), this.b.store.set(seenKey(c.room), String(Date.now() - this.staleMs + grace), SEEN_TTL)]);
    }
    this.tell(c, { t: 'role', role: 'host' });
    await this.send(c.room, { k: 'hosted', id: c.id, o: this.origin, cn: c.nonce });
  }

  /**
   * The host is alive: its last-seen time, one SET at most every TOUCH of the stale time; the claim's
   * own keeping, one EXPIRE every CLAIM_MS.
   */
  private async touch(c: Conn): Promise<void> {
    const now = Date.now();
    if (!c.host || now - c.touchedAt < this.staleMs * TOUCH) return;
    c.touchedAt = now;
    const claim = now - c.claimedAt > CLAIM_MS;
    if (claim) c.claimedAt = now;
    await Promise.all([this.b.store.set(seenKey(c.room), String(now), SEEN_TTL), claim && this.b.store.expire(hostKey(c.room), HOST_TTL)]);
  }

  private async fromPlayer(c: Conn, raw: string): Promise<void> {
    if (raw.length > MAX_MSG) return;
    let m: { to?: unknown; d?: unknown };
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
    c.alive = true;
    // Anything from the host, its heartbeat included, says it's still there. A host alone in its
    // room sends nothing but heartbeats, and must not look gone to the first friend who joins.
    safe(this.touch(c), 'touch');
    // The game's own heartbeat: answered here, never relayed.
    if ((m as { ping?: unknown }).ping) return this.tell(c, { t: 'pong' });
    const to = typeof m.to === 'string' ? m.to : '';
    if (!to) return;
    await this.send(c.room, { k: 'msg', from: c.id, to, d: m.d, o: this.origin, cn: c.nonce }, !!(m as { u?: unknown }).u);
  }

  /**
   * Deliver to this instance's sockets, then tell the other instances (if any are in the room), in the
   * room's next batch (_outbox.ts). Hosts, leaves and the instances' own word go at once, as does an
   * urgent message (`u`: a button pressed), with whatever waited before it.
   */
  private async send(room: string, env: Envelope, urgent = false): Promise<void> {
    this.deliver(room, env);
    const now = Date.now();
    // Hosts, leaves and the instances' own word always go out; messages only when someone elsewhere is here.
    if (env.k === 'msg' && !this.presence.shared(room, now)) return void this.sent.kept++;
    this.presence.sent(room, now, -1);
    await this.outbox.push(room, JSON.stringify(env), urgent || env.k !== 'msg');
  }

  /** One batch onto the room's channel. */
  private async publish(room: string, text: string, n: number): Promise<void> {
    this.sent.pub++;
    this.sent.msgs += n;
    const heard = await this.b.bus.publish(chan(room), text);
    this.presence.sent(room, Date.now(), heard);
  }

  private fromBus(room: string, raw: string): void {
    for (const env of unbatch(raw) as Envelope[]) this.fromOther(room, env);
  }

  private fromOther(room: string, env: Envelope): void {
    if (env.o === this.origin || env.k === 'b') return;
    if (env.k === 'away') return this.presence.away(room, env.o);
    // Someone on another instance: from now on this room's messages go out to them. A newcomer is
    // answered at once, so it knows to send its own players' messages out too.
    if (this.presence.heard(room, env.o, Date.now()) && env.k !== 'left') safe(this.send(room, { k: 'here', o: this.origin }), 'here');
    this.deliver(room, env);
  }

  private deliver(room: string, env: Envelope): void {
    for (const c of this.rooms.get(room) ?? []) {
      if (env.k === 'msg') {
        if (c.id !== env.from && (env.to === '*' || env.to === c.id)) this.tell(c, { t: 'msg', from: env.from, d: env.d, cn: env.cn });
      } else if ((env.k === 'hosted' || env.k === 'left') && c.id !== env.id) {
        this.tell(c, { t: env.k, id: env.id, cn: env.cn, ...(env.k === 'hosted' && env.o !== this.origin ? { far: 1 } : {}) });
        // Someone else hosts now: a host here that was replaced (it was away too long) steps down.
        if (env.k === 'hosted' && c.host) {
          c.host = false;
          this.tell(c, { t: 'role', role: 'guest', host: env.id });
        }
      }
    }
  }

  private async gone(c: Conn): Promise<void> {
    const set = this.rooms.get(c.room);
    set?.delete(c);
    // Only the player's newest connection may say they left (and give up the room).
    // (With the month's budget used up, nobody's told: everyone here is playing alone by now.)
    const newest = !this.full && (await this.b.store.get(connKey(c.room, c.id))) === c.nonce;
    log({ ev: 'gone', room: c.room, id: c.id.slice(0, 8), host: c.host, newest });
    if (newest) {
      await this.b.store.del(connKey(c.room, c.id));
      // A host saying goodbye: the room is free to take at once (it's stale). The claim itself stays,
      // so the same host reconnecting doesn't count as a fresh claim: only its messages win it back.
      // (A crashed page that kept reconnecting re-won the room this way, from a deleted claim.)
      if (c.host && (await this.b.store.get(hostKey(c.room))) === c.id) await this.b.store.del(seenKey(c.room));
      await this.send(c.room, { k: 'left', id: c.id, o: this.origin, cn: c.nonce });
    }
    // (Only if it's still this room's set: one emptied and replaced while this waited isn't.)
    if (set && !set.size && this.rooms.get(c.room) === set) {
      this.rooms.delete(c.room);
      this.presence.left(c.room);
      // What still waited for the bus goes first, then nothing more for this room.
      if (!this.full) await this.outbox.flush(c.room);
      this.outbox.drop(c.room);
      if (this.full) return;
      await this.b.bus.unsubscribe(chan(c.room));
      // The others needn't send this instance anything more.
      await this.b.bus.publish(chan(c.room), JSON.stringify({ k: 'away', o: this.origin }));
    }
  }
}
