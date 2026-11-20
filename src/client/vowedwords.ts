/**
 * VOWED gear's words (docs/design/holy-gear.md): what Father Odric says at the step when a clean hero is handed a
 * vowed piece for the hungry one they left, when they aren't clean yet, and at each step of their amends (never a
 * number: shared/amends.ts). The nine pieces' names, gifts and costs are in shared/vowed.ts.
 * Words through the lore keeper and the line editor, 2026-11-19.
 */
export const VOWEDW = {
  /** Handing back a vowed piece; `name` is the piece's, said in title case (client/vowedui.ts `spoken`). */
  handed: (name: string) => `This is ${name}, left on the step by someone, and it's sat in the back since with nobody to carry it, so it's yours, if you'll have it.`,
  /** The plain rule when nothing is handed back. */
  notClean: 'No vowed gear while you wear hungry gear or your hunger runs high.',
  /** At each step of amends, in order (shared/amends.ts AMENDS_STEPS): small, and he changes the subject. */
  steps: [
    "Well, that's a bit of it made good, I'd say, or near enough. Have you eaten? You look like you haven't.",
    "That's another gone off you, then. Agne has the kettle on, if you're passing.",
    "You keep coming back to the step. I've noticed, that's all.",
    "More than most, now, though I won't say any more than that. Mind the third stair, it rocks.",
  ],
  /** The card's chip and the dim row (asked of the Gear chat's card.ts). */
  dim: 'DIM: gives nothing while you wear hungry gear.',
};

/** A name as it's said, not shouted: THE WIDOW'S SWORD as The Widow's Sword. */
export const spoken = (name: string) => name.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase());
