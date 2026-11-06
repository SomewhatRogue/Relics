/**
 * A hero's first named butcher (docs/plans/bosses.md, "sure on a hero's first kill"; Kyle approved
 * 2026-11-06): whoever kills it gets a relic for sure, once a hero. It goes through awardRelic (the
 * 'named' source, on the room's own stream) straight into their relics with the found moment, so a
 * friend in someone else's room gets it in their save and its NEW RELIC moment as any pickup. The hero
 * carries `namedRelic` from their profile (client/game.ts equip) and back into it (client/relicnews.ts).
 * Later kills keep the chance as before: the floor's 4% (sim/pickups.ts dropRelic, its stream untouched).
 * A boss of the kit (its sure chest) and a zone's climax (the zone's own relic) don't count.
 */
import { awardRelic } from '../shared/relicaward';
import type { Rng } from '../shared/rng';
import { takeRelic } from './pickups';
import type { Enemy, FightEvent, Hero } from './types';

/** A named butcher whose death can give a relic (as the floor's chance has it). */
export const namedButcher = (e: Enemy) => !!e.name && !e.respawns && e.kind === 'butcher' && !e.boss && !e.zoned;

/** `e` just died: if its killer has never had their first named butcher's relic, they get it now. */
export function firstNamedRelic(e: Enemy, heroes: Hero[], rng: Rng, ev: FightEvent[]): boolean {
  if (!namedButcher(e)) return false;
  const h = heroes.find((x) => x.id === e.lastBy && x.id !== 'squire');
  if (!h || h.namedRelic) return false;
  h.namedRelic = true;
  takeRelic(h, awardRelic(null, rng, 'named', h.found), ev);
  return true;
}
