/**
 * Worn armour on the hero (docs/design/gear-looks.md slice 3): the body piece's weight shows at the shoulders
 * and neck, the legs piece's on the shins, in the piece's tier (weaponlook.ts recolours them as it does a
 * weapon's: plain dull iron and plain leather, fine bright steel, forged dark steel, the cursed tiers
 * blackening and veined).
 * - heavy: plate pauldrons on both shoulders with a rivet, a plate gorget; greaves with a knee cop.
 * - medium: a mail mantle over the shoulders and neck; mail on the shins.
 * - light: a leather collar and leather bracers; leather wraps on the shins.
 * Made from each body's own pixels: a second figure in parts (joints.ts) holding only the armour's pixels,
 * laid over the body's inside pixels (never its outline, so every look keeps its silhouette), each in a
 * tone matching the shading under it. It's drawn by `drawFigure` right after the body, so it walks, leans,
 * crouches and turns with it, front, back and side, for every class and look. A named body piece (a unique,
 * the Hungry apron and coat) is its own thing: namedarmour.ts. A worn ring goes on the off hand: ringlook.ts.
 * Drawing only.
 */
import type { Hero } from '../sim/types';
import { legsLook, packArmour, packRing, ringLook, wornLook, type ArmourLook, type RingLook } from '../shared/gearlook';
import { glinting, handOf, ringGlint, ringStuff } from './ringlook';
import type { Ctx } from './draw';
import { drawFigure } from './figure';
import type { Joint, JointKind, Jointed } from './joints';
import type { BodyPose } from './motion';
import { tintPixel } from './weaponlook';
import { NAMED_ARMOUR } from './namedarmour';

// Today's weapon art's colours, by role (weaponlook.ts), so a tier recolours armour the way it does a weapon.
const PLATE = ['#6a727c', '#8a929c', '#aab2be'], MAIL = ['#6a727c', '#9aa4ae'], RIVET = '#d4a537', LEATHER = ['#4a3420', '#8b6a3a'];

type Rgba = Uint8ClampedArray;
const read = (cv: HTMLCanvasElement, w: number, h: number) => cv.getContext('2d')!.getImageData(0, 0, w, h).data;
/** How light a pixel is, picked into three tones (the body's shading under the armour). */
const tone = (d: Rgba, i: number) => { const l = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255; return l > 0.42 ? 2 : l > 0.18 ? 1 : 0; };
/** A pale, colourless pixel (a beard, white trim): left as it is, so the armour goes round it. */
const pale = (d: Rgba, i: number) => Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 34 && d[i] + d[i + 1] + d[i + 2] > 420;

/** The armour's colour at a pixel of a part (`r`: its row from the part's top, `rb`: from its bottom), or none. */
function paint(kind: JointKind, a: ArmourLook | null, l: ArmourLook | null, r: number, rb: number, legRows: number, x: number, t: number): string | null {
  const arm = kind === 'arm' || kind === 'back';
  if (a && kind === 'torso') {
    if (a.weight === 'heavy' && r < 2) return PLATE[r === 0 ? 2 : Math.min(1, t)];
    if (a.weight === 'medium' && r < 3) return MAIL[(x + r) % 2] ?? null;
    if (a.weight === 'light' && r < 2) return LEATHER[1 - r];
  }
  if (a && arm) {
    if (a.weight === 'heavy' && r < 3) return r === 0 ? PLATE[2] : PLATE[r === 2 ? 0 : Math.min(1, t)];
    if (a.weight === 'medium' && r < 2) return MAIL[(x + r) % 2];
    if (a.weight === 'light' && (rb === 3 || rb === 4)) return LEATHER[rb === 4 ? 1 : 0];
  }
  if (l && (kind === 'legL' || kind === 'legR') && legRows >= 6) {
    // The shin: below the knee, above the boots (the bottom two rows).
    const knee = Math.ceil(legRows * 0.45);
    if (r < knee || rb < 2) return null;
    if (l.weight === 'heavy') return r === knee ? PLATE[2] : PLATE[Math.min(1, t)];
    if (l.weight === 'medium') return MAIL[(x + r) % 2];
    return (r - knee) % 2 ? null : LEATHER[1];
  }
  return null;
}

/** The look a tier tints: a unique's piece is itself, so clean steel (its own look is to come), not PRE-WAR's. */
const tintLook = (l: ArmourLook) => ({ tier: l.named && l.tier === 'tolmouth' ? ('fine' as const) : l.tier });

function canvas(px: Rgba, w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  (cv.width = w), (cv.height = h);
  cv.getContext('2d')!.putImageData(new ImageData(px as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
  return cv;
}
const hex = (s: string, out: Rgba, i: number) => { for (let k = 0; k < 3; k++) out[i + k] = parseInt(s.slice(1 + 2 * k, 3 + 2 * k), 16); out[i + 3] = 255; };

/** The armour figure for a body, made once per body and look, then kept (null: nothing shows). */
const made = new WeakMap<Jointed, Map<string, Jointed | null>>();
export function armourOn(body: Jointed, a: ArmourLook | null, l: ArmourLook | null, ring: RingLook | null = null, glint = false): Jointed | null {
  let m = made.get(body);
  if (!m) made.set(body, (m = new Map()));
  const key = packArmour(a) + '|' + packArmour(l) + '|' + packRing(ring) + (glint ? '*' : '');
  if (m.has(key)) return m.get(key)!;
  const { w: W, h: H } = body.s, full = read(body.s.c, W, H), ta = a && tintPixel(tintLook(a)), tl = l && tintPixel(tintLook(l));
  const inside = (X: number, Y: number) => X > 0 && Y > 0 && X < W - 1 && Y < H - 1 && [0, 4, -4, W * 4, -W * 4].every((d) => full[(Y * W + X) * 4 + d + 3] > 0);
  const all = new Uint8ClampedArray(W * H * 4), parts: Joint[] = [], glows: [number, number, string][] = [];
  // The ring's hand: the off arm's (facing you or away), else the near arm's (in profile, the far one's behind the body).
  const ringOn = ring && (body.parts.some((q) => q.kind === 'back') ? 'back' : 'arm');
  for (const p of body.parts) {
    const own = read(p.c, W, H), out = new Uint8ClampedArray(W * H * 4), legRows = p.y1 - p.y0;
    let any = false;
    for (let Y = p.y0; Y < p.y1; Y++) for (let X = p.x0; X < p.x1; X++) {
      const i = (Y * W + X) * 4;
      if (!own[i + 3] || !inside(X, Y) || pale(own, i)) continue;
      const r = Y - p.y0, rb = p.y1 - 1 - Y, t = tone(own, i), leg = p.kind === 'legL' || p.kind === 'legR';
      // A named body piece says its own colour first (namedarmour.ts), else its weight's look.
      const own_ = !leg && a?.named ? NAMED_ARMOUR[a.named]?.({ kind: p.kind, r, rb, cx: (X - p.x0) / Math.max(1, p.x1 - p.x0 - 1), t, n: (X * 7 + Y * 13 + ((X * Y) % 5)) }) : undefined;
      const col = own_ !== undefined ? own_ : paint(p.kind, a, l, r, rb, legRows, X, t);
      if (!col) continue;
      const tint = leg ? tl : ta;
      hex(tint ? tint(col, X, Y) : col, out, i);
      hex(tint ? tint(col, X, Y) : col, all, i);
      any = true;
    }
    const glow: [number, number, string][] = [];
    if (ring && p.kind === ringOn) {
      const at = handOf(p, inside, own, W);
      if (at) {
        const i = (at[1] * W + at[0]) * 4;
        hex(ringStuff(ring), out, i), hex(ringStuff(ring), all, i), (any = true);
        // The glint: a small four-point sparkle, white at the middle, the tier's colour round it.
        if (glint) glow.push([at[0], at[1], '#ffffff'], ...([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).map(([dx, dy]): [number, number, string] => [at[0] + dx, at[1] + dy, ringGlint(ring)]));
      }
    }
    if (!any) continue;
    glows.push(...glow);
    const white = new Uint8ClampedArray(out);
    for (let i = 0; i < white.length; i += 4) if (white[i + 3]) white[i] = white[i + 1] = white[i + 2] = 255;
    parts.push({ ...p, c: canvas(out, W, H), white: canvas(white, W, H), glow });
  }
  const whiteAll = new Uint8ClampedArray(all);
  for (let i = 0; i < whiteAll.length; i += 4) if (whiteAll[i + 3]) whiteAll[i] = whiteAll[i + 1] = whiteAll[i + 2] = 255;
  const j = parts.length ? { s: { c: canvas(all, W, H), white: canvas(whiteAll, W, H), w: W, h: H, glow: glows }, parts, cut: body.cut } : null;
  m.set(key, j);
  return j;
}

const POSE = {} as BodyPose;
const seed = (id: string) => [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
/** Draw what the hero wears over the body just drawn (after `layout` and `drawFigure` for that body). */
export function drawArmour(c: Ctx, h: Hero, body: Jointed, x: number, y: number, p: BodyPose): void {
  const a = wornLook(h), l = legsLook(h), ring = ringLook(h);
  if (!a && !l && !ring) return;
  const j = armourOn(body, a, l, ring, !!ring && glinting(c.now, seed(h.id)));
  // (The body already left its afterimage; the armour takes the pose's flash with it.)
  if (j) drawFigure(c, j, x, y, Object.assign(POSE, p, { ghost: 0 }));
}
