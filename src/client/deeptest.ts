/**
 * Test hooks for the Deep skills (so Kyle can play one without diving 20 floors first):
 * `?deepbest=20` the hero has been that deep (the trainer offers the skill); add `&deepskill=1` and it's taught
 * too, on its button at once. Applied to every hero as the save loads (save.ts) and to a `?hero=` quick start
 * (main.ts). It changes only the hero's own record, never a board.
 */
import { deepSkillFor, reachFloor } from '../shared/deepskill';
import type { Profile } from '../shared/progress';

const q = () => new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

/** Apply the hooks to `p`; true if anything was asked. */
export function deepTest(p: Profile): boolean {
  const best = Number(q().get('deepbest')) || 0, taught = q().get('deepskill') === '1';
  if (!best && !taught) return false;
  if (best) reachFloor(p, best);
  if (taught && best) p.deepTaught = true;
  return true;
}

/** After a quick start: the hooks on the hero being played, and on their fighter. */
export function deepTestHero(g: { profile: Profile | null | undefined; hero?: { deepSkill?: unknown } | null }): void {
  const p = g.profile;
  if (!p || !deepTest(p)) return;
  if (g.hero) g.hero.deepSkill = deepSkillFor(p);
}
