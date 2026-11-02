/**
 * Barn insides: a row of stalls along the back with hay out front, or an open threshing floor heaped
 * with hay round the roof posts and a cart left standing. Dirt floors, a place for a lantern post.
 */
import { b, freeSpot, p, type Layout } from './housekit.js';
import type { Round } from './arena.js';
import type { Rng } from './rng.js';

/** Stalls along the back wall, roof posts in front of them, a few bales, feed sacks in the corner. */
export function stalls(rng: Rng): Layout {
  const w = 14 + rng.int(3), h = 9 + rng.int(2), n = 3 + rng.int(2), blocks = [];
  let x = 0.5;
  for (let i = 0; i < n && x + 2.4 < w - 2.8; i++, x += 2.5) blocks.push(b('pen', x, 0.05, 2.4, 2.2));
  blocks.push(b('sacks', w - 2.4, 0.1, 2, 1));
  const rounds: Round[] = [];
  for (let sx = 2.8; sx < w - 1; sx += 4.4) rounds.push({ x: sx, y: 3.6, r: 0.3, kind: 'support' });
  const l: Layout = {
    name: 'THE BARN', w, h, floor: 'dirt', blocks, rounds, props: [],
    stand: [p(2.4, 4.6), p(w - 3, 4.4), p(w / 2, 3.2), p(3, 6.2), p(w - 3, 6.4)],
    sleep: [], hide: p(w - 1.2, 2.4), body: p(4.6, 5.6), lamp: p(w / 2 + 2.2, 3.6),
  };
  bales(l, rng, 2 + rng.int(2), 4.4);
  if (rng.next() < 0.6) l.props.push({ kind: rng.next() < 0.5 ? 'barrel' : 'crate', x: 0.9, y: h - 2.2 });
  return l;
}

/** An open floor: bales heaped about two rows of posts, a cart against the back, sacks of grain. */
export function haybarn(rng: Rng): Layout {
  const w = 13 + rng.int(3), h = 9, blocks = [b('cart', 0.6, 0.6, 2.8, 1.2), b('sacks', w - 2.6, 0.1, 2, 1)];
  if (rng.next() < 0.5) blocks.push(b('sacks', w - 2.6, 1.4, 2, 1));
  const rounds: Round[] = [];
  for (const y of [2.8, 5.6]) for (const fx of [0.3, 0.7]) rounds.push({ x: w * fx, y, r: 0.3, kind: 'support' });
  const l: Layout = {
    name: 'THE BARN', w, h, floor: 'dirt', blocks, rounds, props: [],
    stand: [p(2.2, 3.6), p(w - 2.4, 3.8), p(w / 2, 2.4), p(2.6, 6.4), p(w - 2.6, 6.2)],
    sleep: [], hide: p(w / 2, 1.2), body: p(w / 2 + 2, 4.2), lamp: p(w * 0.3 + 1.1, 2.8),
  };
  bales(l, rng, 4 + rng.int(3), 1.6);
  return l;
}

/** Hay bales where there's room (below `y0`), each with a hollow beside it to sleep in. */
function bales(l: Layout, rng: Rng, n: number, y0: number): void {
  for (let i = 0; i < n; i++) {
    const at = freeSpot(l, rng, 0.6, y0, l.h - 1.2);
    if (!at) continue;
    l.rounds.push({ ...at, r: 0.6, kind: 'hay' });
    if (l.sleep.length < 2 && at.y + 1 < l.h - 1) l.sleep.push(p(at.x, at.y + 1));
  }
  if (!l.sleep.length) l.sleep.push(p(2.4, l.h - 2.6));
}
