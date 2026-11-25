/**
 * A figure's drawing, kept as a list instead of drawn at once (Kyle, 2026-11-25: "Do number 2 make sure it works for
 * multiplayer": skip redrawing a figure when nothing about it changed).
 *
 * Each frame every figure is drawn by its own code into its cell of the atlas (figs3d.ts), and the cell is sent to the
 * graphics card. Most frames a figure's picture is the same as the last: a sprite's frame lasts several screen frames,
 * and moving across the floor moves the card, not the picture. So the drawing goes through a stand-in for the two
 * canvases that writes down every call and every setting and hashes them as it goes. The same calls with the same
 * arguments (and the same images) make the same pixels: when the hash matches the cell's last, the cell is left as it
 * is and nothing is sent. Otherwise the list is played onto the real canvases.
 *
 * It sees only what is drawn, so it is right for anything drawn the same way: a friend's hero in a party, a guest's
 * view of the leader's room, a goblin on any page. A drawing that reads pixels back or asks the canvas for something
 * this does not know stops the recording (`Abort`), and that figure is drawn the old way that frame.
 */

/** A call or a setting, on the lit (0) or glow (1) canvas. */
type Op = { l: 0 | 1; m: string; a: unknown[] } | { l: 0 | 1; s: string; v: unknown };

/** What a figure's drawing came to: its operations and their hash (two 32-bit lanes). */
export interface Rec { ops: Op[]; h1: number; h2: number }

/** Thrown out of a drawing this can't record; the caller draws it for real. */
export class Abort extends Error {}

/** The drawing calls that leave nothing to read back: recorded and played later, in order. */
const PLAY = new Set([
  'fillRect', 'drawImage', 'clearRect', 'fill', 'save', 'restore', 'beginPath', 'lineTo', 'translate', 'putImageData',
  'rotate', 'moveTo', 'setTransform', 'rect', 'scale', 'clip', 'ellipse', 'arc', 'stroke', 'fillText', 'strokeRect',
  'quadraticCurveTo', 'bezierCurveTo', 'closePath', 'strokeText', 'setLineDash', 'resetTransform', 'transform', 'roundRect',
]);
/** Calls that only make something new from their arguments: passed straight through (their result is a new object each
 *  time, so a drawing that uses one is simply drawn every frame). */
const MAKE = new Set(['createLinearGradient', 'createRadialGradient', 'createPattern']);

const f64 = new Float64Array(1), u32 = new Uint32Array(f64.buffer);
const ids = new WeakMap<object, number>();
let nextId = 1;
const strs = new Map<string, number>();

/** Fold `v` into the running hash. */
function mix(r: Rec, v: unknown): void {
  let a: number, b: number;
  if (typeof v === 'number') (f64[0] = v), (a = u32[0]), (b = u32[1]);
  else if (typeof v === 'string') {
    let h = strs.get(v);
    if (h === undefined) {
      h = 2166136261;
      for (let i = 0; i < v.length; i++) h = Math.imul(h ^ v.charCodeAt(i), 16777619);
      if (strs.size > 4096) strs.clear();
      strs.set(v, h);
    }
    (a = h), (b = v.length);
  } else if (typeof v === 'boolean' || v === undefined || v === null) (a = v === true ? 1 : v === false ? 2 : 3), (b = 7);
  else if (Array.isArray(v)) {
    for (const x of v) mix(r, x);
    (a = v.length), (b = 11);
  } else {
    let id = ids.get(v as object);
    if (id === undefined) ids.set(v as object, (id = nextId++));
    // A canvas is the same picture only if nothing has drawn into it since: its count (`watchCanvases`).
    (a = id), (b = 13 + (((v as Record<string, number>)[DRAWN] ?? 0) | 0) * 31);
  }
  r.h1 = Math.imul(r.h1 ^ a, 16777619) ^ (r.h1 >>> 13);
  r.h2 = Math.imul(r.h2 ^ b ^ a, 2246822519) ^ (r.h2 >>> 15);
}

/** On a canvas: how many times anything has drawn into it (`watchCanvases`). */
const DRAWN = '__drawnCount';

/**
 * Count every drawing into every canvas, once for the page: a sprite or a scratch canvas drawn into a figure is the
 * same image only if its count has not moved, so a figure built from a canvas someone repaints is redrawn.
 */
export function watchCanvases(): void {
  const P = typeof CanvasRenderingContext2D !== 'undefined' ? (CanvasRenderingContext2D.prototype as unknown as Record<string, unknown>) : null;
  if (!P || P[DRAWN]) return;
  P[DRAWN] = 1;
  for (const m of ['fillRect', 'clearRect', 'drawImage', 'putImageData', 'fill', 'stroke', 'fillText', 'strokeText', 'strokeRect']) {
    const o = P[m] as (...a: unknown[]) => unknown;
    P[m] = function (this: CanvasRenderingContext2D, ...a: unknown[]) {
      const c = this.canvas as unknown as Record<string, number>;
      c[DRAWN] = (c[DRAWN] | 0) + 1;
      return o.apply(this, a);
    };
  }
}

/** A new, empty recording. */
export const newRec = (): Rec => ({ ops: [], h1: 2166136261, h2: 3266489917 });

/**
 * A stand-in for `real` that records into `r` as layer `l`. Settings read back give what was set during this drawing
 * (kept through save and restore), else the real canvas's.
 */
export function recorder(real: CanvasRenderingContext2D, r: Rec, l: 0 | 1): CanvasRenderingContext2D {
  const stack: Map<string, unknown>[] = [new Map()];
  const top = () => stack[stack.length - 1];
  return new Proxy(real, {
    get(t, prop: string) {
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].has(prop)) return stack[i].get(prop);
      const v = (t as unknown as Record<string, unknown>)[prop];
      if (typeof v !== 'function') return v;
      if (PLAY.has(prop))
        return (...a: unknown[]) => {
          r.ops.push({ l, m: prop, a });
          mix(r, prop), mix(r, l), mix(r, a);
          if (prop === 'save') stack.push(new Map(top()));
          else if (prop === 'restore' && stack.length > 1) stack.pop();
        };
      if (MAKE.has(prop)) return (v as (...a: unknown[]) => unknown).bind(t);
      if (prop === 'measureText')
        return (s: string) => {
          // The width a text will take, in the font set during this drawing.
          const font = top().get('font');
          if (font === undefined) return t.measureText(s);
          const was = t.font;
          t.font = font as string;
          const m = t.measureText(s);
          t.font = was;
          return m;
        };
      throw new Abort(prop);
    },
    set(_t, prop: string, v) {
      top().set(prop, v);
      r.ops.push({ l, s: prop, v });
      mix(r, prop), mix(r, l), mix(r, v);
      return true;
    },
  }) as CanvasRenderingContext2D;
}

/** Play a recording onto the real canvases. */
export function play(r: Rec, lit: CanvasRenderingContext2D, glow: CanvasRenderingContext2D): void {
  for (const op of r.ops) {
    const g = (op.l ? glow : lit) as unknown as Record<string, unknown>;
    if ('s' in op) g[op.s] = op.v;
    else (g[op.m] as (...a: unknown[]) => void).apply(g, op.a);
  }
}
