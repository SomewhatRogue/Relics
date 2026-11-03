/**
 * The town hall's words: what the two vote boards on the wall say, and the two townsfolk under them
 * arguing their side of the north fields (Alder Bram for farming, Goodwife Sell for the camp). For the
 * lore keeper, then the line editor.
 */

/** On the boards (the 3x5 pixel font: capitals, short). */
export const BOARDW = {
  /** When it closes, by how many nights off (0 tonight, 1 tomorrow) and the weekday of that night. */
  closes: (nights: number, day: string) => `VOTING CLOSES ${nights <= 0 ? 'TONIGHT' : nights === 1 ? 'TOMORROW NIGHT' : day + ' NIGHT'}`,
  votes: (n: number) => `${n} ${n === 1 ? 'VOTE' : 'VOTES'}`,
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
      "The north fields are ours for the first time since the walls, and Jos swears there's barley coming up out there on its own, thin as you like, if the crows have left us any. Get that in and plough the rest, and the whole town eats through the frost with gold enough in the coffers to pay you lot what a job's *actually* worth.",
      "Open the gate instead and it's more mouths on the same sacks, and strangers sleeping inside the walls. I'm not saying they're bad people, mind, only that I don't know them, and I've stood at enough graves since the wall came down. I'd like to know who's sleeping next door.",
    ],
  },
  4: {
    choice: 'refugees', title: 'GOODWIFE SELL, FOR THE CAMP', who: 'Goodwife Sell',
    lines: [
      "There's a camp of our own sort out past the north gate, folk from all down the valley, and they've been sleeping under their carts all autumn with the frost coming on. Rescue Row has houses standing empty, and I can't for the life of me see why we'd keep a roof with nobody under it and a child under a cart.",
      "And there's a trader out there, Dessa, who knows every road in this valley and which ones still have a bridge. Bram will tell you about the barley, and he's right about the barley, he's *always* right about the barley. Ask his wife.",
    ],
  },
};

/** The reeve's panel: when it closes, and that you can change your mind until then. */
export const COUNCILW = {
  closes: (nights: number, day: string) => `Everyone in Wickhold has a voice, and voting runs all week. It closes ${nights <= 0 ? 'tonight' : nights === 1 ? 'tomorrow' : day.charAt(0) + day.slice(1).toLowerCase()} at midnight (Pacific time), and whichever side has the most voices then wins.`,
  tied: 'It was a tie, so the council sits one more night. If it\'s still a tie, Hollis breaks it himself.',
  yours: 'Your voice is in. You can change it until voting closes.',
};

/** Under the advocate's words: where the vote is actually cast. */
export const VOTE_AT = 'You vote at Reeve Hollis\'s table.';
