/**
 * The room's buildings and other blocks, each built once and rebuilt only when its state changes
 * (hurt to charred, set alight, burned down). A roof lifts off (the walls dropping low) while you're behind its building, so
 * you're never lost behind a cottage.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { stacked } from './layoutledges';
import { blockState, buildBlock, type Built } from './houses3d';
import { levelAt } from '../../shared/arena';
import { LEDGE_H } from './ground';
import type { Spot } from './rounds3d';
import { setLampMeshes } from './lamps3d';
import { houseAlight, kindling } from '../../shared/kindling';
import { gradeBuilt } from './darkgold3d';
import { fadeKit, ghostKit, OLD_HOLE, STREET } from './streetkit';
import { streetAround } from './streetrow';
import { PITCH } from './camera3d';
import { SWING } from '../swing';
import { hides } from '../streethole';

/** How far a kit building fades when it's in the way: three pixels in ten still drawn. */
const FADE_TO = 0.3;


export class Buildings {
  readonly group = new THREE.Group();
  /** By the block's place in the map's list (a friend's copy of the room gets new block objects on every update). */
  private built = new Map<number, { b: Built; key: string; ghost?: boolean; fade?: number; behind?: number }>();
  private last = 0;

  clear(): void {
    for (const { b } of this.built.values()) this.drop(b);
    this.built.clear();
  }

  private drop(b: Built): void {
    this.group.remove(b.group);
    b.group.traverse((o) => (o as THREE.Mesh).isMesh && (o as THREE.Mesh).geometry.dispose());
  }

  /**
   * Bring every block up to date; `me` (tiles) lifts the roof of a building you're behind (under `?street`, fades it),
   * `foes` (tiles, live and near) fade one that hides them. Adds flames to `fires`.
   */
  update(map: GameMap, me: [number, number] | null, fires: Spot[], foes: [number, number][] = []): void {
    const now = performance.now(), dt = Math.min(0.1, (now - (this.last || now)) / 1000);
    this.last = now;
    if (STREET) streetAround(map.blocks, map.w, map.h);
    map.blocks.forEach((blk, i) => {
      if (blk.kind === 'sideway') return;
      // (A felled trunk still in the air has no body yet: extras3d.ts draws its fall. sim/felling.ts.)
      if (blk.lands !== undefined) return;
      const key = `${blk.kind}:${blk.x}:${blk.y}:${blk.w}:${blk.h}:${blk.door ?? ''}:${blk.locked ? 1 : 0}:${blockState(blk)}:${blk.deck ? 1 : 0}:${blk.shut ?? ''}`;
      let e = this.built.get(i);
      if (!e || e.key !== key) {
        if (e) this.drop(e.b);
        e = { b: buildBlock(blk, kindling(blk, map)), key };
        // Dark and gold: the colours graded and moss laid on, once per build (darkgold3d.ts).
        gradeBuilt(e.b.group, e.b.roof, Math.round(blk.x * 31 + blk.y * 17));
        // Standing on a stacked level (the new town: docs/design/town-layout.md), lifted onto it.
        if (stacked(map)) e.b.group.position.y = levelAt(map, blk.x + blk.w / 2, blk.y + blk.h / 2) * LEDGE_H;
        this.group.add(e.b.group);
        this.built.set(i, e);
      }
      const roof = e.b.roof;
      // The new look's street (streetkit.ts): a kit building between your hero and the swung camera goes see-through
      // round them instead; nothing lifts or drops.
      if (STREET && roof) {
        const hid = !!me && hides(me, blk.x, blk.y, blk.x + blk.w, blk.y + blk.h, e.b.top, SWING.yaw, PITCH);
        if (OLD_HOLE) {
          if (e.ghost !== hid) ghostKit(e.b.group, (e.ghost = hid));
        } else {
          // Your silhouette shows through at once (the x-ray pass); the whole building fades once you've been behind
          // it half a second, or straight away if it hides a foe near you. A quarter second down, a quarter back.
          e.behind = hid ? (e.behind ?? 0) + dt : 0;
          const foe = foes.some((f) => hides(f, blk.x, blk.y, blk.x + blk.w, blk.y + blk.h, e.b.top, SWING.yaw, PITCH));
          const want = (hid && e.behind > 0.5) || foe ? FADE_TO : 1, was = e.fade ?? 1;
          const k = want < was ? Math.max(want, was - (dt * (1 - FADE_TO)) / 0.25) : Math.min(want, was + (dt * (1 - FADE_TO)) / 0.25);
          if (k !== was || e.fade === undefined) fadeKit(e.b.group, (e.fade = k));
        }
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

  /** Where the lit windows and door lamps are this frame (tiles), for their haze (air3d.ts). Read only. */
  panes(out: THREE.Vector3[]): void {
    for (const { b } of this.built.values()) {
      if (!b.group.visible) continue;
      for (const m of b.lamps) if (m.visible && m.material === m.userData.lamp.on) out.push(m.getWorldPosition(new THREE.Vector3()));
    }
  }
}
