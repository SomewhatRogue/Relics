/**
 * The Staithe (Kyle approved the biomes proposal, 2026-11-05: "the river in the middle should have maybe
 * a fishing village in the center sometimes"): eel-catchers holding out on their jetty over deep water, where
 * nothing with feet can get at them, and the hungry working at it as you come in. Log-carriers laying a
 * log across the gap from the bank; a gaffer hooking folk off the jetty's end into nets on the bank, its
 * brute over them; two torch-bearers getting a smokehouse going with someone shut inside; a skimmer up the
 * bank with its pot of oil. Drying racks and hung nets along the bank, punts drawn up, lamps on posts.
 *
 * Laid in the river's own terms (along it and across it from the near bank), so a river across the room
 * and one down it are the same scene. The rules are sim/staithe.ts; the numbers shared/staithetune.ts.
 * Shared by a NETS room (layout 4) and the Barrowfields (shared/expedstaithe.ts).
 */
import type { Area, Block, StaitheMap, Water } from './arena.js';
import type { PropKind } from './props.js';
import type { River } from './river.js';
import { SCENE } from './scenetune.js';
import { wooden } from './sitekit.js';
import { STAITHE } from './staithetune.js';
import type { Foe } from './terrain.js';

type P = { x: number; y: number };

/** Where the Staithe's things go, and how it says whether a spot is free (and claims it). */
export interface StaitheLay {
  /** The room's size, and the river's length (its width across the room, or its height down it). */
  w: number; h: number; len: number; river: River; nearLow: boolean; water: Water[];
  blocks: Block[]; foes: Foe[]; props: { kind: PropKind; x: number; y: number }[];
  free(x: number, y: number, r: number): boolean;
  claim(x: number, y: number, r: number): void;
  /** The goblins' packs: one for the scene's own, one for the brute and gaffer. */
  pack: number;
  /** Clear growth off a box (the bank where it all goes). */
  clear?(a: Area): void;
  /** Ground beside the track for the smokehouse if the bank has none (shared/room4.ts plotter). */
  plot?(w: number, h: number, near?: number): Area | null;
}

/** Cut box `a` out of every water box it overlaps (each split into the strips round it). */
export function cutWater(water: Water[], a: Area): void {
  for (let i = water.length - 1; i >= 0; i--) {
    const q = water[i];
    if (q.x >= a.x + a.w || q.x + q.w <= a.x || q.y >= a.y + a.h || q.y + q.h <= a.y) continue;
    const bits: Water[] = [];
    const y0 = Math.max(q.y, a.y), y1 = Math.min(q.y + q.h, a.y + a.h);
    if (a.y > q.y) bits.push({ ...q, h: a.y - q.y });
    if (a.y + a.h < q.y + q.h) bits.push({ ...q, y: a.y + a.h, h: q.y + q.h - a.y - a.h });
    if (a.x > q.x) bits.push({ ...q, y: y0, w: a.x - q.x, h: y1 - y0 });
    if (a.x + a.w < q.x + q.w) bits.push({ ...q, x: a.x + a.w, y: y0, w: q.x + q.w - a.x - a.w, h: y1 - y0 });
    water.splice(i, 1, ...bits.filter((b) => b.w > 0.02 && b.h > 0.02));
  }
}

/**
 * Lay the Staithe in the river at `u` along it (its jetty's middle), or wherever it fits best if not
 * given. Returns the map's staithe and the fire the rest of the band sits at, or null if it won't fit.
 */
export function layStaithe(s: StaitheLay, at?: number): { map: StaitheMap; fire: P } | null {
  const r = s.river, down = !!r.down, bank0 = s.nearLow ? r.y : r.y + r.h, sg = s.nearLow ? 1 : -1;
  const { gap: G, deep: J, long: L, log: LW } = STAITHE;
  // (u along the river, downstream; v across it from the near bank's edge, into the water.)
  const pt = (u: number, v: number): P => (down ? { x: bank0 + sg * v, y: u } : { x: u, y: bank0 + sg * v });
  const box = (u0: number, v0: number, du: number, dv: number): Area => {
    const a = pt(u0, v0), b = pt(u0 + du, v0 + dv);
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
  };
  const pair = (p: P): [number, number] => [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100];
  let u0: number;
  if (at !== undefined) u0 = at - L / 2;
  else {
    // The long stretch of deep water away from the ford, the jetty in the middle of it.
    const f = r.fords[0] ?? { x: s.len, w: 0 }, spans = [[1.6, f.x - 2.2], [f.x + f.w + 2.2, s.len - 1.6]].filter(([a, b]) => b - a >= L + 4);
    if (!spans.length) return null;
    const [a, b] = spans.sort((p, q) => q[1] - q[0] - (p[1] - p[0]))[0];
    u0 = (a + b) / 2 - L / 2 + 0.8;
  }
  const mid = u0 + L / 2, jetty = box(u0, G, L, J), gapA = box(mid - LW / 2, 0, LW, G);
  // The bank cleared of reeds and brush where it all goes.
  s.clear?.(box(u0 - 5.5, -6, L + 10, 6.2));
  // The jetty stands on its piles out of the water (boards you walk); the gap to it is deep, the log's to cross.
  cutWater(s.water, jetty), cutWater(s.water, gapA);
  s.water.push({ ...gapA, deep: true, span: true });
  s.blocks.push({ ...wooden({ kind: 'jetty', ...jetty }), deck: true });
  s.blocks.push({ ...wooden({ kind: 'gangway', ...box(mid - LW / 2, -0.35, LW, G + 0.6) }), soft: true });
  const ring = pt(mid, -1.9), across = pt(0, 1), zero = pt(0, 0), ax = across.x - zero.x, ay = across.y - zero.y;
  const folk: [number, number][] = [];
  for (let i = 0; i < STAITHE.folk; i++) folk.push(pair(pt(u0 + L - 0.8 - i * 1.05, G + J * (i % 2 ? 0.62 : 0.4))));
  // The log-carriers at the bank, their log across toward the jetty; the band's fire behind them.
  const lay = pt(mid, -1.35);
  s.foes.push({ kind: 'scrapper', variant: 'log', x: lay.x, y: lay.y, task: { k: 'lay', x: lay.x, y: lay.y, dx: ax, dy: ay }, pack: s.pack });
  s.claim(lay.x, lay.y, 0.4);
  // The gaffer at the bank by the jetty's end, its brute behind it standing over the netted.
  const gaff = pt(u0 + L + 0.3, -0.8), brute = pt(u0 + L + 1.7, -2.5), netted: [number, number][] = [];
  s.foes.push({ kind: 'scrapper', variant: 'gaffer', x: gaff.x, y: gaff.y, task: { k: 'gaff', next: GAFF_FIRST }, pack: s.pack + 1 });
  s.foes.push({ kind: 'scrapper', variant: 'heavy', x: brute.x, y: brute.y, pack: s.pack + 1 });
  for (let i = 0; i < STAITHE.netted; i++) netted.push(pair(pt(u0 + L + 1.0 + i * 0.8, -1.5 - (i % 2) * 0.5)));
  s.claim(gaff.x, gaff.y, 0.3), s.claim(brute.x, brute.y, 0.4);
  for (const n of netted) s.claim(n[0], n[1], 0.3);
  // The skimmer up the bank with its pot, where it pours onto the water.
  const sk = Math.max(1.3, u0 - 3.4), post = pt(sk, -0.75), pour = pt(sk + 0.6, 1.1);
  s.foes.push({ kind: 'scrapper', variant: 'skimmer', x: post.x, y: post.y, pack: s.pack });
  s.claim(post.x, post.y, 0.3);
  // The smokehouse, up the bank from the landing, someone shut in it; two torch-bearers at its walls.
  // (Never behind the landing: the ring by the jetty is kept open.)
  const along: number[] = [u0 - 2.4, u0 + L + 2.8];
  for (let u = 2; u < s.len - 2; u += 1.2) if (Math.abs(u - mid) > STAITHE.ring + 1.4) along.push(u);
  const tries: (Area | null)[] = [...along.flatMap((u) => [[u, -5.8], [u, -5.1], [u, -4.5], [u, -7], [u, -8.4]]), ...along.flatMap((u) => [[u, r.h + 1.6], [u, r.h + 2.4]])].map(([u, v0]) => {
    const a = box(u - 1.3, v0, 2.6, 2.3), c = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    return u - 1.3 < 0.8 || u + 1.3 > s.len - 0.8 || a.x < 0.8 || a.y < 1.2 || a.x + a.w > s.w - 0.8 || a.y + a.h > s.h - 1.2 || !s.free(c.x, c.y, 1.45) ? null : a;
  });
  // (Nowhere by the water: ground beside the track, as a layout-4 scene finds it.)
  const house = tries.find(Boolean) ?? s.plot?.(2.6, 2.3, 2.4) ?? null;
  for (const a of house ? [house] : []) {
    const c = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    const h = { ...wooden({ kind: 'smokehouse', ...a }), held: 1, torched: SCENE.staged, cry: true };
    s.blocks.push(h), s.claim(c.x, c.y, 1.6);
    for (const sd of [-1, 1]) {
      const x = sd < 0 ? h.x - 0.55 : h.x + h.w + 0.55, y = h.y + h.h * 0.55;
      s.foes.push({ kind: 'scrapper', variant: 'torch', x, y, task: { k: 'kindle', x, y }, pack: s.pack }), s.claim(x, y, 0.4);
    }
    break;
  }
  // Lamps on posts at the water's edge (one by the gap); punts drawn up on the bank; racks and nets.
  for (const u of [mid - LW / 2 - 0.7, u0 - 0.6]) {
    const p = pt(u, -0.45);
    if (s.free(p.x, p.y, 0.3)) s.props.push({ kind: 'lamp', ...p }), s.claim(p.x, p.y, 0.2);
  }
  for (const u of [u0 + L + 3.4, u0 - 1.8]) {
    const p = pt(u, -0.9);
    if (u > 1 && u < s.len - 1 && s.free(p.x, p.y, 0.6)) s.props.push({ kind: 'punt', ...p }), s.claim(p.x, p.y, 0.5);
  }
  for (const u of [u0 - 1.7, u0 + L + 3.8, u0 + 0.4]) {
    const a = box(u - 0.8, -3.1, 1.6, 0.35), c = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    if (s.free(c.x, c.y, 0.8)) s.blocks.push(wooden({ kind: 'dryrack', ...a })), s.claim(c.x, c.y, 0.8);
  }
  // A net hung on the jetty's boards, one on the bank by the landing (both catch a foot, both burn).
  s.blocks.push({ ...wooden({ kind: 'hungnet', ...box(u0 + 0.5, G + 0.25, 1.5, 0.3) }), soft: true });
  const nb = box(mid + LW / 2 + 0.5, -2.2, 1.5, 0.3), nc = { x: nb.x + nb.w / 2, y: nb.y + nb.h / 2 };
  if (s.free(nc.x, nc.y, 0.5)) s.blocks.push({ ...wooden({ kind: 'hungnet', ...nb }), soft: true }), s.claim(nc.x, nc.y, 0.6);
  const [rx, ry] = pair(ring);
  const map: StaitheMap = { ring: { x: rx, y: ry }, folk, netted, pour: pair(pour), punt: [pair(pt(mid, G + J + 0.5)), pair(pt(mid, r.h - 0.5)), pair(pt(mid, -0.2))], across: [ax, ay], down: down ? [0, 1] : [1, 0] };
  return { map, fire: pt(mid + (sg > 0 ? -2 : 2), -5.5) };
}

/** When the gaffer first hooks someone off the jetty (room time; then every GAFFER.gaff). */
export const GAFF_FIRST = 4;
