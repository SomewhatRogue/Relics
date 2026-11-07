/**
 * What lies on the floor or hangs over it a while, in 2.5D, from the same room data the flat view draws
 * (beastdraw.ts drawSlicks, spiders.ts drawPuddles, hound.ts drawSnare, relicsdraw.ts drawSmoke): oil
 * (its sheen, or alight: embers in it and flames standing on it, given to fire3d.ts), the brood mother's
 * poison, a Ranger's snare, and smoke and steam (a Rogue's vanish, a smoke bomb, sim/steam.ts).
 * The floor ones are decals at the floor's or the water's own height, one shader, dithered as the
 * telegraphs are and kept under them (lower, a weaker depth offset). Smoke and steam are soft puffs
 * facing the camera, lit like the rest and dithered by their own coverage, drawn in a last pass after
 * everyone (view3d.ts) without writing depth, and the telegraphs after them in the same pass, so a
 * telegraph under a cloud always shows through it.
 * Nothing is made per frame once a thing is seen. Cosmetic only.
 */
import * as THREE from 'three';
import type { ArenaRoom } from '../../sim/room';
import { POTION } from '../../shared/tuning';
import { slickBurn } from '../../sim/oil';
import { driftAt } from '../staithedraw';
import { levelAt, waterField } from '../waterfield';
import type { GameMap } from '../../shared/arena';
import { BAYER, toonize } from './post';
import { PITCH } from './camera3d';
import { SINK } from './water3d';
import type { Spot } from './rounds3d';

/** The floor's height at (x, y): the water's surface where there's water. */
export const surfAt = (m: GameMap, x: number, y: number) => -(SINK[levelAt(waterField(m), x, y)] ?? 0);

/** Smoke and steam, then the telegraphs, are drawn in a last pass of their own on this layer (view3d.ts). */
export const FX_LAYER = 2;
/** Within it, smoke before the telegraphs (teleg3d.ts TELE_ORDER). */
export const SMOKE_ORDER = 1;

const FS = BAYER + `
uniform float uKind, uR, uT, uFade, uSeed; uniform vec2 uSize; varying vec2 vP;
float h21(vec2 a){ return fract(sin(dot(a, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 p = vP * uSize; vec2 fc = floor(gl_FragCoord.xy); float d = length(p), an = atan(p.y, p.x), b = bay4(fc);
  vec3 col; float al = 1.0;
  if (uKind < 1.5) {
    // Oil: near black, a ragged edge; unlit, a pale sheen sliding over it; alight, embers glinting all through it and a hot rim.
    float R = uR * (1.0 + 0.07 * sin(an * 5.0 + uSeed) + 0.04 * sin(an * 11.0 + uSeed * 2.0));
    if (d > R || b > 0.86) discard;
    col = uKind > 0.5 ? vec3(0.1, 0.078, 0.063) : vec3(0.086, 0.07, 0.047);
    if (uKind < 0.5) {
      float sx = -uR * 0.6 + mod(uT * 0.4 + uSeed * 0.3, uR * 1.2);
      if (abs(p.x - sx) < 0.13 && abs(p.y + 0.05) < 0.05) { col = vec3(0.54, 0.54, 0.42); al = 0.65; }
    } else {
      float f = h21(fc + floor(uT * 10.0));
      if (d > R - 0.1 && f > 0.6) { col = f > 0.85 ? vec3(1.0, 0.82, 0.48) : vec3(1.0, 0.6, 0.24); al = 0.3; }
      else if (f > 0.975) { col = vec3(1.0, 0.6, 0.24); al = 0.4; }
    }
  } else if (uKind < 2.5) {
    // The brood mother's poison: dark green, a sickly glowing rim, bubbles coming up.
    float R = uR * (1.0 + 0.06 * sin(p.y * 9.0 + uSeed));
    if (d > R) discard;
    col = vec3(0.118, 0.204, 0.07);
    if (d > R - 0.09) { if (b > 0.5 * uFade + 0.2) discard; col = vec3(0.42, 0.72, 0.16); al = 0.4; }
    for (int i = 0; i < 3; i++) {
      float fi = float(i), k = fract(uT * 0.9 + fi * 0.37 + uSeed * 0.13);
      vec2 c = vec2(sin(fi * 2.3 + uSeed) * uR * 0.5, cos(fi * 1.7) * uR * 0.35);
      if (length(p - c) < 0.05 + 0.05 * (1.0 - k) && b < (1.0 - k) * uFade) { col = vec3(0.72, 0.94, 0.38); al = 0.15; }
    }
  } else {
    // A snare: its loop of cord, a peg either side, a glint on the wire.
    float ring = abs(d - 0.3);
    bool peg = abs(abs(p.x) - 0.36) < 0.035 && abs(p.y) < 0.035;
    if (peg) { col = vec3(0.35, 0.24, 0.13); if (p.x > 0.0 && mod(floor(uT * 2.0 + uSeed), 3.0) < 0.5) { col = vec3(0.91, 0.94, 1.0); al = 0.3; } }
    else if (ring < 0.03 && mod(floor(an * 9.0), 2.0) < 0.5) col = vec3(0.54, 0.42, 0.23);
    else discard;
  }
  gl_FragColor = vec4(col, al);
}`;

const GEO = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
// (The plane is laid flat, so its local y is the floor's z: the shader reads x and -z as one.)
const VS = 'varying vec2 vP; void main(){ vP = vec2(position.x, -position.z); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const KIND = { oil: 0, fire: 1, poison: 2, snare: 3 } as const;

function decal(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uKind: { value: 0 }, uR: { value: 1 }, uT: { value: 0 }, uFade: { value: 1 }, uSeed: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) } },
    vertexShader: VS,
    fragmentShader: FS,
    blending: THREE.NoBlending,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  return new THREE.Mesh(GEO, mat);
}

/** Soft round puffs facing the camera: lit and banded, dithered by coverage, each its own dither so they add up. */
function puffMaterial(): THREE.MeshLambertMaterial {
  const m = toonize(new THREE.MeshLambertMaterial({ color: 0xffffff, depthWrite: false }));
  const toon = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    toon.call(m, sh, r);
    sh.vertexShader = 'attribute float aCov;\nattribute float aSeed;\nvarying float vCov;\nvarying float vSeed;\nvarying vec2 vQ;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCov = aCov; vSeed = aSeed; vQ = position.xy * 2.0;');
    sh.fragmentShader = 'varying float vCov;\nvarying float vSeed;\nvarying vec2 vQ;\n' + sh.fragmentShader.replace('#include <alphatest_fragment>', '{ float a = (1.0 - dot(vQ, vQ)) * vCov; if (a <= 0.0 || bay4(gl_FragCoord.xy + vec2(vSeed, vSeed * 3.0)) + 0.03 > a) discard; }');
  };
  m.customProgramCacheKey = () => 'puff';
  return m;
}

const MAX = 256;
// (Darker than the flat view's, which lays them at a third over the floor: here a pixel is all smoke or none.)
const SMOKE = [new THREE.Color(0x9a94a8), new THREE.Color(0x7c768a)], STEAM = [new THREE.Color(0xf4f8fa), new THREE.Color(0xdce4ea)];

export class Hazards {
  readonly group = new THREE.Group();
  private live = new Map<string, { m: THREE.Mesh; seen: number }>();
  private frame = 0;
  private puffs: THREE.InstancedMesh;
  private cov = new THREE.InstancedBufferAttribute(new Float32Array(MAX), 1);
  private o = new THREE.Object3D();

  constructor() {
    const g = new THREE.PlaneGeometry(1, 1);
    g.setAttribute('aCov', this.cov);
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(Float32Array.from({ length: MAX }, (_, i) => (i * 7) % 16), 1));
    this.puffs = new THREE.InstancedMesh(g, puffMaterial(), MAX);
    this.puffs.setColorAt(0, SMOKE[0]);
    Object.assign(this.puffs, { frustumCulled: false, renderOrder: SMOKE_ORDER, count: 0 });
    this.puffs.layers.set(FX_LAYER);
    this.o.rotation.x = -PITCH;
    this.group.add(this.puffs);
  }

  /** Flames standing on burning oil, for fire3d.ts, at the surface it floats on. */
  fires(room: ArenaRoom, now: number, out: Spot[]): void {
    for (const s of room.slicks ?? []) {
      if (s.lit < 0 || room.time - s.lit >= slickBurn(s)) continue;
      const d = driftAt(s, now), y = surfAt(room.map, d.x, d.y), n = Math.round(2 + s.r * 3);
      for (let i = 0; i < n; i++) {
        const a = i * 2.4 + s.id, r = Math.sqrt((i + 0.5) / n) * s.r * 0.8;
        out.push([d.x + Math.cos(a) * r, y, d.y + Math.sin(a) * r, 0.6 + (i % 3) * 0.12]);
      }
    }
  }

  update(room: ArenaRoom, now: number): void {
    this.frame++;
    const t = room.time, m = room.map;
    for (const s of room.slicks ?? []) {
      const d = driftAt(s, now), lit = s.lit >= 0 && t - s.lit < slickBurn(s);
      this.put('s' + s.id, lit ? KIND.fire : KIND.oil, d.x, d.y, surfAt(m, d.x, d.y), s.r, 1, s.id, now);
    }
    for (const p of room.puddles ?? []) {
      const fade = Math.min(1, (p.until - t) / 1);
      this.put('u' + p.id, KIND.poison, p.x, p.y, surfAt(m, p.x, p.y), p.r * (0.7 + 0.3 * fade), fade, p.id, now);
    }
    room.snares.forEach((s, i) => this.put('n' + i, KIND.snare, s.x, s.y, surfAt(m, s.x, s.y), 0.45, 1, s.x, now));
    for (const [k, e] of this.live) if (e.seen !== this.frame) this.group.remove(e.m), (e.m.material as THREE.Material).dispose(), this.live.delete(k);
    this.smoke(room, now);
  }

  private put(key: string, kind: number, x: number, z: number, y: number, R: number, fade: number, seed: number, now: number): void {
    let e = this.live.get(key);
    if (!e) this.live.set(key, (e = { m: decal(), seen: 0 })), this.group.add(e.m);
    e.seen = this.frame;
    const u = (e.m.material as THREE.ShaderMaterial).uniforms, S = (R + 0.15) * 2;
    u.uKind.value = kind;
    u.uR.value = R;
    u.uT.value = now;
    u.uFade.value = fade;
    u.uSeed.value = seed % 17;
    u.uSize.value.set(S, S);
    e.m.scale.set(S, 1, S);
    e.m.position.set(x, y + 0.012, z);
  }

  /** Smoke and steam: puffs drifting round the middle and rising, as the flat view's circles do. */
  private smoke(room: ArenaRoom, now: number): void {
    const o = this.o, P = this.puffs, cov = this.cov.array as Float32Array;
    let n = 0;
    for (const s of room.smokes) {
      const r = s.r ?? POTION.smokeR, left = Math.max(0, Math.min(1, (s.until - room.time) / 1.5)), steam = !!s.steam, cols = steam ? STEAM : SMOKE;
      const y0 = surfAt(room.map, s.x, s.y), count = steam ? 16 : 14;
      for (let i = 0; i < count && n < MAX; i++, n++) {
        const a = i * 2.4 + now * 0.35, d = r * (0.12 + ((i * 37) % 10) / 13), rise = (now * 0.5 + i * 0.37) % 1;
        const size = (steam ? 0.5 : 0.62) + ((i * 7) % 4) * 0.12;
        o.position.set(s.x + Math.cos(a) * d, y0 + 0.3 + (i % 3) * 0.28 + rise * 0.35, s.y + Math.sin(a) * d * 0.8);
        o.scale.set(size, size, 1);
        o.updateMatrix();
        P.setMatrixAt(n, o.matrix);
        P.setColorAt(n, cols[i % 2]);
        // Steam leaves gaps, so whoever's in it still shows (sim/steam.ts); smoke is thicker in the middle.
        cov[n] = (steam ? 0.42 : 0.62) * left * (1 - rise * 0.5);
      }
    }
    P.count = n;
    P.instanceMatrix.needsUpdate = true;
    if (P.instanceColor) P.instanceColor.needsUpdate = true;
    this.cov.needsUpdate = true;
  }
}
