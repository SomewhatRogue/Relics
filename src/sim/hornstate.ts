/**
 * A Hornblower's call, as the rest of the room reads it (the rules: sim/hornblow.ts): whether it's blowing
 * now, and cutting it off (a charged blow or a perfect, sim/combat.ts; a heavy hit of any kind, sim/damage.ts;
 * a stun, a freeze, a net or its death, sim/hornblow.ts). Cut off, it never blows again. No imports from
 * the fight's rules, so any of them can call it.
 */
import type { Enemy, FightEvent } from './types';

export const calling = (e: Pick<Enemy, 'call'>, now: number) => !!e.call && !e.call.cut && !e.call.blown && now < e.call.until;

export function cutCall(e: Enemy, now: number, ev: FightEvent[]): void {
  if (!calling(e, now)) return;
  e.call!.cut = true;
  ev.push({ k: 'horncut', x: e.x, y: e.y });
}
