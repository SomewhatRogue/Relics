/**
 * The five classes' three looks each, drawn as pixel maps (Kyle, 2026-11-05: people, not robots, and
 * each class known by its outline). A letter is a colour from the look's palette; `M` is mail, its
 * two greys in a checker. The sprite is 12 wide with the feet on the bottom row; hats and hoods add
 * rows on top (`tall`). What moves (capes, cloaks, scarves, plumes, hair, hems) is herolife.ts, from
 * each look's `life`. Faces have plain dark eyes: glowing eyes are the goblins' mark (and the eye
 * dial's, heroeyes.ts).
 */
import { art, skin, type Cls, type LookDef } from './lookkit';
import { CLERIC, MAGE } from './herolooks2';

export type { Cls, LookDef, Life } from './lookkit';

// The Warrior: broad, pauldrons wider than anyone, a tabard, a cape behind (herolife.ts).
const W_BODY = [
  'PPpBBTTBBpPP', 'PPpBBTTBBpPP', '.MMBBTTBBMM.', '.SMBBTTBBMS.', '..KKKkkKKK..',
  '..BBBTTBBB..', '..bLL..LLb..', '...LL..LL...', '...LL..LL...', '..FFF..FFF..',
];
const W_BACK = [
  'PPpBBBBBBpPP', 'PPpBBBBBBpPP', '.MMBBBBBBMM.', '.SMBBBBBBMS.', '..KKKKKKKK..',
  '..BBBBBBBB..', '..bLL..LLb..', '...LL..LL...', '...LL..LL...', '..FFF..FFF..',
];
const warrior = (head: string[], back: string[], pal: Record<string, string>, life: LookDef['life']): LookDef => ({
  down: art([...head, ...W_BODY], pal), up: art([...back, ...W_BACK], pal), h: 16, tall: 0, eyes: [3, 4, 7], life,
});

// The Ranger: a peaked hood and a cloak, the quiver's fletching over the shoulder, a short sword's hilt at the hip.
const R_BODY = [
  '.cCCBBBBCCc.', '.cCBBBBKBCc.', '.SCBBBKBBCS.', '.cCBBKBBBCc.', '.cWKKkKKKCc.',
  '.cCLL..LLCc.', '.c.LL..LL.c.', '...LL..LL...', '...LL..LL...', '..FFF..FFF..',
];
const R_BACK = [
  '.cCCCCCCQCc.', '.cCCCCCQCCc.', '.SCCCCQCCCS.', '.cCCCQCCCCc.', '.cCCCCCCCCc.',
  '.cCLL..LLCc.', '.c.LL..LL.c.', '...LL..LL...', '...LL..LL...', '..FFF..FFF..',
];
const R_HOOD_BACK = ['.....CC.....', '....CCCC....', '...CCCCCC.qq', '..CCCCCCCCq.', '..CCCCCCCC..', '..CCCCCCCC..', '..cCCCCCCc..'];
const ranger = (face: string[], pal: Record<string, string>, life: LookDef['life']): LookDef => ({
  down: art(['.....CC.....', '....CCCC.q..', '...CCCCCCqq.', ...face, ...R_BODY], pal), up: art([...R_HOOD_BACK, ...R_BACK], pal), h: 17, tall: 1, eyes: [4, 4, 7], life,
});

// The Rogue: crouched low, legs wide, a scarf up over the nose with the eyes showing, a sash, knives at the hips.
const G_BODY = [
  '..bBRRRRBb..', '.bBBBRRBBBb.', '.SbBBBBBBbS.', '..bBBBBBBb..', '.WRRRRRRRRW.',
  '..LLL..LLL..', '..LL....LL..', '.LL......LL.', '.LL......LL.', '.FF......FF.',
];
const G_BACK = [
  '..bBRRRRBb..', '.bBBBBBBBBb.', '.SbBBBBBBbS.', '..bBBBBBBb..', '.WRRRRRRRRW.',
  '..LLL..LLL..', '..LL....LL..', '.LL......LL.', '.LL......LL.', '.FF......FF.',
];
const rogue = (head: string[], back: string[], pal: Record<string, string>, life: LookDef['life']): LookDef => ({
  down: art(['............', '............', ...head, ...G_BODY], pal), up: art(['............', '............', ...back, ...G_BACK], pal), h: 16, tall: 0, eyes: [4, 4, 7], life,
});

export const LOOK_DEFS: Record<Cls, LookDef[]> = {
  WARRIOR: [
    // The knight: an open-faced helm with a red plume, blue and gold, a red cape.
    warrior(['....aAAa....', '...aAAAAa...', '..aAAAAAAa..', '..aSESSESa..', '..aSSSSSSa..', '...asSSsa...'],
      ['....aAAa....', '...aAAAAa...', '..aAAAAAAa..', '..aAAAAAAa..', '..aAAAAAAa..', '...aAAAAa...'],
      { ...skin('fair'), A: '#b4bcc6', a: '#6a727c', P: '#a8b0ba', p: '#6a727c', B: '#2f5d9b', b: '#24487a', T: '#d4a537', M: '#8a929c', m: '#666e78', K: '#5a3d22', k: '#d4a537', L: '#3a3f4a', F: '#2a2420' },
      { cape: ['#9a2420', '#5a1414'], plume: '#c0392b' }),
    // The sellsword: bare-headed, cropped black hair and a beard, dented steel over old leather, a brown rag of a cape.
    warrior(['............', '....hHHh....', '...hHHHHh...', '...SESSES...', '...HSSSSH...', '....HHHH....'],
      ['............', '....hHHh....', '...hHHHHh...', '...HHHHHH...', '...HHHHHH...', '....ssss....'],
      { ...skin('tan'), H: '#2a201c', h: '#1a1412', P: '#7a7e84', p: '#4a4e54', B: '#5a4030', b: '#3a2a20', T: '#3e2c20', M: '#6a6e74', m: '#4e5258', K: '#2a1e16', k: '#9a9a9a', L: '#4a3a2e', F: '#241c16' },
      { cape: ['#5a4432', '#36281c'], ragged: true }),
    // Blackiron: long pale hair over blackened plate, a scar, dull brass, a cape the colour of old blood.
    warrior(['....hHHh....', '...HHHHHH...', '..HHHHHHHH..', '..HSESSESH..', '..HSSSSrSH..', '..HHsSSsHH..'],
      ['....hHHh....', '...HHHHHH...', '..HHHHHHHH..', '..HHHHHHHH..', '..HHHHHHHH..', '..HHHHHHHH..'],
      { ...skin('fair'), S: '#f0d0b0', H: '#d8d0b4', h: '#a8a088', r: '#b8706a', P: '#3e3e48', p: '#26262e', B: '#2a2a32', b: '#1e1e24', T: '#8a6a3a', M: '#3e3e48', m: '#2a2a30', K: '#3a2a1a', k: '#8a6a3a', L: '#2a2a30', F: '#1a1a1e' },
      { cape: ['#5a1818', '#2e0c0c'], hair: '#d8d0b4' }),
  ],
  RANGER: [
    // Green hood and cloak, an auburn fringe under it, the quiver's grey goose feathers.
    ranger(['..CHHHHHHCQ.', '..CSESSESCQ.', '..CSSSSSSCQ.', '..CCsSSsCC..'],
      { ...skin('light'), H: '#8a3e1e', C: '#3f6b3a', c: '#2a4a28', B: '#6b4a2b', K: '#4a3420', k: '#9aa3ad', Q: '#5a3d22', q: '#d8d0bc', W: '#9aa3ad', L: '#3a3a2a', F: '#2a2420' },
      { cloak: ['#3f6b3a', '#2a4a28'] }),
    // A trapper: brown hood with a fur edge, deep brown skin, a black beard.
    ranger(['..CccccccCQ.', '..CSESSESCQ.', '..CHSSSSHCQ.', '..CCHHHHCC..'],
      { ...skin('deep'), H: '#141012', C: '#6b4a2b', c: '#9a8a70', B: '#8a7a5a', K: '#3a2a1a', k: '#9aa3ad', Q: '#4a3420', q: '#b03a2a', W: '#8a8a90', L: '#3a2e24', F: '#241c16' },
      { cloak: ['#6b4a2b', '#4a3420'] }),
    // A hill warden: grey-blue hood and cloak, pale, a fair fringe, white fletching.
    ranger(['..CHHHHHHCQ.', '..CSESSESCQ.', '..CSSSSSSCQ.', '..CCsSSsCC..'],
      { ...skin('fair'), H: '#c8a868', C: '#4a5a6a', c: '#323e4a', B: '#5a5048', K: '#2a2420', k: '#9aa3ad', Q: '#3a3028', q: '#eeeae0', W: '#c0c8d0', L: '#3a3e46', F: '#2a2420' },
      { cloak: ['#4a5a6a', '#323e4a'] }),
  ],
  ROGUE: [
    // Black hair, a dark scarf over the nose and a plum sash, violet-black leathers.
    rogue(['....HHHH....', '...HHHHHHh..', '...SESSES...', '...RRRRRR...'], ['....HHHH....', '...HHHHHHh..', '...HHHHHH...', '...RRRRRR...'],
      { ...skin('light'), H: '#1e1a20', h: '#1e1a20', R: '#5a2a4a', B: '#3a3346', b: '#24202c', W: '#a8b0b8', L: '#2a2630', F: '#1a161c' },
      { scarf: ['#5a2a4a', '#3a1a30'] }),
    // The cutpurse: a red scarf, brown leather, a shock of brown hair.
    rogue(['...hHHHh....', '..hHHHHHHh..', '...SESSES...', '...RRRRRR...'], ['...hHHHh....', '..hHHHHHHh..', '...HHHHHH...', '...RRRRRR...'],
      { ...skin('tan'), H: '#6a4220', h: '#4a2c14', R: '#9a2a1a', B: '#5a4030', b: '#3a2a20', W: '#9aa3ad', L: '#3a3028', F: '#241c16' },
      { scarf: ['#9a2a1a', '#6a1a10'] }),
    // Night: black from hood to boot and a pale bone mask, dark eyes in deep brown skin.
    rogue(['....HHHH....', '...HHHHHH...', '...HESSEH...', '...RRRRRR...'], ['....HHHH....', '...HHHHHH...', '...HHHHHH...', '...HHHHHH...'],
      { ...skin('deep'), H: '#1a1820', h: '#1a1820', R: '#d0c8b4', B: '#1e1c24', b: '#141218', W: '#6a7078', L: '#1a1a20', F: '#0d0b10' },
      { scarf: ['#2a2830', '#1a1820'] }),
  ],
  MAGE,
  HEALER: CLERIC,
};
