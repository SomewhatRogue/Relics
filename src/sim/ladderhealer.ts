/**
 * The Cleric's guard ladder (the Cleric has no dodge; numbers: shared/ladder.ts). The guard itself is a
 * holy ward round the Cleric (sim/holyguard.ts). SHELTER: friends near a Cleric holding it take less.
 * SHARED WARD (Kyle, 2026-11-05: "you AND an ally, the ally for free but again stamina drain"; it took
 * COVER's place, 2026-11-06): the nearest friend within reach is covered too, and takes nothing from a
 * blow the guard could stop; the Cleric's stamina drains while it covers someone (sim/holyguard.ts
 * stepHolyGuard). HEALING BLOCK: each blow blocked heals friends near. All judged in combat.ts hitHero,
 * which hands over the room's heroes.
 */
import { WEAPONS } from '../shared/tuning';
import { ALLY_WARD, BLOCK_MEND, SHELTER, knowsRung, type RungId } from '../shared/ladder';
import { mend } from './holy';
import type { EnemyAttack, FightEvent, Hero } from './types';

const cleric = (c: Hero) => WEAPONS[c.weapon]?.cls === 'HEALER';

/** A Cleric other than `h`, holding their guard, who knows `id`, within `reach` of `h`. */
function guardian(h: Hero, heroes: Hero[], id: RungId, reach: number): Hero | undefined {
  return heroes.find((c) => c !== h && c.blocking && c.act !== 'down' && cleric(c) && knowsRung(c, id) && Math.hypot(c.x - h.x, c.y - h.y) <= reach);
}

/** SHELTER: what share of a blow `h` takes (a Cleric guarding near: less, and a glint says so). */
export function shelter(h: Hero, heroes: Hero[], ev: FightEvent[]): number {
  if (!guardian(h, heroes, 'shelter', SHELTER.reach)) return 1;
  ev.push({ k: 'shelter', x: h.x, y: h.y });
  return SHELTER.taken;
}

/** HEALING BLOCK: a blow a Cleric blocks heals the friends near them. */
export function blockMend(h: Hero, heroes: Hero[], ev: FightEvent[]): void {
  if (!cleric(h) || !knowsRung(h, 'blockmend')) return;
  const near = heroes.filter((o) => o !== h && o.act !== 'down' && Math.hypot(o.x - h.x, o.y - h.y) <= BLOCK_MEND.reach);
  if (!near.length) return;
  ev.push({ k: 'blockmend', x: h.x, y: h.y, r: BLOCK_MEND.reach });
  for (const o of near) mend(h, o, BLOCK_MEND.heal, ev);
}

/** SHARED WARD: the friend a guarding Cleric covers now (the nearest in reach), or undefined. */
export function wardedFriend(c: Hero, heroes: Hero[]): Hero | undefined {
  if (!c.blocking || c.act === 'down' || !cleric(c) || !knowsRung(c, 'allyward')) return undefined;
  let best: Hero | undefined, bd = ALLY_WARD.reach;
  for (const o of heroes) {
    if (o === c || o.act === 'down') continue;
    const d = Math.hypot(o.x - c.x, o.y - c.y);
    if (d <= bd) (best = o), (bd = d);
  }
  return best;
}

/**
 * SHARED WARD: a blow the guard could stop, on `h`, with a Cleric covering them: it lands on nothing (the
 * Cleric pays in the drain, not per blow). True if it was covered.
 */
export function cover(a: EnemyAttack, h: Hero, heroes: Hero[], ev: FightEvent[]): boolean {
  if (a.unblockable || a.kind === 'draw') return false;
  const c = heroes.find((o) => o !== h && wardedFriend(o, heroes) === h);
  if (!c) return false;
  ev.push({ k: 'coverfor', x: c.x, y: c.y, x2: h.x, y2: h.y }, { k: 'block', x: h.x, y: h.y });
  return true;
}
