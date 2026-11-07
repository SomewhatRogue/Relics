/**
 * Every word of the statue in Lantern Square: Foreman Judd at the public works, the panel, the notes after a
 * bid, and what's cut on the plinth. (For the lore keeper and the line editor: none of it has been through
 * them yet.)
 */
export const STATUE_WORDS = {
  title: 'THE STATUE',
  /** The public works board's button to it. */
  open: 'THE STATUE',
  judd: {
    empty: "That plinth in the square's stood empty since the siege. A thousand gold pays the masons, and then it's you up there, with your name cut under you.",
    taken: (name: string) => `That's ${name} up there now. Pay more than they did and the masons will put you up instead, and cart ${name} off round the back.`,
    /** Not given the town enough yet (tuning.ts STATUE_GIVEN): how much more. */
    notYet: (more: number) => `I'd put you up there gladly, but it's the town's square, and Hollis's book says you're ${more} gold short of what it takes. Give it to the works here or to the Lantern box, either one counts, and then we'll talk about your statue.`,
    yours: "That's you up there, and it's a fair likeness, mostly. Somebody's going to pay to have you carted off one of these days, mind.",
  },
  who: (name: string, paid: number) => `On the plinth: <b>${name}</b>, who paid ${paid} gold.`,
  nobody: 'Nobody on the plinth yet.',
  first: (n: number) => `The first statue costs ${n} gold.`,
  range: (lo: number, hi: number) => `To take the plinth, pay from ${lo} to ${hi} gold.`,
  gold: (n: number) => `You have ${n} gold.`,
  custom: 'OR TYPE IT',
  pay: (n: number) => `PAY ${n} GOLD`,
  back: 'BACK',
  out: "Your gold's with the masons. You'll hear back in a moment.",
  blocked: "You're not connected to the town, so the masons can't take your gold. Try again in a moment.",
  /** After a bid. */
  won: 'Your statue is up in the square.',
  lost: (name: string) => `Someone paid more for the statue just before ${name} did, so ${name}'s gold is back.`,
  refused: "The masons couldn't take that, so your gold is back.",
  /** On the empty plinth's sign, a line each (3x5 capitals, 4 letters a line at most). */
  sign: ['SEE', 'JUDD'],
};
