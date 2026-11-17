/**
 * The new look's characters (docs/decisions/new-look-characters.md): today's figures painted sharper, behind
 * `?sharp`. The figures stay the shapes and pixel maps they are (sprites.ts, herolooks.ts) and keep every pose and
 * timing; only the painting of their pixels changes. Today's paint (sprites.ts `makeSprite`) lifts a shape's top and
 * left edge pixels and darkens its bottom and right ones, and leaves the rest one flat colour. This paints form:
 * - each row of the body is a rounded thing lit from the top left, so its far side falls into shadow;
 * - the silhouette's lit edge catches a rim of light, its far edge sinks;
 * - where one shape sits on another (a plate on mail, a belt on a jerkin), the lower shape's edge darkens into a
 *   crease, so the parts read apart;
 * - shading moves the hue as well: lights warm toward gold, shadows cool toward violet and deepen;
 * - steel and gold catch a near-white glint on their lit edge and go darker in their shadow (more contrast);
 * - the dark outline stays (it keeps a dark figure off a dark floor). Glowing pixels (eyes, embers) stay as they are.
 * Pure but for the canvases it makes.
 */
import type { Sprite } from './sprites';

/** On for everyone since 2026-11-16 (Kyle: "I actually do like it"); `?sharp=0` shows today's figures as they were. */
export const SHARP = typeof location !== 'undefined' && new URLSearchParams(location.search).get('sharp') !== '0';

/** Light from the top left (screen: +x right, +y down). */
const L = [-0.62, -0.78];
/** How far each shade level moves a colour: lightness per level; hue toward warm in the light, in the shadow toward
 *  violet for cold colours and toward red-brown for warm ones (skin, leather, gold); saturation. */
const RAMP = { up: 0.1, down: 0.1, warm: 46, coolCold: 262, coolWarm: 8, hueUp: 6, hueDown: 9, satUp: -0.04, satDown: 0.07 };
/** Steel and gold: their shading pushed harder, and a near-white glint where the light first strikes each piece. */
const METAL = { gain: 1.4, glint: 2.6 };

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function toHsl([r, g, b]: [number, number, number]): [number, number, number] {
  (r /= 255), (g /= 255), (b /= 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function toRgb([h, s, l]: [number, number, number]): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
/** `h` turned `by` degrees toward `to` (the short way round), never past it. */
function toward(h: number, to: number, by: number): number {
  const d = ((to - h + 540) % 360) - 180;
  return (h + Math.sign(d) * Math.min(Math.abs(d), by) + 360) % 360;
}

/** Steel or gold: greys of middling lightness, or a strong yellow. */
export function metal(col: string): boolean {
  const [h, s, l] = toHsl(hex(col));
  return (s < 0.18 && l > 0.22 && l < 0.85) || (h > 30 && h < 58 && s > 0.45 && l > 0.35);
}

/** A colour moved `level` shades: up is lighter, warmer and a touch greyer; down darker, richer, and cooler (violet
 *  for cold colours, red-brown for warm ones, so skin and leather don't go purple). */
export function shade(col: string, level: number): [number, number, number] {
  if (!level) return hex(col);
  let [h, s, l] = toHsl(hex(col));
  if (level > 0) (l = Math.min(0.97, l + RAMP.up * level * (0.7 + l))), (h = s > 0.05 ? toward(h, RAMP.warm, RAMP.hueUp * level) : h), (s = Math.max(0, s + RAMP.satUp * level));
  else {
    // (Warm colours, skin above all, only a little: a flush of red reads as a wound.)
    const warm = h < 70 || h > 330;
    (l = Math.max(0.025, l + RAMP.down * level * (0.55 + l))), (s = Math.min(1, s - RAMP.satDown * level * (warm ? 0.3 : 1)));
    if (s > 0.05) h = toward(h, warm ? RAMP.coolWarm : RAMP.coolCold, -RAMP.hueDown * level * (warm ? 0.35 : 1));
  }
  return toRgb([h, s, l]);
}

/** `shade` as a colour string, for what is drawn in rects (a cape, herolife.ts). */
export function shadeHex(col: string, level: number): string {
  return '#' + shade(col, level).map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * The shade level of each filled pixel of a figure (`g`: its colour names by row, null where empty); `glow` pixels
 * are left at 0. Each piece (the pixels of one colour that touch) is a rounded thing lit from the top left: the near
 * part of each of its rows lit, the far part in shadow, its top lighter than its foot. On top of that the silhouette's
 * lit edge catches a rim and its far edge sinks, a piece's bottom and right edges against another piece crease, the
 * far side of the whole body falls further into shadow, and steel and gold push all of it harder and glint. Exported
 * for the test.
 */
export function levels(g: (string | null)[][], w: number, h: number, glow: (c: string) => boolean): number[][] {
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? g[y][x] : null);
  const out = g.map((r) => r.map(() => 0));
  // The pieces: same colour, touching side by side.
  const id = g.map((r) => r.map(() => -1));
  const pieces: { rows: Map<number, [number, number]>; top: number; bot: number }[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = g[y][x];
    if (!v || id[y][x] >= 0) continue;
    const pc = { rows: new Map<number, [number, number]>(), top: y, bot: y }, k = pieces.push(pc) - 1, st = [[x, y]];
    id[y][x] = k;
    while (st.length) {
      const [px, py] = st.pop()!;
      const r = pc.rows.get(py);
      pc.rows.set(py, r ? [Math.min(r[0], px), Math.max(r[1], px)] : [px, px]);
      (pc.top = Math.min(pc.top, py)), (pc.bot = Math.max(pc.bot, py));
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const qx = px + dx, qy = py + dy;
        if (at(qx, qy) === v && id[qy][qx] < 0) (id[qy][qx] = k), st.push([qx, qy]);
      }
    }
  }
  // Each row's span of the whole body.
  const span = g.map((r) => {
    let a = -1, b = -1;
    r.forEach((v, x) => v && (a < 0 && (a = x), (b = x)));
    return [a, b];
  });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = g[y][x];
    if (!v || glow(v)) continue;
    let nx = 0, ny = 0, ex = 0, ey = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const u = at(x + dx, y + dy);
      if (!u) (nx += dx), (ny += dy);
      else if (u !== v && !glow(u)) (ex += dx), (ey += dy);
    }
    let lv = 0;
    // The piece's roundness, across and down.
    const pc = pieces[id[y][x]], [a, b] = pc.rows.get(y)!;
    // (A small piece, a face or a hand, only darkens a little on its far side.)
    if (b - a >= 5) {
      const t = (x - a) / (b - a);
      lv += t < 0.3 ? 1 : t > 0.66 ? -1 : 0;
    } else if (b - a >= 2 && x === b) lv -= 0.5;
    if (pc.bot - pc.top >= 3) {
      const t = (y - pc.top) / (pc.bot - pc.top);
      lv += t < 0.18 ? 0.5 : t > 0.82 ? -0.5 : 0;
    }
    // The silhouette: a rim where it faces the light, sinking where it faces away.
    const n = Math.hypot(nx, ny), toL = n ? (nx * L[0] + ny * L[1]) / n : 0;
    if (n) lv += toL > 0.35 ? 1 : toL < -0.35 ? -1 : 0;
    // A crease where this piece's bottom or right edge lies against another piece.
    const e = Math.hypot(ex, ey);
    if (e && (ex * L[0] + ey * L[1]) / e < -0.3) lv -= 1;
    // The far side of the whole body.
    const [sa, sb] = span[y];
    if (sb - sa >= 4 && (x - sa) / (sb - sa) > 0.75) lv -= 0.5;
    if (metal(v)) {
      lv *= METAL.gain;
      // A glint where the light first strikes the piece: its top-left pixel in each lit row, facing out to the light.
      if (x === a && (y - pc.top) / Math.max(1, pc.bot - pc.top) < 0.5 && (toL > 0.3 || (e && (ex * L[0] + ey * L[1]) / e > 0.3))) lv = METAL.glint;
    }
    out[y][x] = Math.max(-2.4, Math.min(2.6, lv));
  }
  return out;
}

/** The sprite painted the sharper way: as `makeSprite`, a one-pixel outline round it, its white silhouette and glow. */
export function paintSharp(g: (string | null)[][], w: number, h: number, outline: string, glowSet: Set<string>): Sprite {
  const W = w + 2, H = h + 2;
  const c = document.createElement('canvas'), white = document.createElement('canvas');
  (c.width = white.width = W), (c.height = white.height = H);
  const cx = c.getContext('2d')!, wx = white.getContext('2d')!;
  const img = cx.createImageData(W, H), wimg = wx.createImageData(W, H);
  const glow: Sprite['glow'] = [];
  const set = (im: ImageData, x: number, y: number, [r, gg, b]: [number, number, number]) => {
    const i = (y * W + x) * 4;
    (im.data[i] = r), (im.data[i + 1] = gg), (im.data[i + 2] = b), (im.data[i + 3] = 255);
  };
  const lv = levels(g, w, h, (v) => glowSet.has(v));
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && g[y][x] !== null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = g[y][x];
    if (!v) continue;
    set(img, x + 1, y + 1, glowSet.has(v) ? hex(v) : shade(v, Math.round(lv[y][x] * 2) / 2));
    set(wimg, x + 1, y + 1, [255, 255, 255]);
    if (glowSet.has(v)) glow.push([x + 1, y + 1, v]);
  }
  const o = hex(outline);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (filled(x - 1, y - 1)) continue;
    if (filled(x, y - 1) || filled(x - 2, y - 1) || filled(x - 1, y) || filled(x - 1, y - 2)) set(img, x, y, o), set(wimg, x, y, [255, 255, 255]);
  }
  cx.putImageData(img, 0, 0);
  wx.putImageData(wimg, 0, 0);
  return { c, white, w: W, h: H, glow };
}
