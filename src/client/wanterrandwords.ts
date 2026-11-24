/**
 * The first hungry piece home (shared/wanterrands.ts; Kyle, 2026-11-23): the two quests' goal lines, Father Odric's
 * talk at the church, and Dorcas's in the Keeping Room. The church's title is Kyle's own, the under one the lore keeper's
 * (Kyle's yes, 2026-11-24); the rest through the lore keeper
 * and line editor, 2026-11-23.
 */
export const WANTQW = {
  /** The goal line's rows (client/errandline.ts): a label, what to do, folded. Kyle's quest titles. */
  pin: { church: 'HUNGRY GEAR', under: 'A WHISPER' },
  todo: { church: 'Talk to the church about giving it up', under: 'Find the woman below the sewer grate' },
  small: { church: 'TALK TO FATHER ODRIC AT THE CHURCH', under: 'FIND DORCAS BEHIND THE SEWER GRATE' },
  /** The whisper, back in town with the first red piece: it calls you down to the Keeping Room. Who speaks is never said. */
  whisperTitle: 'A WHISPER',
  whisper: ["Under the town, past the grate, there's an arch somebody bricked up, and it'll open for you.", "There's a woman down there who knows what you're carrying. Come and see her."],
  /** The plain line under it. */
  whisperRule: 'Go to the sewer grate. Father Odric at the church also wants a word about your hungry gear.',
  /** Odric, the first time in with it: what hungry gear does, and the give-up. */
  odric: [
    "That piece you've brought home is stronger than anything you could buy, I'll not argue it. Only it wants something of you, and the longer you wear it, the more it takes.",
    "Leave it on the step and that's amends made, and I'll put a vowed piece in your hands for it. It grows with you the same way, and one day it'll have grown all it can, and then you give it up or it goes bad.",
  ],
  /** The plain rule under Odric. */
  odricRule: 'Give hungry gear up here with the buttons below.',
  /** Dorcas, the first time in: the other road. */
  dorcas: [
    "Oh, you've the look, duck. Brought something home that keeps hold of you, haven't you, and they'll have told you up top to give it back.",
    "Keep it on, and the longer you do, the stronger it is, and I'll not pretend that's nothing. It costs, mind. The teeth notice you sooner, and the named ones come for you first, and Sister Agne won't sell you the Bitter, and when you're at your worst a friend's healing does you half.",
    "And the vowed pieces you've got, bring them down here with a relic on them and I'll see they're fed.",
  ],
};
