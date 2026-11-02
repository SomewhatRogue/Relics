/**
 * Who a room's goblins are, past where they stand: the back of the pack rolled into a job's rooms
 * (rarer early, more often deeper and on longer jobs), and the mix a bigger party meets. Each on its
 * own seeded stream, so the rest of a room's layout is the same as it always was. Numbers: ROSTER.
 */
import { ROSTER } from './backline.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { Foe } from './terrain.js';

const backline = (f: Foe) => f.variant === 'hexer' || f.variant === 'drummer';
/** A small goblin with nothing about it yet: no bow, no kind, not at the dead, not named. */
const plain = (f: Foe) => f.kind === 'scrapper' && !f.bow && !f.variant && !f.feeding && !f.name;
/** A small goblin with a blade, awake by a fire (deep in, most of them are lungers, shields or brutes already). */
const banded = (f: Foe) => f.kind === 'scrapper' && !f.bow && !backline(f) && !f.feeding && !f.name;
/** Goblins that fight up close (the ones at the dead get up and come too). */
const blades = (foes: Foe[]) => foes.filter((f) => f.kind === 'butcher' || (f.kind === 'scrapper' && !f.bow && !backline(f))).length;

/** The most of the back of the pack a job's room `index` may hold. */
export const mostIn = (index: number) => ROSTER.most[Math.min(index, ROSTER.most.length - 1)];

/** The chance each small goblin with a blade in room `index` of `job` is a hexer or a drummer. */
export const backlineChance = (job: Job, index: number) =>
  ROSTER.base + index * ROSTER.perRoom + job.place.ruin * ROSTER.perRuin + (job.rooms >= 5 ? ROSTER.long : 0) + (job.deep ? ROSTER.deep : 0);

/**
 * Some of a run room's small goblins with blades are hexers and drummers instead. Never more than
 * `mostIn(index)`, never so many that fewer than ROSTER.blades are left to fight up close, and a
 * drummer only where there are ROSTER.drumFor goblins to drum for. Changes `foes` in place.
 */
export function rollBackline(foes: Foe[], job: Job, index: number): void {
  const rng = new Rng(job.seed * 53 + index * 11 + 3), chance = backlineChance(job, index), most = mostIn(index);
  let n = foes.filter(backline).length;
  for (const f of foes) {
    if (n >= most) return;
    if (!banded(f) || rng.next() >= chance) continue;
    const left = blades(foes) - 1;
    if (left < ROSTER.blades) return;
    f.variant = left >= ROSTER.drumFor && rng.next() < 0.5 ? 'drummer' : 'hexer';
    n++;
  }
}

/**
 * A bigger party's extra goblins (copies of the room's own). No more of the back of the pack than the
 * room had (a hexer copied past that comes as a plain goblin), but in a party of three or more each
 * plain extra may come tougher: a lunger, a shield, a brute, or (up to ROSTER.partyMore more) a hexer
 * or a drummer. Changes `extra` in place.
 */
export function toughen(room: Foe[], extra: Foe[], party: number, rng: Rng): void {
  const base = room.filter(backline).length, most = base + (party >= 3 ? ROSTER.partyMore : 0);
  let n = base;
  for (const f of extra) {
    if (backline(f)) {
      if (n < most && party >= 3) n++;
      else delete f.variant;
    }
  }
  if (party < 3) return;
  const chance = ROSTER.tougher * (party - 2), picks = Object.entries(ROSTER.picks) as [NonNullable<Foe['variant']>, number][];
  const total = picks.reduce((s, [, w]) => s + w, 0);
  for (const f of extra) {
    if (!plain(f) || rng.next() >= chance) continue;
    let r = rng.next() * total, pick = picks[0][0];
    for (const [k, w] of picks) if ((r -= w) < 0) {
      pick = k;
      break;
    }
    if (pick === 'hexer' || pick === 'drummer') {
      if (n >= most) pick = 'lunger';
      else n++;
    }
    f.variant = pick;
  }
}
