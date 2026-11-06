/**
 * A Doorkeeper's turn (docs/plans/bosses.md, the Doorkeepers; numbers shared/bosstune.ts DOORKEEPERS).
 * stepEnemy hands a boss over here once its blow (if any) has run. One of the pair is the WALL: it walks its
 * hero down and stands in their face, turning slowly (its front takes nothing: get behind it). The other is
 * the MOVER: its rotation of blows, each with its punish (the sweep's recover, the charge stuck in a hay
 * stack, the dizzy after a spin), always at whoever it faces (sim/bosskit.ts bossTarget), and never at a
 * hero another boss is already winding up at. The pair's own rules (the swap, the lock, walking back,
 * phase 2) are once a tick in sim/doorpair.ts.
 */
import { DOORKEEPERS } from '../shared/tuning';
import { walk } from './enemies';
import { isDead } from './damage';
import { bossBegin, bossTarget, clocked, rotation, theBook, turnTo, type BossOn } from './bosskit';
import { stepHempen } from './hempenboss';
import type { Enemy, FightEvent, Hero } from './types';

const D = DOORKEEPERS;
export const partnerOf = (e: Enemy, foes: Enemy[]) => foes.find((o) => o !== e && !!o.boss && !isDead(o));

/** Its turn (`notice`: the room's own look about, while it hasn't seen you). */
export function stepKeeper(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[], foes: Enemy[], notice: () => boolean): void {
  const b = e.boss!, bk = theBook();
  // Hempen, the wood's boss, takes its own turn (sim/hempenboss.ts).
  if (b.who === 'hempen') return stepHempen(e, heroes, now, dt, ev, notice);
  // At its post facing the back wall until it sees you, or hears you come within DOORKEEPERS.hear (creeping, only
  // what it sees: an ambush to open with). sim/doorpair.ts wakes its partner and starts the fight.
  if (e.alert === false && !heard(e, heroes) && !notice()) return;
  e.alert = true;
  const t = bossTarget(e, heroes, now);
  // Roaring (a phase change): it faces you, and nothing lands either way.
  if (b.roarUntil > now) return void (t && turnTo(e, t.x - e.x, t.y - e.y, 9, dt));
  // Carried along in its partner's lock, or stood open after one.
  if ((bk && bk.lockBy >= 0 && bk.lockBy !== e.id) || b.openUntil > now) return;
  // Walking back to its partner, its back to you, till it's at its side again.
  if (b.backUntil > now) {
    const p = partnerOf(e, foes);
    if (!p || Math.hypot(p.x - e.x, p.y - e.y) <= D.lockIn - 0.4) return void (b.backUntil = now);
    const ux = p.x - e.x, uy = p.y - e.y;
    return void walk(e, ux, uy, D.walk.move * Math.max(0.3, turnTo(e, ux, uy, 6, dt)), dt);
  }
  if (!t) return;
  const d = Math.hypot(t.x - e.x, t.y - e.y) || 1, ux = (t.x - e.x) / d, uy = (t.y - e.y) / d;
  if (b.job === 'wall') {
    // Slow to turn: a flanker gets round it.
    const facing = turnTo(e, ux, uy, D.turn.wall, dt);
    if (d > D.stand) walk(e, ux, uy, D.walk.wall * Math.max(0.2, facing), dt);
    return;
  }
  mover(e, b, t, d, ux, uy, heroes, foes, now, dt, ev);
}

/** The next blow of its rotation, once it's in place for it. */
function mover(e: Enemy, b: BossOn, t0: Hero, d0: number, ux0: number, uy0: number, heroes: Hero[], foes: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  const rot = rotation(b.phase, b.party, theBook()?.swaps[b.phase - 1] ?? 0), next = rot[b.rot % rot.length];
  // One it can't get to in time is passed over (a hero hugging it can't stall its charge for ever).
  if (now - b.rotAt > D.skip) return void advance(b, now, 0);
  // Its hero already has a boss blow coming: another, else it waits its turn.
  const t = clocked(t0.id, foes, e) ? heroes.find((h) => h.act !== 'down' && !h.out && h.id !== 'squire' && !clocked(h.id, foes, e)) : t0;
  if (!t) return;
  const d = t === t0 ? d0 : Math.hypot(t.x - e.x, t.y - e.y) || 1, ux = t === t0 ? ux0 : (t.x - e.x) / d, uy = t === t0 ? uy0 : (t.y - e.y) / d;
  const facing = turnTo(e, ux, uy, D.turn.move, dt), pace = D.walk.move;
  if (e.cooldown > 0) return void (d > D.sweep.range! * 0.8 && walk(e, ux, uy, pace * Math.max(0.2, facing), dt));
  const go = (ok: boolean) => ok && bossBegin(e, next, t, ev) && advance(b, now, e.attack!.windup + e.attack!.active + e.attack!.recover);
  if (next === 'sweep') {
    if (go(d <= D.sweep.range! + 0.1 && facing > 0.8)) return split(b, t, now);
    return walk(e, ux, uy, pace * Math.max(0.2, facing), dt);
  }
  if (next === 'spin') {
    if (go(d <= D.spin.radius! + 0.4)) return;
    return walk(e, ux, uy, pace * Math.max(0.2, facing), dt);
  }
  // The charge: from far enough off (it backs away to get it), along the lane it shows.
  if (go(d >= D.chargeFrom && d <= D.charge.range! - 0.6 && facing > 0.92)) return split(b, t, now);
  if (d < D.chargeFrom) walk(e, -ux, -uy, pace * 0.8, dt);
  else if (d > D.charge.range! - 0.6) walk(e, ux, uy, pace * Math.max(0.2, facing), dt);
}

const heard = (e: Enemy, heroes: Hero[]) => heroes.some((h) => h.act !== 'down' && h.id !== 'squire' && !h.sneaking && Math.hypot(h.x - e.x, h.y - e.y) <= D.hear);

/** On to the next in its rotation (the clock for it starts once this blow is done). */
function advance(b: BossOn, now: number, busy: number): true {
  b.rot++;
  b.rotAt = now + busy;
  return true;
}

/** A party of two: the wall swings at a second hero a moment after the mover's blow begins (sim/doorpair.ts). */
function split(b: BossOn, t: Hero, now: number): void {
  const bk = theBook();
  if (bk && b.party >= 2 && b.phase === 1) bk.split = { at: now + D.split, not: t.id };
}
