/**
 * Light and air in 2.5D (docs/design/lived-in-world.md slice 4, after Riteborn's warm-in-cool): a dark vignette at
 * the screen's edges, and a soft warm haze round each lit lamp and lit window, both laid on in the post pass
 * (post.ts) in fine steps with a light dither (Kyle, 2026-11-16: not too noisy), so neither adds a checker of its
 * own. The haze comes from the lamps themselves, not from everything that glows, so a telegraph's edge never blooms past where it is. A body well in front of a lamp
 * stays clear of its haze (by depth). `?air=0` in the address turns both off, to compare. Only draws.
 */
import * as THREE from 'three';
import type { L3 } from './lights3d';

export const HALO_MAX = 16;
export const AIR = typeof location === 'undefined' || new URLSearchParams(location.search).get('air') !== '0';

/** How dark the vignette's corners go: by night, and by day or indoors under the sun. */
const VIG = { night: 0.62, day: 0.38 };
/** A lamp's haze: reach (tiles round its flame) and strength over its light's. A window's, smaller and fainter. */
const LAMP = { r: 2.7, k: 0.34 };
const PANE = { r: 1.3, k: 0.24, c: [1, 0.74, 0.42] as const };

/** The post pass's lines: `airHalo` (warm haze added) and `airVig` (how much to darken), both in low-res pixels. */
export const AIR_GLSL = `
uniform vec4 uHalo[${HALO_MAX}]; uniform vec4 uHaloC[${HALO_MAX}]; uniform int uHN; uniform float uVig;
vec3 airHalo(vec2 px, float dHere, float bz){
  vec3 h = vec3(0.0);
  for (int i = 0; i < ${HALO_MAX}; i++) {
    if (i >= uHN) break;
    vec4 s = uHalo[i];
    float k = 1.0 - length(px - s.xy) / s.z;
    if (k <= 0.0 || dHere < s.w - 1.5) continue;
    h += uHaloC[i].rgb * uHaloC[i].a * k * k;
  }
  float L = max(max(h.r, h.g), h.b);
  if (L <= 0.0) return h;
  float q = floor(min(L, 0.5) * 16.0 + bz * 0.5 + 0.5) / 16.0;
  return h * (q / L);
}
float airVig(vec2 px, vec2 res, float bz){
  vec2 v = (px + 0.5) / res * 2.0 - 1.0;
  float t = clamp((length(v * vec2(1.0, 0.92)) - 0.5) / 0.8, 0.0, 1.0);
  return uVig * clamp(floor(t * t * 8.0 + bz * 0.5 + 0.5) / 8.0, 0.0, 1.0);
}`;

export function airUniforms(): Record<string, THREE.IUniform> {
  return {
    uHalo: { value: Array.from({ length: HALO_MAX }, () => new THREE.Vector4()) },
    uHaloC: { value: Array.from({ length: HALO_MAX }, () => new THREE.Vector4()) },
    uHN: { value: 0 },
    uVig: { value: 0 },
  };
}

interface Src { x: number; y: number; z: number; r: number; c: readonly number[]; k: number }
const v = new THREE.Vector3();

/**
 * This frame's haze and vignette into the post pass's uniforms. `lamps`: the lit lamps' and fires' lights (fixed
 * ones only, not spells); `panes`: lit windows (world positions); `day`: under the sun.
 */
export function placeAir(u: Record<string, THREE.IUniform>, cam: THREE.Camera, W: number, H: number, ppu: number, near: number, far: number, lamps: L3[], panes: THREE.Vector3[], day: boolean, at: THREE.Vector3): void {
  if (!AIR) return void ((u.uHN.value = 0), (u.uVig.value = 0));
  u.uVig.value = day ? VIG.day : VIG.night;
  const src: Src[] = [];
  for (const l of lamps) if (l.i > 0.05) src.push({ x: l.x, y: l.y, z: l.z, r: LAMP.r, c: l.c, k: LAMP.k * Math.min(1.3, l.i) });
  for (const p of panes) src.push({ x: p.x, y: p.y, z: p.z, r: PANE.r, c: PANE.c, k: PANE.k });
  // Nearest the middle of the view first; one haze where several sit together (a house's row of windows).
  src.sort((a, b) => Math.hypot(a.x - at.x, a.z - at.z) - Math.hypot(b.x - at.x, b.z - at.z));
  const hs = u.uHalo.value as THREE.Vector4[], hc = u.uHaloC.value as THREE.Vector4[], kept: Src[] = [];
  let n = 0;
  for (const s of src) {
    if (n >= HALO_MAX) break;
    if (kept.some((o) => Math.hypot(o.x - s.x, o.y - s.y, o.z - s.z) < 0.7)) continue;
    v.set(s.x, s.y, s.z).project(cam);
    const sx = ((v.x + 1) / 2) * W, sy = ((v.y + 1) / 2) * H, R = s.r * ppu;
    if (sx < -R || sx > W + R || sy < -R || sy > H + R) continue;
    kept.push(s);
    hs[n].set(sx, sy, R, near + ((v.z + 1) / 2) * (far - near));
    hc[n].set(s.c[0], s.c[1], s.c[2], s.k);
    n++;
  }
  u.uHN.value = n;
}
