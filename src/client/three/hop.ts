/**
 * Off a height, seen (Kyle, 2026-11-18: "make it clear when they (or you) jump off, a little animation or puff when
 * you hit the ground"). The rules move a body between levels in one tick. Drawn, it hops: a small rise, then the
 * fall (or, for a Rogue going up a face, a quick scramble). Drawing only: nothing in the fight reads it.
 *
 * `hopHeight(key, h)`: the height to draw `key` at this frame, given the height the rules have it at. A change of
 * less than HOP.min is followed at once (a slope, a step); a bigger one is a hop of HOP.time seconds.
 */
export const HOP = { time: 0.3, up: 0.34, min: 0.4 };

interface S { h: number; from: number; t0: number }
const seen = new Map<string, S>();
const clock = () => performance.now() / 1000;

export function hopHeight(key: string, h: number, now = clock()): number {
  const s = seen.get(key);
  if (!s) {
    if (seen.size > 600) seen.clear();
    seen.set(key, { h, from: h, t0: -9 });
    return h;
  }
  if (Math.abs(h - s.h) >= HOP.min) (s.from = drawn(s, now)), (s.t0 = now);
  s.h = h;
  return drawn(s, now);
}

function drawn(s: S, now: number): number {
  const t = (now - s.t0) / HOP.time;
  if (t >= 1 || t < 0) return s.h;
  // Down: slow off the lip, fast at the ground. Up: fast off the ground, slow onto the lip. A small rise either way.
  const k = s.h < s.from ? t * t : 1 - (1 - t) * (1 - t);
  return s.from + (s.h - s.from) * k + HOP.up * 4 * t * (1 - t) * (s.h < s.from ? 1 - t : 1);
}
