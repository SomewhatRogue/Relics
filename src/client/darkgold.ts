/**
 * Dark and gold (docs/design/dark-gold.md): the world's colours pulled to Kyle's reference pictures in one
 * place, rather than in every painter. Cool violet-grey stone becomes one slate (green-grey until 2026-11-17:
 * docs/design/graphics-overhaul.md), timber goes darker and
 * duller, red roof tiles turn to slate and red cloth to rust. Bright things (lit windows, gold lettering,
 * flames) are left as they are, so the accent still reads. Applied once to what's painted and cached (the
 * map's floor, each block's canvas) and to the 2.5D buildings' vertex colours (three/darkgold3d.ts).
 * Cosmetic only.
 */

/** Which rules apply: the ground (stone only), a wall or furniture, a roof (slate), an enemy (foeHex), a townsman (folkHex). */
export type Grade = 'floor' | 'wall' | 'roof' | 'foe' | 'folk';

/** Moss in the joints and on the roofs, darkest first. */
export const MOSS = ['#2c3820', '#34421f', '#3e4c26', '#4a5a2c'];

function hsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255, g /= 255, b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 1e-6) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function rgb(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const k = (v: number) => Math.max(0, Math.min(255, Math.round((v + m) * 255)));
  return (k(r) << 16) | (k(g) << 8) | k(b);
}

/** Stone's hue: slate. (Dark and gold had it at 90, a green-grey.) */
const STONE_HUE = 214;

/** The stone family: violet, blue and plain greys. */
const greyish = (h: number, s: number, l: number) => l > 0.04 && l < 0.82 && (s < 0.06 || (s < 0.3 && h >= 190 && h <= 335));

/** One colour (0xrrggbb) under a grade. */
export function gradeHex(c: number, mode: Grade): number {
  const [h, s, l] = hsl((c >> 16) & 255, (c >> 8) & 255, c & 255);
  if (mode === 'foe') return foeHex(c, h, s, l);
  if (mode === 'folk') return folkHex(c, h, s, l);
  if (greyish(h, s, l)) {
    // Stone is a cool slate (Kyle, 2026-11-17, graphics-overhaul.md slice 2: off dark and gold's green-grey, which
    // left the whole town one olive by day; moss stays green, as the accent). Roofs of grey stone or lead a step
    // darker and bluer, so a roof still parts from the wall under it.
    if (mode === 'roof') return rgb(STONE_HUE + 8, Math.min(0.19, 0.09 + s * 0.5), l * 0.82);
    return rgb(STONE_HUE - 4 + (h % 9), Math.min(0.14, 0.06 + s * 0.45), l * (0.96 - 0.15 * l));
  }
  if (mode === 'floor') return c;
  const red = (h < 14 || h > 335) && s > 0.2 && l < 0.62;
  if (red) return mode === 'roof' ? rgb(206, 0.15, l * 0.82) : rgb(16, s * 0.62, l * 0.8);
  // Gold and brass stay as they are: the accent.
  if (h >= 36 && h <= 56 && s >= 0.35) return c;
  // Timber and thatch: darker and duller, gone grey with age. (Not gold or cream: the accent stays.)
  if (h >= 14 && h <= 55 && s > 0.12 && l < 0.5) return rgb(26 + (h - 26) * 0.4, s * 0.62, l * 0.78);
  // Painted greens (shutters, doors) dull to the moss's colour.
  if (h > 70 && h < 170 && l < 0.5) return rgb(h * 0.8 + 18, s * 0.75, l * 0.88);
  return c;
}

/**
 * An enemy (slice 2): goblins keep their sickly greens and glowing eyes; the rest darkened to rust, bone, black
 * leather and dirty iron. Gold is the heroes' mark, so on a goblin it's dull bronze. Whites, and anything bright
 * and strong (a telegraph's red, fire, a spell), are left alone so the fight still reads.
 */
function foeHex(c: number, h: number, s: number, l: number): number {
  if (h >= 36 && h <= 60 && s > 0.45 && l > 0.3) return rgb(32, s * 0.35, l * 0.6);
  if (l > 0.78 || (s > 0.55 && l > 0.45)) return c;
  if (h > 60 && h < 165) return c;
  // Blood stays red (wounds show how hurt a foe is); duller reds, cloth and paint, go to rust.
  if ((h < 14 || h > 335) && s > 0.25) return s > 0.48 ? c : rgb(14, s * 0.7, l * 0.85);
  if (h >= 14 && h <= 60 && s > 0.1) return l > 0.48 ? rgb(40, Math.min(0.2, s * 0.4 + 0.05), l * 0.86) : rgb(24, s * 0.55, l * 0.66);
  if (s < 0.3) return rgb(40, Math.min(s, 0.07), l * 0.84);
  return rgb(h, s * 0.5, l * 0.7);
}

/**
 * The townsfolk (slice 4): the heroes' palette with no gold, so a hero still stands out in a crowd. Skin kept;
 * gold and brass dulled; blood kept; cloth, hair and leather darker and duller; whites to bone.
 */
function folkHex(c: number, h: number, s: number, l: number): number {
  if (h >= 15 && h <= 35 && s >= 0.2 && s <= 0.5 && l >= 0.33 && l <= 0.7) return c;
  if (h >= 36 && h <= 60 && s > 0.4 && l > 0.3) return rgb(34, s * 0.4, l * 0.62);
  if ((h < 14 || h > 335) && s > 0.62) return c;
  if (l > 0.8) return rgb(h, Math.min(s, 0.25) * 0.7, l * 0.86);
  if ((h < 14 || h > 335) && s > 0.2) return rgb(12, s * 0.65, l * 0.78);
  return rgb(h, s * 0.62, l * (l < 0.2 ? 0.9 : 0.78));
}

const memo: Record<Grade, Map<number, number>> = { floor: new Map(), wall: new Map(), roof: new Map(), foe: new Map(), folk: new Map() };
/** gradeHex, remembered (for painters that call it every frame). */
export const graded = (c: number, mode: Grade) => {
  const m = memo[mode];
  let v = m.get(c);
  if (v === undefined) m.set(c, (v = gradeHex(c, mode)));
  return v;
};

/** Grade a painted canvas in place: rows above `roofTo` as a roof, the rest as `mode`. */
export function gradeCanvas(cv: HTMLCanvasElement, mode: Grade, roofTo = 0): void {
  const g = cv.getContext('2d');
  if (!g || !cv.width || !cv.height) return;
  const img = g.getImageData(0, 0, cv.width, cv.height), d = img.data, W = cv.width;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const c = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2], v = graded(c, (i >> 2) / W < roofTo ? 'roof' : mode);
    if (v === c) continue;
    d[i] = v >> 16, d[i + 1] = (v >> 8) & 255, d[i + 2] = v & 255;
  }
  g.putImageData(img, 0, 0);
}

/** A '#rrggbb' graded (for painters that pick a colour by name). */
export const gradeCss = (s: string, mode: Grade) => '#' + graded(parseInt(s.slice(1, 7), 16), mode).toString(16).padStart(6, '0');

const done = new WeakSet<object>();
/** Grade a sprite's canvas the first time it's drawn as part of the world (a rock, a pillar, a well). */
export function gradeSprite<S extends { c: HTMLCanvasElement }>(s: S): S {
  if (s && !done.has(s)) done.add(s), gradeCanvas(s.c, 'wall');
  return s;
}
