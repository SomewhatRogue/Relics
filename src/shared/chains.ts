/**
 * The knacks tree: each class walks four chains of three steps, all its own (Kyle, 2026-11-02: "Knacks
 * should be different per class. Movement speed, dodge distance, throwing dagger damage, or the window
 * for a 'perfect' attack"). A level up offers the next step of two different chains. Picks are taken
 * on the knacks screen anywhere out of a fight, and can all be given back for nothing (resetPerks).
 */
import { PERKS, type PerkId } from './perks.js';
import type { Profile } from './progress.js';
import { Rng } from './rng.js';
import type { HeroClass } from './weapons.js';

export const CHAINS = {
  w_guard: { name: 'GUARD', steps: ['w_parry', 'w_block', 'w_counter'] },
  w_plate: { name: 'PLATE', steps: ['w_health', 'w_tough', 'w_foot'] },
  w_heavy: { name: 'HEAVY BLOW', steps: ['w_charge', 'w_full', 'w_knock'] },
  w_skill: { name: 'CHARGE OR CRY', steps: ['w_focus', 'w_far', 'w_hold'] },
  r_bow: { name: 'BOW', steps: ['r_draw', 'r_true', 'r_flash'] },
  r_jump: { name: 'JUMP', steps: ['r_jump', 'r_leap', 'r_foot'] },
  r_snare: { name: 'SNARE', steps: ['r_snare', 'r_hold', 'r_three'] },
  r_hound: { name: 'HOUND', steps: ['r_hound', 'r_bite', 'r_bites'] },
  g_dash: { name: 'DASH', steps: ['g_light', 'g_leap', 'g_slip'] },
  g_back: { name: 'BACKSTAB', steps: ['g_angle', 'g_rear', 'g_ambush'] },
  g_knives: { name: 'KNIVES', steps: ['g_quick', 'g_throw', 'g_draw'] },
  g_shadow: { name: 'SHADOW', steps: ['g_foot', 'g_focus', 'g_quiet'] },
  m_blink: { name: 'BLINK', steps: ['m_blink', 'm_leap', 'm_image'] },
  m_channel: { name: 'CHANNEL', steps: ['m_primed', 'm_clear', 'm_twice'] },
  m_spells: { name: 'SPELLS', steps: ['m_draw', 'm_burst', 'm_dmg'] },
  m_breath: { name: 'MAGIC', steps: ['m_breath', 'm_light', 'm_quick'] },
  h_guard: { name: 'GUARD', steps: ['h_parry', 'h_block', 'h_counter'] },
  h_mercy: { name: 'HEALING', steps: ['h_mend', 'h_reach', 'h_mercy'] },
  h_smite: { name: 'SMITE', steps: ['h_draw', 'h_stun', 'h_full'] },
  h_sanct: { name: 'SANCTUARY', steps: ['h_focus', 'h_bless', 'h_long'] },
} satisfies Record<string, { name: string; steps: PerkId[] }>;
export type ChainId = keyof typeof CHAINS;

export const CLASS_CHAINS: Record<HeroClass, ChainId[]> = {
  WARRIOR: ['w_guard', 'w_plate', 'w_heavy', 'w_skill'],
  RANGER: ['r_bow', 'r_jump', 'r_snare', 'r_hound'],
  ROGUE: ['g_dash', 'g_back', 'g_knives', 'g_shadow'],
  MAGE: ['m_blink', 'm_channel', 'm_spells', 'm_breath'],
  HEALER: ['h_guard', 'h_mercy', 'h_smite', 'h_sanct'],
};

const stepsOf = (c: ChainId): PerkId[] => CHAINS[c].steps;
/** Every knack a class can take. */
export const classPerks = (cls: HeroClass): PerkId[] => CLASS_CHAINS[cls].flatMap(stepsOf);
/** The chain a knack sits on (for the class that has it). */
export const chainOf = (id: PerkId): ChainId | undefined => (Object.keys(CHAINS) as ChainId[]).find((c) => stepsOf(c).includes(id));

/** How far along a chain a hero is: the next step not yet taken (-1: all taken). */
export const nextStep = (chain: ChainId, perks: readonly string[]) => stepsOf(chain).findIndex((s) => !perks.includes(s));

/** What a level up offers: the next step of two different chains (the same two until one is taken). */
export function perkOffer(p: Pick<Profile, 'cls' | 'level' | 'perks'>): PerkId[] {
  const open = CLASS_CHAINS[p.cls].filter((c) => nextStep(c, p.perks) >= 0);
  const out: PerkId[] = [];
  for (const c of new Rng(p.level * 13 + p.perks.length * 7 + 3).shuffle(open)) {
    out.push(stepsOf(c)[nextStep(c, p.perks)]);
    if (out.length === 2) break;
  }
  return out;
}

/** Take a knack: only one of the two on offer, and only with a pick waiting. True if taken. */
export function takePerk(p: Profile, id: PerkId): boolean {
  if (p.picks <= 0 || !perkOffer(p).includes(id)) return false;
  p.perks.push(id);
  p.picks--;
  return true;
}

/** Give every knack back for nothing: each comes back as a pick, to take again. */
export function resetPerks(p: Profile): void {
  p.picks += p.perks.length;
  p.perks = [];
}

/**
 * Old knacks (before each class had its own chains) onto the new ones, by class: each lands on the step
 * that moves the same number. One with no home (or a second on the same step) comes back as a pick.
 */
const OLD: Record<HeroClass, Record<string, PerkId>> = {
  WARRIOR: { guard: 'w_parry', ironhide: 'w_block', counter: 'w_counter', tough: 'w_health', scarred: 'w_tough', fleet: 'w_foot', heft: 'w_knock', heavy: 'w_full', relicsworn: 'w_focus' },
  RANGER: { steadyhand: 'r_draw', footwork: 'r_jump', fleet: 'r_foot' },
  ROGUE: { shadowed: 'g_rear', quick: 'g_quick', fleet: 'g_foot', relicsworn: 'g_focus' },
  MAGE: { focus: 'm_blink', footwork: 'm_blink', charge: 'm_draw', potent: 'm_dmg', endurance: 'm_breath' },
  HEALER: { guard: 'h_parry', ironhide: 'h_block', devotion: 'h_bless', mender: 'h_mend', relicsworn: 'h_focus' },
};

/** A loaded hero onto its class's tree; never a level's pick lost (taken plus waiting covers every level up). */
export function fitPerks(p: Profile): void {
  const mine = classPerks(p.cls), had = p.perks as string[], kept: PerkId[] = [];
  for (const k of had) {
    const id = (mine.includes(k as PerkId) ? k : OLD[p.cls][k]) as PerkId | undefined;
    if (id && PERKS[id] && !kept.includes(id)) kept.push(id);
  }
  p.perks = kept;
  p.picks = Math.max(0, p.picks || 0) + had.length - kept.length;
  p.picks = Math.max(p.picks, p.level - 1 - kept.length);
}
