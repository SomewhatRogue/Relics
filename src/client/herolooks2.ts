/**
 * The Mage's and the Cleric's three looks (herolooks.ts has the others and the rules), 18 wide. The
 * Mage: the tallest, a wide-brimmed pointed hat with a crooked tip and a robe that flares at the hem.
 * The Cleric: mail and a long tabard with the Lantern on it (embroidered, so it doesn't glow), or a
 * friar's habit.
 */
import { art, skin, type LookDef } from './lookkit';

const HAT = [
  '...........X......', '..........XX......', '.........XxX......', '........XXXX......', '........XXkXX.....', '.......XXXXXX.....',
  '.......XXXxXXX....', '......XXxXXXX.....', '.....XTTkkTTX.....', '..xXXXXXXXXXXXXx..', '.xXXxxxxxxxxxxXXx.',
];
// Trimmed cuffs, a pouch and a tassel at the belt, folds in the robe, a gold-stitched hem.
const M_BODY = [
  '.OOOBBBBTTBBBBOOO.', '.TTOBBBBTTBBBBOTT.', '.SSOBBBBTTBBBBOSS.', '...BBBBBTTBBBBB...', '...KxxKKkkKKKKK...',
  '...BxxBBTTBBkBB...', '..BBBBBBTTBBkBBB..', '..BBbBBBTTBBBbBB..', '..BBbBBBTTBBBbBB..', '.BBBbBBBTTBBBbBBB.',
  '.BBbBBBBTTBBBBbBB.', 'bBBbBBBBTTBBBBbBBb', 'bbkBkBkBkkBkBkBkbb', '.....FFF..FFF.....',
];
const M_BACK = [
  '.OOOBBBBBBBBBBOOO.', '.TTOBBBBBBBBBBOTT.', '.SSOBBBBBBBBBBOSS.', '...BBBBBBBBBBBB...', '...KKKKKKKKKKKK...',
  '...BBBBBBBBBBBB...', '..BBBBBBbBBBBBBB..', '..BBbBBBbBBBBbBB..', '..BBbBBBbBBBBbBB..', '.BBBbBBBbBBBBbBBB.',
  '.BBbBBBBbBBBBBbBB.', 'bBBbBBBBbBBBBBbBBb', 'bbkBkBkBkkBkBkBkbb', '.....FFF..FFF.....',
];
// Six face rows under the brim, then the first body row (where a beard falls over the chest).
const BEARD = ['.....HhhSShhH.....', '.....HSESSESH.....', '.....HSSsSSSH.....', '.....HHsSSsHH.....', '......HhHHhH......', '.......HhHH.......', '.OOOBBBHhHHBBBOOO.'];
const BEARD_BACK = ['.....HHHHHHHH.....', '.....HHhHHhHH.....', '.....HHHHHHHH.....', '.....HhHHHHhH.....', '......HHHHHH......', '.......BBBB.......', '.OOOBBBBBBBBBBOOO.'];
const mage = (face: string[], back: string[], pal: Record<string, string>, hair?: string): LookDef => ({
  down: art([...HAT, ...face, ...M_BODY], pal), up: art([...HAT, ...back, ...M_BACK], pal), h: 32, tall: 8, robe: true, eyes: [12, 7, 10],
  life: { hem: [pal.B, pal.b], tip: pal.X, hair },
});

export const MAGE: LookDef[] = [
  // Violet hat and robe, a gold band, a long grey beard.
  mage(BEARD, BEARD_BACK, { ...skin('fair'), X: '#4a2f6e', x: '#2e1c48', T: '#b89a4a', H: '#b0aabc', h: '#8a8498', O: '#4a2f6e', B: '#3e2760', b: '#2e1c48', K: '#b89a4a', k: '#e0c878', F: '#2a2420' }),
  // The ember: red hat and robe, brass, a black beard.
  mage(BEARD, BEARD_BACK, { ...skin('tan'), X: '#7a2420', x: '#3a1210', T: '#d4a537', H: '#2a2226', h: '#141014', O: '#7a2a1e', B: '#6a1e1a', b: '#3a1210', K: '#3a1210', k: '#d4a537', F: '#2a2420' }),
  // Frost: pale blue, no beard, long white hair down the back.
  mage(['.....HssSSssH.....', '.....HSESSESH.....', '.....HSSsSSSH.....', '....HhHsSSsHhH....', '....HhH.SS.HhH....', '....HhH....HhH....', '.OOHHBBBTTBBBHHOO.'],
    ['.....HHHHHHHH.....', '.....HHhHHhHH.....', '.....HHHHHHHH.....', '....HhHHHHHHhH....', '....HHHhHHhHHH....', '....HhHHHHHHhH....', '.OOOHHHHHHHHHHOOO.'],
    { ...skin('deep'), X: '#5a7a9a', x: '#3a4a5a', T: '#cfe0ec', H: '#e8eef2', h: '#b8c4cc', O: '#6a8aaa', B: '#5a7a9a', b: '#3a4a5a', K: '#3a4a5a', k: '#cfe0ec', F: '#2a2420' }),
];

// The tabard a narrow straight panel over a mail skirt to the thigh (Kyle, 2026-11-12: wide over the hips and
// pointed between the legs it read as a nappy).
const C_BODY = [
  '.MMMMMWWWWWWMMMMM.', '.MMMMMWWGGWWMMMMM.', '.MMMMMWGGGGWMMMMM.', '.MMMMMwGggGwMMMMM.', '.MMMMMwGGGGwMMMMM.',
  '.SSMMMwWGGWwMMMSS.', '...KKKKKkkKFFKK...', '...MMMwWWWWwMMM...', '...MmMwWWWWwMmM...', '....LLwWWWWwLL....',
  '....LLGGGGGGLL....', '....LmL....LmL....', '...KKKK....KKKK...', '...FFFF....FFFF...', '..FFFFF....FFFFF..',
];
const C_BACK = C_BODY.map((r) => r.replace(/[Gg]/g, 'W').replace(/k/g, 'K'));
const MAIL = { M: '#8a9098', m: '#646a74', K: '#5a3d22', k: '#d4a537', L: '#4a4e56', F: '#2a2420' };
const cleric = (head: string[], back: string[], pal: Record<string, string>): LookDef => ({
  down: art([...head, ...C_BODY], pal), up: art([...back, ...C_BACK], pal), h: 24, tall: 0, eyes: [5, 7, 10], life: { tabard: pal.W },
});

const FRIAR = { ...skin('brown'), H: '#2a2020', C: '#4a3428', B: '#5a4232', b: '#3a2a20', O: '#4a3428', K: '#c8b88a', k: '#a89868', F: '#2a2420', W: '#9a7a4a' };
const F_SKIRT = ['...BBBBBBBkBBBB...', '...BbBBBBBkBBbB...', '...BbBBBBBkBBbB...', '..BBbBBBBBBBBbBB..', '..BBbBBBBBBBBbBB..', '.BBbBBBBBBBBBBbBB.', 'bBBBBBBBBBBBBBBBBb', '.....FFF..FFF.....'];

export const CLERIC: LookDef[] = [
  // A mail coif, a white tabard to the knee with the Lantern on it in gold.
  cleric(['.......MMMM.......', '.....MMMMMMMM.....', '....MMMMMMMMMM....', '....MMMMMMMMMM....', '....MMSsSSsSMM....', '....MMSESSESMM....', '....MMSSsSSSMM....', '....MMMsSSsMMM....', '.....MMMMMMMM.....'],
    ['.......MMMM.......', '.....MMMMMMMM.....', '....MMMMMMMMMM....', '....MMMMMMMMMM....', '....MMMMMMMMMM....', '....MMMMMMMMMM....', '....MMMMMMMMMM....', '....MMMMMMMMMM....', '.....MMMMMMMM.....'],
    { ...skin('light'), ...MAIL, W: '#e0d8c4', w: '#b8b09c', g: '#e8c870', G: '#c8962e' }),
  // The friar: a brown habit to the feet, the cowl down, a tonsure, a rope belt.
  {
    down: art(['..................', '.......SSSS.......', '.....HSSSSSSH.....', '.....HSSSSSSH.....', '.....SSHSSHSS.....', '.....SSESSESS.....', '.....SSSsSSSS.....', '.....CsSSSSsC.....', '....CCCsSSsCCC....',
      '.CCCCCBBkBBBCCCCC.', '.OOBBBBBWBBBBBBOO.', '.OOBbBBWWWBBBbBOO.', '.OOBbBBBWBBBBbBOO.', '.SSBBBBBWBBBBBBSS.', '..BBBBBBBBBBBBBB..', '...KKKKKkkKKKKK...', ...F_SKIRT], FRIAR),
    up: art(['..................', '.......SSSS.......', '.....HSSSSSSH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....CCCCCCCC.....', '....CCCCCCCCCC....',
      '.CCCCCCCCCCCCCCCC.', '.OOBBCCCCCCCCBBOO.', '.OOBBBCCCCCCBBBOO.', '.OOBBBBCCCCBBBBOO.', '.SSBBBBBBBBBBBBSS.', '..BBBBBBBBBBBBBB..', '...KKKKKKKKKKKK...', ...F_SKIRT.map((r) => r.replace(/k/g, 'B'))], FRIAR),
    h: 24, tall: 0, robe: true, eyes: [5, 7, 10], life: { hem: ['#5a4232', '#3a2a20'] },
  },
  // A red cap over cropped brown hair, a red tabard over the mail.
  cleric(['..................', '.......RRRR.......', '.....RRRRRRRR.....', '....HRRRRRRRRH....', '....HHSsSSsSHH....', '....HSSESSESSH....', '....HSSSsSSSSH....', '.....sSSssSSs.....', '......sSSSSs......'],
    ['..................', '.......RRRR.......', '.....RRRRRRRR.....', '....HRRRRRRRRH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '......HHHHHH......'],
    { ...skin('fair'), ...MAIL, R: '#5a1414', H: '#5a3a22', W: '#8a2020', w: '#601414', g: '#f0d888', G: '#d4a537' }),
];
