/**
 * Ground laid with intent (docs/design/forest-redraw.md, "Ground layout"; Kyle, 2026-11-23: "more mindful and present
 * with ground layout ... a beautiful but dark world"). On the tile redraw's floor (three/redrawfloor.ts):
 * - a grove's floor: under every tree, pine and snag the turf gives way to dark needle litter, its edge broken into
 *   the turf's own clumps, so trees near each other stand on one floor and read as a grove, and a lone tree owns its
 *   ground; smaller under a bush or a stump;
 * - roots: a few dark roots running out from each trunk's foot, lit along the top.
 * Only over grass or the floor's own earth, never over a path, a patch, water or anything laid. Whole pixels, the
 * litter's own four shades; the floor's grade lands them.
 */
import type { GameMap, Round } from '../shared/arena';
import { scatterOf } from '../shared/scatter';
import { soilAt } from './soil';
import { clumpLight } from './tilegrounds';
import { KX, KZ, type Rect } from './tilekit';

const LITTER = ['#11120d', '#181811', '#201e15', '#2a251a'], ROOT = '#120d09', ROOT_LIT = '#34261a';
/** How far each kind's floor reaches (tiles across; half that deep), and whether it has roots. */
const REACH: Record<string, [number, boolean]> = { tree: [1.5, true], pine: [1.25, true], deadtree: [0.9, true], hangtree: [1.6, true], apple: [1.1, true], bush: [0.55, false], stump: [0.6, true] };

const h01 = (a: number, b: number, s: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233 + s * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

/** Needle litter, one world pixel: low dark clumps with the odd pale fallen needle. */
export function litterAt(x: number, y: number): string {
  const lv = 0.5 + clumpLight(x, y, 5, 3, 81) * 0.8;
  if (h01(x >> 1, y, 7) < 0.035) return LITTER[3];
  return LITTER[lv < 0.34 ? 0 : lv < 0.56 ? 1 : 2];
}

/** Is this floor pixel turf or the floor's own earth (not a path, a patch, water or anything laid)? */
export function openPx(m: GameMap): (px: number, py: number) => boolean {
  const wet = (x: number, y: number) => !!m.water?.some((w) => x >= w.x - 0.2 && x <= w.x + w.w + 0.2 && y >= w.y - 0.2 && y <= w.y + w.h + 0.2);
  return (px, py) => {
    const x = px / KX, y = py / KZ, s = m.soil?.length ? soilAt(m, x, y) : 'cobble';
    return (s === 'cobble' || s === 'grass' || s === 'shade') && !wet(x, y);
  };
}

export function groveFloors(m: GameMap, rect: Rect): void {
  const floor = m.theme.floor as string;
  if (floor !== 'grass' && floor !== 'dirt' && floor !== 'mud') return;
  const W = m.w * KX, H = m.h * KZ;
  const open = openPx(m);
  const list: Round[] = [...m.rounds, ...scatterOf(m).stand].filter((r) => REACH[r.kind]);
  for (const r of list) {
    const [reach] = REACH[r.kind], k = reach * Math.min(1.3, Math.max(0.8, r.r / 0.5));
    const rx = k * KX, ry = k * 0.62 * KZ, cx = Math.round(r.x * KX + rx * 0.12), cy = Math.round(r.y * KZ + ry * 0.18);
    for (let py = Math.max(0, Math.floor(cy - ry - 2)); py <= Math.min(H - 1, cy + ry + 2); py++) {
      for (let px = Math.max(0, Math.floor(cx - rx - 2)); px <= Math.min(W - 1, cx + rx + 2); px++) {
        const d = Math.hypot((px - cx) / rx, (py - cy) / ry);
        // The edge follows the turf's clumps: the litter shows in their dark hollows first, then takes the ground.
        if (d > 1 + clumpLight(px, py, 6, 4, 61) * 0.55 || !open(px, py)) continue;
        rect(px, py, 1, 1, litterAt(px, py));
      }
    }
  }
  // Roots over the litter, so a neighbour's floor never paints them out.
  for (const r of list) {
    if (!REACH[r.kind][1]) continue;
    const fx = Math.round(r.x * KX), fy = Math.round(r.y * KZ), n = r.kind === 'stump' ? 2 : 4;
    for (let i = 0; i < n; i++) {
      const dir = [-1, 1, -0.45, 0.5][i] * (0.8 + h01(r.x, r.y, i) * 0.5), len = 4 + Math.floor(h01(r.y, r.x, i + 4) * (r.kind === 'stump' ? 3 : 6));
      for (let t = 2; t < 2 + len; t++) {
        const px = fx + Math.round(dir * t * 1.15), py = fy + 1 + Math.round(t * (0.28 + Math.abs(dir) * 0.08) * (i < 2 ? 0.7 : 1.5));
        if (px < 0 || py < 1 || px >= W || py >= H || !open(px, py)) break;
        rect(px, py, 1, 1, ROOT), rect(px, py - 1, 1, 1, ROOT_LIT);
      }
    }
  }
}
