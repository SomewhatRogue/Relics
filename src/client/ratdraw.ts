/**
 * A rat, a few pixels long, on the lit layer (so only the torches and the moon show it): a dark
 * hunched back, a pink tail, a pale glint of an eye. At the blood it noses and nibbles; bolting it
 * goes long and flat with its feet a blur. Never green-eyed and never glowing: that's the hungry's.
 * (x, y) its feet on screen. The flat view and the 2.5D view's flat layer both draw it.
 */
import type { Ctx } from './draw';
import type { Rat } from './rats';

const BACK = '#1e1a1c', TOP = '#2e282a', FOOT = '#141012', TAIL = '#8a5a5e', PINK = '#d4949a', EYE = '#d8d0c4';

export function drawRat(c: Ctx, r: Rat, x: number, y: number): void {
  if (r.state === 'gone') return;
  const g = c.lit, f = r.face, X = Math.round(x), Y = Math.round(y);
  const px = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(f > 0 ? X + dx : X - dx - w + 1, Y + dy, w, h));
  if (r.state === 'flee') {
    // Long and low, feet going, the tail straight out behind.
    const k = Math.floor(c.now * 24 + r.seed) % 2;
    px(-2, -2, 5, 1, BACK), px(-1, -3, 3, 1, TOP), px(3, -2, 1, 1, BACK);
    px(-1 + k, -1, 1, 1, FOOT), px(2 - k, -1, 1, 1, FOOT);
    px(-4, -2, 2, 1, TAIL), px(-5, -2, 1, 1, PINK);
    px(3, -3, 1, 1, EYE);
    return;
  }
  // At the blood (or creeping back): hunched, the head down to it and up again.
  const nib = r.state === 'idle' && Math.floor(c.now * 5 + r.seed) % 3 === 0 ? 1 : 0, step = r.state === 'in' ? Math.floor(c.now * 10) % 2 : 0;
  px(-2, -3, 4, 2, BACK), px(-1, -4, 2, 1, TOP);
  px(2, -3 + nib, 2, 2, BACK), px(2, -4 + nib, 1, 1, TOP);
  px(-2 + step, -1, 1, 1, FOOT), px(1, -1, 1, 1, FOOT);
  px(-4, -2, 2, 1, TAIL), px(-5, -1, 1, 1, PINK);
  // The glint: only now and then, as the head turns to the light.
  if (Math.floor(c.now * 1.3 + r.seed) % 4 !== 0) px(3, -3 + nib, 1, 1, EYE);
}
