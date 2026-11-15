/**
 * Dark and gold, slice 2 (docs/design/dark-gold.md): every enemy drawn through a lit layer that grades what it
 * paints (darkgold.ts's 'foe' rules). One wrapper round strawman.ts drawFoe, so goblins, their kits, butchers,
 * beasts and bosses all come out in rust, bone, black leather and dirty iron in both views (the flat scene and the
 * 2.5D cards) without a colour changed in their own files. Their shapes, the glow layer (eyes, telegraphs, flashes)
 * and anything the room decides are untouched. gobpen.ts is the same idea for size. The townsfolk go through it too
 * (`darkFolk`, slice 4), on their own rules.
 */
import type { Ctx } from './draw';
import { gradeCanvas, graded, type Grade } from './darkgold';

type Mode = Extract<Grade, 'foe' | 'folk'>;
const css: Record<Mode, Map<string, string>> = { foe: new Map(), folk: new Map() };
/** A fill or stroke colour graded; gradients, patterns and names other than hex or rgb() pass as they are. */
function gradeStyle(v: unknown, mode: Mode): unknown {
  if (typeof v !== 'string') return v;
  let o = css[mode].get(v);
  if (o !== undefined) return o;
  o = v;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v), fn = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i.exec(v);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    o = '#' + graded(parseInt(h, 16), mode).toString(16).padStart(6, '0');
  } else if (fn) {
    const g = graded((+fn[1] << 16) | (+fn[2] << 8) | +fn[3], mode);
    o = `rgba(${g >> 16},${(g >> 8) & 255},${g & 255},${fn[4] === undefined ? 1 : fn[4]})`;
  }
  css[mode].set(v, o);
  return o;
}

const copies: Record<Mode, WeakMap<object, HTMLCanvasElement>> = { foe: new WeakMap(), folk: new WeakMap() };
/** A sprite's canvas graded, made once (only small, made-once canvases reach these lit layers: blitPose's s.c). */
function gradeImage(img: CanvasImageSource, mode: Mode): CanvasImageSource {
  if (!(img instanceof HTMLCanvasElement) || img.width > 256 || img.height > 256) return img;
  let g = copies[mode].get(img);
  if (!g) {
    g = document.createElement('canvas');
    (g.width = img.width), (g.height = img.height);
    g.getContext('2d')!.drawImage(img, 0, 0);
    gradeCanvas(g, mode);
    copies[mode].set(img, g);
  }
  return g;
}

const wrapped: Record<Mode, WeakMap<CanvasRenderingContext2D, CanvasRenderingContext2D>> = { foe: new WeakMap(), folk: new WeakMap() };
function darkLayer(raw: CanvasRenderingContext2D, mode: Mode): CanvasRenderingContext2D {
  let p = wrapped[mode].get(raw);
  if (p) return p;
  p = new Proxy(raw, {
    get(t, k) {
      if (k === 'drawImage') return (img: CanvasImageSource, ...a: number[]) => (t.drawImage as (...x: unknown[]) => void)(gradeImage(img, mode), ...a);
      const v = Reflect.get(t, k, t);
      return typeof v === 'function' ? v.bind(t) : v;
    },
    set(t, k, v) {
      return Reflect.set(t, k, k === 'fillStyle' || k === 'strokeStyle' ? gradeStyle(v, mode) : v, t);
    },
  });
  wrapped[mode].set(raw, p);
  return p;
}

/** `c` with its lit layer grading what an enemy paints on it (the glow layer as it is). */
export const darkFoe = (c: Ctx): Ctx => ({ ...c, lit: darkLayer(c.lit, 'foe') });
/** The same for the townsfolk (slice 4): their own rules, no gold (npcs.ts drawNpc). */
export const darkFolk = (c: Ctx): Ctx => ({ ...c, lit: darkLayer(c.lit, 'folk') });
