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
  /** The laptop's BUTTONS box (legend.ts), a Cleric's row for the context slot. `secs`: how long the raise takes. */
  legend: (secs: number) => `By a friend who is out: kneel and raise them. Keep still for ${secs} seconds; goblins nearby come for you while you do. Your friend gets up with less max health for the rest of the job.`,
  /** The recap's callout for the one in the party who raised the most friends (recapcalls.ts). */
  call: 'RAISED FRIENDS',
  /** On a hover over the health bar's cut-off end. */
  cut: 'Max health lost to being raised, till the job ends',
};
