/**
 * Who else is about, beside the room's fighters (actors3d.ts): the map's people (Wickhold's folk, Hew,
 * the dead on the field: npcs3d.ts and work3d.ts), other players' heroes in town (drawn only, never in
 * the room), and a Mage's blink image flickering where they stood until it goes.
 */
import * as THREE from 'three';
import { npcAt, type GameMap } from '../../shared/arena';
import type { ArenaRoom } from '../../sim/room';
import type { Hero } from '../../sim/types';
import { clsOf, heroKey, makeHero, type HeroFig } from './heroes3d';
import { poseHero } from './heropose3d';
import { GHOST } from './mats';
import { makeNpc, type NpcFig } from './npcs3d';
import { Pool } from './pool3d';
import { flash } from './rig';
import { poseNpc } from './work3d';

export class People {
  readonly group = new THREE.Group();
  private npcs = new Pool<NpcFig>(this.group);
  private others = new Pool<HeroFig>(this.group);
  private decoys = new Pool<HeroFig>(this.group);
  private walked = new Map<string, [number, number, number]>();

  private stride(key: string, x: number, y: number): number {
    const w = this.walked.get(key);
    if (!w) return this.walked.set(key, [x, y, 0]), 0;
    w[2] += Math.min(1, Math.hypot(x - w[0], y - w[1]));
    w[0] = x;
    w[1] = y;
    return w[2];
  }

  update(room: ArenaRoom, map: GameMap, others: Hero[], now: number): void {
    for (const p of [this.npcs, this.others, this.decoys]) p.begin();
    (map.npcs ?? []).forEach((n, i) => {
      const at = npcAt(n, room.time), key = 'n' + i + n.name, f = this.npcs.get(key, n.look, () => makeNpc(n.look));
      poseNpc(f, n, at.fx, at.fy, at.x, now, this.stride(key, at.x, at.y));
      f.root.position.set(at.x, f.root.position.y, at.y);
    });
    for (const h of others) {
      const f = this.others.get('o' + h.id, heroKey(h), () => makeHero(clsOf(h.weapon), h.look ?? 0, h.weapon));
      poseHero(f, h, now, this.stride('o' + h.id, h.x, h.y));
      f.root.position.set(h.x, f.root.position.y, h.y);
    }
    for (const h of room.heroes) {
      if (!(h.decoyUntil > room.time)) continue;
      const f = this.decoys.get('v' + h.id, heroKey(h), () => makeHero(clsOf(h.weapon), h.look ?? 0, h.weapon));
      poseHero(f, { ...h, act: 'idle', actT: 0, moving: false, blocking: false }, now, 0);
      flash(f, true, GHOST);
      f.root.position.set(h.decoyX, 0, h.decoyY);
      // Flickering, and thinning in its last half second.
      const left = h.decoyUntil - room.time;
      f.root.visible = Math.sin(room.time * 18) > -0.5 && (left > 0.5 || Math.floor(now * 20) % 2 === 0);
    }
    for (const p of [this.npcs, this.others, this.decoys]) p.end();
  }

  clear(): void {
    for (const p of [this.npcs, this.others, this.decoys]) p.clear();
    this.walked.clear();
  }
}
