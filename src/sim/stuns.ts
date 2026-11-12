/**
 * Taking a goblin's turn, in one place (numbers: shared/stuncap.ts). Every stun, daze, knockdown,
 * pin, retch, blind, snare and skill stagger a hero causes comes through here with that hero's id:
 * one hero can take the same goblin's turn once every STUN_CAP.every seconds, and inside that the
 * goblin shrugs it off (the blow's damage still lands). Another hero still can, so a party chains
 * them. A turn taken by nobody in particular (a fall, a goblin's own charge into a wall) is never capped.
 * Plain hit flinches (the short jolt any blow gives a small goblin) and a slip's stun are
 * not turns taken here: they answer the goblin's own blow.
 */
import { STUN_CAP } from '../shared/tuning';
import { addPoise, immune } from './poise';
import { stunFor } from './bosshold';
import type { Enemy, FightEvent } from './types';

/** Can `by` take this goblin's turn now? If so it's marked as theirs; if not it shrugs it off (and says so,
 *  now and then). An empty `by` always can, and marks nothing. */
export function mayStun(e: Enemy, by: string | undefined, now: number, ev?: FightEvent[]): boolean {
  // A boss of the kit shrugs every ordinary stun off; POISE is its stagger (sim/poise.ts).
  if (immune(e)) return shrug(e, now, ev), false;
  if (!by) return true;
  const last = e.stunnedBy?.[by];
  if (last !== undefined && now - last < STUN_CAP.every) {
    return shrug(e, now, ev), false;
  }
  (e.stunnedBy ??= {})[by] = now;
  return true;
}

/** It says it shrugged one off, now and then. */
function shrug(e: Enemy, now: number, ev?: FightEvent[]): void {
  if (ev && now - (e.shrugAt ?? -9) >= STUN_CAP.say) (e.shrugAt = now), ev.push({ k: 'shrug', x: e.x, y: e.y });
}

/** Take its turn: `act` ('stunned' unless said) for `time` s, the blow it had going lost; `still` stops
 *  it sliding too. False if it shrugged it off. */
export function stun(e: Enemy, by: string | undefined, now: number, time: number, ev?: FightEvent[], act: 'stunned' | 'flinch' | 'pinned' = 'stunned', still = false, sure = false): boolean {
  // A BIG ONE: a short stun, then none from anyone for a while (sim/bosshold.ts), and a hold shrugged off
  // doesn't spend the hero's turn. A forced one (a fight's own knockdown) isn't held back.
  if (!sure && e.big && (e.holdUntil ?? -9) > now) return shrug(e, now, ev), false;
  if (!sure && !mayStun(e, by, now, ev)) return false;
  if (!sure && e.big) time = stunFor(e, now, time);
  Object.assign(e, { attack: null, act, actT: 0, actDur: time });
  if (still) e.kvx = e.kvy = 0;
  return true;
}

/** A relic's blow takes the goblin's turn whatever (2026-11-05: few uses, each one sure): never capped,
 *  never shrugged off, a striped blow lost with the rest. Marks nobody's turn, so the hero's own stuns
 *  after it aren't held back either. */
export function relicStun(e: Enemy, now: number, time: number, ev?: FightEvent[], act: 'stunned' | 'flinch' | 'pinned' = 'stunned', still = false): void {
  // A boss or BIG ONE: half as long, then none for a while (sim/bosshold.ts). A boss's POISE fills either way
  // (a full bar staggers it, longer still).
  const t = stunFor(e, now, time);
  if (t) stun(e, undefined, now, t, ev, act, still, true);
  else shrug(e, now, ev);
  if (e.boss) addPoise(e, 'relic', now, ev ?? []);
}
