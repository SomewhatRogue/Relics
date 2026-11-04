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

export const EXPED_BOSSES = ['GRISTLE', 'OLD HOOK', 'BLACKNAIL', 'THE TANNER'];

/** The day's expedition. */
export function expedition(day: number): Job {
  const rng = new Rng(day * 1597 + 11), seed = day * 389 + 77, night = rng.next() < 0.45, boss = rng.pick(EXPED_BOSSES);
  const place = { ...PLACES.find((p) => p.name === 'Lowfurrow Fields')!, name: 'The Barrowfields', ruin: 2 };
  return {
    id: `d${day}-exped`, place, objective: 'hunt', twist: night ? 'night' : 'none', time: rollTime(seed, night), rooms: 1, size: 'long', boss, seed, exped: 'barrowfields',
    reward: payFor(6, 2, night, 'long') + 60, title: 'Expedition: the Barrowfields',
    text: 'One big open map, goblins all over it. Do the jobs pinned on your map, then light the beacon on the drove road and hold it until the watch comes for you.',
  };
}

/** The board's label and what the job's rows say. */
export const EXPED_BOARD = { kind: 'EXPEDITION', where: 'THE BARROWFIELDS', rooms: 'One big map, about 20 minutes', pays: (n: number) => `${n} gold and treasure if you get out. Each job done adds to the pot` };

/** Each job: its pin's name, what to do, and the banner once it's done. */
export const GOAL_WORDS: Record<GoalKind | SideKind, { pin: string; todo: string; done: string }> = {
  larder: { pin: 'LARDER', todo: 'Poison their cookpot: stand at it', done: 'Cookpot poisoned' },
  engine: { pin: 'ENGINE', todo: 'Wreck the siege engine', done: 'Siege engine wrecked' },
  prisoners: { pin: 'PRISONERS', todo: 'Break the cages open', done: 'Prisoners freed' },
  dens: { pin: 'DENS', todo: 'Burn the dens (their oil helps)', done: 'Dens burned' },
  shrine: { pin: 'SHRINE', todo: 'Hold the barrow shrine: stand in its ring', done: 'Shrine held' },
  butcher: { pin: 'BUTCHER', todo: 'Kill {boss}', done: '{boss} is dead' },
  cache: { pin: 'CACHE', todo: 'Side job: open the cache', done: 'Cache opened' },
  pray: { pin: 'PRAY', todo: 'Side job: pray at the shrine (stand at it)', done: 'Blessed: more damage for 90 s' },
};

/** What the banner and the map screen say about the way out, by its state. */
export const EXTRACT_WORDS = {
  pin: 'BEACON',
  shut: 'The beacon opens once the pinned jobs are done',
  open: 'Jobs done. Light the beacon on the drove road',
  call: 'Stand by the beacon to light it',
  hold: (s: number) => `Hold the beacon until the watch comes: ${s} s`,
  leave: 'The watch is here. Everyone north up the road',
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
};

/** The map screen's own words. */
export const MAP_WORDS = { button: 'MAP', title: 'THE BARROWFIELDS', close: 'CLOSE', camp: 'CAMP', start: 'WAY IN', level: (n: number) => `PRESSURE ${n} OF 5` };
