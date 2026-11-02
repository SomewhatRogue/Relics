/**
 * Goblins and the butcher at twice the detail, in the sickly greens with glowing eyes: the small
 * goblin and what marks each kind of it (a pot helm on the brute, a red band on the lunger, a sack on
 * the looter, a hood on the archer), the butcher in his apron, and the bodies left behind (headless,
 * burned). Same characters as the heroes (bodies.ts) plus E ears, w teeth, m mouth, x apron, y blood.
 */
import { expand, remap, type Grid, type Pal, type Regions } from './grid';

const SKIN: Pal = { H: '#5b6b2a', h: '#4a5a22', E: '#5b6b2a', A: '#5b6b2a', a: '#4a5a22', g: '#4a5a22', o: '#2e3a18', e: '#ff4a3a', w: '#e8e0c8', m: '#2a1a14' };
export const GOBLIN_PAL: Pal = { ...SKIN, T: '#4a3a2a', t: '#3a2a1e', B: '#2a2018', L: '#3a4a1f', l: '#2e3a18', K: '#2a2018', i: '#5a5a62', I: '#3a3a42', y: '#6b1a1a', z: '#7a1d1d', r: '#8a1e1e', s: '#6a5a3a', S: '#5a4a2e', d: '#2e3a22', D: '#243018' };

const GOBLIN: Grid = {
  rows: [
    '...........', '.......hHHH', '.....hHHHHH', '....hHHHHHH', 'E..hHHHHHHH', 'EEEhHHHHHHH', '.EEhHHoeeHH', '..EhHHHHHHH', '...hHHHHHHH',
    '...hHHmwmww', '....hHHmmmm', '.....hhHHHH', '...aAATTTTT', '..aAATTTtTT', '..aAtTTTTTT', '..gAtTTTTTT', '..gg.tTTTTT', '....BBBBBBB',
    '.....tTTTTT', '.....tTT...', '.....LLL...', '.....LLl...', '.....LLl...', '.....LLl...', '....KKKK...', '....KKKK...',
  ],
};
const UP_FACE = { o: 'H', e: 'H', m: 'H', w: 'H' };
export const GOBLIN_REG: Regions = { arm: [15, 12, 22, 18], back: [0, 12, 7, 18], headTo: 12, hip: 20, byChar: { s: 'cape', S: 'cape' } };

/** What marks each kind, laid over the front (`down`) and the back (`up`). */
const KINDS: Record<string, { down?: Record<number, string>; up?: Record<number, string> }> = {
  plain: {},
  heavy: { down: { 0: '......iiiiiiiiii......', 1: '.....iiiiiiiiiiii.....', 2: '....iiiiiiiiiiiiii....', 3: '...IIIIIIIIIIIIIIII...' }, up: { 0: '......iiiiiiiiii......', 1: '.....iiiiiiiiiiii.....', 2: '....iiiiiiiiiiiiii....', 3: '...IIIIIIIIIIIIIIII...' } },
  lunger: { down: { 4: '...rrrrrrrrrrrrrrrr...' }, up: { 4: '...rrrrrrrrrrrrrrrr...', 5: '..........rr..........', 6: '..........r.r.........' } },
  looter: { down: { 11: '..sss.................', 12: '.sSSs.................' }, up: { 11: '.......ssssssss.......', 12: '......sSSSSSSSSs......', 13: '......sSSSSSSSSs......', 14: '......sSSSSSSSSs......', 15: '.......sSSSSSSs.......', 16: '........ssssss........' } },
  archer: { down: { 1: '.......dddddddd.......', 2: '.....dddddddddddd.....', 3: '....dDDDDDDDDDDDDd....', 4: '...dD............Dd...', 5: '...dD............Dd...' }, up: { 1: '.......dddddddd.......', 2: '.....dddddddddddd.....', 3: '....dddddddddddddd....', 4: '...dddddddddddddddd...', 5: '...dddddddddddddddd...', 6: '....dddddddddddddd....' } },
};

export const goblinRows = (kind: string, up: boolean): string[] => {
  const k = KINDS[kind] ?? KINDS.plain, base = expand({ rows: GOBLIN.rows, over: up ? k.up : k.down }, 22);
  return up ? remap(base, UP_FACE) : base;
};

export const BUTCHER_PAL: Pal = { ...SKIN, e: '#ff4a3a', T: '#5b6b2a', t: '#4a5a22', x: '#8a7a66', y: '#6b1a1a', z: '#7a1d1d', L: '#3a4a1f', l: '#2e3a18', K: '#2a2018', B: '#3a2a1a' };
const BUTCHER: Grid = {
  rows: [
    '..................', '..............hHHH', '............hHHHHH', '...........hHHHHHH', '.......EE.hHHHHHHH', '.......EEEhHHHHHHH', '........EEhHHHHHHH',
    '.........hHHHHHHHH', '.........hHHHoeeHH', '.........hHHHHHHHH', '.........hHHHHHHHH', '.........hHHHwHmmm', '..........hHHwHHHH', '...........hhHHHHH',
    '.....aAAAAAhhHHHHH', '...aAAAAAAAAhhhHHH', '..aAAAAAAAAAATTTTT', '.aAAAAaAAAATTTTTTT', '.aAAAAaAAATTTTTTTT', '.aAAAaAAAtTTTTTTTT', '.aAAAaAAtTTxxxxxxx',
    '.aAAaAAAtTTxxxxxxx', '.aAAaAAtTTTxxxxyxx', '..aAaAAtTTTxxxxxxx', '..aAaAtTTTTxxyxxxx', '..gAaAtTTTTxxxxxxx', '..ggaAtTTTTxxxxxxz', '..gggtTTTTTxxxxxxx',
    '..ggtTTTTTTxyxxxxx', '....tTTTTTTxxxxxxx', '....ttTTTTTxxxxxxx', '.....tTTTTTxxxxxzx', '......tTTTTxxxxxxx', '.......ttTTxxxxxxx', '.........LLLLLL...',
    '.........LLLLLL...', '.........LLLLLl...', '.........LLLLLl...', '.........LLLLLl...', '.........LLLLLl...', '.........LLLLLl...', '........KKKKKKl...', '........KKKKKKK...', '........KKKKKKK...',
  ],
  over: { 20: '...........B........................', 21: '............B.......................', 22: '.............B......................' },
};
export const BUTCHER_REG: Regions = { arm: [24, 14, 36, 30], back: [0, 14, 12, 30], headTo: 14, hip: 34 };
export const butcherRows = (up: boolean): string[] => {
  const base = expand(BUTCHER, 36);
  return up ? remap(base, { ...UP_FACE, x: 'T', y: 'T', z: 'T' }) : base;
};

/** A body without its head: the stump where it was. */
export function headless(rows: string[], headTo: number, w: number): string[] {
  const c = Math.floor(w / 2);
  return rows.map((r, y) => (y < headTo - 2 ? '.'.repeat(w) : y < headTo ? '.'.repeat(c - 3) + (y === headTo - 1 ? 'yzzzzy' : '.zzzz.') + '.'.repeat(w - c - 3) : r));
}
/** Everything burned to the same black, a few embers left. */
export function burnt(rows: string[]): string[] {
  return rows.map((r, y) => [...r].map((ch, x) => (ch === '.' ? '.' : (x * 7 + y * 3) % 11 ? 'Q' : 'q')).join(''));
}
export const BURNT: Pal = { Q: '#1a1614', q: '#2a2420' };

/** The sword's shield: a round-topped board with a rim and a boss. */
export const SHIELD = expand({ rows: ['.sssss', 'sSSSSS', 'sSDSSS', 'sSDSSS', 'sSDSSS', 'sSDSSi', 'sSDSSS', 'sSDSSS', 'sSDSSS', 'sSSSSS', '.sSSSS', '..ssss', '....ss'] }, 12);
export const SHIELD_PAL: Pal = { s: '#9aa3ad', S: '#7a5230', D: '#5a3d22', i: '#cfd6dc' };

/** For the tools that draw these offline. */
export const GOBLIN_DUMP = Object.fromEntries([
  ...Object.keys(KINDS).flatMap((k) => [[`goblin-${k}-down`, { rows: goblinRows(k, false), pal: GOBLIN_PAL, reg: GOBLIN_REG }], [`goblin-${k}-up`, { rows: goblinRows(k, true), pal: GOBLIN_PAL, reg: GOBLIN_REG }]]),
  ['butcher-down', { rows: butcherRows(false), pal: BUTCHER_PAL, reg: BUTCHER_REG }],
  ['butcher-up', { rows: butcherRows(true), pal: BUTCHER_PAL, reg: BUTCHER_REG }],
  ['goblin-headless', { rows: headless(goblinRows('plain', false), 12, 22), pal: GOBLIN_PAL, reg: GOBLIN_REG }],
  ['butcher-headless', { rows: headless(butcherRows(false), 14, 36), pal: BUTCHER_PAL, reg: BUTCHER_REG }],
  ['goblin-burnt', { rows: burnt(goblinRows('plain', false)), pal: BURNT, reg: GOBLIN_REG }],
  ['shield', { rows: SHIELD, pal: SHIELD_PAL, reg: { arm: [0, 0, 0, 0], back: [0, 0, 0, 0], headTo: 0, hip: 99 } }],
]);
