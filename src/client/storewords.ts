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
  inTown: 'In town: sell it to Tobin on Market Row, or put it in the vault at the counting house.',
  hungry: 'Hungry gear stays with you. Only the church will take it.',
  skillLine: 'Your class skill. Your trainer sees to it, not the pack.',
  fullJob: 'Your pack is full. Drop something to make room.',
  notYours: 'Not for your class.',
};

/** Keeper Edda and the counting house: the vault (new building and keeper, for lore review). */
export const BANK = {
  name: 'THE COUNTING HOUSE',
  keeper: 'KEEPER EDDA',
  greet: "The roof came in the last winter of the siege and nobody's had the timber for it since. The vault's under the floor and the vault's fine. Put it in, take it out, I write it down either way.",
  hungry: "Not that one. I don't care what it's worth, it doesn't go down there.",
  grown: 'Another shelf down there. Mind your head on the stair.',
  vault: 'VAULT',
  store: 'PUT IN THE VAULT',
  take: 'TAKE OUT',
  more: (size: number, gold: number) => `MORE SHELVES: ${size} (${gold} GOLD)`,
  biggest: 'The vault holds all it can.',
  tap: 'Tap a piece to move it between your pack and the vault.',
  safe: 'What is in the vault stays there, job after job.',
};

/** Tobin the pawnbroker, on Market Row (new NPC, for lore review). */
export const PAWN = {
  name: 'TOBIN THE PAWNBROKER',
  stall: 'PAWN',
  greet: "I'll buy it, whatever it is, and if you want it back it's yours at what I paid, so long as you're not out the gate and home again first. After that it's mine, and I'm not sentimental.",
  hungry: "Not that. I've a family.",
  sold: 'Pleasure.',
  back: 'BUY BACK',
  sell: (gold: number) => `SELL (+${gold} GOLD)`,
  buy: (gold: number) => `BUY BACK (${gold} GOLD)`,
  rule: 'Anything you sell him, you can buy back for what he paid until you come home from your next job.',
  none: 'Nothing of yours on his table.',
  packs: "Bigger packs I do as well. Two old ones stitched into one, mostly. Don't ask whose.",
  more: (size: number, gold: number) => `A BIGGER PACK: ${size} (${gold} GOLD)`,
  biggest: 'Your pack is as big as they come.',
  emptyRow: 'Empty stalls and a cat, and Tobin at the far one. The traders are camped outside the north gate with the refugees, and the gate stays shut to them until the council says otherwise.',
};

/** The forge, reworked: Halvard upgrades and melts; Ivo isn't setting elements for now. */
export const FORGE = {
  title: 'THE ANVIL',
  pick: 'Tap a piece: a level up for gold and steel, or melt it down for steel.',
  up: (lv: number, gold: number, steel: number) => `UPGRADE TO +${lv} (${gold} GOLD, ${steel} STEEL)`,
  top: 'As good as he can make it.',
  melt: (steel: number) => `MELT DOWN (+${steel} STEEL)`,
  meltWorn: 'Take it off first to melt it.',
  rack: "HALVARD'S RACK",
  ivo: "I'm not setting elements for a while, not till I've sorted the bench out. What's set in yours already stays set.",
  shut: 'Setting elements: not for now.',
  element: 'AN ELEMENT (NOT FOR NOW)',
};
