/**
 * The wood's edge in the tile redraw (docs/design/forest-redraw.md): where a map's back is trees, rows of drawn pines
 * and broadleafs overlapping into one dark mass along the top and down the sides, instead of a painted wall with lumpy
 * crowns. The front row shows its trunks; the rows behind stand higher on screen, crowns only. The ways out (the road
 * gaps, the side ways) stay open, and nothing stands along the foot, so no one is hidden. Cosmetic: outside the room.
 */
import type * as THREE from 'three';
import type { Round } from '../../shared/arena';
import { CardSheet, roundCut } from './propcards';

const h01 = (a: number, b: number, s: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233 + s * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

/** `north`: the top edge's runs of wall (x from, to); `sides`: each side's runs (z from, to), W at x 0, E at x `w`. */
export function treeLine(w: number, north: [number, number][], sides: { W: [number, number][]; E: [number, number][] }): THREE.Mesh | null {
  const S = new CardSheet();
  const tree = (x: number, z: number, s: number) => {
    const kind = h01(x, z, s) < 0.72 ? 'pine' : 'tree';
    S.add(roundCut({ kind, x, y: z, r: 0.5 } as Round), x, z, 0, 1);
  };
  // Back rows first (the sheet draws in order and depth sorts each card anyway).
  const ROWS = [[-2.1, 1.5], [-1.3, 1.35], [-0.45, 1.25]] as const;
  for (const [z, step] of ROWS) for (const [a, b] of north) {
    // Clear of a gap's edge by most of a crown, the front row most.
    const pad = z > -1 ? 1.0 : 0.7;
    for (let x = a + pad; x <= b - pad + 0.01; x += step) tree(x + (h01(x, z, 1) - 0.5) * 0.6, z - h01(x, z, 2) * 0.35, 3);
  }
  for (const [side, x0, dir] of [['W', 0, -1], ['E', w, 1]] as const) for (const [z0, z1] of sides[side]) {
    for (const [col, step] of [[2.3, 1.4], [1.35, 1.2]] as const) for (let z = z0 + 0.9; z <= z1 - 0.6; z += step) {
      tree(x0 + dir * (col + (h01(z, col, 4) - 0.5) * 0.4), z + (h01(z, col, 5) - 0.5) * 0.4, 6);
    }
  }
  return S.mesh();
}
