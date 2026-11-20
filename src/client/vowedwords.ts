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
  /** Dicer Moll, to a hero in THE SWORN-OFF RING: a shrug, no lecture. And the plain rule. */
  moll: "Not in that ring, love, I don't take a sworn-off hand at my table, and it's your money to keep, so there's no harm in it. Gannet's pouring, anyway, and I'll be here when you take it off, cheating just the same.",
  mollRule: "No dice at Moll's while you wear THE SWORN-OFF RING.",
  /** Tobin, offered a vowed piece: the church kept it, and he won't buy it. And the plain rule. */
  tobin: "That came off Odric's shelf, and it's not mine to buy whatever you'd take for it, so keep it on you, and anything else in that sack I'll gladly look at.",
  tobinRule: "Tobin won't buy vowed gear.",
  /** How far a vowed piece has grown (shared/vowgrow.ts), on its card: the label, then one line. */
  growLabel: 'GROWS',
  grows: (pct: number, jobs: number) => `Gets stronger each job you finish without hungry gear or high hunger. ${pct}% grown, full in about ${jobs} ${jobs === 1 ? 'job' : 'jobs'}.`,
  frozen: 'Not growing: you wear hungry gear or your hunger is high. It keeps what it has.',
  full: 'Full strength.',
  /** The card's chip and the dim row (asked of the Gear chat's card.ts). */
  dim: 'DIM: gives nothing while you wear hungry gear.',
};

/** A name as it's said, not shouted: THE WIDOW'S SWORD as The Widow's Sword. */
export const spoken = (name: string) => name.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase());

/** A vowed piece's GROWS row for its card (asked of the Gear chat's card.ts): `corrupt`, the wearer is now. */
export function growRow(share: number, unitsLeft: number, corrupt: boolean): [string, string] {
  if (share >= 1) return [VOWEDW.growLabel, VOWEDW.full];
  const line = VOWEDW.grows(Math.floor(share * 100), Math.max(1, Math.ceil(unitsLeft)));
  return [VOWEDW.growLabel, corrupt ? `${line} ${VOWEDW.frozen}` : line];
}
