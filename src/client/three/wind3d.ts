/**
 * The living world's landscape in 2.5D (../alive.ts, LIVING WORLD in the options box; docs/decisions/
 * new-look-characters.md). With it on, outdoors (a room with trees, bushes or water):
 * - the wind runs through the trees in gusts: leaf-green parts of the map's merged mesh (`VCOL`) above the trunk bend
 *   along the wind, the treetops most, bushes a little, with a quick flutter on top. The gust is ../alive.ts `gust`,
 *   the same sum, so a cape's hem stirs as the trees do;
 * - cloud shadows drift over the floor and everything on it, along the wind, their edges dithered (the pixel look);
 * - the water (water3d.ts) laps: foam along the bank coming and going, a thinner line rolling in, and light glinting
 *   on the surface here and there.
 * One set of uniforms shared by every material it touches; view3d.ts moves the time on each frame.
 */
import type * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { ALIVE, WIND } from '../alive';
import { VCOL } from './mats';

/** The shared uniforms: the time (seconds), whether it's on here (on, and outdoors). */
export const LIFE = { uLifeT: { value: 0 }, uLife: { value: 0 } };

/** Outdoors enough for wind and clouds: trees, bushes or water about. */
export function outdoors(m: GameMap): boolean {
  return m.rounds.some((r) => r.kind === 'tree' || r.kind === 'pine' || r.kind === 'bush' || r.kind === 'deadtree');
}

/** Each frame: the time on, and whether this room is living. */
export function lifeFrame(m: GameMap | null, now: number, hasWater: boolean): void {
  LIFE.uLifeT.value = now % 2000;
  LIFE.uLife.value = ALIVE.on && m && (hasWater || outdoors(m)) ? 1 : 0;
}

/** How much each thing moves and darkens. */
const K = { treeBend: 0.16, bushBend: 0.06, flutter: 0.012, cloudScale: 9, cloudDrift: 0.7, cloudDark: 0.2 };

export const LIFE_GLSL = /* glsl */ `
uniform float uLifeT; uniform float uLife;
float lifeGust(vec2 w, float t) {
  float along = dot(w, vec2(${WIND.dir[0]}, ${WIND.dir[1]}));
  float a = sin((along - t * ${WIND.speed.toFixed(3)}) / ${WIND.len[0].toFixed(2)} * 6.283);
  float b = sin((along - t * ${(WIND.speed * 0.6).toFixed(3)}) / ${WIND.len[1].toFixed(2)} * 6.283);
  float g = max(0.0, a * 0.6 + b * 0.55 - 0.15);
  return min(1.0, g * g * 1.6);
}
float lifeHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lifeNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lifeHash(i), lifeHash(i + vec2(1.0, 0.0)), f.x), mix(lifeHash(i + vec2(0.0, 1.0)), lifeHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float lifeCloud(vec2 w, float t) {
  vec2 p = (w - vec2(${WIND.dir[0]}, ${WIND.dir[1]}) * t * ${K.cloudDrift.toFixed(2)}) / ${K.cloudScale.toFixed(1)};
  float n = lifeNoise(p) * 0.65 + lifeNoise(p * 2.1 + 3.7) * 0.35;
  return smoothstep(0.5, 0.66, n);
}
`;

/** Chain an edit after whatever the material already does to its shaders (post.ts's toon). */
function chain(m: THREE.Material, edit: (sh: THREE.WebGLProgramParametersWithUniforms) => void, key: string): void {
  const before = m.onBeforeCompile.bind(m), keyBefore = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (sh, r) => (before(sh, r), edit(sh));
  m.customProgramCacheKey = () => keyBefore() + key;
  m.needsUpdate = true;
}

const shadows = (sh: THREE.WebGLProgramParametersWithUniforms, after: string) => {
  Object.assign(sh.uniforms, LIFE);
  sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec2 vLifeW;\nvoid main() {').replace('#include <project_vertex>', 'vLifeW = (modelMatrix * vec4(transformed, 1.0)).xz;\n#include <project_vertex>');
  sh.fragmentShader = sh.fragmentShader
    .replace('void main() {', LIFE_GLSL + 'varying vec2 vLifeW;\nvoid main() {')
    .replace(after, `${after}\nif (uLife > 0.5) { float cl = lifeCloud(vLifeW, uLifeT); diffuseColor.rgb *= 1.0 - ${K.cloudDark.toFixed(2)} * step(bay4(floor(gl_FragCoord.xy)) * 0.6 + 0.2, cl); }`);
};

/** The map's merged mesh's material: the trees bend in the wind; cloud shadows over it. */
export function windify(m: THREE.Material): void {
  chain(m, (sh) => {
    shadows(sh, '#include <color_fragment>');
    sh.vertexShader = sh.vertexShader.replace('void main() {', LIFE_GLSL + 'void main() {').replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_COLOR
if (uLife > 0.5) {
  vec3 cc = color.rgb;
  vec4 wp = modelMatrix * vec4(transformed, 1.0);
  float hgt = max(0.0, wp.y - 0.25);
  // Leaf green, above the trunk's foot: a treetop bends most, a bush a little, and flutters.
  if (cc.g > cc.r * 1.08 && cc.g > cc.b * 1.05 && cc.g > 0.05 && hgt > 0.0) {
    float g = lifeGust(wp.xz, uLifeT), k = hgt * (wp.y > 1.0 ? ${K.treeBend} : ${K.bushBend});
    transformed.xz += vec2(${WIND.dir[0]}, ${WIND.dir[1]}) * (g * k + ${K.flutter} * hgt * sin(uLifeT * 5.3 + wp.x * 1.7 + wp.z * 2.3) * (0.4 + g));
  }
}
#endif`);
  }, '|life');
}

/** A floor's material: cloud shadows over it. */
export function clouded(m: THREE.Material): void {
  chain(m, (sh) => shadows(sh, '#include <map_fragment>'), '|lifefloor');
}

/** The water's surface (water3d.ts's SURFACE, after its colour and before the blood): foam at the bank coming and
 *  going, a thin line rolling in from further out, glints. `P`: the surface pixel in tiles; `W.g`: how far from the
 *  bank (pixels x4); `bz`: the dither; `a`, `b`: along and across the current; `deep`. */
export const WATER_LIFE = /* glsl */ `
if (uLife > 0.5) {
  float shore = W.g * 255.0 / 4.0;
  float reach = 1.6 + 1.4 * (0.5 + 0.5 * sin(uLifeT * 1.3 + dot(P, vec2(1.7, 2.3))));
  if (shore < reach && bz < 0.75) col = mix(col, vec3(0.80, 0.87, 0.86), 0.7);
  float roll = abs(shore - (2.5 + 3.5 * fract(uLifeT * 0.28 + lifeHash(floor(P * 0.5)) * 0.3)));
  if (roll < 0.45 && bz > 0.3 && shore < 7.0) col = mix(col, vec3(0.64, 0.76, 0.78), 0.55);
  vec2 cell = floor(P * 16.0 / 3.0);
  float h = lifeHash(cell), tw = fract(h * 7.0 + uLifeT * (0.35 + h * 0.6));
  if (h > 0.94 && tw < 0.1) col = vec3(0.95, 0.97, 0.9);
}
`;

// The map's merged mesh (and the banks, the props: everything in VCOL) bends in the wind from the start.
windify(VCOL);
