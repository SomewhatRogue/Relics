/**
 * More of layout 4's scenes (scenes4.ts has the moving ones): the hungry's hanging tree with its stock
 * hung by the ankles (the larder rule) and crows under it; a tree fallen across the way, the path
 * going round its short end and two crouched behind it; a well with a cache on its rope and two using
 * it; a war band behind a fence of stakes with its drummer and a chest (DRUMS); spider nests with a
 * chest among them (WEBS); and archers on the far bank of a ford (THE FORD).
 */
import type { Block } from './arena.js';
import { NEST } from './spiders.js';
import { SPIDERS } from './nests.js';
import { wooden } from './sitekit.js';
import { along, type Pt } from './spine.js';
import { band, fire, type Lay } from './vignettes.js';
import { plainFire } from './scenes4.js';

type P = { x: number; y: number };

/** The hanging tree: two hung from its limb, blood under them, crows at it; their fire beyond. */
export function hanging(l: Lay): P[] {
  // Room for the tree and its limb out to the east (the hung are under the limb).
  const a = l.plot?.(3.4, 1.8, 2);
  if (!a) return plainFire(l);
  const t = { x: a.x + 0.7, y: a.y + 1 };
  l.rounds.push({ kind: 'hangtree', x: t.x, y: t.y, r: 0.45 });
  l.grim.push({ kind: 'hung', x: t.x + 0.75, y: t.y + 0.05, k: l.rng.int(4) }, { kind: 'hung', x: t.x + 1.35, y: t.y + 0.1, k: 1 + l.rng.int(4) });
  l.marks.push({ kind: 'blood', x: t.x + 0.3, y: t.y + 0.15, w: 1.6, h: 0.7 });
  l.flocks?.push({ x: t.x + 1.1, y: t.y + 0.8 });
  return plainFire(l);
}

/** Can you walk from `a` to `b` round everything solid (a 0.5-tile grid, a body's width kept)? */
function walks(l: Lay, blocks: Block[], a: P, b: P): boolean {
  const S = 0.5, nx = Math.ceil(l.W / S), ny = Math.ceil(l.H / S), r = 0.36, seen = new Uint8Array(nx * ny);
  const solid = (x: number, y: number) => blocks.some((q) => !q.ruined && q.kind !== 'sideway' && x > q.x - r && x < q.x + q.w + r && y > q.y - r && y < q.y + q.h + r) ||
    l.rounds.some((q) => q.r > 0.2 && Math.hypot(q.x - x, q.y - y) < q.r + r) || !!l.river?.water.some((q) => q.deep && x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h);
  const cell = (p: P) => Math.min(ny - 1, Math.floor(p.y / S)) * nx + Math.min(nx - 1, Math.floor(p.x / S)), goal = cell(b), q = [cell(a)];
  seen[q[0]] = 1;
  while (q.length) {
    const c = q.pop()!;
    if (c === goal) return true;
    const cx = c % nx, cy = (c / nx) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cx + dx, y = cy + dy, k = y * nx + x;
      if (x < 0 || y < 0 || x >= nx || y >= ny || seen[k]) continue;
      seen[k] = 1;
      if (!solid((x + 0.5) * S, (y + 0.5) * S)) q.push(k);
    }
  }
  return false;
}

/** A tree fallen across the way: the path bends round its short end; two crouch behind it. */
export function fallen(l: Lay): P[] {
  const main = l.spine?.[0];
  if (!main) return plainFire(l);
  const pts = l.rng.shuffle(along(main, 0.5).filter((p) => p.t > 0.38 && p.t < 0.64));
  for (const p of pts.slice(0, 6)) {
    const flat = Math.abs(p.dy) >= Math.abs(p.dx), sd = l.rng.next() < 0.5 ? -1 : 1, long = l.rng.range(4.5, 6.5), short = 0.9, u0 = flat ? p.x : p.y;
    const lo = sd > 0 ? u0 - long : u0 - short, hi = sd > 0 ? u0 + short : u0 + long;
    const log = wooden(flat ? { kind: 'log', x: Math.max(0.4, lo), y: p.y - 0.35, w: Math.min(l.W - 0.4, hi) - Math.max(0.4, lo), h: 0.7 } : { kind: 'log', x: p.x - 0.35, y: Math.max(0.6, lo), w: 0.7, h: Math.min(l.H - 1, hi) - Math.max(0.6, lo) });
    if (l.blocks.some((b) => b.x < log.x + log.w + 0.3 && b.x + b.w > log.x - 0.3 && b.y < log.y + log.h + 0.3 && b.y + b.h > log.y - 0.3)) continue;
    // The way round the short end: kept clear of anything that stood there.
    const go = flat ? { x: sd > 0 ? hi + 1.2 : lo - 1.2, y: p.y } : { x: p.x, y: sd > 0 ? hi + 1.2 : lo - 1.2 };
    const near = (x: number, y: number) => Math.hypot(x - go.x, y - go.y) < 2.4 || Math.hypot(x - p.x, y - p.y) < 1.8;
    const rounds = l.rounds.filter((q) => near(q.x, q.y));
    for (const q of rounds) l.rounds.splice(l.rounds.indexOf(q), 1);
    const before = along(main, 0.5).find((q) => q.t >= p.t - 0.18)!, after = along(main, 0.5).find((q) => q.t >= p.t + 0.18)!;
    if (!walks(l, [...l.blocks, log], before, after)) {
      l.rounds.push(...rounds);
      continue;
    }
    l.blocks.push(log), l.claim(log.x + log.w / 2, log.y + log.h / 2, Math.max(log.w, log.h) / 2);
    // Nothing growing through it.
    for (let k = l.rounds.length - 1; k >= 0; k--) {
      const q = l.rounds[k];
      if (q.kind !== 'well' && q.x > log.x - q.r - 0.4 && q.x < log.x + log.w + q.r + 0.4 && q.y > log.y - q.r - 0.4 && q.y < log.y + log.h + q.r + 0.4) l.rounds.splice(k, 1);
    }
    // Two crouched behind it, on the far side from the way in.
    const bx = after.x - before.x, by = after.y - before.y, bl = Math.hypot(bx, by) || 1;
    for (const k of [0.35, 0.7]) {
      const ax = flat ? lo + (hi - lo) * (sd > 0 ? k * 0.8 : 1 - k * 0.8) : p.x, ay = flat ? p.y : lo + (hi - lo) * (sd > 0 ? k * 0.8 : 1 - k * 0.8);
      l.foes.push({ kind: 'scrapper', x: ax + (bx / bl) * 0.9, y: ay + (by / bl) * 0.9 });
    }
    l.marks.push({ kind: 'debris', x: log.x - 0.4, y: log.y + log.h - 0.2, w: log.w + 0.8, h: 0.8 });
    return plainFire(l, Math.max(1, l.n - 2));
  }
  return plainFire(l);
}

/** A well, a cache hauled up on its rope and left at its lip, two of them at it. */
export function cache(l: Lay): P[] {
  const a = l.plot?.(3, 2.4, 1.8) ?? null, c = a ? { x: a.x + 1.1, y: a.y + 1 } : l.spot(1.6, 4, l.H - 6);
  if (!c) return plainFire(l);
  l.rounds.push({ kind: 'well', x: c.x, y: c.y, r: 0.5 });
  l.chests?.push({ x: c.x + 0.95, y: c.y + 0.45 });
  band(l, c, Math.min(2, l.n), 1.5, 2.4);
  return plainFire(l, Math.max(1, l.n - 2));
}

/** DRUMS: a war band round a long fire inside a fence of stakes, a drummer behind it, a chest by it. */
export function drums(l: Lay): P[] {
  const a = l.plot?.(7.4, 6.2, 1.6) ?? null, c = a ? { x: a.x + a.w / 2, y: a.y + a.h / 2 } : l.spot(3.4, 3.5, l.H - 8);
  if (!c) return plainFire(l);
  l.braziers.push({ x: c.x - 0.5, y: c.y, r: 0.35, wild: true }, { x: c.x + 0.5, y: c.y, r: 0.35, wild: true });
  // Stakes round it, open toward the track.
  const main = l.spine?.[0], near = main ? along(main, 1).reduce((a, p) => (Math.hypot(p.x - c.x, p.y - c.y) < Math.hypot(a.x - c.x, a.y - c.y) ? p : a)) : { x: c.x, y: l.H };
  const open = Math.atan2(near.y - c.y, near.x - c.x);
  for (let a = 0; a < Math.PI * 2; a += 0.42) {
    if (Math.abs(Math.atan2(Math.sin(a - open), Math.cos(a - open))) < 0.75) continue;
    const x = c.x + Math.cos(a) * 3.4, y = c.y + Math.sin(a) * 2.8, across = Math.abs(Math.cos(a)) < 0.7;
    if (x < 0.8 || x > l.W - 0.8 || y < 1 || y > l.H - 2) continue;
    l.blocks.push(wooden(across ? { kind: 'stakes', x: x - 0.6, y: y - 0.15, w: 1.2, h: 0.3 } : { kind: 'stakes', x: x - 0.15, y: y - 0.6, w: 0.3, h: 1.2 }));
  }
  band(l, c, l.n, 1.4, 2.6);
  l.foes.push({ kind: 'scrapper', variant: 'drummer', x: c.x - Math.cos(open) * 1.9, y: c.y - Math.sin(open) * 1.5 });
  l.chests?.push({ x: c.x - Math.cos(open) * 1.2 + 1.1, y: c.y - Math.sin(open) * 1.2 });
  return [c];
}

/** WEBS: two nests and their spiders, a chest in among them, fewer goblins at their fire. */
export function webs(l: Lay): P[] {
  let first: P | null = null;
  for (let i = 0; i < 2; i++) {
    const c = l.spot(NEST.radius + 0.8, 2.5, l.H - 7);
    if (!c) continue;
    first ??= c;
    l.foes.push({ kind: 'nest', x: c.x, y: c.y, wave: NEST.wave });
    for (let g = 0; g < SPIDERS.guards; g++) {
      const a = l.rng.range(0, Math.PI * 2);
      l.foes.push({ kind: 'spider', x: Math.max(1, Math.min(l.W - 1, c.x + Math.cos(a) * 1.15)), y: Math.max(1.5, c.y + Math.sin(a) * 0.9) });
    }
  }
  if (first) l.chests?.push({ x: first.x + 1.5, y: first.y + 0.6 });
  return plainFire(l, Math.max(1, l.n));
}

/** THE FORD: archers on the far bank behind hurdles, their band at a fire over there; the near side quiet. */
export function wading(l: Lay): P[] {
  const r = l.river, out = l.out ?? [l.W / 2, 0], bank: P[] = [];
  // Which side of the water the way on is (the far bank), across the room or down it.
  const far = r ? ((r.down ? out[0] : out[1]) < r.y ? -1 : 1) : 0;
  if (r) {
    const at = far < 0 ? r.y - 2.4 : r.y + r.h + 2.4;
    for (let u = 2; u < (r.down ? l.H - 2 : l.W - 2); u += 2.6) bank.push(r.down ? { x: at, y: u } : { x: u, y: at });
  } else {
    const main = l.spine?.[0] ?? ([[l.W / 2, l.H], [l.W / 2, 0]] as Pt[]);
    for (const p of along(main, 1).filter((q) => q.t > 0.78 && q.t < 0.92)) for (const sd of [-2.6, 2.6]) bank.push({ x: p.x - p.dy * sd, y: p.y + p.dx * sd });
  }
  let n = 0;
  for (const p of l.rng.shuffle(bank)) {
    if (n >= 3 || !l.free(p.x, p.y, 0.45)) continue;
    l.claim(p.x, p.y, 0.6), n++;
    l.foes.push({ kind: 'scrapper', bow: true, x: p.x, y: p.y, pack: 83 });
  }
  // Their fire over there too (across the room: above or below the water; down it, anywhere).
  const f = r && !r.down ? (far < 0 ? fire(l, 2.4, Math.max(3, r.y - 1.4)) : fire(l, r.y + r.h + 2, l.H - 6)) : fire(l);
  if (f) band(l, f, Math.max(1, l.n - 3));
  return f ? [f] : [];
}
