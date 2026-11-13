/**
 * The Mage's and the Healer's three looks (herolooks.ts has the others and the rules), 18 wide, at the
 * heroic proportions (Kyle, 2026-11-12). The Mage: the tallest, a wide-brimmed pointed hat with a crooked
 * tip over a 5-row face, a robe that flares to a gold-stitched hem. The Healer: mail, and a narrow tabard
 * panel with the Lantern on it (embroidered, so it doesn't glow) over a mail skirt; or a friar's habit.
 */
import { art, skin, type LookDef } from './lookkit';

const HAT = [
  '...........X......', '..........XX......', '.........XxX......', '........XXXX......', '........XXkXX.....', '.......XXXXXX.....',
  '.......XXXxXXX....', '......XXxXXXX.....', '.....XTTkkTTX.....', '..xXXXXXXXXXXXXx..', '.xXXxxxxxxxxxxXXx.',
];
// Trimmed cuffs, hands at the belt, a pouch and a tassel, folds down the robe, a gold-stitched hem. Row 0 is the look's own.
const M_BODY = [
  '.OOOBBBBTTBBBBOOO.', '.OOOBBBBTTBBBBOOO.', '.OOOBBBBTTBBBBOOO.', '.OOOBBBBTTBBBBOOO.', '.OOOBBBBTTBBBBOOO.',
  '.OOOBBBBTTBBBBOOO.', '.TTOBBBBTTBBBBOTT.', '.SSOKxxKKkkKKKOSS.', '...BxxBBTTBBkBB...', '...BBBBBTTBBkBB...',
  '..BBbBBBTTBBBbBB..', '..BBbBBBTTBBBbBB..', '..BBbBBBTTBBBbBB..', '..BBbBBBTTBBBbBB..', '.BBBbBBBTTBBBbBBB.',
  '.BBBbBBBTTBBBbBBB.', '.BBbBBBBTTBBBBbBB.', '.BBbBBBBTTBBBBbBB.', 'bBBbBBBBTTBBBBbBBb', 'bBBbBBBBTTBBBBbBBb',
  'bBBbBBBBTTBBBBbBBb', 'bbkBkBkBkkBkBkBkbb', '.....FFF..FFF.....',
];
const M_BACK = M_BODY.map((r, i) => (i === 7 ? '.SSOKKKKKKKKKKOSS.' : i === 21 ? r : r.replace(/[Txk]/g, 'B')));
// Five face rows under the brim, then the first body row (where a beard falls over the chest).
const BEARD = ['.....HhhSShhH.....', '.....HSESSESH.....', '.....HSSsSSSH.....', '.....HHsSSsHH.....', '......HhHHhH......', '.OOOBBBHhHHBBBOOO.'];
const BEARD_BACK = ['.....HHHHHHHH.....', '.....HHhHHhHH.....', '.....HHHHHHHH.....', '.....HhHHHHhH.....', '......HHHHHH......', '.OOOBBBBBBBBBBOOO.'];
const mage = (face: string[], back: string[], pal: Record<string, string>, hair?: string): LookDef => ({
  down: art([...HAT, ...face, ...M_BODY], pal), up: art([...HAT, ...back, ...M_BACK], pal), h: 40, tall: 8, robe: true, eyes: [12, 7, 10],
  life: { hem: [pal.B, pal.b], tip: pal.X, hair }, cut: { headTo: 16, hip: 39, back: [0, 16, 5, 25], arm: [13, 16, 18, 25] }, lift: 6,
});

export const MAGE: LookDef[] = [
  // Violet hat and robe, a gold band, a long grey beard.
  mage(BEARD, BEARD_BACK, { ...skin('fair'), X: '#4a2f6e', x: '#2e1c48', T: '#b89a4a', H: '#b0aabc', h: '#8a8498', O: '#4a2f6e', B: '#3e2760', b: '#2e1c48', K: '#b89a4a', k: '#e0c878', F: '#2a2420' }),
  // The ember: red hat and robe, brass, a black beard.
  mage(BEARD, BEARD_BACK, { ...skin('tan'), X: '#7a2420', x: '#3a1210', T: '#d4a537', H: '#2a2226', h: '#141014', O: '#7a2a1e', B: '#6a1e1a', b: '#3a1210', K: '#3a1210', k: '#d4a537', F: '#2a2420' }),
  // Frost: pale blue, no beard, long white hair down the back.
  mage(['.....HssSSssH.....', '.....HSESSESH.....', '.....HSSsSSSH.....', '....HhHsSSsHhH....', '....HhHSSSSHhH....', '.OOHHBBBTTBBBHHOO.'],
    ['.....HHHHHHHH.....', '.....HHhHHhHH.....', '.....HHHHHHHH.....', '....HhHHHHHHhH....', '....HHHhHHhHHH....', '.OOOHHHHHHHHHHOOO.'],
    { ...skin('deep'), X: '#5a7a9a', x: '#3a4a5a', T: '#cfe0ec', H: '#e8eef2', h: '#b8c4cc', O: '#6a8aaa', B: '#5a7a9a', b: '#3a4a5a', K: '#3a4a5a', k: '#cfe0ec', F: '#2a2420' }),
];

// The Healer: mail with a narrow tabard panel (Kyle, 2026-11-12: wide over the hips it read as a nappy), the
// Lantern on it, hands at the belt, a mail skirt to the thigh, the tabard to the shin with a gold hem.
const C_BODY = [
  '.MMMMMWWWWWWMMMMM.', '.MMMMMWWGGWWMMMMM.', '.MMMMMWGGGGWMMMMM.', '.MMMMMwGggGwMMMMM.', '..MMMMwGGGGwMMMM..',
  '..MMMMwWGGWwMMMM..', '..MMMMwWWWWwMMMM..', '..SSKKKKkkKFFKSS..', '..ssMMwWWWWwMMss..', '....MMwWWWWwMM....',
  '....MmwWWWWwmM....', '....LLwWWWWwLL....', '....LLwWWWWwLL....', '....LLwWWWWwLL....', '....LLGGGGGGLL....',
  '....LmL....LmL....', '....LLL....LLL....', '....LLL....LLL....', '...KKKK....KKKK...', '...FFFF....FFFF...',
  '...FFFF....FFFF...', '..FFFFF....FFFFF..', '..ffff......ffff..',
];
const C_BACK = C_BODY.map((r) => r.replace(/[Gg]/g, 'W').replace(/k/g, 'K'));
const MAIL = { M: '#8a9098', m: '#646a74', K: '#5a3d22', k: '#d4a537', L: '#4a4e56', F: '#2a2420', f: '#1a1612' };
/** `neck`: the first body row, the coif over the neck or the neck bare. */
const cleric = (head: string[], back: string[], neck: string, pal: Record<string, string>): LookDef => ({
  down: art([...head, neck, ...C_BODY], pal), up: art([...back, neck.replace(/S/g, 'M'), ...C_BACK], pal), h: 31, tall: 0, eyes: [3, 7, 10],
  // (The legs cut below the tabard's gold hem, so it stays whole as they walk.)
  life: { tabard: pal.W }, cut: { headTo: 7, hip: 22, back: [0, 7, 6, 17], arm: [12, 7, 18, 17] }, lift: 6,
});

const FRIAR = { ...skin('brown'), H: '#2a2020', C: '#4a3428', B: '#5a4232', b: '#3a2a20', O: '#4a3428', K: '#c8b88a', k: '#a89868', F: '#2a2420', W: '#9a7a4a' };
// The habit to the feet, a wooden cross on its cord, a rope belt, folds; only the feet show under it.
const F_BODY = [
  '.CCCCCBBkBBBCCCCC.', '.OOBBBBBWBBBBBBOO.', '.OOBbBBWWWBBBbBOO.', '.OOBbBBBWBBBBbBOO.', '.OOBBBBBBBBBBBBOO.',
  '.OOBbBBBBBBBBbBOO.', '.OOBbBBBBBBBBbBOO.', '.OOBBBBBBBBBBBBOO.', '.SSBBKKKKkkKKKBSS.', '..BBBBBBBkBBBBBB..',
  '..BbBBBBBkBBBbBB..', '..BbBBBBBkBBBbBB..', '..BbBBBBBBBBBbBB..', '..BbBBBBBBBBBbBB..', '..BbBBBBBBBBBbBB..',
  '.BBbBBBBBBBBBbBBB.', '.BBbBBBBBBBBBbBBB.', '.BbBBBBBBBBBBBbBB.', '.BbBBBBBBBBBBBbBB.', 'bBbBBBBBBBBBBBbBBb',
  'bBbBBBBBBBBBBBbBBb', 'bbBBBBBBBBBBBBBBbb', '.....FFF..FFF.....', '.....FFF..FFF.....',
];
const F_BACK = [
  '.CCCCCCCCCCCCCCCC.', '.OOBBCCCCCCCCBBOO.', '.OOBBBCCCCCCBBBOO.', '.OOBBBBCCCCBBBBOO.',
  ...F_BODY.slice(4).map((r) => r.replace(/[Wk]/g, 'B')),
];

export const CLERIC: LookDef[] = [
  // A mail coif, a white tabard to the shin with the Lantern on it in gold.
  cleric(['......MMMMMM......', '.....MMMMMMMM.....', '.....MSsSSsSM.....', '.....MSESSESM.....', '.....MSSsSSSM.....', '.....MMSssSMM.....', '......MMMMMM......'],
    ['......MMMMMM......', '.....MMMMMMMM.....', '.....MMMMMMMM.....', '.....MMMMMMMM.....', '.....MMMMMMMM.....', '.....MMMMMMMM.....', '......MMMMMM......'],
    '..MMMMMMMMMMMMMM..', { ...skin('light'), ...MAIL, W: '#e0d8c4', w: '#b8b09c', g: '#e8c870', G: '#c8962e' }),
  // The friar: a brown habit to the feet, the cowl down, a tonsure, a rope belt.
  {
    down: art(['.......SSSS.......', '.....HSSSSSSH.....', '.....SSHSSHSS.....', '.....SSESSESS.....', '.....SSSsSSSS.....', '.....CsSSSSsC.....', '....CCCsSSsCCC....', ...F_BODY], FRIAR),
    up: art(['.......SSSS.......', '.....HSSSSSSH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....CCCCCCCC.....', '....CCCCCCCCCC....', ...F_BACK], FRIAR),
    h: 31, tall: 0, robe: true, eyes: [3, 7, 10], life: { hem: ['#5a4232', '#3a2a20'] },
    cut: { headTo: 7, hip: 29, back: [0, 7, 5, 17], arm: [13, 7, 18, 17] }, lift: 6,
  },
  // A red cap over cropped brown hair, a red tabard over the mail.
  cleric(['......RRRRRR......', '.....RRRRRRRR.....', '.....HSsSSsSH.....', '.....HSESSESH.....', '.....HSSsSSSH.....', '.....HSSssSSH.....', '......sSSSSs......'],
    ['......RRRRRR......', '.....RRRRRRRR.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '......HHHHHH......'],
    '..MMMMMMSSMMMMMM..', { ...skin('fair'), ...MAIL, R: '#5a1414', H: '#5a3a22', W: '#8a2020', w: '#601414', g: '#f0d888', G: '#d4a537' }),
];

