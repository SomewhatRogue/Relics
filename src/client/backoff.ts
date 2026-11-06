/**
 * How long to wait before trying the relay again: exponential, capped, and jittered, so a page that
 * keeps failing slows down and many pages failing together (a relay restart) don't all come back in
 * the same instant. "Equal jitter": half the step is fixed, half random, so a wait is never near zero.
 * (Math.random here only spreads timing; it decides nothing in the game.)
 */
export const BACKOFF = { base: 500, cap: 15_000 };

/** The wait (ms) before try number `tries` (1 is the first retry). */
export function backoff(tries: number, rnd: () => number = Math.random, b = BACKOFF): number {
  const step = Math.min(b.cap, b.base * 2 ** Math.max(0, tries - 1));
  return Math.round(step / 2 + rnd() * (step / 2));
}

/**
 * A friend's rejoin when the leader has gone quiet (coop.ts): first after `first` seconds, then each
 * wait doubled up to `cap`, jittered the same way. `n` is how many rejoins in a row so far.
 */
export const REJOIN = { first: 5, welcome: 10, cap: 30 };
export function rejoinAfter(n: number, welcomed: boolean, rnd: () => number = Math.random): number {
  const step = Math.min(REJOIN.cap, (welcomed ? REJOIN.first : REJOIN.welcome) * 2 ** n);
  return n === 0 ? step : step * (0.75 + rnd() * 0.25);
}
