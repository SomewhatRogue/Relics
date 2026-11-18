/**
 * What every territory is laid with (docs/design/territories.md; heights by docs/design/elevation.md, "The
 * rethink"), on top of the expedition kit (shared/expedkit.ts): a line of bushes nothing gets through, a
 * gate in a gap with its stretch (sim/stretches.ts), a ledge whose named edges are slopes (a slope is a ramp
 * as long as the edge, so you walk up it anywhere), and a road the seed bends. Pure.
 */
import type { Area, Ledge, Npc, Stretch } from './arena.js';
import type { Mini } from './miniquest.js';
import { claim, path, type Kit, type Line, type P } from './expedkit.js';

/**
 * A line of bushes from `a` to `b` that nothing gets through: touching, laid as they come (no `free`
 * check, which would space them a body apart), each claimed so nothing else is laid on it.
 */
export function wall(k: Kit, a: P, b: P, r = 0.38): void {
  const len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(len / (r * 1.8)));
  for (let i = 0; i <= n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n, y = a.y + ((b.y - a.y) * i) / n;
    k.rounds.push({ kind: 'bush', x, y, r });
    claim(k, x, y, r);
  }
}

/** Two staggered rows of solid bushes across the map at `y`, from x0 to x1 (a hedge nobody gets through). */
export function thickHedge(k: Kit, y: number, x0: number, x1: number): void {
  wall(k, { x: x0, y: y - 0.3 }, { x: x1, y: y - 0.3 });
  wall(k, { x: x0 + 0.34, y: y + 0.3 }, { x: x1 - 0.34, y: y + 0.3 });
}

/**
 * A gate block `g` (in a gap the caller leaves in a hedge, a wall or water) and its stretch: the party
 * gathers in `at` (the ground just below it, by default) and gets up again at `check` (just beyond it).
 */
export function gateIn(k: Kit, g: Area, name: string, packs: number[], at?: Area, check?: P): Stretch {
  const gate = k.blocks.length;
  k.blocks.push({ kind: 'gate', ...g });
  return {
    name, keep: [], packs, gate,
    at: at ?? { x: g.x - 0.3, y: g.y + g.h, w: g.w + 0.6, h: 2.6 },
    check: check ?? { x: g.x + g.w / 2, y: g.y - 1.9 },
  };
}

/** A ledge at level `lv` whose named edges are slopes: each a ramp as long as the edge, 2 deep across it. */
export function ledge(x: number, y: number, w: number, h: number, lv: number, slopes: ('N' | 'S' | 'E' | 'W')[] = []): Ledge {
  const ramps: Area[] = slopes.map((s) =>
    s === 'S' ? { x, y: y + h - 1, w, h: 2 } : s === 'N' ? { x, y: y - 1, w, h: 2 } : s === 'W' ? { x: x - 1, y, w: 2, h } : { x: x + w - 1, y, w: 2, h });
  return { x, y, w, h, lv, ramps, kind: 'earth' };
}

/** A road through `pts`, bent by the seed between each pair by up to `bends[i]` (0 keeps that stretch straight). */
export function road(k: Kit, pts: P[], bends: number[]): Line {
  const out: Line = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, o = k.rng.range(-1, 1) * (bends[i - 1] ?? 0);
    if (o) out.push({ x: (a.x + b.x) / 2 - (dy / l) * o, y: (a.y + b.y) / 2 + (dx / l) * o });
    out.push(b);
  }
  k.roads.push(out);
  return out;
}

/** Lay a road's soil (after the ground under it, so it's drawn on top). */
export const layRoad = (k: Kit, l: Line, half: number) => path(k, 'earth', l, half);

/**
 * A mini quest's giver as someone standing on the map (shared/miniquest.ts): drawn as any person out there is,
 * `talk` naming their quest so a screen can tell when they've gone home (sim/minis.ts giverThere).
 */
export const giverNpc = (m: Mini): Npc => ({ x: m.giver.x, y: m.giver.y, name: '', talk: `mini:${m.id}`, look: m.giver.look, mute: true, ...(m.giver.low ? { sneak: true } : {}), ...(m.giver.up ? { lift: m.giver.up } : {}) });
