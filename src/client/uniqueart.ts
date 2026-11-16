/**
 * The unique weapons on the floor (lootart.ts's pixel rows) and in the bag (itemicons.ts's 12 by 12 pictures,
 * hilt low left, tip up right), each as its line in shared/uniques.ts says. Their colours are their own (no
 * tier ramp, no veins: weaponlook.ts). namedart.ts merges these with the Hungry pieces'.
 */
type Px = (x: number, y: number, col: string) => void;
type Ln = (x0: number, y0: number, x1: number, y1: number, col: string) => void;

export const UNIQUE_FLOOR: Record<string, { rows: string[]; pal: Record<string, string>; glint?: [number, number, number] }> = {
  haulpick: { rows: ['................P.', '................P.', 'gggHHHHHHHHHHHHHPP', '................P.', '................E.'], pal: { g: '#4a3420', H: '#6a4a2c', P: '#6e7278', E: '#d0d4da' } },
  hingepin: { rows: ['N......................', 'NIIIIIIIIIIIIIIIIIIIIEe', 'N......................'], pal: { N: '#55585e', I: '#7a7e84', E: '#b8bcc2', e: '#e8eef2' }, glint: [1, 21, 1] },
  doorbow: { rows: ['..OOOOOOOOOOOOOO..', '.O....x.........O.', 'OssssssssssssssssO'], pal: { O: '#7a6650', x: '#141016', s: '#d8d0bc' } },
  mawlteeth: { rows: ['BBTTTTTt..', 'BBTTTT....', '..........', 'BBTTTTTt..', 'BBTTTT....'], pal: { B: '#d8ccb0', T: '#e8dcb8', t: '#fff4d8' } },
  skarnhook: { rows: ['..........k.', 'HHHHHcccccc.', '..........k.', '..........k.', '.......k..k.', '........kk..'], pal: { H: '#4a3a2a', c: '#8a8490', k: '#c0c4c8' } },
  knucklemace: { rows: ['........LLL.', 'oAAAAAAALdLL', '........LLd.'], pal: { o: '#7a6648', A: '#a08a68', L: '#5e6268', d: '#3a3c40' } },
  spoonladle: { rows: ['.............bbb.', 'IIIIIIIIIIIIbdddb', '.............bbb.'], pal: { I: '#3a383e', b: '#5a585e', d: '#121014' } },
  gutbow: { rows: ['........P..', '.......cP..', 'SSSSSSScPSS', '.......cP..', '........P..'], pal: { S: '#5a3d22', P: '#9aa3ad', c: '#c0c4ca' } },
  rustshears: { rows: ['.rr.WWWWWW......', 'r..rKWWWWWWWWWWe', '.rr.............'], pal: { r: '#6a5e58', K: '#d8c8a0', W: '#8a7a72', e: '#e8eef2' }, glint: [5, 14, 1] },
  brutecleaver: { rows: ['.....SSSSSSSSSSS', 'gggggSSSSSSSSSSS', 'gggggSSSSSSSSSSS', '.....EEEEEEEEEEE'], pal: { g: '#6a5a48', S: '#5a5c60', E: '#c8ccd2' }, glint: [5, 15, 3] },
  hushmaul: { rows: ['........HHHH', 'rRrRrRrRHsHH', '........HHHs'], pal: { r: '#6a5a48', R: '#857260', H: '#2a2c32', s: '#5a6070' } },
  leechstrap: { rows: ['....................kkk.', 'TTTTTBBBBBBBBBBBBBBBk..k', '.......................k', '......................k.'], pal: { T: '#121012', B: '#3a3034', k: '#8a8e94' } },
};

const zig = (px: Px, pts: number[][], a: string, b: string) => pts.forEach(([x, y], i) => px(x, y, i % 2 ? a : b));

export const UNIQUE_ICON: Record<string, (px: Px, line: Ln) => void> = {
  haulpick: (px, line) => { line(1, 11, 8, 4, '#6a4a2c'); px(0, 11, '#4a3420'); line(5, 1, 11, 7, '#7a7e84'); px(5, 1, '#d0d4da'), px(11, 7, '#d0d4da'); },
  hingepin: (px, line) => { line(1, 10, 10, 1, '#7a7e84'); px(11, 0, '#e8eef2'); px(0, 10, '#55585e'), px(1, 11, '#55585e'), px(0, 11, '#55585e'); },
  doorbow: (px, line) => { line(2, 0, 6, 2, '#7a6650'); line(6, 2, 8, 6, '#7a6650'); line(8, 6, 6, 10, '#7a6650'); line(6, 10, 2, 11, '#7a6650'); line(2, 0, 2, 11, '#d8d0bc'); px(7, 4, '#141016'); },
  mawlteeth: (px, line) => { line(10, 1, 4, 7, '#e8dcb8'); px(10, 1, '#fff4d8'); line(2, 9, 3, 8, '#d8ccb0'); line(1, 1, 7, 7, '#e8dcb8'); px(1, 1, '#fff4d8'); line(8, 8, 9, 9, '#d8ccb0'); },
  skarnhook: (px, line) => {
    line(0, 11, 3, 8, '#4a3a2a'); zig(px, [[4, 7], [5, 6], [6, 5]], '#8a8490', '#c0c4c8');
    for (const [x, y] of [[7, 4], [8, 3], [9, 3], [10, 4], [10, 5], [10, 6], [9, 7], [8, 7], [7, 6]]) px(x, y, '#c0c4c8');
  },
  knucklemace: (px, line) => {
    line(1, 11, 6, 6, '#a08a68');
    for (let y = 2; y <= 4; y++) line(7, y, 9, y, '#5e6268');
    px(8, 1, '#5e6268'), px(10, 3, '#5e6268'), px(8, 5, '#5e6268'), px(8, 3, '#3a3c40'), px(9, 2, '#7e8288');
  },
  spoonladle: (px, line) => {
    line(0, 11, 7, 4, '#3a383e');
    for (const [x, y] of [[8, 1], [9, 1], [10, 2], [10, 3], [9, 4], [8, 4], [7, 3], [7, 2]]) px(x, y, '#5a585e');
    px(8, 2, '#121014'), px(9, 2, '#121014'), px(8, 3, '#121014'), px(9, 3, '#121014');
  },
  gutbow: (px, line) => {
    line(1, 10, 8, 3, '#5a3d22'); line(5, 1, 11, 7, '#9aa3ad');
    zig(px, [[5, 2], [5, 3], [4, 4], [4, 5], [4, 6]], '#8a8e94', '#c0c4ca');
    zig(px, [[10, 7], [9, 7], [8, 8], [7, 8], [6, 8]], '#8a8e94', '#c0c4ca');
  },
  rustshears: (px, line) => {
    px(1, 9, '#6a5e58'), px(0, 10, '#6a5e58'), px(2, 10, '#6a5e58'), px(1, 11, '#6a5e58');
    line(3, 8, 11, 0, '#8a7a72'); line(4, 8, 9, 3, '#7a6a62'); px(11, 0, '#e8eef2'); px(3, 8, '#d8c8a0');
  },
  brutecleaver: (px, line) => { line(0, 11, 2, 9, '#6a5a48'); line(3, 7, 8, 2, '#5a5c60'); line(4, 8, 9, 3, '#6e7074'); line(5, 9, 10, 4, '#c8ccd2'); line(8, 2, 10, 4, '#5a5c60'); },
  hushmaul: (px, line) => {
    line(1, 11, 6, 6, '#6a5a48'); px(2, 10, '#857260'), px(4, 8, '#857260');
    for (let y = 2; y <= 5; y++) line(6, y, 10, y, '#2a2c32');
    px(7, 2, '#5a6070'), px(9, 4, '#4a5060');
  },
  leechstrap: (px, line) => { line(0, 11, 9, 2, '#3a3034'); px(1, 10, '#121012'), px(2, 9, '#121012'); line(9, 2, 10, 1, '#8a8e94'); px(11, 1, '#a8acb2'), px(11, 2, '#a8acb2'), px(11, 3, '#a8acb2'), px(10, 4, '#a8acb2'); },
};
