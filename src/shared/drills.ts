/**
 * Drills: what you pay your own class's trainer for, gold for practice, to make the hero your own.
 * Base stats (power, health, speed, crits, wind), your class skill (back sooner), and your class's
 * own technique. Each rank has a level it needs and a price that climbs (Kyle, 2026-11-01: "level
 * locked and cost more"), so the full set is a long road, not an evening. Free picks on levelling up
 * (PERKS) stay as they were. Every number for the trainer lives here; the rules are in training.ts.
 */
import type { HeroClass } from './weapons.js';

export type DrillId = 'power' | 'health' | 'speed' | 'crit' | 'wind' | 'skill' | 'technique';
export const DRILL_ORDER: DrillId[] = ['power', 'health', 'speed', 'crit', 'wind', 'skill', 'technique'];

/** The level each rank needs: the base stats one rank every two levels; the skill and technique later. */
const STAT_LEVELS = [2, 4, 6, 8, 10];
/**
 * Each drill: its name, what a rank gives (`per`; under 1 is a share, shown as a percent), a few words
 * for that (`gain`, `#` is the number), the level each rank needs (its length is the top rank), and
 * the first rank's price.
 */
export const DRILLS: Record<DrillId, { name: string; text: string; gain: string; per: number; levels: number[]; max: number; price: number }> = {
  power: { name: 'POWER', text: 'Your attacks and spells do more damage', gain: '+#% damage', per: 0.05, levels: STAT_LEVELS, max: 5, price: 80 },
  health: { name: 'HEALTH', text: 'More health', gain: '+# health', per: 8, levels: STAT_LEVELS, max: 5, price: 80 },
  speed: { name: 'SPEED', text: 'You move faster', gain: '+#% speed', per: 0.03, levels: STAT_LEVELS, max: 5, price: 100 },
  crit: { name: 'CRITICAL', text: 'Gives every hit a chance to do 50% more damage', gain: '+#% crit chance', per: 0.04, levels: STAT_LEVELS, max: 5, price: 120 },
  wind: { name: 'STAMINA', text: 'Your stamina comes back faster', gain: 'stamina recovery +#%', per: 0.08, levels: STAT_LEVELS, max: 5, price: 70 },
  skill: { name: 'SKILL', text: 'Your class skill is ready again sooner', gain: 'skill back #% sooner', per: 0.08, levels: [4, 7, 10], max: 3, price: 160 },
  technique: { name: 'TECHNIQUE', text: '', gain: '', per: 0, levels: [5, 8, 10], max: 3, price: 180 },
};
/** What a crit does to a blow. */
export const CRIT = 1.5;
/** Each class's technique, rank by rank. */
export const TECHNIQUE: Record<HeroClass, { name: string; text: string; gain: string; per: number }> = {
  WARRIOR: { name: 'SLAM', text: 'Your slams do 25% more damage per rank', gain: '+#% slam damage', per: 0.25 },
  HEALER: { name: "SURGEON'S HANDS", text: 'Your heals are 16% bigger per rank', gain: '+#% healing', per: 0.16 },
  ROGUE: { name: 'KNIFEWORK', text: 'Your backstabs do 25% more damage per rank', gain: '+#% backstab damage', per: 0.25 },
  RANGER: { name: 'TRAPPER', text: 'Your snares hold 20% longer per rank', gain: 'snares hold #% longer', per: 0.2 },
  MAGE: { name: 'PRIMED SPELLS', text: 'Your primed spell, the first after you change element, does 20% more damage per rank', gain: '+#% primed spell', per: 0.2 },
};

export type Drills = Partial<Record<DrillId, number>>;
/** The level the next rank needs (`rank` is how many you have); 0 once there are no more. */
export const drillLevel = (id: DrillId, rank: number) => DRILLS[id].levels[rank] ?? 0;
/** How many ranks a trainer will take you to at this level. */
export const drillCap = (id: DrillId, level: number) => DRILLS[id].levels.filter((l) => l <= level).length;
/** The price of the next rank (`rank` is how many you have): rank 1 at the base price, climbing. */
export const drillPrice = (id: DrillId, rank: number) => Math.round((DRILLS[id].price * Math.pow(rank + 1, 1.6)) / 5) * 5;
/** A drill's total, at its rank. */
export const drilled = (d: Drills | undefined, id: DrillId) => (d?.[id] ?? 0) * DRILLS[id].per;
export const technique = (d: Drills | undefined, cls: HeroClass) => (d?.technique ?? 0) * TECHNIQUE[cls].per;
/** A few words for what `ranks` ranks of a drill give (one rank: what the next buys). */
export function drillGain(id: DrillId, cls: HeroClass, ranks: number): string {
  const d = id === 'technique' ? TECHNIQUE[cls] : DRILLS[id];
  return d.gain.replace('#', String(d.per < 1 ? Math.round(d.per * ranks * 100) : d.per * ranks));
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
