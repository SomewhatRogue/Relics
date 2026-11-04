/**
 * A run room's goal, in plain words, and whether it's met (which opens the way on). It always says how
 * many are still caged and how many freed are still to bring out, and once the way is open, which way
 * it is: "2 to free, 1 to bring out", "Way on: north", "The larder is ruined. Way home: north".
 *
 * `houses`: the caged and the freed inside this room's cottages and barns (the game counts them, since
 * a house's inside is its own room). Anyone freed has to be brought out (on a rescue, before the way
 * home opens); the caged in houses are extra ("3 more in the houses"), never needed to go on.
 */
import { doorAt, type Area, type Block, type GameMap } from '../shared/arena';
import { runInterior } from '../shared/interiors';
import { isDead } from './damage';
import { isSpiderKind } from '../shared/spiders';
import type { ArenaRoom } from './room';
import type { Run } from './run';
import { bossOf, densLeft, racksLeft } from './targets';
import { waiting } from './survivors';
import { expedGoal } from './expedgoal';

export interface Captives { caged: number; waiting: number }

const isFinal = (run: Run) => run.index === run.job.rooms - 1;

/** Which way an area leaves the map: the edge it's nearest. */
export function wayDir(map: GameMap, a: Area | null = map.exit): 'north' | 'south' | 'east' | 'west' {
  if (!a) return 'north';
  const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
  const d = { north: cy, south: map.h - cy, west: cx, east: map.w - cx };
  return (Object.keys(d) as (keyof typeof d)[]).reduce((p, q) => (d[q] < d[p] ? q : p));
}

/** "2 to free, 1 to bring out" (or '' when nobody is left). */
export function captivesLeft(c: Captives): string {
  return [c.caged ? `${c.caged} to free` : '', c.waiting ? `${c.waiting} to bring out` : ''].filter(Boolean).join(', ');
}

/** The caged and freed-not-yet-home in the room itself (out in the open). */
export function inRoom(room: ArenaRoom): Captives {
  return {
    caged: room.props.filter((p) => p.kind === 'cage' && !p.broken).length,
    waiting: room.survivors.filter(waiting).length,
  };
}

/**
 * Who's caged or freed-not-yet-out in each of the room's houses, by its door. Houses you've been in
 * count from their room as it is now; on a rescue, the ones you haven't count from their plan (the job
 * says folk are caged in them); otherwise an unvisited house isn't known. A burned-down house is gone.
 */
const planned = new Map<string, number>();
export function houseCaptives(run: Run, room: ArenaRoom, insides: Map<Block, ArenaRoom>): (Captives & { x: number; y: number })[] {
  const out: (Captives & { x: number; y: number })[] = [];
  room.map.blocks.forEach((b, i) => {
    if (!b.door || b.ruined) return;
    const inside = insides.get(b), at = doorAt(b);
    if (inside) return void out.push({ ...inRoom(inside), ...at });
    if (run.job.objective !== 'rescue' || !isFinal(run)) return;
    const k = `${run.job.id}:${run.job.seed}:${run.index}:${i}`;
    if (!planned.has(k)) (planned.size > 200 && planned.clear()), planned.set(k, runInterior(run.job, run.index, i, b.door).props.filter((p) => p.kind === 'cage').length);
    out.push({ caged: planned.get(k)!, waiting: 0, ...at });
  });
  return out.filter((h) => h.caged || h.waiting);
}

/** Add up a list of counts. */
export const sum = (list: Captives[]): Captives => list.reduce((a, c) => ({ caged: a.caged + c.caged, waiting: a.waiting + c.waiting }), { caged: 0, waiting: 0 });

/** What a larder and the dens are, said on the banner (lore keeper and line editor). */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function goal(run: Run, room: ArenaRoom, houses: Captives = { caged: 0, waiting: 0 }): { text: string; done: boolean } {
  if (room.exped) return expedGoal(run, room);
  const goblins = room.enemies.filter((e) => !isDead(e)).length, o = run.job.objective, here = inRoom(room);
  // What has to be done (the cages out here, and everyone freed brought out), and who else is caged indoors.
  const need = { caged: here.caged, waiting: here.waiting + houses.waiting }, left = captivesLeft(need);
  const more = houses.caged ? `${houses.caged} more in the houses` : '';
  const people = [left && cap(left), more && (left ? more : cap(more))].filter(Boolean).join('. ');
  const also = (text: string) => (people ? `${text}. ${people}` : text);
  const way = (home: boolean) => `${home ? 'Way home' : 'Way on'}: ${wayDir(room.map)}`;
  if (!isFinal(run)) {
    const fork = !!room.map.roads;
    // With spiders about (nests and all) it's the room to clear, not just the goblins.
    const what = room.enemies.some((e) => !isDead(e) && isSpiderKind(e.kind)) ? 'them out' : 'the goblins';
    return { text: also(goblins ? `Clear ${what} (${goblins} left)` : fork ? 'Pick a road, together. HIGH: archers up top, fewer below. LOW: more goblins, someone caged' : way(false)), done: goblins === 0 };
  }
  const freed = !need.caged && !need.waiting;
  if (o === 'rescue') return { text: freed ? also(`Everyone's out. ${way(true)}`) : people, done: freed };
  // Each says what it is (a gold mark is over each one: sim/targets.ts).
  if (o === 'larder') {
    const racks = racksLeft(room).length;
    return { text: also(racks ? `Smash the larder racks (${racks} left)` : `The larder is ruined. ${way(true)}`), done: racks === 0 };
  }
  if (o === 'burn') {
    const dens = densLeft(room.map).length;
    return { text: also(dens ? `Burn out the dens (${dens} ${dens === 1 ? 'hut' : 'huts'} left)` : `The dens are ash. ${way(true)}`), done: dens === 0 };
  }
  const boss = bossOf(room);
  const bossDead = !boss || isDead(boss);
  if (o === 'hunt') return { text: also(bossDead ? `${run.job.boss} is dead. ${way(true)}` : `Kill ${run.job.boss}`), done: bossDead };
  // The story mission: the boss, every cage out here, and everyone freed brought out.
  if (!bossDead) return { text: also(`Kill ${run.job.boss}`), done: false };
  return { text: freed ? also(`Ring the bell. ${way(true)}`) : people, done: freed };
}
