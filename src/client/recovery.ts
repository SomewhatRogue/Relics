/**
 * This browser's heroes, kept on the server under a recovery code (api/save.ts) once one is made, so
 * they can be brought to another phone or computer. The code and its token live in localStorage.
 * After a change the save goes up 20 s after the last one (sooner if changes keep coming, and at once
 * when the page is hidden); on start, a copy someone else sent since is taken in place of this one.
 * Nothing waits on the network and nothing fails out loud. Off in the one-file build, which has no
 * server (vite.solo.config.ts sets VITE_SOLO).
 */
import { keyOf, parseCode, showCode } from '../shared/recovery';
import { fromJson, onStore, type Save } from './save';

export const RECOVERY = !import.meta.env?.VITE_SOLO;
const KEY = 'relic.recovery', API = '/api/save', QUIET = 20_000, LONGEST = 120_000, TIMEOUT = 8000;
/** A keepalive request (sent as the page goes) may carry at most 64 KB. */
const KEEPALIVE_MAX = 60_000;

/** This browser's code: its token, the server's time on the copy last seen, and unsent changes. */
interface Mine { code: string; token: string; synced: number; dirty: boolean }
export interface Found { code: string; save: Save; token: string; savedAt: number }

function read(): Mine | null {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return m && parseCode(m.code) && typeof m.token === 'string' ? { synced: 0, dirty: false, ...m } : null;
  } catch {
    return null;
  }
}

async function call(url: string, init?: RequestInit): Promise<{ status: number; body: Record<string, unknown> } | null> {
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT);
    const r = await fetch(url, { ...init, signal: ctl.signal });
    clearTimeout(t);
    if (!(r.headers.get('content-type') ?? '').includes('json')) return null;
    return { status: r.status, body: await r.json() };
  } catch {
    return null;
  }
}

export class Recovery {
  private mine = read();
  private since = 0;
  private timer = 0;
  private changes = 0;
  /** Told a newer copy came in from elsewhere: this page stops writing (the next start sorts it out). */
  private stopped = false;
  private adopting = false;

  constructor(private save: () => Save) {
    if (!RECOVERY) return;
    onStore(() => this.changed());
    addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && this.flush());
  }

  /** This browser's code as shown (KILN FERN 47), or null. */
  get code(): string | null {
    const c = this.mine && parseCode(this.mine.code);
    return c ? showCode(c) : null;
  }

  /** On start: take the server's copy if another device sent one since (newest wins if both changed). */
  async start(adopt: (s: Save) => boolean): Promise<void> {
    const m = this.mine;
    if (!RECOVERY || !m) return;
    const got = await this.pull(m.code);
    if (got === null) return;
    // Gone from the server: send it up again under the same code.
    if (got === 'none') return void ((m.synced = 0), this.mark());
    if (got.savedAt > m.synced && (!m.dirty || got.savedAt > (this.save().savedAt ?? 0))) {
      // Theirs is the one. Not taken (already playing): this page won't write over it either.
      if (this.take(got, adopt)) (m.synced = got.savedAt), this.write();
      return;
    }
    m.synced = got.savedAt;
    this.write();
    if (m.dirty) this.changed();
  }

  /** A code for this browser's heroes (made on the server the first time). */
  async make(): Promise<string | null> {
    if (this.mine) return this.code;
    const r = await call(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ save: this.save() }) });
    const b = r?.status === 200 ? r.body : null;
    if (!b || typeof b.code !== 'string' || typeof b.token !== 'string') return null;
    this.mine = { code: b.code, token: b.token, synced: Number(b.savedAt) || 0, dirty: false };
    this.write();
    return this.code;
  }

  /** What's kept under a typed code: 'bad' (not a code), 'none', null (out of reach), or the save. */
  async look(text: string): Promise<Found | 'bad' | 'none' | null> {
    const c = parseCode(text);
    return c ? this.pull(keyOf(c)) : 'bad';
  }

  /** Is this typed code this browser's own? */
  isMine(f: Found): boolean {
    return f.code === this.mine?.code;
  }

  /** Bring a found save here: it replaces this browser's heroes, and its code becomes this one's. */
  use(f: Found, adopt: (s: Save) => boolean): void {
    this.mine = { code: f.code, token: f.token, synced: f.savedAt, dirty: false };
    this.stopped = false;
    clearTimeout(this.timer);
    this.write();
    this.take(f, adopt);
  }

  private take(f: Found, adopt: (s: Save) => boolean): boolean {
    this.adopting = true;
    try {
      const ok = adopt(f.save);
      if (ok && this.mine) (this.mine.dirty = false), this.write();
      return ok;
    } finally {
      this.adopting = false;
    }
  }

  private async pull(code: string): Promise<Found | 'none' | null> {
    const r = await call(`${API}?code=${encodeURIComponent(code)}`);
    if (r?.status === 404) return 'none';
    const b = r?.status === 200 ? r.body : null, save = b && fromJson(b.save as Save);
    if (!b || !save || typeof b.code !== 'string' || typeof b.token !== 'string') return null;
    return { code: b.code, save: { ...save, savedAt: Number(b.savedAt) || 0 }, token: b.token, savedAt: Number(b.savedAt) || 0 };
  }

  /** The save changed: send it once things settle. */
  private changed(): void {
    if (!this.mine || this.adopting || this.stopped) return;
    this.mark();
  }

  private mark(): void {
    const m = this.mine!, now = Date.now();
    this.changes++;
    if (!m.dirty) (m.dirty = true), this.write();
    this.since ||= now;
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.push(false), Math.max(0, Math.min(QUIET, this.since + LONGEST - now)));
  }

  private flush(): void {
    if (this.mine?.dirty && !this.stopped) void this.push(true);
  }

  private async push(going: boolean): Promise<void> {
    const m = this.mine;
    if (!m || this.stopped) return;
    clearTimeout(this.timer);
    const seen = this.changes, body = JSON.stringify({ code: m.code, token: m.token, base: m.synced, save: this.save() });
    const r = await call(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: going && body.length < KEEPALIVE_MAX });
    if (r?.status === 409 || r?.status === 403) return void (this.stopped = true);
    if (r?.status !== 200) return;
    m.synced = Number(r.body.savedAt) || m.synced;
    if (seen === this.changes) (m.dirty = false), (this.since = 0);
    this.write();
  }

  private write(): void {
    try {
      if (this.mine) localStorage.setItem(KEY, JSON.stringify(this.mine));
    } catch {
      /* this session only */
    }
  }
}
