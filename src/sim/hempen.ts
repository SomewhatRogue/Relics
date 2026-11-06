/**
 * Hempen, the named butcher at the end of Hangman's Wood (numbers: shared/hangtune.ts HEMPEN). A butcher
 * as any named one, and its noose besides: every HEMPEN.every seconds, with a hero far enough off and in
 * reach, it throws the noose down a thin red lane (the gaffer's hook's lane: block it and nothing comes of
 * it; a parry snaps the rope for a while, sim/gaffer.ts snapHook). Landed, you're hoisted as in a snare
 * (sim/snares.ts) until a friend cuts you down. Where it falls it leaves a relic, every time (sim/pickups.ts).
 */
import { HEMPEN } from '../shared/tuning';
import { begin } from './enemies';
import { hooking } from './gaffer';
import type { Enemy, FightEvent, Hero } from './types';

/** Its noose, if it's time (true: that's its turn). */
export function stepNoose(e: Enemy, t: Hero, d: number, facing: number, now: number, ev: FightEvent[]): boolean {
  if (!e.noose || e.attack || e.cooldown > 0 || !hooking(e, now) || t.hoisted) return false;
  if (d < HEMPEN.min || d > HEMPEN.noose.range! || facing < 0.8 || now - (e.snareAt ?? -99) < HEMPEN.every) return false;
  begin(e, 'hook', HEMPEN.noose, t, ev);
  e.snareAt = now;
  ev.push({ k: 'noosed', x: e.x, y: e.y });
  return true;
}
