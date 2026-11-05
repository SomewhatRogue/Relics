/**
 * Each class's own button (shared/signs.ts), in the room: the press is counted (Intent.signSeq, so a
 * guest's press is never lost), kept INPUT_BUFFER s, and fired once the hero is free to and it's ready.
 * A Rogue's SHADOW STEP moves them, so it waits for a standstill or a walk; a Ranger's MARK and a
 * Healer's MEND go in a swing too. A press that finds nothing to do (nothing to mark, nobody hurt, no
 * breath) is spent and costs nothing.
 */
import { INPUT_BUFFER, WEAPONS } from '../shared/tuning';
import { SIGNS, signOf, type SignId } from '../shared/signs';
import type { Npc } from '../shared/arena';
import { shadowstep } from './relics';
import { markGoblin } from './mark';
import { healTap } from './healtap';
import type { World } from './elements';
import type { Hero, HeroAct, Intent } from './types';

/** This hero's own move (null for a Warrior or a Mage, whose GRAB and ELEMENT have their own). */
export const signFor = (h: Hero): SignId | null => signOf(WEAPONS[h.weapon].cls);
/** Seconds till it's ready again. */
export const signLeft = (h: Hero, now: number) => Math.max(0, (h.signReady ?? 0) - now);

const BUSY: HeroAct[] = ['down', 'stun', 'hurt', 'roll', 'zip', 'bash', 'carry', 'slam', 'throw'];

/** The press, each tick (sim/hero.ts). */
export function signPressed(h: Hero, inp: Intent, now: number): void {
  const seq = inp.signSeq ?? h.seen.sign ?? 0;
  if (seq !== (h.seen.sign ?? 0)) (h.seen.sign = seq), (h.signQueuedAt = now);
}

/** Should it go now? `still`: the hero is standing or walking (a SHADOW STEP waits for that). */
export function signDue(h: Hero, now: number, still: boolean): boolean {
  const at = h.signQueuedAt ?? -9, s = signFor(h);
  if (at < 0) return false;
  if (!s || now - at > INPUT_BUFFER) return void (h.signQueuedAt = -9), false;
  if (now < (h.signReady ?? 0) || BUSY.includes(h.act)) return false;
  return s === 'shadow' ? still : true;
}

/** Fire it (the room's side: who's about). True when it went, and it's waiting again. (A SHADOW STEP
 *  comes here at the end of its short wind-up: sim/hero.ts.) */
export function fireSign(h: Hero, w: World, aim: Intent | undefined, npcs: Npc[]): boolean {
  const s = signFor(h);
  h.signQueuedAt = -9;
  // (Changed weapon mid wind-up, or knocked out of it: nothing.)
  if (s === 'shadow' && h.act !== 'throw') return false;
  if (!s) return false;
  const went = s === 'shadow' ? (shadowstep(h, w.enemies, w.ev, w.now), true) : s === 'mark' ? markGoblin(h, w.enemies, aim, w.now, w.ev) : healTap(h, w.heroes, npcs, w.now, w.ev);
  if (went) h.signReady = w.now + SIGNS[s].cooldown;
  return went;
}
