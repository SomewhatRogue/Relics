/**
 * The UI's frames, drawn in code at boot the way the sprites are: tiny 9-slice sources set on :root as
 * CSS images (--f-stone and the rest), shown with border-image at --px CSS pixels per art pixel so a
 * frame's pixels sit on the same grid as the world's. Four materials, each with one job:
 *   stone   panels and sheets (a cool grey bevel, lit from the top left)
 *   iron    buttons, sockets, the stick (blued iron, a rivet in each corner)
 *   gilt    the way on: the primary action and the context slot (iron with gold caps and a gold top)
 *   parch   notices and paper (warm paper, stained edges, torn corners)
 * plus pressed (-in) states with the bevel turned over, a sunk socket, and a dim one for what can't be used.
 */
type Px = string | null;
/** `d` is how far in from the nearest edge, `tl` whether that edge is the top or the left, `corner` a corner cell. */
type Paint = (d: number, tl: boolean, corner: boolean, top: boolean, x: number, y: number) => Px;

const OUT = '#07080a';

function make(k: number, paint: Paint): string {
  const n = 2 * k + 2, c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dt = y, dl = x, db = n - 1 - y, dr = n - 1 - x;
    const d = Math.min(dt, dl, db, dr);
    // Lit from the top left: the bevel splits on the diagonal in the top-right and bottom-left corners.
    const tl = dt === d ? true : db === d ? false : dl === d;
    const corner = (x < k || x >= n - k) && (y < k || y >= n - k);
    const top = dt === d && dl !== d && dr !== d;
    // The very corner pixel is cut away, and the one inside it darkened, so corners read as chamfered.
    const chamfer = (x === 0 || x === n - 1) && (y === 0 || y === n - 1);
    const col = chamfer ? null : paint(d, tl, corner, top, x, y);
    if (col) (g.fillStyle = col), g.fillRect(x, y, 1, 1);
  }
  return c.toDataURL();
}
const rivet = (x: number, y: number, n: number) => (x === 1 || x === n - 2) && (y === 1 || y === n - 2);

const FRAMES: Record<string, () => string> = {
  stone: () => make(4, (d, tl) => (d === 0 ? '#0b0c0f' : d === 1 ? (tl ? '#5b616c' : '#15171b') : d === 2 ? (tl ? '#3b3f47' : '#22252b') : d === 3 ? '#121317' : '#1b1d22')),
  iron: () => make(3, (d, tl, _c, _t, x, y) => (d === 0 ? OUT : rivet(x, y, 8) ? '#a3acba' : d === 1 ? (tl ? '#7d8796' : '#22262c') : d === 2 ? (tl ? '#474e59' : '#33383f') : '#2b2e35')),
  'iron-in': () => make(3, (d, tl) => (d === 0 ? OUT : d === 1 ? (tl ? '#121417' : '#555d69') : d === 2 ? (tl ? '#1c1f24' : '#363b43') : '#23262c')),
  gilt: () => make(3, (d, tl, corner, top, x, y) => {
    if (d === 0) return '#1a1004';
    if (corner) return rivet(x, y, 8) ? '#fff1c0' : tl ? '#e0a640' : '#9a6a1c';
    if (top) return d === 1 ? '#ffd27a' : '#c8902e';
    return d === 1 ? (tl ? '#7d8796' : '#22262c') : d === 2 ? (tl ? '#474e59' : '#33383f') : '#2e2618';
  }),
  'gilt-in': () => make(3, (d, tl, corner) => (d === 0 ? '#1a1004' : corner ? '#9a6a1c' : d === 1 ? (tl ? '#121417' : '#b07c26') : d === 2 ? '#1c1f24' : '#241d12')),
  parch: () => make(4, (d, _tl, _c, _t, x, y) => {
    const n = 10, ex = x === 0 || x === n - 1, ey = y === 0 || y === n - 1;
    // Torn corners: two more pixels gone at each.
    if ((ex && (y === 1 || y === n - 2)) || (ey && (x === 1 || x === n - 2))) return null;
    return d === 0 ? '#2a2118' : d === 1 ? '#7a6240' : d === 2 ? '#a48c62' : d === 3 ? '#bba277' : '#c9b48a';
  }),
  sunk: () => make(2, (d, tl) => (d === 0 ? OUT : d === 1 ? (tl ? '#0d0e11' : '#3a3f48') : '#121317')),
  dim: () => make(3, (d, tl) => (d === 0 ? '#0b0c0f' : d === 1 ? (tl ? '#3a3e46' : '#15171b') : d === 2 ? '#202328' : '#1d1f24')),
};

/** A 4 by 4 ordered dither, a shade lighter than stone, for panel faces (the floor's own texture). */
function dither(): string {
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(160,170,190,0.05)';
  for (const [x, y] of [[0, 0], [2, 2], [2, 0], [0, 2]]) g.fillRect(x, y, 1, 1);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (const [x, y] of [[1, 1], [3, 3]]) g.fillRect(x, y, 1, 1);
  return c.toDataURL();
}

const urls: Record<string, string> = {};
/** The source of a frame, for a canvas to draw (or '' before the page has a document). */
export const frameUrl = (grade: keyof typeof FRAMES): string => urls[grade] ?? '';

/** Draw every frame once and hand them to the CSS. */
export function paintFrames(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  for (const [k, f] of Object.entries(FRAMES)) root.setProperty('--f-' + k, `url(${(urls[k] = f())})`);
  root.setProperty('--dither', `url(${dither()})`);
}
