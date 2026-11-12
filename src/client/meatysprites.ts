/**
 * The new meaty sorts' pieces as pixel sprites, in the placeholder style of sprites.ts (flat colours, auto
 * shading lit from the top left, a dark outline): the Planker's barn door seen from the front, edge-on and
 * from behind; the Swingle's flail head; the Forker's three tines. The bodies are the small goblin's,
 * drawn bigger (MEATY_DRAW). Drawing only.
 */
import { grow, makeSprite, type Part } from './sprites';

const PLANK = '#6a4a2c', PLANK2 = '#7e5a36', SEAM = '#3e2a18', BRACE = '#54381f', IRON = '#6a6a70', RIVET = '#9aa3ad';

/** Three planks with a Z brace and two iron straps: the barn door off its hinges, held up to its eyes. */
const doorFront: Part[] = [
  ['r', 0, 0, 9, 8, PLANK], ['r', 3, 0, 3, 8, PLANK2], ['r', 3, 0, 1, 8, SEAM], ['r', 6, 0, 1, 8, SEAM],
  ['r', 0, 1, 9, 1, BRACE], ['r', 0, 6, 9, 1, BRACE], ['p', 1, 5, BRACE], ['p', 2, 4, BRACE], ['p', 3, 4, BRACE], ['p', 4, 3, BRACE], ['p', 5, 3, BRACE], ['p', 6, 2, BRACE], ['p', 7, 2, BRACE],
  ['r', 0, 1, 2, 1, IRON], ['r', 0, 6, 2, 1, IRON], ['p', 1, 1, RIVET], ['p', 1, 6, RIVET],
];

export const MEATY_SPRITES = {
  doorFront: makeSprite(14, 12, grow(doorFront)),
  /** Edge-on, turned to the side: the planks' ends and the strap. */
  doorSide: makeSprite(4, 14, grow([['r', 0, 0, 3, 9, PLANK], ['r', 1, 0, 1, 9, PLANK2], ['r', 0, 2, 3, 1, IRON], ['r', 0, 7, 3, 1, IRON]])),
  /** From behind (it faces away): the brace boards on the back. */
  doorBack: makeSprite(14, 12, grow([['r', 0, 0, 9, 8, PLANK], ['r', 0, 0, 9, 1, PLANK2], ['r', 3, 0, 1, 8, SEAM], ['r', 6, 0, 1, 8, SEAM], ['r', 0, 3, 9, 2, BRACE]])),
  /** The swingle: the short heavy bar of a threshing flail, iron-capped. */
  flailHead: makeSprite(3, 8, grow([['r', 0, 0, 2, 5, '#5a3d22'], ['r', 0, 0, 2, 1, IRON], ['r', 0, 4, 2, 1, IRON]])),
  /** The pitchfork's head: three rusty tines on a cross-piece. */
  tines: makeSprite(8, 6, grow([['r', 0, 0, 5, 1, '#5a5654'], ['r', 0, 0, 1, 4, '#8a7a6a'], ['r', 2, 0, 1, 4, '#8a7a6a'], ['r', 4, 0, 1, 4, '#8a7a6a'], ['p', 0, 3, '#6a4632']])),
};
