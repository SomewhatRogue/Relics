/**
 * The room's buildings and other blocks, each built once and rebuilt only when its state changes
 * (hurt to charred, set alight, burned down). A roof lifts off (the walls dropping low) while you're behind its building, so
 * you're never lost behind a cottage.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { blockState, buildBlock, type Built } from './houses3d';
import { levelAt } from '../../shared/arena';
import { LEDGE_H } from './ground';
import type { Spot } from './rounds3d';
import { setLampMeshes } from './lamps3d';
import { houseAlight, kindling } from '../../shared/kindling';
import { gradeBuilt } from './darkgold3d';
import { ghostKit, STREET } from './streetkit';
import { streetAround } from './streetrow';
import { PITCH } from './camera3d';
import { SWING } from '../swing';
import { hides } from '../streethole';


export class Buildings {
  readonly group = new THREE.Group();
  /** By the block's place in the map's list (a friend's copy of the room gets new block objects on every update). */
  private built = new Map<number, { b: Built; key: string; ghost?: boolean }>();

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
    if (STREET) streetAround(map.blocks, map.w, map.h);
    map.blocks.forEach((blk, i) => {
      if (blk.kind === 'sideway') return;
      const key = `${blk.kind}:${blk.x}:${blk.y}:${blk.w}:${blk.h}:${blk.door ?? ''}:${blk.locked ? 1 : 0}:${blockState(blk)}:${blk.deck ? 1 : 0}:${blk.shut ?? ''}`;
      let e = this.built.get(i);
      if (!e || e.key !== key) {
        if (e) this.drop(e.b);
        e = { b: buildBlock(blk, kindling(blk, map)), key };
        // Dark and gold: the colours graded and moss laid on, once per build (darkgold3d.ts).
        gradeBuilt(e.b.group, e.b.roof, Math.round(blk.x * 31 + blk.y * 17));
        // Standing on a stacked level (the new town: docs/design/town-layout.md), lifted onto it.
        if (map.ledges) e.b.group.position.y = levelAt(map, blk.x + blk.w / 2, blk.y + blk.h / 2) * LEDGE_H;
        this.group.add(e.b.group);
        this.built.set(i, e);
      }
      const roof = e.b.roof;
      // The new look's street (streetkit.ts): a kit building between your hero and the swung camera goes see-through
      // round them instead; nothing lifts or drops.
      if (STREET && roof) {
        const hid = !!me && hides(me, blk.x, blk.y, blk.x + blk.w, blk.y + blk.h, e.b.top, SWING.yaw, PITCH);
        if (e.ghost !== hid) ghostKit(e.b.group, (e.ghost = hid));
        for (const f of e.b.fires) fires.push(f);
        setLampMeshes(map.theme, blk.x, blk.y, e.b.lamps);
        return;
      }
      // Behind it: the roof comes off and the walls drop low, like a doll's house opened.
      const cut = !!roof && !!me && me[0] > blk.x - 0.5 && me[0] < blk.x + blk.w + 0.5 && me[1] > blk.y - e.b.top * 1.2 && me[1] < blk.y + 0.4;
      if (roof) roof.visible = !cut;
      e.b.group.scale.y = cut ? 0.3 : 1;
      // A house set alight from outside: its flames grow as it burns down (sim/houseburn.ts).
      const grow = houseAlight(blk) ? 0.7 + 0.6 * (1 - (blk.hp ?? 0) / (blk.maxHp || 1)) : 1;
      for (const f of e.b.fires) fires.push(grow === 1 ? f : [f[0], f[1], f[2], f[3] * grow]);
      setLampMeshes(map.theme, blk.x, blk.y, e.b.lamps);
    });
    for (const [i, e] of this.built) if (i >= map.blocks.length) this.drop(e.b), this.built.delete(i);
  }
}
