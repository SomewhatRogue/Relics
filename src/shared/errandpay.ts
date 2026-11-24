/**
 * What the town's small quests pay (Kyle, 2026-11-24: "quests when you talk to someone or do something ... pay ~20c
 * to ~40c and potentially give a low level item so you have something to equip and try"). In copper. The trainer's
 * first meeting pays in kind: a plain weapon of a kind you hold nothing for yet, into the pack. Pure, on the profile;
 * the client shows it (client/errandpaid.ts).
 */
import { bagFull } from './bags.js';
import { seedOf } from './fishing.js';
import { rollGear } from './gear.js';
import type { Item } from './loot.js';
import type { Profile } from './progress.js';
import { Rng } from './rng.js';
import { CLASS_KITS, type WeaponId } from './weapons.js';

/** Copper for each errand done: the church's refill, the yard, and the talks about hungry gear. */
export const ERRAND_PAY = { relic: 20, yard: 40, nettle: 20, church: 30, under: 30 } as const;
export type PaidErrand = keyof typeof ERRAND_PAY;

/** Pays an errand into the purse (and the COIN EARNED tally). The copper paid. */
export function payErrand(p: Profile, id: PaidErrand): number {
  const n = ERRAND_PAY[id];
  p.gold += n;
  if (p.stats) p.stats.gold += n;
  return n;
}

/** A kind of your class's weapon you hold nothing for yet: not the one in hand, nothing kept for it, none in the pack. */
export function newKit(p: Profile): WeaponId | null {
  const held = (k: WeaponId) => k === p.weapon || !!p.arms[k] || p.bag.some((i) => (i.slot ?? 'weapon') === 'weapon' && i.kit === k);
  return CLASS_KITS[p.cls].find((k) => !held(k)) ?? null;
}

/** The trainer's gift at the first meeting: a plain one of that kind, into the pack (seeded by the hero). Null if none
 *  is left to give or the pack's full. */
export function trainerGift(p: Profile): Item | null {
  const kit = newKit(p);
  if (!kit || bagFull(p)) return null;
  const it = rollGear(new Rng(seedOf(p.id, 41)), p.cls, 'plain', 'weapon', kit);
  p.bag.push(it);
  return it;
}
