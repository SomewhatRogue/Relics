/**
 * A shanty: shacks of scrap boards and sailcloth and tents crowded either side of a muddy path that
 * twists up through them, cookfires and washing lines in the gaps, crates and barrels everywhere, a
 * latrine ditch down one side. In the woods (the Charcoal Camps) the charcoal clamps smoke on their
 * ash and the trees close in round it; by a river (Brokenbridge) it crowds the near bank.
 */
import type { Ground } from './sites.js';
import { block, line, mark, newSite, patch, path, prop, round, type Site } from './sitekit.js';
import type { Rng } from './rng.js';
import { bridgeBits } from './river.js';

export function camp(rng: Rng, g: Ground): Site {
  const s = newSite('mud', 'trees'), M = g.w / 2, H = g.h, woods = g.kind === 'forest', d = g.dress ?? rng;
  rng = d;
  const pts: [number, number][] = [[M, H], [M - 1.6, 19], [M + 1.6, 14], [M - 1.4, 9], [M + 1.2, 4], [M, 0]];
  // Over a river with its bridge gone, the path comes to the bank and starts again on the far side.
  const r = g.river?.bridge ? g.river : null, ways = r ? [[...pts.filter(([, y]) => y > r.y + r.h + 0.6), [M, r.y + r.h + 0.6]], [[M, r.y - 0.6], ...pts.filter(([, y]) => y < r.y - 0.6)]] as [number, number][][] : [pts];
  for (const p of ways) path(s, 'earth', p, 1.1), path(s, 'mud', p, 0.45);
  // Rows of shacks and tents either side, each pushed up against the path, gaps between for yards.
  for (let y = 1.2 + rng.range(0, 0.6); y < H - 4.2; y += rng.range(2.8, 3.4)) for (const sx of [-1, 1]) {
    let edge = M + sx * rng.range(2.3, 3.4);
    for (let k = 0; k < 3; k++) {
      const r = rng.next(), w = r < 0.5 ? rng.range(2.2, 3.2) : 2.2, h = r < 0.5 ? rng.range(1.4, 1.9) : 1.5, x = sx < 0 ? edge - w : edge, yy = y + rng.range(-0.7, 0.7);
      if (x < 0.6 || x + w > g.w - 0.6) break;
      if (r < 0.5) block(s, 'shack', x, yy, w, h);
      else if (r < 0.7) block(s, 'tent', x, yy, w, h);
      else if (r < 0.8) {
        // Nothing here but trodden mud.
      }
      else {
        // A yard: a cookfire on its ash, a washing line, the clutter.
        round(s, 'cookfire', x + w / 2, y + 0.8, 0.3), patch(s, 'ash', x + w / 2 - 0.9, y + 0.3, 1.8, 1.1);
        if (rng.next() < 0.6) round(s, 'washline', x, y + 2.2, 0.12);
      }
      if (rng.next() < 0.35) prop(s, rng.pick(['crate', 'barrel', 'crate', 'oil'] as const), sx < 0 ? x - 0.5 : x + w + 0.5, y + 1.6);
      edge += sx * (w + rng.range(1.1, 2.2));
    }
  }
  // The latrine ditch down one side, the wet seeping out of it.
  const lx = rng.next() < 0.5 ? 0.9 : g.w - 0.9;
  line(s, 'wet', lx, 2, lx, H - 5, 0.5), mark(s, 'drag', lx - 0.3, 3, 0.6, H - 9);
  if (g.river?.bridge) {
    // Brokenbridge: the bridge's two ends over the water, its middle gone (shared/river.ts).
    const bits = bridgeBits(g.river), f = g.river.fords[0];
    s.marks.push(...bits.marks);
    path(s, 'earth', [[M, g.river.y + g.river.h + 3], [f.x + f.w / 2, g.river.y + g.river.h + 0.6]], 0.8), path(s, 'earth', [[f.x + f.w / 2, g.river.y - 0.6], [M, g.river.y - 3.2]], 0.8);
    patch(s, 'mud', f.x - 0.7, g.river.y + g.river.h - 0.3, f.w + 1.4, 1.6), patch(s, 'mud', f.x - 0.7, g.river.y - 1.3, f.w + 1.4, 1.6);
  } else if (g.kind === 'river') {
    // Where the bridge was: its stones heaped on both banks, its boards in the water.
    const river = g.water.filter((w) => w.deep).sort((a, b) => b.w - a.w)[0];
    if (river) {
      const bx = river.x + river.w / 2;
      mark(s, 'debris', bx - 1.6, river.y - 1.4, 3.2, 1.2), mark(s, 'debris', bx - 1.6, river.y + river.h + 0.1, 3.2, 1.2);
      mark(s, 'planks', bx - 1.4, river.y + 0.6, 2.8, 0.5), mark(s, 'planks', bx - 0.6, river.y + 1.5, 0.5, 0.9);
    }
  }
  if (woods) {
    // Charcoal clamps smoking on their ash; the trees close in at the back and the sides.
    for (const [x, y] of [[3.6, H - 3.6], [g.w - 3.6, H - 3.2]]) patch(s, 'ash', x - 2, y - 1.2, 4, 2.4), round(s, 'clamp', x, y, 0.9);
    for (let x = 1; x < g.w; x += rng.range(1.6, 2.6)) if (Math.abs(x - M) > 2.2) round(s, rng.next() < 0.5 ? 'pine' : 'tree', x, 0.7, 0.5);
  }
  return s;
}
