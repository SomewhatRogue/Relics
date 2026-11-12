/**
 * The five classes' three looks each, drawn as pixel maps (Kyle, 2026-11-05: people, not robots, and
 * each class known by its outline). Redrawn at 1.5x for the art pass (2026-11-11): 18 wide, 24 tall
 * with the feet on the bottom row, every pixel whole. A letter is a colour from the look's palette; `M`
 * is mail, its two greys in a checker. Hats and hoods add rows on top (`tall`). What moves (capes,
 * cloaks, scarves, plumes, hair, hems) is herolife.ts, from each look's `life`. Faces have plain dark
 * eyes: glowing eyes are the goblins' mark (and the eye dial's, heroeyes.ts).
 */
import { art, glint, skin, type Cls, type LookDef } from './lookkit';
import { CLERIC, MAGE } from './herolooks2';

export type { Cls, LookDef, Life } from './lookkit';

// The Warrior: broad, pauldrons wider than anyone, a tabard, a cape behind (herolife.ts).
const W_BODY = [
  'pPPPpBBBTTBBBpPPPp', 'PkPPpBBBTTBBBpPPkP', '.PPppBBBTTBBBppPP.', '.MMMBBBBTTBBBBMMM.', '.MMMBbBBTTBBbBMMM.',
  '.SSMBbBBTTBBbBMSS.', '...KbbKKkkKKKKK...', '...BBbBBTTBBbBB...', '...bLLLbTTbLLLb...', '....LLL.TT.LLL....',
  '....LkL....LkL....', '....LLL....LLL....', '...KKKK....KKKK...', '...FFFF....FFFF...', '..FFFFF....FFFFF..',
];
const W_BACK = [
  'pPPPpBBBBBBBBpPPPp', 'PkPPpBBBBBBBBpPPkP', '.PPppBBBBBBBBppPP.', '.MMMBBBBBBBBBBMMM.', '.MMMBBbBBBBbBBMMM.',
  '.SSMBBbBBBBbBBMSS.', '...KKKKKKKKKKKK...', '...BBBbBBBBbBBB...', '...bLLLbBBbLLLb...', '....LLL.BB.LLL....',
  '....LLL....LLL....', '....LLL....LLL....', '...KKKK....KKKK...', '...FFFF....FFFF...', '..FFFFF....FFFFF..',
];
const warrior = (head: string[], back: string[], pal: Record<string, string>, life: LookDef['life']): LookDef => ({
  down: art([...head, ...W_BODY], pal), up: art([...back, ...W_BACK], pal), h: 24, tall: 0, eyes: [5, 7, 10], life,
});

// The Ranger: a peaked hood and a cloak, the quiver's fletching over the shoulder, a short sword's hilt at the hip.
const R_LEGS = [
  '.cCC.LLL..LLL.CCc.', '.cCC.LLL..LLL.CCc.', '.c...LLL..LLL...c.', '.....LLL..LLL.....',
  '.....LLL..LLL.....', '....KKKK..KKKK....', '....FFFF..FFFF....', '...FFFFF..FFFFF...',
];
const R_BODY = [
  '.ccCCCBBBBBBCCCcc.', '.cCCCBBBBBBKBCCCc.', '.cCCCBBBBBKBBCCCc.', '.SCCCBBBBkBBBCCCS.', '.cCCCBBBKBBBBCCCc.',
  '.cWWKKKKkkKKKKCCc.', '.cCCBKKBBBBBBBCCc.', ...R_LEGS,
];
const R_BACK = [
  '.ccCCCCCCCCQCCCcc.', '.cCCCCCCCCQCCCCCc.', '.cCCCCCCCQCCCCCCc.', '.SCCCCCCQCCCCCCCS.', '.cCCCCCQCCCCCCCCc.',
  '.cCCCCCCCCCCCCCCc.', '.cCCCCCCCCCCCCCCc.', ...R_LEGS,
];
const R_HOOD = ['........CC........', '.......CCCC.......', '......CCCCCC..q...', '.....CCCCCCCC.qq..', '....CCCCCCCCCCqq..'];
const R_HOOD_BACK = [
  '........CC........', '.......CCCC.......', '......CCCCCC......', '.....CCCCCCCC..qq.', '....CCCCCCCCCCqq..',
  '....CCCCCCCCCCq...', '....CCCCCCCCCC....', '....CCCCCCCCCC....', '....CCCCCCCCCC....', '....CCCCCCCCCC....', '....cCCCCCCCCc....',
];
const ranger = (face: string[], pal: Record<string, string>, life: LookDef['life']): LookDef => ({
  down: art([...R_HOOD, ...face, ...R_BODY], pal), up: art([...R_HOOD_BACK, ...R_BACK], pal), h: 26, tall: 2, eyes: [7, 7, 10], life,
});

// The Rogue (Kyle, 2026-11-06: "more like an assassin or a ninja"): a deep hood, a wrap over the nose
// and mouth with the eyes showing between (a pale glint `G` beside each, the light they catch), a slim
// jerkin crossed by a strap, a belt, and a long cloak (C, c) that hangs past the knees. The legs are
// straight under the hips and the boots turn a little out, planted like everyone else's. The cloak's
// skirts behind, its sway, its flare on a dash or a SHADOW STEP, and what the kit hangs off the belt are
// cloaklife.ts (`mantle`).
const G_HEAD = [
  '..................', '.......cCCc.......', '.....ccCCCCcc.....', '....cCcCCCCcCc....', '...cCCOOOOOOCCc...',
  '...CCOOOOOOOOCC...', '...CCSSEGSEGSCC...', '...CCKKKKKKKKCC...', '...CCkKKKKKKkCC...',
];
const G_BODY = [
  '.CCCCkkKKKKkkCCCC.', '.CCCbBBTBBBBBbCCC.', '.CCcbBBBtBBBBbcCC.', '.CCcbBBBBTBBBbcCC.', '.CSSbBBBBBTBBbSSC.',
  '.C..TTTtTTTTTT..C.', '.C..bBBBBBBtBb..C.', '.C...LLL..LLL...C.', '.C...LLL..LLL...C.', '.C...LLL..LLL...C.',
  '.C...LLL..LLL...C.', '.c...Lll..llL...c.', '.....FfF..FfF.....', '....FFfF..FfFF....', '...FFFFf..fFFFF...',
];
const G_BACK = [
  '..................', '.......cCCc.......', '.....ccCCCCcc.....', '....cCCCCCCCCc....', '...cCCCCCCCCCCc...',
  '...CCCCCCCCCCCC...', '...CCCCCCCCCCCC...', '...CCCCCCCCCCCC...', '...cCCCCCCCCCCc...',
  '.CCCcCCCCCCCCcCCC.', '.CCCCcCCCCCCcCCCC.', '.CCCCCcCCCCcCCCCC.', '.CCCCCCcCCcCCCCCC.', '.CSSCCCCcCCCCCSSC.',
  '.CCCCCCCcCCCCCCCC.', '.CCCCCCCcCCCCCCCC.', '.CCCCCCCcCCCCCCCC.', '.CCCCCCCcCCCCCCCC.', '.CCCCCCCcCCCCCCCC.',
  '.CCCCCCCcCCCCCCCC.', '..cCCCCCcCCCCCCc..', '.....FFF..FFF.....', '....FFFF..FFFF....', '....FFFf..fFFF....',
];
/** A Rogue look from its colours: hood and cloak (C, c), the hood's dark (O), the wrap (K, k), leathers (B, b),
 *  strap and belt (T), buckle (t), legs (L, l), soft boots (F, f). */
const rogue = (sk: Parameters<typeof skin>[0], pal: Record<string, string>): LookDef => {
  const p: Record<string, string> = { ...skin(sk), ...pal };
  p.G = glint(p.S);
  return { down: art([...G_HEAD, ...G_BODY], p), up: art(G_BACK, p), h: 24, tall: 0, eyes: [6, 7, 10], life: { mantle: [p.C, p.c] } };
};

export const LOOK_DEFS: Record<Cls, LookDef[]> = {
  WARRIOR: [
    // The knight: an open-faced helm with a red plume, blue and gold, a red cape.
    warrior(['.......aAAa.......', '.....aAAAAAAa.....', '....aAAAAAAAAa....', '....aAAAAAAAAa....', '....aASSAASSAa....', '....aASESSESAa....', '....kASSSSSSAk....', '....aAsSssSsAa....', '.....aAsSSsAa.....'],
      ['.......aAAa.......', '.....aAAAAAAa.....', '....aAAAAAAAAa....', '....aAAAAAAAAa....', '....aAAAAAAAAa....', '....aAAAAAAAAa....', '....aAAAAAAAAa....', '....aAAAAAAAAa....', '.....aAAAAAAa.....'],
      { ...skin('fair'), A: '#b4bcc6', a: '#6a727c', P: '#a8b0ba', p: '#6a727c', B: '#2f5d9b', b: '#24487a', T: '#d4a537', M: '#8a929c', m: '#666e78', K: '#5a3d22', k: '#d4a537', L: '#3a3f4a', F: '#2a2420' },
      { cape: ['#9a2420', '#5a1414'], plume: '#c0392b' }),
    // The sellsword: bare-headed, cropped black hair and a beard, dented steel over old leather, a brown rag of a cape.
    warrior(['..................', '......hHHHHh......', '.....hHHHHHHh.....', '.....HHHHHHHH.....', '.....HhhSShhH.....', '.....SSESSESS.....', '.....SSSSsSSS.....', '.....HHSssSHH.....', '......HHHHHH......'],
      ['..................', '......hHHHHh......', '.....hHHHHHHh.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '......ssssss......'],
      { ...skin('tan'), H: '#2a201c', h: '#1a1412', P: '#7a7e84', p: '#4a4e54', B: '#5a4030', b: '#3a2a20', T: '#3e2c20', M: '#6a6e74', m: '#4e5258', K: '#2a1e16', k: '#9a9a9a', L: '#4a3a2e', F: '#241c16' },
      { cape: ['#5a4432', '#36281c'], ragged: true }),
    // Blackiron: long pale hair over blackened plate, a scar, dull brass, a cape the colour of old blood.
    warrior(['.......hHHh.......', '......HHHHHH......', '.....HHHHHHHH.....', '....HHHHHHHHHH....', '....HHhhSShhHH....', '....HSSESSESSH....', '....HSSSSSSrSH....', '....HHsSssSsHH....', '....HHHsSSsHHH....'],
      ['.......hHHh.......', '......HHHHHH......', '.....HHHHHHHH.....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....'],
      { ...skin('fair'), S: '#f0d0b0', H: '#d8d0b4', h: '#a8a088', r: '#b8706a', P: '#3e3e48', p: '#26262e', B: '#2a2a32', b: '#1e1e24', T: '#8a6a3a', M: '#3e3e48', m: '#2a2a30', K: '#3a2a1a', k: '#8a6a3a', L: '#2a2a30', F: '#1a1a1e' },
      { cape: ['#5a1818', '#2e0c0c'], hair: '#d8d0b4' }),
  ],
  RANGER: [
    // Green hood and cloak, an auburn fringe under it, the quiver's grey goose feathers.
    ranger(['....CCHHHHHHCCQ...', '....CHHSSSSHHCQ...', '....CSSESSESSCQ...', '....CSsSSSSsSCQ...', '....CCsSSSSsCCQ...', '.....CCCSSCCCQ....'],
      { ...skin('light'), H: '#8a3e1e', C: '#3f6b3a', c: '#2a4a28', B: '#6b4a2b', K: '#4a3420', k: '#9aa3ad', Q: '#5a3d22', q: '#d8d0bc', W: '#9aa3ad', L: '#3a3a2a', F: '#2a2420' },
      { cloak: ['#3f6b3a', '#2a4a28'] }),
    // A trapper: brown hood with a fur edge, deep brown skin, a black beard.
    ranger(['....CCccccccCCQ...', '....CcSSSSSScCQ...', '....CSSESSESSCQ...', '....CHSSSSSSHCQ...', '....CCHSSSSHCCQ...', '.....CCHHHHCCQ....'],
      { ...skin('deep'), H: '#141012', C: '#6b4a2b', c: '#9a8a70', B: '#8a7a5a', K: '#3a2a1a', k: '#9aa3ad', Q: '#4a3420', q: '#b03a2a', W: '#8a8a90', L: '#3a2e24', F: '#241c16' },
      { cloak: ['#6b4a2b', '#4a3420'] }),
    // A hill warden: grey-blue hood and cloak, pale, a fair fringe, white fletching.
    ranger(['....CCHHHHHHCCQ...', '....CHHSSSSHHCQ...', '....CSSESSESSCQ...', '....CSsSSSSsSCQ...', '....CCsSSSSsCCQ...', '.....CCCSSCCCQ....'],
      { ...skin('fair'), H: '#c8a868', C: '#4a5a6a', c: '#323e4a', B: '#5a5048', K: '#2a2420', k: '#9aa3ad', Q: '#3a3028', q: '#eeeae0', W: '#c0c8d0', L: '#3a3e46', F: '#2a2420' },
      { cloak: ['#4a5a6a', '#323e4a'] }),
  ],
  ROGUE: [
    // The shade: a charcoal hood and cloak, a plum wrap, violet-black leathers.
    rogue('light', { C: '#474258', c: '#2a2634', O: '#120f18', K: '#6e3060', k: '#48203e', B: '#2e2a38', b: '#221e2a', T: '#6a4a2a', t: '#a8b0b8', L: '#3c3848', l: '#2c2836', F: '#5a4636', f: '#3c2e24' }),
    // The cutpurse: a brown hood and cloak, a red wrap, brown leather.
    rogue('tan', { C: '#5e4834', c: '#3a2c20', O: '#160f0a', K: '#a82e1c', k: '#701c12', B: '#4a3426', b: '#34241a', T: '#2a1e16', t: '#c8a050', L: '#4a3c30', l: '#362c22', F: '#6a5238', f: '#463624' }),
    // Night: black from hood to boot and a pale bone mask, dark eyes in deep brown skin.
    rogue('deep', { C: '#26242e', c: '#16151c', O: '#08070b', K: '#d0c8b4', k: '#a8a090', B: '#1c1a22', b: '#141218', T: '#3a3640', t: '#7a8088', L: '#22212a', l: '#18171e', F: '#2a2830', f: '#1a1920' }),
  ],
  MAGE,
  HEALER: CLERIC,
};
