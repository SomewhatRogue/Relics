/**
 * Every new word for the pack, the vault, Tobin's stall and the forge (2026-11-02), kept together so
 * the lore keeper and the line editor can take them in one pass. Game voice is short and plain;
 * what people say is in their own voice (docs/lore/voice.md).
 */
export const PACKW = {
  hand: 'HAND', body: 'BODY', ring: 'RING', relic: 'RELIC', skill: 'SKILL', belt: 'BELT',
  bag: 'PACK',
  wear: 'WEAR',
  hint: 'Tap a piece to compare it with what you wear.',
  hover: 'Point at a piece to compare it with what you wear. Click to choose it.',
  inTown: 'In town: sell it to Tobin (Market Row) or store it in the vault (Counting House).',
  hungry: 'Hungry gear can\'t be dropped or sold. Only the church takes it.',
  skillLine: 'Your class skill. Change it at your trainer.',
  fullJob: 'Pack full. Drop something to make room.',
  notYours: 'Not for your class.',
};

/** Keeper Edda and the counting house: the vault (new building and keeper, for lore review). */
export const BANK = {
  name: 'THE COUNTING HOUSE',
  keeper: 'KEEPER EDDA',
  greet: "Roof's half gone since the siege, but the vault's under the floor and it's *sound*. Put in what you like, take out what you like, and I write it all down.",
  hungry: "Not that one. I don't care what it's worth, it doesn't go down there.",
  grown: "That's another shelf down there for you. Mind your head on the stair, everybody cracks it the first time.",
  vault: 'VAULT',
  store: 'PUT IN THE VAULT',
  take: 'TAKE OUT',
  shelves: 'MORE SHELVES',
  biggest: 'The vault holds all it can.',
  tap: 'Tap a piece to move it between your pack and the vault.',
  safe: 'The vault keeps what you leave, job after job.',
};

/** Tobin the pawnbroker, on Market Row (new NPC, for lore review). */
export const PAWN = {
  name: 'TOBIN THE PAWNBROKER',
  stall: 'PAWN',
  greet: "I'll buy it, whatever it is, and sell you whatever the last one sold me. Want yours back, come quick. I'm not sentimental.",
  hungry: "No, put that away, I'm not touching it at any price. I've a family.",
  sold: 'Pleasure.',
  back: 'BUY BACK',
  sell: (gold: number) => `SELL (+${gold} GOLD)`,
  rule: "Buy back anything you sold, at the price he paid, until you're home from your next job.",
  bigger: 'A BIGGER PACK',
  biggest: 'Your pack is as big as they come.',
  emptyRow: 'Empty stalls and a cat, and Tobin at the far one. The traders are camped outside the north gate with the refugees, shut out until the council says otherwise.',
};

/** The forge, reworked: Halvard upgrades and melts; Ivo isn't setting elements for now. */
export const FORGE = {
  /** The anvil's two choices, each its own list (Kyle, 2026-11-05). */
  upHead: 'UPGRADE WHAT YOU WEAR',
  meltHead: 'MELT DOWN FROM YOUR PACK',
  purse: (gold: number, steel: number) => `You have ${gold} gold and ${steel} steel.`,
  up: (lv: number, gold: number, steel: number) => `UPGRADE TO +${lv} (${gold} GOLD, ${steel} STEEL)`,
  top: 'As good as he can make it.',
  melt: (steel: number) => `MELT DOWN (+${steel} STEEL)`,
  ivo: "No elements for a while, I'm sorry, and please don't ask me why. Whatever's set in yours stays set, it's happy where it is.",
  shut: 'Ivo is not setting elements for now.',
  /** Ivo, busy: he doesn't talk to you for now. */
  busy: "Ivo is bent over his bench with something held up to his ear, and he doesn't look up.",
  element: 'AN ELEMENT (NOT FOR NOW)',
};
