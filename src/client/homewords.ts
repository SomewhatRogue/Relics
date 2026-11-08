/**
 * The words on each hero's card on the home screen (title.ts), Kyle 2026-11-08: the hero plain across the top,
 * PLAY under it, and the rest (the wood again, deleting a hero) said plainly behind the dots.
 */
export const HOMEW = {
  line: (cls: string, level: number, gold: number) => `${cls} &middot; LEVEL ${level} &middot; ${gold} GOLD`,
  more: 'More',
  wood: 'PLAY THE TUTORIAL AGAIN',
  retire: 'DELETE THIS HERO',
  full: 'Three heroes at most. To make a new one, delete one first: tap the dots beside its PLAY button.',
  sure: (name: string) => `TAP AGAIN TO DELETE ${name} FOR GOOD`,
};
