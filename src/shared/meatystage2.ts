/**
 * The second three new meaty sorts staged (shared/debut.ts), each in its fork way's room in the
 * Barrowfields before it turns up in the packs:
 * - the Kegman by the DRUMS war band's long fire, its keg on its back, two of the band by it (shoot the
 *   keg and the band goes up with it: its answer, shown);
 * - the Pouncer on watch over the QUIET way's sleepers, crouched at the edge of their ring toward the way
 *   in, two more asleep at its feet;
 * - the Gorger at the side of the SMOKE way's burning house, waiting on whoever's inside, two small ones
 *   with it (the Swingle stands in front of the house). A way with no chest of its own: the room's chest is
 *   down before any of this, so it never moves.
 * Each is a pack of its own the composer leaves be (shared/meatystage.ts STAGED). No dice: the room's
 * stream is left as it was, so everything else lands where it did.
 */
import type { Foe, FoeVariant } from './terrain.js';
import type { Lay } from './vignettes.js';

type P = { x: number; y: number };
export const PACK2 = { kegman: 87, pouncer: 88, gorger: 89 } as const;

/** The free ground nearest `at` (a half-tile grid, off the walls, the way in and every goblin), or null. */
function near(l: Lay, at: P): P | null {
  let best: P | null = null, bd = Infinity;
  for (let y = 2; y <= l.H - 4.5; y += 0.5) for (let x = 1.5; x <= l.W - 1.5; x += 0.5) {
    const d = Math.hypot(x - at.x, y - at.y);
    if (d < bd && l.free(x, y, 0.5) && l.foes.every((f) => Math.hypot(f.x - x, f.y - y) > 0.8)) (best = { x, y }), (bd = d);
  }
  return best;
}

const mid = (ps: P[]): P | null => (ps.length ? { x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length } : null);

/** One of them at the free ground nearest `at`, and two small ones a step behind on either side (`more` on all three). */
function put(l: Lay, variant: FoeVariant & keyof typeof PACK2, at: P, more: Partial<Foe> = {}, company: Partial<Foe> = more, asleep = false): void {
  const p = near(l, at);
  if (!p) return;
  l.claim(p.x, p.y, 0.5);
  l.foes.push({ kind: 'scrapper', variant, role: variant, x: p.x, y: p.y, pack: PACK2[variant], ...more });
  for (const s of [-1, 1]) {
    const q = near(l, { x: p.x + s * 1.1, y: p.y - 0.7 });
    if (!q) continue;
    l.claim(q.x, q.y, 0.4), l.foes.push({ kind: 'scrapper', role: 'fodder', x: q.x, y: q.y, pack: PACK2[variant], ...company });
    if (asleep) l.sleepers.push({ x: q.x, y: q.y });
  }
}

/**
 * DRUMS: by the war band's long fire, a step behind it from the way in (the Planker stands in front). Only
 * where the war band's own chest is down (a DRUMS room whose scene found no ground puts its chest last,
 * by the room's spot finder, and a goblin more would move it).
 */
export function stageKegman(l: Lay): void {
  const band = mid(l.foes.filter((f) => f.kind === 'scrapper' && f.pack === undefined));
  if (band && l.chests?.length) put(l, 'kegman', { x: band.x + 0.9, y: band.y - 1.1 });
}

/** QUIET: on watch at the edge of the sleepers' ring nearest the way in (the bottom of the room). */
export function stagePouncer(l: Lay): void {
  const ring = mid(l.sleepers);
  if (ring) put(l, 'pouncer', { x: ring.x + 0.6, y: ring.y + 2.1 }, {}, { feeding: true }, true);
}

/** SMOKE: by the side wall of the house that's catching, waiting on what comes out. */
export function stageGorger(l: Lay): void {
  const b = l.blocks.find((k) => k.fate === 'burning') ?? l.blocks.find((k) => k.kind === 'house');
  if (b) put(l, 'gorger', { x: b.x - 1.3, y: b.y + b.h * 0.7 });
}
