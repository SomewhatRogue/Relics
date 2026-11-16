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
import { SIDE_NO_HEAD, W_SIDE_ARM, W_SIDE_BODY, W_SIDE_HEADS } from './herosides';
import { G_SIDE_ARM, G_SIDE_BODY, G_SIDE_HEAD, R_SIDE_ARM, R_SIDE_BODY, R_SIDE_HEADS } from './herosides2';
import { SHARP } from './charpaint';
import { KNIGHT_BACK, KNIGHT_CAPE, KNIGHT_HEAD, KNIGHT_PAL } from './charmean';

export type { Cls, LookDef, Life } from './lookkit';

// The Warrior: a 7-row head, broad pauldrons with gold rivets, mail sleeves, a tabard to the knee, a cape behind.
const W_BODY = [
  '.pPPPPpsSSspPPPPp.', 'pPPkPPPBTTBPPPkPPp', 'pPPPPPpBTTBpPPPPPp', '.ppppMMBTTBMMpppp.', '..MMMMBBTTBBMMMM..',
  '..MmMBBBTTBBBMmM..', '..MmMBbBTTBbBMmM..', '..MmMBbBTTBbBMmM..', '..SSKKKKGGKKKKSS..', '..ssBbBBTTBBbBss..',
  '....BbBBTTBBbB....', '....BbBBTTBBbB....', '....bLLBTTBLLb....', '....LLLbTTbLLL....', '....LLL.TT.LLL....',
  '....LlL....LlL....', '....LAl....lAL....', '....LLl....lLL....', '....LLl....lLL....', '...KKKK....KKKK...',
  '...FFFF....FFFF...', '...FFFF....FFFF...', '..FFFFf....fFFFF..', '..ffff......ffff..',
];
// (The legs cut below the tabard's tip, so it stays whole while they walk: Kyle 2026-11-12, "cloaks look different
// top and bottom".)
const W_CUT: LookDef['cut'] = { headTo: 7, hip: 22, back: [0, 7, 6, 17], arm: [12, 7, 18, 17] };
/** `neck`: the four pixels at the back of the neck walking away (the helm's guard, hair, or skin). */
/** `look`: which of the three, for its head in profile (herosides.ts). */
const warrior = (head: string[], back: string[], neck: string, pal: Record<string, string>, life: LookDef['life'], look: number): LookDef => {
  const p = { A: pal.P, G: '#ecd078', l: darker(pal.L), f: darker(pal.F), ...pal };
  const wb = W_BODY.map((r, i) => (i === 0 ? `.pPPPPp${neck}pPPPPp.` : r.replace(/T/g, 'B').replace(/G/g, 'K').replace(/k/g, 'P')));
  const side = { body: art([...W_SIDE_HEADS[look], ...W_SIDE_BODY], p), arm: art([...SIDE_NO_HEAD, ...W_SIDE_ARM], p), eyes: [3, 11, 11] as [number, number, number] };
  return { down: art([...head, ...W_BODY], p), up: art([...back, ...wb], p), h: 31, tall: 0, eyes: [3, 7, 10], life, cut: W_CUT, lift: 6, side };
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
// (`_life` was the fluttering cloak drawn behind; its outline stuck out as a notch beside the cloak's own, so its own
// lower half sways with the walk instead: the cut's `skirt`. Kyle, 2026-11-12.)
const ranger = (face: string[], pal: Record<string, string>, _life: LookDef['life'], look: number): LookDef => {
  const p = { l: darker(pal.L), f: darker(pal.F), ...pal };
  return {
    side: { body: art([...R_SIDE_HEADS[look], ...R_SIDE_BODY], p), arm: art(R_SIDE_ARM, p), eyes: [5, 11, 11] },
    down: art([...R_HOOD, ...face, ...R_BODY], p), up: art([...R_HOOD_BACK, ...R_BACK], p), h: 33, tall: 2, eyes: [5, 7, 10], life: {},
    // (The legs cut below the cloak's hem, so it stays whole as they walk.)
    cut: { headTo: 9, hip: 25, back: [0, 9, 6, 19], arm: [12, 9, 18, 19], skirt: 20 }, lift: 6,
  };
};

// The Rogue (Kyle, 2026-11-06: "more like an assassin or a ninja"): a deep peaked hood, a wrap over the
// nose and mouth with the eyes between (a pale glint `G` beside each), its tail over the shoulder, a slim
// jerkin crossed by a strap, a pouch at the belt, and a long cloak that flares toward the hem, its dark
// lining round the legs. Its lower half sways with the walk (the cut's `skirt`, figure.ts).
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
  // Dark and gold (docs/design/dark-gold.md): the face lost in the hood's dark but for two glints, the hands gloved.
  Object.assign(p, { S: p.O, s: p.O, G: '#c8ccd8' });
  return {
    // (One cloak: its own lower half sways from the waist with the walk, `skirt`; the separate swaying mantle behind it
    // is gone, its outline read as the cloak cut in two. The legs cut below the hem; only the boots step under it.)
    down: art([...G_HEAD, ...G_BODY], p), up: art(G_BACK, p), h: 33, tall: 0, eyes: [5, 7, 10], life: {},
    side: { body: art([...G_SIDE_HEAD, ...G_SIDE_BODY], p), arm: art(G_SIDE_ARM, p), eyes: [5, 11, 11] },
    cut: { headTo: 9, hip: 27, back: [0, 9, 6, 17], arm: [12, 9, 18, 17], skirt: 19 }, lift: 7,
  };
};

export const LOOK_DEFS: Record<Cls, LookDef[]> = {
  WARRIOR: [
    // The knight: an open-faced helm with a red plume, blue and gold, a red cape.
    // (Under ?sharp, the concepts' knight: a closed great helm, blackened plate, no plume: charmean.ts.)
    SHARP ? warrior(KNIGHT_HEAD, KNIGHT_BACK, 'aAAa', { ...skin('fair'), ...KNIGHT_PAL }, { cape: KNIGHT_CAPE }, 0) :
    warrior(['......hAAAAa......', '.....hAAAAAAa.....', '.....AAAAAAAa.....', '.....ASEAAESa.....', '.....ASSAASSa.....', '.....aASssSAa.....', '......aSSSSa......'],
      ['......hAAAAa......', '.....hAAAAAAa.....', '.....AAAAAAAa.....', '.....AAAAAAAa.....', '.....AAAAAAAa.....', '.....aAAAAAAa.....', '......aAAAAa......'], 'aAAa',
      { ...skin('fair'), A: '#5e6670', a: '#363c46', h: '#8a929e', P: '#4e5660', p: '#c8962e', B: '#1c2638', b: '#141c2a', T: '#d4a537', M: '#4a5058', m: '#343a42', K: '#241a14', k: '#d4a537', L: '#262a32', F: '#18141a' },
      { cape: ['#5a1416', '#2e0a0c'], plume: '#7a1a1c' }, 0),
    // The sellsword: bare-headed, cropped black hair and a beard, dented steel over old leather, a brown rag of a cape.
    warrior(['......hHHHHh......', '.....HHHHHHHH.....', '.....HhSSSShH.....', '.....HSESSESH.....', '.....HSSSsSSH.....', '.....HHSssSHH.....', '......HHHHHH......'],
      ['......hHHHHh......', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....HHHHHHHH.....', '.....sHHHHHHs.....', '......ssssss......'], 'sSSs',
      { ...skin('tan'), H: '#2a201c', h: '#1a1412', P: '#4e5258', p: '#2e3238', B: '#3a2a20', b: '#261c16', T: '#2a1e16', M: '#46494e', m: '#323538', K: '#1e1610', k: '#b8923a', L: '#2e2620', F: '#1a1410' },
      { cape: ['#3a2c20', '#221a12'], ragged: true }, 1),
    // Blackiron: long pale hair over blackened plate, a scar, dull brass, a cape the colour of old blood.
    warrior(['......hHHHHh......', '.....HHHHHHHH.....', '....HHhhSShhHH....', '....HSSESSESSH....', '....HSSSSSSrSH....', '....HHsSssSsHH....', '....HHHsSSsHHH....'],
      ['......hHHHHh......', '.....HHHHHHHH.....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....', '....HHHHHHHHHH....'], 'HHHH',
      { ...skin('fair'), S: '#f0d0b0', H: '#d8d0b4', h: '#a8a088', r: '#b8706a', P: '#30303a', p: '#b8862e', B: '#1e1e26', b: '#16161c', T: '#c8962e', M: '#30303a', m: '#222228', K: '#1e1610', k: '#c8962e', L: '#202026', F: '#141418' },
      { cape: ['#4a1214', '#26080a'], hair: '#d8d0b4' }, 2),
  ],
  RANGER: [
    // Green hood and cloak, an auburn fringe under it, the quiver's grey goose feathers.
    ranger(['....CCHHHHHHCCQ...', '....CSSESSESSCQ...', '....CSsSSSSsSCQ...', '....CCsSssSsCCQ...', '.....CCCSSCCCQ....'],
      { ...skin('light'), H: '#8a3e1e', C: '#264a42', c: '#18302c', B: '#3a2a1e', b: '#2a1e16', K: '#7a5e2a', k: '#d4a537', Q: '#2a1e16', q: '#d8d0bc', W: '#d4a537', L: '#2a2c26', F: '#1a1614' },
      { cloak: ['#264a42', '#18302c'] }, 0),
    // A trapper: brown hood with a fur edge, deep brown skin, a black beard.
    ranger(['....CCccccccCCQ...', '....CcSESSEScCQ...', '....CHSSSSSSHCQ...', '....CCHSssSHCCQ...', '.....CCHHHHCCQ....'],
      { ...skin('deep'), H: '#141012', C: '#3e2c1e', c: '#7a6c56', B: '#4a3e2e', b: '#362c20', K: '#241a12', k: '#c8962e', Q: '#2a1e14', q: '#8a2a22', W: '#c8962e', L: '#2a221a', F: '#18120e' },
      { cloak: ['#3e2c1e', '#2a1e14'] }, 1),
    // A hill warden: grey-blue hood and cloak, pale, a fair fringe, white fletching.
    ranger(['....CCHHHHHHCCQ...', '....CSSESSESSCQ...', '....CSsSSSSsSCQ...', '....CCsSssSsCCQ...', '.....CCCSSCCCQ....'],
      { ...skin('fair'), H: '#c8a868', C: '#2e3a46', c: '#1e2630', B: '#3a3632', b: '#2a2622', K: '#7a5e2a', k: '#d4a537', Q: '#221e1a', q: '#eeeae0', W: '#d4a537', L: '#262a30', F: '#18161a' },
      { cloak: ['#2e3a46', '#1e2630'] }, 2),
  ],
  ROGUE: [
    // The shade: a charcoal hood and cloak, a plum wrap, violet-black leathers.
    rogue('light', { C: '#2e2c38', c: '#1c1a24', O: '#0c0a10', K: '#1e1a24', k: '#141118', B: '#22202a', b: '#18161e', T: '#c8962e', t: '#e0c070', L: '#26242e', l: '#1c1a22', F: '#2a2420', f: '#1c1814' }),
    // The cutpurse: a brown hood and cloak, a red wrap, brown leather.
    rogue('tan', { C: '#3a2c22', c: '#261c16', O: '#0e0a08', K: '#4a1814', k: '#30100c', B: '#2e2219', b: '#221811', T: '#221812', t: '#c8962e', L: '#2e261e', l: '#221c16', F: '#3a2c20', f: '#261c14' }),
    // Night: black from hood to boot and a pale bone mask, dark eyes in deep brown skin.
    rogue('deep', { C: '#1c1a22', c: '#121116', O: '#060508', K: '#16151a', k: '#0e0d12', B: '#16151a', b: '#0f0e12', T: '#8a6a2a', t: '#d4a537', L: '#1a1920', l: '#121116', F: '#1e1c24', f: '#141318' }),
  ],
  MAGE,
  HEALER: CLERIC,
};
