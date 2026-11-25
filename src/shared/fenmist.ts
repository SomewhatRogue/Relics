/**
 * Mist over the fen (numbers: shared/fentune.ts MIST). A few banks, each with a home over the reeds, the
 * mere's edge or the cuts, drifting slowly about it and thickening and thinning, all from the map's seed
 * and the room's clock, so every screen has them in the same place at the same moment and nothing is sent.
 *
 * As a rule (sim/enemies.ts): standing in it, a goblin notices you from less far and an archer reaches you
 * from less far. As a look (client/fenmistdraw.ts, light.ts, three/post.ts): the ground and bodies under it
 * go pale; the glowing layer (telegraphs, eyes, fire) is never under it, and your own hero's ground stays clear.
 */
import type { GameMap } from './arena.js';
import { MIST } from './fentune.js';
import { Rng } from './rng.js';

/** A bank as laid: its home, size, and its own phases. */
export interface Bank { x: number; y: number; r: number; a: number; b: number; pa: number; pb: number; ph: number; s?: number }
/** Where the banks lie by default: over the reeds, the carr's edge by the river, the fire's rise, the cuts. */
const HOMES: [number, number][] = [[30, 27], [41, 24.5], [25, 21], [45, 30], [35, 17], [53, 10], [64, 8], [18, 39], [38, 41]];

/** Banks laid at homes `[x, y, strength?]` by a seed's stream (strength 1 by default; under 1 is thin mist). */
function lay(rng: Rng, homes: [number, number, number?][], grow = 1): Bank[] {
  return homes.map(([x, y, s]) => ({
    x: x + rng.range(-1.5, 1.5), y: y + rng.range(-1, 1), r: rng.range(MIST.r[0], MIST.r[1]) * grow,
    a: rng.range(0, Math.PI * 2), b: rng.range(0, Math.PI * 2), pa: rng.range(MIST.period[0], MIST.period[1]), pb: rng.range(MIST.breathe[0], MIST.breathe[1]), ph: rng.next(),
    ...(s === undefined ? {} : { s }),
  }));
}

/** The banks for a map's seed. */
export const layBanks = (seed: number): Bank[] => lay(new Rng(seed * 613 + 7), HOMES.slice(0, MIST.banks));

/** THE FEN's homes (shared/fenroam.ts): round the drowned chapel, over the wide reeds, thin over the causeways. */
const FEN_HOMES: [number, number, number?][] = [[28.5, 36], [42, 30], [66, 42], [21, 60], [39, 67.5], [69, 63], [33, 99, 0.55], [54, 117, 0.5]];
/** The banks for THE FEN's seed (own stream, so Fenmere's stay as they were): half again as wide as Fenmere's, as the
 * map grew, and no more of them (the drawer shows at most MIST_MAX, client/fenmistdraw.ts). */
export const layFenBanks = (seed: number): Bank[] => lay(new Rng(seed * 719 + 13), FEN_HOMES, 1.5);

/** The banks a map carries: Fenmere's, or a land's own. */
export const banksOf = (m: Pick<GameMap, 'fen' | 'mist'>): Bank[] | undefined => m.fen?.mist ?? m.mist;

/** A bank at room time `t`: where its middle is, how wide, and how thick (0 to MIST.thick). */
export function bankAt(b: Bank, t: number): { x: number; y: number; r: number; k: number } {
  const u = (t / b.pa) * Math.PI * 2 + b.a, v = (t / b.pb) * Math.PI * 2 + b.b;
  return { x: b.x + Math.cos(u) * MIST.drift, y: b.y + Math.sin(u * 2) * MIST.drift * 0.4, r: b.r * (0.85 + 0.15 * Math.sin(v * 0.5)), k: MIST.thick * (b.s ?? 1) * (0.55 + 0.45 * Math.sin(v + b.ph * 6)) };
}

/** How thick the mist lies at (x, y) at room time `t` (0 to 1): the thickest bank there. */
export function mistAt(m: Pick<GameMap, 'fen' | 'mist'>, x: number, y: number, t: number): number {
  const banks = banksOf(m);
  if (!banks) return 0;
  let best = 0;
  for (const b of banks) {
    const q = bankAt(b, t), dx = (x - q.x) / q.r, dy = (y - q.y) / (q.r * MIST.squash), d = dx * dx + dy * dy;
    if (d < 1) best = Math.max(best, q.k * Math.min(1, (1 - d) * 2));
  }
  return best;
}

/** How far a goblin notices you standing at (x, y), as a share (1 out of the mist). */
export const mistSight = (m: Pick<GameMap, 'fen' | 'mist'>, x: number, y: number, t: number) => 1 - MIST.sight * mistAt(m, x, y, t);
/** How far an archer reaches you there, as a share. */
export const mistReach = (m: Pick<GameMap, 'fen' | 'mist'>, x: number, y: number, t: number) => 1 - MIST.reach * mistAt(m, x, y, t);
