/**
 * Trading's own words (docs/design/trading.md, step 3; for the lore keeper and the line editor). The game's
 * voice: short, plain, second person. TRADE and ACCEPT are Kyle's (the spec), GONE too (ledger.ts).
 */
export const TRADEW = {
  /** Over your head beside another player in town, and the phone's context button. */
  spot: (name: string) => `TRADE: ${name}`,
  button: 'TRADE',
  asks: (name: string) => `${name} wants to trade.`,
  title: (name: string) => `TRADE: ${name}`,
  theirs: (name: string) => `${name} OFFERS`,
  mine: 'YOU OFFER',
  pack: 'YOUR PACK',
  nothing: 'Nothing yet.',
  gold: (n: number) => `${n} gold`,
  have: (n: number) => `You have ${n} gold.`,
  offer: 'OFFER',
  back: 'TAKE BACK',
  accept: 'ACCEPT',
  callOff: 'CALL IT OFF',
  close: 'CLOSE',
  status: {
    asking: (name: string) => `Waiting for ${name} to say yes.`,
    open: "Add what you'll trade, then both press ACCEPT. If anything changes, you both press it again.",
    theyOk: (name: string) => `${name} has accepted.`,
    youOk: (name: string) => `You've accepted. Waiting for ${name}.`,
    sending: 'Both accepted. Swapping.',
    done: 'Traded.',
    bad: 'It didn\'t go through. Nothing changed hands.',
    off: 'Called off.',
  },
  calledOff: (name: string) => `${name} called the trade off.`,
  noRoom: (name: string) => `No room in your pack or vault for what ${name} offers.`,
  noLink: 'No connection. Try again.',
  emptyPack: "You have nothing in your pack to trade. Hungry gear and relics can't be traded.",
};
