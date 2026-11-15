/**
 * A great boss's first kill (docs/design/relics.md section 1): beat it and, if you don't have its relic,
 * it's yours, no roll. Every hero in the room (a friend in someone else's room too: keepKit takes it
 * home) gets their own, straight into their relics with the found moment, carried if nothing is. Hempen
 * gives the butcher's knuckle; the Doorkeepers, both down, in the great barn (not their Deep floor), the
 * lodestone. The Haulier's hook is the Instances chat's to give at the Open Cut's end, through giveHome.
 */
import { bossRelic, type GreatBoss } from '../shared/relichomes';
import { makeRelic } from '../shared/relicitems';
import type { Rng } from '../shared/rng';
import { isDead } from './damage';
import { takeRelic } from './pickups';
import type { Enemy, FightEvent, Hero } from './types';

/** Give great boss `b`'s relic to every hero here who hasn't one of that kind. Returns who got it. */
export function giveHome(b: GreatBoss, heroes: Hero[], rng: Rng, ev: FightEvent[]): Hero[] {
  const kind = bossRelic(b);
  if (!kind) return [];
  const got: Hero[] = [];
  for (const h of heroes) {
    if (h.id === 'squire' || (h.found ?? []).some((r) => r.kind === kind)) continue;
    takeRelic(h, { ...makeRelic(rng, kind), from: b }, ev);
    got.push(h);
  }
  return got;
}

/** Which great boss `e`'s death beats (none: not one, or its partner still stands). `floor`: a Deep floor. */
export function beaten(e: Enemy, enemies: Enemy[], floor: number): GreatBoss | undefined {
  const who = e.boss?.who;
  if (who === 'hempen') return 'hempen';
  if ((who === 'latch' || who === 'hasp') && floor === 0) {
    const pair = enemies.filter((x) => x.boss?.who === 'latch' || x.boss?.who === 'hasp');
    return pair.every((x) => isDead(x)) ? 'doorkeepers' : undefined;
  }
  return undefined;
}

/** Those just dead: any great boss beaten gives its relic. */
export function bossRelics(dead: Enemy[], enemies: Enemy[], heroes: Hero[], floor: number, rng: Rng, ev: FightEvent[]): void {
  for (const e of dead) {
    const b = beaten(e, enemies, floor);
    if (b) giveHome(b, heroes, rng, ev);
  }
}
