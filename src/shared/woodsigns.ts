/**
 * The wood's step for each class's own button (Kyle, 2026-11-05; sim/woodsign.ts, sim/woodheal.ts): in
 * Hew's clearing, after its lesson, as the Mage's element step is. Where the goblins come from, and every
 * new line (Hew's in his voice, the card's how-lines in Kyle's style) for the lore keeper and the line
 * editor. Not yet through either pass.
 */
import type { Foe } from './terrain.js';

/** The clearing's middle, and how far from you the Rogue's two are put (across the clearing from you). */
export const CLEARING = { x: 32, y: 18, minX: 24.5, maxX: 39.5, minY: 12.5, maxY: 23.5, across: 5, apart: 1.3 };
/** The Ranger's two: out of the trees on the clearing's far side. */
export const MARK_FOES: Foe[] = [
  { kind: 'scrapper', x: 39, y: 14, awake: true },
  { kind: 'scrapper', x: 39.5, y: 21.5, awake: true },
];
/** Where Hew waits in the clearing (shared/wood.ts LESSONS[2].hew). */
export const HEW_AT: [number, number] = [25, 23];
/** The archer at the clearing's edge (within a shot of Hew), and the two that come after it. */
export const HEW_ARCHER: Foe = { kind: 'scrapper', bow: true, x: 24.4, y: 15.6, awake: true };
export const HEAL_FOES: Foe[] = [
  { kind: 'scrapper', x: 39, y: 13.5, awake: true },
  { kind: 'scrapper', x: 39.5, y: 22, awake: true },
];
/** Every goblin in these steps is a small drilled one this hardy; Hew, struck, is down to `hewHp` of 100. */
export const SIGN_STEP = { hp: 24, hewHp: 20, hewMax: 100, shotBy: 1.8, stabWithin: 3, stepAgain: 2 };

export const SIGN_LINES = {
  /** Hew, on the card. */
  teach: {
    shadow: "See those two at the back, going through my sacks with their backs to us? You'll not get across to them without one turning round, but I'd lay odds your sort have a way of turning up behind folk out of the *dark*, so go on, and I'll not ask how.",
    mark: "Two more out of the trees, and that hound of yours keeps looking at me for orders. Pick one out for it, and put your arrows where it's looking.",
    heal: "That's the last of them, and I'll not get far on this leg. Come and see to it, would you, and pull it out *straight*.",
  },
  /** The card's plain line under the move. */
  how: {
    shadow: "SHADOW STEP puts you behind the goblin you face, and it's stunned for a second. Stab it from there.",
    mark: "MARK the goblin you aim at for 8 s. Anyone's quick hits on it do +50 damage, heavy hits +40%. Your arrows bend toward it, and your hound goes for it.",
    heal: "MEND heals whichever friend near you is worst hurt, for 25. The gold mark shows who that is. If nobody near is hurt, or you're in a much worse way than they are, it heals you.",
  },
  /** Hew, shot (a caption, the fight going on). */
  hewHit: "Aah! In the _leg_, the little sod! Never mind me, stray, see to them first!",
  /** Hew, mended. */
  healed: "Oh, that's ^better^, and out straight as you like. They teach you more than praying up at that church, then.",
  /** The goal over the field. */
  goal: {
    shadow: 'STEP BEHIND ONE, STAB IT', mark: 'KILL A MARKED ONE', hit: "HEW'S BEEN SHOT", fight: 'Kill them', heal: 'MEND HEW', clear: 'Clear them',
  },
  /** A press that did nothing, over your hero. */
  nosign: { mark: 'NOTHING TO MARK', hurt: 'NOBODY HURT', breath: 'NOT ENOUGH STAMINA' },
};
