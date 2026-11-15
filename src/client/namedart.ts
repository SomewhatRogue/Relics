/**
 * Named pieces on the floor (lootart.ts's pixel rows, the kit's size) and in the bag (itemicons.ts's 12 by 12
 * pictures, hilt low left, tip up right). Their steel, fittings, grip and wood use the art's own role colours,
 * so their stuff (namedlooks.ts) and a cursed tier's veins follow; anything else is drawn as it is.
 */
type Px = (x: number, y: number, col: string) => void;
type Ln = (x0: number, y0: number, x1: number, y1: number, col: string) => void;

// The role colours the art already uses (weaponlook.ts): steel bright and dark, fittings, grip, wood.
const W = '#e8eef2', w = '#9aa6b2', F = '#b89a4a', G = '#4a3420', H = '#8b6a3a';
const IM = '#c4cad4', IMD = '#6a7280', IW = '#8a5a30', IWD = '#5a3a1e', IG = '#d9b13a';

export const NAMED_FLOOR: Record<string, { rows: string[]; pal: Record<string, string>; glint?: [number, number, number] }> = {
  cleaver: { rows: ['.....c.SSSSSSSSSSSS', 'gggggcSSSSSSSSSSxSS', 'gggggcSSSSSSSSSSSSS', '.....c.EEEEEEEEEEEE'], pal: { c: F, g: G, S: w, E: W, x: '#0c0a0e' }, glint: [7, 18, 3] },
  pike: { rows: ['.....................w..', 'HHHHHHHHHHHHHHHHHHHHWWWW', '......q....q....q....w..', '.....qq...qq...qq.......'], pal: { H, W, w, q: '#8a7266' }, glint: [20, 23, 1] },
  spendthrift: { rows: ['..HHHHHHggHHHHHH..', '.H......$.......H.', 'HssssssssssssssssH', '........$$........'], pal: { H, g: G, s: '#e8c050', $: '#ffd860' } },
  needles: { rows: ['.r............', 'rrNNNNNNNNNNNn', '.r............', '...r..........', '..rrNNNNNNNNNn', '...r..........'], pal: { r: G, N: W, n: '#e0c0a0' }, glint: [2, 12, 1] },
  jealous: { rows: ['KkKkKkKkKEe', 'kKkKkKkKkE.'], pal: { K: H, k: G, E: '#4a9a2a', e: '#9be860' } },
  keeping: { rows: ['.........m...', '........MxM..', 'oHHHHHHHxyxM.', '........MxM..', '.........m...'], pal: { o: F, H, M: w, m: '#6a727c', x: '#ff8a3a', y: '#ffd27a' } },
};

export const NAMED_ICON: Record<string, (px: Px, line: Ln) => void> = {
  cleaver: (px, line) => { line(0, 11, 3, 8, IWD); px(4, 8, IG); line(4, 7, 9, 2, IMD); line(5, 8, 10, 3, IM); line(6, 9, 11, 4, '#eef2f5'); line(9, 2, 11, 4, IMD); px(9, 4, '#0c0a0e'); },
  pike: (px, line) => {
    line(0, 11, 8, 3, IW); line(9, 2, 11, 0, IM); px(8, 1, IM), px(10, 3, IM);
    for (const [x, y] of [[3, 8], [6, 5]]) px(x + 1, y + 1, '#8a7266'), px(x + 1, y + 2, '#8a7266'), px(x, y + 2, '#c8b8a8');
  },
  spendthrift: (px, line) => { line(2, 0, 6, 2, IW); line(6, 2, 8, 6, IW); line(8, 6, 6, 10, IW); line(6, 10, 2, 11, IW); line(2, 0, 2, 11, '#e8c050'); px(9, 6, '#ffd860'), px(10, 7, '#c89a2a'), px(9, 8, '#ffd860'); },
  needles: (px, line) => { line(11, 0, 3, 8, IM); line(2, 9, 1, 10, '#9a3a3a'); line(0, 1, 8, 9, IM); line(9, 10, 10, 11, '#9a3a3a'); px(11, 0, '#e0c0a0'), px(0, 1, '#e0c0a0'); },
  jealous: (px, line) => {
    line(2, 10, 7, 5, IWD); px(3, 9, IW), px(5, 7, IW);
    for (const [x, y] of [[8, 3], [9, 2], [10, 3], [9, 4]]) px(x, y, '#4a9a2a');
    px(9, 3, '#9be860'), px(9, 3, '#0e1a0a'), px(10, 2, '#9be860');
  },
  keeping: (px, line) => {
    line(1, 11, 6, 6, IW); px(2, 10, IWD), px(3, 9, IWD); px(6, 5, IG), px(7, 6, IG);
    for (let y = 1; y < 6; y++) px(7, y, IMD), px(10, y, IMD);
    line(7, 0, 10, 0, IM); line(7, 6, 10, 6, IM);
    px(8, 3, '#ff8a3a'), px(9, 3, '#ffd27a'), px(8, 2, '#ff6a2a'), px(9, 4, '#ff6a2a');
  },
};
