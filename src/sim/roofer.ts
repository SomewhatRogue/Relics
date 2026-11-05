/**
 * A roof archer (numbers: shared/raiders.ts ROOF): up on a house, out of any blade's reach. It never
 * moves; it turns and shoots like any archer, from further. Arrows, spells, a thrown barrel or a hook
 * reach it (they cross levels); a house alight throws it off, burning and hurt by the fall.
 */
import { ARCHER, HEIGHT, ROOF } from '../shared/tuning';
import { currentMap, inArea } from '../shared/arena';
import { burning } from './catching';
import { damage, isDead } from './damage';
import { begin } from './enemies';
import { afflict, type World } from './elements';
import type { Enemy, FightEvent, Hero } from './types';

export const onRoof = (e: Enemy) => e.variant === 'roofer' && (e.z ?? 0) >= ROOF.z;

/** Up on a roof nothing shoves it (and nothing pushes it off the house it stands on). */
export function shapeRoofer(e: Enemy): void {
  if (onRoof(e)) e.weight = Infinity;
}

/** Its turn up there: shoot when ready, in reach and facing. */
export function stepRoofer(e: Enemy, t: Hero, d: number, facing: number, ev: FightEvent[]): void {
  if (d <= ROOF.reach && e.cooldown <= 0 && facing > 0.9) begin(e, 'shot', { ...ARCHER.shot, range: ROOF.reach + 0.5 }, t, ev);
}

/** Once a tick: a roof that's burning or fallen in throws its archer down into the street. */
export function stepRoofs(w: World): void {
  for (const e of w.enemies) {
    if (!onRoof(e) || isDead(e)) continue;
    const b = currentMap().blocks.find((q) => inArea(q, e.home.x, e.home.y));
    if (b && !b.ruined && !burning(b)) continue;
    // Down off the front of the house, where the door is.
    const y = b ? b.y + b.h + 0.6 : e.y + 1;
    Object.assign(e, { z: 0, y, weight: 1, attack: null, act: 'stunned', actT: 0, actDur: HEIGHT.fallStun * 2 });
    w.ev.push({ k: 'land', x: e.x, y: e.y, dx: 0, dy: 1 }, { k: 'rooffall', x: e.x, y: e.y });
    if (!damage(e, HEIGHT.fallDmg, w.now, w.ev, { how: 'fall' }) && b && burning(b)) afflict(w, e, 'fire', 6);
  }
}
