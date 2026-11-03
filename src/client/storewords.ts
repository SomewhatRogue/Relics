/**
 * Every new word for the pack, the vault, Tobin's stall and the forge (2026-11-02), kept together so
 * the lore keeper and the line editor can take them in one pass. Game voice is short and plain;
 * what people say is in their own voice (docs/lore/voice.md).
 */
export const PACKW = {
  hand: 'HAND', body: 'BODY', ring: 'RING', relic: 'RELIC', skill: 'SKILL', belt: 'BELT',
  bag: 'PACK',
  wear: 'WEAR',
  hint: 'Tap a piece to see it beside what you wear.',
  hover: 'Point at a piece to see it beside what you wear. Click to choose it.',
  inTown: 'In town: sell it to Tobin on Market Row, or put it in the vault at the Counting House.',
  hungry: 'Hungry gear stays with you. Only the church will take it.',
  skillLine: 'Your class skill. Your trainer changes it, not the pack.',
  fullJob: 'Your pack is full. Drop something to make room.',
  notYours: 'Not for your class.',
};

/** Keeper Edda and the counting house: the vault (new building and keeper, for lore review). */
export const BANK = {
  name: 'THE COUNTING HOUSE',
  keeper: 'KEEPER EDDA',
  greet: "The roof came in the last winter of the siege and nobody's had the timber for it since, but the vault's under the floor and the vault's *sound*. Put in what you like and take out what you like, and I write it all down.",
  hungry: "Not that one. I don't care what it's worth, it doesn't go down there.",
  grown: "That's another shelf down there for you. Mind your head on the stair, everybody cracks it the first time.",
  vault: 'VAULT',
  store: 'PUT IN THE VAULT',
  take: 'TAKE OUT',
  shelves: 'MORE SHELVES',
  biggest: 'The vault holds all it can.',
  tap: 'Tap a piece to move it between your pack and the vault.',
  safe: 'What is in the vault stays there, job after job.',
};

/** Tobin the pawnbroker, on Market Row (new NPC, for lore review). */
export const PAWN = {
  name: 'TOBIN THE PAWNBROKER',
  stall: 'PAWN',
  greet: "I'll buy it, whatever it is, and if you want it back it's yours at what I paid, so long as you're not out the gate and home again first. After that it's mine, and I'm not sentimental.",
  hungry: "No, put that away, I'm not touching it at any price. I've a family.",
  sold: 'Pleasure.',
  back: 'BUY BACK',
  sell: (gold: number) => `SELL (+${gold} GOLD)`,
  rule: 'Anything you sell him, you can buy back for what he paid until you come home from your next job.',
  bigger: 'A BIGGER PACK',
  biggest: 'Your pack is as big as they come.',
  emptyRow: 'Empty stalls and a cat, and Tobin at the far one. The traders are camped outside the north gate with the refugees, and the gate stays shut to them until the council says otherwise.',
};

/** The forge, reworked: Halvard upgrades and melts; Ivo isn't setting elements for now. */
export const FORGE = {
  title: 'THE ANVIL',
  pick: 'Tap a piece to upgrade it for gold and steel, or melt it down for steel.',
  up: (lv: number, gold: number, steel: number) => `UPGRADE TO +${lv} (${gold} GOLD, ${steel} STEEL)`,
  top: 'As good as he can make it.',
  melt: (steel: number) => `MELT DOWN (+${steel} STEEL)`,
  meltWorn: 'Take it off first to melt it.',
  ivo: "No elements for a while, I'm sorry, and please don't ask me why. Whatever's set in yours stays set, it's happy where it is.",
  shut: 'Ivo is not setting elements for now.',
  element: 'AN ELEMENT (NOT FOR NOW)',
};
