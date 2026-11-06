/**
 * The Night Watch held upright on a phone (Kyle 2026-11-05: "top to bottom defence and they run towards
 * you ... more accuracy and range is required"). You look out from behind the hero on the wall walk; the
 * fields run away up the screen to the horizon. The sim works in metres: `d` is how far out from the
 * wall's foot, `u` left (-) and right (+) of the hero, heights up from the field. The eye is EYE.back
 * behind the wall's foot and EYE.up above the field; a thing `D = d + EYE.back` from the eye is drawn
 * at scale f / D (watchdeep's view picks f to fit the screen), so goblins grow as they come.
 * Each goblin's zones are given here in metres, facing you, and drawn from the same numbers scaled.
 */
import type { Box, Disc, GobKind } from './watchtune.js';

/** The eye: far enough back that the field's depth spreads down the screen (not crammed at the top), high enough to see over the parapet. */
export const EYE = { back: 8, up: 6.7 };

export const DEEP = {
  /** Goblins come in this far out; at `reach` they're in under the parapet, out of sight: the watch have it. */
  far: 55, reach: 1,
  /** They come in anywhere across this far either side, and run for a spot on the wall this far either side of you. */
  spawnU: 14, wallU: 1.5,
  /** A runner's zig: this far either way, once every so many metres. */
  zig: 0.6, zigEvery: 5,
  /** Metres a second for each pixel a second of side-on pace (GOBS.speed): a plain goblin runs 3.5 m/s. */
  pace: 0.27,
  /** Archers stop this far out, in metres. */
  archerStop: [18, 28] as [number, number],
  /** The sight's reach, as how far across and down it points (tangents from the eye). */
  aimU: 0.9, aimUp: -0.06, aimDown: 3,
  /** A near miss shakes the sight by this much (a tangent). */
  shake: 0.03,
  /** Fog with distance: none to `clear` metres out, thickening to `thick` at the far edge. */
  clear: 18, thick: 0.7,
  /** The night's fog banks: how far out they start, how fast they roll in, how deep they are, how high. */
  fogFrom: 62, fogSpeed: [1.2, 2.2] as [number, number], fogDeep: [8, 14] as [number, number], fogHigh: 2.2,
};

export const DEEP_BOW = {
  /** Metres a second from a tap to a full draw, and the drop. A full draw reaches the far edge in about 1.3 s. */
  vTap: 22, vFull: 45, gravity: 2.5,
  /** How far off it can fly, in degrees either way: a tap is wild, a full draw is tight. */
  spreadTap: 2.5, spreadFull: 0.25,
};

/** A goblin's zones facing you, in metres: across from its middle (`x`), and up from its feet (`y`). */
export interface DeepShape { head: Disc; body: Box; legs: Box; shield?: Box; torch?: Box }
const upright = (): DeepShape => ({ head: { x: 0, y: 1.12, r: 0.17 }, body: { x0: -0.22, y0: 0.45, x1: 0.22, y1: 0.95 }, legs: { x0: -0.18, y0: 0, x1: 0.18, y1: 0.45 } });
export const DEEP_SHAPES: Record<GobKind, DeepShape> = {
  plain: upright(),
  helmet: upright(),
  // The shield faces you: it covers the body and the tops of the legs; the head shows over the rim.
  shield: { ...upright(), shield: { x0: -0.27, y0: 0.3, x1: 0.27, y1: 0.97 } },
  // Bent low and running: smaller, the head down.
  runner: { head: { x: 0, y: 0.88, r: 0.15 }, body: { x0: -0.2, y0: 0.36, x1: 0.2, y1: 0.74 }, legs: { x0: -0.17, y0: 0, x1: 0.17, y1: 0.36 } },
  // The torch held up at its side.
  torch: { ...upright(), torch: { x0: 0.24, y0: 0.8, x1: 0.36, y1: 1.55 } },
  archer: upright(),
};

/** A goblin's spot on the field at `x` metres run (it starts at u0, aims for u1 at the wall; a runner zigs). */
export function deepSpot(x: number, u0: number, u1: number, zig: number): { u: number; d: number } {
  const run = DEEP.far - DEEP.reach, k = Math.max(0, Math.min(1, x / run));
  return { u: u0 + (u1 - u0) * k + (zig ? Math.sin(x * ((2 * Math.PI) / DEEP.zigEvery) + zig) * DEEP.zig : 0), d: DEEP.far - x };
}

/** Where things are on the upright canvas: the middle, the horizon, the parapet's top, the scale, the size. */
export interface Lens { cx: number; hz: number; par: number; f: number; lw: number; lh: number }
/** A spot `u` across, `y` up and `d` out, on the canvas, and pixels a metre there (the drawing and the tests). */
export function proj(l: Lens, u: number, y: number, d: number): [number, number, number] {
  const D = Math.max(0.2, d + EYE.back), sc = l.f / D;
  return [l.cx + u * sc, l.hz + (EYE.up - y) * sc, sc];
}
