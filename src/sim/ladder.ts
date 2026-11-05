/**
 * The movement ladder in the room, each tick after the heroes move (shared/ladder.ts has the rungs and
 * numbers): a dodge just begun (a blink's burst and its way through, a dash's caltrops and shaken-off
 * poison), a dash under way (through a goblin's legs), a dodge just ended (a hard landing, out the far
 * side of a goblin), the Warrior's taunt, and the caltrops on the ground. The press-time pieces (a jump
 * shot, a half-price blink) are in sim/hero.ts; the guard's are in combat.ts.
 */
import { WEAPONS } from '../shared/tuning';
import type { World } from './elements';
import { hardLanding } from './ladderranger';
import { blinkBurst, blinkThrough, cameThrough } from './laddermage';
import { dashStart, dashThrough, stepCaltrops } from './ladderrogue';
import { stepTaunt } from './taunt';
import type { Hero, Zone } from './types';

export interface LadderRoom {
  zones: Zone[];
  /** Positions before this tick ('h:<id>'), for the stretch a dash covered. */
  prev: Map<string, [number, number]>;
}

export function stepLadder(heroes: Hero[], r: LadderRoom, w: World): void {
  for (const h of heroes) {
    const cls = WEAPONS[h.weapon]?.cls, now = w.now;
    if (h.act === 'roll' && h.lastRollAt === now) {
      if (cls === 'MAGE') blinkBurst(h, r.zones, w), blinkThrough(h, w.enemies);
      else if (cls === 'ROGUE') dashStart(h, r.zones, w);
    } else if (h.act === 'roll' && cls === 'ROGUE') {
      const [px, py] = r.prev.get('h:' + h.id) ?? [h.x, h.y];
      dashThrough(h, px, py, w.enemies, now, w.ev);
    }
    if (h.landedAt === now) {
      if (cls === 'RANGER') hardLanding(h, w.enemies, now, w.ev);
      else if (cls === 'MAGE') cameThrough(h, w.enemies, w.ev);
    }
    if (cls === 'WARRIOR') stepTaunt(h, w.enemies, r.zones, now, w.ev);
  }
  stepCaltrops(r.zones, w);
}
