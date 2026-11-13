/**
 * The Deep skill's button in the room (shared/deepskill.ts): the press is counted (Intent.deepSeq, so a guest's
 * tap is never lost), kept INPUT_BUFFER s, and started once the hero is free and it's ready. Each skill runs as
 * its own act; only the Rogue's long cut is built (sim/samuraicut.ts). A hero who hasn't been taught it, or a
 * press while it waits, does nothing (the press is spent).
 */
import { INPUT_BUFFER } from '../shared/tuning';
import { DEEP_COOLDOWN } from '../shared/deepskill';
import { startCut, stepCut } from './samuraicut';
import type { Enemy, FightEvent, Hero, HeroAct, Intent } from './types';

/** Seconds till it's ready again. */
export const deepLeft = (h: Hero, now: number) => Math.max(0, (h.deepReady ?? 0) - now);

/** Its wait, for the button's sweep. */
export const deepWait = (h: Hero) => (h.deepSkill ? DEEP_COOLDOWN[h.deepSkill] : 1);

const BUSY: HeroAct[] = ['down', 'stun', 'hurt', 'roll', 'zip', 'bash', 'carry', 'slam', 'throw', 'cut'];

/** The press, each tick (sim/hero.ts). */
export function deepPressed(h: Hero, inp: Intent, now: number): void {
  const seq = inp.deepSeq ?? h.seen.deep ?? 0;
  if (seq !== (h.seen.deep ?? 0)) (h.seen.deep = seq), (h.deepQueuedAt = now);
}

/** Should it start now? (Standing, walking or between swings: sim/hero.ts asks from there.) */
export function deepDue(h: Hero, now: number): boolean {
  const at = h.deepQueuedAt ?? -9;
  if (at < 0) return false;
  if (!h.deepSkill || now - at > INPUT_BUFFER) return void (h.deepQueuedAt = -9), false;
  return now >= (h.deepReady ?? 0) && !BUSY.includes(h.act);
}

/** Start it: the hero's act from now till it's done. */
export function startDeep(h: Hero, inp: Intent, enemies: Enemy[], ev: FightEvent[]): void {
  h.deepQueuedAt = -9;
  if (h.deepSkill === 'cut') startCut(h, inp, enemies, ev);
}

/** Its act, each tick (sim/hero.ts returns after this). */
export function stepDeep(h: Hero, inp: Intent, enemies: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  if (h.act === 'cut') stepCut(h, inp, enemies, now, dt, ev);
}
