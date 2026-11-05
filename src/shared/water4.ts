/**
 * The water layout 4's rooms bring (shared/frame3.ts lays it before the plan): the flooded drift's
 * water the length of it (and its sump), the reed bed's pools and channels, the mill's pond and leat,
 * a glade's spring, a cave's pool. Laid off the track, or (the drift, the channels) across it shallow,
 * so the way on is always waded, never swum.
 */
import type { Water } from './arena.js';
import type { Frame3 } from './frame3.js';
import { offset } from './portkit.js';
import type { Rng } from './rng.js';
import { along, boxOff, offAll } from './spine.js';
import { wetBeside } from './wetland.js';

const spotOf = (q: Water) => ({ x: q.x + q.w / 2, y: q.y + q.h / 2, r: Math.max(q.w, q.h) / 2 + 0.2 });
const put = (f: Frame3, q: Water): void => void (f.water.push(q), f.wet.push(spotOf(q)));
/** A box `w` by `h` centred `d` off the track at `t` along it, if it stays clear of the track by `keep`. */
function beside(f: Frame3, t: number, d: number, w: number, h: number, keep: number): Water | null {
  const p = offset(f.spine[0], d, 0.5).find((q) => q.t >= t);
  if (!p) return null;
  const q = { x: Math.max(0.6, Math.min(f.w - 0.6 - w, p.x - w / 2)), y: Math.max(1.2, Math.min(f.h - 2 - h, p.y - h / 2)), w, h };
  return boxOff(f.spine, q) >= keep ? q : null;
}

export function water4(f: Frame3, geo: Rng): void {
  const n = f.spec.node, l = f.spec.layout, main = f.spine[0];
  if (n === 'flooded') {
    // Knee-deep the length of the drift, from a third of the way in to two thirds on.
    for (const p of offset(main, 0, 0.9)) if (p.t > 0.25 && p.t < 0.78) {
      const q = { x: p.x - 1.6, y: p.y - 1.6, w: 3.2, h: 3.2 };
      if (!f.water.some((o) => Math.abs(o.x - q.x) < 0.7 && Math.abs(o.y - q.y) < 0.7)) f.water.push(q);
    }
    if (l === 'sump') for (const sd of [-1, 1]) {
      const q = beside(f, 0.5, sd * 4.2, 3.2, 2.4, 2.4);
      if (q) return put(f, { ...q, deep: true });
    }
    return;
  }
  if (n === 'reedbed') {
    for (const q of wetBeside(f.spine, f.w, f.h, 2.2, geo, 0.3, 0.7)) put(f, q);
    if (l === 'channels') {
      // Two channels across the way, shallow where the boards cross.
      for (const t of [0.35, 0.68]) {
        const p = along(main, 0.5).find((q) => q.t >= t);
        if (p) f.water.push(Math.abs(p.dx) > Math.abs(p.dy) ? { x: p.x - 0.7, y: 0.8, w: 1.4, h: f.h - 1.6 } : { x: 0.4, y: p.y - 0.7, w: f.w - 0.8, h: 1.4 });
      }
    }
    return;
  }
  if (n === 'mill') {
    // The millpond on the wheel's side, well off the lane, and its leat running away from it shallow.
    const sd = l === 'wheelleft' ? -1 : 1;
    for (const [d, w, h] of [[5.6, 5.2, 3.4], [6.6, 5.2, 3.4], [4.8, 4.2, 2.8], [4.2, 3.6, 2.4]]) for (const t of [0.5, 0.4, 0.62, 0.3, 0.72]) {
      const q = beside(f, t, sd * d, w, h, 3);
      if (!q) continue;
      put(f, { ...q, deep: true });
      const leat = { x: q.x + q.w / 2 - 0.6, y: q.y + q.h, w: 1.2, h: Math.max(0, f.h - 1.2 - q.y - q.h) };
      if (leat.h > 1 && offAll(f.spine, leat.x + 0.6, leat.y + leat.h / 2) > 1.4) f.water.push(leat);
      return;
    }
    return;
  }
  if (n === 'glade' && l === 'spring') {
    const p = main[Math.min(main.length - 2, 2)], down = f.spec.in!.side === 'W' || f.spec.in!.side === 'E';
    f.water.push(down ? { x: p[0] - 0.6, y: 0, w: 1.2, h: f.h } : { x: 0, y: p[1] - 0.6, w: f.w, h: 1.2 });
    return;
  }
  if (n === 'cave' && l === 'pool') for (const sd of [1, -1]) {
    const q = beside(f, 0.55, sd * 4.6, 4, 2.6, 2.6);
    if (q) return put(f, { ...q, deep: true }), put(f, { x: q.x - 0.8, y: q.y + q.h, w: q.w + 1.6, h: 1 });
  }
}
