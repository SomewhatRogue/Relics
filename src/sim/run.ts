/**
 * A run: a job's rooms one after another. Each room's goal (clear the goblins; in the last room, the
 * job's objective) opens the way out; walking out starts the next room or ends the run. Kills pay
 * gold and experience, the freed count once they're brought out (and not if the party kills them first),
 * three downs and the run fails.
 */
import { BOUNTY } from '../shared/progress';
import { isSpiderKind } from '../shared/spiders';
import type { Job } from '../shared/jobs';
import { runInterior } from '../shared/interiors';
import { planRoom, type RoadId } from '../shared/terrain';
import { isDead } from './damage';
import { ArenaRoom } from './room';
import { allOut, players, scaleBosses, scaleFoes } from './party';
import type { FightEvent } from './types';
import { dreadFor } from './dreadplace';
import { expedRoom } from './expedroom';
import { EXPED, WEAPONS } from '../shared/tuning';
import { blankScore, foldBoard, type Board, type Score } from './score';
import type { RelicWon } from '../shared/relicaward';

export interface Run {
  job: Job;
  /** Which room (0-based). */
  index: number;
  gold: number;
  xp: number;
  rescued: number;
  downs: number;
  failed: boolean;
  /** Goblins killed and dens burned (for the Roll of the Brave and the town works). */
  kills: number;
  dens: number;
  /** For the Roll: butchers felled, and this player's own falls, rescues, friends raised and friends felled. */
  butchers?: number;
  falls?: Record<string, number>;
  carried?: Record<string, number>;
  raised?: Record<string, number>;
  teamkills?: Record<string, number>;
  /** Blows landed on the freed, and freed people killed, by hero id (each player's own, so a friend's game reads theirs). */
  rescueHits?: Record<string, number>;
  rescueKills?: Record<string, number>;
  /** People left caged in a house that burned and fell in (lost, never brought home). */
  lost?: number;
  /** The road the party took into each room after a fork (by room index). */
  roads: Record<number, RoadId>;
  /** An expedition's side jobs done (each a piece of treasure more, got out). */
  sides?: number;
  /** An expedition's pinned jobs done (the recap's JOBS row). */
  goals?: number;
  /** When the job set out (Date.now() on the leader's page): the recap's TIME, never the fight's. */
  began?: number;
  /** Players in the party when each room is built (it scales the goblins; the ones left, if some went home). */
  party?: number;
  /** Layout 4: the freed brought out of each room (a way's pay counts its room's: shared/waypay.ts), and prisoners led off. */
  saved?: Record<number, number>;
  ledoff?: number;
  /** The Staithe's folk lost (taken off the jetty, or left too long on the big map): the recap's LOST. */
  netlost?: number;
  /** What each hero in the party did, by hero id (sim/score.ts): the recap's side by side. */
  board?: Board;
  /** Relics awarded on the run so far (shared/relicaward.ts awardRelic, e.g. at a zone's climax). */
  relicsWon?: RelicWon[];
}

export const MAX_DOWNS = 3;
export const newRun = (job: Job): Run => ({ job, index: 0, gold: 0, xp: 0, rescued: 0, downs: 0, failed: false, roads: {}, kills: 0, dens: 0 });

/** Build the room for the run's current index. */
export function runRoom(run: Run): ArenaRoom {
  // An expedition: one big map, not rooms (sim/expedroom.ts).
  if (run.job.exped) return expedRoom(run.job, run.party ?? 1);
  const plan = planRoom(run.job, run.index, run.roads[run.index], run.roads), n = run.party ?? 1;
  // Worse places and deep jobs shift every chest roll a tier up.
  const danger = (run.job.place.ruin >= 3 ? 1 : 0) + (run.job.deep ? 1 : 0);
  const room = new ArenaRoom(run.job.seed + run.index, { map: plan.map, foes: scaleFoes(plan.foes, n, run.job.seed * 17 + run.index * 5 + 2), furniture: plan.props, chests: plan.chests, danger });
  scaleBosses(room.enemies, n);
  room.board = {};
  room.dread = { by: dreadFor(run.job) };
  // Out in the open, a cage can hold a false prisoner (sim/falsecage.ts); never inside a house.
  room.falseCages = true;
  return room;
}

/** Inside a cottage or barn in the current room (you can always walk back out). */
export function interiorRoom(run: Run, blockIndex: number, door: string): ArenaRoom {
  const plan = runInterior(run.job, run.index, blockIndex, door);
  const room = new ArenaRoom(run.job.seed * 3 + run.index * 11 + blockIndex + 7, { map: plan.map, foes: plan.foes, furniture: plan.props, chests: plan.chests });
  room.exitOpen = true;
  room.indoors = true;
  room.board = {};
  // Inside a house: the hungry, whatever the place. Down a side way, the place's own.
  room.dread = { by: door.startsWith('side:') ? dreadFor(run.job) : 'swarm' };
  return room;
}

const bump = (m: Record<string, number>, id: string) => (m[id] = (m[id] ?? 0) + 1);
/** Hero `id`'s line on the run's board. */
const line = (run: Run, id: string): Score => ((run.board ??= {})[id] ??= blankScore());
/** One player's count from a per-player tally (an old saved run kept a single number). */
export const mine = (t: Record<string, number> | number | undefined, id: string) => (typeof t === 'number' ? t : t?.[id] ?? 0);

export const isFinal = (run: Run) => run.index === run.job.rooms - 1;

/** Count what a tick's events earned. `me` is the player whose downs count. */
export function tally(run: Run, room: ArenaRoom, events: FightEvent[], me: string): void {
  for (const ev of events) {
    if (ev.k === 'death') {
      const e = room.enemies.find((x) => Math.abs(x.x - ev.x) < 0.01 && Math.abs(x.y - ev.y) < 0.01);
      const b = e?.name ? BOUNTY.boss : ev.kind === 'butcher' ? BOUNTY.butcher : ev.kind === 'scrapper' ? BOUNTY.scrapper : BOUNTY[ev.kind as 'spider'] ?? null;
      // Spiders pay xp but aren't goblins killed (the Roll and the town works count goblins).
      // Spiders and wolves pay xp but aren't goblins killed.
      if (b) (run.xp += b.xp), (run.kills += isSpiderKind(ev.kind) || e?.variant === 'wolf' ? 0 : 1);
      if (b && (b === BOUNTY.butcher || b === BOUNTY.boss)) run.butchers = (run.butchers ?? 0) + 1;
    } else if (ev.k === 'gold') {
      // One pot for the party: whoever picks it up, everyone is paid the lot at the end.
      if (ev.id === me || players(room.heroes).some((h) => h.id === ev.id)) run.gold += ev.n;
    } else if (ev.k === 'stolen') {
      // A sneak-thief's grab: out of the pot (back in if it's caught and the gold picked up).
      run.gold = Math.max(0, run.gold - ev.n);
    } else if (ev.k === 'collapse') {
      if (room.map.blocks.some((x) => x.kind === 'den' && x.x === ev.x && x.y === ev.y)) run.dens++;
    } else if (ev.k === 'survivorhome') {
      // Freed is not saved: they count once they're brought out (sim/survivors.ts).
      run.rescued++;
      run.xp += BOUNTY.rescue;
      (run.saved ??= {})[run.index] = (run.saved[run.index] ?? 0) + 1;
    } else if (ev.k === 'survivorhit') {
      if (ev.by && !ev.tick) (run.rescueHits ??= {})[ev.by] = (run.rescueHits[ev.by] ?? 0) + 1;
    } else if (ev.k === 'survivordeath') {
      if (ev.by) (run.rescueKills ??= {})[ev.by] = (run.rescueKills[ev.by] ?? 0) + 1;
    } else if (ev.k === 'ledoff') {
      run.ledoff = (run.ledoff ?? 0) + 1;
    } else if (ev.k === 'folklost') {
      // The Staithe: taken off the jetty, or (the big map) left too long (sim/staithe.ts).
      run.netlost = (run.netlost ?? 0) + 1;
    } else if (ev.k === 'cagelost') {
      run.lost = (run.lost ?? 0) + 1;
    } else if (ev.k === 'exped' && (ev.what === 'goal' || ev.what === 'side')) {
      // An expedition pays into the pot for each job done, got out or not (shared/tuning.ts EXPED).
      run.gold += Math.round(run.job.reward * (ev.what === 'goal' ? EXPED.goalPay : EXPED.sidePay));
      if (ev.what === 'side') run.sides = (run.sides ?? 0) + 1;
      else run.goals = (run.goals ?? 0) + 1;
    } else if (ev.k === 'exped' && ev.what === 'check') {
      // Hangman's Wood's fire lit: the run's saved there; alone, the three downs start again (sim/woodzone.ts).
      run.downs = 0;
    } else if (ev.k === 'pickedup') {
      if (ev.id) bump(run.carried ??= {}, ev.id);
      if (ev.by) bump(run.raised ??= {}, ev.by);
    }
    // Each player's own (so a friend following the job reads theirs, not the leader's).
    if (ev.k === 'down' && ev.id) bump(run.falls ??= {}, ev.id), ev.id !== 'squire' && line(run, ev.id).downs++;
    if (ev.k === 'pickedup' && ev.by) line(run, ev.by).raised++;
    if (ev.k === 'down' && ev.by) bump(run.teamkills ??= {}, ev.by);
    if (ev.k === 'down' && players(room.heroes).length < 2) {
      // Alone, three downs and it's lost; in a party, it's lost when everyone is out.
      const h = room.heroes.find((x) => x.id === me);
      if (h && Math.abs(h.x - ev.x) < 0.01 && Math.abs(h.y - ev.y) < 0.01) run.downs++;
    }
  }
  if (run.downs >= MAX_DOWNS || allOut(room.heroes)) run.failed = true;
  board(run, room);
}

/** The room's counts since the last step go on the run's board; every player in it has a line, with a name and class. */
function board(run: Run, room: ArenaRoom): void {
  if (!room.board) room.board = {};
  else if (Object.keys(room.board).length) foldBoard(run.board ??= {}, room.board), (room.board = {});
  for (const h of players(room.heroes)) {
    const s = line(run, h.id);
    s.cls = WEAPONS[h.weapon]?.cls ?? s.cls;
    if (h.tag) s.name = h.tag;
  }
}

/** The room's goal (sim/goal.ts). */
export { goal, wayDir, type Captives } from './goal';
