/**
 * Mini quests' words (shared/miniquest.ts), by quest: what the giver says when you talk to them (`offer`), the
 * goal's second line while it's taken (`goal`), what's said where it's done (`done`: whoever comes out), and the
 * giver's last word as they go home (`home`). Each is said once, as floating words over a head, so each is short.
 * Lowfurrow's: lore keeper and line editor, 2026-11-17 (docs/decisions/territories.md). Nobody says a number, a
 * name, or where the roped went; the speakers say "they" and "the big one", the goal line "goblin".
 */
export interface MiniLines { offer: string; goal: string; done?: string; home?: string }

export const MINI_WORDS = {
  /** GRAB's word beside someone with something to say (the town's word). */
  talk: 'TALK',
  /** Before the goal's second line. */
  also: 'Also',
  /** A quest with no words of its own. */
  plain: { offer: '', goal: 'Do what they asked' } as MiniLines,
  by: {
    // Lowfurrow Fields (docs/design/territories.md, "1. Lowfurrow Fields"): the woman under the near handcart and
    // her sister in the pond's willows; the man up the pear tree and the one that tied the rope.
    'low-sister': {
      offer: "My sister ran into the rye when they came, toward the pond. She's not one to stay quiet this long.",
      goal: "Find the woman's sister by the pond",
      done: 'I heard it go quiet. Is she alive, my sister?',
    },
    'low-rope': {
      offer: "I'm not coming down. The big one that tied the rope is still here, asleep outside the barn.",
      goal: 'Kill the big goblin outside the barn',
      home: "I saw it fall. I'll come down now, if you'll look the other way.",
    },
    // The proving hill's (shared/hillmap.ts): a test map, never played for its words.
    'hill-pond': { offer: 'There is one more of us, by the pond.', goal: 'Kill the two by the pond', done: 'She is out.' },
  } as Record<string, MiniLines>,
};

export const miniWords = (id: string): MiniLines => MINI_WORDS.by[id] ?? MINI_WORDS.plain;
