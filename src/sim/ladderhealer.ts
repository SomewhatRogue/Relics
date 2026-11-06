/**
 * The Healer's movement ladder, the guard (the Healer has no dodge; numbers: shared/ladder.ts). SHELTER:
 * friends near a Healer holding a block take less. HEALING BLOCK: each blow blocked heals friends near. COVER: a
 * Healer blocking right beside a friend, facing the blow, takes it on the guard for them. All judged in
 * combat.ts hitHero, which hands over the room's heroes.
 */
import { GUARD, HITSTOP, WEAPONS } from '../shared/tuning';
import { BLOCK_MEND, COVER, SHELTER, knowsRung, type RungId } from '../shared/ladder';
import { shove } from './bodies';
import { knack, statsOf } from './gearstats';
import { mend } from './holy';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';
import { count } from './score';

/** A Healer other than `h`, holding a block, who knows `id`, within `reach` of `h`. */
function guardian(h: Hero, heroes: Hero[], id: RungId, reach: number): Hero | undefined {
  return heroes.find((c) => c !== h && c.blocking && c.act !== 'down' && WEAPONS[c.weapon]?.cls === 'HEALER' && knowsRung(c, id) && Math.hypot(c.x - h.x, c.y - h.y) <= reach);
}

/** SHELTER: what share of a blow `h` takes (a Healer blocking near: less, and a glint says so). */
export function shelter(h: Hero, heroes: Hero[], ev: FightEvent[]): number {
  if (!guardian(h, heroes, 'shelter', SHELTER.reach)) return 1;
  ev.push({ k: 'shelter', x: h.x, y: h.y });
  return SHELTER.taken;
}

/** HEALING BLOCK: a blow a Healer blocks heals the friends near them. */
export function blockMend(h: Hero, heroes: Hero[], ev: FightEvent[]): void {
  if (WEAPONS[h.weapon]?.cls !== 'HEALER' || !knowsRung(h, 'blockmend')) return;
  const near = heroes.filter((o) => o !== h && o.act !== 'down' && Math.hypot(o.x - h.x, o.y - h.y) <= BLOCK_MEND.reach);
  if (!near.length) return;
  ev.push({ k: 'blockmend', x: h.x, y: h.y, r: BLOCK_MEND.reach });
  for (const o of near) mend(h, o, BLOCK_MEND.heal, ev);
}

/**
 * COVER: a blockable blow on `h` with a Healer blocking beside them who faces where it comes from: the
 * Healer takes it on the guard (breath, as their own block would cost, a guard break if it runs out) and
 * `h` takes nothing. `soft` is what the blow is worth (STAND FAST). True if it was covered.
 */
export function cover(e: Enemy, a: EnemyAttack, h: Hero, heroes: Hero[], soft: number, now: number, ev: FightEvent[]): boolean {
  if (a.unblockable || a.kind === 'draw') return false;
  const c = guardian(h, heroes, 'cover', COVER.reach);
  if (!c || c.winded || (c.act !== 'idle' && c.act !== 'attack' && c.act !== 'charge')) return false;
  const w = WEAPONS[c.weapon], tx = e.x - c.x, ty = e.y - c.y, tl = Math.hypot(tx, ty) || 1;
  if ((c.fx * tx + c.fy * ty) / tl <= Math.cos(((w.guardArc / 2) * Math.PI) / 180)) return false;
  c.stamina -= a.dmg * soft * GUARD.staminaPerDmg * w.guardCost * (a.crush ? GUARD.crushCost : 1) * (1 - statsOf(c).guard) * (1 - knack(c, 'block'));
  c.staminaAt = now;
  c.hitstop = Math.max(c.hitstop, HITSTOP.light);
  shove(c, -tx / tl, -ty / tl, a.knock * 0.4, 1);
  ev.push({ k: 'coverfor', x: c.x, y: c.y, x2: h.x, y2: h.y });
  count(c.id, 'blocks');
  if (c.stamina > 0) return ev.push({ k: 'block', x: c.x, y: c.y }), true;
  Object.assign(c, { stamina: 0, winded: true, act: 'stun', actT: 0, actDur: GUARD.guardBreakStun });
  ev.push({ k: 'guardbreak', x: c.x, y: c.y });
  return true;
}
