/**
 * Dark and gold, slice 2 (docs/design/dark-gold.md): every enemy drawn through a lit layer that grades what it
 * paints (darkgold.ts's 'foe' rules). One wrapper round strawman.ts drawFoe, so goblins, their kits, butchers,
 * beasts and bosses all come out in rust, bone, black leather and dirty iron in both views (the flat scene and the
 * 2.5D cards) without a colour changed in their own files. Their shapes, the glow layer (eyes, telegraphs, flashes)
 * and anything the room decides are untouched. gobpen.ts is the same idea for size.
 */
import type { Ctx } from './draw';
import { gradeCanvas, graded } from './darkgold';

const css = new Map<string, string>();
/** A fill or stroke colour graded; gradients, patterns and names other than hex or rgb() pass as they are. */
function gradeStyle(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  let o = css.get(v);
  if (o !== undefined) return o;
  o = v;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v), fn = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i.exec(v);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    o = '#' + graded(parseInt(h, 16), 'foe').toString(16).padStart(6, '0');
  } else if (fn) {
    const g = graded((+fn[1] << 16) | (+fn[2] << 8) | +fn[3], 'foe');
    o = `rgba(${g >> 16},${(g >> 8) & 255},${g & 255},${fn[4] === undefined ? 1 : fn[4]})`;
  }
  css.set(v, o);
  return o;
}

const copies = new WeakMap<object, HTMLCanvasElement>();
/** A sprite's canvas graded, made once (only small, made-once canvases reach a foe's lit layer: blitPose's s.c). */
function gradeImage(img: CanvasImageSource): CanvasImageSource {
  if (!(img instanceof HTMLCanvasElement) || img.width > 256 || img.height > 256) return img;
  let g = copies.get(img);
  if (!g) {
    g = document.createElement('canvas');
    (g.width = img.width), (g.height = img.height);
    g.getContext('2d')!.drawImage(img, 0, 0);
    gradeCanvas(g, 'foe');
    copies.set(img, g);
  }
  return g;
}

const wrapped = new WeakMap<CanvasRenderingContext2D, CanvasRenderingContext2D>();
function darkLayer(raw: CanvasRenderingContext2D): CanvasRenderingContext2D {
  let p = wrapped.get(raw);
  if (p) return p;
  p = new Proxy(raw, {
    get(t, k) {
      if (k === 'drawImage') return (img: CanvasImageSource, ...a: number[]) => (t.drawImage as (...x: unknown[]) => void)(gradeImage(img), ...a);
      const v = Reflect.get(t, k, t);
      return typeof v === 'function' ? v.bind(t) : v;
    },
    set(t, k, v) {
      return Reflect.set(t, k, k === 'fillStyle' || k === 'strokeStyle' ? gradeStyle(v) : v, t);
    },
  });
  wrapped.set(raw, p);
  return p;
}

/** `c` with its lit layer grading what an enemy paints on it (the glow layer as it is). */
export const darkFoe = (c: Ctx): Ctx => ({ ...c, lit: darkLayer(c.lit) });
