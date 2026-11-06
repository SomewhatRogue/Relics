/**
 * Layout 4's scenes you walk in on (docs/terrain-nodes.md 4; Kyle: "they can be staged, or you arrive as
 * a scene is occurring"): torch-bearers round a cottage that's catching, someone caged inside it; two
 * hauling a body along to their fire; prisoners roped together, led for the far way out between their
 * guards; a patrol walking its round. Each is mid-way when the room begins; what the goblins are doing
 * is a task (sim/tasks.ts), the rest is the room's own rules (sim/scenes.ts). The rest are scenes4b.ts.
 */
import type { Piece } from './nodes.js';
import { wooden } from './sitekit.js';
import { SCENE } from './scenetune.js';
import { along, type Pt } from './spine.js';
import { band, fire, type Lay } from './vignettes.js';
import { cache, drums, fallen, hanging, wading, webs } from './scenes4b.js';
import { layStaithe } from './staithe.js';

type P = { x: number; y: number };

/** What a goblin is busy at when you come in (sim/tasks.ts walks it; a hero close by or a blow ends it). */
export type FoeTask =
  /** Holding its torch to a house's wall at (x, y). */
  | { k: 'kindle'; x: number; y: number; quit?: boolean }
  /** Guarding the prisoners: walking the room's led path (map.led) at `s` tiles along it, `off` to one side. */
  | { k: 'escort'; s: number; off: number; quit?: boolean }
  /** Walking its round, `i` the point it's making for (`stuck`: seconds without getting nearer). */
  | { k: 'patrol'; pts: Pt[]; i: number; stuck?: number; best?: number }
  /** Hauling a body (its `haul`) to their fire at `to`. */
  | { k: 'haul'; to: Pt; quit?: boolean }
  /** The Staithe (sim/staithe.ts): log-carriers laying their log across the gap from (x, y), toward (dx, dy). */
  | { k: 'lay'; x: number; y: number; dx: number; dy: number; quit?: boolean }
  /** The gaffer hooking folk off the jetty's end (the next at room time `next`). */
  | { k: 'gaff'; next: number; quit?: boolean }
  /** Over the laid log and onto the jetty, to take folk off it. */
  | { k: 'board'; at?: number }
  /** A chalker at its tally board at (x, y), `n` strokes on it (shared/chalkstage.ts). */
  | { k: 'tally'; x: number; y: number; n: number; quit?: boolean }
  /** Hangman's Wood (sim/dropper.ts, shared/hangwood.ts): up in the branches till someone's under it (`at` it lands at tx, ty); at work on something at (x, y) till it sees you. */
  | { k: 'perch'; at?: number; tx?: number; ty?: number }
  /** Fenmere (sim/lurk.ts): lying in the reeds, eyes only, till it's sprung; then standing up out of them until room time `up` (-1 once up). */
  | { k: 'lurk'; up?: number }
  /** Fenmere's skimmer (sim/skimmer.ts): where it pours its pot (the Staithe's pours where the map says). */
  | { k: 'pour'; x: number; y: number }
  | { k: 'busy'; x: number; y: number; what: 'winch' | 'snare'; quit?: boolean };

export const SCENES4: Piece[] = ['burning', 'drag', 'prisoners', 'patrol', 'hanging', 'fallen', 'cache', 'drums', 'webs', 'wading', 'staithe'];

/** A point `s` tiles along a path (and which way it runs there); past its end, its end. */
export function atArc(pts: Pt[], s: number): { x: number; y: number; dx: number; dy: number; end: boolean } {
  let left = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], len = Math.hypot(bx - ax, by - ay) || 1e-6;
    if (left <= len || i === pts.length - 1) {
      const k = Math.min(1, left / len);
      return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, dx: (bx - ax) / len, dy: (by - ay) / len, end: left >= len && i === pts.length - 1 };
    }
    left -= len;
  }
  const [x, y] = pts[pts.length - 1];
  return { x, y, dx: 0, dy: -1, end: true };
}

export function scene4(l: Lay, piece: Piece): P[] {
  if (piece === 'burning') return burning(l);
  if (piece === 'drag') return drag(l);
  if (piece === 'prisoners') return prisoners(l);
  if (piece === 'patrol') return patrol(l);
  if (piece === 'hanging') return hanging(l);
  if (piece === 'fallen') return fallen(l);
  if (piece === 'cache') return cache(l);
  if (piece === 'drums') return drums(l);
  if (piece === 'webs') return webs(l);
  if (piece === 'staithe') return staitheScene(l);
  return wading(l);
}

/** NETS: the Staithe (shared/staithe.ts) in this room's river, the rest of the band at a fire up the bank. */
function staitheScene(l: Lay): P[] {
  const r = l.river, main = l.spine?.[0];
  if (!r || !main) return plainFire(l);
  const down = !!r.down, a = down ? main[0][0] : main[0][1];
  const got = layStaithe({ w: l.W, h: l.H, len: down ? l.H : l.W, river: r, nearLow: a < r.y, water: r.water, blocks: l.blocks, foes: l.foes, props: l.props, free: l.free, claim: l.claim, pack: 86, clear: l.clear, plot: l.plot });
  if (!got) return plainFire(l);
  l.staithe = got.map;
  const f = l.free(got.fire.x, got.fire.y, 0.6) ? (l.braziers.push({ ...got.fire, r: 0.35, wild: true }), l.claim(got.fire.x, got.fire.y, 0.6), got.fire) : fire(l);
  if (f) band(l, f, Math.max(1, l.n - 5));
  return f ? [f] : [];
}

/** Just a band at their fire (a scene that found no room for itself). */
export function plainFire(l: Lay, k = l.n): P[] {
  const f = fire(l);
  if (f) band(l, f, k);
  return f ? [f] : [];
}

/** Burning a house: two torch-bearers at its side walls, someone caged inside (the cry is real), a few watching. */
function burning(l: Lay): P[] {
  const mid = { x: l.W / 2, y: l.H / 2 }, d = (b: { x: number; y: number; w: number; h: number }) => Math.hypot(b.x + b.w / 2 - mid.x, b.y + b.h / 2 - mid.y);
  let h = l.blocks.filter((b) => b.kind === 'house' && b.door && !b.ruined && b.w >= 2.6).sort((a, b) => d(a) - d(b))[0];
  if (!h) {
    // No cottage here: one put up by the track (a woodcutter's, a herder's).
    const a = l.plot?.(4, 2.8, 2.6);
    if (!a) return plainFire(l);
    h = wooden({ kind: 'house', ...a });
    l.blocks.push(h);
  }
  Object.assign(h, { door: 'cottage:held', held: 1, torched: SCENE.staged });
  for (const sd of [-1, 1]) {
    const x = sd < 0 ? h.x - 0.55 : h.x + h.w + 0.55, y = h.y + h.h * 0.55;
    l.foes.push({ kind: 'scrapper', variant: 'torch', x, y, task: { k: 'kindle', x, y }, pack: 81 }), l.claim(x, y, 0.4);
  }
  const front = { x: h.x + h.w / 2, y: h.y + h.h + 2 }, watch = Math.min(2, Math.max(0, l.n - 2));
  band(l, front, watch, 0.8, 2.2);
  return [...plainFire(l, Math.max(0, l.n - 2 - watch)), front];
}

/** Two of them hauling a body along to their fire, a red trail behind it; they drop it and turn when they see you. */
function drag(l: Lay): P[] {
  const f = fire(l, 3, l.H - 9), main = l.spine?.[0];
  if (!f || !main) return plainFire(l);
  const pts = along(main, 0.5).filter((p) => p.t > 0.25 && p.t < 0.6 && Math.hypot(p.x - f.x, p.y - f.y) > 5);
  const a = pts[l.rng.int(Math.max(1, pts.length))];
  if (!a) return (band(l, f, l.n), [f]);
  const ux = (f.x - a.x) / Math.hypot(f.x - a.x, f.y - a.y), uy = (f.y - a.y) / Math.hypot(f.x - a.x, f.y - a.y);
  l.grim.push({ kind: 'trail', x: a.x - ux * 3.2, y: a.y - uy * 3.2, x2: a.x, y2: a.y, k: l.rng.int(4) });
  l.foes.push({ kind: 'scrapper', x: a.x + ux * 0.9, y: a.y + uy * 0.9, task: { k: 'haul', to: [f.x, f.y + 1.2] }, haul: { x: a.x, y: a.y }, pack: 84 });
  l.foes.push({ kind: 'scrapper', x: a.x + ux * 0.7 - uy * 0.75, y: a.y + uy * 0.7 + ux * 0.75, task: { k: 'haul', to: [f.x + 0.9, f.y + 1.4] }, pack: 84 });
  l.claim(a.x, a.y, 1.2);
  band(l, f, Math.max(1, l.n - 2));
  return [f];
}

/** Prisoners roped together, led for the far way out with a guard in front and one behind. */
function prisoners(l: Lay): P[] {
  const main = l.spine?.[0];
  if (!main || !l.out) return plainFire(l);
  const pts: Pt[] = along(main, 0.8).filter((p) => p.t >= 0.36).map((p) => [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100]);
  pts.push(l.out);
  const n = 2 + l.rng.int(2), front = 1.4 + (n - 1) * 0.8;
  l.led = { pts, n };
  for (const [s, off] of [[front + 1, 0.55], [0.4, -0.55]]) {
    const p = atArc(pts, s), x = p.x - p.dy * off, y = p.y + p.dx * off;
    l.foes.push({ kind: 'scrapper', x, y, task: { k: 'escort', s, off }, pack: 82 });
  }
  return plainFire(l, Math.max(1, l.n - 2));
}

/** A patrol: three walking a round of the room that crosses the track, the rest at their fire. */
function patrol(l: Lay): P[] {
  const qs: [number, number, number, number][] = [[0.1, 0.48, 0.12, 0.45], [0.52, 0.9, 0.12, 0.45], [0.52, 0.9, 0.5, 0.72], [0.1, 0.48, 0.5, 0.72]], pts: Pt[] = [];
  for (const [x0, x1, y0, y1] of qs) for (let t = 0; t < 30; t++) {
    const x = l.rng.range(l.W * x0, l.W * x1), y = l.rng.range(l.H * y0, l.H * y1);
    if (l.free(x, y, 0.5) || t === 29) {
      pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
      break;
    }
  }
  const [a, b] = pts, len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  for (let k = 0; k < 3; k++) {
    const x = a[0] + ((b[0] - a[0]) * k * 1.1) / len, y = a[1] + ((b[1] - a[1]) * k * 1.1) / len;
    l.foes.push({ kind: 'scrapper', x, y, task: { k: 'patrol', pts, i: 1 }, pack: 85 });
  }
  return plainFire(l, Math.max(1, l.n - 3));
}
