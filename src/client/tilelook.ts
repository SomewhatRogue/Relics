/**
 * The tile look (docs/design/graphics-overhaul.md, "The tile look", Kyle 2026-11-19: SNES-era tile art, dark and gritty)
 * and the tile redraw (docs/design/tile-redraw.md), as switches.
 * TILES, on by default since Kyle's yes: stone and timber snapped to a few shades each with more spread between them
 * (darkgold.ts), the stone floor laid tile by tile on the 16 pixel grid with no flecks (tilefloor.ts), dark outlines on
 * figures and on what stands in front of something further off (three/post.ts, three/figmat.ts).
 * REDRAW, on by default since Kyle's "should we just have as standard" (2026-11-20; `?redraw=0` or the button for the
 * look before it): the 2.5D view at 20 render pixels a tile looking down at
 * 36.87 degrees, so a floor tile is exactly 20 by 12 pixels and a wall 16 a tile of height; the floor and the house
 * fronts and roofs drawn at that size (three/redrawfloor.ts, three/redraw3d.ts).
 * (TILT, the camera at 30 degrees, came out the same day: Kyle kept today's angle, which the redraw's grid also wants.)
 * Read once at load (the grade is painted into cached canvases, the pitch into every card), so the options buttons
 * save and reload. `?tiles=0`, `?redraw=1` and so on in the address win.
 */

const KEY = { tiles: 'relic.tiles', redraw: 'relic.redraw' };
/** Today's pitch (degrees); the redraw's, whose sine and cosine are 0.6 and 0.8. */
export const PITCH_TODAY = 36;
export const PITCH_REDRAW = (Math.atan2(3, 4) * 180) / Math.PI;
/** Render pixels a tile across under REDRAW. */
export const REDRAW_PPU = 20;

function read(name: keyof typeof KEY): string | null {
  if (typeof location === 'undefined') return null;
  const u = new URLSearchParams(location.search).get(name);
  if (u !== null) return u;
  try {
    return localStorage.getItem(KEY[name]);
  } catch {
    return null;
  }
}

const on = (v: string | null) => v !== null && v !== '0' && v !== 'off';
const tilesRaw = read('tiles'), redrawRaw = read('redraw');

/**
 * TILES, on by default since Kyle's yes, 2026-11-19 (`?tiles=0` or the button for today's look). `even`: a tile exactly
 * 16 render pixels in 2.5D (`?even=1`, off): Kyle found it too close and the walk too slow, since figures keep their own
 * size and so stood about a fifth bigger against the floor. The redraw keeps today's scale instead (20 a tile).
 */
export const TILES = { on: tilesRaw === null || on(tilesRaw), even: typeof location !== 'undefined' && on(new URLSearchParams(location.search).get('even')) };
// (On by default in a page only: Node's tests build today's 3D, which `?redraw=0` still shows.)
export const REDRAW = { on: redrawRaw === null ? typeof location !== 'undefined' : on(redrawRaw) };
/** The 2.5D camera's pitch in degrees. */
export const PITCH_DEG = REDRAW.on ? PITCH_REDRAW : PITCH_TODAY;

function save(name: keyof typeof KEY, v: boolean): void {
  try {
    localStorage.setItem(KEY[name], v ? '1' : '0');
  } catch {
    /* this session only */
  }
  // The address may be holding the old value: take it off so the saved one counts.
  const u = new URL(location.href);
  u.searchParams.delete(name);
  location.replace(u.toString());
}

/** TILES and REDRAW buttons in the options box, after CAMERA. Each saves and reloads. */
export function tileButtons(): void {
  const box = document.getElementById('options');
  if (!box) return;
  const mk = (id: string, label: string, isOn: boolean, aria: string, flip: () => void) => {
    const b = document.createElement('button');
    b.id = id;
    b.textContent = label;
    b.setAttribute('aria-label', aria);
    b.classList.toggle('on', isOn);
    b.addEventListener('click', flip);
    return b;
  };
  const tiles = mk('tilesbtn', TILES.on ? 'TILES: ON' : 'TILES: OFF', TILES.on, 'The tile look, to compare', () => save('tiles', !TILES.on));
  const redraw = mk('redrawbtn', REDRAW.on ? 'REDRAW: ON' : 'REDRAW: OFF', REDRAW.on, 'The tile redraw, to try', () => save('redraw', !REDRAW.on));
  const after = document.getElementById('camerabtn') ?? document.getElementById('viewbtn');
  if (after) after.after(tiles, redraw);
  else box.prepend(tiles, redraw);
}
