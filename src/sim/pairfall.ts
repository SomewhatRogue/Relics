/**
 * THE SLUICER and THE RAKER (docs/design/instances.md, the washing floor: "one raises the other, so kill both close
 * together"; docs/decisions/instances.md). A blow that would kill the Sluicer while the Raker stands drops it in the
 * water instead (`fallen`): it lies there, nothing lands on it. The Raker leaves the fight and walks to it, and lifts
 * it for PAIR.lift s (`lift`, drawn as a ring on the Sluicer; a stun on the Raker starts it over), and the Sluicer is
 * up again at PAIR.back of its health. Kill the Raker while the Sluicer lies there and the Sluicer is dead with it.
 * Kill the Raker first and the Sluicer fights on alone. Plain data on the two goblins, so a friend's screen and a
 * handed-on room have it.
 */
import { PAIR, TICK } from '../shared/tuning';
import { isDead, kill } from './damage';
import type { World } from './elements';
import { goTo } from './tasks';
import type { Enemy, FightEvent } from './types';

/** Where the Raker stood last tick while it goes to the Sluicer (not saved: after a handover it starts from where it is). */
const held = new WeakMap<Enemy, { x: number; y: number }>();

/** Every goblin of the room's pair, from the room as a whole (the damage step has no World). */
let pairOf: (e: Enemy) => Enemy | undefined = () => undefined;

/** Called by sim/damage.ts as a blow takes the Sluicer to nothing: in the water instead, if the Raker stands. */
export function fallsInstead(e: Enemy, now: number, ev: FightEvent[]): boolean {
  if (e.pair !== 'sluicer') return false;
  const raker = pairOf(e);
  if (!raker || isDead(raker)) return false;
  Object.assign(e, { hp: 1, fallen: now, act: 'stunned', actT: 0, actDur: Infinity, attack: null, kvx: 0, kvy: 0 });
  raker.lift = 0;
  ev.push({ k: 'pairfell', x: e.x, y: e.y });
  return true;
}

export function stepPairFall(w: World): void {
  const all = w.enemies.filter((e) => e.pair);
  if (!all.length) return;
  pairOf = (e) => all.find((o) => o !== e && o.pair && o.pair !== e.pair);
  const sl = all.find((e) => e.pair === 'sluicer'), rk = all.find((e) => e.pair === 'raker');
  if (!sl || sl.fallen === undefined) return void (rk && held.delete(rk));
  // The Raker done for while it lies there: so is it.
  if (!rk || isDead(rk)) {
    Object.assign(sl, { fallen: undefined, lastBy: rk?.lastBy ?? sl.lastBy });
    return kill(sl, w.ev, 'fall');
  }
  // To it, then lifting it (knocked senseless, it starts over). Its own chase this tick undone: it goes only to the
  // Sluicer (else it rocks between you and it).
  const was = held.get(rk);
  if (was && rk.act !== 'stunned') Object.assign(rk, { x: was.x, y: was.y });
  held.set(rk, { x: rk.x, y: rk.y });
  if (rk.act === 'stunned') return void (rk.lift = 0);
  // (Body to body: the gap between them, not their middles.)
  const d = Math.hypot(sl.x - rk.x, sl.y - rk.y) - sl.radius - rk.radius;
  if (d > PAIR.reach) {
    (rk.lift = 0), (rk.attack = null), goTo(rk, sl.x + (rk.x > sl.x ? 0.8 : -0.8), sl.y, PAIR.walk, TICK);
    return void held.set(rk, { x: rk.x, y: rk.y });
  }
  Object.assign(rk, { attack: null, act: 'idle', kvx: 0, kvy: 0, lift: (rk.lift ?? 0) + TICK });
  if (rk.lift! < PAIR.lift) return;
  Object.assign(sl, { fallen: undefined, act: 'idle', actT: 0, actDur: 0, hp: Math.round(sl.maxHp * PAIR.back) });
  rk.lift = 0;
  w.ev.push({ k: 'pairup', x: sl.x, y: sl.y });
}
