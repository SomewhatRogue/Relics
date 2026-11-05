/**
 * An expedition's beacon in 2.5D (expeddraw.ts `drawBeacon` paints it in the flat view): logs stacked
 * crosswise in four courses, each narrower than the one under it (18, 14, 10 and 6 pixels across, as
 * FLAT's), at the way out's ring; once it's lit (the hold, and leaving) a tall fire on it in the room's
 * flames and a big warm light, as FLAT lights it. Built once per expedition, shown only outdoors.
 */
import * as THREE from 'three';
import type { ArenaRoom } from '../../sim/room';
import { Boxes, Seed, jit } from './boxes';
import type { L3 } from './lights3d';
import { VCOL } from './mats';
import type { Spot } from './rounds3d';

const LOG = 0x3a2614;

/** The pile's boxes, centred on (x, z): course by course, the logs turned a quarter each course. */
export function beaconPile(B: Boxes, x: number, z: number, r: Seed): number {
  let y = 0;
  for (let c = 0; c < 4; c++) {
    const span = (18 - c * 4) / 16, n = 3 - (c > 1 ? 1 : 0), d = 0.15, gap = span / n;
    for (let i = 0; i < n; i++) {
      const o = -span / 2 + gap * (i + 0.5), col = jit(LOG, 0.15, r);
      if (c % 2) B.c(x + o, y + d / 2, z, d, d, span + 0.2, col, 0, 0, 0);
      else B.c(x, y + d / 2, z + o, span + 0.2, d, d, col, 0, 0, 0);
      // The cut ends, paler.
      if (c % 2) B.c(x + o, y + d / 2, z + span / 2 + 0.11, d * 0.8, d * 0.8, 0.02, 0x8a6a40);
    }
    y += d * 0.95;
  }
  return y;
}

export class Beacon3D {
  readonly group = new THREE.Group();
  private key = '';
  private mesh: THREE.Mesh | null = null;
  private top = 0;

  /** Keep the pile where the room's beacon is; add its fire and light while it's lit. */
  update(room: ArenaRoom, fires: Spot[], lights: L3[]): void {
    const x = room.exped, key = x && !room.indoors ? `${x.zone.x}:${x.zone.y}` : '';
    if (key !== this.key) {
      this.key = key;
      if (this.mesh) this.group.remove(this.mesh), this.mesh.geometry.dispose(), (this.mesh = null);
      if (x && key) {
        const B = new Boxes();
        this.top = beaconPile(B, x.zone.x, x.zone.y, new Seed(Math.round(x.zone.x * 13 + x.zone.y * 7)));
        this.mesh = B.mesh(VCOL);
        if (this.mesh) this.group.add(this.mesh);
      }
    }
    if (!x || !key || (x.phase !== 'hold' && x.phase !== 'leave')) return;
    const { x: bx, y: bz } = x.zone, t = this.top;
    fires.push([bx, t - 0.1, bz, 2.4], [bx - 0.3, t - 0.2, bz + 0.1, 1.6], [bx + 0.3, t - 0.2, bz - 0.05, 1.7], [bx, t + 0.5, bz, 1.5]);
    // As FLAT lights it: a reach of 150 pixels, strong and warm.
    lights.push({ x: bx, y: t + 1.2, z: bz + 0.4, r: 11.4, i: 1.3, c: [1, 0.62, 0.3], f: 9 });
  }
}
