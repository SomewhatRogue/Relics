/**
 * Orla of the watch, out on the road past Greyhollow, who meets the hero in the wood once the Stoker
 * is dead (sim/woodguard.ts): she saw the smoke, knows Hew's boots, takes his tally stick for Father
 * Odric and walks the hero to Wickhold (Kyle, 2026-11-04). Lines checked by the lore keeper.
 */
export const ORLA = {
  name: 'ORLA OF THE WATCH',
  who: 'ORLA',
  /** What she says when she reaches you, one box at a time. */
  meet: [
    'I saw the smoke from the road and came to look.',
    "Those are Hew's boots you've got on, so that's him by the hut. Poor old Hew.",
    "And you lived through the field? Nobody else from the column's come back.",
    "Come with me to Wickhold. I'll take his tally of the dead to Father Odric.",
  ],
  /** Where she comes from (the road, west), how fast she walks, how near she stops, how long she crouches at Hew. */
  roadY: 4.5,
  gate: { x: 43, y: 5 },
  speed: 3.6,
  near: 1.4,
  stoop: 0.9,
};
