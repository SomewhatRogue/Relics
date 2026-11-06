/**
 * What a wood lesson goes on to once its count is done (Kyle, 2026-11-05: "Once dodging is done,
 * highlight it as a quest complete and update the quest to kill the goblins"). The count done is an
 * objective passed: `passed` goes up (the tracker's gold flash watches it, client/objflash.ts) and a
 * `passed` event fires. Then the goal is the goblins still up, counted. (A Ranger's path had a PARRY
 * step between the two; it went with parry on 2026-11-05, so the Ranger goes from the dodges straight
 * to the goblins, as everyone does.)
 */
import { LINES, type Lesson } from '../shared/wood';
import { isDead } from './damage';
import { HERO_ID } from './woodkit';
import type { ArenaRoom } from './room';
import type { FightEvent } from './types';
import type { WoodState } from './wood';

/** The lesson after its count: the goblins left. */
export interface After { phase: 'kill'; at: number; killed: number; of: number }

/** What the lesson counts now. */
export const countNow = (w: WoodState, l: Lesson): Lesson['count'] => (w.after ? 'kills' : l.count);
/** How many it wants now (0 once it's down to killing what's left). */
export const needNow = (w: WoodState, l: Lesson): number => (w.after ? 0 : l.need);

/** An objective done: the tracker flashes gold (client/objflash.ts watches `passed`). */
function pass(w: WoodState, room: ArenaRoom, ev: FightEvent[]): void {
  const h = room.heroes.find((x) => x.id === HERO_ID);
  w.passed = (w.passed ?? 0) + 1;
  ev.push({ k: 'passed', x: h?.x ?? 0, y: h?.y ?? 0 });
}

/** Each frame of a lesson on the path, the clearing or the stream. True: the wood does nothing more this frame. */
export function stepAfter(w: WoodState, room: ArenaRoom, ev: FightEvent[], l: Lesson): boolean {
  if (w.stage < 1 || w.stage > 3) return false;
  const mine = room.enemies.filter((e) => w.ids.includes(e.id)), a = w.after;
  if (a) (a.killed = mine.filter(isDead).length), (a.of = mine.length);
  if (a || l.count === 'none' || w.count < needNow(w, l)) return false;
  pass(w, room, ev);
  // (Nothing left up: the way on opens this same frame.)
  w.after = { phase: 'kill', at: room.time, killed: mine.filter(isDead).length, of: mine.length };
  return false;
}

/** The goal over the field while it's one of these. */
export function afterGoal(w: WoodState, _touch: boolean): { title: string; text: string } | null {
  const a = w.after;
  if (!a) return null;
  return { title: LINES.kill.title, text: `${LINES.kill.text} ${Math.min(a.killed, a.of)} / ${a.of}` };
}
