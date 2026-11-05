/**
 * The marks on the wood's element-lesson goblins (shared/wood.ts ELEMENT_FOES), drawn over a small
 * goblin's body so each one reads at a glance on a phone: the soaked one shining wet, dripping, in a
 * puddle; the aproned one in a pale bark apron; the kiln-hot one with embers glowing in its skin, hot
 * coals at its feet and smoke coming off it. Drawing only (no Math.random; the flicker runs on the clock).
 */
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';

const DROP = ['#9cd8ff', '#5aa8e0'], SHINE = '#5a9ad0', PUDDLE = '#4a7a9a', PUDDLE2 = '#9cd0f0';
const BARK = '#b08a5a', BARK2 = '#6a4a28', STRAP = '#3a2a1a';
const EMBER = ['#ff6a1a', '#ffa030', '#ffd27a'], SMOKE = '#a8a29a';

/** `bx`, `by`: the feet as posed (the body is 11 wide, 13 tall, its feet on `by`). */
export function drawLessonMark(c: Ctx, e: Enemy, bx: number, by: number): void {
  const v = e.variant;
  if (e.act === 'dead' || (v !== 'soaked' && v !== 'aproned' && v !== 'kilnhot')) return;
  const g = c.lit, l = Math.round(bx - 5.5), t = Math.round(by - 13), k = c.now + e.id * 0.37;
  if (v === 'soaked') {
    // Standing in its own puddle (rings spreading where the drips land), streaked wet, drops running off it.
    g.fillStyle = PUDDLE;
    g.fillRect(l - 1, t + 13, 13, 1), g.fillRect(l + 1, t + 14, 9, 1);
    const r = (k * 0.8) % 1, w = Math.round(4 + r * 5);
    g.globalAlpha = 1 - r;
    g.fillStyle = PUDDLE2;
    g.fillRect(l + 5 - w, t + 13, 2, 1), g.fillRect(l + 4 + w, t + 13, 2, 1), g.fillRect(l + 5 - w + 2, t + 14, 1, 1), g.fillRect(l + 3 + w, t + 14, 1, 1);
    g.globalAlpha = 1;
    g.fillStyle = SHINE;
    g.fillRect(l + 4, t + 1, 1, 2), g.fillRect(l + 6, t + 1, 1, 1), g.fillRect(l + 2, t + 7, 1, 2), g.fillRect(l + 8, t + 7, 1, 2), g.fillRect(l + 4, t + 9, 1, 2);
    for (let i = 0; i < 4; i++) {
      const p = (k * 1.5 + i * 0.27) % 1;
      g.fillStyle = DROP[i % 2];
      g.fillRect(l + [1, 9, 3, 7][i], Math.round(t + 4 + i * 2 + p * 7), 1, 2);
    }
    return;
  }
  if (v === 'aproned') {
    // A pale bark apron down its front, ribbed, on a strap round the neck.
    g.fillStyle = BARK;
    g.fillRect(l + 2, t + 7, 7, 5);
    g.fillStyle = BARK2;
    g.fillRect(l + 3, t + 8, 1, 4), g.fillRect(l + 5, t + 7, 1, 2), g.fillRect(l + 5, t + 10, 1, 2), g.fillRect(l + 7, t + 8, 1, 3);
    g.fillStyle = STRAP;
    g.fillRect(l + 2, t + 6, 1, 1), g.fillRect(l + 8, t + 6, 1, 1), g.fillRect(l + 2, t + 7, 7, 1);
    return;
  }
  // Hot off the kiln: embers glowing through its skin and coals round its feet (unlit, so they show in
  // any light), and smoke curling up off its head.
  const f = Math.floor(k * 8), embers: [number, number][] = [[3, 3], [7, 2], [2, 8], [5, 7], [8, 9], [4, 10]];
  embers.forEach(([x, y], i) => ((c.glow.fillStyle = EMBER[(f + i) % 3]), c.glow.fillRect(l + x, t + y, 1, 1)));
  for (const [x, y] of [[0, 13], [3, 14], [8, 14], [10, 13]] as const) (c.glow.fillStyle = EMBER[(f + x) % 2]), c.glow.fillRect(l + x, t + y, 2, 1);
  g.fillStyle = SMOKE;
  for (let i = 0; i < 3; i++) {
    const p = (k * 0.7 + i / 3) % 1;
    g.globalAlpha = 0.85 * (1 - p);
    g.fillRect(Math.round(l + 5 + Math.sin(k * 3 + i * 2) * 2), Math.round(t - 1 - p * 9), 2, 2);
  }
  g.globalAlpha = 1;
}
