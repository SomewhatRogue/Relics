/**
 * Skills that left the trainer, on saved heroes. Shadow Step became the Rogue's own button (Kyle,
 * 2026-11-05: shared/signs.ts) and Smoke Bomb took its place among the three (Vanish, Knife Fan, Smoke
 * Bomb). A Rogue who carried Shadow Step as their skill (picked, or the first by default once taught)
 * is given Smoke Bomb, taught and carried, rather than an empty slot: the kinder of the two. Anything
 * fitted to Shadow Step goes on the Smoke Bomb.
 */
import type { Profile } from './progress.js';

/** Bring a hero saved before the signature buttons over (once: it sets `signs`). */
export function fitOldSkills(p: Profile): Profile {
  p.signs = true;
  if (p.cls !== 'ROGUE') return p;
  // Old heroes (no `learned` list) know everything; anyone else knew Shadow Step once taught the first skill.
  const knewShadow = !p.learned || p.learned.includes('skill');
  const carried = (p.skill as string | undefined) === 'shadow' || (p.skill === undefined && knewShadow);
  if ((p.skill as string | undefined) === 'shadow') p.skill = undefined;
  if (!carried || !knewShadow) return p;
  p.skill = 'smoke';
  if (!(p.taught ?? []).includes('smoke')) p.taught = [...(p.taught ?? []), 'smoke'];
  if (p.augments?.shadow && !p.augments.smoke) (p.augments = { ...p.augments, smoke: p.augments.shadow }), delete p.augments.shadow;
  return p;
}
