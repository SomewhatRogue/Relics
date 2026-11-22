/**
 * The living world, L2, the wild's half (ambient.ts): leaves drifting down under trees near the heroes, drips in the
 * mines, and (ambientwild2.ts) small birds flushing from cover and crows lifting as you pass. Every map but the town
 * (the town's are ambienttown.ts). Paint only, silent, a handful at once: about a dozen a frame at most.
 */
import type { GameMap } from '../shared/arena';
import type { Beast } from './townbeasts';
import { hash, nearest, coversOf, dot, type At } from './ambientwildkit';
import { birds, crowFigs } from './ambientwild2';

const LEAF = ['#6a4a2a', '#8a6a38', '#4a5a30', '#8a6a38'];
const NEEDLE = '#3a4a2c';

/** One leaf (or needle) from a crown: down in 5 to 8 seconds, swaying, then lying a moment and fading. */
function leaf(x: number, y: number, rid: number, i: number, now: number, needle: boolean): Beast {
  const P = 5 + hash(rid, i) * 3, T = now / P + hash(i, rid * 3), k = Math.floor(T), u = T - k, s = hash(rid + k, i + 7);
  const fall = Math.min(1, u / 0.85), top = 2 + s * 1.2, ph = s * 6.28;
  const sway = Math.sin(fall * 7 + ph) * 0.28 * (1 - fall * 0.4), lx = x + (hash(k, rid + i) - 0.5) * 1.8 + sway, ly = y + (hash(rid, k + i) - 0.3) * 0.9;
  const lying = u > 0.85, a = lying ? 1 - (u - 0.85) / 0.15 : 1, col = needle ? NEEDLE : LEAF[Math.floor(s * 4)];
  const tilt = Math.floor(fall * 9 + s * 4) % 2;
  return {
    key: `lf${rid}_${i}`, x: lx, y: ly, up: lying ? 0 : top * (1 - fall * fall * 0.6 - fall * 0.4),
    draw: (c, px, py) => {
      const X = Math.round(px), Y = Math.round(py);
      if (needle) return dot(c, X, Y - 1, 0, 0, 1, 2, col, a);
      if (lying) return dot(c, X, Y, -1, 0, 2, 1, col, a * 0.8);
      dot(c, X, Y, 0, 0, tilt ? 2 : 1, tilt ? 1 : 2, col, a);
    },
  };
}

/** Leaves under up to three trees near the heroes (a pine: the odd needle; a dead tree: none). */
function leaves(m: GameMap, now: number, heroes: At[]): Beast[] {
  const cv = coversOf(m), out: Beast[] = [];
  nearest(cv.trees, heroes, 8, 3).forEach((t) => {
    const rid = Math.round(t.x * 7 + t.y * 13);
    for (let i = 0; i < 2; i++) out.push(leaf(t.x, t.y, rid, i, now, false));
  });
  const p = nearest(cv.pines, heroes, 7, 1)[0];
  if (p) out.push(leaf(p.x, p.y, Math.round(p.x * 7 + p.y * 13), 5, now, true));
  return out.slice(0, 5);
}

/** Is (x, y) free of a building, so a drip is not seen falling through a wall. */
const open = (m: GameMap, x: number, y: number) => x > 0.5 && y > 0.5 && x < m.w - 0.5 && y < m.h - 0.5 && !m.blocks.some((b) => b.kind !== 'sideway' && !b.ruined && x >= b.x - 0.3 && x <= b.x + b.w + 0.3 && y >= b.y - 0.3 && y <= b.y + b.h + 0.3);

/** A pale streak falls from the roof and lands in a tiny ring that spreads and fades: three sites, a few seconds each. */
function drips(m: GameMap, now: number, heroes: At[]): Beast[] {
  const out: Beast[] = [];
  const h = heroes[0];
  if (!h) return out;
  [3.3, 4.1, 5.2].forEach((P, j) => {
    const T = now / P + hash(j, 9), k = Math.floor(T), t = (T - k) * P;
    // Each drip belongs to a 3-tile cell round the hero, so it does not slide about as they walk.
    const cx = Math.round(h.x / 3) * 3 + (j - 1) * 2.2, cy = Math.round(h.y / 3) * 3;
    const x = cx + (hash(k + j, 3) - 0.5) * 5, y = cy + (hash(k, j + 5) - 0.5) * 3.2;
    if (t > 1.4 || !open(m, x, y)) return;
    const fall = t < 0.5, f = t / 0.5;
    out.push({
      key: `dr${j}`, x, y, up: fall ? 3.2 * (1 - f * f) : 0,
      draw: (c, px, py) => {
        const X = Math.round(px), Y = Math.round(py);
        if (fall) return dot(c, X, Y - 3, 0, 0, 1, 3, '#8a98a4', 0.6, true), dot(c, X, Y - 3, 0, 0, 1, 1, '#c4d0d8', 0.8, true);
        const r = Math.min(3, 1 + Math.floor((t - 0.5) * 4)), a = Math.max(0, 1 - (t - 0.5) / 0.9) * 0.55;
        dot(c, X, Y, -r, 0, 1, 1, '#9aa6b0', a, true), dot(c, X, Y, r, 0, 1, 1, '#9aa6b0', a, true);
        if (r > 1) dot(c, X, Y, -r + 1, -1, r * 2 - 1, 1, '#7a8690', a * 0.6, true), dot(c, X, Y, -r + 1, 1, r * 2 - 1, 1, '#7a8690', a * 0.6, true);
      },
    });
  });
  return out;
}

export function wildAmbient(m: GameMap, now: number, heroes: At[]): Beast[] {
  if (m.name === 'WICKHOLD' || !heroes.length) return [];
  const out = [...crowFigs(m, now, heroes), ...birds(m, now, heroes), ...leaves(m, now, heroes)];
  if (m.theme.floor === 'rock') out.push(...drips(m, now, heroes));
  return out.slice(0, 12);
}
