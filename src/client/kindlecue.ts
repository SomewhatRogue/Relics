/**
 * The warning at a house's kindling (Kyle, 2026-11-03: "I don't want people to burn the wrong house"):
 * stand at the woodpile of a house with someone still caged inside (`cry` on its block, from the
 * leader's game) and you hear a muffled cry through the wall, and a small SOMEONE'S INSIDE shows over
 * the pile. Once each time you come up to it. Never a joke. Sound and words only: nothing here decides.
 */
import type { GameMap } from '../shared/arena';
import { kindling } from '../shared/kindling';
import { HOUSEBURN } from '../shared/tuning';
import type { Hero } from '../sim/types';
import { sfxOut } from './sfx';

/** The words over the pile (for the lore keeper and line editor). */
export const CRY_CUE = "SOMEONE'S INSIDE";

let heard = -1;

/** Each frame: if you've just come up to a house where someone's crying out, say so. */
export function kindleCue(map: GameMap, me: Hero | undefined, say: (x: number, y: number, s: string) => void): void {
  let at = -1;
  if (me) map.blocks.forEach((b, i) => {
    if (at >= 0 || !b.cry || b.ruined) return;
    const k = kindling(b, map.blocks, map.w, map.h);
    if (k && Math.hypot(me.x - k.x, me.y - k.y) <= HOUSEBURN.cryReach) at = i;
  });
  if (at >= 0 && at !== heard) {
    const b = map.blocks[at], k = kindling(b, map.blocks, map.w, map.h)!;
    say(k.x, k.y, CRY_CUE);
    muffledCry();
  }
  heard = at;
}

/** A voice through a wall: two falling syllables, the high end gone, quiet. */
function muffledCry(): void {
  const o = sfxOut();
  if (!o) return;
  const c = o.ac, t = c.currentTime, lp = c.createBiquadFilter(), g = c.createGain();
  lp.type = 'lowpass';
  lp.frequency.value = 520;
  lp.Q.value = 0.7;
  g.gain.value = 0.5;
  lp.connect(g).connect(o.out);
  for (const [at, dur, f0, f1] of [[0, 0.32, 300, 250], [0.42, 0.55, 330, 210]]) {
    const osc = c.createOscillator(), env = c.createGain(), vf = c.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f0, t + at);
    osc.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
    vf.type = 'bandpass';
    vf.frequency.value = 650;
    vf.Q.value = 3;
    env.gain.setValueAtTime(0.0001, t + at);
    env.gain.exponentialRampToValueAtTime(0.22, t + at + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
    osc.connect(vf).connect(env).connect(lp);
    osc.start(t + at);
    osc.stop(t + at + dur + 0.05);
  }
}
