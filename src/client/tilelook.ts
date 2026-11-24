/**
 * The tile look (docs/design/graphics-overhaul.md, "The tile look", Kyle 2026-11-19: SNES-era tile art, dark and gritty)
 * and the tile redraw (docs/design/tile-redraw.md).
 * They were options to compare. **They are the game now** (Kyle, 2026-11-23: "just leave on tiles and redraw"): the
 * TILES and REDRAW buttons and their saved settings are gone, so no device is left on the old look by a choice made
 * once to compare. `?tiles=0` and `?redraw=0` in the address still turn them off, for the look scripts that compare.
 * TILES: stone and timber snapped to a few shades each with more spread between them (darkgold.ts), the stone floor
 * laid tile by tile with no flecks (tilefloor.ts), dark outlines on figures and on what stands in front of something
 * further off (three/post.ts, three/figmat.ts).
 * REDRAW: the 2.5D view at 20 render pixels a tile looking down at 36.87 degrees, so a floor tile is exactly 20 by 12
 * pixels and a wall 16 a tile of height; the floor, the house fronts and roofs, the trees and the ground's layout drawn
 * at that size (three/redrawfloor.ts, three/redraw3d.ts, docs/design/forest-redraw.md).
 * (TILT, the camera at 30 degrees, came out 2026-11-20: Kyle kept today's angle, which the redraw's grid also wants.)
 * Read once at load (the grade is painted into cached canvases, the pitch into every card).
 */

/** Today's pitch (degrees); the redraw's, whose sine and cosine are 0.6 and 0.8. */
export const PITCH_TODAY = 36;
export const PITCH_REDRAW = (Math.atan2(3, 4) * 180) / Math.PI;
/** Render pixels a tile across under REDRAW. */
export const REDRAW_PPU = 20;

const read = (name: 'tiles' | 'redraw'): string | null => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get(name));
// (The settings the buttons used to save: cleared, so nothing stale is left on a device.)
try {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('relic.tiles'), localStorage.removeItem('relic.redraw');
} catch {
  /* no storage */
}

const on = (v: string | null) => v !== null && v !== '0' && v !== 'off';
const tilesRaw = read('tiles'), redrawRaw = read('redraw');

/**
 * TILES, the game since 2026-11-23 (`?tiles=0` in the address for the look before it). `even`: a tile exactly
 * 16 render pixels in 2.5D (`?even=1`, off): Kyle found it too close and the walk too slow, since figures keep their own
 * size and so stood about a fifth bigger against the floor. The redraw keeps today's scale instead (20 a tile).
 */
export const TILES = { on: tilesRaw === null || on(tilesRaw), even: typeof location !== 'undefined' && on(new URLSearchParams(location.search).get('even')) };
// (On by default in a page only: Node's tests build today's 3D, which `?redraw=0` still shows.)
export const REDRAW = { on: redrawRaw === null ? typeof location !== 'undefined' : on(redrawRaw) };
/** The 2.5D camera's pitch in degrees. */
export const PITCH_DEG = REDRAW.on ? PITCH_REDRAW : PITCH_TODAY;
