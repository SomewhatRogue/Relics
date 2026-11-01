/**
 * The line to the shared world (`/api/world`). Online, everyone in a world (the shared one, or a
 * group's own by code) builds the same town and is on the same Roll of the Brave; your contributions
 * go to the server and its answer is the world you see. Offline (no server, or the page is somewhere
 * the server can't be reached, like the claude.ai preview), the world is this browser's and the Roll
 * shows your own heroes. Either way a contribution changes your town at once.
 */
import { STAT_ORDER, type Profile } from '../shared/progress';
import type { WorldState } from '../shared/story';
import { BOARD_SIZE, type Board, type Contribution } from '../shared/worldsync';

const KEY = 'relic.world', TIMEOUT = 4000;

export class WorldLink {
  online = false;
  board: Board | null = null;
  group = 'wickhold';
  private at = 0;

  constructor(private onWorld: (w: WorldState) => void) {
    try {
      this.group = localStorage.getItem(KEY) || 'wickhold';
    } catch {
      /* the shared world */
    }
  }

  /** Join a world by its code ('' or 'wickhold' for the shared one); returns the code used. */
  join(code: string): string {
    this.group = code.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'wickhold';
    try {
      localStorage.setItem(KEY, this.group);
    } catch {
      /* this session only */
    }
    void this.refresh(true);
    return this.group;
  }

  /** Look at the world (at most every 30 s unless `force`). */
  async refresh(force = false): Promise<void> {
    if (!force && Date.now() - this.at < 30000) return;
    this.at = Date.now();
    const got = await this.call(`/api/world?g=${encodeURIComponent(this.group)}`);
    if (got) this.take(got);
  }

  /** Send a contribution (the town has already changed here). */
  async send(c: Contribution): Promise<void> {
    if (!this.online) return;
    const got = await this.call('/api/world', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ g: this.group, c }) });
    if (got) this.take(got);
  }

  /** The Roll of the Brave offline: your own heroes. */
  static localBoard(heroes: Profile[]): Board {
    return Object.fromEntries(STAT_ORDER.map((k) => [k, heroes.filter((h) => h.stats[k] > 0).map((h) => ({ id: h.id, name: h.name, cls: h.cls, n: h.stats[k] })).sort((a, b) => b.n - a.n).slice(0, BOARD_SIZE)])) as unknown as Board;
  }

  private take(v: { world: WorldState; board: Board }): void {
    this.online = true;
    this.board = v.board;
    this.onWorld(v.world);
  }

  private async call(url: string, init?: RequestInit): Promise<{ world: WorldState; board: Board } | null> {
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT);
      const r = await fetch(url, { ...init, signal: ctl.signal });
      clearTimeout(t);
      if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(String(r.status));
      return await r.json();
    } catch {
      this.online = false;
      return null;
    }
  }
}
