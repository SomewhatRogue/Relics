/**
 * The shared world's store: one world per code (the default, `wickhold`, is everyone's; a group can
 * make its own), and its Roll of the Brave. In Redis: the world as one JSON value, changed with an
 * optimistic WATCH (a clash retries), and a sorted set per stat. About a dozen commands per finished
 * run, a few per look at the board: far inside the free plan (docs/REALTIME-REDIS-BUDGET.md).
 * Without Redis it keeps worlds in memory (tests, local dev).
 */
import { CLASS_ORDER } from '../src/shared/weapons.js';
import { STAT_ORDER, type Stats } from '../src/shared/progress.js';
import { CHAPTER_1, newWorld, type WorldState } from '../src/shared/story.js';
import { BOARD_SIZE, contribute, type Board, type Contribution } from '../src/shared/worldsync.js';
import { WORK_ORDER } from '../src/shared/works.js';

export interface WorldView { world: WorldState; board: Board }
export interface WorldStore {
  load(group: string): Promise<WorldView>;
  apply(group: string, c: Contribution): Promise<WorldView>;
}

/** A world's code: lower case letters, digits and dashes; anything else is the shared world. */
export const groupOf = (g: unknown) => (typeof g === 'string' && /^[a-z0-9-]{1,24}$/.test(g) ? g : 'wickhold');

const num = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

/** Only what a real run or a real gift could send gets through (nothing negative, nothing absurd). */
export function clean(raw: unknown): Contribution | null {
  const c = raw as Record<string, unknown> | null, h = c?.hero as Record<string, unknown> | undefined;
  if (!c || !h || typeof h.id !== 'string' || !/^h[a-z0-9]{6,24}$/.test(h.id)) return null;
  const cls = CLASS_ORDER.find((k) => k === h.cls);
  if (!cls) return null;
  const name = String(h.name ?? 'HERO').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 12) || 'HERO';
  const s = (c.stats ?? {}) as Record<string, unknown>, w = (c.works ?? {}) as Record<string, unknown>;
  const cap: Stats = { jobs: 1, saved: 16, kills: 300, given: 5000, dens: 8 };
  const out: Contribution = { hero: { id: h.id, name, cls }, stats: {}, works: {} };
  for (const k of STAT_ORDER) if (s[k] !== undefined) out.stats![k] = num(s[k], cap[k]);
  for (const k of WORK_ORDER) if (w[k] !== undefined) out.works![k] = num(w[k], 5000);
  out.rescued = num(c.rescued, 16);
  out.dens = num(c.dens, 8);
  out.lantern = num(c.lantern, 5000);
  out.days = num(c.days, 1);
  if (c.story === CHAPTER_1.mission.id) out.story = c.story;
  if (CHAPTER_1.decision.choices.some((x) => x.id === c.vote)) out.vote = c.vote as string;
  return out;
}

const emptyBoard = (): Board => Object.fromEntries(STAT_ORDER.map((k) => [k, []])) as unknown as Board;

export function memoryWorldStore(): WorldStore {
  const worlds = new Map<string, WorldState>(), stats = new Map<string, Map<string, { name: string; cls: Contribution['hero']['cls']; s: Stats }>>();
  const board = (g: string): Board => {
    const b = emptyBoard(), m = stats.get(g);
    if (m) for (const k of STAT_ORDER)
      b[k] = [...m.entries()].filter(([, v]) => v.s[k] > 0).map(([id, v]) => ({ id, name: v.name, cls: v.cls, n: v.s[k] })).sort((a, z) => z.n - a.n).slice(0, BOARD_SIZE);
    return b;
  };
  const view = (g: string) => ({ world: structuredClone(worlds.get(g) ?? newWorld()), board: board(g) });
  return {
    async load(g) {
      return view(g);
    },
    async apply(g, c) {
      const w = worlds.get(g) ?? newWorld();
      contribute(w, c);
      worlds.set(g, w);
      const m = stats.get(g) ?? new Map();
      stats.set(g, m);
      const line = m.get(c.hero.id) ?? { name: c.hero.name, cls: c.hero.cls, s: { jobs: 0, saved: 0, kills: 0, given: 0, dens: 0 } };
      line.name = c.hero.name;
      for (const k of STAT_ORDER) line.s[k] += c.stats?.[k] ?? 0;
      m.set(c.hero.id, line);
      return view(g);
    },
  };
}

export async function redisWorldStore(url: string): Promise<WorldStore> {
  const { createClient } = await import('redis');
  const r = createClient({ url });
  r.on('error', (e) => console.log(JSON.stringify({ world: 1, ev: 'err', msg: String(e?.message ?? e) })));
  await r.connect();
  const wk = (g: string) => `rl:world:${g}`, bk = (g: string, k: string) => `rl:b:${g}:${k}`, nk = (g: string) => `rl:n:${g}`;
  const read = (raw: string | null): WorldState => ({ ...newWorld(), ...(raw ? JSON.parse(raw) : {}) });
  async function board(g: string): Promise<Board> {
    const b = emptyBoard(), lists = await Promise.all(STAT_ORDER.map((k) => r.zRangeWithScores(bk(g, k), 0, BOARD_SIZE - 1, { REV: true })));
    const ids = [...new Set(lists.flat().map((x) => x.value))], names = ids.length ? await r.hmGet(nk(g), ids) : [];
    const who = new Map(ids.map((id, i) => [id, JSON.parse(names[i] ?? '{"name":"HERO","cls":"WARRIOR"}')]));
    STAT_ORDER.forEach((k, i) => (b[k] = lists[i].map((x) => ({ id: x.value, n: x.score, ...who.get(x.value) }))));
    return b;
  }
  return {
    async load(g) {
      const [raw, b] = await Promise.all([r.get(wk(g)), board(g)]);
      return { world: read(raw), board: b };
    },
    async apply(g, c) {
      let world = newWorld();
      for (let tries = 0; tries < 5; tries++) {
        try {
          world = await r.executeIsolated(async (iso) => {
            await iso.watch(wk(g));
            const w = read(await iso.get(wk(g)));
            contribute(w, c);
            await iso.multi().set(wk(g), JSON.stringify(w)).exec();
            return w;
          });
          break;
        } catch (e) {
          if (tries === 4) throw e;
        }
      }
      const m = r.multi().hSet(nk(g), c.hero.id, JSON.stringify({ name: c.hero.name, cls: c.hero.cls }));
      for (const k of STAT_ORDER) if (c.stats?.[k]) m.zIncrBy(bk(g, k), c.stats[k]!, c.hero.id);
      await m.exec();
      return { world, board: await board(g) };
    },
  };
}
