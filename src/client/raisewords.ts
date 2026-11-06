/**
 * Every word RAISE puts on screen (sim/raise.ts: a Cleric raising a friend who is out for the job), in
 * one place for the lore keeper and the line editor. Plain, Kyle's style (docs/lore/prose-notes.md).
 */
export const RAISEW = {
  /** The context button (a phone) and the key prompt (a laptop) by a friend who is out. */
  button: 'RAISE',
  /** Over the friend, on every screen: the raise begins, is broken off, is done. */
  rising: 'RAISING',
  broke: 'BROKEN OFF',
  risen: 'RAISED',
  /** Over your own hero once you're raised: the most health you can have for the rest of the job (the pixel font has no %). */
  mine: (most: number) => `MAX HEALTH ${most} THIS JOB`,
  /** The job's line while you're out and a Cleric in the party could still raise you; while one is. */
  out: "You're out. A Cleric in your party can still raise you",
  outRising: (name: string) => `${name} is raising you`,
  /** On a hover over the health bar's cut-off end. */
  cut: 'Max health lost to being raised, till the job ends',
};
