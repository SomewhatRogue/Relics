/**
 * Drills: what you pay your own class's trainer for, gold for practice, to make the hero your own.
 * Base stats (power, health, speed, crits, wind), your class skill (back sooner), and your class's
 * own technique. Each has ranks; the price climbs with the rank, and how far you can go is held back
 * by your level (a trainer won't teach what you can't yet use). Free picks on levelling up (PERKS)
 * stay as they were.
 */
import type { HeroClass } from './weapons.js';

export type DrillId = 'power' | 'health' | 'speed' | 'crit' | 'wind' | 'skill' | 'technique';
export const DRILL_ORDER: DrillId[] = ['power', 'health', 'speed', 'crit', 'wind', 'skill', 'technique'];
/** Each drill: its name, what a rank gives (`per`), its top rank, and the first rank's price. */
export const DRILLS: Record<DrillId, { name: string; text: string; per: number; max: number; price: number }> = {
  power: { name: 'POWER', text: 'Every blow and spell lands harder', per: 0.05, max: 5, price: 40 },
  health: { name: 'HEALTH', text: 'More health', per: 8, max: 5, price: 40 },
  speed: { name: 'SPEED', text: 'Faster on your feet', per: 0.03, max: 5, price: 50 },
  crit: { name: 'CRITICAL', text: 'A chance for any hit to land half again as hard', per: 0.04, max: 5, price: 60 },
  wind: { name: 'BREATH', text: 'Your breath comes back faster', per: 0.08, max: 5, price: 35 },
  skill: { name: 'SKILL', text: 'Your class skill comes back sooner', per: 0.08, max: 3, price: 80 },
  technique: { name: 'TECHNIQUE', text: '', per: 0, max: 3, price: 90 },
};
/** What a crit does to a blow. */
export const CRIT = 1.5;
/** Each class's technique, rank by rank. */
export const TECHNIQUE: Record<HeroClass, { name: string; text: string; per: number }> = {
  WARRIOR: { name: 'SLAM', text: 'Your slams hit a quarter harder each rank', per: 0.25 },
  HEALER: { name: "SURGEON'S HANDS", text: 'Your heals mend a sixth more each rank', per: 0.16 },
  ROGUE: { name: 'KNIFEWORK', text: 'Your backstabs cut a quarter deeper each rank', per: 0.25 },
  RANGER: { name: 'TRAPPER', text: 'Your snares hold a fifth longer each rank', per: 0.2 },
  MAGE: { name: 'QUICK CHANNEL', text: 'Your channel takes a sixth less time each rank', per: 0.16 },
};

export type Drills = Partial<Record<DrillId, number>>;
/** How far a trainer will take you at this level (one rank more every two levels). */
export const drillCap = (id: DrillId, level: number) => Math.min(DRILLS[id].max, 1 + Math.floor(level / 2));
/** The price of the next rank (rank 1 at the base price, climbing). */
export const drillPrice = (id: DrillId, rank: number) => Math.round((DRILLS[id].price * Math.pow(rank + 1, 1.6)) / 5) * 5;
/** A drill's total, at its rank. */
export const drilled = (d: Drills | undefined, id: DrillId) => (d?.[id] ?? 0) * DRILLS[id].per;
export const technique = (d: Drills | undefined, cls: HeroClass) => (d?.technique ?? 0) * TECHNIQUE[cls].per;

/**
 * What your trainer teaches, once you've the level and the gold: your class skill (a new hero comes
 * out of the wood with only a dodge and their weapon), and later what a Ranger's or Mage's dodge
 * leaves behind (a snare where they jumped from, an image where they blinked from).
 */
export const TEACHES = { skill: { level: 2, price: 60 }, leave: { level: 3, price: 80 } } as const;
export const LEAVES: Partial<Record<HeroClass, { name: string; text: string }>> = {
  RANGER: { name: 'SNARE ON THE JUMP', text: 'Jumping back leaves a snare where you stood' },
  MAGE: { name: 'AN IMAGE ON THE BLINK', text: 'Blinking leaves an image of you behind, and the goblins go for it' },
};
