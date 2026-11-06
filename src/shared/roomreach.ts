/**
 * The last word on a layout-3 room: everything the job put in it can be walked to from the way in. A
 * flood over a fine grid from where the party comes in, a cell open where a hero's body fits clear of
 * everything solid, deep water and raised ground (its ramps are open). A goblin, a chest or a cage that
 * landed on ground cut off by water or a line of trees moves to ground that isn't, or (a goblin, if
 * nowhere will do) isn't there at all. Pure: same seed, same moves.
 */
import { solid, type GameMap } from './arena.js';
import type { PropKind } from './props.js';
import type { Foe } from './terrain.js';
import { HERO } from './tuning.js';

type P = { x: number; y: number };
const C = 0.25;

function flood(m: GameMap): (p: P, d: number) => boolean {
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), open = new Uint8Array(cols * rows), seen = new Uint8Array(cols * rows), r = HERO.radius;
  // Shut every cell a hero's body can't stand in: each thing marks only the cells round it.
  const span = (lo: number, hi: number, n: number): [number, number] => [Math.max(0, Math.floor(lo / C)), Math.min(n - 1, Math.floor(hi / C))];
  const box = (a: { x: number; y: number; w: number; h: number }, pad: number, v: number) => {
    const [i0, i1] = span(a.x - pad, a.x + a.w + pad, cols), [j0, j1] = span(a.y - pad, a.y + a.h + pad, rows);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * C, y = (j + 0.5) * C;
      if (x > a.x - pad && x < a.x + a.w + pad && y > a.y - pad && y < a.y + a.h + pad) open[j * cols + i] = v;
    }
  };
  const disc = (cx: number, cy: number, rr: number) => {
    const R = rr + r, [i0, i1] = span(cx - R, cx + R, cols), [j0, j1] = span(cy - R, cy + R, rows);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (Math.hypot((i + 0.5) * C - cx, (j + 0.5) * C - cy) < R) open[j * cols + i] = 0;
  };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + 0.5) * C, y = (j + 0.5) * C;
    open[j * cols + i] = x < r || y < r || x > m.w - r || y > m.h - r ? 0 : 1;
  }
  for (const b of m.blocks) if (solid(b)) box(b, r, 0);
  for (const q of m.rounds) if (q.r > 0.15) disc(q.x, q.y, q.r);
  for (const q of m.braziers) disc(q.x, q.y, q.r);
  for (const q of m.water ?? []) if (q.deep) box(q, r, 0);
  for (const l of m.ledges ?? []) box(l, r, 0);
  // A ledge's ramps are the way up it (but never through something standing on them).
  for (const l of m.ledges ?? []) for (const a of l.ramps) {
    const [i0, i1] = span(a.x, a.x + a.w, cols), [j0, j1] = span(a.y, a.y + a.h, rows);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * C, y = (j + 0.5) * C;
      if (x > a.x && x < a.x + a.w && y > a.y && y < a.y + a.h && !m.blocks.some((b) => !b.ruined && x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r)) open[j * cols + i] = 1;
    }
  }
  const s = Math.floor(m.hero.y / C) * cols + Math.floor(m.hero.x / C), q = [s];
  seen[s] = 1;
  while (q.length) {
    const c = q.pop()!, i = c % cols, j = (c - i) / cols;
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      const k = b * cols + a;
      if (a >= 0 && b >= 0 && a < cols && b < rows && open[k] && !seen[k]) (seen[k] = 1), q.push(k);
    }
  }
  return (p, d) => {
    for (let j = Math.floor((p.y - d) / C); j <= Math.ceil((p.y + d) / C); j++) for (let i = Math.floor((p.x - d) / C); i <= Math.ceil((p.x + d) / C); i++)
      if (i >= 0 && j >= 0 && i < cols && j < rows && seen[j * cols + i] && Math.hypot((i + 0.5) * C - p.x, (j + 0.5) * C - p.y) <= d) return true;
    return false;
  };
}

export function keepReachable(m: GameMap, foes: Foe[], chests: P[], props: { kind: PropKind; x: number; y: number }[], spot: (r: number) => P | null): void {
  const reach = flood(m), ok = (p: P) => reach(p, 1);
  const move = (p: P, r: number) => {
    for (let t = 0; t < 30; t++) {
      const q = spot(r);
      if (q && ok(q)) return Object.assign(p, q), true;
    }
    return false;
  };
  for (let i = foes.length - 1; i >= 0; i--) if (!foes[i].z && !ok(foes[i]) && !move(foes[i], 0.4)) foes.splice(i, 1);
  for (const c of chests) if (!ok(c)) move(c, 0.6);
  for (const q of props) if ((q.kind === 'cage' || q.kind === 'larder' || q.kind === 'oil') && !ok(q)) move(q, 0.6);
}
