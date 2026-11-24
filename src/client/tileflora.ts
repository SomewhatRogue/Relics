/**
 * The smaller things that stand on a map, drawn the tile way like the trees (tiletrees.ts; docs/design/
 * forest-redraw.md, "Standing things"): a bush, a boulder, a dead tree. Six shades a material at most, lit from the
 * upper left, dark beneath, a dark outline; a few variants each, so a hedge is not one ball stamped in a row.
 * Ours: a bush may carry a few blood-red berries; a dead tree may hold a crow, or a length of old rope.
 */
import type { Cut } from './three/propcards';
import { clumpLight as clump } from './tilegrounds';
import { Grid, LEAF, hash, quant } from './tiletrees';

const STONE = ['#0c0b10', '#1a181f', '#27252d', '#35333d', '#45434e', '#585661'];
const DEAD = ['#0b0908', '#1b1613', '#2a231e', '#3a322b', '#4a4138'];

/** A bush, variant `v`, `big` for a wide one: a low mound of leafy lobes, dark where it meets the ground. */
export function bushCut(v: number, big: boolean): Cut {
  const W = (big ? 30 : 22) + Math.floor(hash(v, 1, 41) * 3) * 2, H = (big ? 20 : 16) + Math.floor(hash(v, 2, 41) * 2) * 2, cx = W / 2;
  const G = new Grid(W, H), foot = H - 1, n = big ? 5 : 4;
  // Lobes back to front: an upper row, then a lower row hanging in front of it.
  const lobes: [number, number, number][] = [];
  for (let i = 0; i < n - 1; i++) lobes.push([cx + ((i + 0.5) / (n - 1) - 0.5) * (W - 12) + (hash(v, i, 42) - 0.5) * 3, foot - H * 0.58, H * 0.36 + hash(v, i, 43) * 2]);
  for (let i = 0; i < n; i++) lobes.push([cx + ((i + 0.5) / n - 0.5) * (W - 8) + (hash(v, i, 44) - 0.5) * 3, foot - H * 0.3, H * 0.32 + hash(v, i, 45) * 2]);
  for (const [bx, by, br] of lobes) for (let y = Math.floor(by - br); y <= Math.min(foot, by + br); y++) for (let x = Math.floor(bx - br); x <= bx + br; x++) {
    const dx = x + 0.5 - bx, dy = y + 0.5 - by, d = Math.hypot(dx, dy * 1.1);
    if (d > br - (hash(x >> 1, y >> 1, 46) < 0.35 ? 1.4 : 0)) continue;
    let lv = 0.5 - (dx / br) * 0.2 - (dy / br) * 0.34 - ((x - cx) / W) * 0.18 + clump(x, y, 6, 4, 47);
    if (y > foot - 3) lv = Math.min(lv, 0.2);
    G.set(x, y, quant(lv));
  }
  G.outline(0);
  // A few berries, on some bushes: the colour of old blood.
  if (hash(v, 3, 48) < 0.4) for (let i = 0; i < 5; i++) {
    const x = 3 + Math.floor(hash(v, i, 49) * (W - 6)), y = 3 + Math.floor(hash(v, i, 50) * (H - 8));
    if (G.get(x, y) > 1) G.set(x, y, 6);
  }
  return G.cut([...LEAF, '#6b1d1b'], Math.round(cx), foot);
}

/** A boulder, variant `v`, `big` for a large one: a lit top plane, a darker face, cracks, moss on some. */
export function rockCut(v: number, big: boolean): Cut {
  const W = (big ? 26 : 16) + Math.floor(hash(v, 1, 51) * 3) * 2, H = (big ? 17 : 11) + Math.floor(hash(v, 2, 51) * 2) * 2, cx = W / 2;
  const G = new Grid(W, H), foot = H - 1, ridge = H * (0.34 + hash(v, 3, 51) * 0.12), skew = (hash(v, 4, 51) - 0.5) * 0.5;
  for (let y = 0; y <= foot; y++) for (let x = 0; x < W; x++) {
    // A lumpy outline: a squashed ellipse with a corner knocked off each side.
    const nx = (x + 0.5 - cx) / (W / 2), ny = (y + 0.5 - H * 0.55) / (H * 0.55), d = Math.pow(Math.abs(nx), 2.6) + Math.pow(Math.abs(ny), 2.2);
    if (d > 1 - (hash(x >> 2, y >> 2, 52 + v) < 0.3 ? 0.12 : 0) || (y > foot - 1 && Math.abs(nx) > 0.85)) continue;
    // The top plane, above a ridge that tilts across it; under it the face, darker to the right and toward the foot.
    const top = y < ridge + (x - cx) * skew;
    let s = top ? (nx < 0.1 ? 4 : 3) : nx < -0.25 ? 3 : nx < 0.45 ? 2 : 1;
    if (!top && y > foot - 3) s = Math.max(1, s - 1);
    if (top && y < 2 && nx < 0) s = 5;
    G.set(x, y, s);
  }
  // A crack or two down the face; moss lying on the top of some.
  for (let i = 0; i < (big ? 2 : 1); i++) {
    let x = Math.round(cx + (hash(v, i, 53) - 0.5) * W * 0.5);
    for (let y = Math.round(ridge); y < foot - 1; y++) (x += hash(v, y, 54 + i) < 0.35 ? (hash(v, y, 55) < 0.5 ? -1 : 1) : 0), G.get(x, y) > 0 && G.set(x, y, 0);
  }
  if (hash(v, 5, 56) < 0.5) for (let y = 1; y < ridge; y++) for (let x = 2; x < W - 2; x++) if (G.get(x, y) >= 3 && clump(x, y, 5, 3, 57 + v) > 0.02 && hash(x >> 2, y >> 1, 58 + v) < 0.5) G.set(x, y, 6 + (clump(x, y, 5, 3, 57 + v) > 0.12 ? 1 : 0));
  G.outline(0);
  return G.cut([...STONE, '#1f2e1c', '#2a3d25'], Math.round(cx), foot);
}

/** A dead tree, variant `v`: a bare trunk forking into crooked limbs; a crow on some, a length of rope on others. */
export function snagCut(v: number): Cut {
  const W = 34, H = 48 + Math.floor(hash(v, 1, 61) * 3) * 3, cx = Math.round(W / 2) + Math.round((hash(v, 2, 61) - 0.5) * 4), G = new Grid(W, H), foot = H - 1;
  // A limb: from (x, y) it climbs `len` steps, drifting by `dx` a step, thinning; it may fork once.
  const tips: [number, number][] = [];
  const limb = (x: number, y: number, dx: number, len: number, w: number, depth: number) => {
    for (let t = 0; t < len; t++) {
      const wx = Math.max(1, Math.round(w * (1 - t / (len * 1.3))));
      // (A limb is its own outline: black, as bare wood stands against the ground, its left edge catching light
      // where it is thick enough to have one.)
      for (let i = 0; i < wx; i++) G.set(Math.round(x) + i - (wx >> 1), Math.round(y), wx === 1 ? 0 : i === 0 ? 3 : 0);
      (x += dx + (hash(v, t + depth * 31, 62) - 0.5) * 0.5), (y -= 1);
      if (depth < 2 && t > len * 0.35 && hash(v, t + depth * 17, 63) < 0.12) limb(x, y, -dx * 0.9 + (hash(v, t, 64) - 0.5) * 0.4, len * 0.5, Math.max(1, wx - 1), depth + 1);
    }
    tips.push([Math.round(x), Math.round(y) + 1]);
  };
  const split = Math.round(foot - H * 0.42);
  for (let y = foot; y > split; y--) for (let i = -3; i < 3; i++) G.set(cx + i + (y > foot - 2 ? (i < 0 ? -1 : 1) : 0), y, i < -1 ? 4 : i < 1 ? 3 : 2);
  G.outline(0);
  limb(cx - 1, split + 3, -0.55 - hash(v, 8, 66) * 0.2, H * 0.5, 4, 0);
  limb(cx + 1, split + 3, 0.42 + hash(v, 9, 66) * 0.25, H * (0.36 + hash(v, 10, 66) * 0.14), 4, 0);
  limb(cx, split + 2, (hash(v, 11, 66) - 0.5) * 0.3, H * 0.34, 3, 1);
  const tip = tips.sort((a, b) => a[1] - b[1])[1] ?? tips[0], pick = hash(v, 7, 65);
  if (pick < 0.3) {
    // A crow, black against the sky.
    for (const [dx, dy] of [[0, -3], [1, -3], [-1, -2], [0, -2], [1, -2], [2, -2], [0, -1], [1, -1], [3, -1]]) G.set(tip[0] + dx, tip[1] + dy, 0);
    G.set(tip[0] - 2, tip[1] - 2, 5);
  } else if (pick < 0.5) {
    // Old rope from a limb, frayed at the end.
    const [rx, ry] = tips.sort((a, b) => Math.abs(b[0] - cx) - Math.abs(a[0] - cx))[0];
    for (let t = 2; t < 13; t++) G.set(rx, ry + t, t % 4 === 0 ? 6 : 7);
    G.set(rx - 1, ry + 13, 7), G.set(rx + 1, ry + 14, 7);
  }
  return G.cut([...DEAD, '#8a6a20', '#3a2f20', '#5a4a34'], cx, foot);
}

