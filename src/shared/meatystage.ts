/**
 * The new meaty sorts staged (shared/debut.ts), each in its fork way's room in the Barrowfields before it
 * turns up in the packs: the Planker at the front of the DRUMS war band with its barn door, the Swingle
 * in the yard of the SMOKE way's burning house, the Forker behind the CRIES way's captives, prodding them
 * along the track with its fork, one of their guards. The other two are a pack of their own with two small
 * ones (they wake on their own, and the room's budget and its specials count them first). No dice: the room's stream is left as it was, so everything else lands where it did.
 */
import { atArc } from './scenes4.js';
import type { Foe, FoeVariant } from './terrain.js';
import type { Lay } from './vignettes.js';

type P = { x: number; y: number };
/** The Forker joins the captives' guards (shared/scenes4.ts), as the chalker does; the other two bring two small ones. */
const PACK = { planker: 83, swingle: 84, forker: 82 } as const;
/** The staged packs (the composer leaves them be: shared/encounter.ts). */
export const STAGED = new Set<number>([PACK.planker, PACK.swingle]);
/** One of the new sorts, staged in this room (not one of the composer's packs). */
export const stagedSort = (f: Foe) => !!f.variant && f.variant in PACK && f.pack === PACK[f.variant as keyof typeof PACK];

/** The free ground nearest `at` (on a half-tile grid, off the walls and the way in), or null. */
function near(l: Lay, at: P): P | null {
  let best: P | null = null, bd = Infinity;
  for (let y = 2; y <= l.H - 4.5; y += 0.5) for (let x = 1.5; x <= l.W - 1.5; x += 0.5) {
    const d = Math.hypot(x - at.x, y - at.y);
    if (d < bd && l.free(x, y, 0.5)) (best = { x, y }), (bd = d);
  }
  return best;
}

const mid = (ps: P[]): P | null => (ps.length ? { x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length } : null);

function put(l: Lay, variant: FoeVariant & keyof typeof PACK, at: P | null): void {
  const p = near(l, at ?? { x: l.W / 2, y: l.H / 2 });
  if (!p) return;
  l.claim(p.x, p.y, 0.5);
  l.foes.push({ kind: 'scrapper', variant, role: variant, x: p.x, y: p.y, pack: PACK[variant] });
  // Two small ones with it, a step behind on either side (the guards are the Forker's).
  if (variant !== 'forker') for (const s of [-1, 1]) {
    const q = near(l, { x: p.x + s * 1.1, y: p.y - 0.7 });
    if (q) l.claim(q.x, q.y, 0.4), l.foes.push({ kind: 'scrapper', role: 'fodder', x: q.x, y: q.y, pack: PACK[variant] });
  }
}

/** DRUMS: before the war band, a step nearer the way in (the bottom of the room). */
export function stagePlanker(l: Lay): void {
  const band = mid(l.foes.filter((f) => f.kind === 'scrapper'));
  put(l, 'planker', band && { x: band.x, y: band.y + 1.8 });
}

/** SMOKE: in front of the house that's catching. */
export function stageSwingle(l: Lay): void {
  const b = l.blocks.find((k) => k.fate === 'burning') ?? l.blocks.find((k) => k.kind === 'house');
  put(l, 'swingle', b ? { x: b.x + b.w / 2, y: b.y + b.h + 1.4 } : null);
}

/** CRIES: a little way along the captives' track, prodding the last of them on (the track itself is kept clear). */
export function stageForker(l: Lay): void {
  const pts = l.led?.pts;
  put(l, 'forker', pts ? atArc(pts, 2.5) : null);
}
