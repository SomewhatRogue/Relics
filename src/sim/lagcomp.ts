/**
 * Judging a blow that waited for a friend's word (sim/latelist.ts). Each Intent from a friend carries
 * `vt`, the leader's room time their screen was showing as they sent it. A blow that landed at `at` on
 * a hero with lag is judged once an Intent of theirs with `vt >= at` has come (everything they did up
 * to the moment they saw it land is here), or at `due` (`at` plus their lag, LAGCOMP.cap at most):
 *
 * - a dodge whose i-frames covered `at` by its press's `vt`: dodged (the goblin reels, as for anyone);
 * - a dodge begun during the wind-up by `vt` that had carried them out of it by `at`: dodged, as rolling
 *   out is (where it had carried them by then is worked out from its start, way and reach);
 * - a block held at `at` by `vt` (up by then, not yet down) and facing the blow: blocked;
 * - anything else lands, as it would have (a dodge pressed too late by their own screen doesn't save it).
 *
 * The room's own state, stepped on its ticks from the Intents it's given: the same Intents, the same fight.
 */
import { CLASS_DODGES, WEAPONS, guardOf } from '../shared/tuning';
import { attackCovers, hitHero, type Verdict } from './combat';
import { dodgeReach, slipWindow } from './knacks';
import type { LateBlow } from './latelist';
import type { Enemy, FightEvent, Hero, Intent } from './types';

/** What a friend's own screen says of a blow that landed at `p.at`. */
export function judge(p: LateBlow, h: Hero): Verdict {
  const w = WEAPONS[h.weapon];
  if (CLASS_DODGES[w.cls] && h.rollVt !== undefined) {
    const into = p.at - h.rollVt;
    if (into >= w.dodge.iFrom && into <= slipWindow(h)) return 'dodge';
    // Out from under it by their screen: where the dodge had carried them by the time it landed there
    // (its start, its way, its reach; the room's own roll may not have got that far yet).
    const k = Math.min(into, w.dodge.time) / w.dodge.time, reach = h.rollReach ?? dodgeReach(h);
    if (into > 0 && into <= p.a.windup && !attackCovers(p.a, { ...h, x: h.rollX + h.rollDx * reach * k, y: h.rollY + h.rollDy * reach * k })) return 'out';
  }
  const held = h.guardVt !== undefined && h.guardVt <= p.at && (h.guardOffVt === undefined || h.guardOffVt > p.at);
  if (held && guardOf(w) === 'full' && h.stamina > 0 && !h.winded) return 'block';
  return 'land';
}

/** Each tick, after the heroes have moved: the blows whose time has come, judged; the rest kept. */
export function stepLate(late: LateBlow[], heroes: Hero[], foes: Enemy[], intents: Map<string, Intent>, now: number, ev: FightEvent[]): LateBlow[] {
  if (!late.length) return late;
  const keep: LateBlow[] = [];
  for (const p of late) {
    const h = heroes.find((x) => x.id === p.hero);
    // (Gone through a door, or out of the job: nothing to land on.)
    if (!h) continue;
    if ((intents.get(h.id)?.vt ?? -Infinity) < p.at && now < p.due - 1e-6) {
      keep.push(p);
      continue;
    }
    const e = foes.find((x) => x.id === p.foe);
    if (e) hitHero(e, p.a, h, now, ev, heroes, { verdict: judge(p, h), sx: p.sx, sy: p.sy, gx: p.gx, gy: p.gy });
  }
  return keep;
}
