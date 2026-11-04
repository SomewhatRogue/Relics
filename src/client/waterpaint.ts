/**
 * Water on the floor painting (both views: the 3D floor is this painting laid flat). Deep water runs
 * dark with slow ripples and you can't wade it. A ford is plainly the way over: paler shallows with
 * the sandy bottom showing, a line of stepping stones across, and white water breaking at its edges
 * where the deep begins. Bog pools and streams are shallow without the stones in a line.
 */
import type { GameMap, Water } from '../shared/arena';
import type { Rng } from '../shared/rng';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

const touches = (a: Water, b: Water) => Math.abs(a.y - b.y) < 0.6 && (Math.abs(a.x + a.w - b.x) < 0.05 || Math.abs(b.x + b.w - a.x) < 0.05);

export function paintWater(m: GameMap, rect: Rect, rng: Rng, toPx: (x: number, y: number) => [number, number], PX: number): void {
  const all = m.water ?? [];
  for (const wt of all) {
    const [x0, y0] = toPx(wt.x, wt.y), w = Math.round(wt.w * PX), h = Math.round(wt.h * PX);
    const ford = !wt.deep && all.some((d) => d.deep && touches(wt, d));
    rect(x0 - 1, y0 - 1, w + 2, h + 2, wt.deep ? '#1a2a22' : '#3a3a2a');
    rect(x0, y0, w, h, wt.deep ? '#122036' : ford ? '#557a7c' : '#3e5a62');
    if (wt.deep) {
      for (let i = 0; i < (w * h) / 60; i++) rect(x0 + rng.int(Math.max(1, w - 3)), y0 + rng.int(h), 3, 1, rng.next() < 0.5 ? '#1a2c46' : '#22405c');
      // The current: long faint streaks across.
      for (let i = 0; i < w / 14; i++) rect(x0 + rng.int(Math.max(1, w - 8)), y0 + 2 + rng.int(Math.max(1, h - 4)), 6 + rng.int(4), 1, '#2a4a66');
    } else {
      // The bottom showing through: sand and pebbles.
      for (let i = 0; i < (w * h) / (ford ? 9 : 14); i++) rect(x0 + rng.int(Math.max(1, w - 2)), y0 + rng.int(h), 2, 1, rng.next() < 0.5 ? (ford ? '#8a8666' : '#6a6a52') : '#5e7a76');
      if (ford) {
        // Stepping stones in a line across, a little off true, each with its lit top and a dark wet foot.
        const cx = x0 + Math.floor(w / 2);
        for (let y = y0 + 2, k = 0; y < y0 + h - 3; y += 6, k++) {
          const x = cx - 3 + (k % 2 ? 2 : -2) + rng.int(2);
          rect(x, y, 6, 4, '#8e8a78'), rect(x + 1, y, 4, 1, '#b8b4a0'), rect(x, y + 4, 6, 1, '#2e3e44');
        }
        // White water where it breaks over the lip into the deep, either side.
        for (const d of all) if (d.deep && touches(wt, d)) {
          const ex = d.x > wt.x ? x0 + w - 2 : x0;
          for (let y = y0; y < y0 + h; y += 2) if (rng.next() < 0.75) rect(ex + rng.int(2), y, 2, 1, rng.next() < 0.5 ? '#c8dcdc' : '#9ab8bc');
        }
      } else for (let y = y0 + 4; y < y0 + h - 3; y += 7) {
        const x = x0 + 3 + rng.int(Math.max(1, w - 10));
        rect(x, y, 5, 3, '#8a8474'), rect(x + 1, y, 3, 1, '#a8a290'), rect(x, y + 3, 5, 1, '#2e3e44');
      }
    }
    rect(x0, y0, w, 1, wt.deep ? '#2a4a5a' : ford ? '#a2c0c0' : '#7a9a9a');
  }
}
