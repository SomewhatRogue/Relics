/**
 * A Doorkeeper's turn (docs/plans/bosses.md, the Doorkeepers; numbers shared/bosstune.ts DOORKEEPERS).
 * stepEnemy hands a boss over here once its blow (if any) has run. One of the pair is the WALL: it walks its
 * hero down and stands in their face, turning slowly (its front takes nothing: get behind it). The other is
 * the MOVER: its rotation of quick jabs and big blows, each big one with its punish (the sweep's recover, the
 * charge stuck in a hay stack, the dizzy after a spin), always at whoever it faces (sim/bosskit.ts bossTarget), and never at a
 * hero another boss is already winding up at. The wall jabs round its door at whoever's in its face. ENRAGED
 * (phase 2), it closes on you and turns DOORKEEPERS.enrage.pace times as fast, and pauses less between blows. The pair's own rules (the swap, the lock, walking back,
 * phase 2) are once a tick in sim/doorpair.ts.
 */
import { DOORKEEPERS } from '../shared/tuning';
import { walk } from './enemies';
import { isDead } from './damage';
import { bossBegin, bossTarget, clocked, enraged, rotation, theBook, turnTo, type BossOn } from './bosskit';
import { stepHempen } from './hempenboss';
import { stepHaulier } from './haulier';
import { stepListener } from './listener';
import { stepLeechman } from './leechman';
import type { Enemy, FightEvent, Hero } from './types';

const D = DOORKEEPERS;
export const partnerOf = (e: Enemy, foes: Enemy[]) => foes.find((o) => o !== e && !!o.boss && !isDead(o));

/** Its turn (`notice`: the room's own look about, while it hasn't seen you). */
export function stepKeeper(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[], foes: Enemy[], notice: () => boolean): void {
  const b = e.boss!, bk = theBook();
  // Hempen, the wood's boss, takes its own turn (sim/hempenboss.ts).
  if (b.who === 'hempen') return stepHempen(e, heroes, now, dt, ev, notice);
  // The Deep's Haulier takes its own turn too (sim/haulier.ts).
  if (b.who === 'haulier') return stepHaulier(e, heroes, now, dt, ev, notice);
  // THE LISTENER, the old caves' boss, takes its own (sim/listener.ts).
  if (b.who === 'listener') return stepListener(e, heroes, now, dt, ev);
  // THE LEECHMAN, the fen's boss, takes its own (sim/leechman.ts).
  if (b.who === 'leechman') return stepLeechman(e, heroes, now, dt, ev, notice);
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
    // Slow to turn: a flanker gets round it. In its face, a jab round the door's edge now and then.
    const facing = turnTo(e, ux, uy, D.turn.wall, dt);
    if (bk && now >= (bk.jabAt ?? -9) && d <= D.jab.range! && facing > 0.85 && !clocked(t.id, foes, e) && bossBegin(e, 'jab', t, ev)) {
      bk.jabAt = now + e.attack!.windup + e.attack!.active + e.attack!.recover + D.wallJab;
      return;
    }
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
  const k = enraged(e) ? D.enrage.pace : 1, facing = turnTo(e, ux, uy, D.turn.move * k, dt), pace = D.walk.move * k;
  if (e.cooldown > 0) return void (d > D.jab.range! * 0.8 && walk(e, ux, uy, pace * Math.max(0.2, facing), dt));
  const go = (ok: boolean, at = t) => ok && bossBegin(e, next, at, ev) && advance(b, now, e.attack!.windup + e.attack!.active + e.attack!.recover);
  // The VAULT: up and over to the hero furthest off; with nobody far enough, passed over (boss-threat.md step 3).
  if (next === 'vault') {
    const far = furthest(e, heroes);
    if (!far) return void advance(b, now, 0);
    const fu = Math.hypot(far.x - e.x, far.y - e.y) || 1, fface = far === t ? facing : turnTo(e, (far.x - e.x) / fu, (far.y - e.y) / fu, D.turn.move * k, dt);
    if (go(fface > 0.6, far)) Object.assign(e.attack!, { aimed: '', cx: far.x, cy: far.y });
    return;
  }
  // The BASH: the door swung back straight after the sweep, at whoever's still close; else passed over.
  if (next === 'bash') return void (go(d <= D.bash.range! + 0.1 && facing > 0.7) || advance(b, now, 0));
  // The QUAKE: the crack runs the way it faces, from within reach of its last circle (its own blow nothing: no circle of its own).
  if (next === 'quake') {
    if (go(facing > 0.85 && d <= D.quakeStep * D.quakeN + 0.5)) (e.attack!.aimed = ''), (e.attack!.hit = heroes.map((h) => h.id)), (e.attack!.radius = 0);
    else walk(e, ux, uy, pace * Math.max(0.2, facing), dt);
    return;
  }
  if (next === 'jab' || next === 'sweep') {
    const reach = next === 'jab' ? D.jab.range! : D.sweep.range!;
    if (go(d <= reach + 0.1 && facing > (next === 'jab' ? 0.85 : 0.8))) return split(e, b, t, now);
    return walk(e, ux, uy, pace * Math.max(0.2, facing), dt);
  }
  if (next === 'spin') {
    if (go(d <= D.spin.radius! + 0.4)) return;
    return walk(e, ux, uy, pace * Math.max(0.2, facing), dt);
  }
  // The charge: from far enough off (it backs away to get it), along the lane it shows.
  if (go(d >= D.chargeFrom && d <= D.charge.range! - 0.6 && facing > 0.92)) return split(e, b, t, now);
  if (d < D.chargeFrom) walk(e, -ux, -uy, pace * 0.8, dt);
  else if (d > D.charge.range! - 0.6) walk(e, ux, uy, pace * Math.max(0.2, facing), dt);
}

/** The rest between one of its blows and the next (sim/enemies.ts asks): DOORKEEPERS.pause, less again ENRAGED. */
export const keeperPause = (e: Enemy) => D.pause * (enraged(e) ? D.enrage.windup : 1);

const heard = (e: Enemy, heroes: Hero[]) => heroes.some((h) => h.act !== 'down' && h.id !== 'squire' && !h.sneaking && Math.hypot(h.x - e.x, h.y - e.y) <= D.hear);

/** The hero standing furthest off, if any is at least DOORKEEPERS.vaultFrom away. */
function furthest(e: Enemy, heroes: Hero[]): Hero | undefined {
  let best: Hero | undefined, bd = D.vaultFrom;
  for (const h of heroes) {
    if (h.act === 'down' || h.out || h.id === 'squire') continue;
    const d = Math.hypot(h.x - e.x, h.y - e.y);
    if (d >= bd) (best = h), (bd = d);
  }
  return best;
}

/** On to the next in its rotation (the clock for it starts once this blow is done). */
function advance(b: BossOn, now: number, busy: number): true {
  b.rot++;
  b.rotAt = now + busy;
  return true;
}

/** A party of two: the wall swings at a second hero a moment after the mover's big blow begins (sim/doorpair.ts). */
function split(e: Enemy, b: BossOn, t: Hero, now: number): void {
  const bk = theBook();
  if (bk && b.party >= 2 && b.phase === 1 && e.attack?.boss !== 'jab') bk.split = { at: now + D.split, not: t.id };
}
