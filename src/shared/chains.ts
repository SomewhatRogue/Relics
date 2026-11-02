/**
 * The knacks tree: each class walks four chains of three steps, two shared (BODY, BREATH) and two its
 * own (its guard or its feet, and its trade). Each step leads to the next. A level up offers the next
 * step of two different chains (Kyle, 2026-11-02: "see what each chain can unlock as a next step").
 * Nothing on a class's chains asks for a move it doesn't have: no parry for a Rogue or Mage, no dodge
 * for a Warrior or Healer.
 */
import { PERKS, type PerkId } from './perks.js';
import type { Profile } from './progress.js';
import { Rng } from './rng.js';
import type { HeroClass } from './weapons.js';

export type ChainId = 'body' | 'breath' | 'guard' | 'jump' | 'feet' | 'blink' | 'weight' | 'bow' | 'knife' | 'spells' | 'mercy';
export const CHAINS: Record<ChainId, { name: string; steps: PerkId[] }> = {
  body: { name: 'BODY', steps: ['tough', 'secondwind', 'scarred'] },
  breath: { name: 'BREATH', steps: ['endurance', 'longwind', 'relicsworn'] },
  guard: { name: 'GUARD', steps: ['guard', 'ironhide', 'counter'] },
  jump: { name: 'FEET', steps: ['footwork', 'guard', 'fleet'] },
  feet: { name: 'FEET', steps: ['footwork', 'fleet', 'slip'] },
  blink: { name: 'BLINK', steps: ['focus', 'fleet', 'footwork'] },
  weight: { name: 'WEIGHT', steps: ['heft', 'heavy', 'keen'] },
  bow: { name: 'BOW', steps: ['steadyhand', 'longshot', 'keen'] },
  knife: { name: 'KNIFE', steps: ['shadowed', 'keen', 'quick'] },
  spells: { name: 'SPELLS', steps: ['charge', 'potent', 'keen'] },
  mercy: { name: 'MERCY', steps: ['devotion', 'mender', 'heavy'] },
};
export const CLASS_CHAINS: Record<HeroClass, ChainId[]> = {
  WARRIOR: ['body', 'breath', 'guard', 'weight'],
  RANGER: ['body', 'breath', 'jump', 'bow'],
  ROGUE: ['body', 'breath', 'feet', 'knife'],
  MAGE: ['body', 'breath', 'blink', 'spells'],
  HEALER: ['body', 'breath', 'guard', 'mercy'],
};

/** Every knack a class can take. */
export const classPerks = (cls: HeroClass): PerkId[] => [...new Set(CLASS_CHAINS[cls].flatMap((c) => CHAINS[c].steps))];

/** How far along a chain a hero is: the next step not yet taken (-1: all taken). */
export const nextStep = (chain: ChainId, perks: readonly string[]) => CHAINS[chain].steps.findIndex((s) => !perks.includes(s));

/** What a level up offers: the next step of two different chains (the same two until one is taken). */
export function perkOffer(p: Pick<Profile, 'cls' | 'level' | 'perks'>): PerkId[] {
  const open = CLASS_CHAINS[p.cls].filter((c) => nextStep(c, p.perks) >= 0);
  const out: PerkId[] = [];
  for (const c of new Rng(p.level * 13 + p.perks.length * 7 + 3).shuffle(open)) {
    const s = CHAINS[c].steps[nextStep(c, p.perks)];
    if (!out.includes(s)) out.push(s);
    if (out.length === 2) break;
  }
  return out;
}

/**
 * Old heroes onto the tree: a knack their class can't use (a Rogue's parry) comes back as a pick to
 * spend again; any other old knack sits on its chain, lit, wherever it falls.
 */
export function fitPerks(p: Profile): void {
  const ok = classPerks(p.cls), kept = p.perks.filter((k) => ok.includes(k) && PERKS[k]);
  p.picks += p.perks.length - kept.length;
  p.perks = [...new Set(kept)];
}
