/**
 * The living world's landscape in 2.5D (../alive.ts, LIVING WORLD in the options box; docs/decisions/
 * new-look-characters.md). With it on, outdoors (a room with trees, bushes or water):
 * - the wind runs through the trees in gusts: leaf-green parts of the map's merged mesh (`VCOL`) above the trunk bend
 *   along the wind, the treetops most, with a quick flutter on top (only leaves rounds3d.ts marks: no hedge, roof or moss). The gust is ../alive.ts `gust`,
 *   the same sum, so a cape's hem stirs as the trees do;
 * - cloud shadows drift over the floor and everything on it, along the wind, their edges dithered (the pixel look);
 * - the water (water3d.ts) laps: foam along the bank coming and going, a thinner line rolling in, and light glinting
 *   on the surface here and there.
 * One set of uniforms shared by every material it touches; view3d.ts moves the time on each frame.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { ALIVE, WIND } from '../alive';
import { VCOL } from './mats';
import { PITCH } from './camera3d';

/** The shared uniforms: the time (seconds), whether it's on here (on, and outdoors). */
export const LIFE = { uLifeT: { value: 0 }, uLife: { value: 0 }, uRefl: { value: null as THREE.Texture | null } };

/** Outdoors enough for wind and clouds: trees, bushes or water about. */
export function outdoors(m: GameMap): boolean {
  return m.rounds.some((r) => r.kind === 'tree' || r.kind === 'pine' || r.kind === 'bush' || r.kind === 'deadtree');
}

/** Each frame: the time on, and whether this room is living. */
export function lifeFrame(m: GameMap | null, now: number, hasWater: boolean): void {
  LIFE.uLifeT.value = now % 2000;
  LIFE.uLife.value = ALIVE.on && m && (hasWater || outdoors(m)) ? 1 : 0;
}

/**
 * What the water mirrors: the trees, mirrored down the screen as the tilted camera sees them in still water (a thing
 * `h` up shows `h` / tan(pitch) tiles further south on the surface). Painted once per room at `REFL.px` pixels a tile:
 * red how much is there, green 1 for leaves, 0 for a trunk. Only seen through the water (water3d.ts, WATER_LIFE).
 */
const REFL = { px: 8, trunk: 1.5, crown: 1.9, pineTop: 3.0 };
export function reflections(m: GameMap): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas'), P = REFL.px, cot = 1 / Math.tan(PITCH);
  cv.width = m.w * P;
  cv.height = m.h * P;
  const g = cv.getContext('2d')!;
  for (const r of m.rounds) {
    const tree = r.kind === 'tree' || r.kind === 'deadtree', pine = r.kind === 'pine', bush = r.kind === 'bush';
    if (!tree && !pine && !bush) continue;
    const R = Math.max(0.25, r.r), x = r.x * P, z = r.y * P;
    g.fillStyle = 'rgb(255,0,0)';
    if (!bush) g.fillRect(x - 0.15 * P, z, 0.3 * P, (pine ? 1.2 : REFL.trunk) * cot * P);
    if (r.kind === 'deadtree') continue;
    g.fillStyle = 'rgb(255,255,0)';
    g.beginPath();
    if (bush) g.ellipse(x, z + 0.3 * cot * P, R * 1.2 * P, 0.35 * cot * P, 0, 0, 6.283);
    else if (pine) g.moveTo(x - R * 1.25 * P, z + 1.1 * cot * P), g.lineTo(x + R * 1.25 * P, z + 1.1 * cot * P), g.lineTo(x, z + REFL.pineTop * cot * P);
    else g.ellipse(x, z + REFL.crown * cot * P, R * 1.35 * P, R * 1.15 * cot * P, 0, 0, 6.283);
    g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.flipY = false;
  t.magFilter = t.minFilter = THREE.NearestFilter;
  return t;
}

/** A room with water: its reflections into the shared uniform (one room at a time); call what it returns to let go. */
export function useReflections(m: GameMap): () => void {
  const t = reflections(m);
  LIFE.uRefl.value = t;
  return () => (t?.dispose(), LIFE.uRefl.value === t && (LIFE.uRefl.value = null));
}

/** How much each thing moves and darkens. */
const K = { treeBend: 0.09, flutter: 0.01, cloudScale: 9, cloudDrift: 0.7, cloudDark: 0.2 };

export const LIFE_GLSL = /* glsl */ `
uniform float uLifeT; uniform float uLife; uniform sampler2D uRefl;
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
    sh.vertexShader = sh.vertexShader.replace('void main() {', LIFE_GLSL + 'attribute float aSway;\nvoid main() {').replace('#include <begin_vertex>', `#include <begin_vertex>
if (uLife > 0.5 && aSway > 0.5) {
  // Only a tree's leaves (rounds3d.ts marks them, boxes.ts \`sway\`): the higher, the more they bend, and flutter.
  vec4 wp = modelMatrix * vec4(transformed, 1.0);
  float hgt = max(0.0, wp.y - 1.0);
  float g = lifeGust(wp.xz, uLifeT);
  transformed.xz += vec2(${WIND.dir[0]}, ${WIND.dir[1]}) * (g * hgt * ${K.treeBend} + ${K.flutter} * hgt * sin(uLifeT * 5.3 + wp.x * 1.7 + wp.z * 2.3) * (0.4 + g));
}`);
  }, '|life');
}

/**
 * The tile redraw's cards (propcards.ts): a tree's, a bush's, a reed's top leans with the gust and a slow rock, the
 * lean snapped to whole render pixels (20 a tile) so the art stays crisp; `aSway` is the most pixels it may lean
 * (0 at the foot). The old trees bent in windify; the cards had lost it.
 */
export function swayCards(m: THREE.Material): void {
  const dx = WIND.dir[0] < 0 ? -1 : 1;
  chain(m, (sh) => {
    Object.assign(sh.uniforms, LIFE);
    sh.vertexShader = sh.vertexShader.replace('void main() {', LIFE_GLSL + 'attribute float aSway;\nvoid main() {').replace('#include <begin_vertex>', `#include <begin_vertex>
if (uLife > 0.5 && aSway > 0.0) {
  vec4 wp = modelMatrix * vec4(transformed, 1.0);
  float g = lifeGust(wp.xz, uLifeT), rock = 0.35 * sin(uLifeT * 1.3 + wp.x * 0.9 + wp.z * 1.7);
  transformed.x += ${dx}.0 * floor(clamp(g * 1.1 + rock, -0.5, 1.0) * aSway + 0.5) / 20.0;
}`);
  }, '|cardsway');
}

/** A floor's material: cloud shadows over it. */
export function clouded(m: THREE.Material): void {
  chain(m, (sh) => {
    shadows(sh, '#include <map_fragment>');
    // (No wind over the grass: its rolling bands of lighter green read as heat haze. Kyle, 2026-11-16: "Nix it".)
  }, '|lifefloor');
}

/** The water's surface (water3d.ts's SURFACE, after its colour and before the blood): foam at the bank coming and
 *  going, a thin line rolling in from further out, glints. `P`: the surface pixel in tiles; `W.g`: how far from the
 *  bank (pixels x4); `bz`: the dither; `a`, `b`: along and across the current; `deep`. */
export const WATER_LIFE = /* glsl */ `
if (uLife > 0.5) {
  // The trees mirrored in it, broken up by the ripples, darker than the sky between them.
  vec4 rf = texture2D(uRefl, (P + vec2(n * 0.06, 0.0)) / uSize);
  if (rf.r > 0.5 && bz < (deep ? 0.8 : 0.55)) col = mix(col, rf.g > 0.5 ? vec3(0.10, 0.17, 0.12) : vec3(0.11, 0.09, 0.07), deep ? 0.68 : 0.42);
  float shore = W.g * 255.0 / 4.0;
  float reach = 1.6 + 1.4 * (0.5 + 0.5 * sin(uLifeT * 1.3 + dot(P, vec2(1.7, 2.3))));
  if (shore < reach && bz < 0.75) col = mix(col, vec3(0.80, 0.87, 0.86), 0.7);
  float roll = abs(shore - (2.5 + 3.5 * fract(uLifeT * 0.28 + lifeHash(floor(P * 0.5)) * 0.3)));
  if (roll < 0.45 && bz > 0.3 && shore < 7.0) col = mix(col, vec3(0.64, 0.76, 0.78), 0.55);
  // Glints: a surface pixel here and there catching the light for a moment, brighter on a ripple's crest.
  vec2 cell = floor(P * 16.0);
  float h = lifeHash(cell), tw = fract(h * 7.0 + uLifeT * (0.35 + h * 0.6));
  if (h > 0.985 - max(0.0, n) * 0.01 && tw < 0.12) col = mix(col, vec3(0.92, 0.95, 0.88), 0.55);
}
`;

// The map's merged mesh (and the banks, the props: everything in VCOL) bends in the wind from the start.
windify(VCOL);
