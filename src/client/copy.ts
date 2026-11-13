/** Short UI copy for the start screen, the pack, the loot card and the smith (lore keeper checked). */
export const COPY = {
  homeLede: 'Wickhold still has its walls. Pick a hero, or hire another.',
  pack: 'PACK',
  knacks: 'KNACKS',
  inHand: 'IN HAND',
  skill: 'SKILL',
  relic: 'RELIC',
  packed: 'SPARES',
  relicEmpty: 'None yet. They come from deep jobs.',
  packEmpty: 'Empty. Gear comes from goblins, chests and Halvard.',
  packFull: 'Pack full. Drop something.',
  plain: 'Plain. No modifiers.',
  stillGoing: 'The fight goes on while your pack is open.',
  equip: 'EQUIP',
  /** On the hand's card: one button for each weapon of your class in the pack. */
  swapTo: 'SWAP TO',
  drop: 'DROP',
  carry: 'CARRY',
  putAway: 'PUT AWAY',
  worn: 'WORN',
  noArmor: 'No armor.',
  takeOff: 'TAKE OFF',
  intoPack: 'INTO THE PACK',
  drunkNext: 'DRUNK FIRST',
  dragHint: 'Drag a piece onto its slot to wear it, or into the pack to take it off. Tap to see it.',
  stats: 'STATS',
  belt: 'BELT',
  next: 'NEXT',
  pour: 'POUR OUT',
  beltEmpty: 'Empty. Agne and Gannet sell potions; goblins drop them.',
  takes: 'Goes in your pack.',
  full: 'Pack full.',
  otherClass: 'For a {Class}.',
  /** Taking another class's piece (sim/loot.ts): SOULBOUND. */
  bound: 'Yours to sell. SOULBOUND: can\'t be given to another hero.',
};

/** The Healer's coal (sim/lantern.ts). What it does is on the class card (CENSER, shared/classes.ts). */
export const COAL = {
  name: 'COALS',
  line: 'Stronger heals. Goblins notice you from further off and go for you first.',
  pickup: 'CENSER FED',
  /** Said to a Healer whose censer has been fed (Kyle: say it plainly). */
  isolde: "You've been feeding that censer. Your heals are stronger for it, but the goblins will come for you sooner. Keep your back to a wall.",
  odric: 'Lit from the Lantern, like every one before it. Feed it the coals the butchers leave. Have you eaten today? You look thin.',
};

/** Hungry gear at the church, and the town noticing the Want (lore keeper; Kyle cut two, 2026-11-04). */
export const CHURCH = {
  hungry: 'If there\'s something you\'re carrying you\'d rather not, leave it on the step. I\'ll see to it.',
  agne: 'You\'ve a look about you. Sleep with a candle tonight. Humour me.',
  ivo: "Oh. That's a hungry one. Don't sleep with it under your pillow.",
  /** At Gannet's bar, the Drowned Rat (shops.ts), not the church. */
  gannet: 'Gannet won\'t meet your eye while he talks.',
};

/** After the wood: Odric's one line about Hew, the first time in (Orla brought him the stick); Isolde relights a Healer's censer (Kyle: plain, two lines if need be). */
export const TALLY = {
  odric: "Orla brought me Hew's tally of the dead, and I've cut a notch on it for him.",
  isolde: "Your censer went cold on the field, and a cold censer can't heal. It's lit again, so your heals work.",
};

export const SMITH = {
  bought: "In your pack. He's already oiling the next one.",
  anvil: 'Melt your spares for steel. Steel and coin buy an upgrade.',
  hungry: 'Not that one. Not in my fire.',
  sell: 'Leave it on the bench. I buy cheaper than I sell.',
};

/** The recovery code panel on the start screen (recoveryui.ts). {n} is a count of heroes (from counts), {names} their names. */
export const RECOVER = {
  button: 'RECOVERY CODE',
  title: 'RECOVERY CODE',
  making: 'One moment.',
  writeDown: 'Write it down. It brings your heroes to another device.',
  noHeroes: 'Make a hero first.',
  unreachable: "Can't reach the server. Try again soon.",
  tryAgain: 'TRY AGAIN',
  useTitle: 'USE A CODE',
  useLede: 'Have a code? Type it in.',
  example: 'KILN FERN 47',
  use: 'USE IT',
  looking: 'One moment.',
  bad: 'Two words and a number.',
  none: 'Nothing under that code.',
  empty: 'No heroes under that code.',
  mine: "That's this device's code.",
  found: '{names}.',
  replaces: 'They replace the {n} here.',
  bring: 'BRING THEM HERE',
  cancel: 'CANCEL',
  back: 'BACK',
  /** How many heroes, by count (a device holds three at most). */
  counts: ['no heroes', 'one hero', 'two heroes', 'three heroes'],
};
