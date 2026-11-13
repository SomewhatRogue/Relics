/**
 * Every new word for the pack, the vault, Tobin's stall and the forge (2026-11-02), kept together so
 * the lore keeper and the line editor can take them in one pass. Game voice is short and plain;
 * what people say is in their own voice (docs/lore/voice.md).
 */
import { coinsHtml } from '../shared/coins';
export const PACKW = {
  hand: 'HAND', body: 'BODY', ring: 'RING', relic: 'RELIC', skill: 'SKILL', belt: 'BELT',
  bag: 'PACK',
  wear: 'WEAR',
  hint: 'Tap a piece to compare it with what you wear.',
  hover: 'Point at a piece to compare it with what you wear. Click to choose it.',
  inTown: 'In town: sell it to Tobin (Market Row) or store it in the vault (Counting House).',
  hungry: "Hungry gear can't be dropped or sold. Give it up at the church, or leave it in the vault.",
  skillLine: 'Your class skill. Change it at your trainer.',
  fullJob: 'Pack full. Drop something to make room.',
  notYours: 'Not for your class.',
};

/** Keeper Edda and the counting house: the vault (new building and keeper, for lore review). */
export const BANK = {
  name: 'THE COUNTING HOUSE',
  keeper: 'KEEPER EDDA',
  greet: "Roof's half gone since the siege, but the vault's under the floor and it's *sound*. Put in what you like, take out what you like, and I write it all down.",
  /** On a hungry piece's card: she takes it now (Kyle, 2026-11-05: off you "if it's in the bank"). */
  hungry: "Fine, it can go down there, but on the bottom shelf on its own, and I'm writing your name next to it so nobody thinks it's mine.",
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
  /** The second tab at Tobin's: your pack to sell from. */
  sellTab: 'SELL',
  name: 'TOBIN THE PAWNBROKER',
  stall: 'PAWN',
  greet: "I'll buy most things, and sell you whatever the last one sold me, and you can have yours back if you're quick about it, because I'm not sentimental. Nothing touched, mind, or worse than touched, so if that's what's in your sack you can keep it wrapped and keep walking.",
  hungry: "No, put that away, I'm not touching it at any price. I've a family.",
  /** Talking to him while you carry hungry gear (Kyle, 2026-11-05: "he panics"); he won't trade at all. */
  panic: "No, stop there, don't come any closer. I know what you've got on you. I'll not buy a thing off you while that's about, not a button, and I'll not sell you one either. Please, just go. I've a family.",
  panicRule: "Tobin won't trade while you carry hungry gear. Leave it in the vault or give it up at the church.",
  /** Under his sell grid when you've something he won't buy, and on its card. */
  wont: "Tobin won't buy touched, turning or hungry gear.",
  /** On a square he won't buy, where the price would be. */
  no: 'NO',
  sold: 'Pleasure.',
  back: 'BUY BACK',
  sell: (gold: number) => `SELL (+${coinsHtml(gold)})`,
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
  purse: (gold: number, steel: number) => `You have ${coinsHtml(gold)} and ${steel} steel.`,
  /** The forge's only way up a plus: you strike it yourself (Kyle, 2026-11-06). The price is on the button. */
  strike: (lv: number, gold: number, steel: number) => `STRIKE IT TO +${lv} (${coinsHtml(gold)}, ${steel} STEEL)`,
  /** Under them: the price, and how a clean strike helps. */
  price: (lv: number, gold: number, steel: number) => `+${lv} costs ${coinsHtml(gold)} and ${steel} steel.`,
  offer: "You pay Halvard, then strike it yourself. A cold strike still takes the plus, and clean strikes make it count for up to 20% more.",
  top: "It's at +5, and that's as far as it goes.",
  /** What a plus adds, on the card. */
  adds: (main: string, mods: number) => main + (mods ? `, and each modifier on it is ${mods}% stronger` : ''),
  damage: (pct: number) => `${pct}% more damage`,
  tough: (pct: number) => `${pct}% less damage taken`,
  health: (n: number) => `${n} more health`,
  melt: (steel: number) => `MELT DOWN (+${steel} STEEL)`,
  ivo: "No elements for a while, I'm sorry, and please don't ask me why. Whatever's set in yours stays set, it's happy where it is.",
  shut: 'Ivo is not setting elements for now.',
  /** Ivo, busy: he doesn't talk to you for now. */
  busy: "Ivo is bent over his bench with something held up to his ear, and he doesn't look up.",
  element: 'AN ELEMENT (NOT FOR NOW)',
};
