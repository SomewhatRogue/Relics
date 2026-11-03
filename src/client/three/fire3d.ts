/**
 * Every flame in the room (torches, braziers, cookfires, burning houses, burning goblins) in four
 * instanced draws, one per colour from the white-hot heart to the deep red tips. Each tongue is
 * re-rolled twelve times a second, like a sprite's frames. Cosmetic, so Math.random is fine here.
 */
import * as THREE from 'three';
import { G } from './mats';
import { BOX } from './rig';
import type { Spot } from './rounds3d';

const MAX = 600;
/** size, height above the base, colour, glow. */
const LAYERS: [number, number, number, number, number, number][] = [
  [0.17, 0.16, 0.14, 0.08, 0xff8a24, 0.15],
  [0.12, 0.15, 0.1, 0.23, 0xe8501a, 0.3],
  [0.06, 0.11, 0.06, 0.36, 0xa02810, 0.55],
  [0.1, 0.1, 0.06, 0.06, 0xffe890, 0],
];
const TONGUES: [number, number, number][] = [[0, 0.02, 1.0], [-0.11, -0.03, 0.75], [0.1, 0.0, 0.85], [0.03, -0.08, 0.6], [-0.04, 0.07, 0.5]];

export class Fires {
  readonly group = new THREE.Group();
  private layers: THREE.InstancedMesh[];
  private o = new THREE.Object3D();
  private frame = -1;
  private rolls = new Float32Array(MAX);

  constructor() {
    this.layers = LAYERS.map(([, , , , col, a]) => {
      const m = new THREE.InstancedMesh(BOX, G(col, a), MAX);
      m.frustumCulled = false;
      m.count = 0;
      this.group.add(m);
      return m;
    });
  }

  /** Draw these fires this frame (x, y, z, size). */
  draw(spots: Spot[], now: number): void {
    const f = Math.floor(now * 12);
    if (f !== this.frame) {
      this.frame = f;
      for (let i = 0; i < MAX; i++) this.rolls[i] = 0.55 + Math.random() * 0.6;
    }
    let n = 0;
    for (const [x, y, z, s] of spots) for (let t = 0; t < TONGUES.length && n < MAX; t++, n++) {
      const [ox, oz, k] = TONGUES[t], h = k * this.rolls[n];
      LAYERS.forEach(([w, hh, d, oy], li) => {
        this.o.position.set(x + ox * s, y + oy * s * h, z + oz * s + (li === 3 ? 0.06 * s : 0));
        this.o.scale.set(w * s, hh * s * h, d * s);
        this.o.updateMatrix();
        this.layers[li].setMatrixAt(n, this.o.matrix);
      });
    }
    for (const m of this.layers) (m.count = n), (m.instanceMatrix.needsUpdate = true);
  }
}
