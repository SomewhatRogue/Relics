/**
 * Presses of yours that did nothing, said over your own hero (the room tells only that hero's client:
 * the event carries its id): GRAB with nothing to take hold of, and ATTACK held on an empty crossbow,
 * which also sets the RELOAD button pulsing for a moment (cluster.ts reads `reloadCue`).
 */
import type { FightEvent } from '../sim/types';
import { sfxTown } from './sfxtown';
import { toPx } from './world';
import type { Fx } from './fx';

/** Until when (page seconds) the RELOAD button pulses. */
export let reloadCue = 0;

/** One of the room's events: if it's a cue for `me`, show and sound it. */
export function ownCue(ev: FightEvent, me: string, fx: Fx, now: number): void {
  if ((ev.k !== 'nograb' && ev.k !== 'reloadcue') || ev.id !== me) return;
  const [sx, sy] = toPx(ev.x, ev.y);
  if (ev.k === 'nograb') return fx.say(sx, sy - 34, 'NOTHING TO GRAB', '#c8c4d0', 1.2), sfxTown.dull();
  fx.say(sx, sy - 34, 'RELOAD', '#ffd27a', 1.2);
  sfxTown.empty();
  reloadCue = now + 1.6;
}
