/**
 * The fen's drowned cart the tile way (docs/design/tile-redraw.md, "Making a new asset"): a farm cart sunk to its axles
 * in black water and peat mud, tilted down to the right, the near wheel half under, the far wheel broken off and lying
 * flat beside it, the bed's boards grey and rotten with reeds through them, two sodden sacks spilled, a crow on the
 * shaft. The chapel's wet greys and peat browns, lit from the upper left, a dark outline, no noise. Cosmetic only: the
 * block is the room's (shared/fenroamnooks.ts, `drownedcart`).
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { Grid } from './tiletrees';

const COLS = ['#0c0b08', '#1a1612', '#2a2218', '#1c2528', '#2c3a3e', '#2e2a28', '#4a4846', '#6a6862', '#4a3622', '#1b2c1e', '#34502e', '#5a4a34', '#7a6648', '#08080a', '#2a2c3a'];
const OUT = 0, MUD_D = 1, MUD = 2, WAT = 3, WAT_L = 4, WOOD_D = 5, WOOD = 6, WOOD_L = 7, RIM = 8, REED_D = 9, REED = 10, SACK_D = 11, SACK = 12, CROW = 13, SHEEN = 14;

export function drownedCartCut(_b: Block): Cut {
  const W = 58, H = 44, G = new Grid(W, H), base = H - 3, cx = 29, wl = 29;
  // Peat mud under it all, and black water lapping over its lower half, a pale glint on the surface.
  for (let y = wl - 1; y <= base; y++) {
    const t = (y - (wl - 1)) / (base - wl + 1), half = Math.round(27 * Math.sqrt(Math.max(0.05, 1 - (1 - t) * (1 - t) * 0.5)));
    for (let x = cx - half; x <= cx + half; x++) G.set(x, y, y > wl + 6 ? (x < cx - half + 3 ? MUD : MUD_D) : (y === wl + 2 && x % 7 < 2 ? WAT_L : WAT));
  }
  // The flat broken wheel on the right: a ring of rim, two spokes crossing, a hub, in the water.
  const wx = 46, wy = wl + 8;
  for (let a = 0; a < 40; a++) {
    const t = (a / 40) * Math.PI * 2, x = Math.round(wx + Math.cos(t) * 8), y = Math.round(wy + Math.sin(t) * 3);
    G.set(x, y, Math.cos(t) + Math.sin(t) < 0 ? WOOD_L : RIM), G.set(x, y + 1, RIM);
  }
  for (let i = -6; i <= 6; i += 2) G.set(wx + i, wy + Math.round(i * 0.25), WOOD_D), G.set(wx + Math.round(i * 0.5), wy + Math.round(i * 0.4), WOOD);
  G.set(wx, wy, WOOD_L), G.set(wx + 1, wy, RIM);
  // The bed, tilted down to the right: three grey boards a face, rotten gaps, the far side's rim above.
  const top = (x: number) => 11 + Math.round((x - 10) * 0.28);
  for (let x = 10; x <= 42; x++) {
    const t0 = top(x);
    for (let y = t0; y <= t0 + 14; y++) {
      if (y >= wl + 2 + (x > 34 ? 0 : 3)) continue;
      const row = Math.floor((y - t0) / 5), plank = (y - t0) % 5;
      let v = plank === 4 ? WOOD_D : row === 0 ? WOOD_L : WOOD;
      if (plank === 0 && row === 0) v = WOOD_L;
      if (x === 10 || x === 11) v = v === WOOD_D ? WOOD_D : WOOD_L;
      if ((x * 7 + row * 13) % 17 === 0 && plank > 0 && plank < 4) v = WOOD_D; // a rotten gap
      if (x > 32 && plank !== 4) v = row === 0 ? WOOD : WOOD_D; // the sunk end in shadow
      G.set(x, y, v);
    }
    G.set(x, t0 - 1, x < 26 ? WOOD_L : WOOD); // the lip of the bed
  }
  // Bed ribs: dark uprights where the boards meet.
  for (const x of [14, 24, 34]) for (let y = top(x); y < wl; y++) if (G.get(x, y) >= 0) G.set(x, y, WOOD_D);
  // The near wheel, half under: rim and spokes above the waterline, centred low at the left of the bed.
  const hx = 20, hy = wl + 1, R = 11;
  for (let a = 0; a < 80; a++) {
    const t = (a / 80) * Math.PI, x = Math.round(hx - Math.cos(t) * R), y = Math.round(hy - Math.sin(t) * R);
    G.set(x, y, Math.cos(t) > 0.2 ? WOOD_L : RIM), G.set(x + (x < hx ? 1 : -1), y, RIM);
  }
  for (const k of [-1, -0.5, 0, 0.5, 1]) for (let s = 2; s < R - 1; s++) {
    const t = Math.PI / 2 + k * 1.1, x = Math.round(hx + Math.cos(t) * s), y = Math.round(hy - Math.sin(t) * s);
    if (y < wl) G.set(x, y, s % 5 === 4 ? WOOD_D : WOOD);
  }
  for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [0, -2]]) G.set(hx + dx, hy + dy, WOOD_D);
  // The shaft, a long pole reaching up and to the left from the bed's high end, and a crow on its tip.
  for (let i = 0; i < 12; i++) G.set(10 - i, 14 - i, i % 4 === 3 ? WOOD_D : WOOD_L), G.set(10 - i, 15 - i, WOOD_D);
  for (const [dx, dy] of [[0, 0], [1, 0], [2, 0], [1, -1], [2, -1], [3, -1], [3, -2], [-1, 1]]) G.set(0 + dx + 1, 1 + dy + 1, dx < 2 && dy < 0 ? SHEEN : CROW);
  G.set(5, 1, CROW), G.set(1, 3, CROW);
  // Reeds growing through the bed and out of the water, in two greens, leaning.
  for (const [x, h, lean] of [[16, 12, 0], [27, 15, 1], [31, 10, -1], [37, 13, 1], [8, 7, 0], [51, 8, 0], [4, 6, 1]] as const) {
    const y0 = x > 36 ? wl + 6 : wl - 1;
    for (let i = 0; i < h; i++) G.set(x + Math.round((lean * i) / 5), y0 - i, i % 4 === 3 ? REED : REED_D);
    G.set(x + Math.round((lean * h) / 5), y0 - h, REED);
  }
  // Two sodden sacks spilled at the bank on the left, lit on their upper left, with a dark slump of grain below.
  for (const [sx, sy, sw] of [[3, base - 6, 9], [11, base - 3, 7]] as const) {
    for (let y = 0; y < 5; y++) {
      const inset = y === 0 || y === 4 ? 2 : 0;
      for (let x = inset; x < sw - inset; x++) G.set(sx + x, sy + y, y < 2 && x < sw / 2 ? SACK : y === 4 || x > sw - 3 ? SACK_D : SACK_D + (x + y) % 2);
    }
    G.set(sx + sw - 1, sy + 4, MUD_D), G.set(sx + sw, sy + 4, MUD_D);
  }
  G.outline(OUT);
  return G.cut(COLS, cx, base);
}
