/** Boss loot screens: the words (the roll card, the result, the chat line). One file, for the lore keeper and line editor. */
import type { LootPick } from '../sim/types';

export const LOOTW = {
  title: 'UNIQUE',
  need: 'NEED',
  greed: 'GREED',
  pass: 'PASS',
  waiting: 'Waiting for the others',
  yourPick: (p: LootPick) => `You chose ${LOOTW[p]}`,
  /** A hero's choice, as the result lists it. */
  pick: (p: LootPick) => LOOTW[p],
  /** The piece's kind line. */
  weapon: (kit: string, cls: string) => `${kit}, for ${cls}`,
  armor: (kind: string) => `${kind} armor`,
  ring: 'Ring, any class',
  notYours: 'Not for your class',
  everyonePassed: 'Everyone passed',
  won: (who: string, what: string, how: string, n: number) => `${who} won ${what} (${how}, ${n})`,
  nobody: (what: string) => `Nobody took ${what}`,
  winnerTag: 'WON',
};
