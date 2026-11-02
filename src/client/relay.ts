/**
 * One WebSocket to the room relay (api/room.ts), kept alive the way Come Bye learned to on real phones
 * (copied from SomewhatRogue/Comearound, src/client/relay.ts): it reconnects by itself, pings every
 * 4 s and reconnects after 10 s of silence (a phone back from the background can hold a dead socket),
 * checks at once when the page comes back on screen, and swaps itself for a fresh connection every
 * 4 minutes, before Vercel ends it at the function's maximum duration.
 *
 * Relic's online play is off unless the page was built for the Vercel site (VITE_ONLINE) or is
 * pointed at a relay (`?relay=ws://...`): the one-file build played from an artifact has no server.
 */
export const ONLINE = !!(import.meta.env.VITE_ONLINE || new URLSearchParams(location.search).get('relay'));

export type RelayMsg =
  | { t: 'role'; role: 'host' | 'guest' | 'peer'; host?: string }
  | { t: 'nohost' }
  | { t: 'hosted' | 'left'; id: string; cn?: string }
  | { t: 'msg'; from: string; d: unknown; cn?: string }
  | { t: 'info'; shared: boolean }
  | { t: 'pong' };

/**
 * Vercel ends a function's connections at its maximum duration (5 minutes unless raised, and then
 * without the phone always hearing about it), so every socket is swapped for a fresh one well
 * before: the new one opens first, the old one closes once the new one is talking.
 * `?rotate=ms` overrides it (tests).
 */
const ROTATE_MS = Number(new URLSearchParams(location.search).get('rotate')) || 4 * 60_000;

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
    this.open();
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
        const m = JSON.parse(String(e.data)) as RelayMsg;
        // Told we host: say something at once, since only what a host sends keeps the room its.
        if (m.t === 'role' && m.role === 'host' && ws.readyState === WebSocket.OPEN) ws.send('{"ping":1}');
        if (m.t !== 'pong') this.onMessage(m);
      } catch { /* not ours */ }
    };
    ws.onclose = () => {
      if (this.ws !== ws || this.closed) return;
      this.ws = null;
      this.tries++;
      this.onDown(this.tries);
      clearTimeout(this.timer);
      this.timer = window.setTimeout(() => this.open(), Math.min(8000, 400 * 2 ** Math.min(this.tries, 5)));
    };
  }

  private newHeard = false;

  /** Swap to a fresh connection before Vercel ends this one: open the new one, then drop the old. */
  private rotate(): void {
    const old = this.ws;
    if (this.closed || !old || old.readyState !== WebSocket.OPEN) return;
    this.newHeard = false;
    this.open();
    // If the new one never talks, the old one still goes (the heartbeat recovers from there).
    window.setTimeout(() => old.readyState <= WebSocket.OPEN && old.close(), 10000);
  }

  /** Reconnect now, optionally asking for a different role (taking over a room whose host left). */
  reconnect(want?: RelaySocket['want']): void {
    if (want) this.want = want;
    const ws = this.ws;
    this.ws = null;
    ws?.close();
    clearTimeout(this.timer);
    this.open();
  }

  get open_(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send(to: string, d: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ to, d }));
  }

  close(): void {
    this.closed = true;
    clearTimeout(this.timer);
    clearTimeout(this.rotateTimer);
    clearInterval(this.beat);
    this.unlisten();
    this.ws?.close();
    this.ws = null;
  }
}
