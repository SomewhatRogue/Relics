/**
 * The tower's coloured fire in 2.5D, as hallsdraw.ts draws it: licks rising off the iron bowl in the
 * colour it has drifted to (violet, green, blue: `witchColour`), dimmer as they climb, and its light
 * in the same colour over the room (scene.ts lights it so). Cosmetic only.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { witchColour } from '../hallsdraw';
import type { L3 } from './lights3d';
import { BOX } from './rig';

const N = 7, T = 1 / 16;

export class WitchFires {
  readonly group = new THREE.Group();
  private spots: [number, number][] = [];
  private o = new THREE.Object3D();
  /** Bright at the root, dimmer as a lick climbs: two instanced draws, recoloured each frame. */
  private mats = [0, 1].map(() => new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.1, blending: THREE.NoBlending }));
  private meshes: THREE.InstancedMesh[] = [];

  build(map: GameMap): void {
    for (const m of this.meshes) this.group.remove(m), m.dispose();
    this.spots = map.rounds.filter((r) => r.kind === 'witchfire').map((r) => [r.x, r.y]);
    this.meshes = this.spots.length ? this.mats.map((mat) => new THREE.InstancedMesh(BOX, mat, this.spots.length * N)) : [];
    for (const m of this.meshes) (m.frustumCulled = false), this.group.add(m);
  }

  /** Move the licks on and add each fire's light to this frame's lights. */
  update(now: number, lights: L3[]): void {
    if (!this.spots.length) return;
    const c = witchColour(now);
    this.mats[0].color.setRGB(Math.min(1, c[0] * 1.2), Math.min(1, c[1] * 1.2), Math.min(1, c[2] * 1.2));
    this.mats[1].color.setRGB(c[0] * 0.8, c[1] * 0.8, c[2] * 0.8);
    const n = [0, 0];
    this.spots.forEach(([x, z]) => {
      for (let i = 0; i < N; i++) {
        const k = (now * 1.6 + i / N) % 1, big = k < 0.4, which = k < 0.5 ? 0 : 1;
        this.o.position.set(x + (-3 + ((i * 5) % 7) + Math.sin(now * 6 + i) * 1.2) * T, 0.62 + k * 0.6, z + (((i * 3) % 5) - 2) * 0.04);
        this.o.scale.set(big ? 1.5 * T : T, 2 * T, big ? 1.5 * T : T);
        this.o.updateMatrix();
        this.meshes[which].setMatrixAt(n[which]++, this.o.matrix);
      }
      lights.push({ x, y: 1.1, z, r: (90 / 16) * 1.15 + 0.6, i: 1.1, c: [...c], f: 5 });
    });
    this.meshes.forEach((m, i) => ((m.count = n[i]), (m.instanceMatrix.needsUpdate = true)));
  }
}
