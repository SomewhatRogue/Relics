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
  packEmpty: 'Empty. Take gear off goblins, out of chests, or buy from Halvard.',
  packFull: 'Your pack is full. Drop something.',
  plain: 'Plain. No traits.',
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
  dragHint: 'Drag a piece onto its slot to wear it, or into the pack to take it off. Tap one to see it.',
  stats: 'STATS',
  belt: 'BELT',
  next: 'NEXT',
  pour: 'POUR OUT',
  beltEmpty: 'Empty. Agne, Gannet and Ivo sell them, and goblins drop them.',
  takes: 'Goes in your pack.',
  full: 'Your pack is full.',
  otherClass: 'For a {Class}.',
};

/** The Healer's coal (sim/lantern.ts). */
export const COAL = {
  name: 'COALS',
  line: 'Your heals are stronger. Goblins notice you from further off and go for you first.',
  pickup: 'CENSER FED',
  help: 'A dead butcher leaves a live coal for a little while. A Cleric who walks over it feeds the censer: stronger heals, for good, and the hungry hunt that Cleric first.',
  note: 'Feed the censer what butchers leave. It heals hotter, and draws teeth.',
  /** Said to a Healer whose censer has been fed (she suspects; he knows). */
  isolde: "It takes to them, doesn't it? Burns sweeter after. I don't ask the coal its business, and I'd thank you not to. Keep your back to a wall.",
  odric: 'Lit from the Lantern, like every one before it. Feed it what you find out there. Have you eaten today? You look thin.',
};

/** Hungry gear at the church, and the town noticing the Want (lore keeper). */
export const CHURCH = {
  hungry: 'If there\'s something you\'re carrying you\'d rather not, leave it on the step. I\'ll see to it.',
  left: "Good. There's bread in the back, if you'll take it.",
  ransom: 'The coat won\'t let your hand open over the plate. Odric pretends not to see.',
  agne: 'You\'ve a look about you. Sleep with a candle tonight. Humour me.',
  ivo: "Oh. That's a hungry one. Don't sleep with it under your pillow.",
  gannet: 'Gannet pours you a short one and doesn\'t meet your eye.',
};

/** After the wood (lore keeper to review): Odric takes Hew's count; Isolde relights a Healer's censer. */
export const TALLY = {
  odric: "Hew. He never did come in for the beer. Leave it with me. I'll chalk them up with the others, every name he had, and his.",
  isolde: "Went out on the field, did it? They do. There. Lit. Let it die again and I'll light the next one off your arse.",
};

export const SMITH = {
  bought: "In your pack. He's already oiling the next one.",
  anvil: 'Spares in the fire. Steel and gold for the rest.',
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
