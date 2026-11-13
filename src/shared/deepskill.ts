/**
 * Deep skills (docs/design/deep-skills.md, approved 2026-11-13): one more skill a class, on its own button,
 * opened only by how deep a hero has been. A hero's deepest floor ever (`Profile.deepBest`, a floor reached
 * in a party counting too) opens it at DEEP_SKILL.floor; till then the trainer doesn't list it at all.
 * Still learned and paid for at the trainer. Pure, on the profile: the trainer's row, the errand's word,
 * the button and the room all ask here. The room's side: sim/deepskill.ts.
 */
import { SKILL_STEPS } from './drills.js';
import { CUT } from './cuttune.js';
import type { Profile } from './progress.js';
import type { HeroClass } from './weapons.js';

/** The five (Kyle, 2026-11-13). Built so far: BUILT. */
export type DeepSkillId = 'cut' | 'barricade' | 'flare' | 'door' | 'warden';

/**
 * `floor`: the deepest floor reached that opens it. `price`: twice the class's last skill (so it follows
 * the economy's scale). `key`: a laptop's key, by X, C and V.
 */
export const DEEP_SKILL = { floor: 20, price: SKILL_STEPS[2].price * 2, key: 'Z' };

export const DEEP_SKILL_OF: Record<HeroClass, DeepSkillId> = { ROGUE: 'cut', WARRIOR: 'barricade', RANGER: 'flare', MAGE: 'door', HEALER: 'warden' };
/** Built and playable: the others aren't offered yet (the spec's order: one first, played, then the rest). */
export const BUILT: DeepSkillId[] = ['cut'];

/** Each one's wait between uses (s): long, so it's a fight's turning point. */
export const DEEP_COOLDOWN: Record<DeepSkillId, number> = { cut: CUT.cooldown, barricade: 40, flare: 40, door: 40, warden: 60 };

/** This class's Deep skill, if it's built. */
export const deepSkillOf = (cls: HeroClass): DeepSkillId | null => (BUILT.includes(DEEP_SKILL_OF[cls]) ? DEEP_SKILL_OF[cls] : null);

/** The deepest floor this hero has reached (0: never down). */
export const deepBestOf = (p: Pick<Profile, 'deepBest'>) => p.deepBest ?? 0;

/** A floor reached (alone or with friends): the hero's deepest, kept. True if it's new. */
export function reachFloor(p: Profile, floor: number): boolean {
  if (!(floor > deepBestOf(p))) return false;
  p.deepBest = Math.floor(floor);
  return true;
}

/** Deep enough for it, and the class has one built: the trainer lists it. */
export const deepSkillOpen = (p: Profile) => !!deepSkillOf(p.cls) && deepBestOf(p) >= DEEP_SKILL.floor;

/** Taught it (paid the trainer). */
export const knowsDeepSkill = (p: Profile) => !!p.deepTaught && deepSkillOpen(p);

/** The skill a hero carries into a fight (on the room's hero: sim/deepskill.ts), or nothing. */
export const deepSkillFor = (p: Profile): DeepSkillId | undefined => (knowsDeepSkill(p) ? deepSkillOf(p.cls) ?? undefined : undefined);

/** At the trainer: 'max' taught, 'buy', 'poor', or 'hidden' (not deep enough: not on the list at all). */
export type DeepSkillState = 'hidden' | 'max' | 'buy' | 'poor';
export function deepSkillState(p: Profile): DeepSkillState {
  if (!deepSkillOpen(p)) return 'hidden';
  if (p.deepTaught) return 'max';
  return p.gold < DEEP_SKILL.price ? 'poor' : 'buy';
}

/** Pay the trainer for it. False (nothing spent) unless it's buyable now. */
export function learnDeepSkill(p: Profile): boolean {
  if (deepSkillState(p) !== 'buy') return false;
  p.gold -= DEEP_SKILL.price;
  p.deepTaught = true;
  return true;
}

/**
 * A saved hero's deepest floor: their own, or (from before deepBest) the floor their saved run had reached,
 * or their line on either of the Deep's boards (`boards`: the world's DEEPEST lists, shared/deepboard.ts).
 */
export function fitDeepBest(p: Partial<Profile>, boards: ({ id: string; n: number }[] | undefined)[] = []): number {
  const own = Math.floor(Number(p.deepBest) || 0), run = Math.floor(Number(p.deep?.floor) || 0);
  const listed = boards.flatMap((b) => b ?? []).filter((l) => l.id === p.id).map((l) => Math.floor(Number(l.n) || 0));
  return Math.max(0, own, run, ...listed);
}
