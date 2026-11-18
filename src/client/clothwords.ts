/**
 * The tailor's words (clothui.ts; docs/design/cloak-choice.md). Hester's lines went through the lore keeper and the
 * line editor (2026-11-17); the dyes and edges are the shield page's own names; the rest are plain labels.
 */
import type { Row } from '../shared/clothlook';

export const CLOTHW = {
  who: 'Hester',
  title: 'THE TAILOR',
  offer: "It's old stock, so it costs me nothing, mind, and I charge you nothing. The colour's what you did for it, and I couldn't sell you that.",
  kept: "That sits right. Keep the hem out of the fire, if you can, I've lost a good few that way.",
  /** To a class she has nothing for. */
  none: "I've nothing cut for your trade yet, but come back, I'm waiting on the bolts for it.",
  note: "Looks only. Wearing what you've earned is free.",
  /** Under the rows while a locked entry is picked: it shows on the hero above, and WEAR IT will leave it off. */
  locked: (name: string) => `${name} is locked. You can look at it, but not wear it yet.`,
  wear: 'WEAR IT',
  row: { dye: 'DYE', edge: 'EDGE', cut: 'CUT' } as Record<Row, string>,
  name: {
    dye: ['YOUR OWN', 'RED', 'BLUE', 'GREEN', 'BLACK', 'WHITE', 'OCHRE'],
    edge: ['YOUR OWN', 'IRON', 'SILVER', 'GOLD'],
    cut: ['YOUR OWN', 'LINED', 'RAGGED'],
  } as Record<Row, string[]>,
  /** The list of what is still locked, each with its deed and how far along: a tally of the Roll's by its own name,
   *  the Deep, the hero quests. */
  ahead: 'LOCKED: HOW TO EARN EACH',
  all: 'Nothing left to earn here.',
  need: (what: string, have: number, of: number) => `${what} ${have} OF ${of}`,
  deep: (have: number, of: number) => `THE DEEP, FLOOR ${have} OF ${of}`,
  quests: 'QUESTS DONE',
};
