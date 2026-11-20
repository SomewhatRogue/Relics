/**
 * The town's side of being corrupt (docs/design/holy-and-hungry.md sections 1 and 2): the Want's bar on the pack
 * (client/wantbar.ts) and the healers turning you away (client/shops.ts). The Want itself is never named on screen.
 * Words through the lore keeper and the line editor, 2026-11-19.
 */
export const WANTW = {
  /** The bar's heading. */
  head: 'HUNGER',
  /** What it costs now, one line each, only the parts that are in the game. */
  seen: 'Goblins notice you sooner.',
  gift: (n: number) => `Your hungry gear is ${n}% stronger.`,
  corrupt: 'Named butchers come for you first.',
  half: 'Healing from friends is halved on you.',
  none: 'No cost yet.',
};

export const AGNEW = {
  /** Sister Agne, to a corrupt hero: she won't sell the Bitter. `gear`: wearing hungry gear; else the hunger alone. */
  refuse: (gear: boolean) => (gear
    ? "I'm afraid I can't sell it to you, not with that about you, and I'll not ask what it is, since you know better than I do. Take it up to the church and leave it there, and come back to me after."
    : 'I\'m afraid I can\'t sell it to you, not with that about you, so go up to the church and give something up and come back to me after.'),
  /** The plain rule under it. */
  rule: 'Sister Agne won\'t sell you the Bitter while you wear hungry gear or your hunger is high.',
};
