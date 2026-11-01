/**
 * The pack: weapons carried but not in hand, and the relics a hero has won. Changes come in as an
 * intent (sim/types.ts gearOp) and the room applies them, so a friend's pack works the same online.
 * The world doesn't stop while you rummage.
 */
import { CLASS_KITS, RELICS, WEAPONS, abilitiesOf, itemName } from '../shared/tuning';
import type { FightEvent, Hero } from './types';

/** Weapons a pack holds. */
export const PACK = 8;
export const GEAR = { equip: 1, drop: 2, carry: 3 } as const;

export function applyGear(h: Hero, op: number, arg: number, ev: FightEvent[]): void {
  const cls = WEAPONS[h.weapon].cls;
  if (op === GEAR.equip) {
    const it = arg >= 0 ? h.bag[arg] : undefined;
    if (arg >= 0 && (!it || WEAPONS[it.kit].cls !== cls)) return;
    const old = h.arms[h.weapon];
    if (it) h.bag.splice(arg, 1);
    if (old) h.bag.push(old);
    h.weapon = it ? it.kit : CLASS_KITS[cls][0];
    h.arms = it ? { [it.kit]: it } : {};
    Object.assign(h, { combo: 0, heavy: false, power: 0 });
    ev.push({ k: 'weapon', x: h.x, y: h.y, name: it ? itemName(it) : WEAPONS[h.weapon].name });
  } else if (op === GEAR.drop) {
    if (h.bag[arg]) h.bag.splice(arg, 1);
  } else if (op === GEAR.carry) {
    const r = arg >= 0 ? h.found[arg] : undefined;
    if (arg >= 0 && !r) return;
    h.relics = abilitiesOf(cls, r);
    if (!h.relics.includes(h.relic)) h.relic = h.relics[0];
    ev.push({ k: 'relic', x: h.x, y: h.y, name: r ? RELICS[r].name : RELICS[h.relics[0]].name });
  }
}
