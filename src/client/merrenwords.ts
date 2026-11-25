/**
 * Old Merren, who dresses a weapon with an element for five jobs (docs/design/element-augments.md; Kyle, 2026-11-24).
 * His panel is client/merrenui.ts. Lines as approved.
 */
import type { EdgeEl } from '../shared/edges';

export const MERRENW = {
  /** The word sent after a hero at level 5 (shown as a toast when the errand is given). */
  runner: "Old Merren wants you, over by the Old Quarter. He says bring whatever you hit things with, and he'll see what it's missing.",
  /** The goal line. */
  goal: 'SEE OLD MERREN BY THE OLD QUARTER',
  goalLong: 'See Old Merren by the Old Quarter',
  pin: 'OLD MERREN',
  greeting: "Give it here. I was dressing blades on this street before your mother was born, and I can make one burn, chill or shock whatever it cuts for five jobs, till the wiping down takes it off. The first of each I'll do for nothing, to see if you come back.",
  greetingGame: 'Fire, frost or storm on your weapon for 5 jobs. Your first of each is free.',
  mage: "No, not you. Whatever you work through that thing of yours would burn my dressing straight off, so keep your coin. Sit a while if you like, nobody else does.",
  young: "Not yet. Come back when you've a few more jobs on you, and I'll know you're worth the tallow.",
  youngGame: 'From level 5.',
  replace: (old: EdgeEl) => `It's still got ${old} on it, and I can't put two on one edge, so the ${old} comes off for good. You sure?`,
  yes: 'YES, CHANGE IT',
  no: 'NO, KEEP IT',
  done: "There. That'll see you through five jobs, and then you know where I am.",
  // (No sum said: it goes by the grade, 5s to 15s. Kyle, 2026-11-25.)
  shortCoin: "You're short, and I don't haggle, I'm too old to enjoy it.",
  shortCoal: "Fire wants a sack of charcoal, and I've none. The woman at the Charcoal Hut sells it, out the North Gate on the north fields, and you can tell her it's for me, but she'll still charge you.",
  close: 'CLOSE',
  /** The button names. */
  el: { fire: 'FIRE', frost: 'FROST', storm: 'STORM' } as Record<EdgeEl, string>,
  free: 'FREE',
  strong: 'STRONG',
  fierce: 'FIERCE',
  need: (mat: string) => `You need 1 ${mat}.`,
  fierceDone: "Well now, I don't think I've had the like of this by my wheel since before the siege, and you've come back with *all* your fingers on, too.",
  back: 'BACK',
  charcoal: 'CHARCOAL',
};
