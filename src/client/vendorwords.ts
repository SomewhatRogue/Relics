/**
 * The class vendors' own words (2026-11-05; through the lore keeper, then the line editor): each a person
 * at a counter in their class's place, the place in one line, and what they say when you come up.
 * New people (for the story bible): Quartermaster Nell (the barracks stores), Bowyer Tems (the hunters'
 * lodge), Nettle (a table at the back of the Drowned Rat), Apprentice Lis (Vell's tower), Verger Oswin
 * (the church's vestry).
 */
import type { HeroClass } from '../shared/tuning';
import type { Place } from './shopwords';

export const VENDOR_PLACES: Record<HeroClass, Place & { who: string; greet: string }> = {
  WARRIOR: {
    name: 'THE BARRACKS STORES', line: 'A rack and a counter at the end of the barracks.', keeper: 'QUARTERMASTER NELL', who: 'Nell',
    greet: "Whatever comes back through the gate ends up on my rack sooner or later, and whatever's on my rack goes back out again. That's the whole job, near enough.",
  },
  RANGER: {
    name: "THE BOWYER'S BENCH", line: "Bows on pegs and arrows drying, at the back of the hunters' lodge.", keeper: 'BOWYER TEMS', who: 'Tems',
    greet: "Maeve says I string them too tight, and Maeve's *wrong*, but you didn't hear that from me. Take any of them down and have a pull.",
  },
  ROGUE: {
    name: "NETTLE'S TABLE", line: 'A table at the back of the Drowned Rat, a cloth over the goods.', keeper: 'NETTLE', who: 'Nettle',
    greet: "Don't ask where any of it came from and I won't ask where you're taking it, which is a better arrangement than most marriages, I find.",
  },
  MAGE: {
    name: 'THE FOCUS CUPBOARD', line: "A cupboard of wands and staves under Vell's stair.", keeper: 'APPRENTICE LIS', who: 'Lis',
    greet: "The Magister lets me sell the ones he's done with. Well, he hasn't said I can't, which is nearly the same. Please don't wave them about in here, the last one who did lost his ~eyebrows~.",
  },
  HEALER: {
    name: 'THE VESTRY', line: "The church's vestry, the maces hung up beside the robes.", keeper: 'VERGER OSWIN', who: 'Oswin',
    greet: 'Mother Isolde sends down the ones that come back dented, and I knock them straight and hang them up again. Mind, most of the dents are hers.',
  },
};
