/**
 * A hero's first hungry piece brought home (Kyle, 2026-11-23): two quests at once, on the errand pattern
 * (shared/errands.ts, the Town quests chat's: `church` and `under`, 1 open, 2 done).
 * - **The church:** Father Odric says what hungry gear does and offers the give-up (done when you've talked to him;
 *   giving it up is your choice).
 * - **The under church:** Dorcas, in the Keeping Room, says what the other road gives and costs (done when you've
 *   talked to her). The Keeping Room lets a hero in on this quest even before they're corrupt.
 * From the first of those talks on, the Want's bar shows on the pack (client/wantbar.ts).
 */
import type { Profile } from './progress.js';
import { carriesHungry } from './fence.js';

type Who = 'church' | 'under';
const rec = (p: Profile) => p.errands;

/** A job's end: the first time the hero comes home with hungry gear on them or in the pack, both quests open. True if
 *  that's news. Once only: a hero who has had them never gets them again. */
export function hungryHome(p: Profile): boolean {
  const e = rec(p);
  if (!e || e.church || e.under || !carriesHungry(p)) return false;
  e.church = 1;
  e.under = 1;
  return true;
}

/** Is this one open (still to do)? */
export const wantOpen = (p: Profile, who: Who) => rec(p)?.[who] === 1;

/** Talked to Odric (`church`) or Dorcas (`under`) about it: done. True if it was open. */
export function wantTalked(p: Profile, who: Who): boolean {
  const e = rec(p);
  if (e?.[who] !== 1) return false;
  e[who] = 2;
  return true;
}

/** The whisper (Kyle, 2026-11-23: "it's a whisper you hear leading you there"): heard once, back in town, the moment the
 *  quests open, before anything else (client/wanterrandui.ts). */
export const whisperDue = (p: Profile) => rec(p)?.under === 1 && !p.whispered;
export function whisperHeard(p: Profile): void {
  p.whispered = true;
}

/** The Want's bar shows from the first of the two talks on. */
export const wantShown = (p: Profile) => rec(p)?.church === 2 || rec(p)?.under === 2;
