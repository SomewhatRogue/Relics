/**
 * The Ranger's techniques in the room (numbers: shared/techniques.ts). TRAPPER: a snare stays set
 * after its first goblin and catches a second (sim/ranger.ts asks `catches`). QUICK NOCK: a perfect
 * shot ends at once and the next draw starts part drawn; a crossbow's perfect bolt loads the next.
 * STEADY: a shot loosed on the move doesn't drift off the aim. The drift is the bow swaying as you
 * walk, from the room's clock (no dice), so every screen sees the same arrow.
 */
import { CHARGE, WEAPONS } from '../shared/tuning';
import { AIM_DRIFT, QUICK_NOCK, TRAPPER, knowsTech } from '../shared/techniques';
import type { FightEvent, Hero, Intent } from './types';

/** How many goblins this Ranger's snare catches. */
export const catches = (h: Hero) => (knowsTech(h, 'trapper') ? TRAPPER.catches : 1);

/** A hold let go: a perfect bow shot (or glinted bolt) with QUICK NOCK ends at once, and a crossbow is loaded again. */
export function quickNock(h: Hero, now: number, ev: FightEvent[]): void {
  const w = WEAPONS[h.weapon], shot = w.heavy.shot === 'arrow' || w.heavy.shot === 'bolt';
  h.nocked = shot && h.perfect && knowsTech(h, 'quicknock');
  if (!h.nocked) return;
  h.nockAt = now;
  if (w.reloads) Object.assign(h, { xbowEmpty: false, xbowWind: 0, xbowGlint: false });
  ev.push({ k: 'quicknock', x: h.x, y: h.y });
}

/** A draw begins: the seconds already drawn (a head start just after a QUICK NOCK shot). */
export function nockHead(h: Hero, full: number, now: number): number {
  if (now - (h.nockAt ?? -99) > QUICK_NOCK.within || WEAPONS[h.weapon].reloads) return 0;
  h.nockAt = -99;
  return Math.max(0, full - CHARGE.start) * QUICK_NOCK.head;
}

/**
 * How far off the aim a shot loosed now strays (radians). Moving: the bow sways, unless STEADY. `wind`
 * is for the weather to push with later (shared/weather.ts), on top of the sway.
 */
export function drift(h: Hero, moving: boolean, now: number, wind = 0): number {
  const sway = moving && !knowsTech(h, 'steady') ? AIM_DRIFT.most * Math.sin(now * AIM_DRIFT.sway) : 0;
  return sway + wind;
}

/** The hero as a Ranger's arrow or bolt leaves the bow: facing turned by the drift. STEADY on the move says so. */
export function aimed(h: Hero, shot: string | undefined, inp: Intent | undefined, now: number, ev: FightEvent[]): Hero {
  if (WEAPONS[h.weapon].cls !== 'RANGER' || (shot !== 'arrow' && shot !== 'bolt')) return h;
  const moving = !!inp && Math.hypot(inp.mx, inp.my) >= AIM_DRIFT.moving, a = drift(h, moving, now);
  if (moving && knowsTech(h, 'steady')) ev.push({ k: 'steady', x: h.x, y: h.y });
  if (!a) return h;
  const c = Math.cos(a), s = Math.sin(a);
  return { ...h, fx: h.fx * c - h.fy * s, fy: h.fx * s + h.fy * c };
}
