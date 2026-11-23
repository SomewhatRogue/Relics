/**
 * The movement ladder in the room, each tick after the heroes move (shared/ladder.ts has the rungs and
 * numbers): a dodge just begun (a blink's burst and its way through, a dash's caltrops and shaken-off
 * poison), a Rogue's shadow gone to smoke, a dodge just ended (a hard landing, out the far
 * side of a goblin), the Warrior's taunt, and the caltrops on the ground. The press-time pieces (a jump
 * shot, a half-price blink) are in sim/hero.ts; the guard's are in combat.ts.
 */
import { TICK, WEAPONS } from '../shared/tuning';
import type { World } from './elements';
import { hardLanding } from './ladderranger';
import { markRecall, blinkBurst } from './laddermage';
import { dashStart, shadowSmoke, stepCaltrops } from './ladderrogue';
import type { Smoke } from './flasks';
import { stepTaunt } from './taunt';
import { stepHolyGuard } from './holyguard';
import type { Coal } from './lantern';
import type { Hero, Zone } from './types';

export interface LadderRoom {
  zones: Zone[];
  /** Positions before this tick ('h:<id>'), for the stretch a dash covered. */
  prev: Map<string, [number, number]>;
  /** The censer's coals (a Cleric's guard is fed by their own). */
  coals: Coal[];
  /** Smoke in the room (a Rogue's shadow bursts into it). */
  smokes: Smoke[];
}

export function stepLadder(heroes: Hero[], r: LadderRoom, w: World): void {
  for (const h of heroes) {
    const cls = WEAPONS[h.weapon]?.cls, now = w.now;
    if (h.act === 'roll' && h.lastRollAt === now) {
      if (cls === 'MAGE') blinkBurst(h, r.zones, w), markRecall(h, now);
      else if (cls === 'ROGUE') dashStart(h, r.zones, w);
    }
    if (cls === 'ROGUE') shadowSmoke(h, r.smokes, now, w.ev);
    if (h.landedAt === now) {
      if (cls === 'RANGER') hardLanding(h, w.enemies, now, w.ev);
    }
    if (cls === 'WARRIOR') stepTaunt(h, w.enemies, r.zones, now, w.ev);
  }
  stepHolyGuard(heroes, r.coals, w.now, TICK);
  stepCaltrops(r.zones, w);
}
