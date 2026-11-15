/**
 * The Mage and the Healer in profile, facing east (docs/design/side-view.md slice 2; the rules are in
 * herosides.ts). Same rows as the front; bodies with the near leg only (under a robe, just the foot);
 * arm maps aligned to the body. Letters are the front's palette (herolooks2.ts).
 */

const EMPTY = '..................';
const pad = (n: number) => Array(n).fill(EMPTY);

// The Mage's hat from the side: the cone leaning back to its crooked tip, the band, the brim out both ways.
export const M_SIDE_HAT = [
  '......X...........', '......XX..........', '......XxX.........', '......XXXX........', '.....XXkXX........', '.....XXXXXX.......',
  '....XXXxXXXX......', '.....XXXXxXXX.....', '.....XTTkkTTX.....', '..xXXXXXXXXXXXXx..', '.xXXxxxxxxxxxxXXx.',
];
// Five face rows under the brim (one eye on the second, x 11) and the first body row, where the beard or hair falls.
export const M_SIDE_BEARD = ['.....HHHhSSSS.....', '.....HHHhSSES.....', '.....HHHhSSSSS....', '.....HHHHHhHHH....', '......HHHhHHHH....', '....OOBBBHhHHh....'];
export const M_SIDE_FROST = ['.....HHHHSSSS.....', '.....HHHHSSES.....', '....HHHHHSSSSS....', '....HHHHHSsSS.....', '....HhHHHHSSs.....', '....HHHHBBBBTB....'];
// The robe: the beard's tip on the chest, the gold band down its front edge, the belt, the robe flaring to the
// stitched hem, then the near foot.
export const M_SIDE_BODY = [
  '....OBBBBBHhH.....', '....OBBBBBBHh.....', '....OBBBBBBBT.....', '....OBBBBBBBT.....', '....OBBBBBBBT.....',
  '....OBBBBBBBT.....', '....OBBBBBBBT.....', '....OKKKKKKKKk....', '....BBBBBBBBT.....', '....BBBBBBBBT.....',
  '...BbBBBBBBBT.....', '...BbBBBBBBBT.....', '...BbBBBBBBBT.....', '...BbBBBBBBBT.....', '..BBbBBBBBBBTB....',
  '..BBbBBBBBBBTB....', '..BbBBBBBBBBTB....', '..BbBBBBBBBBTB....', '.bBbBBBBBBBBTBb...', '.bBbBBBBBBBBTBb...',
  '.bBbBBBBBBBBTBb...', '.bkBkBkBkBkBkkb...', '........FFFF......',
];
// The wide sleeve, its trimmed cuff, the hand out of it at the belt. (Rows from the top of the hat.)
export const M_SIDE_ARM = [
  ...pad(17), '........OOb.......', '........OOOb......', '........OOOb......', '........OOOOb.....', '.........OOOb.....',
  '.........OOOOb....', '.........TTTT.....', '..........SSS.....', ...pad(15),
];

// The Healer in mail: the coif or the red cap over the hair, the face, then the neck row (the coif, or the neck bare).
export const C_SIDE_COIF = ['......MMMMM.......', '.....MMMMMMM......', '.....MMMMMsSS.....', '.....MMMMMSES.....', '.....MMMMMSSSS....', '.....MMMMMMsS.....', '......MMMMMMM.....'];
export const C_SIDE_CAP = ['......RRRRR.......', '.....RRRRRRR......', '.....HHHHHsSS.....', '.....HHHHSSES.....', '.....HHHHSSSSS....', '.....HHHSSSsS.....', '......HsSSSS......'];
export const C_SIDE_NECK = ['....MMMMMMMMM.....', '....MMMMMMSSM.....'];
// The mail, the tabard a narrow strip down the front (the Lantern is on its face, not seen side on), the belt, the
// mail skirt, the tabard on to its gold hem in front of the thigh, then the near leg.
export const C_SIDE_BODY = [
  '.....MMMMMMMW.....', '.....MMMMMMMWw....', '.....MMMMMMMWw....', '.....MMMMMMMWw....', '.....MMMMMMMWw....',
  '.....MMMMMMMWw....', '.....MMMMMMMWw....', '.....KKKKKKKKk....', '.....MMMMMMMWw....', '.....MmMMMMMWw....',
  '.....mMMMMmMWw....', '......LLLL.Ww.....', '......LLLL.Ww.....', '......LLLL.GG.....', '.......LLLm.......',
  '.......LLLm.......', '.......LLLm.......', '......KKKKK.......', '......FFFFF.......', '......FFFFF.......',
  '......FFFFFF......', '......FFFFFFF.....', '......fffffff.....',
];
// A mail sleeve, the hand at the belt. (Rows from the top of the head.)
export const C_SIDE_ARM = [
  ...pad(8), EMPTY, '........MMm.......', '........MMm.......', '........MmM.......', '........MMm.......',
  '.........MMm......', '.........MMm......', '.........SSS......', '.........ss.......', ...pad(14),
];

// The friar: the tonsure's ring of hair, the cowl down on the shoulders, the habit to the feet with the wooden cross
// hung before the chest, the rope belt and its cord, the near foot under the hem.
export const F_SIDE_HEAD = ['.......SSSS.......', '.....HSSSSSS......', '.....HHHSSSSS.....', '.....HHSsSSES.....', '.....HHSSSSSSS....', '....CCCCsSSsS.....', '...CCCCCCsSs......'];
export const F_SIDE_BODY = [
  '...CCCCCCBBBB.....', '....OOBBBBBBBW....', '....OOBBBBBBWWW...', '....OOBbBBBBBW....', '....OOBBBBBBB.....',
  '....OOBbBBBBB.....', '....OOBbBBBBB.....', '....OOBBBBBBB.....', '....BKKKKKKKKK....', '....BBBBBBBBBk....',
  '....BbBBBBBBBk....', '....BbBBBBBBB.....', '....BbBBBBBBB.....', '...BBbBBBBBBBB....', '...BBbBBBBBBBB....',
  '...BbBBBBBBBBB....', '...BbBBBBBBBBBb...', '..bBbBBBBBBBBBb...', '..bBbBBBBBBBBBb...', '..bBbBBBBBBBBBBb..',
  '..bBbBBBBBBBBBBb..', '..bbBBBBBBBBBBbb..', '........FFFF......', '........FFFFF.....',
];
// The habit's wide sleeve, the hand out of it.
export const F_SIDE_ARM = [
  ...pad(7), EMPTY, '........BBb.......', '........BBb.......', '........BBBb......', '........BBBb......',
  '.........BBBb.....', '.........BBBb.....', '.........bbbb.....', '..........SSS.....', ...pad(15),
];
