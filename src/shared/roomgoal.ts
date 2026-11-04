/**
 * A room's objective, put down before the place itself so it always fits: the cages (rescue, the
 * story, someone caged on the low road), the dens with an oil barrel by each (burn), the larder racks.
 * Cages go at the top unless raised ground is there or (a heart) a landmark stands there.
 */
import type { Block } from './arena.js';
import type { PropKind } from './props.js';
import { wooden, type Spot } from './sitekit.js';

type P = { x: number; y: number };
export interface Goal {
  obj: string; road?: string; ledges: boolean; W: number; H: number; MID: number;
  spot(r: number, y0?: number, y1?: number): P | null;
  free(x: number, y: number, r: number, skip?: object): boolean;
  /** False where a heart's landmark stands (the cage goes elsewhere). */
  guarded(x: number, y: number, r: number): boolean;
  spots: Spot[]; blocks: Block[]; props: { kind: PropKind; x: number; y: number }[];
}

export function objectives(g: Goal): { kind: PropKind; x: number; y: number }[] {
  const { obj, road, spot, free, spots, blocks, props, W, H, MID } = g;
  const cagesAt = g.ledges ? [0, 1, 2].map(() => spot(0.6, 2, H / 2 + 1)).filter(Boolean) as P[] : [[4, 2.2], [W - 4, 2.2], [MID, 2.8]].map(([x, y]) => (g.guarded(x, y, 0.6) ? { x, y } : spot(0.6, 2, H / 2 + 1))).filter(Boolean) as P[];
  // The low road: someone caged in every room.
  if (road === 'low' && obj !== 'rescue' && obj !== 'story') {
    const c = spot(0.6, 2, H / 2 + 1);
    if (c) props.push({ kind: 'cage', ...c });
  }
  if (obj === 'burn') for (let i = 0; i < 3; i++) {
    // The dens, each with an oil barrel by it (fire spreads wood to wood).
    const c = spot(1.6, 1.5, H - 4);
    if (!c) continue;
    blocks.push(wooden({ x: c.x - 1.3, y: c.y - 0.8, w: 2.6, h: 1.6, kind: 'den' }));
    const den = spots[spots.length - 1];
    for (const [ox, oy] of [[2.1, 0.5], [-2.1, 0.5], [0, 1.6]]) {
      const x = c.x + ox, y = c.y + oy;
      if (x > 1 && x < W - 1 && y < H - 3 && free(x, y, 0.45, den)) {
        props.push({ kind: 'oil', x, y }), spots.push({ x, y, r: 0.45 });
        break;
      }
    }
  }
  if (obj === 'rescue' || obj === 'story') for (const { x, y } of cagesAt.slice(0, obj === 'story' ? 3 : 2)) props.push({ kind: 'cage', x, y }), spots.push({ x, y, r: 0.6 });
  if (obj === 'larder') for (let i = 0; i < 3; i++) {
    const c = spot(0.5, 1.5, H / 2);
    if (c) props.push({ kind: 'larder', ...c });
  }
  return props;
}
