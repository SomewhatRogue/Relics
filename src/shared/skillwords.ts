/**
 * What each class skill does, the USE row on the trainer's screen and the pack (Kyle's style: the
 * effect first, a few words). Checked by the lore keeper and the line editor (docs/lore/voice.md).
 */
import type { RelicId } from './magic.js';

export const SKILL_WORDS: Partial<Record<RelicId, string>> = {
  bash: 'Charge shield first. Knocks small goblins flat, staggers big ones.',
  horn: 'Every goblin near you goes for you, and only you, for 5 s.',
  stamp: 'Slam your shield down. Knocks back goblins close to you; small ones fall.',
  net: 'Pins a small goblin flat, slows a big one.',
  volley: 'Arrows rain on a spot for a few seconds.',
  sic: 'Your hound runs down the goblin you face: pins a small one, hangs off a big one.',
  shadow: 'Appear behind the goblin you face. It\'s stunned for a second.',
  vanish: 'Smoke at your feet. Goblins lose you until you attack.',
  knives: 'Throw five knives in a wide spread.',
  grasp: 'Drags the goblins in front of you into a bunch just ahead. They stagger. A butcher or a goblin with a shield barely moves. Costs 25 magic.',
  firering: 'Fire bursts around you and burns where you stood.',
  tether: 'Lightning ties you to one goblin and jumps to any near it.',
  sanctuary: 'Bless the ground around you: heals friends, burns goblins. Wards whoever is most hurt.',
  chain: 'Hauls a friend to your side and blesses them. No friend in reach: drags in the goblin you face.',
  light: 'Open the censer. Burns and knocks back goblins close by, blinds small ones, heals friends close by.',
};
