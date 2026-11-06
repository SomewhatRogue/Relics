/**
 * The shared world's store: one world per code (the default, `wickhold`, is everyone's; a group can
 * make its own), and its Roll of the Brave. In Redis: the world as one JSON value, changed with an
 * optimistic WATCH (a clash retries), a sorted set per stat, and the Roll as it stands kept as one
 * value beside the world. A look is one MGET (world and Roll), and each instance answers looks from
 * what it read in the last LOOK_MS (every player in town looks every minute); a finished run is about
 * two dozen commands. Every command is counted (_meter.ts). Without Redis it keeps worlds in memory
 * (tests, local dev).
 */
import { CLASS_ORDER } from '../src/shared/weapons.js';
import { STAT_ORDER, newStats, type Stats } from '../src/shared/progress.js';
import { CHAPTER_1, newWorld, settle, type WorldState } from '../src/shared/story.js';
import { BOARD_SIZE, contribute, type Board, type Contribution } from '../src/shared/worldsync.js';
import { WORK_ORDER } from '../src/shared/works.js';
import { Meter } from './_meter.js';
import { cleanClaim } from '../src/shared/rangeboard.js';
import { cleanKnifeClaim } from '../src/shared/knifeboard.js';

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
  const cap: Stats = { jobs: 1, saved: 16, kills: 300, given: 5000, dens: 8, butchers: 12, gold: 3000, raised: 30, falls: 30, carried: 30, teamkills: 30, rescueHits: 60, rescueKills: 16 };
  const out: Contribution = { hero: { id: h.id, name, cls }, stats: {}, works: {} };
  for (const k of STAT_ORDER) if (s[k] !== undefined) out.stats![k] = num(s[k], cap[k]);
  for (const k of WORK_ORDER) if (w[k] !== undefined) out.works![k] = num(w[k], 5000);
  out.rescued = num(c.rescued, 16);
  out.dens = num(c.dens, 8);
  out.lantern = num(c.lantern, 5000);
  out.days = num(c.days, 1);
  if (c.story === CHAPTER_1.mission.id) out.story = c.story;
  // A round at the archery range: its arrows, scored again as it's applied (shared/rangeboard.ts).
  const range = cleanClaim(c.range);
  if (range) out.range = range;
  // A round at the Rat's knife board: the moments thrown, played again as it's applied (shared/knifeboard.ts).
  const knives = cleanKnifeClaim(c.knives);
  if (knives) out.knives = knives;
  if (CHAPTER_1.decision.choices.some((x) => x.id === c.vote)) out.vote = c.vote as string;
  if (typeof c.voter === 'string' && /^[\w-]{6,40}$/.test(c.voter)) out.voter = c.voter;
  const d = c.deed as Record<string, unknown> | undefined, words = (v: unknown, n: number) => String(v ?? '').replace(/[^A-Za-z0-9 ',.-]/g, '').slice(0, n);
  if (d && typeof d === 'object' && Array.isArray(d.party))
    out.deed = { title: words(d.title, 60), place: words(d.place, 40), party: d.party.slice(0, 4).map((x) => String(x).toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 12)).filter(Boolean) };
  return out;
}

const emptyBoard = (): Board => Object.fromEntries(STAT_ORDER.map((k) => [k, []])) as unknown as Board;

/** In memory (tests, local dev). `clock`: real time, unless a test moves it. */
export function memoryWorldStore(clock = () => Date.now()): WorldStore {
  const worlds = new Map<string, WorldState>(), stats = new Map<string, Map<string, { name: string; cls: Contribution['hero']['cls']; s: Stats }>>();
  const board = (g: string): Board => {
    const b = emptyBoard(), m = stats.get(g);
    if (m) for (const k of STAT_ORDER)
      b[k] = [...m.entries()].filter(([, v]) => v.s[k] > 0).map(([id, v]) => ({ id, name: v.name, cls: v.cls, n: v.s[k] })).sort((a, z) => z.n - a.n).slice(0, BOARD_SIZE);
    return b;
  };
  // Read lazily settled: a council past its close is decided by whoever looks first (story.ts settle).
  const view = (g: string) => {
    const w = worlds.get(g) ?? newWorld();
    settle(w, clock());
    return { world: structuredClone(w), board: board(g) };
  };
  return {
    async load(g) {
      return view(g);
    },
    async apply(g, c) {
      const w = worlds.get(g) ?? newWorld();
      contribute(w, c, clock());
      worlds.set(g, w);
      const m = stats.get(g) ?? new Map();
      stats.set(g, m);
      const line = m.get(c.hero.id) ?? { name: c.hero.name, cls: c.hero.cls, s: newStats() };
      line.name = c.hero.name;
      for (const k of STAT_ORDER) line.s[k] = (line.s[k] ?? 0) + (c.stats?.[k] ?? 0);
      m.set(c.hero.id, line);
      return view(g);
    },
  };
}

/** How long an instance answers looks at a world from what it last read. */
export const LOOK_MS = 30_000;

export async function redisWorldStore(url: string, meter = new Meter()): Promise<WorldStore> {
  const { createClient } = await import('redis');
  const r = createClient({ url });
  r.on('error', (e) => console.log(JSON.stringify({ world: 1, ev: 'err', msg: String(e?.message ?? e) })));
  await r.connect();
  meter.attach({ incrBy: (k, n) => r.incrBy(k, n), expire: (k, t) => r.expire(k, t) });
  const wk = (g: string) => `rl:world:${g}`, bk = (g: string, k: string) => `rl:b:${g}:${k}`, nk = (g: string) => `rl:n:${g}`, rk = (g: string) => `rl:roll:${g}`;
  const read = (raw: string | null): WorldState => ({ ...newWorld(), ...(raw ? JSON.parse(raw) : {}) });
  const seen = new Map<string, { at: number; raw: string | null; board: Board }>();
  /** The Roll worked out from the sorted sets (14 or 15 commands), and kept as one value (1 more). */
  async function board(g: string): Promise<Board> {
    const b = emptyBoard(), lists = await Promise.all(STAT_ORDER.map((k) => r.zRangeWithScores(bk(g, k), 0, BOARD_SIZE - 1, { REV: true })));
    const ids = [...new Set(lists.flat().map((x) => x.value))], names = ids.length ? await r.hmGet(nk(g), ids) : [];
    meter.add('zrange', STAT_ORDER.length);
    if (ids.length) meter.add('hmget');
    const who = new Map(ids.map((id, i) => [id, JSON.parse(names[i] ?? '{"name":"HERO","cls":"WARRIOR"}')]));
    STAT_ORDER.forEach((k, i) => (b[k] = lists[i].map((x) => ({ id: x.value, n: x.score, ...who.get(x.value) }))));
    meter.add('set');
    await r.set(rk(g), JSON.stringify(b));
    return b;
  }
  return {
    async load(g) {
      let s = seen.get(g);
      if (!s || Date.now() - s.at > LOOK_MS) {
        meter.add('mget');
        const [raw, roll] = await r.mGet([wk(g), rk(g)]);
        seen.set(g, (s = { at: Date.now(), raw, board: roll ? JSON.parse(roll) : await board(g) }));
      }
      // Settled as it's read (not written back: the same ballots give the same result; the next write keeps it).
      const w = read(s.raw);
      settle(w, Date.now());
      return { world: w, board: structuredClone(s.board) };
    },
    async apply(g, c) {
      let world = newWorld();
      for (let tries = 0; tries < 5; tries++) {
        try {
          world = await r.executeIsolated(async (iso) => {
            // WATCH, GET, MULTI, SET, EXEC.
            meter.add('watch'), meter.add('get'), meter.add('multi'), meter.add('set'), meter.add('exec');
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
      // A round at the range or the knife board (nothing for the Roll): the world's write is all (5 commands); the Roll
      // as it was, from what this instance last read (or once from its own key).
      if ((c.range || c.knives) && !STAT_ORDER.some((k) => c.stats?.[k])) {
        let b = seen.get(g)?.board;
        if (!b) {
          meter.add('get');
          const roll = await r.get(rk(g));
          b = roll ? JSON.parse(roll) as Board : await board(g);
        }
        seen.set(g, { at: Date.now(), raw: JSON.stringify(world), board: b });
        return { world, board: structuredClone(b) };
      }
      // (A pipeline, not a transaction: MULTI and EXEC are commands too.)
      const m = r.multi().hSet(nk(g), c.hero.id, JSON.stringify({ name: c.hero.name, cls: c.hero.cls }));
      meter.add('hset');
      for (const k of STAT_ORDER) if (c.stats?.[k]) m.zIncrBy(bk(g, k), c.stats[k]!, c.hero.id), meter.add('zincrby');
      await m.execAsPipeline();
      const b = await board(g);
      seen.set(g, { at: Date.now(), raw: JSON.stringify(world), board: b });
      return { world, board: structuredClone(b) };
    },
  };
}
