/**
 * The tailor's words (clothui.ts; docs/design/cloak-choice.md). Hester's lines went through the lore keeper and the
 * line editor (2026-11-17); the dyes and edges are the shield page's own names.
 */
import type { Row } from '../shared/clothlook';

export const CLOTHW = {
  who: 'Hester',
  title: 'THE TAILOR',
  offer: "It's old stock, so it costs me nothing, mind, and I charge you nothing. The colour's what you did for it, and I couldn't sell you that.",
  kept: "That sits right. Keep the hem out of the fire, if you can, I've lost a good few that way.",
  /** To a class she has nothing for yet. */
  none: "I've nothing cut for your trade yet, but come back, I'm waiting on the bolts for it.",
  note: "Looks only. Wearing what you've earned is free.",
  wear: 'WEAR IT',
  row: { dye: 'DYE', edge: 'EDGE', cut: 'CUT' } as Record<Row, string>,
  name: {
    dye: ['YOUR OWN', 'RED', 'BLUE', 'GREEN', 'BLACK', 'WHITE', 'OCHRE'],
    edge: ['YOUR OWN', 'IRON', 'SILVER', 'GOLD'],
    cut: ['YOUR OWN', 'LINED', 'RAGGED'],
  } as Record<Row, string[]>,
  /** What earns an entry and how far along: a tally of the Roll's by its own name, the Deep, the hero quests. */
  need: (what: string, have: number, of: number) => `Not earned yet: ${what} ${have} OF ${of}.`,
  deep: (have: number, of: number) => `Not earned yet: THE DEEP, FLOOR ${have} OF ${of}.`,
  quests: 'QUESTS DONE',
};
