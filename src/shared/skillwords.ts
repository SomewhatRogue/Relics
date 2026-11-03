/**
 * One plain line for each class skill, in the game's own voice, on the trainer's screen (second
 * person, what it does). Checked by the lore keeper and the line editor (docs/lore/voice.md).
 */
import type { RelicId } from './magic.js';

export const SKILL_WORDS: Partial<Record<RelicId, string>> = {
  bash: 'Run shield first. Small goblins go over, big ones stagger.',
  horn: 'Every goblin in earshot comes for you, and nobody else.',
  stamp: 'Bring the shield rim down hard, and every goblin close is thrown back, the small ones off their feet.',
  net: 'Pins a small goblin flat and slows a big one.',
  volley: 'Shoot high over a spot, and arrows come down on it for a few seconds.',
  sic: 'Your hound runs down the goblin you face, pinning a small one and hanging off a big one.',
  shadow: 'Step out of the dark behind the goblin you face.',
  vanish: 'Smoke at your feet, and the goblins lose you until you strike.',
  knives: 'Five knives thrown wide at once.',
  channel: 'Turn your spells to fire, frost or storm. The first after a turn lands harder.',
  firering: 'Fire bursts out around you and burns on where you stood. Your spells stay fire.',
  tether: 'Lightning ties you to one goblin and jumps to any near it. Your spells stay fire.',
  sanctuary: 'Blessed ground at your feet, and a ward on whoever needs it most.',
  chain: "Your censer's chain hauls a friend to your side, blessed. With nobody near, it drags a goblin in.",
  light: 'Open the censer. Goblins close by are scorched and blinded, and friends close by mend.',
};
