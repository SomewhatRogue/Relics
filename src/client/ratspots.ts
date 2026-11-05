/**
 * Where rats gather (rats.ts): on a job, the blood left on the floor (the stains gore.ts and fx.ts
 * leave, read a few hundred pixels at a time) and the bodies lying in it; in Wickhold, a few alleys
 * and the Drowned Rat's sewer grate. And where a scared one runs to: the nearest wall, edge or shadow
 * away from whoever frightened it. Paint only: the room never hears of any of it.
 */
import type { GameMap } from '../shared/arena';
import type { Enemy } from '../sim/types';
import { OX, OY, PX } from './world';

export interface Haunt { x: number; y: number; weight: number; town?: boolean }
type Stain = { x: number; y: number; col: string };

/** In Wickhold: by the sewer grate behind the Drowned Rat, the alley between it and the infirmary,
 *  and behind its barrels. Rats in each, at most. */
export const TOWN_HAUNTS: (Haunt & { rats: number })[] = [
  { x: 23.1, y: 35.4, weight: 99, town: true, rats: 3 },
  { x: 11.5, y: 34.8, weight: 99, town: true, rats: 2 },
  { x: 21.6, y: 34.6, weight: 99, town: true, rats: 2 },
];

/** Blood: a dark red, red well over green and blue. */
export function bloody(col: string): boolean {
  if (col.length < 7 || col[0] !== '#') return false;
  const r = parseInt(col.slice(1, 3), 16), g = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
  return r >= 0x48 && r > g * 2.2 && r > b * 2.2;
}

const CELL = 1.5, ENOUGH = 14;

/** Blood stains on a job's floor, gathered into a few spots that are worth a rat. */
export class StainSpots {
  private seen = new WeakSet<Stain>();
  private cells = new Map<string, { n: number; sx: number; sy: number }>();

  reset(): void {
    this.seen = new WeakSet();
    this.cells.clear();
  }

  /** Reads the newest stains since last time (from the end, until one it has seen). */
  read(stains: Stain[]): void {
    for (let i = stains.length - 1, k = 0; i >= 0 && k < 1500; i--, k++) {
      const d = stains[i];
      if (this.seen.has(d)) break;
      this.seen.add(d);
      if (!bloody(d.col)) continue;
      const x = (d.x - OX) / PX, y = (d.y - OY) / PX, key = Math.floor(x / CELL) + ',' + Math.floor(y / CELL);
      const c = this.cells.get(key) ?? { n: 0, sx: 0, sy: 0 };
      (c.n += 1), (c.sx += x), (c.sy += y);
      this.cells.set(key, c);
    }
  }

  /** The bloodied spots, and the bodies (left whole enough to gnaw at). */
  haunts(enemies: readonly Enemy[]): Haunt[] {
    const out: Haunt[] = [];
    for (const c of this.cells.values()) if (c.n >= ENOUGH) out.push({ x: c.sx / c.n, y: c.sy / c.n, weight: c.n });
    for (const e of enemies) {
      if (e.act !== 'dead' || e.death === 'burst' || e.death === 'shatter' || e.death === 'burn' || e.corpse) continue;
      if (e.kind !== 'scrapper' && e.kind !== 'butcher') continue;
      const near = out.find((h) => Math.hypot(h.x - e.x, h.y - e.y) < CELL);
      if (near) near.weight += 30;
      else out.push({ x: e.x + 0.3, y: e.y + 0.15, weight: 30 });
    }
    return out;
  }
}

/** Is (x, y) inside something a rat can't cross: off the map, a wall or house, a pillar or tree. */
export function blocked(m: GameMap, x: number, y: number): boolean {
  if (x < 0.2 || y < 0.2 || x > m.w - 0.2 || y > m.h - 0.2) return true;
  for (const b of m.blocks) if (b.kind !== 'sideway' && !b.ruined && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
  for (const r of m.rounds) if (r.r >= 0.2 && Math.hypot(r.x - x, r.y - y) < r.r) return true;
  return false;
}

/**
 * Where a rat runs from (x, y), away along (dx, dy): to the first wall, edge or solid thing that way
 * (it slips under or behind it), or into the dark a few tiles off if there's nothing.
 */
export function bolthole(m: GameMap, x: number, y: number, dx: number, dy: number, far = 5): { x: number; y: number } {
  const l = Math.hypot(dx, dy) || 1;
  let px = x, py = y;
  for (let s = 0.25; s <= far; s += 0.25) {
    const nx = x + (dx / l) * s, ny = y + (dy / l) * s;
    if (blocked(m, nx, ny)) return { x: px, y: py };
    (px = nx), (py = ny);
  }
  return { x: px, y: py };
}
