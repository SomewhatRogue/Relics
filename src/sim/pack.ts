/**
 * The pack: weapons carried but not in hand, and the relics a hero has won. Changes come in as an
 * intent (sim/types.ts gearOp) and the room applies them, so a friend's pack works the same online.
 * The world doesn't stop while you rummage.
 */
import { relicName } from '../shared/relicitems';
import { CLASS_KITS, RELICS, WEAPONS, abilitiesOf, itemName, slotOf, type Item } from '../shared/tuning';
import { refreshHealth } from './gearstats';
import { BAG } from '../shared/bags';
import type { FightEvent, Hero, Intent } from './types';

/** What a new pack holds (it's bought bigger in town: shared/bags.ts). */
export const PACK = BAG.start;
/** No room left in this hero's pack. */
export const full = (h: Hero) => h.bag.length >= (h.bagSize || BAG.start);
export const GEAR = { equip: 1, drop: 2, carry: 3, front: 4, pour: 5, off: 6, unarm: 7 } as const;

/** Put on armor (the old goes in the pack) or a ring (a third pushes out the older). */
function wear(h: Hero, i: number, it: Item, ev: FightEvent[]): void {
  h.bag.splice(i, 1);
  if (slotOf(it) === 'armor') {
    if (h.armor) h.bag.push(h.armor);
    h.armor = it;
  } else {
    // A third ring pushes out the older, never Someone's Wedding Ring (only the church takes that off).
    if (h.rings.length >= 2) {
      const k = h.rings[0].hungry === 'wedding' ? 1 : 0;
      if (h.rings[k].hungry === 'wedding') return void h.bag.splice(i, 0, it);
      h.bag.push(h.rings.splice(k, 1)[0]);
    }
    h.rings.push(it);
  }
  refreshHealth(h);
  ev.push({ k: 'weapon', x: h.x, y: h.y, name: itemName(it) });
}

export function applyGear(h: Hero, op: number, arg: number, ev: FightEvent[]): void {
  const cls = WEAPONS[h.weapon].cls;
  if (op === GEAR.equip) {
    const it = arg >= 0 ? h.bag[arg] : undefined;
    if ((arg >= 0 && !it) || (arg < 0 && h.arms[h.weapon] && full(h))) return;
    if (it && slotOf(it) !== 'weapon') return wear(h, arg, it, ev);
    if (it && WEAPONS[it.kit!].cls !== cls) return;
    // What was in hand goes in the pack, the plain one a hero starts with too (so it's never lost under the new).
    const old = h.arms[h.weapon] ?? (it ? ({ slot: 'weapon', kit: h.weapon, quality: 'plain', traits: [], mods: [], level: 0 } as Item) : undefined);
    if (it) h.bag.splice(arg, 1);
    if (old) h.bag.push(old);
    h.weapon = it ? it.kit! : CLASS_KITS[cls][0];
    h.arms = it ? { [it.kit!]: it } : {};
    Object.assign(h, { combo: 0, heavy: false, power: 0 });
    refreshHealth(h);
    ev.push({ k: 'weapon', x: h.x, y: h.y, name: it ? itemName(it) : WEAPONS[h.weapon].name });
  } else if (op === GEAR.off) {
    // A ring off, into the pack (if there's room).
    const r = h.rings[arg];
    if (!r || full(h) || r.hungry === 'wedding') return;
    h.rings.splice(arg, 1);
    h.bag.push(r);
    refreshHealth(h);
  } else if (op === GEAR.unarm) {
    // Armor off, into the pack (if there's room).
    if (!h.armor || full(h)) return;
    h.bag.push(h.armor);
    h.armor = null;
    refreshHealth(h);
  } else if (op === GEAR.drop) {
    // Hungry gear can't be dropped: only given up at the church.
    if (h.bag[arg] && h.bag[arg].quality !== 'hungry') h.bag.splice(arg, 1);
  } else if (op === GEAR.front) {
    // A potion to the front of the belt (drunk next).
    const [p] = h.belt.splice(arg, 1);
    if (p) h.belt.unshift(p);
  } else if (op === GEAR.pour) {
    h.belt.splice(arg, 1);
  } else if (op === GEAR.carry) {
    const r = arg >= 0 ? h.found[arg] : undefined;
    if (arg >= 0 && !r) return;
    const was = h.relic === h.relics[1];
    h.relics = abilitiesOf(cls, r?.kind, h.relics[0]);
    h.relicItem = r?.id ?? '';
    // Its element is built in (shared/relicitems.ts).
    if (r) h.augments[r.kind] = r.el;
    if (!h.relics.includes(h.relic) || (was && r)) h.relic = r ? r.kind : h.relics[0];
    ev.push({ k: 'relic', x: h.x, y: h.y, name: r ? relicName(r) : RELICS[h.relics[0]].name });
  }
}

/**
 * Turn the belt once a press (counted, so two quick long presses turn it twice, and a guest's work the
 * same as yours): the potion at the front goes to the back until a different kind is at the front.
 * Nothing is drunk; the one now at the front says its name. Any time, mid-fight too.
 */
export function turnBelt(h: Hero, inp: Intent, ev: FightEvent[]): void {
  const seq = inp.beltSeq ?? h.seen.belt ?? 0, n = Math.min(3, seq - (h.seen.belt ?? 0));
  h.seen.belt = seq;
  for (let k = 0; k < n && h.belt.length; k++) {
    const was = h.belt[0];
    for (let i = 0; i < h.belt.length - 1 && h.belt[0] === was; i++) h.belt.push(h.belt.shift()!);
    ev.push({ k: 'potion', x: h.x, y: h.y, kind: h.belt[0] });
  }
}
