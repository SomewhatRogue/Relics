/**
 * The big houses, on long and deep jobs: a longhouse with rooms off its hall, a manor with a back wing
 * walled off the hall, and a tithe barn. Wider and deeper than a cottage, still one door at the front.
 */
import { b, freeSpot, p, type Layout } from './housekit.js';
import type { Block, Round } from './arena.js';
import type { Rng } from './rng.js';

const GAP = 1.9;
/** A wall from a to b along x (at y) or along y (at x), with a doorway of GAP starting at `gap`. */
function wall(out: Block[], along: 'x' | 'y', at: number, a: number, z: number, gap: number): void {
  const t = 0.35, seg = (s: number, e: number) => e - s > 0.2 && out.push(along === 'x' ? b('partition', s, at, e - s, t) : b('partition', at, s, t, e - s));
  seg(a, gap), seg(gap + GAP, z);
}

/** A hall across the front, two or three rooms off it at the back, each through its own doorway. */
export function longhouse(rng: Rng): Layout {
  const w = 18 + rng.int(3), h = 11, py = 4.6, n = 2 + rng.int(2), blocks: Block[] = [], rooms: number[] = [];
  for (let i = 0; i <= n; i++) rooms.push((w * i) / n);
  for (let i = 1; i < n; i++) blocks.push(b('partition', rooms[i] - 0.17, 0, 0.35, py));
  const gaps = rooms.slice(0, n).map((x0, i) => x0 + 0.6 + rng.range(0, rooms[i + 1] - x0 - GAP - 1.2));
  for (let i = 0; i < n; i++) wall(blocks, 'x', py, rooms[i] + (i ? 0.18 : 0), rooms[i + 1] - (i < n - 1 ? 0.18 : 0), gaps[i]);
  // The back rooms: beds in one, the hearth in the next, stores in the last.
  const hr = rng.int(n), hx = (rooms[hr] + rooms[hr + 1]) / 2 - 1.1, hearth = b('hearth', hx, 0.05, 2.2, 0.9);
  blocks.push(hearth);
  for (let i = 0; i < n; i++) {
    if (i === hr) continue;
    const x0 = rooms[i] + 0.5, rw = rooms[i + 1] - rooms[i] - 1;
    if (i % 2 === 0) for (let k = 0; k < Math.min(3, Math.floor(rw / 1.6)); k++) blocks.push(b('bed', x0 + k * 1.6, 0.3, 1.2, 2));
    else blocks.push(b('sacks', x0, 0.1, Math.min(2.4, rw), 1), b('shelf', x0 + Math.min(2.4, rw) + 0.3, 0.05, Math.max(0.6, rw - 2.8), 0.5));
  }
  // The hall: a long table by one wall, barrels by the other.
  const left = rng.next() < 0.5, tx = left ? 1 : w - 5.6;
  blocks.push(b('bench', tx, 6.2, 4.6, 0.5), b('bench', tx, 8, 4.6, 0.5));
  const props = [{ kind: 'table' as const, x: tx + 1.3, y: 7.25 }, { kind: 'table' as const, x: tx + 3.3, y: 7.25 }, { kind: 'barrel' as const, x: left ? w - 1 : 1, y: 6 }, { kind: 'barrel' as const, x: left ? w - 1 : 1, y: 7 }];
  const far = rooms[left ? n - 1 : 0];
  return {
    name: 'THE LONGHOUSE', w, h, floor: rng.next() < 0.6 ? 'planks' : 'dirt', blocks, rounds: [], props, hearth,
    stand: [p(w / 2, 5.9), p(left ? w - 3 : 3, 8.5), p(gaps[0] + 1, 2.8), p(gaps[n - 1] + 1, 2.9), p(w / 2 + 2, 8.6)],
    sleep: [p(rooms[0] + 1.1, 3.2), p(hx + 1.1, 1.75)], hide: p(left ? w - 0.9 : 0.9, py - 1), body: p(far + (rooms[1] - rooms[0]) / 2, 3.2),
  };
}

/** A hall with the hearth and a long table, and a back wing behind a wall: a bedroom, and a room for stores. */
export function manor(rng: Rng): Layout {
  const w = 20 + rng.int(2), h = 12, wx = w - 6.4, wy = 4.8, blocks: Block[] = [];
  wall(blocks, 'y', wx, 0, h, 6.4 + rng.range(0, 1.6));
  wall(blocks, 'x', wy, wx + 0.35, w, wx + 0.9 + rng.range(0, 2.4));
  const hx = 2 + rng.range(0, wx - 7), hearth = b('hearth', hx, 0.05, 2.6, 1);
  blocks.push(hearth, b('shelf', hx + 3.2, 0.05, 2.6, 0.5), b('rack', 0.4, 0.05, Math.max(1.2, hx - 0.8), 0.5));
  // The table, long and set for many.
  const tx = wx / 2 - 3;
  blocks.push(b('bench', tx, 3.6, 6, 0.5), b('bench', tx, 5.4, 6, 0.5));
  // The wing: beds at the back, sacks and a counter at the front.
  blocks.push(b('bed', wx + 0.8, 0.3, 1.2, 2), b('bed', wx + 2.6, 0.3, 1.2, 2), b('sacks', w - 2, 0.2, 1.6, 1));
  blocks.push(b('counter', w - 1.3, wy + 1.4, 0.8, 2.2), b('sacks', wx + 0.8, h - 2.2, 1.6, 1));
  const props = [{ kind: 'table' as const, x: tx + 1.5, y: 4.65 }, { kind: 'table' as const, x: tx + 4.5, y: 4.65 }, { kind: 'crate' as const, x: 1, y: h - 2 }];
  return {
    name: 'THE MANOR', w, h, floor: rng.next() < 0.5 ? 'flagstone' : 'planks', blocks, rounds: [], props, hearth,
    stand: [p(wx / 2, 2.4), p(2.4, 7.5), p(wx - 2, 7.8), p(wx + 3.2, 7.8), p(w / 2 - 2, 9.4)],
    sleep: [p(wx + 2.1, 3.3), p(hx + 1.3, 1.9)], hide: p(w - 1, 3.2), body: p(tx + 3, 7.3),
  };
}

/** A great barn on posts: grain in bays along the back and sides, bales, a cart, a lantern on a post. */
export function tithebarn(rng: Rng): Layout {
  const w = 20 + rng.int(3), h = 12, blocks: Block[] = [], rounds: Round[] = [];
  for (let x = 0.5; x + 2.2 < w - 0.5; x += 3.2) blocks.push(rng.next() < 0.7 ? b('sacks', x, 0.1, 2.2, 1) : b('pen', x, 0.05, 2.6, 2.2));
  blocks.push(b('sacks', 0.3, 4.5, 1, 2), b('sacks', w - 1.3, 4.5, 1, 2), b('cart', w - 4.6, h - 3.4, 2.8, 1.2));
  for (const y of [3.6, 7.4]) for (let x = 3.6; x < w - 2; x += 4.4) rounds.push({ x, y, r: 0.32, kind: 'support' });
  const l: Layout = {
    name: 'THE TITHE BARN', w, h, floor: 'dirt', blocks, rounds, props: [],
    stand: [p(2.6, 5.4), p(w - 3, 5.6), p(w / 2, 2.6), p(5, 9.4), p(w - 6, 9.2)],
    sleep: [], hide: p(w - 1.5, 2.6), body: p(w / 2 - 3, 5.6), lamp: p(w / 2 + 2.2, 5.5),
  };
  for (let i = 0, n = 4 + rng.int(4); i < n; i++) {
    const at = freeSpot(l, rng, 0.6, 2, h - 1.4);
    if (!at) continue;
    l.rounds.push({ ...at, r: 0.6, kind: 'hay' });
    if (l.sleep.length < 2 && at.y + 1 < h - 1) l.sleep.push(p(at.x, at.y + 1));
  }
  if (!l.sleep.length) l.sleep.push(p(2.4, h - 2.6));
  for (let i = 0; i < 2; i++) {
    const at = freeSpot(l, rng, 0.42, 2, h - 1.4);
    if (at) l.props.push({ kind: i ? 'barrel' : 'crate', ...at });
  }
  return l;
}
