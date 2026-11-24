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
/**
 * The camera's angle, a player's choice (Kyle, 2026-11-23: "give me the ability to toggle it in game"): HIGH, the
 * redraw's own; LOW, 30 degrees; LOWEST, about 24. Each is an angle where a floor tile is a whole number of render
 * pixels deep (12, 10, 8 of its 20 across), so the ground is drawn at that size (tilekit.ts KZ) and stays crisp; a
 * wall's height rounds to the nearest pixel (16, 17, 18). Lower looks further across the map and stands the trees
 * and walls taller against the ground. The ANGLE button in the options box steps through them; it saves and reloads
 * (the angle is drawn into the floor, the fronts and every card). `?pitch=low` or `?pitch=30` in the address wins.
 */
const ANGLE_KEY = 'relic.angle';
export type Angle = 'high' | 'low' | 'lowest';
const ANGLES: Record<Angle, number> = { high: PITCH_REDRAW, low: 30, lowest: (Math.asin(0.4) * 180) / Math.PI };
const isAngle = (v: string | null): v is Angle => v === 'high' || v === 'low' || v === 'lowest';
function startAngle(): { name: Angle | null; deg: number } {
  if (typeof location === 'undefined') return { name: 'high', deg: PITCH_REDRAW };
  const u = new URLSearchParams(location.search).get('pitch'), n = parseFloat(u ?? '');
  if (isAngle(u)) return { name: u, deg: ANGLES[u] };
  if (n >= 15 && n <= 60) return { name: null, deg: n };
  try {
    const sv = localStorage.getItem(ANGLE_KEY);
    if (isAngle(sv)) return { name: sv, deg: ANGLES[sv] };
  } catch {
    /* nothing remembered */
  }
  return { name: 'high', deg: PITCH_REDRAW };
}
const angle = startAngle();
/** Which angle the camera is at (null: one given by number in the address). */
export const ANGLE = angle.name;
/** The 2.5D camera's pitch in degrees. */
export const PITCH_DEG = REDRAW.on ? angle.deg : PITCH_TODAY;

/** The ANGLE button, under CAMERA in the options box: HIGH, LOW, LOWEST, round again. Saves and reloads. */
export function angleButton(): void {
  const box = document.getElementById('options');
  if (!box || !REDRAW.on) return;
  const b = document.createElement('button'), order: Angle[] = ['high', 'low', 'lowest'];
  b.id = 'anglebtn';
  b.textContent = `ANGLE: ${(ANGLE ?? 'high').toUpperCase()}`;
  b.setAttribute('aria-label', 'How low the camera looks across the map');
  b.classList.toggle('on', ANGLE !== 'high');
  b.addEventListener('click', () => {
    try {
      localStorage.setItem(ANGLE_KEY, order[(order.indexOf(ANGLE ?? 'high') + 1) % order.length]);
    } catch {
      /* this session only */
    }
    // The address may be holding an angle: take it off so the saved one counts.
    const u = new URL(location.href);
    u.searchParams.delete('pitch');
    location.replace(u.toString());
  });
  const after = document.getElementById('camerabtn') ?? document.getElementById('viewbtn');
  if (after) after.after(b);
  else box.prepend(b);
}
