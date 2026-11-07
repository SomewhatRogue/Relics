/**
 * What a held block costs, and a striped blow met on the guard (Kyle, 2026-11-06: "Warrior block isn't
 * great against butcher. Should mitigate all damage, even unblockable"). A red blow blocked takes nothing
 * off your health (sim/combat.ts hitHero); its stamina is the blow's damage up to GUARD.knee and only
 * GUARD.past of each point above, and never more than GUARD.most, so one big blow doesn't empty the bar. A striped blow blocked facing it
 * lets GUARD.striped.through of itself reach your health (a Warrior's 25%, a Healer's 40%), costs
 * GUARD.striped.cost times the stamina, and shoves you hard; it opens no counter. Run out and the guard breaks.
 */
import { GUARD, HERO, HITSTOP, WEAPONS } from '../shared/tuning';
import { shove } from './bodies';
import { knack, statsOf } from './gearstats';
import { soak } from './holy';
import { braced } from './taunt';
import { bracedFor } from './poise';
import { count } from './score';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';

/** The stamina a block of a blow worth `dmg` costs this hero (`crush`: a heavy's crushing blow). */
export function blockBreath(h: Hero, dmg: number, crush = false): number {
  const g = statsOf(h), d = Math.min(dmg, GUARD.knee) + Math.max(0, dmg - GUARD.knee) * GUARD.past;
  return Math.min(GUARD.most, d * GUARD.staminaPerDmg * WEAPONS[h.weapon].guardCost * (crush ? GUARD.crushCost : 1)) * (1 - g.guard) * (1 - knack(h, 'block'));
}

/** The share of a striped blow that gets through this hero's block (1: their class can't block). */
export const stripedThrough = (h: Hero) => GUARD.striped.through[WEAPONS[h.weapon].cls] ?? 1;

/** A guard run out: winded, stunned, GUARD BREAK. */
export function guardBreak(h: Hero, ev: FightEvent[]): void {
  Object.assign(h, { stamina: 0, winded: true, act: 'stun', actT: 0, actDur: GUARD.guardBreakStun });
  ev.push({ k: 'guardbreak', x: h.x, y: h.y });
}

/**
 * A striped blow on a held guard facing it. `taken`: what the hero takes from everything (blessed, gear,
 * STAND FAST, chalk); `soft`: STAND FAST's own share (the stamina too); (sx, sy) the way it shoves.
 * Returns the health it took (the caller downs the hero if that was the last).
 */
export function blockStriped(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[], taken: number, soft: number, sx: number, sy: number): number {
  h.stamina -= blockBreath(h, a.dmg * soft) * GUARD.striped.cost;
  h.staminaAt = now;
  h.hitstop = Math.max(h.hitstop, HITSTOP.heavy);
  e.hitstop = Math.max(e.hitstop, HITSTOP.light);
  if (!braced(h, now) && !bracedFor(a)) shove(h, sx, sy, a.knock * GUARD.striped.shove, HERO.weight);
  count(h.id, 'blocks');
  const n = soak(h, Math.round(a.dmg * taken * stripedThrough(h)), now, ev);
  if (n > 0) {
    h.hp -= n;
    count(h.id, 'taken', n);
    ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: n >= 25, on: 'hero', src: a.kind });
  }
  if (h.stamina <= 0) guardBreak(h, ev);
  else ev.push({ k: 'block', x: h.x, y: h.y, striped: true });
  return n;
}
