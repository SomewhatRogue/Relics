// The new look's see-through hole (three/buildings3d.ts, `?hd&street`): pure, so it can be tested without a screen.
/**
 * Whether a building hides your hero from the chase camera (`?hd&street`): the line from your hero toward the camera
 * (swung by `yaw`, looking down at `pitch`) meets its footprint (a little widened) before it has climbed over `top`. Slab test on the segment.
 */
export function hides(me: [number, number], x0: number, z0: number, x1: number, z1: number, top: number, yaw: number, pitch: number): boolean {
  const L = Math.max(0, top - 0.9) / Math.tan(pitch), dx = -Math.sin(yaw) * L, dz = Math.cos(yaw) * L;
  let t0 = 0, t1 = 1;
  for (const [p, d, lo, hi] of [[me[0], dx, x0 - 0.6, x1 + 0.6], [me[1], dz, z0 - 0.3, z1 + 0.3]]) {
    if (Math.abs(d) < 1e-6) {
      if (p < lo || p > hi) return false;
      continue;
    }
    let a = (lo - p) / d, b = (hi - p) / d;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a), t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  // Standing in its footprint's own margin in front of it (t0 at 0, already inside) doesn't count.
  return t1 > 0.02 && !(me[1] > z1 - 0.1);
}
