/**
 * Water in 2.5D (paint only; Kyle: "maps with water look kind of weird, especially when it's bloody.
 * Maybe water can be more 3D"). The floor is cut where the water is and the water sits below the bank:
 * shallows just under it, the bed showing through; deep water further down, darker toward the middle in
 * stepped bands. The far bank's face (earth, or wet stone where shallows drop to deep) is one merged
 * mesh. The surface moves: banded, stepped highlights with a little ordered dither (the lighting's
 * look) running with the current, east or down a river, barely stirring in a pool. Blood clouds in it
 * and rings spread on it (wetfx.ts), passed in each frame. Two planes and one shader on them: cheap.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { DEEP, DRY, SHALLOW, waterField } from '../waterfield';
import { cloudStrength, ringStrength, WET, type Wet } from '../wetfx';
import { VCOL } from './mats';
import { toonize } from './post';

/** How far below the bank each kind of water lies (tiles). */
export const SINK = { [SHALLOW]: 0.07, [DEEP]: 0.22 } as Record<number, number>;

export interface Water3 { meshes: THREE.Object3D[]; update(wet: Wet, now: number): void; dispose(): void }

const SURFACE = /* glsl */ `
{
vec2 wuv = vec2(vMapUv.x, 1.0 - vMapUv.y);
vec4 W = texture2D(uWater, wuv);
if (abs(floor(W.r * 2.008 + 0.5) - uKind) > 0.5) discard;
vec2 P = (floor(wuv * uSize * 16.0) + 0.5) / 16.0;
float bz = bay4(floor(P * 16.0));
bool deep = uKind > 1.5;
// Along and across the current; a pool barely stirs.
float fl = W.b * 255.0;
vec2 dir = fl > 180.0 ? vec2(0.0, 1.0) : (fl > 60.0 ? vec2(1.0, 0.0) : vec2(0.8, 0.6));
float run = uTime * (fl > 60.0 ? (deep ? 0.44 : 0.28) : 0.075);
float a = dot(P, dir) - run, b = dot(P, vec2(-dir.y, dir.x));
float n = sin(a * 3.1416 + sin(b * 4.71 + a * 0.6) * 1.4) * sin(b * (deep ? 4.71 : 6.28) + sin(a * 1.57) * 0.8);
float hi = step(0.86 + bz * 0.12, n), lo = step(0.68 + bz * 0.24, n) * (1.0 - hi);
vec4 bed = texture2D(map, vMapUv);
float band = clamp(floor(W.g * 255.0 / 36.0 + (bz - 0.5) * 0.9), 0.0, 3.0);
vec3 col;
if (deep) {
  // The painting's dark water, stepped darker toward the middle; what's painted on it (boards, a beam) floats.
  float k = band < 0.5 ? 1.18 : band < 1.5 ? 1.0 : band < 2.5 ? 0.82 : 0.68;
  bool floats = bed.r > bed.b + 0.03 && bed.r < bed.g * 1.6;
  col = floats ? bed.rgb : bed.rgb * k;
  col = mix(col, vec3(0.141, 0.259, 0.361), lo);
  col = mix(col, vec3(0.212, 0.376, 0.478), hi);
} else {
  // The bed through clear water, a little cooler and darker as it deepens.
  col = mix(bed.rgb, vec3(0.33, 0.48, 0.49), 0.15) * (1.0 - band * 0.05);
  col = mix(col, vec3(0.478, 0.635, 0.643), lo * 0.8);
  col = mix(col, vec3(0.659, 0.8, 0.8), hi);
}
// Blood clouding in the water, billowing as it goes.
float red = 0.0;
for (int i = 0; i < ${WET.clouds}; i++) {
  if (i >= uNC) break;
  vec4 c = uClouds[i];
  float wob = 0.22 * sin(P.x * 5.0 + uTime * 0.8 + c.x * 3.0) * sin(P.y * 4.3 - uTime * 0.6 + c.y * 2.0);
  float d = length(P - c.xy) / c.z + wob;
  red = max(red, c.w * (1.0 - d * d));
}
if (red > 0.12 + bz * 0.18) col = mix(col, red > 0.55 ? (deep ? vec3(0.32, 0.08, 0.125) : vec3(0.478, 0.114, 0.114)) : (deep ? vec3(0.227, 0.063, 0.094) : vec3(0.353, 0.102, 0.118)), 0.8);
// Rings spreading from feet and splashes.
for (int i = 0; i < ${WET.ripples}; i++) {
  if (i >= uNR) break;
  vec4 r = uRings[i];
  if (abs(length(P - r.xy) - r.z) < 0.05 && r.w > bz * 0.9) col = r.w > 0.45 ? vec3(0.72, 0.83, 0.85) : vec3(0.48, 0.6, 0.64);
}
diffuseColor.rgb = col;
}
`;

const HEAD = 'uniform sampler2D uWater; uniform vec2 uSize; uniform float uTime; uniform float uKind;\n' +
  `uniform vec4 uClouds[${WET.clouds}]; uniform int uNC; uniform vec4 uRings[${WET.ripples}]; uniform int uNR;\n`;

/** Chain a shader edit after the toon one (post.ts) on a material. */
function also(m: THREE.Material, edit: (sh: THREE.WebGLProgramParametersWithUniforms) => void): void {
  const before = m.onBeforeCompile.bind(m);
  m.onBeforeCompile = (sh, r) => (before(sh, r), edit(sh));
}

/** The water's picture as a texture: level, how far from the bank (pixels, x4), which way it runs. */
function dataTexture(f: NonNullable<ReturnType<typeof waterField>>): THREE.DataTexture {
  const d = new Uint8Array(f.cols * f.rows * 4), k = 16 / f.n;
  for (let i = 0; i < f.level.length; i++) (d[i * 4] = f.level[i] * 127), (d[i * 4 + 1] = Math.min(255, f.far[i] * k * 4)), (d[i * 4 + 2] = f.flow[i] * 120), (d[i * 4 + 3] = 255);
  const t = new THREE.DataTexture(d, f.cols, f.rows, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/** The far bank's face along the top of the water: earth from the floor down, or wet stone from the shallows. */
function banks(f: NonNullable<ReturnType<typeof waterField>>): THREE.Mesh | null {
  const pos: number[] = [], col: number[] = [], c = new THREE.Color(), put = (hex: number) => (c.setHex(hex), col.push(c.r, c.g, c.b));
  for (let j = 1; j < f.rows; j++) for (let i = 0; i < f.cols; ) {
    const k = j * f.cols + i, L = f.level[k], U = f.level[k - f.cols];
    if (L === DRY || U >= L) { i++; continue; }
    let e = i + 1;
    while (e < f.cols && f.level[j * f.cols + e] === L && f.level[(j - 1) * f.cols + e] === U) e++;
    const x0 = i / f.n, x1 = e / f.n, z = j / f.n, top = -(SINK[U] ?? 0), bot = -SINK[L] - 0.01, earth = U === DRY;
    const ht = earth ? 0x5a4a36 : 0x6a7a74, hb = earth ? 0x241e18 : 0x34443f;
    pos.push(x0, top, z, x0, bot, z, x1, bot, z, x0, top, z, x1, bot, z, x1, top, z);
    for (const h of [ht, hb, hb, ht, hb, ht]) put(h);
    i = e;
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, VCOL);
  m.receiveShadow = true;
  return m;
}

/**
 * The room's water, cutting `floor` (its material sampling the painting `bed`) where it lies.
 * Null when the room has none.
 */
export function buildWater(m: GameMap, floor: THREE.MeshLambertMaterial, bed: THREE.Texture): Water3 | null {
  const f = waterField(m);
  if (!f) return null;
  const tex = dataTexture(f), size = new THREE.Vector2(m.w, m.h), time = { value: 0 };
  // No floor where the water is: it's below.
  also(floor, (sh) => {
    sh.uniforms.uWater = { value: tex };
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform sampler2D uWater;\nvoid main() {\nif (texture2D(uWater, vec2(vMapUv.x, 1.0 - vMapUv.y)).r > 0.25) discard;');
  });
  floor.customProgramCacheKey = () => 'floorcut';
  floor.needsUpdate = true;
  const clouds = Array.from({ length: WET.clouds }, () => new THREE.Vector4()), rings = Array.from({ length: WET.ripples }, () => new THREE.Vector4());
  const nc = { value: 0 }, nr = { value: 0 }, meshes: THREE.Object3D[] = [], mats: THREE.Material[] = [];
  for (const kind of [SHALLOW, DEEP]) {
    if (!f.level.includes(kind)) continue;
    const mat = toonize(new THREE.MeshLambertMaterial({ map: bed }));
    also(mat, (sh) => {
      Object.assign(sh.uniforms, { uWater: { value: tex }, uSize: { value: size }, uTime: time, uKind: { value: kind }, uClouds: { value: clouds }, uNC: nc, uRings: { value: rings }, uNR: nr });
      // (The toon edit has already put the dither's bay4 in.)
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', HEAD + 'void main() {').replace('#include <map_fragment>', SURFACE);
    });
    mat.customProgramCacheKey = () => 'water';
    const p = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), mat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(m.w / 2, -SINK[kind], m.h / 2);
    p.receiveShadow = true;
    meshes.push(p), mats.push(mat);
  }
  const bank = banks(f);
  if (bank) meshes.push(bank);
  return {
    meshes,
    update(wet, now) {
      time.value = now % 1000;
      let i = 0;
      for (const c of wet.clouds) if (i < WET.clouds) clouds[i++].set(c.x, c.y, c.r, cloudStrength(c));
      nc.value = i;
      i = 0;
      for (const r of wet.ripples) if (i < WET.ripples) rings[i++].set(r.x, r.y, r.r, ringStrength(r));
      nr.value = i;
    },
    dispose() {
      tex.dispose();
      for (const x of mats) x.dispose();
      for (const x of meshes) (x as THREE.Mesh).geometry.dispose();
    },
  };
}
