/**
 * Pixel icons written as character grids (one letter a colour, from the scene's palette) and drawn once
 * into small canvases with a one-pixel dark outline added round them, so an icon reads on stone, on
 * gold or on the floor. The HUD's icons (icons.ts) and the skills' (skillicons.ts) are made this way.
 */
export const PAL: Record<string, string> = {
  w: '#e8dcc0', W: '#ffffff', g: '#c8d0dc', s: '#8a94a4', d: '#4a525e',
  y: '#e0a640', Y: '#ffd27a', r: '#c8402f', R: '#7a1d1d', b: '#8a5a30', B: '#5a3a1e',
  f: '#ff9a3c', F: '#ffe08a', c: '#9fe8ff', C: '#4a8ac8', e: '#fff27a', p: '#b57aff', P: '#6a3aa8',
  n: '#9cc95a', N: '#4a6a1a', h: '#d8a878', H: '#a0704a', u: '#2f5d9b', U: '#5a8ad0',
  o: '#6a6e78', O: '#3a3e46', l: '#9a6a3a', L: '#6a4220', k: '#14161a',
};
const EDGE = '#0b0c0f';

export type Grid = string[];
const canvases = new Map<string, HTMLCanvasElement>();
const urls = new Map<string, string>();

/** The grid drawn with an outline (the canvas is two pixels wider and taller than the grid). `tint` recolours every lit pixel. */
export function gridCanvas(key: string, rows: Grid, tint?: string): HTMLCanvasElement {
  const k = key + (tint ?? '');
  const had = canvases.get(k);
  if (had) return had;
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w + 2;
  c.height = h + 2;
  const g = c.getContext('2d')!;
  const on = (x: number, y: number) => y >= 0 && y < h && x >= 0 && x < w && (rows[y][x] ?? '.') !== '.';
  g.fillStyle = EDGE;
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) g.fillRect(x + 1, y + 1, 1, 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (!on(x, y) || !PAL[ch]) continue;
    g.fillStyle = tint && ch !== 'k' && ch !== 'W' ? shade(tint, ch) : PAL[ch];
    g.fillRect(x + 1, y + 1, 1, 1);
  }
  canvases.set(k, c);
  return c;
}

/** The same, as an image source for CSS or an <img>. */
export function gridUrl(key: string, rows: Grid, tint?: string): string {
  const k = key + (tint ?? '');
  if (!urls.has(k)) urls.set(k, typeof document === 'undefined' ? '' : gridCanvas(key, rows, tint).toDataURL());
  return urls.get(k)!;
}

/** A tinted pixel: darker letters (capitals and the dark greys) take a darker step of the tint. */
function shade(tint: string, ch: string): string {
  const n = parseInt(tint.slice(1, 7), 16), dark = /[A-Z]|d|o|k/.test(ch) ? 0.6 : 1;
  const r = ((n >> 16) & 255) * dark, gg = ((n >> 8) & 255) * dark, b = (n & 255) * dark;
  return `rgb(${r | 0},${gg | 0},${b | 0})`;
}
