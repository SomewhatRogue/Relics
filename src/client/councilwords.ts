/**
 * The town hall's words: what the two vote boards on the wall say, and the two townsfolk under them
 * arguing their side of the north fields (Alder Bram for farming, Goodwife Sell for the camp). For the
 * lore keeper, then the line editor.
 */

/** On the boards (the 3x5 pixel font: capitals, short). */
export const BOARDW = {
  closes: (quorum: number, left: number) => `CLOSES AT ${quorum} VOTES: ${left} TO GO`,
  alone: 'PLAYING ALONE: YOUR VOTE DECIDES',
  notYet: 'THE COUNCIL HAS NOT SAT YET',
  chose: (short: string) => `THE COUNCIL CHOSE: ${short}`,
  nobody: 'NOBODY YET',
  more: (n: number) => `+${n} MORE`,
};

/** Who stands under which board (by their place in the town's talk, townui CHAT), and what they say. */
export const ADVOCATES: Record<number, { choice: string; title: string; who: string; lines: string[] }> = {
  3: {
    choice: 'farm', title: 'ALDER BRAM, FOR THE PLOUGH', who: 'Alder Bram',
    lines: [
      "The north fields are ours for the first time since the walls, and there's barley still standing up there that Jos sowed the spring before, if the crows have left us any. Plough them and get it in, and the whole town eats through the frost, and there's gold enough in the coffers to pay you lot what a job's actually worth.",
      "Open the gate instead and it's more mouths on the same sacks, and people we don't know sleeping inside the walls we lost half the town keeping. I'm not saying they're bad people, mind. I've just buried enough good ones to be careful.",
    ],
  },
  4: {
    choice: 'refugees', title: 'GOODWIFE SELL, FOR THE CAMP', who: 'Goodwife Sell',
    lines: [
      "There's a camp of our own sort out past the north gate, Barrowby folk mostly, and they've been sleeping under their carts all autumn with the frost a fortnight off. Rescue Row has houses standing empty, and I can't for the life of me see why we'd keep a roof with nobody under it and a child under a cart.",
      "And there's a trader out there, Dessa, who knows every road in this valley and which ones still have a bridge. Bram will tell you about the barley, and he's right about the barley, he's always right about the barley. Ask his wife.",
    ],
  },
};

/** Under the advocate's words: where the vote is actually cast. */
export const VOTE_AT = 'Votes are cast at Reeve Hollis\'s table.';
