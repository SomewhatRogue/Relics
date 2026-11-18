/**
 * Near pairs only, for a crowded room (a big map's hundreds of goblins): bodies bucketed in cells of
 * `cell` tiles, and for each body the later bodies in its own and the eight cells round it, in the
 * list's order. The same pairs in the same order as checking every pair, where they're close enough to
 * touch, without the cost of all the rest.
 */
export function nearPairs(xs: Float64Array, ys: Float64Array, n: number, cell: number, each: (i: number, j: number) => void): void {
  // Each cell's bodies in one flat list (`at`), the cell's run from start[c] for size[c], in the list's order.
  const slot = new Map<number, number>(), key = (cx: number, cy: number) => cx * 4096 + cy;
  const cx = new Int32Array(n), cy = new Int32Array(n), of = new Int32Array(n), size = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    (cx[i] = Math.floor(xs[i] / cell)), (cy[i] = Math.floor(ys[i] / cell));
    const k = key(cx[i], cy[i]);
    let c = slot.get(k);
    if (c === undefined) slot.set(k, (c = slot.size));
    of[i] = c;
    size[c]++;
  }
  const start = new Int32Array(slot.size + 1), at = new Int32Array(n), fill = new Int32Array(slot.size);
  for (let c = 0; c < slot.size; c++) start[c + 1] = start[c] + size[c];
  for (let i = 0; i < n; i++) at[start[of[i]] + fill[of[i]]++] = i;
  const near = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    let m = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const c = slot.get(key(cx[i] + a, cy[i] + b));
      if (c === undefined) continue;
      for (let q = start[c], end = start[c + 1]; q < end; q++) if (at[q] > i) near[m++] = at[q];
    }
    // (Every index is different, so a plain numeric sort gives the one order.)
    if (m > 1) near.subarray(0, m).sort();
    for (let q = 0; q < m; q++) each(i, near[q]);
  }
}
