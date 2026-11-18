/**
 * The Mage's and the Healer's three looks (herolooks.ts has the others and the rules), 18 wide, at the
 * heroic proportions (Kyle, 2026-11-12). The Mage: the tallest, a wide-brimmed pointed hat with a crooked
 * tip over a 5-row face, a robe that flares to a gold-stitched hem. The Healer: mail, and a narrow tabard
 * panel with the Lantern on it (embroidered, so it doesn't glow) over a mail skirt; or a friar's habit.
 */
import { art, skin, type LookDef } from './lookkit';

import { C_SIDE_ARM, C_SIDE_BODY, C_SIDE_CAP, C_SIDE_COIF, C_SIDE_NECK, F_SIDE_ARM, F_SIDE_BODY, F_SIDE_HEAD, M_SIDE_ARM, M_SIDE_BEARD, M_SIDE_BODY, M_SIDE_FROST, M_SIDE_HAT } from './herosides3';
// (Dark and gold, docs/design/dark-gold.md: the brim out to the full width and a feather from the band, Q and q.)
const HAT = [
  '...........X......', '..........XX......', '.........XxX......', '........XXXX...q..', '........XXkXX.qQ..', '.......XXXXXXqQ...',
  '.......XXXxXXQQ...', '......XXxXXXQQ....', '.....XTTkkTTQ.....', '.xXXXXXXXXXXXXXXx.', 'xXXXxxxxxxxxxxXXXx',
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
/** `side`: the face rows in profile (herosides3.ts). */
const mage = (face: string[], back: string[], side: string[], pal: Record<string, string>, hair?: string): LookDef => ({
  side: { body: art([...M_SIDE_HAT, ...side, ...M_SIDE_BODY], pal), arm: art(M_SIDE_ARM, pal), eyes: [12, 11, 11] },
  down: art([...HAT, ...face, ...M_BODY], pal), up: art([...HAT, ...back, ...M_BACK], pal), h: 40, tall: 8, robe: true, eyes: [12, 7, 10],
  life: { hem: [pal.B, pal.b], tip: pal.X, hair }, cut: { headTo: 16, hip: 39, back: [0, 16, 5, 25], arm: [13, 16, 18, 25] }, lift: 6,
  // (The tailor's dye, clothsprites.ts: the robe, its folds, the sleeves, the hat and its shadow.)
  cloth: [pal.B, pal.b, pal.O, pal.X, pal.x],
});

export const MAGE: LookDef[] = [
  // Violet hat and robe, a gold band, a long grey beard.
  mage(BEARD, BEARD_BACK, M_SIDE_BEARD, { ...skin('fair'), X: '#22222c', x: '#14141c', T: '#c8962e', H: '#b0aabc', h: '#8a8498', O: '#3a4656', B: '#2e3a48', b: '#1e2632', K: '#c8962e', k: '#e0c070', F: '#18161a', Q: '#7a2a32', q: '#4a161c' }),
  // The ember: red hat and robe, brass, a black beard.
  mage(BEARD, BEARD_BACK, M_SIDE_BEARD, { ...skin('tan'), X: '#2a1210', x: '#180a08', T: '#d4a537', H: '#2a2226', h: '#141014', O: '#4e1a14', B: '#421612', b: '#2a0e0c', K: '#2a0e0c', k: '#d4a537', F: '#18120e', Q: '#141010', q: '#0a0808' }),
  // Frost: pale blue, no beard, long white hair down the back.
  mage(['.....HssSSssH.....', '.....HSESSESH.....', '.....HSSsSSSH.....', '....HhHsSSsHhH....', '....HhHSSSSHhH....', '.OOHHBBBTTBBBHHOO.'],
    ['.....HHHHHHHH.....', '.....HHhHHhHH.....', '.....HHHHHHHH.....', '....HhHHHHHHhH....', '....HHHhHHhHHH....', '.OOOHHHHHHHHHHOOO.'],
    M_SIDE_FROST,
    { ...skin('deep'), X: '#1e3440', x: '#12222a', T: '#c8962e', H: '#e8eef2', h: '#b8c4cc', O: '#2e4a58', B: '#264050', b: '#182a36', K: '#182a36', k: '#e0c070', F: '#141a1e', Q: '#d8d8d0', q: '#9a9a94' }),
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
// (Dark and gold: the mail dark steel, the tabard's edge (w) in gold.)
const MAIL = { M: '#4e545c', m: '#363b42', K: '#241a14', k: '#d4a537', L: '#262a30', F: '#18161a', f: '#100e10' };
/** `neck`: the first body row, the coif over the neck or the neck bare. `sideHead`, `sideNeck`: the same in profile. */
const cleric = (head: string[], back: string[], neck: string, pal: Record<string, string>, sideHead: string[], sideNeck: string): LookDef => ({
  side: { body: art([...sideHead, sideNeck, ...C_SIDE_BODY], pal), arm: art(C_SIDE_ARM, pal), eyes: [3, 11, 11] },
  down: art([...head, neck, ...C_BODY], pal), up: art([...back, neck.replace(/S/g, 'M'), ...C_BACK], pal), h: 31, tall: 0, eyes: [3, 7, 10],
  // (The legs cut below the tabard's gold hem, so it stays whole as they walk.)
  life: { tabard: pal.W }, cut: { headTo: 7, hip: 22, back: [0, 7, 6, 17], arm: [12, 7, 18, 17] }, lift: 6,
  // (The tailor's dye is the tabard; her edge is its metal: its edges, its hem and the Lantern.)
  cloth: [pal.W], edge: [pal.w, pal.G, pal.g],
});

const FRIAR = { ...skin('brown'), H: '#2a2020', C: '#2e221a', B: '#3a2a20', b: '#261c16', O: '#2e221a', K: '#a89868', k: '#7a6c4a', F: '#18120e', W: '#c8962e' };
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
    '..MMMMMMMMMMMMMM..', { ...skin('light'), ...MAIL, W: '#d0c8b4', w: '#c8962e', g: '#e8c870', G: '#c8962e' }, C_SIDE_COIF, C_SIDE_NECK[0]),
  // The friar: a brown habit to the feet, the cowl down, a tonsure, a rope belt.
  {
    down: art(['.......SSSS.......', '.....HSSSSSSH.....', '.....SSHSSHSS.....', '.....SSESSESS.....', '.....SSSsSSSS.....', '.....CsSSSSsC.....', '....CCCsSSsCCC....', ...F_BODY], FRIAR),
    up: art(['.......SSSS.......', '.....HSSSSSSH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....CCCCCCCC.....', '....CCCCCCCCCC....', ...F_BACK], FRIAR),
    h: 31, tall: 0, robe: true, eyes: [3, 7, 10], life: { hem: ['#3a2a20', '#261c16'] },
    side: { body: art([...F_SIDE_HEAD, ...F_SIDE_BODY], FRIAR), arm: art(F_SIDE_ARM, FRIAR), eyes: [3, 11, 11] },
    cut: { headTo: 7, hip: 29, back: [0, 7, 5, 17], arm: [13, 7, 18, 17] }, lift: 6,
    // (He has no tabard: the tailor's dye is his habit and its cowl.)
    cloth: [FRIAR.B, FRIAR.b, '', FRIAR.O],
  },
  // A red cap over cropped brown hair, a red tabard over the mail.
  cleric(['......RRRRRR......', '.....RRRRRRRR.....', '.....HSsSSsSH.....', '.....HSESSESH.....', '.....HSSsSSSH.....', '.....HSSssSSH.....', '......sSSSSs......'],
    ['......RRRRRR......', '.....RRRRRRRR.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '......HHHHHH......'],
    '..MMMMMMSSMMMMMM..', { ...skin('fair'), ...MAIL, R: '#3a0e10', H: '#5a3a22', W: '#4e1214', w: '#c8962e', g: '#f0d888', G: '#d4a537' }, C_SIDE_CAP, C_SIDE_NECK[1]),
];

