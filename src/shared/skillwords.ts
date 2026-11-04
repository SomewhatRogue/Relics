/**
 * One plain line for each class skill, in the game's own voice, on the trainer's screen (second
 * person, what it does). Checked by the lore keeper and the line editor (docs/lore/voice.md).
 */
import type { RelicId } from './magic.js';

export const SKILL_WORDS: Partial<Record<RelicId, string>> = {
  bash: 'You charge shield first: small goblins in your way are knocked flat, and big ones stagger.',
  horn: 'Every goblin near you comes after you, and leaves everyone else alone, for 5 seconds.',
  stamp: 'You slam your shield down. Every goblin close to you is knocked back, and small ones are knocked off their feet.',
  net: 'Your net pins a small goblin flat and slows a big one.',
  volley: 'Shoot high over a spot, and arrows come down on it for a few seconds.',
  sic: 'Your hound runs down the goblin you face, pinning a small one and hanging off a big one.',
  shadow: 'You appear behind the goblin you face.',
  vanish: 'You vanish in a puff of smoke, and goblins lose track of you until you attack.',
  knives: 'You throw five knives at once, spread wide.',
  channel: 'Changes your spells to the next element (fire, frost, storm). Your first spell after each change is primed and does 50% more damage.',
  firering: 'Fire bursts out around you and keeps burning where you stood. While this is your skill, your spells are always fire.',
  tether: 'Lightning ties you to one goblin and jumps to any near it. While this is your skill, your spells are always fire.',
  sanctuary: 'Blesses the ground at your feet, which heals friends and burns goblins, and puts a ward on whoever is most hurt.',
  chain: "Your censer's chain hauls a friend to your side and blesses them. With no friend in reach, it drags in the goblin you face.",
  light: 'You open the censer. Goblins close by are burned and knocked back, small ones are blinded, and friends close by are healed.',
};
