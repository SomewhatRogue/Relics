/**
 * Drills: what you pay your own class's trainer for, gold for practice, to make the hero your own.
 * Base stats (power, health, speed, crits, wind), your class skill (back sooner), and your class's
 * own technique. Each rank has a level it needs and a price that climbs (Kyle, 2026-11-01: "level
 * locked and cost more"), so the full set is a long road, not an evening. Free picks on levelling up
 * (PERKS) stay as they were. Every number for the trainer lives here; the rules are in training.ts.
 */
import type { HeroClass } from './weapons.js';
import { shown } from './shown.js';

export type DrillId = 'power' | 'health' | 'speed' | 'crit' | 'wind' | 'skill' | 'technique' | 'ladder';
export const DRILL_ORDER: DrillId[] = ['power', 'health', 'speed', 'crit', 'wind', 'skill', 'technique'];

/** The level each rank needs: the base stats one rank every two levels; the skill and technique later. */
const STAT_LEVELS = [2, 4, 6, 8, 10];
/**
 * Each drill: its name, what a rank gives (`per`; under 1 is a share, shown as a percent), a few words
 * for that (`gain`, `#` is the number), the level each rank needs (its length is the top rank), and
 * the first rank's price.
 */
export const DRILLS: Record<DrillId, { name: string; text: string; gain: string; per: number; levels: number[]; max: number; price: number }> = {
  power: { name: 'STRENGTH', text: 'More damage from attacks and spells', gain: '+#% damage', per: 0.05, levels: STAT_LEVELS, max: 5, price: 80 },
  health: { name: 'HEALTH', text: 'More health', gain: '+# health', per: 8, levels: STAT_LEVELS, max: 5, price: 80 },
  speed: { name: 'SPEED', text: 'Move faster', gain: '+#% speed', per: 0.03, levels: STAT_LEVELS, max: 5, price: 100 },
  crit: { name: 'CRITICAL', text: 'A chance for any hit to do 50% more damage', gain: '+#% crit chance', per: 0.04, levels: STAT_LEVELS, max: 5, price: 120 },
  wind: { name: 'STAMINA', text: 'Stamina refills faster', gain: 'stamina refill +#%', per: 0.08, levels: STAT_LEVELS, max: 5, price: 70 },
  skill: { name: 'SKILL', text: 'Skill recharges faster', gain: 'skill recharge #% faster', per: 0.08, levels: [4, 7, 10], max: 3, price: 160 },
  technique: { name: 'TECHNIQUE', text: '', gain: '', per: 0, levels: [4, 7, 10], max: 3, price: 180 },
  // The movement ladder (shared/ladder.ts): three rungs a class, one a rank. Not in DRILL_ORDER: its rows are the rungs.
  ladder: { name: 'LADDER', text: '', gain: '', per: 0, levels: [5, 10, 15], max: 3, price: 250 },
};
/** What a crit does to a blow. */
export const CRIT = 1.5;
/** The levels every class's three techniques are taught at (shared/techniques.ts), the Mage's too now. */
export const TECH_LEVELS = DRILLS.technique.levels;
/** The levels a class's technique ranks need (the same for every class since the Mage has three too). */
export const techLevels = (_cls?: HeroClass) => TECH_LEVELS;

export type Drills = Partial<Record<DrillId, number>>;
/** The levels a drill's ranks need (the technique's by class). */
const levelsOf = (id: DrillId, cls?: HeroClass) => (id === 'technique' ? techLevels(cls) : DRILLS[id].levels);
/** The level the next rank needs (`rank` is how many you have); 0 once there are no more. */
export const drillLevel = (id: DrillId, rank: number, cls?: HeroClass) => levelsOf(id, cls)[rank] ?? 0;
/** How many ranks a trainer will take you to at this level. */
export const drillCap = (id: DrillId, level: number, cls?: HeroClass) => levelsOf(id, cls).filter((l) => l <= level).length;
/** The price of the next rank (`rank` is how many you have): rank 1 at the base price, climbing. */
export const drillPrice = (id: DrillId, rank: number) => Math.round((DRILLS[id].price * Math.pow(rank + 1, 1.6)) / 5) * 5;
/** A drill's total, at its rank. */
export const drilled = (d: Drills | undefined, id: DrillId) => (d?.[id] ?? 0) * DRILLS[id].per;
/** A few words for what `ranks` ranks of a drill give (one rank: what the next buys). */
export function drillGain(id: DrillId, cls: HeroClass, ranks: number): string {
  void cls;
  const d = DRILLS[id];
  return d.gain.replace('#', String(d.per < 1 ? Math.round(d.per * ranks * 100) : id === 'health' ? shown(d.per * ranks) : d.per * ranks));
}

/**
 * What your trainer teaches, once you've the level and the gold: your class skill (a new hero comes
 * out of the wood with only a dodge and their weapon), and later what a Ranger's or Mage's dodge
 * leaves behind (a snare where they jumped from, an image where they blinked from).
 */
export const TEACHES = { skill: { level: 3, price: 150 }, leave: { level: 5, price: 250 } } as const;
/** Each class's three skills (SKILL_CHOICES order), taught one by one: the first is the `skill` lesson
 *  above; the second from level 5, the third from level 7 (2026-11-02). */
export const SKILL_STEPS = [TEACHES.skill, { level: 5, price: 250 }, { level: 7, price: 400 }] as const;
export const LEAVES: Partial<Record<HeroClass, { name: string; short: string; text: string; gain: string }>> = {
  RANGER: { name: 'SNARE ON THE JUMP', short: 'SNARE', text: 'Your jump leaves a snare where you stood', gain: 'a snare where you jumped' },
  MAGE: { name: 'IMAGE ON THE BLINK', short: 'IMAGE', text: 'Your blink leaves an image behind that goblins go for', gain: 'an image where you blinked' },
};
