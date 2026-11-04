/**
 * Layout 3's transitions where the ground changes under you (slice 4): the causeway, a raised track
 * with bog water close on both sides and reeds at its edge (straight, a dog-leg, or broken, a gap to
 * wade); a ford where the river spreads into the fen; Wickhold's outfall, a riverbank with the culvert
 * in the wall above it; and the mine's head, a yard of spoil and ore carts below the adit in the rock.
 * The adit and the culvert are the way on (out at the top: shared/nodeports.ts PORTS).
 */
import { bankBy, cover, offset } from './portkit.js';
import type { Rng } from './rng.js';
import { begin3, country, ruts3 } from './siteopen.js';
import { ford3 } from './siteopen.js';
import type { Ground } from './sites.js';
import { block, mark, patch, path, round, type Site } from './sitekit.js';
import { along } from './spine.js';

export function causeway(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng);
  // The causeway itself: packed earth raised a little, boards laid over the soft places.
  path(b.s, 'earth', b.main, 1.25), path(b.s, b.mat, b.main, 0.8);
  for (const p of along(b.main, 2.8)) if (p.t > 0.1 && p.t < 0.9 && rng.next() < 0.6) mark(b.s, 'planks', p.x - 0.7, p.y - 0.4, 1.4, 0.8);
  // Reeds at its edge where the water comes up to it; hedges where it leaves the fields.
  bankBy(b.s, rng, b.skinAt, b.main, 1.5, b.w, b.h, (t) => rng.next() < 0.35), bankBy(b.s, rng, b.skinAt, b.main, -1.5, b.w, b.h, (t) => rng.next() < 0.35);
  for (const q of g.water) if (q.deep && rng.next() < 0.25) round(b.s, rng.next() < 0.2 ? 'stump' : 'reed', q.x + rng.range(0.3, Math.max(0.4, q.w - 0.3)), q.y + 0.5, 0.3);
  country(b, rng, b.lines, 2.2);
  // Nothing dry stands in the water.
  b.s.rounds = b.s.rounds.filter((r) => r.kind === 'reed' || r.kind === 'stump' || !g.water.some((q) => q.deep && r.x > q.x && r.x < q.x + q.w && r.y > q.y && r.y < q.y + q.h));
  b.s.blocks = b.s.blocks.filter((r) => !g.water.some((q) => q.deep && r.x + r.w > q.x && r.x < q.x + q.w && r.y + r.h > q.y && r.y < q.y + q.h));
  return b.s;
}

export function fenford(rng: Rng, g: Ground): Site {
  // The river with its shallows, and the fen's pools spreading off it downstream.
  const s = ford3(rng, g);
  for (const q of g.water) if (!q.deep && q.h <= 1 && rng.next() < 0.4) round(s, 'reed', q.x + rng.range(0, q.w), q.y - 0.35, 0.3);
  return s;
}

export function outfall(rng: Rng, g: Ground): Site {
  const s = ford3(rng, g), ex = g.spec!.outs![0].at, l = g.spec!.layout;
  // The culvert's mouth in the wall: its runnel down to the river, iron bars either side (or torn out and thrown down).
  patch(s, 'wet', ex - 1.2, 0, 2.4, 3.2), mark(s, 'gutter', ex - 0.4, 0.6, 0.8, 4);
  if (l === 'grate') for (const sx of [-1, 1]) block(s, 'fence', ex + sx * 1.6 - 0.2, 0.2, 0.4, 1.4);
  else mark(s, 'debris', ex + 1.4, 1.2, 2.2, 1.1), block(s, 'rubble', ex - 3.8, 1, 1.8, 1);
  return s;
}

export function minehead(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout, ex = g.spec!.outs![0].at, side = l === 'left' ? -1 : 1;
  path(b.s, b.mat, b.main, 1.2), ruts3(b);
  // The adit: pit props either side of the way into the rock, trodden spoil before it.
  for (const sx of [-1, 1]) round(b.s, 'support', ex + sx * 1.7, 1.2, 0.3), round(b.s, 'support', ex + sx * 1.7, 2.6, 0.3);
  patch(b.s, 'ash', ex - 3, 0.2, 6, 4);
  // Spoil heaps on the headframe's side, ore carts left on their ruts.
  for (let i = 0, t = 0; i < 4 && t < 40; t++) {
    const p = offset(b.main, side * rng.range(3.4, 6.5), 1).find((q) => q.t > 0.25 && q.t < 0.9 && rng.next() < 0.12);
    if (p && p.x > 2 && p.x < b.w - 3 && p.y > 3 && p.y < b.h - 3) block(b.s, 'rubble', p.x - 1.3, p.y - 0.7, 2.6, 1.4), i++;
  }
  const c = offset(b.main, -side * 2.8, 1).find((q) => q.t > 0.5 && q.y > 3);
  if (c) block(b.s, 'cart', c.x - 1.2, c.y - 0.5, 2.4, 1);
  bankBy(b.s, rng, () => 'rock', b.main, -side * 2.6, b.w, b.h, (t) => t > 0.85 || rng.next() < 0.3);
  cover(b.s, rng, 'rock', b.lines, b.w, b.h, 2);
  country(b, rng, b.lines, 3);
  return b.s;
}
