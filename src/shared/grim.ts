/**
 * What the goblins did in a house, laid out from its seed: paint only, never a rule. The worse the place
 * and the deeper the job, the more of it; some houses stay quiet, so the bad ones land. The worst of it
 * goes where the fire catches it (the hearth, the goblins' own fire), the rest sits in the dark.
 * They eat people (the story bible), keep them like meat, and count their captives in fives.
 */
import type { Grim } from './arena.js';
import { freeSpot, type Layout, type P } from './housekit.js';
import type { Rng } from './rng.js';

type Kind = Grim['kind'];
/** How often each is picked, among those that fit the house. */
const POOL: [Kind, number][] = [['torn', 3], ['pinned', 2], ['hung', 2], ['bones', 2], ['smear', 2], ['tally', 1], ['trail', 1.5], ['pot', 1.5]];

export interface Setting { body?: P; cage?: P; fire?: P; light?: P; barn: boolean }

/** A spot on the back wall that no furniture stands in front of (x along it), near the light if we can. */
function wallSpot(l: Layout, rng: Rng, used: number[], light?: P): number | null {
  let best: number | null = null;
  for (let t = 0; t < 16; t++) {
    const x = rng.range(1.2, l.w - 1.2);
    if (l.blocks.some((q) => q.y < 1.2 && x > q.x - 1.1 && x < q.x + q.w + 1.1) || used.some((u) => Math.abs(u - x) < 2.2)) continue;
    if (best === null || (light && Math.abs(x - light.x) < Math.abs(best - light.x))) best = x;
    if (!light) break;
  }
  return best;
}

/** A spot on the floor clear of furniture and of what's already laid down, nearer the light if there is one. */
function floorSpot(l: Layout, rng: Rng, taken: Layout['props'], r: number, light?: P): P | null {
  const room = { ...l, props: [...l.props, ...taken] };
  let best: P | null = null;
  for (let t = 0; t < (light ? 3 : 1); t++) {
    const s = freeSpot(room, rng, r, 1.2, l.h - 1.4);
    if (s && (!best || (light && Math.hypot(s.x - light.x, s.y - light.y) < Math.hypot(best.x - light.x, best.y - light.y)))) best = s;
  }
  return best;
}

/** The goblins' leavings for a house at grimness `g` (shared/houses.ts). */
export function dress(l: Layout, rng: Rng, g: number, at: Setting): Grim[] {
  const out: Grim[] = [], walls: number[] = [], taken: Layout['props'] = [];
  const k = () => rng.int(1000), put = (q: Grim) => (out.push(q), taken.push({ kind: 'crate', x: q.x, y: q.y }));
  if (at.body) put({ kind: 'strewn', ...at.body, k: k() });
  // Quiet: a turned-over room and no more, or bloody hands on the wall at most.
  if (rng.next() < Math.max(0.15, 0.42 - g * 0.07)) {
    if (rng.next() < 0.3) {
      const x = wallSpot(l, rng, walls);
      if (x !== null) out.push({ kind: 'smear', x, y: 0, k: k() });
    }
    return out;
  }
  if (at.cage && rng.next() < 0.6) {
    const side = rng.next() < 0.5 ? -1.15 : 1.15, x = at.cage.x + side;
    if (x > 0.8 && x < l.w - 0.8) put({ kind: 'remains', x, y: at.cage.y + 0.25, k: k() });
  }
  const n = Math.min(5, 1 + rng.int(1 + Math.ceil(g * 0.6)));
  for (let i = 0; i < n; i++) {
    const fits = POOL.filter(([kind]) => (kind !== 'pot' || (at.fire && !out.some((q) => q.kind === 'pot'))) && (kind !== 'tally' || !out.some((q) => q.kind === 'tally')));
    let r = rng.next() * fits.reduce((s, [kind, w]) => s + (kind === 'hung' && at.barn ? w * 1.6 : w), 0), kind = fits[0][0];
    for (const [kk, w] of fits) if ((r -= kk === 'hung' && at.barn ? w * 1.6 : w) < 0) {
      kind = kk;
      break;
    }
    if (kind === 'pot') put({ kind, ...at.fire!, k: k() });
    else if (kind === 'pinned' || kind === 'smear' || kind === 'tally') {
      const x = wallSpot(l, rng, walls, kind === 'pinned' ? at.light : undefined);
      if (x !== null) walls.push(x), out.push({ kind, x, y: 0, k: k() });
    } else if (kind === 'trail') {
      // Dragged from by the wall to where it was eaten.
      const to = at.body ?? out.find((q) => q.kind === 'torn'), from = floorSpot(l, rng, taken, 0.3);
      if (to && from && Math.hypot(to.x - from.x, to.y - from.y) > 2) out.push({ kind, x: from.x, y: from.y, x2: to.x, y2: to.y, k: k() });
    } else {
      const s = floorSpot(l, rng, taken, kind === 'hung' ? 0.45 : 0.7, kind === 'torn' ? at.light : undefined);
      if (s) put({ kind, ...s, k: k() });
    }
  }
  return out;
}
