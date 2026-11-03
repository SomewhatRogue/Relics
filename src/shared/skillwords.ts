/**
 * One plain line for each class skill, in the game's own voice, on the trainer's screen (second
 * person, what it does). Checked by the lore keeper and the line editor (docs/lore/voice.md).
 */
import type { RelicId } from './magic.js';

export const SKILL_WORDS: Partial<Record<RelicId, string>> = {
  bash: 'Run in shield first, and small goblins go over while big ones stagger.',
  horn: 'Every goblin in earshot comes for you, and nobody else.',
  stamp: 'Bring the shield rim down hard, and every goblin close is thrown back, the small ones off their feet.',
  net: 'Your net pins a small goblin flat and slows a big one.',
  volley: 'Shoot high over a spot, and arrows come down on it for a few seconds.',
  sic: 'Your hound runs down the goblin you face, pinning a small one and hanging off a big one.',
  shadow: 'Step out of the dark behind the goblin you face.',
  vanish: 'Smoke at your feet, and the goblins lose you until you strike.',
  knives: 'You throw five knives at once, spread wide.',
  channel: 'Turn your spells to the next of fire, frost and storm, and the first spell after each turn lands harder.',
  firering: 'Fire bursts out around you and keeps burning where you stood. While you carry it, your spells are fire.',
  tether: 'Lightning ties you to one goblin and jumps to any near it. While you carry it, your spells are fire.',
  sanctuary: 'Blessed ground at your feet, and a ward on whoever needs it most.',
  chain: "Your censer's chain hauls a friend to your side and blesses them. With no friend in reach, it drags in the goblin you face.",
  light: 'Open the censer. Goblins close by are scorched and thrown back, the small ones blinded, and friends close by mend.',
};
