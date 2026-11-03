/**
 * The room's buildings and other blocks, each built once and rebuilt only when its state changes
 * (hurt to charred, set alight, burned down). A roof lifts off while you're behind its building, so
 * you're never lost behind a cottage.
 */
import * as THREE from 'three';
import type { Block, GameMap } from '../../shared/arena';
import { blockState, buildBlock, type Built } from './houses3d';
import type { Spot } from './rounds3d';

export class Buildings {
  readonly group = new THREE.Group();
  private built = new Map<Block, { b: Built; key: number }>();

  clear(): void {
    for (const { b } of this.built.values()) this.drop(b);
    this.built.clear();
  }

  private drop(b: Built): void {
    this.group.remove(b.group);
    b.group.traverse((o) => (o as THREE.Mesh).isMesh && (o as THREE.Mesh).geometry.dispose());
  }

  /** Bring every block up to date; `me` (tiles) lifts the roof of a building you're behind. Adds flames to `fires`. */
  update(map: GameMap, me: [number, number] | null, fires: Spot[]): void {
    for (const blk of map.blocks) {
      const key = blockState(blk);
      let e = this.built.get(blk);
      if (!e || e.key !== key) {
        if (e) this.drop(e.b);
        e = { b: buildBlock(blk), key };
        this.group.add(e.b.group);
        this.built.set(blk, e);
      }
      const roof = e.b.roof;
      if (roof && me) roof.visible = !(me[0] > blk.x - 0.5 && me[0] < blk.x + blk.w + 0.5 && me[1] > blk.y - e.b.top * 1.2 && me[1] < blk.y + 0.4);
      fires.push(...e.b.fires);
    }
  }
}
