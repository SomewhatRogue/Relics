/**
 * The expedition on the board: THE BARROWFIELDS, a special posting every day (a new map each day, by
 * its seed), set out on alone or with a party through the board's usual lobby. Harder by default and
 * longer than a long job (Kyle's notes). What each job and side job is called, said on the banner, the
 * map screen and the pins (every line here goes through the lore keeper and the line editor).
 */
import type { GoalKind, SideKind } from './expedcamps.js';
import { payFor, PLACES, type Job } from './jobs.js';
import { Rng } from './rng.js';
import { rollTime } from './timeofday.js';
import { WOOD_GOALS, WOOD_POST } from './hangwords.js';

export const EXPED_BOSSES = ['GRISTLE', 'OLD HOOK', 'SPLITNAIL', 'THE DROVER'];

/** The day's expedition. */
export function expedition(day: number): Job {
  const rng = new Rng(day * 1597 + 11), seed = day * 389 + 77, night = rng.next() < 0.45, boss = rng.pick(EXPED_BOSSES);
  const place = { ...PLACES.find((p) => p.name === 'Lowfurrow Fields')!, name: 'The Barrowfields', ruin: 2 };
  return {
    id: `d${day}-exped`, place, objective: 'hunt', twist: night ? 'night' : 'none', time: rollTime(seed, night), rooms: 1, size: 'long', boss, seed, exped: 'barrowfields',
    reward: payFor(6, 2, night, 'long') + 60, title: 'Expedition: the Barrowfields',
    text: 'The hungry have camps all over the Barrowfields. Do the jobs pinned on your map, then light the beacon on the drove road and hold it till the watch comes out for you.',
  };
}

/**
 * The day's Hangman's Wood (docs/plans/atlas.md: posted like THE BARROWFIELDS, in Greyhollow): one curated
 * wood, about 7 minutes, Hempen at the end of it with a relic in it. A new seed each day, the spine the same.
 */
export function hangmansWood(day: number): Job {
  const rng = new Rng(day * 2311 + 29), seed = day * 433 + 151, night = rng.next() < 0.5;
  const place = { ...PLACES.find((p) => p.name === "Hangman's Wood")!, ruin: 2 };
  return {
    id: `d${day}-wood`, place, objective: 'hunt', twist: night ? 'night' : 'none', time: rollTime(seed, night), rooms: 1, size: 'medium', boss: 'HEMPEN', seed, exped: 'hangmans',
    reward: payFor(4, 2, night, 'medium') + 40, title: WOOD_POST.title, text: WOOD_POST.text,
  };
}

/** The board's label and what the job's rows say. */
export const EXPED_BOARD = { kind: 'EXPEDITION', where: 'THE BARROWFIELDS', rooms: 'One big map, about 20 minutes', pays: (n: number) => `${n} gold and treasure, more for each job done. Half if you don't get out` };

/** Each job: its pin's name, what to do, and the banner once it's done. */
export const GOAL_WORDS: Record<GoalKind | SideKind, { pin: string; todo: string; done: string }> = {
  larder: { pin: 'LARDER', todo: 'Poison the cookpot (stand at it)', done: 'Cookpot poisoned' },
  engine: { pin: 'ENGINE', todo: 'Wreck the siege engine', done: 'Siege engine wrecked' },
  prisoners: { pin: 'CAPTIVES', todo: 'Break the cages open', done: 'Captives freed' },
  dens: { pin: 'DENS', todo: "Burn the dens (there's oil by each)", done: 'Dens burned' },
  shrine: { pin: 'SHRINE', todo: 'Hold the barrow shrine: stand in its ring', done: 'Shrine held' },
  butcher: { pin: 'BUTCHER', todo: 'Kill {boss}', done: '{boss} is dead' },
  staithe: { pin: 'STAITHE', todo: 'Get the eel-catchers off the Staithe: deal with the log, cut the netted free, hold the ring for the punt', done: 'The punt got them over' },
  cache: { pin: 'CHEST', todo: 'Side job: open the chained chest', done: 'Chest opened' },
  pray: { pin: 'PRAY', todo: 'Side job: pray at the shrine (stand at it)', done: 'Lucky: +30% damage, 25% less damage taken for 90 s' },
  // Hangman's Wood's (shared/hangwords.ts).
  winch: WOOD_GOALS.winch,
  oak: WOOD_GOALS.oak,
};

/** A job's words for its pins: Hangman's Wood names its butcher's (Hempen). */
export const goalWords = (job: Job): typeof GOAL_WORDS => (job.exped === 'hangmans' ? { ...GOAL_WORDS, butcher: WOOD_GOALS.hempen } : GOAL_WORDS);

/** What the banner and the map screen say about the way out, by its state. */
export const EXTRACT_WORDS = {
  pin: 'BEACON',
  shut: 'You can light the beacon once the pinned jobs are done',
  open: 'Jobs done. Light the beacon on the drove road',
  call: 'Stand by the beacon to light it',
  hold: (s: number) => `Hold the beacon until the watch comes: ${s} s`,
  leave: 'The watch is here. Out by the drove road',
  away: 'Nobody at the beacon. Get back to it',
};

/** Said once over everyone's head, as it happens. */
export const EXPED_SAYS = {
  drop: 'Your jobs are on the MAP.',
  horn: 'War-horn: that camp knows you are here.',
  worse: 'More goblins coming in.',
  open: 'Jobs done. Get to the beacon.',
  lit: 'Beacon lit. Hold it.',
  watch: 'The watch is here.',
  /** The Staithe left too long (sim/staithebits.ts playOut). */
  staithelost: 'Too late for the folk at the Staithe.',
};

/** The map screen's own words. */
export const MAP_WORDS = { button: 'MAP', title: 'THE BARROWFIELDS', close: 'CLOSE', camp: 'CAMP', start: 'WAY IN', level: (n: number) => `ALARM ${n} OF 5` };
