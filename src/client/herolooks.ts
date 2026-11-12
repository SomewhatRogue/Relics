/**
 * The five classes' three looks each, drawn as pixel maps (Kyle, 2026-11-05: people, not robots, and
 * each class known by its outline). Heroic proportions (Kyle, 2026-11-12: "tall hero is great, need all
 * other heroes tall"): 18 wide, a head of about 7 rows (more under a hood or hat), a neck, broad shoulders,
 * a body of 24 rows with the feet on the bottom row, every pixel whole. Each look says where it's cut
 * and how high its hands are (lookkit.ts `cut`, `lift`). A letter is a colour from the look's palette;
 * `M` is mail, its two greys in a checker. What moves (capes, cloaks, plumes, hair, hems) is herolife.ts,
 * from each look's `life`. Faces have plain dark eyes: glowing eyes are the goblins' mark.
 * The Mage and the Healer are herolooks2.ts.
 */
import { art, darker, glint, skin, type Cls, type LookDef } from './lookkit';
import { CLERIC, MAGE } from './herolooks2';

export type { Cls, LookDef, Life } from './lookkit';

// The Warrior: a 7-row head, broad pauldrons with gold rivets, mail sleeves, a tabard to the knee, a cape behind.
const W_BODY = [
  '.pPPPPpsSSspPPPPp.', 'pPPkPPPBTTBPPPkPPp', 'pPPPPPpBTTBpPPPPPp', '.ppppMMBTTBMMpppp.', '..MMMMBBTTBBMMMM..',
  '..MmMBBBTTBBBMmM..', '..MmMBbBTTBbBMmM..', '..MmMBbBTTBbBMmM..', '..SSKKKKGGKKKKSS..', '..ssBbBBTTBBbBss..',
  '....BbBBTTBBbB....', '....BbBBTTBBbB....', '....bLLBTTBLLb....', '....LLLbTTbLLL....', '....LLL.TT.LLL....',
  '....LlL....LlL....', '....LAl....lAL....', '....LLl....lLL....', '....LLl....lLL....', '...KKKK....KKKK...',
  '...FFFF....FFFF...', '...FFFF....FFFF...', '..FFFFf....fFFFF..', '..ffff......ffff..',
];
const W_CUT: LookDef['cut'] = { headTo: 7, hip: 19, back: [0, 7, 6, 17], arm: [12, 7, 18, 17] };
/** `neck`: the four pixels at the back of the neck walking away (the helm's guard, hair, or skin). */
const warrior = (head: string[], back: string[], neck: string, pal: Record<string, string>, life: LookDef['life']): LookDef => {
  const p = { A: pal.P, G: '#ecd078', l: darker(pal.L), f: darker(pal.F), ...pal };
  const wb = W_BODY.map((r, i) => (i === 0 ? `.pPPPPp${neck}pPPPPp.` : r.replace(/T/g, 'B').replace(/G/g, 'K').replace(/k/g, 'P')));
  return { down: art([...head, ...W_BODY], p), up: art([...back, ...wb], p), h: 31, tall: 0, eyes: [3, 7, 10], life, cut: W_CUT, lift: 6 };
};

// The Ranger: a peaked hood over a 5-row face, the quiver's fletching over the shoulder, a cloak to the
// knee, a strap across the chest, the short sword's hilt at the belt.
const R_BODY = [
  '.ccCCCBBBBBBCCCcc.', '.cCCCBBBBBBKBCCCc.', '.cCCCBBBBBKBBCCCc.', '.cCCCBBBBKBBBCCCc.', '.cCCCBBBKBBBBCCCc.',
  '.cCCCBBKBBBBBCCCc.', '.cCCCBKBBBBBBCCCc.', '.cCCCBBBBBBBBCCCc.', '.SWWKKKKkkKKKKCCS.', '.cCCBKKBBBBBBBCCc.',
  '.cCCBbBBBBBBbBCCc.', '.cCCbBBBBBBBBbCCc.', '.cCC.LLL..LLL.CCc.', '.cCC.LLL..LLL.CCc.', '.cC..LLL..LLL..Cc.',
  '.c...LlL..LlL...c.', '.....LLL..LLL.....', '.....LLL..LLL.....', '.....LLL..LLL.....', '....KKKK..KKKK....',
  '....FFFF..FFFF....', '....FFFF..FFFF....', '...FFFFF..FFFFF...', '...ffff....ffff...',
];
const R_BACK = [
  '.ccCCCCCCCCQCCCcc.', '.cCCCCCCCCQCCCCCc.', '.cCCCCCCCQCCCCCCc.', '.cCCCCCCQCCCCCCCc.', '.cCCCCCQCCCCCCCCc.',
  '.cCCCCCCCCCCCCCCc.', '.cCCCCCCCCCCCCCCc.', '.cCCCCCCCCCCCCCCc.', '.SCCCCCCCCCCCCCCS.', '.cCCCCCCCCCCCCCCc.',
  '.cCCCCCCCCCCCCCCc.', '.cCCCCCCCCCCCCCCc.', ...R_BODY.slice(12),
];
const R_HOOD = ['........CC........', '.......CCCC....q..', '......CCCCCC..qq..', '.....CCCCCCCC.qq..'];
const R_HOOD_BACK = [
  '........CC........', '.......CCCC.......', '......CCCCCC...qq.', '.....CCCCCCCC..qq.', '....CCCCCCCCCCqq..',
  '....CCCCCCCCCCq...', '....CCCCCCCCCC....', '....cCCCCCCCCc....', '.....cCCCCCCc.....',
];
const ranger = (face: string[], pal: Record<string, string>, life: LookDef['life']): LookDef => {
  const p = { l: darker(pal.L), f: darker(pal.F), ...pal };
  return {
    down: art([...R_HOOD, ...face, ...R_BODY], p), up: art([...R_HOOD_BACK, ...R_BACK], p), h: 33, tall: 2, eyes: [5, 7, 10], life,
    cut: { headTo: 9, hip: 21, back: [0, 9, 6, 19], arm: [12, 9, 18, 19] }, lift: 6,
  };
};

// The Rogue (Kyle, 2026-11-06: "more like an assassin or a ninja"): a deep peaked hood, a wrap over the
// nose and mouth with the eyes between (a pale glint `G` beside each), its tail over the shoulder, a slim
// jerkin crossed by a strap, a pouch at the belt, and a long cloak that flares toward the hem, its dark
// lining round the legs. Its skirts, sway and flare are cloaklife.ts (`mantle`).
const G_HEAD = [
  '........CC........', '.......cCCc.......', '......cCHCCc......', '.....cCHCCCCc.....', '.....CCOOOOCC.....',
  '.....COEGSEGC.....', '.....CKKKKKKC.....', '.....cCKKKKCcK....', '......cCkkCcKK....',
];
const G_BODY = [
  '...ccCCCCCCCCccK..', '..cCCCbBBBBbCCCck.', '..CCCbBBTBBBbCCC..', '..CCcbBBBTBBbcCC..', '..CCcbBBBBTBbcCC..',
  '..CCcbBBBBBTbcCC..', '..CCcbBBBBBBTcCC..', '..CSSbBBBBBBbSSC..', '..CccTTtTTTTTccC..', '..CccbBkkBBBbccC..',
  '.CCccLLL..LLLccCC.', '.CCccLLL..LLLccCC.', '.CCccLLL..LLLccCC.', '.CCccLlL..LlLccCC.', 'CCCccLLL..LLLccCCC',
  'CCCccLLL..LLLccCCC', 'cCCccLLL..LLLccCCc', 'cccccLlL..LlLccccc', '.....LLL..LLL.....', '.....FFF..FFF.....',
  '.....FfF..FfF.....', '....FFfF..FfFF....', '....FFFf..fFFF....', '....ffff..ffff....',
];
const G_BACK = [
  '........CC........', '.......cCCc.......', '......cCHCCc......', '.....cCHCCCCc.....', '.....CCCCCCCC.....',
  '.....CCCCCCCC.....', '.....CCCCCCCC.....', '.....cCCCCCCcK....', '......cCCCCcKK....',
  ...G_BODY.map((r, i) => (i < 10 ? r.replace(/[BbTtk]/g, 'C').replace(/^(.{8})C/, '$1c') : r)),
];
/** A Rogue look from its colours: hood and cloak (C, c), the hood's dark (O), the wrap (K, k), leathers (B, b),
 *  strap and belt (T), buckle (t), legs (L, l), soft boots (F, f). */
const rogue = (sk: Parameters<typeof skin>[0], pal: Record<string, string>): LookDef => {
  const p: Record<string, string> = { ...skin(sk), H: glint(pal.C), ...pal };
  p.G = glint(p.S);
  return {
    down: art([...G_HEAD, ...G_BODY], p), up: art(G_BACK, p), h: 33, tall: 0, eyes: [5, 7, 10], life: { mantle: [p.C, p.c] },
    cut: { headTo: 9, hip: 19, back: [0, 9, 6, 17], arm: [12, 9, 18, 17] }, lift: 7,
  };
};

export const LOOK_DEFS: Record<Cls, LookDef[]> = {
  WARRIOR: [
    // The knight: an open-faced helm with a red plume, blue and gold, a red cape.
    warrior(['......hAAAAa......', '.....hAAAAAAa.....', '.....AAAAAAAa.....', '.....ASEAAESa.....', '.....ASSAASSa.....', '.....aASssSAa.....', '......aSSSSa......'],
      ['......hAAAAa......', '.....hAAAAAAa.....', '.....AAAAAAAa.....', '.....AAAAAAAa.....', '.....AAAAAAAa.....', '.....aAAAAAAa.....', '......aAAAAa......'], 'aAAa',
      { ...skin('fair'), A: '#b4bcc6', a: '#6a727c', h: '#dce2ea', P: '#a8b0ba', p: '#6a727c', B: '#2f5d9b', b: '#24487a', T: '#d4a537', M: '#8a929c', m: '#666e78', K: '#5a3d22', k: '#d4a537', L: '#3a3f4a', F: '#2a2420' },
      { cape: ['#9a2420', '#5a1414'], plume: '#c0392b' }),
    // The sellsword: bare-headed, cropped black hair and a beard, dented steel over old leather, a brown rag of a cape.
    warrior(['......hHHHHh......', '.....HHHHHHHH.....', '.....HhSSSShH.....', '.....HSESSESH.....', '.....HSSSsSSH.....', '.....HHSssSHH.....', '......HHHHHH......'],
      ['......hHHHHh......', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....sHHHHHHs.....', '......ssssss......'], 'sSSs',
      { ...skin('tan'), H: '#2a201c', h: '#1a1412', P: '#7a7e84', p: '#4a4e54', B: '#5a4030', b: '#3a2a20', T: '#3e2c20', M: '#6a6e74', m: '#4e5258', K: '#2a1e16', k: '#9a9a9a', L: '#4a3a2e', F: '#241c16' },
      { cape: ['#5a4432', '#36281c'], ragged: true }),
    // Blackiron: long pale hair over blackened plate, a scar, dull brass, a cape the colour of old blood.
    warrior(['......hHHHHh......', '.....HHHHHHHH.....', '....HHhhSShhHH....', '....HSSESSESSH....', '....HSSSSSSrSH....', '....HHsSssSsHH....', '....HHHsSSsHHH....'],
      ['......hHHHHh......', '.....HHHHHHHH.....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....'], 'HHHH',
      { ...skin('fair'), S: '#f0d0b0', H: '#d8d0b4', h: '#a8a088', r: '#b8706a', P: '#3e3e48', p: '#26262e', B: '#2a2a32', b: '#1e1e24', T: '#8a6a3a', M: '#3e3e48', m: '#2a2a30', K: '#3a2a1a', k: '#8a6a3a', L: '#2a2a30', F: '#1a1a1e' },
      { cape: ['#5a1818', '#2e0c0c'], hair: '#d8d0b4' }),
  ],
  RANGER: [
    // Green hood and cloak, an auburn fringe under it, the quiver's grey goose feathers.
    ranger(['....CCHHHHHHCCQ...', '....CSSESSESSCQ...', '....CSsSSSSsSCQ...', '....CCsSssSsCCQ...', '.....CCCSSCCCQ....'],
      { ...skin('light'), H: '#8a3e1e', C: '#3f6b3a', c: '#2a4a28', B: '#6b4a2b', b: '#5a3d22', K: '#4a3420', k: '#9aa3ad', Q: '#5a3d22', q: '#d8d0bc', W: '#9aa3ad', L: '#3a3a2a', F: '#2a2420' },
      { cloak: ['#3f6b3a', '#2a4a28'] }),
    // A trapper: brown hood with a fur edge, deep brown skin, a black beard.
    ranger(['....CCccccccCCQ...', '....CcSESSEScCQ...', '....CHSSSSSSHCQ...', '....CCHSssSHCCQ...', '.....CCHHHHCCQ....'],
      { ...skin('deep'), H: '#141012', C: '#6b4a2b', c: '#9a8a70', B: '#8a7a5a', b: '#6a5a40', K: '#3a2a1a', k: '#9aa3ad', Q: '#4a3420', q: '#b03a2a', W: '#8a8a90', L: '#3a2e24', F: '#241c16' },
      { cloak: ['#6b4a2b', '#4a3420'] }),
    // A hill warden: grey-blue hood and cloak, pale, a fair fringe, white fletching.
    ranger(['....CCHHHHHHCCQ...', '....CSSESSESSCQ...', '....CSsSSSSsSCQ...', '....CCsSssSsCCQ...', '.....CCCSSCCCQ....'],
      { ...skin('fair'), H: '#c8a868', C: '#4a5a6a', c: '#323e4a', B: '#5a5048', b: '#443c36', K: '#2a2420', k: '#9aa3ad', Q: '#3a3028', q: '#eeeae0', W: '#c0c8d0', L: '#3a3e46', F: '#2a2420' },
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
