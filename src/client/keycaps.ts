/**
 * A laptop's key for each of the cluster's buttons (input.ts and main.ts read the keys; this only names
 * them). Shown small on the corner of each button in the laptop's button bar (cluster.ts, keybar.css),
 * all the time, and in full on a new button's gold ring (unlockflash.ts). Kyle, 2026-11-06: "Ditto
 * what your other buttons and abilities are", on a laptop as much as a phone.
 */
import { SIGN_KEY } from '../shared/signs';
import { DEEP_SKILL } from '../shared/deepskill';

/** The cluster's buttons, by the name cluster.ts gives each. */
export type BtnId = 'attack' | 'block' | 'roll' | 'skill' | 'relic' | 'potion' | 'grab' | 'use' | 'reload' | 'element' | 'sign' | 'deep';

/** Short, for the corner of the button. */
export const KEYCAP: Record<BtnId, string> = {
  attack: 'CLICK', block: 'R-CLICK', roll: 'SPACE', skill: 'E', relic: 'R', potion: 'Q', grab: 'G', use: 'F', reload: 'C', element: 'X', sign: SIGN_KEY, deep: DEEP_SKILL.key,
};

/** In full, for the ring on a button just given. */
export const KEYLONG: Record<BtnId, string> = {
  ...KEYCAP, attack: 'LEFT CLICK', block: 'HOLD RIGHT CLICK',
};

/** Each button's place in the cluster (the same elements on a phone and a laptop). */
export const BTN_SEL: Record<BtnId, string> = {
  attack: '.tb.attack', block: '.tb.block', roll: '.tb.roll', skill: '.tb.relic', relic: '.tb.relic2', potion: '.tb.potion',
  grab: '.tb.grab', use: '.tb.use', reload: '.tb.reload', element: '.tb.element', sign: '.tb.sign', deep: '.tb.deep',
};
