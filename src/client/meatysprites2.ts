/**
 * The second three meaty sorts' pieces, and the new affixes' on the body, as pixel sprites in the
 * placeholder style of sprites.ts (flat colours, auto shading lit from the top left, a dark outline): the
 * Kegman's keg upright on its back and lying on its side once it's fallen; the Pouncer's hooked claws; the
 * Gorger's long gaff for pulling the dead in; the Hornblower's cow horn. The bodies are the small goblin's,
 * drawn bigger (MEATY_DRAW). Drawing only.
 */
import { grow, makeSprite, type Part } from './sprites';

const STAVE = '#6e4a28', STAVE2 = '#83592f', HOOP = '#5a5a60', HOOP2 = '#8a8a90', OILY = '#2a2016', BUNG = '#c8b070';
const CLAW = '#d8d0b8', HORN = '#d8c8a0', HORN2 = '#a8946a', TIP = '#5a4a38';

/** The keg upright: staves, two iron hoops, a dark oily stain down one side, the bung. */
const kegUp: Part[] = [
  ['r', 1, 0, 6, 9, STAVE], ['r', 0, 1, 8, 7, STAVE], ['r', 3, 0, 2, 9, STAVE2],
  ['r', 0, 2, 8, 1, HOOP], ['r', 0, 6, 8, 1, HOOP], ['p', 1, 2, HOOP2], ['p', 1, 6, HOOP2],
  ['r', 6, 3, 1, 4, OILY], ['p', 5, 7, OILY], ['p', 4, 0, BUNG],
];

export const MEATY2_SPRITES = {
  kegUp: makeSprite(12, 14, grow(kegUp)),
  /** Fallen on its side where the Kegman went down, the bung up. */
  kegDown: makeSprite(15, 9, grow([['r', 0, 1, 10, 4, STAVE], ['r', 1, 0, 8, 6, STAVE], ['r', 1, 2, 8, 1, STAVE2], ['r', 2, 0, 1, 6, HOOP], ['r', 7, 0, 1, 6, HOOP], ['r', 3, 4, 3, 1, OILY], ['p', 5, 0, BUNG]])),
  /** Three hooked claws, bone pale, on a stub of a hand. */
  claws: makeSprite(6, 6, grow([['p', 0, 0, CLAW], ['p', 0, 1, CLAW], ['p', 2, 0, CLAW], ['p', 2, 1, CLAW], ['p', 3, 1, CLAW], ['r', 0, 2, 4, 2, '#5f7e30']])),
  /** The Gorger's gaff hook, rusted. */
  gaff: makeSprite(6, 6, grow([['r', 0, 0, 1, 3, '#6a4632'], ['r', 1, 3, 2, 1, '#6a4632'], ['p', 3, 2, '#8a7a6a']])),
  /** A cow's horn, bound with a thong. */
  horn: makeSprite(9, 4, grow([['r', 0, 1, 3, 2, HORN], ['r', 2, 0, 3, 2, HORN], ['p', 5, 0, TIP], ['p', 1, 2, HORN2], ['p', 3, 1, HORN2]])),
};
