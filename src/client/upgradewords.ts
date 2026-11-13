/**
 * The upgrade screens' words (upgradeui.ts): the tabs, the head, the forks, each tile's state, the
 * detail view. For the lore keeper, then the line editor. The trainers' and knacks' own words stay where
 * they were (trainrows.ts, techniques.ts, ladder.ts, perks.ts, treewords.ts).
 */
import { coinsHtml } from '../shared/coins';
export const UPW = {
  /** The screen's heading opened from the pack (at a trainer it's the trainer's name). */
  title: 'TRAINING',
  /** The four tabs (RANKS became STATS, Kyle 2026-11-06: "RANKS doesn't mean anything"). */
  tabs: { skills: 'SKILLS', moves: 'MOVES', ranks: 'STATS', knacks: 'KNACKS' } as Record<string, string>,
  /** The head, always on top: gold and knack picks. */
  gold: (n: number) => coinsHtml(n),
  picks: (n: number) => (n === 1 ? '1 KNACK TO PICK' : `${n} KNACKS TO PICK`),
  noPicks: 'NO KNACKS TO PICK',
  /** Over a fork: the choices that exclude each other. */
  carryOne: 'CARRY ONE',
  pickOne: 'PICK ONE',
  chooseOne: 'CHOOSE ONE',
  /** Each tile's state. */
  owned: 'LEARNED',
  carrying: 'CARRYING',
  chosen: 'CHOSEN',
  max: 'MAX',
  taken: 'TAKEN',
  onOffer: 'ON OFFER',
  next: 'NEXT IN LINE',
  level: (n: number) => `NEEDS LEVEL ${n}`,
  first: (name: string) => `NEEDS ${name} FIRST`,
  notChosen: 'NOT CHOSEN',
  cost: (n: number) => coinsHtml(n),
  short: (n: number) => `${coinsHtml(n)}, NOT ENOUGH`,
  /** The detail view. */
  now: 'NOW',
  after: 'AFTER',
  notYet: 'Not learned yet.',
  nothingYet: 'Nothing yet.',
  ranks: 'RANKS',
  carry: 'CARRY',
  take: 'TAKE',
  back: 'BACK',
  /** Looked at away from the trainer (from the pack): where to buy it. */
  away: (who: string, where: string) => `${who} teaches this at ${where}.`,
  /** A knack that's next on its chain but not on offer. */
  nextKnack: 'Each level up offers the next knack from two of your chains. This one can come up then.',
  /** The skills tab's note: changing the one you carry is free. */
  carryNote: 'Tap a skill you know to carry it. One at a time, and changing is free.',
};
