/**
 * The Deep skills' words (docs/design/deep-skills.md): each one's name on its button and the trainer's
 * row, and what it does in a line. Kyle's style: short, plain, says what it does. Only the built ones
 * (shared/deepskill.ts BUILT) are ever shown. Through the lore keeper and the line editor before Kyle plays.
 */
import type { DeepSkillId } from './deepskill.js';

export const DEEP_SKILL_NAME: Record<DeepSkillId, string> = {
  cut: 'THE LONG CUT',
  barricade: 'BARRICADE',
  flare: 'FLARE',
  door: 'THE DOOR',
  warden: 'THE WARDEN',
};

export const DEEP_SKILL_WORDS: Record<DeepSkillId, string> = {
  cut: 'Stand still a beat, then cut straight through everything on the line. Put the blade away and it all takes the cut at once.',
  barricade: '',
  flare: '',
  door: '',
  warden: '',
};

/** The trainer's track over it. */
export const DEEP_TRACK = 'FROM THE DEEP';
