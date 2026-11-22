/**
 * The living world, L3: a trade's hanging sign, drawn the tile way. An iron arm out from the wall, two short chains,
 * a small board that swings a pixel or two, and on it a picture of the trade (a hammer, a mug, a needle) in a few
 * shades, never words. The foot is where the arm meets the wall; `dir` is which way the arm goes (1 right, -1 left).
 */
import type { Ctx } from './draw';

const TIM = ['#1a110a', '#24180f', '#3a2a1e', '#4e3826', '#654a33'];
const IRON = ['#101215', '#1c1f24', '#2c3138', '#414852', '#5e6874'];

export type Trade = 'forge' | 'tavern' | 'infirmary' | 'lodge' | 'bank' | 'tailor' | 'pawn';

/** Seven wide, six high; each letter a shade: b iron, c amber, w pale, r red, g gold, t thread. */
const ICONS: Record<Trade, string[]> = {
  forge: ['bbbbb..', 'bbbbbb.', 'bbbbb..', '..c....', '..c....', '..c....'],
  tavern: ['.wwww..', '.cccc..', '.cccccc', '.cccc.c', '.cccc.c', '.cccccc'],
  infirmary: ['..rrr..', '..rrr..', 'rrrrrrr', 'rrrrrrr', '..rrr..', '..rrr..'],
  lodge: ['.cc....', '..c..w.', '...c.w.', '...c.w.', '..c..w.', '.cc....'],
  bank: ['..ggg..', '.ggwgg.', '.ggggg.', '..ggg..', '.ggggg.', '..ggg..'],
  tailor: ['.....bb', '....bb.', '...bb.t', '..bb..t', '.bb..tt', 'b....t.'],
  pawn: ['...gg..', '...gg..', '.gg..gg', '.gg..gg', '.......', '.......'],
};
const COL: Record<string, string> = { b: '#8c97a6', c: '#c98a3e', w: '#d8d0b4', r: '#a83232', g: '#cfa83c', t: '#6a8a9a' };

const R = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(x, y, w, h));

/** Which trade a block plies, from its door's job or its stall's label; null for none. */
export function tradeOf(b: { door?: string; label?: string }): Trade | null {
  switch (b.door) {
    case 'forge': return 'forge';
    case 'tavern': return 'tavern';
    case 'infirmary': return 'infirmary';
    case 'lodge': return 'lodge';
    case 'bank': return 'bank';
  }
  return b.label === 'TAILOR' ? 'tailor' : b.label === 'PAWN' ? 'pawn' : null;
}

/** A hanging sign, swinging slowly: its board moves a pixel or two across, the chains leaning with it. */
export function drawSign(c: Ctx, trade: Trade, px: number, py: number, dir: number, phase: number): void {
  const g = c.lit, X = Math.round(px), Y = Math.round(py), s = Math.round(Math.sin(c.now * 1.3 + phase) * 1.4);
  const at = (o: number, w: number) => (dir > 0 ? X + o : X - o - w + 1);
  // The arm and its brace.
  R(g, at(0, 11), Y, 11, 1, IRON[2]), R(g, at(0, 11), Y - 1, 11, 1, IRON[3]);
  R(g, at(1, 1), Y + 1, 1, 1, IRON[1]), R(g, at(2, 1), Y + 1, 1, 1, IRON[1]);
  R(g, at(10, 1), Y - 2, 1, 3, IRON[1]);
  // The chains, then the board under them.
  R(g, at(2 + (s > 0 ? 1 : 0), 1), Y + 1, 1, 2, IRON[1]), R(g, at(8 + (s < 0 ? -1 : 0), 1), Y + 1, 1, 2, IRON[1]);
  const bx = at(1 + s, 9), by = Y + 3;
  R(g, bx, by, 9, 10, TIM[0]);
  R(g, bx + 1, by + 1, 7, 8, TIM[2]);
  R(g, bx + 1, by + 1, 7, 1, TIM[3]), R(g, bx + 1, by + 1, 1, 8, TIM[3]);
  R(g, bx + 7, by + 1, 1, 8, TIM[1]), R(g, bx + 1, by + 8, 7, 1, TIM[1]);
  const rows = ICONS[trade];
  for (let j = 0; j < 6; j++) for (let i = 0; i < 7; i++) {
    const ch = rows[j][i];
    if (ch !== '.') R(g, bx + 1 + i, by + 2 + j, 1, 1, COL[ch]);
  }
}
