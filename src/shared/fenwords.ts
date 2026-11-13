/**
 * Every word Fenmere puts on screen: the posting, the pins, the banner, what's said over your head as you
 * come up to each of its scenes. No new places or people: Fenmere, the Peat Cuts and the named butchers are
 * the bible's. Each line here waits on the lore keeper, then the line editor.
 */
import { coinsHtml } from './coins.js';

export const FEN_NAME = 'Fenmere';

/** The posting on the board (`{boss}`: the day's named butcher). */
export const FEN_POST = {
  title: 'Fenmere',
  text: "The hungry are keeping a larder at the Peat Cuts, and they're bringing people across the fen to fill it. There's still some caged on the island, so get them out, and while you're down there poison their pot and kill {boss}.",
  kind: 'EXPEDITION',
  where: 'FENMERE',
  rooms: 'One fen, about 8 minutes',
  pays: (n: number, boss = '') => `${coinsHtml(n)} and a relic off ${boss || 'the butcher'}, more for each job done. Half if you don't get out`,
};

/** The pins and what each job says (GOAL_WORDS takes these on a Fenmere job). */
export const FEN_GOALS = {
  prisoners: { pin: 'CAPTIVES', todo: 'Break the cages open on the island in the river', done: 'Captives freed' },
  larder: { pin: 'LARDER', todo: 'Poison the cookpot at the Peat Cuts (stand at it)', done: 'Cookpot poisoned' },
  butcher: { pin: 'BUTCHER', todo: 'Kill {boss}', done: '{boss} is dead' },
  cache: { pin: 'CHEST', todo: 'Side job: open the chained chest out on the bog', done: 'Chest opened' },
};

/** The banner's way out, and the fire on the rise (the mid-point). */
export const FEN_EXIT = {
  open: 'Jobs done. Out by the causeway to the north',
  leave: 'Jobs done. Out by the causeway to the north',
  check: "Light the fire on the hummock",
  lit: "The fire's lit. Anyone who goes down gets up by it now",
  drop: 'Your jobs are on the MAP. Keep to the causeways and the boards.',
};

/** The map screen's own words. */
export const FEN_MAP = { title: 'FENMERE', check: 'FIRE', start: 'WAY IN' };

/**
 * Said once over the first hero to come up to each scene (sim/woodzone.ts beats), in the order you come to
 * them: the stile, the coppice, the carr, the causeway, the ford, the island, the reeds, the Peat Cuts,
 * the butcher's ground, and the chest out on the bog.
 */
export const FEN_BEATS: Record<string, string> = {
  edge: "Two of them are dragging somebody through the stile, back to their fire in the coppice.",
  coppice: "They're asleep among the cut stools, and if you go quietly they might not wake.",
  carr: "There's a nest down among the willows, and two of the spiders are already out of it.",
  causeway: "They've shut the causeway on us, and there's one out on that islet with a pot of oil.",
  ford: "Careful at the ford, there's one on the far bank with a hook on a pole.",
  island: "Cages on the island, and there's still somebody in them.",
  reeds: "Mind the reeds. You'll see their eyes at the water before you see the rest of them.",
  cuts: "This used to be the Peat Cuts' drying ground, and now they've hung their larder on the old racks, and that's their pot on the fire.",
  butcher: '{boss} is down among the cuts, with hooks on poles all round it.',
  chest: "A chest out on the bog, and a dead man by it who didn't get it open.",
};
