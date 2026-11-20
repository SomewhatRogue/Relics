/**
 * The tile look's light pass and the camera tilt, two switches to compare against today (docs/design/graphics-overhaul.md,
 * "The tile look", Kyle 2026-11-19: SNES-era tile art, dark and gritty).
 * TILES: stone and timber snapped to a few shades each with more spread between them (darkgold.ts), the stone floor laid
 * tile by tile on the 16 pixel grid with no flecks (tilefloor.ts), dark outlines on figures and on what stands in front
 * of something further off (three/post.ts, three/figmat.ts). TILT: the 2.5D camera looking down 30 degrees, not 36,
 * so fronts show more and floors less (three/camera3d.ts).
 * Both are read once at load (the grade is painted into cached canvases, the pitch into every card), so the options
 * buttons save and reload. `?tiles=1` or `?tiles=0`, `?tilt=1`, `?tilt=0` or `?tilt=<degrees>` in the address win.
 */

const KEY = { tiles: 'relic.tiles', tilt: 'relic.tilt' };
/** Today's pitch and the tilted one (degrees). */
export const PITCH_TODAY = 36;
export const PITCH_TILTED = 30;

function read(name: 'tiles' | 'tilt'): string | null {
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
const tiltRaw = read('tilt'), tiltN = Number(tiltRaw);

/**
 * `even`: a tile exactly 16 render pixels in 2.5D, so floor pixels are all one width (`?even=1`, off by default). Off,
 * a tile keeps today's 2.5D size (about 19.5 on a phone): Kyle found the even tile too close and the walk too slow,
 * since figures stay their own size and so stand about a fifth bigger against the floor (2026-11-19).
 */
// On by default since Kyle's yes, 2026-11-19; `?tiles=0` or the button for today's look, to compare.
const tilesRaw = read('tiles');
export const TILES = { on: tilesRaw === null || on(tilesRaw), even: typeof location !== 'undefined' && on(new URLSearchParams(location.search).get('even')) };
/** The 2.5D camera's pitch in degrees: a number in the address is tried as given (20 to 60). */
export const TILT = { deg: !on(tiltRaw) ? PITCH_TODAY : tiltN >= 20 && tiltN <= 60 ? tiltN : PITCH_TILTED };

function save(name: 'tiles' | 'tilt', v: boolean): void {
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

/** TILES and TILT buttons in the options box, after CAMERA. Each saves and reloads. */
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
  const tilted = TILT.deg !== PITCH_TODAY;
  const tiles = mk('tilesbtn', TILES.on ? 'TILES: ON' : 'TILES: OFF', TILES.on, 'The tile look, to compare', () => save('tiles', !TILES.on));
  const tilt = mk('tiltbtn', tilted ? 'TILT: UP' : 'TILT: TODAY', tilted, 'The camera tilted up, to compare', () => save('tilt', !tilted));
  const after = document.getElementById('camerabtn') ?? document.getElementById('viewbtn');
  if (after) after.after(tiles, tilt);
  else box.prepend(tiles, tilt);
}
