/**
 * Point lights: a fixed pool (so the shaders never rebuild mid-fight) given each frame to the
 * brightest lights nearest the camera, from the same sources the 2D pass lights (torches, braziers,
 * burning houses, spells, chests, the flash of a big hit). Plus the room's ambient and its moon or sun.
 */
import * as THREE from 'three';
import type { Theme } from '../../shared/arena';

/** A light in tiles: x, height, z; reach; strength; colour 0..1; flicker rate (0: steady). */
export interface L3 { x: number; y: number; z: number; r: number; i: number; c: [number, number, number]; f?: number }

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
    // The heroes are drawn on layer 1 (view3d.ts): the lights shine there too, and the moon casts their shadows.
    this.group.traverse((o) => o.layers.enable(1));
    this.sky.shadow.camera.layers.enable(1);
    if (shadow) {
      this.sky.castShadow = true;
      this.sky.shadow.mapSize.set(shadow, shadow);
      this.sky.shadow.bias = -0.0015;
      this.sky.shadow.normalBias = 0.02;
      Object.assign(this.sky.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
    }
  }

  /** The room's light: its ambient, and moonlight (or the sun by day) slanting in, centred on (cx, cz). */
  setSky(t: Theme, cx: number, cz: number): void {
    const [r, g, b] = t.ambient;
    this.amb.color.setRGB(r * 1.35, g * 1.35, b * 1.35);
    this.amb.intensity = Math.PI;
    if (t.day) this.sky.color.setRGB(1, 0.93, 0.8), (this.sky.intensity = 0.9 * Math.PI);
    else this.sky.color.setRGB(0.55, 0.62, 0.9), (this.sky.intensity = Math.max(0.3, (t.moon ?? 0) * 1.6) * Math.PI);
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
      p.distance = l.r * fl;
      p.intensity = l.i * 2.2 * Math.PI;
    });
  }
}
