/**
 * What a job's recap counts for this player (game.ts finish, recap.ts draws it): the jobs and rooms
 * done, goblins killed, own downs, the time out, and what was picked up on the way. Everything comes
 * from the run (the leader's, for a friend following) and from what this hero carries now against
 * what they carried when the job began, so each player's recap is their own.
 */
import { itemName, type Item } from '../shared/tuning';
import { relicName } from '../shared/relicitems';
import type { Profile } from '../shared/progress';
import { mine, type Run } from '../sim/run';
import type { ArenaRoom } from '../sim/room';

export interface Recap {
  /** Rooms cleared of the job's rooms (not on an expedition). */
  rooms?: [number, number];
  /** An expedition's pinned jobs done, of how many; and its side jobs done. */
  jobs?: [number, number];
  sides?: number;
  kills: number;
  dens: number;
  downs: number;
  /** Seconds out on the job, when known. */
  secs?: number;
  /** Gear picked up off the floor, and relics found, by name. */
  found: string[];
  relics: string[];
}

/** What a hero has on them at the start of a job, to tell what they picked up by its end. */
export interface Kit { items: string[]; relics: string[] }

const owned = (p: Profile): Item[] => [...p.bag, ...Object.values(p.arms), ...(p.armor ? [p.armor] : []), ...p.rings].filter(Boolean) as Item[];

export const kitOf = (p: Profile): Kit => ({ items: owned(p).map((i) => JSON.stringify(i)), relics: p.relics.map((r) => r.id) });

/** The recap for `run`, as it ends. `room`: the job's room, if this page still has it. `me`: this player's id in the run's tallies. */
export function recapOf(run: Run, room: ArenaRoom | null, p: Profile, start: Kit | null, won: boolean, me: string): Recap {
  const x = run.job.exped ? room?.exped : undefined;
  const of = x?.goals.length ?? 0;
  const left = new Map<string, number>();
  for (const k of start?.items ?? []) left.set(k, (left.get(k) ?? 0) + 1);
  const found: string[] = [];
  if (start) for (const it of owned(p)) {
    const k = JSON.stringify(it), n = left.get(k) ?? 0;
    if (n > 0) left.set(k, n - 1);
    else found.push(itemName(it));
  }
  const had = new Set(start?.relics ?? []);
  const relics = start ? p.relics.filter((r) => !had.has(r.id)).map(relicName) : [];
  const secs = run.began ? Math.round((Date.now() - run.began) / 1000) : 0;
  return {
    rooms: run.job.exped ? undefined : [won ? run.job.rooms : run.index, run.job.rooms],
    jobs: run.job.exped ? [run.goals ?? (x?.goals.filter((g) => g.done).length ?? 0), of] : undefined,
    sides: run.job.exped ? run.sides ?? 0 : undefined,
    kills: run.kills, dens: run.dens, downs: mine(run.falls, me),
    // (A job paid long after it ended, on a later visit, has no honest time.)
    secs: secs > 0 && secs < 3 * 3600 ? secs : undefined,
    found, relics,
  };
}
