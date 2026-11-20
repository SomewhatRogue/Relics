/**
 * A lived-in town's folk at work (shared/townlife.ts), drawn over their sprite through the pen (npcs.ts): the
 * smith's hammer coming down on hot iron, the washerwoman's bucket at the pond, scrubbing and pegging out, the woodcutter's
 * axe and armfuls of logs, the carter's handcart, a child's hoop. (x, y) their feet on screen; fx the way they
 * walked in (their sprite faces it); `walking` false while they stop to work; tx their tile x, which stop. Paint only.
 */
import type { Npc } from '../shared/arena';
import type { Ctx } from './draw';

export const FOLK = new Set<NonNullable<Npc['work']>>(['smith', 'wash', 'chop', 'cart', 'hoop']);

const HAFT = '#6b4a2b', IRON = '#8a8f9a', LOG = '#4a3a2a', CUT = '#9a7a4a', OAK = '#6b4a2b', OAK_D = '#4a3420', SACK = '#8a7a5a';
const CLOTH = ['#8a8070', '#7a6a8a', '#9a8a6a', '#5a6a7a'];

/**
 * Which of `n`'s working stops (the points of its round it stops at, in order) it stands at, by its tile x: 0 the
 * first, 1 the next, -1 between. Read off its own round, so the new town's layout and today's both work (the anvil,
 * the tub and the block were fixed points of the old town; Kyle, 2026-11-20: folk not knowing where they are).
 */
function stopAt(n: Npc, tx: number): number {
  const at = (n.path ?? []).filter((_, i) => (n.stops?.[i] ?? 0) > 0);
  let best = -1, d = 1.3;
  at.forEach((p, i) => Math.abs(p[0] - tx) < d && ((d = Math.abs(p[0] - tx)), (best = i)));
  return best;
}
/** The x of `n`'s working stop `i` (its first if there is no such). */
const stopX = (n: Npc, i: number) => (n.path ?? []).filter((_, j) => (n.stops?.[j] ?? 0) > 0)[i]?.[0] ?? n.x;

export function drawFolk(c: Ctx, n: Npc, x: number, y: number, fx: number, walking: boolean, tx: number): void {
  const g = c.lit, t = c.now + n.y * 1.7, f = fx < 0 ? -1 : 1, X = Math.round(x), Y = Math.round(y);
  const r = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + dx, Y + dy, w, h));
  const glow = (dx: number, dy: number, w: number, h: number, col: string) => ((c.glow.fillStyle = col), c.glow.fillRect(X + dx, Y + dy, w, h));
  if (n.work === 'smith') {
    if (walking) return r(f * 4, -8, 1, 6, IRON), void r(f * 4 - 1, -2, 3, 1, IRON);
    // (Its stops: the anvil, then the forge's mouth.)
    if (stopAt(n, tx) === 1) {
      // At the forge's mouth: the iron held into the fire, coming out bright.
      const k = (t * 0.4) % 1;
      r(f * 3, -9, f * 7, 1, IRON);
      return glow(f * 10 - (f < 0 ? 2 : 0), -10, 3, 2, k > 0.6 ? '#ffd27a' : '#ff8a30');
    }
    // At the anvil: the hot iron on its face, the hammer up and down on it, sparks at each blow.
    const k = (t * 1.4) % 1, up = k < 0.7 ? Math.round((k / 0.7) * 8) : Math.round((1 - (k - 0.7) / 0.3) * 8), ax = f * 6;
    glow(ax - 2, -7, 4, 1, k < 0.8 ? '#ff9a3c' : '#ffd27a');
    for (let i = 0; i < 6; i++) r(f * 2 + Math.round((ax - f * 2) * (i / 5)), -12 - Math.round(up * (i / 5)), 1, 1, HAFT);
    r(ax - 1, -9 - up, 3, 2, IRON);
    if (k > 0.93 || k < 0.05) for (let i = 0; i < 4; i++) glow(ax + ((i * 5) % 7) - 3, -9 - ((i * 3) % 5), 1, 1, i % 2 ? '#ffd27a' : '#ff6a20');
    return;
  }
  if (n.work === 'wash') {
    if (walking) {
      // A full bucket to the tub, the basket of wet washing to the line, the empty bucket swinging back.
      // (Her stops: the pond, the tub, the line. The basket from the tub to the line, whichever way that is.)
      const tubX = stopX(n, 1), lineX = stopX(n, 2), toLine = Math.sign(lineX - tubX);
      const basket = Math.sign(fx) === toLine && (tx - tubX) * toLine > -0.3 && (lineX - tx) * toLine > -0.3, sw = Math.round(Math.sin(t * 7));
      if (basket) return r(-4, -12, 9, 4, '#8a7448'), r(-3, -13, 7, 1, CLOTH[(Math.floor(t) % 3) + 1]), void r(-4, -9, 9, 1, '#6a5a38');
      r(f * 5 - 1, -6 + sw, 4, 4, OAK), r(f * 5 - 1, -6 + sw, 4, 1, fx < 0 ? '#3a4a5c' : OAK_D);
      return r(f * 5, -9 + sw, 1, 3, '#8a7a5a');
    }
    const at = stopAt(n, tx);
    if (at === 0) {
      // At the pond's edge: the bucket dipped and lifted out dripping.
      const k = (t * 0.5) % 1, dip = Math.round(Math.sin(k * Math.PI) * 5);
      r(f * 7 - 2, -6 + dip, 5, 4, OAK), r(f * 7 - 1, -6 + dip, 3, 1, '#3a4a5c');
      return void (k > 0.6 && r(f * 8, -1 + Math.round((k - 0.6) * 8), 1, 1, '#8aa0b8'));
    }
    if (at === 1) {
      // At the tub: a shirt worked up and down the board, suds going over the side.
      const k = Math.sin(t * 6), cy = -7 + Math.round(k * 2);
      r(f * 4 - (f < 0 ? 4 : 0), cy, 5, 3, CLOTH[0]), r(f * 4 - (f < 0 ? 4 : 0), cy + 2, 5, 1, '#6a6050');
      if (k > 0.6) for (let i = 0; i < 3; i++) r(f * (6 + i * 2) - (f < 0 ? 1 : 0), -4 - (i % 2), 1, 1, '#c8ccd0');
      return;
    }
    // At the line: arms up, a sheet held to it and pegged, then the next.
    const k = (t * 0.35) % 1, col = CLOTH[Math.floor(t * 0.35) % CLOTH.length];
    r(-2, -22 + Math.round(k < 0.3 ? (0.3 - k) * 10 : 0), 6, k < 0.3 ? 5 : 6, col);
    return r(-2, -22, 1, 1, '#d8d0bc'), void r(3, -22, 1, 1, '#d8d0bc');
  }
  if (n.work === 'chop') {
    if (walking) {
      // An armful of logs to the pile; the axe over the shoulder going back to the block.
      if (fx < 0) {
        for (let j = 0; j < 3; j++) r(-5 + j * 3, -10 - (j % 2), 3, 3, LOG), r(-5 + j * 3, -10 - (j % 2), 1, 3, CUT);
        return;
      }
      for (let i = 0; i < 9; i++) r(-f * i * 0.6 + f * 2, -12 - i, 1, 1, HAFT);
      return r(-f * 6 - 2, -22, 4, 3, IRON);
    }
    // (Its stops: the block, then the pile.)
    if (stopAt(n, tx) === 1) {
      // At the pile: setting the logs down one by one.
      const k = (t * 0.8) % 1;
      return r(f * 3 - 1, -10 + Math.round(k * 7), 3, 3, LOG), void r(f * 3 - 1, -10 + Math.round(k * 7), 3, 1, CUT);
    }
    // At the block: a log stood on it, the axe raised slow and brought down; at the blow the halves jump apart.
    const k = (t * 0.7) % 1, raise = k < 0.7 ? k / 0.7 : 1 - (k - 0.7) / 0.08, bx = f * 8;
    const a = Math.max(0, Math.min(1, raise)), hx = Math.round(f * 2 + f * 4 * (1 - a)), hy = -12 - Math.round(a * 12);
    if (k < 0.78) r(bx - 1, -9, 3, 4, LOG), r(bx - 1, -9, 3, 1, CUT);
    else for (const s of [-1, 1]) r(bx - 1 + s * Math.round((k - 0.78) * 30), -8 + Math.round((k - 0.78) * 20), 2, 3, CUT);
    for (let i = 0; i < 7; i++) r(f * 2 + Math.round((hx - f * 2) * (i / 6)), -12 + Math.round((hy + 12) * (i / 6)), 1, 1, HAFT);
    r(hx - 1 + (k < 0.7 ? 0 : f), hy - 1, 3, 3, IRON);
    return;
  }
  if (n.work === 'cart') {
    // The handcart out before him on its two wheels, loaded both ways; stopped, a sack heaved on or off it.
    const bx = f * 13, half = 7;
    r(bx - half, -8, half * 2, 2, OAK), r(bx - half, -10, half * 2, 2, OAK_D), r(bx + (f < 0 ? half - 1 : -half), -10, 1, 4, OAK_D);
    r(bx - 2, -6, 4, 4, '#3a2a1a'), r(bx - 1, -5, 2, 2, IRON);
    r(f * 3, -8, f * (half - 2) - (f < 0 ? 1 : 0), 1, OAK_D);
    for (let i = 0; i < 3; i++) r(bx - half + 1 + i * 4, -13 + (i % 2), 4, 3, SACK);
    if (walking) return;
    const k = (t * 0.5) % 1, lift = Math.round(Math.sin(k * Math.PI) * 8);
    return r(-f * 2 - 2, -8 - lift, 5, 4, SACK), void r(-f * 2 - 1, -8 - lift, 3, 1, '#6e6046');
  }
  if (n.work === 'hoop') {
    // The hoop rolling a step ahead, the stick from the hand keeping it going.
    const hx = f * 8, spin = Math.floor(t * 10) % 4;
    for (const [dx, dy] of [[-2, 0], [-3, -1], [-3, -2], [-3, -3], [-2, -4], [-1, -5], [0, -5], [1, -5], [2, -4], [3, -3], [3, -2], [3, -1], [2, 0], [-1, 1], [0, 1], [1, 1]])
      r(hx + dx, -1 + dy - 1, 1, 1, '#8a6a3e');
    r(hx + [-2, 0, 2, 0][spin], -3 + [0, -2, 0, 2][spin] - 1, 1, 1, '#b8946a');
    for (let i = 0; i < 6; i++) r(f * 3 + Math.round((hx - f * 3 - f * 2) * (i / 5)), -9 + i, 1, 1, HAFT);
  }
}
