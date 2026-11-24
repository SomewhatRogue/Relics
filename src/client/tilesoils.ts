/**
 * The laid soils the tile way (docs/design/forest-redraw.md, "The laid soils"): mud, a drained bed's wet silt, laid
 * straw, a standing crop and ash, one floor pixel at a time, for soil.ts under the tile redraw. They were the old
 * painting scaled onto the new grid (flecked blocks, the wet a grey slab): here each is drawn as the earth beside it
 * is (tilegrounds.ts `earthAt`), a dark calm ground with something of its own on it, three to five shades, no
 * speckle. Cosmetic only, a hash of the pixel, never Math.random.
 */
import { earthAt } from './tilegrounds';
import { hash } from './tiletrees';

const MUD = ['#17130f', '#211a14', '#271f18', '#31271d'], SILT = ['#100f0d', '#191714', '#1f1d19', '#2a2824'];
const ASH = ['#131214', '#1d1c1f', '#242326', '#323034'], FIELD = ['#2b2218', '#322820', '#392e24', '#43372a'];
const WATER = '#0b0f13', BANK = '#060708', GLINT = '#3b4853';

/** How low the ground lies, in broad slow swells (about -2 to 2): the lows of mud and silt stand wet. */
const low = (x: number, y: number) => Math.sin(x * 0.11 + Math.sin(y * 0.19) * 1.6) + Math.sin(y * 0.23 + x * 0.05);
/** Standing water where the ground is lower than `at`: black, a dark bank round it, a glint along a row here and there. */
function standing(x: number, y: number, at: number): string | null {
  const l = low(x, y);
  return l > at ? (y % 3 === 0 && hash(x >> 2, y, 5) < 0.2 ? GLINT : WATER) : l > at - 0.09 ? BANK : null;
}

/** Mud: the path's ripples, darker and colder, water standing in its lowest few places. */
export const mudAt = (x: number, y: number) => standing(x, y, 1.62) ?? earthAt(x, y, MUD);
/** A drained bed: black silt, a sixth of it still standing wet. */
export const siltAt = (x: number, y: number) => standing(x, y, 1.05) ?? earthAt(x, y, SILT);
/** Ash: the same ground gone cold and grey. */
export const ashAt = (x: number, y: number) => earthAt(x, y, ASH);

const STRAW = ['#2a2114', '#3d321e', '#463923', '#6e5b2e', '#857036'];
/** Laid straw: a stalk lying in most 7 by 3 cells, some a pixel aslant, pale over its own shadow, on a dull tan. */
export function strawAt(x: number, y: number): string {
  const r = Math.floor(y / 3), xx = x + Math.floor(hash(r, 0, 41) * 7), c = Math.floor(xx / 7), lx = xx - c * 7, ly = y - r * 3, h = hash(c, r, 43);
  if (h < 0.66) {
    const x0 = Math.floor(hash(c, r, 44) * 2), len = 3 + Math.floor(hash(c, r, 45) * 3), aslant = hash(c, r, 46) < 0.4;
    if (lx >= x0 && lx < x0 + len) {
      const sy = (h < 0.3 ? 0 : 1) + (aslant && lx >= x0 + (len >> 1) ? 1 : 0);
      if (ly === sy) return STRAW[hash(c, r, 47) < 0.35 ? 4 : 3];
      if (ly === sy + 1) return STRAW[0];
    }
  }
  return STRAW[Math.sin(x * 0.05 + Math.sin(y * 0.08) * 1.7) + Math.sin(y * 0.11 + x * 0.02) > 0.9 ? 2 : 1];
}

const WHEAT = ['#5a4a26', '#7a6630', '#98823c', '#b8a052'];
/** A standing crop, as the wheat floor's stamp draws it: stalks in rows every six pixels on dark earth, some gone. */
export function cropAt(x: number, y: number): string {
  const dy = (11 - (y % 6)) % 6, wy = y + dy;
  if (x % 3 === 0 && hash(x, wy, 11) >= 0.22) {
    const h = 3 + Math.floor(hash(x, wy, 12) * 3), c = hash(x, wy, 13) < 0.5 ? 1 : 2;
    if (dy >= 1 && dy <= h) return WHEAT[c];
    if (dy === h + 1) return WHEAT[c + 1];
  }
  if (dy === 1 && x % 3 === 1 && hash(x - 1, wy, 11) >= 0.22) return WHEAT[0];
  return earthAt(x, y, FIELD);
}
