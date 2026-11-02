/**
 * Cottage insides, one sort to a function: a one-room cottage, one with a back room behind a wall, a
 * weaver's, a smith's, a store, and any of the first two turned over and smashed. Each varies its size,
 * floor and where things stand from the seed's Rng.
 */
import { b, freeSpot, p, type Layout } from './housekit.js';
import type { Rng } from './rng.js';

const wood = (rng: Rng) => (rng.next() < 0.65 ? 'planks' : 'dirt') as Layout['floor'];

/** One room: a hearth on the back wall, a bed or two, a table and bench. */
export function cottage(rng: Rng): Layout {
  const w = 9 + rng.int(3), h = 7 + rng.int(2), beds = 1 + rng.int(2), hx = w - 3.1 - rng.range(0, 0.8);
  const hearth = b('hearth', hx, 0.05, 2.2, 0.9), blocks = [hearth];
  for (let i = 0; i < beds; i++) blocks.push(b('bed', 0.5 + i * 1.6, 0.4, 1.2, 2));
  const sx = 0.6 + beds * 1.6;
  if (sx + 1.6 < hx - 0.8) blocks.push(b('shelf', sx, 0.05, Math.min(2, hx - 0.8 - sx), 0.5));
  const tx = w / 2 + (rng.next() < 0.5 ? -1.6 : 1.9);
  blocks.push(b('bench', tx - 0.9, 4.65, 1.8, 0.5));
  const props = [{ kind: 'table' as const, x: tx, y: 3.75 }, { kind: rng.next() < 0.5 ? 'barrel' as const : 'crate' as const, x: w - 0.9, y: h - 2 }];
  if (rng.next() < 0.5) blocks.push(b('sacks', 0.4, h - 2.3, 1.3, 1));
  return {
    name: 'THE COTTAGE', w, h, floor: wood(rng), blocks, rounds: [], props, hearth,
    stand: [p(2.4, 3.4), p(w - 2.4, 3.3), p(w / 2, 2.3), p(2.2, 5.6), p(w - 2.2, 5.4)],
    sleep: [p(hx + 1.1, 1.75), p(1.2, 3.1)], hide: p(w - 0.9, 2.2), body: p(w / 2 - 0.4, 2.9),
  };
}

/** A wall across with a doorway in it: beds and the hearth in the back room, the table out front. */
export function backroom(rng: Rng): Layout {
  const w = 10 + rng.int(3), h = 9, py = 3.6 + rng.range(0, 0.4), left = rng.next() < 0.5;
  const gx = left ? rng.range(1.4, w / 2 - 2.4) : rng.range(w / 2 + 0.8, w - 3.1), gw = 1.8;
  const blocks = [b('partition', 0, py, gx, 0.35), b('partition', gx + gw, py, w - gx - gw, 0.35)];
  // The back room: beds along the far side from the doorway, the hearth on the near side.
  const beds = 1 + rng.int(2);
  for (let i = 0; i < beds; i++) blocks.push(b('bed', left ? w - 1.7 - i * 1.6 : 0.5 + i * 1.6, 0.35, 1.2, 2));
  const hx = left ? gx + gw + 0.4 : gx - 2.6, hearth = b('hearth', Math.max(0.4, Math.min(w - 2.6, hx)), 0.05, 2.2, 0.9);
  blocks.push(hearth);
  // The front room: a table, a bench, sacks or a counter along a wall.
  const fy = py + 0.35, tx = w / 2 + (left ? 2 : -2);
  blocks.push(b('bench', tx - 0.9, fy + 2.5, 1.8, 0.5));
  if (rng.next() < 0.5) blocks.push(b('counter', left ? 0.4 : w - 1.2, fy + 0.4, 0.8, 2));
  else blocks.push(b('sacks', left ? 0.4 : w - 1.7, fy + 0.4, 1.3, 1));
  const props = [{ kind: 'table' as const, x: tx, y: fy + 1.5 }, { kind: 'barrel' as const, x: left ? w - 0.9 : 0.9, y: h - 2.2 }];
  const bedEdge = left ? w - 1.7 - (beds - 1) * 1.6 - 0.7 : 0.5 + beds * 1.6 + 0.5;
  return {
    name: 'THE COTTAGE', w, h, floor: wood(rng), blocks, rounds: [], props, hearth,
    stand: [p(2.4, fy + 1.2), p(w - 2.4, fy + 1.4), p(w / 2, fy + 0.9), p(gx + gw / 2, py - 1)],
    sleep: [p(bedEdge, 1.5), p(hearth.x + 1.1, 1.7)], hide: p(left ? 0.9 : w - 0.9, 1.3), body: p(w / 2 + (left ? -2.2 : 2.2), fy + 2.2),
  };
}

/** A weaver's: two looms, cloth on the shelves, wool in sacks, a bed in the corner. */
export function weaver(rng: Rng): Layout {
  const w = 10 + rng.int(2), h = 8, hx = w - 3;
  const hearth = b('hearth', hx, 0.05, 2.2, 0.9);
  const blocks = [hearth, b('shelf', 0.5, 0.05, 4.8, 0.5), b('loom', 0.7, 1.45, 2, 0.8), b('loom', 3.4, 1.45, 2, 0.8), b('bed', w - 1.6, 2.2, 1.2, 2), b('sacks', 0.4, h - 2.4, 1.4, 1)];
  if (rng.next() < 0.5) blocks.push(b('sacks', 2, h - 2.4, 1.2, 1));
  return {
    name: "THE WEAVER'S COTTAGE", w, h, floor: 'planks', blocks, rounds: [], props: [{ kind: 'crate', x: w - 1, y: h - 2 }], hearth,
    stand: [p(1.9, 3.4), p(4.4, 3.2), p(w - 3, 3.4), p(w / 2 + 0.6, 2.6)],
    sleep: [p(hx + 1.1, 1.75), p(w - 2.6, 4.7)], hide: p(w - 2.2, 5.4), body: p(3, 4.5),
  };
}

/** A smith's: the forge on the back wall, an anvil before it, tools racked, a bench, charcoal in sacks. */
export function smith(rng: Rng): Layout {
  const w = 11 + rng.int(2), h = 8, fx = 0.8 + rng.range(0, 1.4);
  const hearth = b('hearth', fx, 0.05, 2.6, 1.1);
  const blocks = [hearth, b('anvil', fx + 0.7, 2.6, 1.2, 0.6), b('rack', w - 4.6, 0.05, 3, 0.5), b('bench', w - 3.8, 2.5, 2.6, 0.7), b('sacks', 0.4, h - 2.4, 1.4, 1)];
  return {
    name: 'THE SMITHY', w, h, floor: rng.next() < 0.5 ? 'dirt' : 'flagstone', blocks, rounds: [], hearth,
    props: [{ kind: 'barrel', x: fx + 3.5, y: 1.3 }, { kind: 'crate', x: w - 1, y: h - 2.1 }],
    stand: [p(fx + 1.3, 4), p(w - 2.5, 4), p(w / 2, 2.1), p(3, 5.5)],
    sleep: [p(fx + 3.4, 2.7), p(w - 2.2, 5.5)], hide: p(w - 0.9, 1.5), body: p(fx + 2.9, 4.6),
  };
}

/** A store: sacks along the back, shelves, crates and barrels stacked wherever they'd fit. */
export function store(rng: Rng): Layout {
  const w = 10 + rng.int(4), h = 7 + rng.int(2), blocks = [];
  for (let x = 0.5; x + 2 < w - 0.4; x += 2.4) blocks.push(rng.next() < 0.7 ? b('sacks', x, 0.1, 2, 1) : b('shelf', x, 0.05, 2, 0.5));
  if (rng.next() < 0.5) blocks.push(b('counter', 0.4, 2.4, 0.8, 2));
  const l: Layout = {
    name: 'THE STOREHOUSE', w, h, floor: rng.next() < 0.6 ? 'dirt' : 'flagstone', blocks, rounds: [], props: [],
    stand: [p(2.6, 2.8), p(w - 2.6, 2.8), p(w / 2, 2.3), p(2.8, 4.6), p(w - 2.8, 4.6)],
    sleep: [p(1.5, 2), p(w - 1.5, 2)], hide: p(w - 1, h - 2.5), body: p(w / 2 - 2, 3.6),
  };
  for (let i = 0, n = 4 + rng.int(4); i < n; i++) {
    const at = freeSpot(l, rng, 0.42, 1.6, l.h - 1.4);
    if (at) l.props.push({ kind: rng.pick(['crate', 'crate', 'barrel', 'barrel', 'oil'] as const), ...at });
  }
  return l;
}

/** One of the ordinary cottages, turned over: the furniture smashed, the table in pieces on the floor. */
export function looted(rng: Rng): Layout {
  const l = rng.next() < 0.5 ? cottage(rng) : backroom(rng);
  for (const q of l.blocks) if (q.kind !== 'hearth' && q.kind !== 'partition') q.look = 1;
  l.props = l.props.filter((q) => q.kind !== 'table');
  for (let i = 0, n = 4 + rng.int(3); i < n; i++) {
    const at = freeSpot(l, rng, 0.25, 1, l.h - 1);
    if (at) l.props.push({ kind: rng.next() < 0.6 ? 'plank' : 'stave', ...at });
  }
  return l;
}
