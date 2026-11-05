/**
 * A round with stops in it: someone who walks a short loop and pauses at each corner to work (the
 * public works' crew sweeping, hauling planks, shovelling rubble). `stops[i]` is how many seconds
 * they stand at path point `i` before walking on. Pure: the same time gives the same place.
 */

export interface PathAt { x: number; y: number; fx: number; fy: number; still?: boolean }

/** Where someone walking `path` at `speed` tiles a second, with `stops`, is `t` seconds into it. */
export function stopsAt(path: [number, number][], stops: number[], speed: number, t: number): PathAt {
  const seg = path.map((a, i) => {
    const b = path[(i + 1) % path.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6;
    return { a, b, len, fx: (b[0] - a[0]) / len, fy: (b[1] - a[1]) / len, wait: Math.max(0, stops[i] ?? 0) };
  });
  const cycle = seg.reduce((s, q) => s + q.wait + q.len / speed, 0);
  let u = ((t % cycle) + cycle) % cycle;
  for (let i = 0; i < seg.length; i++) {
    const q = seg[i], came = seg[(i + seg.length - 1) % seg.length];
    // Stopped at the corner: facing the way they came in.
    if (u < q.wait) return { x: q.a[0], y: q.a[1], fx: came.fx, fy: came.fy, still: true };
    u -= q.wait;
    const dur = q.len / speed;
    if (u <= dur) {
      const k = u / dur;
      return { x: q.a[0] + (q.b[0] - q.a[0]) * k, y: q.a[1] + (q.b[1] - q.a[1]) * k, fx: q.fx, fy: q.fy };
    }
    u -= dur;
  }
  return { x: path[0][0], y: path[0][1], fx: 0, fy: 1, still: true };
}
