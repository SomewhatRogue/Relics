/**
 * The Mage's and the Cleric's three looks (herolooks.ts has the others and the rules). The Mage: the
 * tallest, a wide-brimmed pointed hat and a robe that flares at the hem. The Cleric: mail and a long
 * tabard with the Lantern on it (embroidered, so it doesn't glow), or a friar's habit.
 */
import { art, skin, type LookDef } from './lookkit';

const HAT = ['.......X....', '......XX....', '.....XXX....', '.....XXXX...', '....XXXXX...', '....XTTTX...', 'xXXXXXXXXXXx'];
const M_BODY = [
  '.OOBBTTBBOO.', '.SOBBTTBBOS.', '..BBBTTBBB..', '..KKKkKKKK..', '..BBBTTBBB..',
  '.BBBBTTBBBB.', '.BBBBTTBBBB.', 'bBBBBTTBBBBb', '...FF..FF...',
];
const M_BACK = [
  '.OOBBBBBBOO.', '.SOBBBBBBOS.', '..BBBBBBBB..', '..KKKKKKKK..', '..BBBBBBBB..',
  '.BBBBBBBBBB.', '.BBBBBBBBBB.', 'bBBBBBBBBBBb', '...FF..FF...',
];
const BEARD = ['..HSESSESH..', '..HSSSSSSH..', '...HSssSH...', '....HHHH....', '.OOBBHHBBOO.'];
const BEARD_BACK = ['..HHHHHHHH..', '..HHHHHHHH..', '...HHHHHH...', '....BBBB....', '.OOBBBBBBOO.'];
const mage = (face: string[], back: string[], pal: Record<string, string>, hair?: string): LookDef => ({
  down: art([...HAT, ...face, ...M_BODY], pal), up: art([...HAT, ...back, ...M_BACK], pal), h: 21, tall: 5, robe: true, eyes: [7, 4, 7],
  life: { hem: [pal.B, pal.b], tip: pal.X, hair },
});

export const MAGE: LookDef[] = [
  // Violet hat and robe, a gold band, a long grey beard.
  mage(BEARD, BEARD_BACK, { ...skin('fair'), X: '#4a2f6e', x: '#2e1c48', T: '#b89a4a', H: '#b0aabc', O: '#4a2f6e', B: '#3e2760', b: '#2e1c48', K: '#b89a4a', k: '#e0c878', F: '#2a2420' }),
  // The ember: red hat and robe, brass, a black beard.
  mage(BEARD, BEARD_BACK, { ...skin('tan'), X: '#7a2420', x: '#3a1210', T: '#d4a537', H: '#2a2226', O: '#7a2a1e', B: '#6a1e1a', b: '#3a1210', K: '#3a1210', k: '#d4a537', F: '#2a2420' }),
  // Frost: pale blue, no beard, long white hair down the back.
  mage(['..HSESSESH..', '..HSSSSSSH..', '..HHsSSsHH..', '..HH....HH..', '.OHBBTTBBHO.'], ['..HHHHHHHH..', '..HHHHHHHH..', '..HHHHHHHH..', '..HHHHHHHH..', '.OOHHHHHHOO.'],
    { ...skin('deep'), X: '#5a7a9a', x: '#3a4a5a', T: '#cfe0ec', H: '#e8eef2', O: '#6a8aaa', B: '#5a7a9a', b: '#3a4a5a', K: '#3a4a5a', k: '#cfe0ec', F: '#2a2420' }),
];

const C_BODY = [
  '.MMWWWWWWMM.', '.MMWWGGWWMM.', '.MMWGGGGWMM.', '.SMWWGGWWMS.', '..KKKkKKKK..',
  '..MWWWWWWM..', '..MWWWWWWM..', '...LWWWWL...', '...LL..LL...', '..FFF..FFF..',
];
const C_BACK = [
  '.MMWWWWWWMM.', '.MMWWWWWWMM.', '.MMWWWWWWMM.', '.SMWWWWWWMS.', '..KKKKKKKK..',
  '..MWWWWWWM..', '..MWWWWWWM..', '...LWWWWL...', '...LL..LL...', '..FFF..FFF..',
];
const MAIL = { M: '#8a9098', m: '#646a74', K: '#5a3d22', k: '#d4a537', L: '#4a4e56', F: '#2a2420' };
const cleric = (head: string[], back: string[], pal: Record<string, string>): LookDef => ({
  down: art([...head, ...C_BODY], pal), up: art([...back, ...C_BACK], pal), h: 16, tall: 0, eyes: [3, 4, 7], life: { tabard: pal.W },
});

const FRIAR = { ...skin('brown'), H: '#2a2020', C: '#4a3428', B: '#5a4232', b: '#3a2a20', O: '#4a3428', K: '#c8b88a', k: '#a89868', F: '#2a2420' };

export const CLERIC: LookDef[] = [
  // A mail coif, a white tabard to the knee with the Lantern on it in gold.
  cleric(['....MMMM....', '...MMMMMM...', '..MMMMMMMM..', '..MSESSESM..', '..MSSSSSSM..', '..MMsSSsMM..'],
    ['....MMMM....', '...MMMMMM...', '..MMMMMMMM..', '..MMMMMMMM..', '..MMMMMMMM..', '..MMMMMMMM..'],
    { ...skin('light'), ...MAIL, W: '#e0d8c4', G: '#c8962e' }),
  // The friar: a brown habit to the feet, the cowl down, a tonsure, a rope belt.
  {
    down: art(['............', '....SSSS....', '...HSSSSH...', '...SESSES...', '...SSSSSS...', '...CsSSsC...', '.CCCBBBBCCC.', '.OBBBBBBBBO.', '.OBBBBBBBBO.',
      '.SBBBBBBBBS.', '..KKKkKKKK..', '..BBBBBkBB..', '..BBBBBkBB..', '.BBBBBBBBBB.', 'bBBBBBBBBBBb', '...FF..FF...'], FRIAR),
    up: art(['............', '....SSSS....', '...HSSSSH...', '...HHHHHH...', '...HHHHHH...', '...CCCCCC...', '.CCCCCCCCCC.', '.OBBCCCCBBO.', '.OBBBCCBBBO.',
      '.SBBBBBBBBS.', '..KKKKKKKK..', '..BBBBBBBB..', '..BBBBBBBB..', '.BBBBBBBBBB.', 'bBBBBBBBBBBb', '...FF..FF...'], FRIAR),
    h: 16, tall: 0, robe: true, eyes: [3, 4, 7], life: { hem: ['#5a4232', '#3a2a20'] },
  },
  // A red cap over cropped brown hair, a red tabard over the mail.
  cleric(['............', '....RRRR....', '..HRRRRRRH..', '..HSESSESH..', '..HSSSSSSH..', '...sSSSSs...'],
    ['............', '....RRRR....', '..HRRRRRRH..', '..HHHHHHHH..', '..HHHHHHHH..', '...HHHHHH...'],
    { ...skin('fair'), ...MAIL, R: '#5a1414', H: '#5a3a22', W: '#8a2020', G: '#d4a537' }),
];

