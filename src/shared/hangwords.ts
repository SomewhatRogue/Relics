/**
 * Every word Hangman's Wood puts on screen (the posting, the pins, the banner, what's said over your head
 * as you come up to each of its scenes, the callouts), and how its own hungry bleed in (shared/debut.ts).
 * Each line here waits on the lore keeper, then the line editor.
 */
import type { Debut } from './debut.js';
import { coinsHtml } from './coins.js';

/** The snarer: staged in Hangman's Wood first (never a fork way's room: `staged` names none that stages it), rare in Greyhollow a week on, common a chapter on. */
export const SNARE_DEBUT: Debut = { staged: 'quiet', home: 'Greyhollow', from: 60, rare: 7, common: 28, weight: 0.5, zone: 'hangmans' };
/** The dropper: staged in Hangman's Wood (its perches are the zone's; there's no pack for it yet). */
export const DROPPER_DEBUT: Debut = { staged: 'quiet', home: 'Greyhollow', from: 60, rare: 7, common: 28, weight: 0.5, zone: 'hangmans' };

export const WOOD_NAME = "Hangman's Wood";

/** The posting on the board. */
export const WOOD_POST = {
  title: "Hangman's Wood",
  text: "The hungry have put the old gibbet at the crossroads in Hangman's Wood back to use, and there's somebody alive in the cage. Get them down, and kill the one they call Hempen.",
  kind: 'EXPEDITION',
  where: "HANGMAN'S WOOD",
  rooms: 'One wood, about 7 minutes',
  pays: (n: number) => `${coinsHtml(n)} and a relic off Hempen, more for each job done. Half if you don't get out`,
};

/** The pins and what each job says (GOAL_WORDS takes these). */
export const WOOD_GOALS = {
  winch: { pin: 'GIBBET', todo: 'Wind the gibbet cage down: stand at the winch', done: 'The cage is down' },
  oak: { pin: 'OAK', todo: 'Side job: burn the brood mother out of the Gospel Oak', done: 'The Gospel Oak is burnt out' },
  hempen: { pin: 'HEMPEN', todo: 'Kill Hempen', done: 'Hempen is dead' },
};

/** The banner's way out, and the mid-point's fire. */
export const WOOD_EXIT = {
  open: 'Hempen is dead. Out by the north path',
  leave: 'Hempen is dead. Out by the north path',
  check: 'Light the fire in the clearing',
  lit: "The fire's lit. Anyone who goes down gets up by it now",
  drop: 'Your jobs are on the MAP. Keep to the paths.',
};

/** The map screen's own words. */
export const WOOD_MAP = { title: "HANGMAN'S WOOD", check: 'FIRE', start: 'WAY IN' };

/**
 * Said once over the first hero to come up to each scene on the way (sim/hangwood.ts beats), in order:
 * the snare line, the body by the waymark, the gibbet, the sack, Hew's marks, the oak, Hempen's ground.
 */
export const WOOD_BEATS: Record<string, string> = {
  snares: "Snares on the path, and they're hard to see. Watch your feet.",
  crows: "The crows got to him first. Mind the branches over him.",
  gibbet: "They're winching the cage up, and there's somebody in it.",
  sack: "That's a sack of charcoal they're dragging, and they're taking it out of the wood.",
  blaze: "Old axe marks on the trees. Hew's, I'd bet, nobody else worked this deep.",
  oak: "The Gospel Oak. Something's living in the hollow.",
  hempen: "There's rope on every branch, and most of it's in use. This is where Hempen keeps them.",
};

/** Callouts over a hero (fx). */
export const WOOD_CALLS = { hoisted: 'SNARED', cut: 'CUT FREE', drop: 'LOOK UP', snap: 'SNAPPED' };
