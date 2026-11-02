/**
 * The fifteen hero looks at twice the detail: each one a body (bodies.ts), a palette, and a few
 * details laid over it (a plume, somebody else's blood, a scarf, the Lantern on a breast). The same
 * looks as the small sprites in sprites.ts `LOOKS`, in the same order.
 */
import { COWL, HAT, HOOD, MAGE, PLATE, type Body } from './bodies';
import type { Pal } from './grid';

export interface HdLook { body: Body; pal: Pal; glow?: string; down?: Record<number, string>; up?: Record<number, string> }

/** A detail centred on a 24 wide row. */
const mid = (s: string) => s.padStart(12 + Math.ceil(s.length / 2), '.').padEnd(24, '.');
/** The Lantern in gold on the breast (it glows a little in the dark). */
const LANTERN = { 14: mid('JJ'), 15: mid('JJJJ'), 16: mid('JJJJ'), 17: mid('JJ') };
const LEGS: Pal = { L: '#3a3f4a', l: '#2a2e36', K: '#2a2420' };
const FACE: Pal = { o: '#141218' };

export const HD_LOOKS: Record<'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER', HdLook[]> = {
  WARRIOR: [
    // The knight: steel, a blue tabard with a gold stripe, a red plume and cape.
    { body: PLATE, pal: { ...LEGS, ...FACE, H: '#9aa3ad', h: '#6a7078', i: '#dfe6ec', e: '#bfe0ff', P: '#c0392b', T: '#2f5d9b', t: '#244a7c', j: '#d4a537', A: '#9aa3ad', a: '#6a7078', g: '#5a5e64', B: '#5a3d22', k: '#d4a537', C: '#7a1d1d', c: '#5a1414' } },
    // The sellsword: dented steel, old leather, a rag of red.
    {
      body: PLATE,
      pal: { ...FACE, H: '#7a7f86', h: '#5a5e64', i: '#9aa3ad', e: '#bfe0ff', T: '#5a4030', t: '#4a3428', j: '#6a6e74', A: '#6a6e74', a: '#4a4e56', g: '#4a3428', B: '#2a1e16', k: '#6a6e74', L: '#4a3a2e', l: '#3a2e24', K: '#241c16', C: '#3a2a22', c: '#2a1e16', x: '#7a1d1d', y: '#5a1414' },
      down: { 3: '........hh..............', 15: '...xy...................', 18: '..................xxx...', 19: '..................yx....' },
      up: { 18: '..................xxx...', 19: '..................yx....' },
    },
    // Black iron: blackened plate, dull brass, a red-hot stare and somebody else's blood.
    {
      body: PLATE,
      pal: { H: '#3a3a42', h: '#2a2a30', i: '#5a5a66', o: '#0d0b10', e: '#ff8a3a', P: '#3a3a42', T: '#2a2a30', t: '#1e1e24', j: '#8a6a3a', A: '#3a3a42', a: '#2a2a30', g: '#1a1a1e', B: '#3a2a1a', k: '#8a6a3a', L: '#2a2a30', l: '#1e1e24', K: '#1a1a1e', C: '#4a1414', c: '#2a0a0a', x: '#6b1a1a', y: '#7a1d1d' },
      down: { 14: '...x..........y.........', 16: '.........xx.............', 17: '..........x......x......', 19: '...............yx.......' },
    },
  ],
  RANGER: [
    // Hooded, a scarf over the mouth, a quiver strap across; a hunter's eyes in the shadow.
    {
      body: HOOD,
      pal: { ...FACE, H: '#3f5a32', h: '#2f4a28', e: '#ffd27a', x: '#5a4a32', T: '#3f6b3a', t: '#2f5a2a', A: '#5a4a32', a: '#4a3a26', g: '#4a3420', B: '#5a3d22', k: '#8a6a3a', L: '#3a3a2a', l: '#2a2a1e', K: '#2a2420', C: '#2f4a28', c: '#243a20', z: '#5a3d22', y: '#6b4a2b', w: '#d8c48a' },
      down: { 12: '................z.......', 13: '...............z........', 14: '.............zz.........', 15: '............z...........', 16: '..........zz............', 17: '.........z..............', 18: '........z...............', 19: '.......z................' },
      up: { 7: '..............w.w.......', 8: '..............yyy.......', 9: '..............yyy.......', 10: '..............yyy.......', 11: '..............yyy.......', 12: '..............yyy.......', 13: '..............yyy.......', 14: '..............yy........', 15: '.............z..........', 16: '............z...........' },
    },
    // The trapper: a wide brimmed hat, a fur collar, brown leather.
    { body: HAT, pal: { ...FACE, H: '#5a3d22', h: '#4a3420', i: '#8a6a3a', e: '#ffd27a', f: '#c79c78', b: '#6a4a32', x: '#8a7a66', T: '#6b4a2b', t: '#5a3d22', A: '#6b4a2b', a: '#5a3d22', g: '#4a3420', B: '#3a2a1a', k: '#8a6a3a', L: '#3a2e24', l: '#2a2018', K: '#2a2420' } },
    // A warden of the hills: grey-blue hood and cloak, pale eyes, a brooch.
    {
      body: HOOD,
      pal: { ...FACE, H: '#5a6a7a', h: '#4a5a6a', e: '#bfe0ff', x: '#3a4652', T: '#4a5a6a', t: '#3a4652', A: '#3a4652', a: '#2e3a46', g: '#2a2420', B: '#2a2420', k: '#9aa3ad', L: '#3a3e46', l: '#2e3238', K: '#2a2420', C: '#3a4652', c: '#2e3a46', y: '#9aa3ad' },
      down: { 13: mid('yy') },
    },
  ],
  ROGUE: [
    // Violet: a dark hood and wraps, violet eyes.
    { body: HOOD, pal: { ...LEGS, ...FACE, H: '#2a2630', h: '#1e1c24', e: '#c9a8ff', x: '#141218', T: '#3a3346', t: '#2e2838', A: '#2a2630', a: '#1e1c24', g: '#1e1c24', B: '#5a3d22', k: '#8a6a3a', C: '#24202c', c: '#1a1820' } },
    // A cutpurse: a red scarf up over the nose, brown leather, yellow eyes, a knife at the hip.
    {
      body: HOOD,
      pal: { ...FACE, H: '#3a2a22', h: '#2a1e16', e: '#ffd27a', x: '#8a2a1a', T: '#5a4030', t: '#4a3428', A: '#4a3428', a: '#3a2a22', g: '#2a1e16', B: '#2a1e16', k: '#9aa3ad', L: '#3a3028', l: '#2a2018', K: '#241c16', C: '#4a3428', c: '#3a2a22', y: '#9aa3ad' },
      down: { 10: '.....................x..', 11: '.....................x..', 21: '......yy................' },
      up: { 10: '...........xx...........', 11: '...........xx...........', 12: '............x...........' },
    },
    // Night: black from hood to boot, a pale bone mask, white eyes.
    { body: HOOD, pal: { H: '#1e1c24', h: '#141218', o: '#c8c0b0', e: '#bfe0ff', x: '#141218', T: '#1e1c24', t: '#141218', A: '#18161c', a: '#101014', g: '#101014', B: '#2a2630', k: '#3a3346', L: '#1a1a20', l: '#121216', K: '#0d0b10', C: '#141218', c: '#0d0b10' } },
  ],
  MAGE: [
    // A tall pointed hat with a star stitched on, a long robe and wide sleeves, a grey beard, violet eyes.
    { body: MAGE, glow: 'i', pal: { ...FACE, H: '#3e2760', h: '#2e1c48', i: '#ffd27a', j: '#b89a4a', e: '#c9a8ff', b: '#a8a2b4', T: '#3e2760', t: '#2e1c48', A: '#4a2f6e', a: '#3a2458', g: '#c79c78', B: '#2e1c48', k: '#b89a4a', c: '#2e1c48', K: '#2a2420' } },
    // The ember: red robe and hat, fire in the eyes, a black beard.
    { body: MAGE, glow: 'i', pal: { ...FACE, H: '#6a1e1a', h: '#3a1210', i: '#ffd27a', j: '#d4a537', e: '#ff8a3a', b: '#3a3036', T: '#6a1e1a', t: '#4a1410', A: '#7a2a1e', a: '#5a1e16', g: '#c79c78', B: '#3a1210', k: '#d4a537', c: '#3a1210', K: '#2a2420' } },
    // Frost: pale blue, a hood instead of a hat, a white beard and ice in the eyes.
    { body: COWL, pal: { ...FACE, H: '#6a8aaa', h: '#4a6a8a', e: '#bfe0ff', b: '#e8eef2', T: '#5a7a9a', t: '#4a6a8a', j: '#cfe0ec', A: '#6a8aaa', a: '#4a6a8a', g: '#c79c78', B: '#3a4a5a', k: '#cfe0ec', c: '#3a4a5a', K: '#2a2420' } },
  ],
  HEALER: [
    // The Cleric: a mail coif and sleeves, a white tabard with the Lantern on it in gold.
    { body: HOOD, glow: 'J', pal: { ...FACE, H: '#8a9098', h: '#6a7078', e: '#ffe9a8', x: '#c79c78', T: '#e0d8c4', t: '#cfc6b0', A: '#7a8088', a: '#5a6068', g: '#5a3d22', B: '#8a6a3a', k: '#d4a537', L: '#4a4e56', l: '#3a3e46', K: '#2a2420', C: '#cfc6b0', c: '#b8b09a', J: '#ffd27a' }, down: LANTERN },
    // The friar: a brown habit and hood, a rope belt, a lantern-light under the hood.
    {
      body: COWL, glow: 'J',
      pal: { ...FACE, H: '#5a4232', h: '#4a3428', e: '#ffe9a8', b: '#c79c78', T: '#5a4232', t: '#4a3428', j: '#5a4232', A: '#4a3428', a: '#3a2a1e', g: '#c79c78', B: '#c8b88a', k: '#c8b88a', c: '#3a2a1e', K: '#2a2420', J: '#ffd27a', y: '#c8b88a' },
      down: { 20: '.........y..............', 21: '.........y..............', 22: '........yy..............', 15: mid('J') },
    },
    // The templar: a closed white helm, a red cloak, the Lantern on the breast.
    { body: PLATE, glow: 'J', pal: { ...LEGS, ...FACE, H: '#d8d4cc', h: '#a8a49c', i: '#ffffff', e: '#ffe9a8', P: '#d4a537', T: '#c8c0b0', t: '#a8a090', j: '#c8c0b0', A: '#8a9098', a: '#6a7078', g: '#5a5e64', B: '#5a3d22', k: '#d4a537', C: '#8a1e1e', c: '#6a1414', J: '#ffd27a' }, down: LANTERN },
  ],
};
