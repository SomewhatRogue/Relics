/**
 * The pieces a big map (shared/bigmap.ts) is grown from: square chunks, each laid out by hand-made
 * rules with a little jitter. Everything solid keeps 1.5 tiles off the chunk's edge, so the seams
 * between chunks are always open ground and the whole map can be walked. Test map only: plausible,
 * not final art.
 */
import type { Block, BlockKind, Circle, Round, RoundKind, Soil } from './arena.js';
import type { Rng } from './rng.js';

export const CHUNK = 12;
export type ChunkKind = 'open' | 'grove' | 'farm' | 'camp' | 'ridge' | 'ruin';
/** What a chunk adds, and how many goblins it draws (camps the most). */
export interface Bits { rounds: Round[]; blocks: Block[]; braziers: (Circle & { wild?: boolean })[]; soil: Soil[] }
export const DRAW: Record<ChunkKind, number> = { open: 1, grove: 1, farm: 1.5, camp: 4, ridge: 1, ruin: 2 };

const M = 1.5, IN = CHUNK - 2 * M;

/** Lay out one chunk with its top-left at (ox, oy). */
export function chunk(kind: ChunkKind, rng: Rng, ox: number, oy: number, b: Bits): void {
  const round = (k: RoundKind, x: number, y: number, r: number) => void b.rounds.push({ kind: k, x: ox + x, y: oy + y, r });
  const block = (k: BlockKind, x: number, y: number, w: number, h: number, extra: Partial<Block> = {}) => void b.blocks.push({ kind: k, x: ox + x, y: oy + y, w, h, ...extra });
  const at = () => [M + rng.range(0.5, IN - 0.5), M + rng.range(0.5, IN - 0.5)] as const;
  const scatter = (n: number, kinds: RoundKind[], r: [number, number]) => {
    for (let i = 0; i < n; i++) {
      const [x, y] = at();
      round(rng.pick(kinds), x, y, rng.range(r[0], r[1]));
    }
  };
  if (kind === 'open') return scatter(rng.int(4) + 2, ['bush', 'rock', 'tree', 'stump'], [0.3, 0.5]);
  if (kind === 'grove') {
    b.soil.push({ mat: 'grass', x: ox + 1, y: oy + 1, w: CHUNK - 2, h: CHUNK - 2, round: true });
    return scatter(rng.int(5) + 8, ['tree', 'pine', 'pine', 'bush'], [0.4, 0.55]);
  }
  if (kind === 'farm') {
    // A cottage or two and a barn round a yard, a fence along one side, hay and a well.
    const flip = rng.next() < 0.5;
    block('house', flip ? 6.5 : M + 0.2, M + 0.4, 4, 3, { look: rng.int(1e6), fate: 'standing' });
    if (rng.next() < 0.6) block('house', flip ? M + 0.2 : 6.5, 6.6, 3.6, 2.8, { look: rng.int(1e6), fate: 'standing' });
    else block('barn', flip ? M + 0.2 : 5.5, 6.4, 5, 3);
    block('fence', M, CHUNK - M - 0.3, rng.range(4, 7), 0.3);
    round('hay', CHUNK / 2, CHUNK / 2, 0.45), round('well', flip ? 3 : 9, 5.5, 0.5);
    b.soil.push({ mat: 'earth', x: ox + 2, y: oy + 4.5, w: 8, h: 2.5, round: true });
    return;
  }
  if (kind === 'camp') {
    // Tents and shacks in a ring round a fire that burns whatever the hour.
    const cx = CHUNK / 2 + rng.range(-1, 1), cy = CHUNK / 2 + rng.range(-1, 1), n = 3 + rng.int(3);
    b.soil.push({ mat: 'mud', x: ox + cx - 4, y: oy + cy - 3.5, w: 8, h: 7, round: true });
    b.braziers.push({ x: ox + cx, y: oy + cy, r: 0.4, wild: true });
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng.range(-0.3, 0.3), d = rng.range(3.4, 4.2), w = rng.range(1.8, 2.6), h = 1.5;
      const x = Math.max(M, Math.min(CHUNK - M - w, cx + Math.cos(a) * d - w / 2)), y = Math.max(M, Math.min(CHUNK - M - h, cy + Math.sin(a) * d * 0.8 - h / 2));
      block(rng.next() < 0.6 ? 'tent' : 'shack', x, y, w, h);
    }
    round('cookfire', cx + 1.4, cy + 0.6, 0.3);
    return;
  }
  if (kind === 'ridge') {
    // A rock wall across the chunk with a gap to go through, rocks fallen from it.
    const across = rng.next() < 0.5, gap = rng.range(3, 6), len = IN;
    if (across) block('rockwall', M, 5.5, gap, 1.4), block('rockwall', M + gap + 2.4, 5.5, len - gap - 2.4, 1.4);
    else block('rockwall', 5.5, M, 1.4, gap), block('rockwall', 5.5, M + gap + 2.4, 1.4, len - gap - 2.4);
    return scatter(3, ['rock', 'rock', 'bush'], [0.35, 0.55]);
  }
  // A ruin: two stone walls in an L, rubble, a dead tree.
  const sx = rng.range(M, 4), sy = rng.range(M, 4);
  block('wall', sx, sy, rng.range(4, 6), 0.8), block('wall', sx, sy + 0.8, 0.8, rng.range(3, 5));
  block('rubble', sx + 3, sy + 3, 1.6, 1.2);
  round('deadtree', 8.5, 8.5, 0.45), round('statue', sx + 2.2, sy + 2.4, 0.45);
}
