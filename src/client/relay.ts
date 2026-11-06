/**
 * One WebSocket to the room relay (api/room.ts), kept alive the way Come Bye learned to on real phones
 * (copied from SomewhatRogue/Comearound, src/client/relay.ts): it reconnects by itself, pings every
 * 4 s and reconnects after 10 s of silence (a phone back from the background can hold a dead socket),
 * checks at once when the page comes back on screen, and swaps itself for a fresh connection every
 * 4 minutes, before Vercel ends it at the function's maximum duration.
 *
 * Relic's online play is off unless the page was built for the Vercel site (VITE_ONLINE) or is
 * pointed at a relay (`?relay=ws://...`): the one-file build played from an artifact has no server.
 * One socket per room: a page never holds more than its current connection and, during a swap, the
 * one it replaces; never more than one connection opening at a time; a second RelaySocket for the same
 * room and player closes the first. Retries back off with jitter (backoff.ts). Seen live on 2026-11-05:
 * a friend whose relay instance was deaf rejoined every 5 s, and each rejoin hopped three more times
 * at once, four connections every 5 s, each kept 10 s, until the job was lost (docs/DECISIONS.md).
 *
 * It goes off for the rest of the visit when the relay says the month's Redis budget is used up
 * (`{t:'full'}`, or a close with 4429): every socket closes for good and `onFull` is told, so the
 * game plays on alone, as the one-file build does (docs/DECISIONS.md 2026-11-04).
 */
import { backoff } from './backoff';
import { isPart, Joiner, splitMsg } from './split';

const params = () => new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
/** Online play (a live binding: it turns off when the month's budget is used up). */
export let ONLINE = !!(import.meta.env?.VITE_ONLINE || params().get('relay'));
/** The relay said the month's budget is used up. */
export let FULL = false;
const fullFns: (() => void)[] = [];
const live = new Set<RelaySocket>();
/** Told once, when online play goes off because the month's budget is used up. */
export function onFull(fn: () => void): void {
  fullFns.push(fn);
}
function goFull(): void {
  if (FULL) return;
  FULL = true;
  ONLINE = false;
  for (const s of [...live]) s.close();
  for (const fn of fullFns) fn();
}
/** Test hook: as if the relay had said the budget is used up. */
export const fullForTest = goFull;

export type RelayMsg =
  | { t: 'role'; role: 'host' | 'guest' | 'peer'; host?: string; /** Said on a swapped-in socket (rotate): not a new arrival. */ swap?: boolean; far?: number }
  | { t: 'nohost' }
  | { t: 'hosted' | 'left'; id: string; cn?: string; far?: number }
  | { t: 'msg'; from: string; d: unknown; cn?: string }
  | { t: 'info'; shared: boolean }
  | { t: 'pong' }
  | { t: 'full' };

/**
 * Vercel ends a function's connections at its maximum duration (5 minutes unless raised, and then
 * without the phone always hearing about it), so every socket is swapped for a fresh one well
 * before: the new one opens first, the old one closes the moment the new one talks.
 * `?rotate=ms` overrides it (tests).
 */
const ROTATE_MS = Number(params().get('rotate')) || 4 * 60_000;
/**
 * A friend whose socket landed on another instance than the leader's (`far`, from the relay) connects
 * again, up to HOPS times in each ROTATE_MS, to try to land with them: a party on one instance costs
 * Redis nothing as it plays, a party split over two about one PUBLISH each way a tenth of a second
 * (docs/DECISIONS.md 2026-11-04). One at a time, HOP_MS apart (jittered), swapped like a rotation.
 * A rejoin doesn't give fresh hops (it did: every 5 s rejoin hopped three more times at once).
 */
const HOPS = 3, HOP_MS = 1500;
/** A swap whose new socket hasn't talked in this long: the old one goes anyway (the heartbeat recovers). */
const SWAP_MS = 10_000;
/** Connected this long without trouble: the next failure starts the backoff over. */
const STEADY_MS = 30_000;
/** Every socket alive in this page, by room and player (one each). */
const byRoom = new Map<string, RelaySocket>();

export class RelaySocket {
  onMessage: (m: RelayMsg) => void = () => {};
  /** Lost the connection (it reconnects by itself); `tries` counts failures in a row. */
  onDown: (tries: number) => void = () => {};
  private ws: WebSocket | null = null;
  /** During a swap: the connection being replaced (closed once the new one talks). */
  private old: WebSocket | null = null;
  private closed = false;
  private tries = 0;
  private timer = 0;
  private hopTimer = 0;
  private heardAt = 0;
  private openedAt = 0;
  private beat = 0;
  private rotateTimer = 0;
  private unlisten = () => {};
  private swapping = false;
  private hopsLeft = HOPS;
  private joiner = new Joiner();
  private partSeq = 0;
  /** Connections this socket has opened (tests, the report). */
  opened = 0;
  /**
   * The trip to the relay and back (seconds, smoothed), from the heartbeat's own ping and pong (the
   * pong is answered at the instance: nothing extra sent, no Redis). Who's nearest the relay is the
   * best leader for a party (docs/ONLINE.md, "Who should lead").
   */
  rtt = 0;
  private pingAt = 0;

  constructor(private room: string, private id: string, public want: 'host' | 'take' | 'join' | 'peer') {
    // One socket per room and player in a page: an older one still about is closed.
    const key = `${room}:${id}`;
    byRoom.get(key)?.close();
    // Online play is off (the month's budget is used up): a socket that never opens.
    this.closed = FULL;
    if (!FULL) live.add(this), byRoom.set(key, this), this.open();
    // Heartbeat: a phone back from the background can hold a socket that looks open but is dead.
    // Ping every 4 s; 10 s without hearing anything means reconnect.
    this.beat = window.setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      if (performance.now() - this.heardAt > 10000) return this.reconnect();
      this.pingAt = performance.now();
      this.ws.send('{"ping":1}');
    }, 4000);
    // Back on screen (or back online): check at once rather than waiting for the next beat.
    const check = () => {
      if (document.visibilityState !== 'visible' || this.closed) return;
      // Still opening (a page that just loaded), or waiting to try again: leave it be.
      if (this.ws?.readyState === WebSocket.CONNECTING || (!this.ws && this.timer)) return;
      if (this.ws?.readyState !== WebSocket.OPEN) return this.reconnect();
      const asked = performance.now();
      this.ws.send('{"ping":1}');
      window.setTimeout(() => this.heardAt < asked && !this.closed && this.reconnect(), 2500);
    };
    document.addEventListener('visibilitychange', check);
    addEventListener('online', check);
    addEventListener('pageshow', check);
    this.unlisten = () => {
      document.removeEventListener('visibilitychange', check);
      removeEventListener('online', check);
      removeEventListener('pageshow', check);
    };
  }

  private url(): string {
    const base = new URLSearchParams(location.search).get('relay') ?? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/room`;
    return `${base}?room=${encodeURIComponent(this.room)}&id=${encodeURIComponent(this.id)}&want=${this.want}`;
  }

  private open(): void {
    clearTimeout(this.timer);
    this.timer = 0;
    if (this.closed) return;
    const ws = new WebSocket(this.url());
    this.opened++;
    this.openedAt = performance.now();
    const swap = this.swapping;
    this.swapping = false;
    this.ws = ws;
    clearTimeout(this.rotateTimer);
    this.rotateTimer = window.setTimeout(() => this.rotate(), ROTATE_MS);
    ws.onopen = () => {
      this.heardAt = performance.now();
    };
    ws.onmessage = (e) => {
      // A connection being replaced: still deliver (nothing is lost) until the new one talks.
      if (this.ws !== ws && this.old !== ws) return void ws.close();
      if (this.ws === ws && this.old) this.dropOld();
      this.heardAt = performance.now();
      try {
        let m = JSON.parse(String(e.data)) as RelayMsg;
        if (m.t === 'full') return goFull();
        if (m.t === 'role' && swap) m = { ...m, swap: true };
        // Far from the leader: try again, in a moment, to land with them (this one goes on meanwhile).
        if ((m.t === 'role' || m.t === 'hosted') && m.far && this.ws === ws) this.hopSoon();
        // A message too big for the relay came in parts (split.ts): only the whole of it goes on.
        if (m.t === 'msg' && isPart(m.d)) {
          const d = this.joiner.add(m.from, m.d);
          if (d === undefined) return;
          m = { ...m, d };
        }
        // Told we host: say something at once, since only what a host sends keeps the room its.
        if (m.t === 'role' && m.role === 'host' && ws.readyState === WebSocket.OPEN) ws.send('{"ping":1}');
        if (m.t === 'pong' && this.pingAt) {
          const t = (performance.now() - this.pingAt) / 1000;
          (this.rtt = this.rtt ? this.rtt * 0.7 + t * 0.3 : t), (this.pingAt = 0);
        }
        if (m.t !== 'pong') this.onMessage(m);
      } catch { /* not ours */ }
    };
    ws.onclose = (e) => {
      if (e.code === 4429) return goFull();
      if (this.old === ws) this.old = null;
      if (this.ws !== ws || this.closed) return;
      this.ws = null;
      // (A connection that stayed up a good while: this is a fresh failure, not one in a row.)
      if (performance.now() - this.openedAt > STEADY_MS) this.tries = 0;
      this.tries++;
      this.onDown(this.tries);
      this.later(backoff(this.tries));
    };
  }

  /** Open again after `ms`, unless an open is already waiting (never two at once). */
  private later(ms: number): void {
    if (this.timer || this.closed) return;
    this.timer = window.setTimeout(() => this.open(), ms);
  }

  private dropOld(): void {
    const o = this.old;
    this.old = null;
    if (o && o.readyState <= WebSocket.OPEN) o.close();
  }

  /** A hop to try to land beside the leader: one at a time, a moment apart, HOPS in each rotation. */
  private hopSoon(): void {
    if (this.want !== 'join' || this.hopsLeft <= 0 || this.hopTimer) return;
    this.hopsLeft--;
    this.hopTimer = window.setTimeout(() => ((this.hopTimer = 0), this.rotate(true)), HOP_MS * (0.75 + Math.random() * 0.5));
  }

  /** Swap to a fresh connection before Vercel ends this one (or to hop): open the new one, then drop the old. */
  private rotate(hop = false): void {
    const cur = this.ws;
    if (this.closed || !cur || cur.readyState !== WebSocket.OPEN) return;
    // (One swap at a time: one still waiting for its new socket to talk finishes first.)
    if (this.old) return void (hop || (this.rotateTimer = window.setTimeout(() => this.rotate(), SWAP_MS)));
    // (A swap for its own sake may land anywhere: a fresh set of hops.)
    if (!hop) this.hopsLeft = HOPS;
    this.old = cur;
    this.swapping = true;
    this.open();
    window.setTimeout(() => this.old === cur && this.dropOld(), SWAP_MS);
  }

  /**
   * Reconnect, optionally asking for a different role (taking over a room whose host left). A new role
   * goes at once; otherwise a connection still opening is left to finish, and one opened only a moment
   * ago waits out a backoff first, so a page asked again and again doesn't open socket after socket.
   */
  reconnect(want?: RelaySocket['want']): void {
    if (this.closed) return;
    const changed = !!want && want !== this.want;
    if (want) this.want = want;
    if (!changed && (this.ws?.readyState === WebSocket.CONNECTING || (!this.ws && this.timer))) return;
    const ws = this.ws;
    this.ws = null;
    clearTimeout(this.hopTimer);
    this.hopTimer = 0;
    this.dropOld();
    ws?.close();
    const soon = performance.now() - this.openedAt < 2000;
    if (changed || !soon) return this.open();
    this.later(backoff(++this.tries));
  }

  get open_(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** Connections this socket holds right now (opening or open): never more than 2 (a swap). */
  get count(): number {
    return [this.ws, this.old].filter((w) => w && w.readyState <= WebSocket.OPEN).length;
  }

  /**
   * Send `d` to `to` ('*' everyone); anything over the relay's limit goes in parts (split.ts).
   * `urgent` (a button pressed): the relay sends it on to other instances at once, not in its next batch.
   */
  send(to: string, d: unknown, urgent = false): void {
    const ws = this.ws;
    if (ws?.readyState !== WebSocket.OPEN) return;
    const parts = splitMsg(to, d, ++this.partSeq);
    if (urgent && parts.length === 1) parts[0] = parts[0].slice(0, -1) + ',"u":1}';
    for (const m of parts) ws.send(m);
  }

  close(): void {
    live.delete(this);
    const key = `${this.room}:${this.id}`;
    if (byRoom.get(key) === this) byRoom.delete(key);
    this.closed = true;
    clearTimeout(this.timer);
    clearTimeout(this.hopTimer);
    clearTimeout(this.rotateTimer);
    clearInterval(this.beat);
    this.unlisten();
    this.dropOld();
    this.ws?.close();
    this.ws = null;
  }
}
