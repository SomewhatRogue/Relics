/**
 * The Staithe on the Barrowfields (Kyle approved rollout item 5, 2026-11-05: "the river in the middle
 * should have maybe a fishing village in the center sometimes"). On about one map in three (rolled on STAITHE.chance of them, laid where it fits), a stretch
 * in the middle row between the two fords is the Staithe (shared/staithe.ts): the river broadens there
 * for the jetty, and the whole scene is laid on its south bank. STAITHE.pinned of the time it's one of the
 * pinned jobs (in the last job's place), else a side job. Left alone it plays out (sim/staithebits.ts
 * playOut): at ALARM 3 the smokehouse catches, at ALARM 5 they're lost.
 *
 * Rolled on its own stream from the map's seed and laid after everything else (its ground cleared of
 * growth, anyone standing there moved off it), so the rest of the map is exactly what it would be
 * without it, and a map without it is unchanged.
 */
import type { Area, StaitheMap } from './arena.js';
import type { GoalSpot } from './expedcamps.js';
import { COLS, MH, MW, NODE, claim, type Kit } from './expedkit.js';
import type { Land } from './expedland.js';
import type { NodeKind } from './expedmap.js';
import { Rng } from './rng.js';
import { layStaithe } from './staithe.js';
import { STAITHE } from './staithetune.js';
import { EXPED } from './tuning.js';

/** Whether this map has the Staithe, and whether it's pinned (from the seed alone). */
export function staitheRoll(seed: number): { pinned: boolean } | null {
  const r = new Rng(seed * 4421 + 7);
  if (r.next() >= STAITHE.chance) return null;
  return { pinned: r.next() < STAITHE.pinned };
}

/** What may stand where the Staithe goes, and be knocked flat for it. */
const LIGHT = new Set(['fence', 'hurdle', 'cart', 'stakes', 'log', 'tent', 'shack', 'rack']);
const hits = (a: Area, x: number, y: number, w = 0, h = 0) => x + w > a.x && x < a.x + a.w && y + h > a.y && y < a.y + a.h;

/**
 * Lay it: the place along the river between the fords nearest a node's middle whose ground holds no
 * building, cage, chest or job and is well off any camp and the way in; the river broadened there, the scene on the south bank. Returns the map's
 * staithe, its node, the ground it took and where its job's ring is (its pin); null if nowhere will do.
 */
export function layExpedStaithe(k: Kit, land: Land, nodes: NodeKind[], goals: GoalSpot[], camps: { x: number; y: number }[]): { map: StaitheMap; node: number; area: Area; x: number; y: number } | null {
  const [fa, fb] = [land.fords[0], land.fords[land.fords.length - 1]];
  const lo = fa.x + fa.w + 6.5 + STAITHE.fordGap, hi = fb.x - 6.5 - STAITHE.fordGap, half = STAITHE.river / 2;
  const cands: number[] = [];
  // (Any stretch of the middle row between the fords but the way in's and the barrows'; clear of camps, as below.)
  for (let u = lo; u <= hi; u += 1) if (!['in', 'barrows'].includes(nodes[COLS + Math.floor(u / NODE)])) cands.push(u);
  const mid = (lo + hi) / 2;
  cands.sort((a, b) => Math.abs((a % NODE) - NODE / 2) - Math.abs((b % NODE) - NODE / 2) || Math.abs(a - mid) - Math.abs(b - mid));
  const area = (u: number): Area => ({ x: u - 8.5, y: land.riverAt(u) - half - 1.5, w: 17, h: half * 2 + 10.5 });
  const used = new Set(goals.flatMap((g) => g.blocks ?? []));
  const u = cands.find((c) => {
    const a = area(c), nx = Math.max(a.x, Math.min(a.x + a.w, land.ins.x)), ny = Math.max(a.y, Math.min(a.y + a.h + 2, land.ins.y));
    // (Well away from the way in: nobody's waiting where you land.)
    return Math.hypot(nx - land.ins.x, ny - land.ins.y) > 16 && camps.every((q) => Math.hypot(Math.max(a.x, Math.min(a.x + a.w, q.x)) - q.x, Math.max(a.y, Math.min(a.y + a.h, q.y)) - q.y) > 5) && !k.blocks.some((b, i) => hits(a, b.x, b.y, b.w, b.h) && (!LIGHT.has(b.kind) || used.has(i))) && !k.props.some((p) => p.kind === 'cage' && hits(a, p.x, p.y)) && !k.chests.some((q) => hits(a, q.x, q.y)) && !goals.some((g) => hits(a, g.x, g.y));
  });
  if (u === undefined) return null;
  const A = area(u), yc = land.riverAt(u), y0 = yc - half, below = A.y + A.h + 0.8;
  // Its ground cleared: growth, things lying about, fires; anyone standing there moved off it, down the bank.
  k.rounds = k.rounds.filter((q) => !hits(A, q.x, q.y));
  // (Fences, carts and the like on it are knocked flat: rubble, never moved, so every block keeps its place in the list.)
  for (const b of k.blocks) if (hits(A, b.x, b.y, b.w, b.h)) Object.assign(b, { ruined: true, hp: 0 });
  k.props = k.props.filter((p) => !hits(A, p.x, p.y));
  k.braziers = k.braziers.filter((q) => !hits(A, q.x, q.y));
  k.sleepers = k.sleepers.filter((q) => !hits(A, q.x, q.y));
  let n = 0;
  for (const f of k.foes) if (hits(A, f.x, f.y)) Object.assign(f, { y: Math.min(MH - 2, below + (n++ % 4) * 1.3 + (f.x % 0.7)) });
  for (const d of k.dead) if (hits(A, d.x, d.y)) Object.assign(d, { y: Math.min(MH - 2, below + 0.6) });
  // The river broadened and straightened where the jetty stands (its two-tile strips made one band).
  for (const w of k.water) if (w.x + w.w > u - 6.5 && w.x < u + 6.5) Object.assign(w, { y: y0, h: STAITHE.river, deep: true });
  const mine: { x: number; y: number; r: number }[] = [];
  const got = layStaithe({
    w: MW, h: MH, len: MW, river: { y: y0, h: STAITHE.river, water: k.water, fords: [] }, nearLow: false, water: k.water, blocks: k.blocks, foes: k.foes, props: k.props, pack: 86,
    free: (x, y, r) => hits(A, x, y) && !k.water.some((w) => hits(w, x, y)) && mine.every((m) => Math.hypot(m.x - x, m.y - y) > m.r + r + 0.5),
    claim: (x, y, r) => void (mine.push({ x, y, r }), claim(k, x, y, r)),
  }, u);
  if (!got) return null;
  // The rest of them at a fire up the bank.
  k.braziers.push({ ...got.fire, r: 0.35, wild: true });
  for (let n = 0; n < 3; n++) k.foes.push({ kind: 'scrapper', x: got.fire.x + Math.cos(n * 2.1) * 1.4, y: got.fire.y + Math.sin(n * 2.1) * 1.1, pack: 86 });
  // Its goblins in place of as many of the knots scattered about (the last laid: no camp, patrol or job counts them), so the map holds EXPED.goblins.
  const ours = k.foes.filter((f) => f.pack === 86).length;
  for (let i = k.foes.length - ours - 1; i >= 0 && k.foes.length > EXPED.goblins; i--) if (k.foes[i].pack === undefined && !k.foes[i].name) k.foes.splice(i, 1);
  return { map: got.map, node: COLS + Math.floor(u / NODE), area: A, x: got.map.ring.x, y: got.map.ring.y };
}
