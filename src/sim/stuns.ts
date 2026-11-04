/**
 * Taking a goblin's turn, in one place (numbers: shared/stuncap.ts). Every stun, daze, knockdown,
 * pin, retch, blind, snare and skill stagger a hero causes comes through here with that hero's id:
 * one hero can take the same goblin's turn once every STUN_CAP.every seconds, and inside that the
 * goblin shrugs it off (the blow's damage still lands). Another hero still can, so a party chains
 * them. A turn taken by nobody in particular (a fall, a goblin's own charge into a wall) is never capped.
 * Plain hit flinches (the short jolt any blow gives a small goblin), a parry's stun and a slip's are
 * not turns taken here: they answer the goblin's own blow.
 */
import { STUN_CAP } from '../shared/tuning';
import type { Enemy, FightEvent } from './types';

/** Can `by` take this goblin's turn now? If so it's marked as theirs; if not it shrugs it off (and says so,
 *  now and then). An empty `by` always can, and marks nothing. */
export function mayStun(e: Enemy, by: string | undefined, now: number, ev?: FightEvent[]): boolean {
  if (!by) return true;
  const last = e.stunnedBy?.[by];
  if (last !== undefined && now - last < STUN_CAP.every) {
    if (ev && now - (e.shrugAt ?? -9) >= STUN_CAP.say) (e.shrugAt = now), ev.push({ k: 'shrug', x: e.x, y: e.y });
    return false;
  }
  (e.stunnedBy ??= {})[by] = now;
  return true;
}

/** Take its turn: `act` ('stunned' unless said) for `time` s, the blow it had going lost; `still` stops
 *  it sliding too. False if it shrugged it off. */
export function stun(e: Enemy, by: string | undefined, now: number, time: number, ev?: FightEvent[], act: 'stunned' | 'flinch' | 'pinned' = 'stunned', still = false): boolean {
  if (!mayStun(e, by, now, ev)) return false;
  Object.assign(e, { attack: null, act, actT: 0, actDur: time });
  if (still) e.kvx = e.kvy = 0;
  return true;
}
