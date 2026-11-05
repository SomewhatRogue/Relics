/** Town presence by dead reckoning (src/client/reckon.ts): few words for a walk, and the others keep up. */
import { describe, expect, it } from 'vitest';
import { Pace, RECKON, heardV, reckoned, type Sent } from '../src/client/reckon';

/** A walker at 60 frames a second along `path` (velocity by time); how many times it speaks, and the worst the others have it off. */
function walk(path: (t: number) => [number, number], secs: number) {
  const pace = new Pace();
  let x = 0, y = 0, sent: Sent | null = null, at = -9, words = 0, worst = 0;
  for (let i = 0; i <= secs * 60; i++) {
    const t = i / 60, [vx, vy] = path(t);
    (x += vx / 60), (y += vy / 60);
    const v = pace.at(t, x, y, path(t)), r = sent && reckoned(sent, t), off = r ? Math.hypot(r[0] - x, r[1] - y) : Infinity;
    if (off > RECKON.err && t - at >= RECKON.gap) (sent = { x, y, vx: v[0], vy: v[1], t }), (at = t), words++;
    else worst = Math.max(worst, off);
  }
  return { words, worst };
}

describe('town presence by dead reckoning', () => {
  it('a straight walk is a word or two, where three a second went before', () => {
    const w = walk(() => [4.4, 0], 6);
    expect(w.words).toBeLessThanOrEqual(2);
    expect(w.worst).toBeLessThan(RECKON.err + 4.4 * RECKON.gap);
  });
  it('a walk that turns speaks at the turns, and stays within about half a tile', () => {
    const w = walk((t) => (Math.floor(t / 1.5) % 2 ? [0, 4.4] : [4.4, 0]), 6);
    expect(w.words).toBeLessThanOrEqual(12);
    expect(w.worst).toBeLessThan(RECKON.err + 4.4 * RECKON.gap * 1.5);
  });
  it('carries the figure on only so far, and takes no wild velocity', () => {
    expect(reckoned({ x: 0, y: 0, vx: 4, vy: 0, t: 0 }, 10)).toEqual([4 * RECKON.ahead, 0]);
    expect(Math.hypot(...heardV([1e6, 0]))).toBe(RECKON.vmax);
    expect(heardV('x')).toEqual([0, 0]);
  });
});
