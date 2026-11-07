/**
 * Point lights: a fixed pool (so the shaders never rebuild mid-fight) given each frame to the
 * brightest lights nearest the camera, from the same sources the 2D pass lights (torches, braziers,
 * burning houses, spells, chests, the flash of a big hit). Plus the room's ambient and its moon or sun.
 */
import * as THREE from 'three';
import type { Theme } from '../../shared/arena';

/** A light in tiles: x, height, z; reach; strength; colour 0..1; flicker rate (0: steady). */
export interface L3 { x: number; y: number; z: number; r: number; i: number; c: [number, number, number]; f?: number }

/** How strong the moon's blue-silver key is (FLAT's moon is a pool over the middle at its theme strength). */
const MOON = 0.6;
/** A point light's strength and reach over its FLAT figures: FLAT's pools are lit in screen space with
 *  no slant, so in 3D (lights up off the floor, faces turned from them) they need a little more of both. */
const POINT = 3.1;
const REACH = 1.15;
/** The sun's warmth over the day's ambient. */
const SUN = [1.06, 1, 0.9];

export class Lights {
  readonly group = new THREE.Group();
  private pool: THREE.PointLight[] = [];
  readonly amb = new THREE.AmbientLight(0xffffff, 1);
  readonly sky = new THREE.DirectionalLight(0xffffff, 0);

  constructor(n: number, shadow: number) {
    for (let i = 0; i < n; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 1, 1.5);
      this.pool.push(l);
      this.group.add(l);
    }
    this.group.add(this.amb, this.sky, this.sky.target);
    // The heroes are drawn on layer 1 and smoke and telegraphs last on layer 2 (view3d.ts): the lights shine
    // there too, and the moon casts the heroes' shadows.
    this.group.traverse((o) => (o.layers.enable(1), o.layers.enable(2)));
    this.sky.shadow.camera.layers.enable(1);
    if (shadow) {
      this.sky.castShadow = true;
      this.sky.shadow.mapSize.set(shadow, shadow);
      this.sky.shadow.bias = -0.0015;
      this.sky.shadow.normalBias = 0.06;
      Object.assign(this.sky.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
    }
  }

  /** The room's light: its ambient, and moonlight (or the sun by day) slanting in, centred on (cx, cz). */
  setSky(t: Theme, cx: number, cz: number): void {
    // As bright as the flat view's pass (light.ts: the ambient times 1.55), split between a soft fill
    // and a key slanting in from the sky in the ambient's own colour, so a lit floor lands near its
    // flat colour and faces still model. At night the moon adds its blue-silver to the key; indoors
    // (no moon) the room's own warmth stays warm.
    const [r, g, b] = t.ambient, f = 1.55 * 0.75, k = 1.55 * 0.45, m = t.day ? 0 : (t.moon ?? 0) * MOON;
    this.amb.color.setRGB(r * f, g * f, b * f);
    this.amb.intensity = Math.PI;
    const [sr, sg, sb] = t.day ? SUN : [1, 1, 1];
    this.sky.color.setRGB(r * k * sr + 0.6 * m, g * k * sg + 0.67 * m, b * k * sb + 0.92 * m);
    this.sky.intensity = Math.PI;
    this.sky.position.set(cx - 8, 22, cz + 10);
    this.sky.target.position.set(cx, 0, cz);
  }

  /** Give the pool to the lights that matter most around (cx, cz). */
  place(list: L3[], cx: number, cz: number, now: number): void {
    const score = (l: L3) => (Math.hypot(l.x - cx, l.z - cz) - l.r) / (0.5 + l.i);
    const best = list.filter((l) => l.i > 0.01).sort((a, b) => score(a) - score(b));
    this.pool.forEach((p, k) => {
      const l = best[k];
      if (!l) return void (p.intensity = 0);
      const fl = l.f ? 1 + Math.sin(now * l.f + l.x * 3.1) * 0.06 + Math.sin(now * l.f * 0.57 + l.z) * 0.05 : 1;
      p.position.set(l.x, l.y, l.z);
      p.color.setRGB(l.c[0], l.c[1], l.c[2]);
      p.distance = l.r * REACH * fl;
      p.intensity = l.i * POINT * Math.PI;
    });
  }
}
