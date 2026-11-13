/**
 * The words on each hero's card on the home screen (title.ts), Kyle 2026-11-08: the hero plain across the top,
 * PLAY under it, and the rest (the wood again, deleting a hero) said plainly behind the dots.
 */
import { coinsHtml } from '../shared/coins';
export const HOMEW = {
  line: (cls: string, level: number, gold: number) => `${cls} &middot; LEVEL ${level} &middot; ${coinsHtml(gold)}`,
  more: 'More',
  wood: 'PLAY THE TUTORIAL AGAIN',
  retire: 'DELETE THIS HERO',
  full: 'One hero of each class. To make another, delete one first: tap the dots beside its PLAY button.',
  /** On a class you have already, in the class pick. */
  have: 'YOURS',
  sure: (name: string) => `TAP AGAIN TO DELETE ${name} FOR GOOD`,
};
