/**
 * What a wood lesson goes on to once its count is done (Kyle, 2026-11-05: "Once dodging is done,
 * highlight it as a quest complete and update the quest to kill the goblins"). The count done is an
 * objective passed: `passed` goes up (the tracker's gold flash watches it, client/objflash.ts) and a
 * `passed` event fires. Then the goal is the goblins still up, counted. A Ranger's path goes to PARRY
 * first (Kyle: "In training the Ranger is never taught how to parry"): a beat for the flash, then Hew's
 * card and the button, one plain goblin that swings, one parry (passed again), then the goblins.
 */
import { CLASS_GUARD } from '../shared/weapons';
import { LINES, PARRY_FOE, lessonsFor, type Lesson } from '../shared/wood';
import { isDead } from './damage';
import { HERO_ID, spawn } from './woodkit';
import type { ArenaRoom } from './room';
import type { FightEvent } from './types';
import type { WoodState } from './wood';

/** The lesson after its count: the Ranger's parry (`carded` once Hew's card is up), or the goblins left. */
export interface After { phase: 'parry' | 'kill'; at: number; carded?: boolean; foe?: number; killed: number; of: number }

/** Seconds between the dodges done and the Ranger's parry card, so the gold flash is seen. */
export const PARRY_BEAT = 1.0;

/** What the lesson counts now. */
export const countNow = (w: WoodState, l: Lesson): Lesson['count'] =>
  w.after?.phase === 'parry' ? (w.after.carded ? 'parry' : 'none') : w.after ? 'kills' : l.count;
/** How many it wants now (0 once it's down to killing what's left). */
export const needNow = (w: WoodState, l: Lesson): number => (w.after?.phase === 'parry' ? 1 : w.after ? 0 : l.need);
/** A kit that parries but can't hold a block (the Ranger's). */
export const parryOnly = (w: WoodState) => CLASS_GUARD[w.cls] === 'parry';
/** Has the wood given a Ranger the PARRY button yet (with Hew's card on the path)? */
export const guardTaught = (w: WoodState) =>
  lessonsFor(w.cls)[1].then === 'parry' && (w.stage > 1 || (w.stage === 1 && !!w.after && (w.after.phase === 'kill' || !!w.after.carded)));
/** The goblin to come at you now: the Ranger's plain swinger while it's the parry. */
export const preferred = (w: WoodState) => (w.after?.phase === 'parry' ? w.after.foe : undefined);

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
  // The Ranger's beat: the flash first, then Hew's card, the button, and one that swings.
  if (a?.phase === 'parry' && !a.carded) {
    if (room.time - a.at < PARRY_BEAT) return true;
    const f = spawn(room, PARRY_FOE);
    Object.assign(a, { carded: true, foe: f.id });
    w.ids.push(f.id);
    Object.assign(w, { count: 0, drilled: 0, praised: 0 });
    w.hold = { kind: 'card', who: 'HEW', text: LINES.teach.parry, how: LINES.how.parryOnly, move: 'parry', need: 'continue', t: 0, until: 0 };
    return true;
  }
  if (a?.phase === 'kill' || l.count === 'none' || w.count < needNow(w, l)) return false;
  pass(w, room, ev);
  const up = { killed: mine.filter(isDead).length, of: mine.length };
  if (!a && l.then === 'parry') return (w.after = { phase: 'parry', at: room.time, ...up }), true;
  // (Nothing left up: the way on opens this same frame.)
  w.after = { phase: 'kill', at: room.time, ...up };
  return false;
}

/** The goal over the field while it's one of these. */
export function afterGoal(w: WoodState, touch: boolean): { title: string; text: string } | null {
  const a = w.after;
  if (!a) return null;
  if (a.phase === 'kill') return { title: LINES.kill.title, text: `${LINES.kill.text} ${Math.min(a.killed, a.of)} / ${a.of}` };
  return { title: `PARRY: ${touch ? 'TAP PARRY' : 'TAP RIGHT CLICK'} WHILE THE RED FLASHES WHITE`, text: `PARRIES ${Math.min(w.count, 1)} / 1` };
}
