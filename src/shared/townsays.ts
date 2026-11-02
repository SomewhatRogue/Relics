/**
 * What the townsfolk say about the town as it stands: a raid in the last few days first, then a work
 * finished lately (whoever cares about it), then, every other day, how the town is coming on. Pure:
 * world state in, a line out (or null: they say their usual piece). Lines in shared/mendlines.ts.
 */
import { lastRaid, RAID_FRESH } from './raids.js';
import { NEWS, PERRIN, RAID, REMEMBER, STATE, type Who } from './mendlines.js';
import type { WorldState } from './story.js';
import { MENDS, stagesDone, workDone, type WorkId } from './works.js';

/** Who's who, by the npc's `arg` in the town map (shared/town.ts, shared/mend.ts). */
export const SPEAKER: Record<number, Who> = { 0: 'wenna', 1: 'tam', 5: 'gate', 6: 'dunn', 7: 'hob', 8: 'pike', 14: 'orla', 15: 'perrin' };
/** A finished work is news for this many days. */
export const NEWS_DAYS = 4;

/** 0: still broken from the breach; 1: mending; 2: mostly mended, the garden in flower. */
export function mendLevel(w: WorldState): 0 | 1 | 2 {
  const n = MENDS.filter((k) => workDone(w, k)).length;
  return n >= 7 && workDone(w, 'plant') ? 2 : n >= 2 ? 1 : 0;
}

/** The raid people are still talking about, if it was lately. */
const freshRaid = (w: WorldState) => {
  const r = lastRaid(w);
  return r && w.day - r.day <= RAID_FRESH ? r : undefined;
};

/** The newest work finished lately that's still standing. */
export function news(w: WorldState): WorkId | undefined {
  const m = (w.mended ?? []).find((x) => w.day - x.day <= NEWS_DAYS && workDone(w, x.id as WorkId));
  return m?.id as WorkId | undefined;
}

/** `dark`: dusk or night in Wickhold. */
export function townSays(w: WorldState, who: Who, dark = false): string | null {
  if (freshRaid(w) && RAID[who]) return RAID[who]!;
  if (who === 'perrin') return stagesDone(w, 'dig') >= 3 && dark ? PERRIN.evening : PERRIN.stages[stagesDone(w, 'dig')];
  const n = news(w);
  if (n && NEWS[n]?.[who]) return NEWS[n]![who]!;
  const turn = (w.day + who.length) % 3;
  if (turn === 0) return null;
  if (turn === 1 && w.raids?.length && REMEMBER[who]) return REMEMBER[who]!;
  return STATE[who]?.[mendLevel(w)] ?? null;
}
