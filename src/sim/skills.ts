/**
 * The class skills a trainer teaches after the first (shared/skillkit.ts), fired and stepped for the
 * room. The room hands over its lists; everything they leave is in lists a friend's screen is sent
 * already (zones, bolts, smokes, the heroes and goblins themselves).
 */
import { VOLLEY, type RelicId } from '../shared/tuning';
import { fireRing, stepAreas, volley } from './areas';
import { censerChain, lanternLight, stepTows } from './cleric';
import type { World } from './elements';
import { spotFor } from './facing';
import type { Smoke } from './flasks';
import { knifeFan, vanish } from './rogue';
import { sendHound, stepSic } from './sic';
import { stamp } from './stamp';
import { startTether, stepTethers } from './tether';
import type { Bolt, Hero, Intent, Zone } from './types';

export interface SkillRoom { zones: Zone[]; bolts: Bolt[]; smokes: Smoke[]; intents: Map<string, Intent> }

export const TAUGHT: RelicId[] = ['stamp', 'volley', 'sic', 'vanish', 'knives', 'firering', 'tether', 'chain', 'light'];

/** Fire one of these skills; false if `h.relic` isn't one of them. `mult`: the hero's damage now. */
export function fireSkill(h: Hero, r: SkillRoom, w: World, mult: number): boolean {
  const el = h.augments[h.relic], aim = r.intents.get(h.id);
  switch (h.relic) {
    case 'stamp': return stamp(h, w, el), true;
    case 'volley': return r.zones.push(volley(h, spotFor(h, w.enemies, aim, VOLLEY.range, VOLLEY.fallback), w.now, el, w)), true;
    case 'sic': return sendHound(h, w.enemies, w.now, w.ev), true;
    case 'vanish': return vanish(h, w.enemies, r.smokes, w.now, w.ev), true;
    case 'knives': return r.bolts.push(...knifeFan(h, el, mult, w.ev)), true;
    case 'firering': return r.zones.push(fireRing(h, w)), true;
    case 'tether': return startTether(h, w.enemies, w.now, w.ev), true;
    case 'chain': return censerChain(h, w, aim), true;
    case 'light': return lanternLight(h, w, el), true;
    default: return false;
  }
}

/** Each tick, after the heroes, goblins and hounds have moved. */
export function stepSkills(r: SkillRoom, w: World, dt: number): void {
  stepAreas(r.zones, w);
  stepTethers(w);
  for (const h of w.heroes) stepSic(h, w.enemies, w.now, dt, w.ev);
  stepTows([...w.heroes, ...w.enemies], w.now, dt);
}
