/**
 * The grass and wheat that stand up off the floor in the tile redraw: tufts (../tiletufts.ts) as one sheet of cards
 * (propcards.ts), leaning a pixel in the gusts and parting round whoever walks through (wind3d.ts `setMovers`).
 * Grass in loose patches, not everywhere (Kyle: not too busy); standing wheat a clump or two a tile. Silent.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { groundLv } from '../../shared/heights';
import { stacked } from '../levelpaint';
import { blocked } from '../ratspots';
import { soilAt } from '../soil';
import { tuftCut } from '../tiletufts';
import type { Cut } from './propcards';
import { CardSheet } from './propcards';

const h01 = (a: number, b: number, s: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233 + s * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

/** Grass, wheat or neither where (x, y) stands. */
function growth(m: GameMap, x: number, y: number): 'grass' | 'wheat' | null {
  if (m.soil?.length) {
    const s = soilAt(m, x, y);
    if (s === 'grass') return 'grass';
    if (s !== 'cobble') return null;
  }
  const f = m.theme.floor as string;
  return f === 'grass' ? 'grass' : f === 'wheat' ? 'wheat' : null;
}

const VARIANTS = 6;

/** The map's tufts as one mesh, or null if nothing grows here; `ledge` the height of a level (ground.ts LEDGE_H). */
export function tuftMesh(m: GameMap, ledge: number): THREE.Mesh | null {
  const cuts = new Map<string, Cut>(), cutOf = (k: 'grass' | 'wheat', v: number) => {
    const key = k + v;
    let c = cuts.get(key);
    if (!c) cuts.set(key, (c = tuftCut(k, v)));
    return c;
  };
  const S = new CardSheet();
  S.push = true;
  S.edge = false;
  const lift = stacked(m), water = (x: number, y: number) => !!m.water?.some((w) => x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h);
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    const k = growth(m, tx + 0.5, ty + 0.5);
    if (!k) continue;
    // Grass in loose patches (a slow field over the map, so tufts gather), wheat a clump or two a tile.
    const patch = 0.6 * h01(Math.floor(tx / 4), Math.floor(ty / 3), 1) + 0.4 * h01(Math.floor(tx / 3), Math.floor(ty / 4), 2);
    const n = k === 'wheat' ? 1 + (h01(tx, ty, 3) < 0.5 ? 1 : 0) : patch > 0.62 && h01(tx, ty, 4) < 0.55 ? 1 + (h01(tx, ty, 5) < 0.3 ? 1 : 0) : 0;
    for (let i = 0; i < n; i++) {
      const x = tx + 0.15 + h01(tx, ty, 6 + i) * 0.7, y = ty + 0.2 + h01(tx, ty, 9 + i) * 0.7;
      if (blocked(m, x, y) || water(x, y)) continue;
      const up = lift ? groundLv(m, x, y) * ledge : 0;
      S.add(cutOf(k, Math.floor(h01(tx, ty, 12 + i) * VARIANTS)), x, y, up, 1);
    }
  }
  return S.mesh();
}
