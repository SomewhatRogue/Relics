/**
 * A friend's screen plays the leader's patches at the pace they were made (src/client/playout.ts):
 * patches that arrive in pairs (a party split over two relay instances: the relay's batch every 0.1 s)
 * are spread out again, a steady link waits next to nothing, and the wait never passes MAX_DELAY.
 */
import { describe, expect, it } from 'vitest';
import { MAX_DELAY, Playout } from '../src/client/playout';

/** Run frames at 60 a second from `from` to `to`; the times each patch was applied. */
function play(p: Playout<number>, arrivals: [number, number, number][], to: number) {
  const applied: [number, number][] = [];
  let i = 0;
  for (let now = 0; now <= to; now += 1 / 60) {
    while (i < arrivals.length && arrivals[i][2] <= now) (p.push(arrivals[i][0], arrivals[i][1], 1, arrivals[i][2]), i++);
    for (const v of p.due(now)) applied.push([v, now]);
  }
  return applied;
}

describe('the playout', () => {
  it('spreads patches that came in pairs back out to the pace they were made', () => {
    // Made every 0.05 s, arriving two at a time every 0.1 s (plus 0.08 s on the way).
    const arr: [number, number, number][] = [];
    for (let n = 0; n < 80; n++) arr.push([n, n * 0.05, Math.floor(n / 2) * 0.1 + 0.05 + 0.08]);
    const applied = play(new Playout<number>(), arr, 5);
    const late = applied.filter(([v]) => v >= 40);
    // Each frame gets at most one, and they come about 0.05 s apart, not 0 then 0.1.
    const gaps = late.slice(1).map(([, t], i) => t - late[i][1]);
    expect(Math.min(...gaps)).toBeGreaterThan(0.03);
    expect(Math.max(...gaps)).toBeLessThan(0.075);
    // Before (applied on arrival): every other gap was 0.
    expect(applied.map(([v]) => v)).toEqual([...Array(80).keys()]);
  });

  it('a steady link waits next to nothing, and no link waits past MAX_DELAY', () => {
    const steady: [number, number, number][] = [...Array(60).keys()].map((n) => [n, n * 0.05, n * 0.05 + 0.1]);
    const p = new Playout<number>();
    const a = play(p, steady, 3.5);
    for (const [v, t] of a) expect(t - steady[v][2]).toBeLessThan(1 / 60 + 1e-9);
    // Wild jitter: half a second either way.
    const wild: [number, number, number][] = [...Array(60).keys()].map((n) => [n, n * 0.05, n * 0.05 + 0.1 + (n % 3) * 0.25]).sort((x, y) => x[2] - y[2]) as [number, number, number][];
    const q = new Playout<number>();
    for (const [v, t] of play(q, wild, 6)) expect(t - wild.find((w) => w[0] === v)![2]).toBeLessThanOrEqual(MAX_DELAY + 1 / 60 + 1e-9);
  });

  it('one patch held up every 2 s (behind the whole-job save) no longer sets the wait for the rest', () => {
    // Steady every 0.05 s, but each 40th comes 0.09 s late.
    const arr: [number, number, number][] = [...Array(200).keys()].map((n) => [n, n * 0.05, n * 0.05 + 0.03 + (n % 40 === 20 ? 0.09 : 0)]);
    arr.sort((a, b) => a[2] - b[2]);
    const p = new Playout<number>(), waits: number[] = [];
    for (const [v, t] of play(p, arr, 11)) if (v > 60 && v % 40 !== 20) waits.push(t - arr.find((x) => x[0] === v)![2]);
    // Next to nothing (a frame), not 0.09 s for two seconds after each.
    expect(Math.max(...waits)).toBeLessThan(1 / 60 + 0.005);
  });

  it('a new room goes at once, and forgets the old room clock', () => {
    const p = new Playout<string>();
    p.push('a', 10, 1, 0);
    p.push('b', 10.05, 1, 0);
    expect(p.due(0)).toEqual(['a']);
    p.push('new room', 0, 2, 0.01);
    // (In order: what waited of the old room goes first, then the new one, all now.)
    expect(p.due(0.01)).toEqual(['b', 'new room']);
  });
});
