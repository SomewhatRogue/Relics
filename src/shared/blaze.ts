/**
 * A house on fire inside, planned from its seed so the rules (sim/blaze.ts) and the drawing
 * (client/blazedraw.ts) read the same fire: patches that smoke and then catch, beams that come down on
 * a warning, the roof falling in at the end. Fair by construction: the way in stays clear, and from the
 * door there's always a way to the cage that no fire crosses before the roof comes in.
 */
import type { Area, Blaze } from './arena.js';
import { freeSpot, type Layout, type P } from './housekit.js';
import type { Rng } from './rng.js';
import { HOUSEBURN, HOUSEFIRE } from './tuning.js';

/** A fallen beam's footprint, lying across where it landed. */
export const beamArea = (x: number, y: number): Area => ({ x: x - 0.9, y: y - 0.25, w: 1.8, h: 0.5 });

/** Burning now: a patch once it's caught, a beam for a while after it's down. */
export function burningAt(b: Blaze, t: number): Area[] {
  const out: Area[] = b.patches.filter((p) => t >= p.at);
  for (const m of b.beams) if (t >= m.at && t < m.at + HOUSEFIRE.beamBurn) out.push(beamArea(m.x, m.y));
  return out;
}
export const smoking = (p: { at: number }, t: number) => t >= p.at - HOUSEFIRE.warn && t < p.at;
export const inBox = (a: Area, x: number, y: number) => x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
/** The roof is about to come in (the last few seconds), or has. */
export const roofGoing = (b: Blaze, t: number) => t >= b.fall - HOUSEFIRE.fallWarn;

/** Can a hero walk from `a` to `z` without crossing a block, a round thing, heavy furniture or `fire`? */
export function reaches(l: Layout, fire: Area[], a: P, z: P, r = 0.32): boolean {
  const s = 0.25, cols = Math.ceil(l.w / s), rows = Math.ceil(l.h / s), seen = new Uint8Array(cols * rows);
  const open = (x: number, y: number) => x > r && x < l.w - r && y > r * 0.6 && y < l.h - r &&
    l.blocks.every((q) => Math.hypot(x - Math.max(q.x, Math.min(q.x + q.w, x)), y - Math.max(q.y, Math.min(q.y + q.h, y))) >= r) &&
    l.rounds.every((c) => Math.hypot(c.x - x, c.y - y) >= c.r + r) && l.props.every((q) => q.kind === 'plank' || q.kind === 'stave' || Math.hypot(q.x - x, q.y - y) >= 0.45 + r) &&
    fire.every((f) => !inBox({ x: f.x - r, y: f.y - r, w: f.w + r * 2, h: f.h + r * 2 }, x, y));
  const at = (i: number, j: number) => [(i + 0.5) * s, (j + 0.5) * s];
  const todo = [[Math.floor(a.x / s), Math.floor(a.y / s)]];
  seen[todo[0][1] * cols + todo[0][0]] = 1;
  while (todo.length) {
    const [i, j] = todo.pop()!, [x, y] = at(i, j);
    if (Math.hypot(x - z.x, y - z.y) < 1.1) return true;
    for (const [u, v] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (u < 0 || v < 0 || u >= cols || v >= rows || seen[v * cols + u]) continue;
      seen[v * cols + u] = 1;
      const [px, py] = at(u, v);
      if (open(px, py)) todo.push([u, v]);
    }
  }
  return false;
}

/** Where it burns: by the furniture and out on the floor, some already alight, the rest catching over the minute. */
export function planBlaze(l: Layout, rng: Rng, cage?: P): Blaze {
  const fall = rng.range(HOUSEFIRE.fallMin, HOUSEFIRE.fallMax), door = { x: l.w / 2, y: l.h - 1.3 };
  // Broken boards on the floor don't stop a fire or a beam.
  const room = { ...l, props: l.props.filter((q) => q.kind !== 'plank' && q.kind !== 'stave') };
  const want: Area[] = [];
  for (const q of rng.shuffle(l.blocks.filter((q) => q.kind !== 'partition'))) want.push({ x: q.x - 0.2, y: q.y + q.h - 0.3, w: Math.min(2.6, q.w + 0.4), h: 1.2 });
  for (let i = 0; i < 8; i++) {
    const s = freeSpot(room, rng, 0.55, 1, l.h - 2);
    if (s) want.push({ x: s.x - 0.75, y: s.y - 0.55, w: 1.5, h: 1.1 });
  }
  const patches: Blaze['patches'] = [];
  for (const a of want) {
    if (patches.length >= 6) break;
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
    // Never in the doorway: the box kept off the strip in from the door.
    if (a.x < l.w / 2 + 1.9 && a.x + a.w > l.w / 2 - 1.9 && a.y + a.h > l.h - 3.4) continue;
    if (cage && Math.hypot(cx - cage.x, cy - cage.y) < Math.max(a.w, a.h) / 2 + 1.4) continue;
    if (l.blocks.some((q) => q.kind === 'partition' && a.x < q.x + q.w + 0.9 && a.x + a.w > q.x - 0.9 && a.y < q.y + q.h + 0.9 && a.y + a.h > q.y - 0.9)) continue;
    if (patches.some((p) => a.x < p.x + p.w + 0.7 && a.x + a.w > p.x - 0.7 && a.y < p.y + p.h + 0.7 && a.y + a.h > p.y - 0.7)) continue;
    // Never across the way to the cage, nor the way out.
    const all = [...patches, a];
    if (cage && !reaches(l, all, door, cage)) continue;
    if (!reaches(l, all, door, { x: l.w / 2, y: l.h - 0.5 })) continue;
    patches.push({ ...a, at: patches.length < 2 ? 0 : rng.range(6, fall - 14) });
  }
  const beams: Blaze['beams'] = [];
  for (let t = rng.range(8, 12); t < fall - 2; t += rng.range(4.5, 7.5)) {
    const s = freeSpot(room, rng, 0.5, 1.2, l.h - 1.6);
    if (s) beams.push({ ...s, at: t });
  }
  return { patches, beams, fall };
}

/**
 * A house set alight from outside while someone's in it (sim/houseburn.ts): the same sort of plan,
 * squeezed into the time it has (catching from `start`, the roof in at `fall`), and the smoke that
 * starts to hurt after a grace.
 */
export function blazeFrom(l: Layout, rng: Rng, start: number, fall: number, cage?: P): Blaze {
  const p = planBlaze(l, rng, cage), k = (fall - start - HOUSEBURN.catch) / p.fall, lit = start + HOUSEBURN.catch;
  return {
    patches: p.patches.map((q, i) => ({ ...q, at: i < 2 ? lit : lit + q.at * k })),
    beams: p.beams.map((m) => ({ ...m, at: lit + m.at * k })).filter((m) => m.at > lit + HOUSEFIRE.beamWarn && m.at < fall - 1),
    fall, smoke: start + HOUSEBURN.grace,
  };
}
