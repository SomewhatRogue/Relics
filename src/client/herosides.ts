/**
 * The Warrior in profile, facing east (docs/design/side-view.md, slice 1): mirrored for west. The same
 * 18 wide canvas and rows as the front (a 7-row head, a body of 24 with the feet on the bottom row, the
 * legs from row 15 under the tabard's tips), so the cut, the walk's timing and the hands' lift carry over.
 * The body has only the near leg (sidejoints.ts makes the far one from it, a pixel behind and a shade
 * darker) and no near arm: that is its own map, drawn over the body with its own outline so it can swing
 * without leaving a hole. Letters are the front's palette (herolooks.ts).
 */
import { SHARP } from './charpaint';

// Shoulders under the pauldron, the chest with the tabard's band down its front edge, the belt and buckle,
// the tabard's front and back panels with the thigh between, then the near leg: knee plate, boot, toe.
export const W_SIDE_BODY = [
  '......pPPPPsS.....', '.....pPPkPPPBT....', '.....pPPPPPpBT....', '.....bppppppBT....', '.....bBBBBBBBT....',
  '.....bBBBBBBBT....', '.....bBBBBBBBT....', '.....bBBBBBBBT....', '.....KKKKKKKKG....', '.....bBBBBBBBT....',
  '.....bBBBBBBBT....', '.....bBBBBBBBT....', '.....bbLLLLLBT....', '.....b.LLLLLBT....', '.....b.LLLL.BT....',
  '.......LLLl.......', '.......LLAA.......', '.......LLLl.......', '.......LLLl.......', '......KKKKK.......',
  '......FFFFF.......', '......FFFFFF......', '......FFFFFFF.....', '......fffffff.....',
];
// The near arm: a mail sleeve from under the pauldron, the forearm forward a little, the hand at the hip.
export const W_SIDE_ARM = [
  '..................', '..................', '..................', '........MMm.......', '........MMm.......',
  '........MmM.......', '........MMm.......', '.........MMm......', '.........SSS......', '.........ss.......',
  ...Array(14).fill('..................'),
];
/** Seven empty rows over the arm (it starts at the shoulder). */
export const SIDE_NO_HEAD = Array(7).fill('..................');

/** The knight's closed great helm in profile (charmean.ts KNIGHT_HEAD's; Kyle, 2026-11-17: "the full face mask ...
 *  more than seeing the face sideways"): the visor slit at the front with one dim glint at the eye, breathing holes
 *  under it. Its letters are the knight's palette (charmean.ts KNIGHT_PAL). */
const W_SIDE_HELM = ['......hAAAa.......', '.....hAAAAAAa.....', '.....hAAAAAAa.....', '.....aAAAOOEO.....', '.....aAAAAAAa.....', '.....aAAAAaAa.....', '......aaAAAAa.....'];

// One head a look, the face to the right: the knight's open helm, the sellsword's black crop and beard,
// Blackiron's long pale hair and scar. The eye is on row 3 at x 11 (each look's `side.eyes`).
export const W_SIDE_HEADS = [
  SHARP ? W_SIDE_HELM : ['......hAAAa.......', '.....hAAAAAA......', '.....AAAAAAAA.....', '.....aAAAAAES.....', '.....aAAAAASSS....', '.....aAAAAAsS.....', '......aaAAASs.....'],
  ['......hHHHH.......', '.....hHHHHHH......', '.....HHHHHHSS.....', '.....HHHsSSES.....', '.....HHHSSSSSS....', '......HHsHHHHH....', '.......HHHHHH.....'],
  ['......hHHHH.......', '.....hHHHHHH......', '....HHHHHHHSS.....', '....HHHHsSSES.....', '....HHHHSSrSSS....', '....HHHHSsSSs.....', '....HHHHHsSs......'],
];
