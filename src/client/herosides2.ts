/**
 * The Ranger and the Rogue in profile, facing east (docs/design/side-view.md slice 2; the rules are in
 * herosides.ts): the same rows as the front, so the cut, the skirt that sways and the hands carry over.
 * Each body has only the near leg and no near arm; each arm map is aligned to the body (its first rows
 * are the head's, empty). Letters are the front's palette (herolooks.ts).
 */

const EMPTY = '..................';
const pad = (n: number) => Array(n).fill(EMPTY);

// The Ranger: the cloak over the back and shoulder, the quiver on the back with its fletching up past the hood,
// the jerkin in front crossed by the strap, the belt and the short sword's hilt, the cloak to the knee behind the
// thigh, then the near leg below its hem.
export const R_SIDE_BODY = [
  '...QcCCCCCBBB.....', '...QcCCCCCBKB.....', '...QcCCCCCBBK.....', '...QcCCCCBBBB.....', '....cCCCCBBBB.....',
  '....cCCCCBBBb.....', '....cCCCCBBBb.....', '....cCCCCBBBb.....', '....cCCCKKKKKk....', '....cCCCBBBBb.....',
  '....cCCCBbBBb.....', '...ccCCCbBBBb.....', '...cCCC.LLLL......', '...cCCC.LLLL......', '..cCCCC.LLLL......',
  '..ccccc.LlLL......', '........LLLl......', '........LLLl......', '........LLLl......', '.......KKKKK......',
  '.......FFFFF......', '.......FFFFFF.....', '.......FFFFFFF....', '.......fffffff....',
];
// The near arm out from under the cloak: a jerkin sleeve, a leather bracer, the hand at the belt.
export const R_SIDE_ARM = [
  ...pad(9), EMPTY, EMPTY, '........BBb.......', '........BBb.......', '........BBb.......', '........BbB.......',
  '.........KKb......', '.........KKK......', '.........SSS......', '.........ss.......', ...pad(14),
];
// The hood's peak at the back, the face open at the front under its brim (the fringe, one eye on row 5 at x 11,
// the nose), the quiver's fletching up behind. The trapper's fur edge and beard, the warden's fair fringe.
export const R_SIDE_HEADS = [
  ['.......CC.........', '..q...CCCC........', '..qq.CCCCCC.......', '..qq.CCCCCCCC.....', '...QcCCCCCHHHC....', '...QcCCCCcSES.....', '...QcCCCCcSSSS....', '...QcCCCCCsSs.....', '....QcCCCCCCs.....'],
  ['.......CC.........', '..q...CCCC........', '..qq.CCCCCC.......', '..qq.CCCCCCcc.....', '...QcCCCCcccccC...', '...QcCCCCcSES.....', '...QcCCCCHSSSS....', '...QcCCCCHHHH.....', '....QcCCCCHHH.....'],
  ['.......CC.........', '..q...CCCC........', '..qq.CCCCCC.......', '..qq.CCCCCCCC.....', '...QcCCCCCHHHC....', '...QcCCCCcSES.....', '...QcCCCCcSSSS....', '...QcCCCCCsSs.....', '....QcCCCCCCs.....'],
];

// The Rogue: the long cloak down the back flaring to the hem, the slim jerkin in front with its strap, the belt,
// buckle and pouch, the leg in front of the cloak (it sways with the cloak, the cut's skirt), only the boot stepping.
export const G_SIDE_BODY = [
  '....cCCCCCBBb.....', '....cCCCCCBTB.....', '....cCCCCCBBT.....', '....cCCCCBBBB.....', '....cCCCCBBBB.....',
  '....cCCCCBBBb.....', '....cCCCCBBBb.....', '....cCCCCBBBb.....', '....cCCCTTTTt.....', '....cCCCBkkBb.....',
  '...ccCCC.LLLL.....', '...cCCCC.LLLL.....', '...cCCCC.LLLL.....', '..ccCCCC.LlLL.....', '..cCCCCC.LLLL.....',
  '..cCCCCC.LLLL.....', '.ccCCCCC.LLLL.....', '.ccccccc.LlLL.....', '.........LLLl.....', '.........FFF......',
  '.........FfF......', '........FFFfF.....', '........FFFFFf....', '........ffffff....',
];
// A leather sleeve, the hand at the belt.
export const G_SIDE_ARM = [
  ...pad(9), EMPTY, EMPTY, '........BBb.......', '........BBb.......', '........BbB.......', '........BBb.......',
  '.........BBb......', '.........SSS......', '.........ss.......', ...pad(15),
];
// The deep hood, its dark round the eye (row 5, x 11) with the glint beside it, the wrap over the nose, its tail
// hanging behind the neck. One map for all three looks: they differ only in colour.
export const G_SIDE_HEAD = [
  '.......CC.........', '......cCCc........', '.....cCHCCc.......', '.....cCHCCCCc.....', '.....CCCCCCOC.....',
  '.....CCCCCOEG.....', '.....CCCCCKKKK....', '...KKcCCCCKKKk....', '...K..cCCCCkk.....',
];
