/**
 * Near pairs only, for a crowded room (a big map's hundreds of goblins): bodies bucketed in cells of
 * `cell` tiles, and for each body the later bodies in its own and the eight cells round it, in the
 * list's order. The same pairs in the same order as checking every pair, where they're close enough to
 * touch, without the cost of all the rest.
 */
export function nearPairs(xs: Float64Array, ys: Float64Array, n: number, cell: number, each: (i: number, j: number) => void): void {
  const grid = new Map<number, number[]>(), key = (cx: number, cy: number) => cx * 4096 + cy;
  const cx = new Int32Array(n), cy = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    (cx[i] = Math.floor(xs[i] / cell)), (cy[i] = Math.floor(ys[i] / cell));
    const k = key(cx[i], cy[i]), l = grid.get(k);
    if (l) l.push(i);
    else grid.set(k, [i]);
  }
  const near: number[] = [];
  for (let i = 0; i < n; i++) {
    near.length = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const j of grid.get(key(cx[i] + a, cy[i] + b)) ?? []) if (j > i) near.push(j);
    near.sort((p, q) => p - q);
    for (const j of near) each(i, j);
  }
}
