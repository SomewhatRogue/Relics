/**
 * A test map for measuring one big open raid (`?bigmap=1`, and scripts/bigmap/ in Node): 8 by 6 chunks
 * of 12 tiles (96 by 72, about ten of today's 28 by 24 rooms), mostly open ground with farms, camps,
 * ridges and ruins grown from shared/bigchunks.ts. One seed gives the same map and the same goblins.
 * Not a real job yet: no exit, no goal, no doors.
 */
import type { GameMap } from './arena.js';
import { CHUNK, DRAW, chunk, type Bits, type ChunkKind } from './bigchunks.js';
import { Rng } from './rng.js';
import type { Foe } from './terrain.js';

export const BIG = { cols: 8, rows: 6 };
const W = BIG.cols * CHUNK, H = BIG.rows * CHUNK;
/** How often each kind of chunk comes up (the spawn chunk is always open). */
const MIX: [ChunkKind, number][] = [['open', 5], ['grove', 2], ['farm', 2], ['camp', 2], ['ridge', 1], ['ruin', 1]];
/** Where the party comes in: the middle of the bottom row. */
const SPAWN = { c: BIG.cols / 2, r: BIG.rows - 1 };

export interface BigPlan { map: GameMap; kinds: ChunkKind[]; foes: Foe[] }

function pick(rng: Rng): ChunkKind {
  let r = rng.next() * MIX.reduce((s, m) => s + m[1], 0);
  for (const [k, w] of MIX) if ((r -= w) < 0) return k;
  return 'open';
}

/** The map and `n` goblins on it, from `seed`. */
export function bigPlan(seed: number, n: number): BigPlan {
  const rng = new Rng(seed * 92821 + 7), b: Bits = { rounds: [], blocks: [], braziers: [], soil: [] }, kinds: ChunkKind[] = [];
  for (let r = 0; r < BIG.rows; r++) for (let c = 0; c < BIG.cols; c++) {
    const k = c === SPAWN.c && r === SPAWN.r ? 'open' : pick(rng);
    kinds.push(k);
    chunk(k, rng, c * CHUNK, r * CHUNK, b);
  }
  const hero = { x: SPAWN.c * CHUNK + CHUNK / 2, y: SPAWN.r * CHUNK + CHUNK - 2 };
  const map: GameMap = {
    name: 'THE BIG FIELD', w: W, h: H, wallFace: 3, rounds: b.rounds, blocks: b.blocks, braziers: b.braziers, torches: [], hero, exit: null, soil: b.soil,
    theme: { floor: 'grass', back: 'trees', ambient: [0.22, 0.23, 0.3], moon: 0.55 },
  };
  return { map, kinds, foes: bigFoes(new Rng(seed * 31 + 5), map, kinds, n) };
}

/** `n` goblins spread over the chunks by how much each draws (camps most), none in the spawn chunk. */
function bigFoes(rng: Rng, map: GameMap, kinds: ChunkKind[], n: number): Foe[] {
  const weight = kinds.map((k, i) => (i === SPAWN.r * BIG.cols + SPAWN.c ? 0 : DRAW[k])), total = weight.reduce((s, w) => s + w, 0), out: Foe[] = [];
  const clear = (x: number, y: number) =>
    map.blocks.every((q) => x < q.x - 0.6 || x > q.x + q.w + 0.6 || y < q.y - 0.6 || y > q.y + q.h + 0.6) &&
    [...map.rounds, ...map.braziers].every((q) => Math.hypot(q.x - x, q.y - y) > q.r + 0.6) && out.every((f) => Math.hypot(f.x - x, f.y - y) > 0.8);
  for (let i = 0; i < n; i++) {
    let r = rng.next() * total, ci = 0;
    while ((r -= weight[ci]) >= 0 && ci < weight.length - 1) ci++;
    const ox = (ci % BIG.cols) * CHUNK, oy = Math.floor(ci / BIG.cols) * CHUNK;
    let x = ox + CHUNK / 2, y = oy + CHUNK / 2;
    for (let t = 0; t < 30; t++) {
      (x = ox + rng.range(1, CHUNK - 1)), (y = oy + rng.range(1, CHUNK - 1));
      if (clear(x, y)) break;
    }
    const roll = rng.next();
    if (roll < 0.04) out.push({ kind: 'butcher', x, y });
    else if (roll < 0.06 && kinds[ci] === 'camp') out.push({ kind: 'scrapper', x, y, variant: 'drummer' });
    else out.push({ kind: 'scrapper', x, y, bow: roll > 0.88 || undefined });
  }
  return out;
}
