/**
 * Titles' words (shared/titles.ts): the TITLES panel at Father Odric's and Dorcas's. The titles themselves are the
 * lore keeper's (in shared/titles.ts). Through the lore keeper and the line editor, 2026-11-24.
 */
export const TITLEW = {
  button: 'TITLES',
  head: 'TITLES',
  /** Who sells them, a line each. */
  odric: "Some folk like a name to go with what they've done, and I'll not stop them. Leave a gift at the Lantern, whatever you can spare, and we'll say no more about it.",
  dorcas: "Everybody wants a name, duck, and I've four going, cheapest first. Coin on the counter and it's yours to wear, and none of them come free.",
  /** The plain lines. */
  deeds: (church: boolean, n: number) => (church ? `Your deeds at the church: ${n}.` : `Your deeds down here: ${n}.`),
  /** Each shop says only its own half. */
  rule: (church: boolean) => (church ? 'These show only while you wear no hungry gear and your hunger is low.' : 'These show only while you wear hungry gear or your hunger is high.'),
  churchPay: 'Paid as a gift at the Lantern.',
  wornAs: (name: string) => `You go by ${name}.`,
  noneWorn: 'You wear no title.',
  /** A title's button, by where it stands. */
  needs: (word: string, n: number) => `${word}: NEEDS ${n} ${n === 1 ? 'DEED' : 'DEEDS'}`,
  buy: (word: string, coins: string) => `${word}: ${coins}`,
  wear: (word: string) => `WEAR ${word}`,
  off: (word: string) => `TAKE OFF ${word}`,
};
