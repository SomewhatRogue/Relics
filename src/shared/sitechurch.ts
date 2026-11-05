/**
 * Layout 4's old ground in the fields (docs/terrain-nodes.md 2.3, 2.7): a valley churchyard (a small
 * church, its belfry empty like every bell's but the town's; rows of headstones, the graves' mounds, a
 * yew, a low wall with a gap at the lych) and the barrows, grassed mounds older than the villages with
 * standing stones round them. Neither says whose they were.
 */
import { across, cover, offset } from './portkit.js';
import type { Rng } from './rng.js';
import { begin3, country } from './siteopen.js';
import { scatter } from './siteskin.js';
import type { Ground } from './sites.js';
import { block, mark, patch, path, round, type Site } from './sitekit.js';
import { along, offAll } from './spine.js';

export function churchyard(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), aside = g.spec!.layout === 'aside', sd = rng.next() < 0.5 ? -1 : 1;
  path(b.s, b.mat, b.main, 0.9);
  patch(b.s, 'grass', 1.5, 1.5, b.w - 3, b.h - 3);
  // The church: at the far end, or to one side of the path, back from it.
  const at = [...offset(b.main, sd * (aside ? 6.4 : 5.4), 1), ...offset(b.main, -sd * 5.8, 1)].find((p) => p.t > (aside ? 0.35 : 0.55) && p.t < 0.9 && p.x > 4 && p.x < b.w - 5 && p.y > 3.5 && p.y < b.h - 6 &&
    !g.water.some((q) => p.x + 2.8 > q.x - 0.8 && p.x - 2.8 < q.x + q.w + 0.8 && p.y + 1.8 > q.y - 0.8 && p.y - 1.8 < q.y + q.h + 0.8));
  if (at) block(b.s, 'church', at.x - 2.4, at.y - 1.6, 4.8, 3.2);
  // The graves: headstones in rows off the path, a mound in front of each; the yew.
  for (const p of along(b.main, 1.6)) for (const d of [2.6, 3.8, 5]) for (const s of [-1, 1]) {
    const x = p.x - p.dy * d * s, y = p.y + p.dx * d * s;
    if (p.t < 0.15 || p.t > 0.85 || x < 1.5 || x > b.w - 1.5 || y < 2 || y > b.h - 3 || offAll(b.lines, x, y) < 2.2 || rng.next() < 0.35) continue;
    // A headstone, or (poorer graves) a mound with its wooden cross.
    if (rng.next() < 0.65) round(b.s, 'headstone', x, y, 0.22);
    else mark(b.s, 'mound', x - 0.45, y - 0.2, 0.9, 0.6);
  }
  scatter(b.s, rng, b.w, b.h, b.lines, 3, 1, (x, y) => round(b.s, 'tree', x, y, 0.9), 3);
  // The low wall round it, its gap where the path comes through.
  across(b.s, rng, 'rock', b.main, 0.18, b.w, b.h, 1.2);
  cover(b.s, rng, 'fields', b.lines, b.w, b.h, 1);
  country(b, rng, b.lines, 6);
  return b.s;
}

export function barrows(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), stones = g.spec!.layout === 'stones';
  path(b.s, b.mat, b.main, 0.85);
  patch(b.s, 'grass', 1, 1, b.w - 2, b.h - 2, false);
  // The mounds: long grassed humps either side of the way, older than any wall in the valley.
  for (let i = 0, t = 0; i < 4 && t < 40; t++) {
    const p = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * rng.range(4.2, 7), 1).find((q) => q.t > rng.range(0.15, 0.8));
    if (!p || p.x < 3.5 || p.x > b.w - 3.5 || p.y < 3 || p.y > b.h - 4) continue;
    const mw = rng.range(4, 6), mh = rng.range(2.2, 3);
    mark(b.s, 'mound', p.x - mw / 2, p.y - mh / 2, mw, mh), patch(b.s, 'grass', p.x - mw / 2 - 0.4, p.y - mh / 2 - 0.3, mw + 0.8, mh + 0.6), i++;
    // Standing stones round the biggest (or round every one, on the stones' layout).
    if (stones || i === 1) for (let a = 0; a < Math.PI * 2; a += 0.9) {
      const x = p.x + Math.cos(a) * (mw / 2 + 0.9), y = p.y + Math.sin(a) * (mh / 2 + 0.8);
      if (offAll(b.lines, x, y) > 1.8 && x > 1 && x < b.w - 1 && y > 1.5 && y < b.h - 2) round(b.s, 'pillar', x, y, 0.38);
    }
  }
  scatter(b.s, rng, b.w, b.h, b.lines, 2.2, 4, (x, y) => round(b.s, 'bush', x, y, 0.36));
  cover(b.s, rng, 'fields', b.lines, b.w, b.h, 1);
  country(b, rng, b.lines, 7);
  return b.s;
}
