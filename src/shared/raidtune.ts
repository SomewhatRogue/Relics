/**
 * Raiding parties on a roaming land (sim/raids.ts; Kyle, 2026-11-25: "patrols of goblins every now and then, like raiding
 * parties etc, to keep tension high sometimes"). Seconds and tiles.
 * - `first`: when the trip's first comes (seeded, room time); `every`: the wait to the next after one forms; `retry`: the
 *   wait when none could form (nowhere out of sight, or everyone inside a shelter).
 * - `size`: how many (seeded, inclusive). `from`: how far from the nearest hero it forms (never nearer any hero than
 *   from[0]: off every screen); `clear`: never within this of a shelter's ring or a camp post.
 * - `aim`: how often it picks its hero and its way again; `life`: how long it marches before it gives up and leaves;
 *   `gone`: a leaving one is gone once this far from every hero. `speed`: its marching pace; `gap`: the column's spacing.
 * - `pack0`: the first raid's pack id (900 up, so no bounty counts them: shared/bounties.ts).
 * - `rosters`: by the map's name, who marches (a lead first, then the rest drawn); `wolves`: the chance of a wolf-keeper
 *   with one or two wolves among them. A map with no roster, or no roads, gets no raids.
 */
export type RaidRole = 'fodder' | 'forker' | 'swingle' | 'thief' | 'archer' | 'lunger' | 'shield' | 'netter' | 'pouncer' | 'heavy' | 'gaffer';
export interface Roster { lead: RaidRole[]; rest: RaidRole[]; wolves: number }

export const RAID = {
  first: [120, 180] as [number, number], every: [180, 300] as [number, number], retry: 15,
  size: [4, 7] as [number, number], from: [24, 40] as [number, number], clear: 20, gone: 26,
  aim: 4, life: 120, speed: 1.5, gap: 1.1, pack0: 900,
  rosters: {
    'THE NORTH FIELDS': { lead: ['forker', 'swingle'], rest: ['fodder', 'fodder', 'fodder', 'forker', 'swingle', 'thief', 'archer'], wolves: 0.5 },
    'THE FEN': { lead: ['lunger', 'shield', 'gaffer'], rest: ['fodder', 'fodder', 'lunger', 'shield', 'archer', 'netter', 'pouncer', 'heavy'], wolves: 0 },
  } as Record<string, Roster>,
};
