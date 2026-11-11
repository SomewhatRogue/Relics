/**
 * The Haulier's turn (docs/design/deep-bosses.md; numbers shared/haultune.ts). stepEnemy hands a boss over
 * to sim/doorkeepers.ts, which hands the Haulier here once its blow (if any) has run. It wakes when it sees
 * you, walks to whoever it faces, and works through its rotation (the plan's, one seeded swap, one more for
 * a party of four): the PICK (a red wedge), the OVERHEAD (a striped circle ahead, the pick stuck after), the
 * SHOVE (it walks to a cart at a stop and puts its shoulder to it: a striped lane the length of the rail
 * shows, then the cart goes) and, in phase 2, the DRAG (a striped ring round itself). Every blow has the
 * kit's pose first (BOSS.tell), and the pick and the overhead turn with their hero until BOSS.aimLock of the
 * wind-up (sim/bosskit.ts trackAim). Phase 2 (sim/haulbook.ts): HAULIER.faster its pace, walk, turn, wind-ups
 * and rests, never under the Doorkeepers' enraged floors. Staggered or knocked down by a cart, it does nothing.
 * `boss.move` says which blow is under way, for the screen to pose on (client/hauldraw.ts).
 */
import { BOSS, DOORKEEPERS, HAULIER as H, HERO, WEAPONS, type EnemyAttackSpec } from '../shared/tuning';
import { begin, walk } from './enemies';
import { bossTarget, theBook, turnTo, type BossOn } from './bosskit';
import { haulState, nearestCart, farStop } from './haulcarts';
import { wayTo } from './pathing';
import type { AttackKind, Enemy, FightEvent, Hero, Prop } from './types';
import type { HaulMove } from '../shared/haultune';

const KIND: Record<HaulMove, AttackKind> = { pick: 'cleave', overhead: 'slam', shove: 'charge', drag: 'slam' };
const SPEC: Record<HaulMove, EnemyAttackSpec> = { pick: H.pick, overhead: H.overhead, shove: H.shove, drag: H.drag };
/** Local numbers (shared/haultune.ts has none for them): how fast it turns, and how long it tries one blow before passing it over. */
const TURN = 4, SKIP = 5;
/** The slowest kit's pace (a striped floor is walked out of from its middle in 60% of it at this: as bosskit.ts). */
const SLOWEST = Math.min(...Object.values(WEAPONS).map((w) => HERO.speed * (w.speed ?? 1)));
const E = DOORKEEPERS.enrage.floor;

/** The rotation for a phase: the plan's, one seeded swap, and one more for a party of four. */
export function haulRotation(phase: 1 | 2, party: number, swap: number): HaulMove[] {
  const r = [...H.rotation[phase]];
  const i = ((swap % r.length) + r.length) % r.length, j = (i + 1) % r.length;
  [r[i], r[j]] = [r[j], r[i]];
  if (party >= 4) r.push(H.more);
  return r;
}

/**
 * Begin one of its blows at `t`: the pose first, its floor after; phase 2 quicker, never under the floors.
 * The shove's lane is the rail from `cart` (at a stop) to the far stop; it faces along it.
 */
export function haulBegin(e: Enemy, move: HaulMove, t: Hero, ev: FightEvent[], cart?: Prop): boolean {
  const spec = SPEC[move], b = e.boss!, k = b.phase === 2 ? H.faster : 1;
  begin(e, KIND[move], spec, t, ev);
  const a = e.attack;
  if (!a) return false;
  if (move === 'shove') {
    if (!cart) return (e.attack = null), (e.act = 'chase'), false;
    const dir = Math.sign(farStop(cart) - cart.x) || 1;
    Object.assign(a, { aimed: '', ox: cart.x, oy: cart.y, dx: dir, dy: 0, cx: cart.x, cy: cart.y, range: Math.abs(farStop(cart) - cart.x), radius: H.cart.width / 2, hit: [] });
    e.fx = dir;
    e.fy = 0;
    haulState(theBook()!).shove = cart.id;
  }
  if (k > 1) {
    const floor = spec.unblockable ? Math.max(E.striped, ((spec.radius ?? H.cart.width / 2) + HERO.radius) / SLOWEST / 0.6) : E.red;
    a.windup = Math.max(floor, a.windup / k);
    a.recover /= k;
  }
  Object.assign(a, { boss: move, tell: BOSS.tell, windup: +(a.windup + BOSS.tell).toFixed(3) });
  b.move = move;
  return true;
}

export function stepHaulier(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[], notice: () => boolean): void {
  const b = e.boss!, bk = theBook();
  if (e.alert === false && !notice()) return;
  e.alert = true;
  const t = bossTarget(e, heroes, now);
  if (!t) return;
  // Roaring (a phase change): it faces you, and nothing lands either way. Staggered or down: it does nothing.
  if (b.roarUntil > now) return void turnTo(e, t.x - e.x, t.y - e.y, 6, dt);
  if (b.stagUntil > now || b.downUntil > now) return;
  const k = b.phase === 2 ? H.faster : 1, props = bk ? haulState(bk).props : [];
  const rot = haulRotation(b.phase, b.party, bk?.swaps[b.phase - 1] ?? 0), next = rot[b.rot % rot.length];
  // A move it can't get to in time is passed over (a hero keeping off can't stall it for ever).
  if (e.cooldown <= 0 && now - b.rotAt > SKIP) return void advance(b, now, 0);
  // The shove is made at a cart standing at a stop: it goes to the nearest, else passes it over.
  const cart = next === 'shove' ? nearestCart(props, e.x, e.y) : undefined;
  if (next === 'shove' && !cart) return void advance(b, now, 0);
  const who = cart ?? t, ux = who.x - e.x, uy = who.y - e.y, d = Math.hypot(ux, uy) || 1;
  const facing = turnTo(e, ux, uy, TURN * k, dt);
  if (e.cooldown > 0) return void (d > H.pick.range! * 0.8 && toward(e, who, facing, k, dt));
  const s = SPEC[next];
  const ok = next === 'pick' ? d <= s.range! + 0.1 && facing > 0.8 : next === 'overhead' ? d <= s.ahead! + s.radius! - 0.3 && facing > 0.8 : next === 'drag' ? d <= s.radius! - 0.3 : d <= H.shoveReach;
  if (ok && haulBegin(e, next, t, ev, cart)) return void advance(b, now, e.attack!.windup + e.attack!.active + e.attack!.recover);
  if (d > (next === 'shove' ? H.shoveReach - 0.4 : next === 'drag' ? s.radius! - 0.6 : H.walk.close)) toward(e, who, facing, k, dt);
}

/** On to the next in its rotation (the clock for it starts once this blow is done). */
function advance(b: BossOn, now: number, busy: number): void {
  b.rot++;
  b.rotAt = now + busy;
}

/** Walk at `h` round what's in the way, at the pace it faces. */
function toward(e: Enemy, h: { x: number; y: number }, facing: number, k: number, dt: number): void {
  const g = wayTo(e, h.x, h.y);
  walk(e, g.x - e.x, g.y - e.y, H.walk.pace * k * Math.max(0.3, facing), dt);
}
