/**
 * Off a height, seen as a jump (Kyle, 2026-11-18: "make it clear when they (or you) jump off"; then "it still
 * feels like I'm falling off the edge, not jumping and landing"). The rules set a body down on the ground below
 * in one tick, clear of the bank. Drawn, it leaps: up and out from where it stood on the lip, across to where it
 * lands, in HOP.time seconds. A Rogue going up a face scrambles the other way. Drawing only: nothing in the fight
 * reads it.
 *
 * `hopAt(key, x, y, h, sx, sy)`: where to draw `key` this frame. (x, y) is where it would be drawn (smoothed between
 * ticks), `h` the height the rules have it at, (sx, sy) where the rules have it. A change of height under HOP.min is
 * followed at once (a slope, a step); a bigger one starts a leap from where it was last drawn.
 */
export const HOP = { time: 0.42, up: 0.7, climb: 0.25, min: 0.4, far: 2.4 };

interface S { h: number; from: number; t0: number; x: number; y: number; ox: number; oy: number }
const seen = new Map<string, S>();
const clock = () => performance.now() / 1000;

export function hopAt(key: string, x: number, y: number, h: number, sx = x, sy = y, now = clock()): [number, number, number] {
  let s = seen.get(key);
  if (!s) {
    if (seen.size > 600) seen.clear();
    seen.set(key, (s = { h, from: h, t0: -9, x, y, ox: 0, oy: 0 }));
    return [x, y, h];
  }
  if (Math.abs(h - s.h) >= HOP.min) {
    s.from = height(s, now), s.t0 = now;
    // From where it was last drawn to where the rules have set it down (a longer way is not a leap: no carry).
    const ox = s.x - sx, oy = s.y - sy, far = Math.hypot(ox, oy) > HOP.far;
    (s.ox = far ? 0 : ox), (s.oy = far ? 0 : oy);
  }
  s.h = h;
  const t = (now - s.t0) / HOP.time;
  if (t >= 1 || t < 0) return (s.x = x), (s.y = y), [x, y, h];
  const at: [number, number, number] = [sx + s.ox * (1 - t), sy + s.oy * (1 - t), height(s, now)];
  return (s.x = at[0]), (s.y = at[1]), at;
}

/** A body drawn by something else this frame (a climb, climbanim.ts): note where the rules have it, so no leap starts after. */
export function hopQuiet(key: string, x: number, y: number, h: number): void {
  const s = seen.get(key);
  if (s) Object.assign(s, { h, from: h, t0: -9, x, y, ox: 0, oy: 0 });
}

/** The height alone (a body whose place is not carried). */
export const hopHeight = (key: string, h: number, now = clock()) => hopAt(key, 0, 0, h, 0, 0, now)[2];

/** Whether `key` is in the air this frame. */
export const hopping = (key: string, now = clock()) => { const s = seen.get(key); return !!s && now - s.t0 < HOP.time && now >= s.t0; };

function height(s: S, now: number): number {
  const t = (now - s.t0) / HOP.time;
  if (t >= 1 || t < 0) return s.h;
  const arc = 4 * t * (1 - t);
  // Down: up off the lip first, then the fall, fastest at the ground. Up: fast off the ground, slow onto the lip.
  return s.h < s.from ? s.from + (s.h - s.from) * t * t + HOP.up * arc : s.from + (s.h - s.from) * (1 - (1 - t) * (1 - t)) + HOP.climb * arc;
}
