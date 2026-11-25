/**
 * Send only part of a canvas texture to the graphics card (Kyle, 2026-11-25: big maps smooth on the phone).
 *
 * three.js sends a CanvasTexture whole whenever it is marked `needsUpdate`. Two did that far too often: the floor
 * (1120 by 1152 on the north fields) on every splash of blood, and the figures' atlas (1280 by 576, and its glow)
 * every frame. Measured in four seconds of a fight: about a gigabyte sent. This sends the changed rectangles
 * instead, straight through WebGL, the way three.js would (same unpack settings), and falls back to the whole
 * texture when it has not been sent yet or a full send is already due.
 */
import * as THREE from 'three';

let renderer: THREE.WebGLRenderer | null = null;
let scratch: HTMLCanvasElement | null = null;

/** The view's renderer (view3d.ts), once it exists. */
export function patchWith(r: THREE.WebGLRenderer): void {
  renderer = r;
}

export interface Rect { x: number; y: number; w: number; h: number }

/** Grow `r` to take in another rectangle (null for none yet). */
export const unite = (r: Rect | null, x: number, y: number, w: number, h: number): Rect => {
  if (!r) return { x, y, w, h };
  const x0 = Math.min(r.x, x), y0 = Math.min(r.y, y);
  return { x: x0, y: y0, w: Math.max(r.x + r.w, x + w) - x0, h: Math.max(r.y + r.h, y + h) - y0 };
};

/** Send these rectangles of `tex`'s canvas (canvas pixels, y down). Falls back to a whole send when it must. */
export function patchTexture(tex: THREE.CanvasTexture, rects: Rect[]): void {
  const cv = tex.image as HTMLCanvasElement, props = renderer && (renderer.properties.get(tex) as { __webglTexture?: WebGLTexture; __version?: number });
  // Not on the card yet, or a whole send already waiting (a resize, a first frame): let three.js do it.
  if (!renderer || !props?.__webglTexture || props.__version !== tex.version) return void (tex.needsUpdate = true);
  const gl = renderer.getContext() as WebGL2RenderingContext;
  renderer.state.activeTexture(gl.TEXTURE0);
  renderer.state.bindTexture(gl.TEXTURE_2D, props.__webglTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, tex.flipY);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, tex.premultiplyAlpha);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, tex.unpackAlignment);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  const W = cv.width, H = cv.height;
  for (const r of rects) {
    const x = Math.max(0, Math.floor(r.x)), y = Math.max(0, Math.floor(r.y));
    const w = Math.min(W - x, Math.ceil(r.x + r.w) - x), h = Math.min(H - y, Math.ceil(r.y + r.h) - y);
    if (w <= 0 || h <= 0) continue;
    const s = (scratch ??= document.createElement('canvas'));
    if (s.width !== w || s.height !== h) (s.width = w), (s.height = h);
    const g = s.getContext('2d')!;
    g.clearRect(0, 0, w, h);
    g.drawImage(cv, x, y, w, h, 0, 0, w, h);
    // A flipped texture keeps the canvas's top row at the top of the texture's rows: its y counts from the bottom.
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, tex.flipY ? H - y - h : y, gl.RGBA, gl.UNSIGNED_BYTE, s);
  }
}
