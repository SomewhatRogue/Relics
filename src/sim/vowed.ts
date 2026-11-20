/**
 * VOWED gear in the fight (shared/vowed.ts; docs/design/holy-gear.md). Nothing while DIM (any hungry piece worn).
 * - The costs: on the wearer's stats, after everything else (`withVowed`, sim/gearstats.ts).
 * - Damage: THE BREACH MAIL, friends near its wearer take less; THE RETURNED PAIR's backstab, the same a moment
 *   (`vowedGuard`, on a blow landing, sim/combat.ts).
 * - THE WIDOW'S SWORD: a block gives the nearest friend stamina (`vowedBlock`, the block path, sim/combat.ts).
 * - Blows on goblins (`noteVowed`, sim/damage.ts) are queued and paid each tick with the party in hand
 *   (`payVowed`, sim/room.ts): KETTERBY'S BOW's full draw heals the nearest friend, THE RETURNED PAIR's backstab
 *   guards friends near, THE APPRENTICE'S STAFF's kill refills the nearest friend's bar.
 * - THE INFIRMARY CENSER: a heal on a friend reaches the next nearest at half (`noteCarry`, from `mend`, sim/holy.ts);
 *   its cost, heals on yourself at half, is in `heals` (sim/hungry.ts). THE CART-HAND'S COAT raises twice as fast (sim/party.ts).
 * Both rings' relic gifts are asked of the Relics chat (its relic charges and uses).
 */
import type { GearStats } from '../shared/tuning';
import { VOWED_FX, dimmed, vowedOf, type VowedId } from '../shared/vowed';
import type { FightEvent, Hero } from './types';
import { mend } from './holy';
import { healMult } from './lantern';
import { breathCap } from './brandy';

const wornBy = (h: Hero) => [h.arms?.[h.weapon], h.armor, h.legs, ...(h.rings ?? [])];
/** Wearing vowed piece `id`, and not dim. */
export const vowedOn = (h: Hero | undefined, id: VowedId) => !!h && !dimmed(h) && wornBy(h).some((it) => vowedOf(it) === id);

/** The costs, on the wearer's own stats. */
export function withVowed(s: GearStats, h: Hero): void {
  if (dimmed(h)) return;
  for (const it of wornBy(h)) {
    const id = vowedOf(it);
    if (id === 'widow') s.foot -= VOWED_FX.slowSword;
    else if (id === 'breach') s.foot -= VOWED_FX.slowMail;
    else if (id === 'ketterby') s.draw -= VOWED_FX.drawLonger;
    else if (id === 'returned') s.dodgeCost *= 1 + VOWED_FX.dodge;
    else if (id === 'apprentice') s.focus -= VOWED_FX.skill;
    else if (id === 'carthand') s.taken *= 1 + VOWED_FX.coat;
  }
}

const near = (a: Hero, b: Hero) => (a.z ?? 0) === (b.z ?? 0) && Math.hypot(a.x - b.x, a.y - b.y) <= VOWED_FX.near;
const up = (o: Hero) => o.act !== 'down' && o.hp > 0;
/** The nearest standing friend in reach, or none. */
function nearest(h: Hero, heroes: Hero[]): Hero | undefined {
  let best: Hero | undefined, bd = Infinity;
  for (const o of heroes) {
    const d = Math.hypot(o.x - h.x, o.y - h.y);
    if (o !== h && up(o) && near(h, o) && d < bd) (best = o), (bd = d);
  }
  return best;
}
const fill = (o: Hero, n: number, now: number) => (o.stamina = Math.min(breathCap(o, now), o.stamina + n));

/** The friends each backstab guarded, and until when. */
const guarded = new WeakMap<Hero, number>();
/** What's left of a blow on `h`: less near a friend in THE BREACH MAIL, and while a RETURNED PAIR backstab guards. */
export function vowedGuard(h: Hero, heroes: Hero[], now: number): number {
  let k = 1;
  if (heroes.some((o) => o !== h && up(o) && near(h, o) && vowedOn(o, 'breach'))) k *= 1 - VOWED_FX.breach;
  if ((guarded.get(h) ?? -1) > now) k *= 1 - VOWED_FX.ward;
  return k;
}

/** A block held with THE WIDOW'S SWORD: the nearest friend gets some stamina. */
export function vowedBlock(h: Hero, heroes: Hero[], now: number): void {
  if (!vowedOn(h, 'widow')) return;
  const o = nearest(h, heroes);
  if (o) fill(o, VOWED_FX.stam, now);
}

/** Blows on goblins this tick that a vowed gift may pay for, by who struck them. */
const queue: { by: string; backstab: boolean; charged: boolean; killed: boolean }[] = [];
export function noteVowed(by: string | undefined, o: { backstab?: boolean; charged?: boolean }, killed: boolean): void {
  if (by && (o.backstab || o.charged || killed)) queue.push({ by, backstab: !!o.backstab, charged: !!o.charged, killed });
}
/** Heals a censer's wearer gave friends this tick, to carry to a second. */
const carries: { by: Hero; to: Hero; n: number }[] = [];
let carrying = false;
export function noteCarry(by: Hero, to: Hero, n: number): void {
  if (!carrying && n > 0 && vowedOn(by, 'infirmary')) carries.push({ by, to, n });
}
/** Pay what was queued, with the party in hand; the queues are emptied either way. */
export function payVowed(heroes: Hero[], now: number, ev: FightEvent[]): void {
  carrying = true;
  for (const c of carries.splice(0)) {
    if (!heroes.includes(c.by)) continue;
    const o = nearest(c.to, heroes.filter((x) => x !== c.by));
    // Half of what landed, already grown once by the healer's own (so `mend` doesn't grow it twice).
    if (o) mend(c.by, o, (c.n * VOWED_FX.carry) / healMult(c.by), ev);
  }
  carrying = false;
  for (const q of queue.splice(0)) {
    const h = heroes.find((x) => x.id === q.by);
    if (!h || !up(h)) continue;
    if (q.charged && vowedOn(h, 'ketterby')) {
      const o = nearest(h, heroes);
      if (o) mend(h, o, VOWED_FX.draw, ev);
    }
    if (q.backstab && vowedOn(h, 'returned')) for (const o of heroes) if (o !== h && up(o) && near(h, o)) guarded.set(o, now + VOWED_FX.wardFor);
    if (q.killed && vowedOn(h, 'apprentice')) {
      const o = nearest(h, heroes);
      if (o) fill(o, VOWED_FX.stam, now);
    }
  }
}

/** For the Relics chat to call (asked): how many more uses `h`'s relic holds, THE SWORN-OFF RING's gift. */
export const moreRelicUses = (h: Hero) => (vowedOn(h, 'swornoff') ? VOWED_FX.relicUses : 0);
/** For the Relics chat to call on a relic used (asked): THE TITHE RING heals friends near its wearer. */
export function vowedRelicUsed(h: Hero, heroes: Hero[], ev: FightEvent[]): void {
  if (!vowedOn(h, 'tithe')) return;
  for (const o of heroes) if (o !== h && up(o) && near(h, o)) mend(h, o, VOWED_FX.tithe, ev);
}
