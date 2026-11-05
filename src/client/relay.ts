/**
 * One WebSocket to the room relay (api/room.ts), kept alive the way Come Bye learned to on real phones
 * (copied from SomewhatRogue/Comearound, src/client/relay.ts): it reconnects by itself, pings every
 * 4 s and reconnects after 10 s of silence (a phone back from the background can hold a dead socket),
 * checks at once when the page comes back on screen, and swaps itself for a fresh connection every
 * 4 minutes, before Vercel ends it at the function's maximum duration.
 *
 * Relic's online play is off unless the page was built for the Vercel site (VITE_ONLINE) or is
 * pointed at a relay (`?relay=ws://...`): the one-file build played from an artifact has no server.
 * It goes off for the rest of the visit when the relay says the month's Redis budget is used up
 * (`{t:'full'}`, or a close with 4429): every socket closes for good and `onFull` is told, so the
 * game plays on alone, as the one-file build does (docs/DECISIONS.md 2026-11-04).
 */
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
 * before: the new one opens first, the old one closes once the new one is talking.
 * `?rotate=ms` overrides it (tests).
 */
const ROTATE_MS = Number(params().get('rotate')) || 4 * 60_000;
/**
 * A friend whose socket landed on another instance than the leader's (`far`, from the relay) connects
 * again, up to HOPS times, to try to land with them: a party on one instance costs Redis nothing as it
 * plays, a party split over two about one PUBLISH each way a tenth of a second (docs/DECISIONS.md
 * 2026-11-04). Swapped like a rotation: the new socket first, the old one closed once the new one talks.
 */
const HOPS = 3;

export class RelaySocket {
  onMessage: (m: RelayMsg) => void = () => {};
  /** Lost the connection (it reconnects by itself); `tries` counts failures in a row. */
  onDown: (tries: number) => void = () => {};
  private ws: WebSocket | null = null;
  private closed = false;
  private tries = 0;
  private timer = 0;
  private heardAt = 0;
  private beat = 0;
  private rotateTimer = 0;
  private unlisten = () => {};

  constructor(private room: string, private id: string, public want: 'host' | 'take' | 'join' | 'peer') {
    // Online play is off (the month's budget is used up): a socket that never opens.
    this.closed = FULL;
    if (!FULL) live.add(this), this.open();
    // Heartbeat: a phone back from the background can hold a socket that looks open but is dead.
    // Ping every 4 s; 10 s without hearing anything means reconnect.
    this.beat = window.setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      if (performance.now() - this.heardAt > 10000) return this.reconnect();
      this.ws.send('{"ping":1}');
    }, 4000);
    // Back on screen (or back online): check at once rather than waiting for the next beat.
    const check = () => {
      if (document.visibilityState !== 'visible' || this.closed) return;
      // Still opening (a page that just loaded): leave it be.
      if (this.ws?.readyState === WebSocket.CONNECTING) return;
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
    if (this.closed) return;
    const ws = new WebSocket(this.url());
    const swap = this.swapping;
    this.swapping = false;
    this.ws = ws;
    clearTimeout(this.rotateTimer);
    this.rotateTimer = window.setTimeout(() => this.rotate(), ROTATE_MS);
    ws.onopen = () => {
      this.tries = 0;
      this.heardAt = performance.now();
    };
    ws.onmessage = (e) => {
      if (this.ws !== ws) {
        // The old socket during a swap: still deliver (nothing is lost), until the new one talks.
        if (this.ws?.readyState === WebSocket.OPEN && this.newHeard) return void ws.close();
      } else this.newHeard = true;
      this.heardAt = performance.now();
      try {
        let m = JSON.parse(String(e.data)) as RelayMsg;
        if (m.t === 'full') return goFull();
        if (m.t === 'role' && swap) m = { ...m, swap: true };
        // Far from the leader: try again to land with them (what this one says still goes on meanwhile).
        if ((m.t === 'role' || m.t === 'hosted') && m.far && this.ws === ws && this.want === 'join' && this.hopsLeft > 0) this.hopsLeft--, this.rotate(true);
        // A message too big for the relay came in parts (split.ts): only the whole of it goes on.
        if (m.t === 'msg' && isPart(m.d)) {
          const d = this.joiner.add(m.from, m.d);
          if (d === undefined) return;
          m = { ...m, d };
        }
        // Told we host: say something at once, since only what a host sends keeps the room its.
        if (m.t === 'role' && m.role === 'host' && ws.readyState === WebSocket.OPEN) ws.send('{"ping":1}');
        if (m.t !== 'pong') this.onMessage(m);
      } catch { /* not ours */ }
    };
    ws.onclose = (e) => {
      if (e.code === 4429) return goFull();
      if (this.ws !== ws || this.closed) return;
      this.ws = null;
      this.tries++;
      this.onDown(this.tries);
      clearTimeout(this.timer);
      this.timer = window.setTimeout(() => this.open(), Math.min(8000, 400 * 2 ** Math.min(this.tries, 5)));
    };
  }

  private newHeard = false;
  private swapping = false;
  private hopsLeft = HOPS;
  private joiner = new Joiner();
  private partSeq = 0;

  /** Swap to a fresh connection before Vercel ends this one (or to hop): open the new one, then drop the old. */
  private rotate(hop = false): void {
    const old = this.ws;
    if (this.closed || !old || old.readyState !== WebSocket.OPEN) return;
    // (A swap for its own sake may land anywhere: a fresh set of hops.)
    if (!hop) this.hopsLeft = HOPS;
    this.newHeard = false;
    this.swapping = true;
    this.open();
    // If the new one never talks, the old one still goes (the heartbeat recovers from there).
    window.setTimeout(() => old.readyState <= WebSocket.OPEN && old.close(), 10000);
  }

  /** Reconnect now, optionally asking for a different role (taking over a room whose host left). */
  reconnect(want?: RelaySocket['want']): void {
    if (want) this.want = want;
    this.hopsLeft = HOPS;
    const ws = this.ws;
    this.ws = null;
    ws?.close();
    clearTimeout(this.timer);
    this.open();
  }

  get open_(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
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
    this.closed = true;
    clearTimeout(this.timer);
    clearTimeout(this.rotateTimer);
    clearInterval(this.beat);
    this.unlisten();
    this.ws?.close();
    this.ws = null;
  }
}
