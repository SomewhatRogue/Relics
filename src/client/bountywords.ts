import { FENW } from './fenroamwords';

/** Every player-facing line of the bounties (shared/bounties.ts). The watch posts them and pays by the head, on your
 *  word (lore keeper, 2026-11-24: the watch's old head wages, story-bible.md "The Night Watch"). */
export const BOUNTYW = {
  heading: 'BOUNTIES',
  /** Under the heading at the gate, the guard's voice. */
  posted: "The watch pays by the head for what's out there, and takes your word on the count, since nobody *wants* the heads.",
  take: 'TAKE',
  handIn: 'HAND IN',
  full: 'You hold two bounties.',
  count: (got: number, n: number) => `${got} OF ${n}`,
  title: { wolves: 'THE WOLVES', den: 'THE DEN', nest: 'THE NEST', raiders: 'THE RAIDERS', snarers: 'THE SNARERS', ...FENW.title, ironhides: 'THE IRONHIDES', coinoak: 'THE COIN OAK', lanesnarers: 'THE SUNK LANES' } as Record<string, string>,
  line: {
    wolves: 'Kill the wolves in THE ROUGH PASTURE, and the one that runs them.',
    den: 'Kill the pouncers from the den in THE ROUGH PASTURE.',
    nest: "Break the spiders' nest at THE WOOD'S EDGE.",
    raiders: 'Kill the raiders in THE COMMON STRIPS.',
    snarers: "Kill the snarer, the netter and the two with them at THE WOOD'S EDGE.",
    ...FENW.line,
    ironhides: 'Kill the ironhides and their torch bearers up on THE STRUCK OAKS.',
    coinoak: 'Kill the band in the den under THE COIN OAK, and the ones guarding the way up.',
    lanesnarers: 'Kill the snarers in THE SUNK LANES, and the archers in the blind above them.',
  } as Record<string, string>,
};
