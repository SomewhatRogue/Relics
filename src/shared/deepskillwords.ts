/**
 * The Deep skills' words (docs/design/deep-skills.md): each one's name on its button and the trainer's
 * row, and what it does in a line. Kyle's style: short, plain, says what it does. Only the built ones
 * (shared/deepskill.ts BUILT) are ever shown. The cut's: lore keeper (named it), then line editor, 2026-11-13.
 */
import type { DeepSkillId } from './deepskill.js';

export const DEEP_SKILL_NAME: Record<DeepSkillId, string> = {
  cut: 'SHEATH CUT',
  barricade: 'BARRICADE',
  flare: 'FLARE',
  door: 'THE DOOR',
  warden: 'THE WARDEN',
};

export const DEEP_SKILL_WORDS: Record<DeepSkillId, string> = {
  cut: 'Hold still while a line shows, then slash across the room. Every goblin on the line takes the damage when you sheathe.',
  barricade: '',
  flare: '',
  door: '',
  warden: '',
};

/** The trainer's track over it. */
export const DEEP_TRACK = 'DEEP SKILLS';
