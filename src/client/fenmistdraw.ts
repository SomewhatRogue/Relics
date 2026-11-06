/**
 * Fenmere's mist on screen (shared/fenmist.ts places it; the room judges it the same): up to MIST_MAX of
 * the banks nearest the camera, as ellipses in screen pixels, handed to the lighting pass (light.ts) and
 * the 2.5D post pass (three/post.ts). Both lay it only over the lit layer, in stepped dithered bands, never
 * over the glowing one: telegraphs, eyes and fire show through it whole. Your own hero's ground stays clear.
 */
import type { GameMap } from '../shared/arena';
import { bankAt } from '../shared/fenmist';
import { MIST } from '../shared/tuning';

export const MIST_MAX = 8;
/** One frame's mist: banks (x, y, rx in px, thickness), how many, the y squash, your hero's clear ground (x, y, clear px, edge px), the colour. */
export interface MistU { banks: Float32Array; n: number; yr: number; hero: [number, number, number, number]; c: [number, number, number] }

/**
 * The GLSL for how thick the mist lies at screen pixel `px` (stepped into bands, 0 to 1). Each pass mixes a
 * lit pixel toward uMC by it only where nothing glows within MIST_KEEP pixels (`glowNear` is the pass's own),
 * so a telegraph's whole footprint, dithered or not, stays clear.
 */
export const MIST_KEEP = 2;
export const MIST_GLSL = `
uniform vec4 uMist[${MIST_MAX}]; uniform int uMN; uniform float uMY; uniform vec4 uMH; uniform vec3 uMC;
float mistK(vec2 px, float bz){
  if (uMN == 0) return 0.0;
  float mk = 0.0;
  for (int i = 0; i < ${MIST_MAX}; i++) {
    if (i >= uMN) break;
    vec4 M = uMist[i]; vec2 d = (px - M.xy) / vec2(M.z, M.z * uMY);
    mk = max(mk, M.w * clamp((1.0 - dot(d, d)) * 2.0, 0.0, 1.0));
  }
  mk *= clamp((length(px - uMH.xy) - uMH.z) / max(1.0, uMH.w - uMH.z), 0.0, 1.0);
  return clamp(floor(mk * 4.0 + bz * 0.9 + 0.5) / 4.0, 0.0, 1.0) * 0.88;
}
`;

/**
 * This frame's mist, or null off Fenmere. `at(x, y)` turns tiles into screen pixels; `ppu` pixels a tile;
 * `squash` how much the screen squashes the ground's depth (1 flat, the camera's tilt in 2.5D).
 */
export function mistFrame(m: GameMap, t: number, at: (x: number, y: number) => [number, number], ppu: number, squash: number, me: [number, number] | null, view: [number, number]): MistU | null {
  const banks = m.fen?.mist;
  if (!banks?.length) return null;
  const cx = view[0] / 2, cy = view[1] / 2;
  const qs = banks.map((b) => bankAt(b, t)).map((q) => ({ q, s: at(q.x, q.y) }));
  qs.sort((a, b) => Math.hypot(a.s[0] - cx, a.s[1] - cy) - Math.hypot(b.s[0] - cx, b.s[1] - cy));
  const out = new Float32Array(MIST_MAX * 4), n = Math.min(MIST_MAX, qs.length);
  for (let i = 0; i < n; i++) out.set([qs[i].s[0], qs[i].s[1], qs[i].q.r * ppu, qs[i].q.k], i * 4);
  const a = m.theme.ambient, lum = Math.min(1, (a[0] + a[1] + a[2]) / 3 + (m.theme.moon ?? 0) * 0.25), k = 0.32 + 0.6 * lum;
  const hero: [number, number, number, number] = me ? [me[0], me[1], MIST.clear * ppu, MIST.edge * ppu] : [-1e5, -1e5, 0, 1];
  return { banks: out, n, yr: MIST.squash * squash, hero, c: [0.66 * k, 0.7 * k, 0.74 * k] };
}
