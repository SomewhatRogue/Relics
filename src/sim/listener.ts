/**
 * THE LISTENER's turn (docs/design/deep-layer-bosses.md section 1; numbers shared/listentune.ts). stepEnemy
 * hands a boss over to sim/doorkeepers.ts, which hands THE LISTENER here once its blow (if any) has run. It
 * wakes at a sound, walks to the loudest hero (sim/listennoise.ts; never by sight), and works through its
 * rotation (the plan's, one seeded swap that leaves the drops and sweeps alone, one more for a party of four):
 * the ROCK (a red circle where the lump lands), the DROP (it walks to the nearest hole and drops in; sim/listenbook.ts
 * takes it from there: gone, then the RISE, a striped circle at the hole nearest the loudest hero, then the
 * SWEEP, a quick red arc straight after), and the CHARGE (a striped lane across the room). Every blow has the
 * kit's pose first (BOSS.tell). Phase 2 (sim/listenbook.ts): LISTENER.faster its pace, turn, wind-ups and rests,
 * never under the Doorkeepers' floors. Staggered, it does nothing. `boss.lmove` says which blow is under way.
 */
import { BOSS, DOORKEEPERS, HERO, LISTENER as L, WEAPONS, type EnemyAttackSpec } from '../shared/tuning';
import { currentMap } from '../shared/arena';
import { begin, walk } from './enemies';
import { turnTo, theBook, type BossOn } from './bosskit';
import { hearable, listenState, loudest, nearestHole } from './listennoise';
import { wayTo } from './pathing';
import type { AttackKind, Enemy, FightEvent, Hero } from './types';
import type { ListenMove } from '../shared/listentune';

const KIND: Record<ListenMove, AttackKind> = { rock: 'slam', drop: 'slam', rise: 'slam', sweep: 'cleave', charge: 'charge' };
const SPEC: Record<ListenMove, EnemyAttackSpec> = { rock: L.rock, drop: L.drop, rise: L.rise, sweep: L.sweep, charge: L.charge };
/** Local numbers: how fast it turns, and how long it tries one blow before passing it over. */
const TURN = 3.5, SKIP = 6;
/** The slowest kit's pace (a striped floor is walked out of from its middle in 60% of it at this: as bosskit.ts). */
const SLOWEST = Math.min(...Object.values(WEAPONS).map((w) => HERO.speed * (w.speed ?? 1)));
const E = DOORKEEPERS.enrage.floor;
const KEEP: ListenMove[] = ['drop', 'sweep'];

/** The rotation for a phase: the plan's, one seeded swap (never of a drop or a sweep: the sweep follows the rise), one more rock for a party of four. */
export function listenRotation(phase: 1 | 2, party: number, swap: number): ListenMove[] {
  const r = [...L.rotation[phase]], n = r.length, i0 = ((swap % n) + n) % n;
  for (let k = 0; k < n; k++) {
    const i = (i0 + k) % n, j = (i + 1) % n;
    if (KEEP.includes(r[i]) || KEEP.includes(r[j]) || r[i] === r[j]) continue;
    [r[i], r[j]] = [r[j], r[i]];
    break;
  }
  if (party >= 4) r.push(L.more);
  return r;
}

/** Quicker in phase 2: a shorter wind-up (never under the floors) and rest. */
function quicken(a: NonNullable<Enemy['attack']>, spec: EnemyAttackSpec, k: number): void {
  if (k <= 1) return;
  const floor = spec.unblockable ? Math.max(E.striped, ((spec.radius ?? 1) + HERO.radius) / SLOWEST / 0.6) : E.red;
  a.windup = Math.min(a.windup, Math.max(floor, a.windup / k));
  a.recover /= k;
}

/**
 * Begin one of its blows at `t` (the loudest hero): the pose first, its floor after. The rock lands where `t`
 * stands now; the drop is a pose with no blow, taken under by the book; the rise (begun by the book) is centred on `at`.
 */
export function listenBegin(e: Enemy, move: ListenMove, t: Hero, ev: FightEvent[], heroes: Hero[] = [t], at?: { x: number; y: number }): boolean {
  const spec = SPEC[move], b = e.boss!, k = b.phase === 2 ? L.faster : 1;
  begin(e, KIND[move], spec, t, ev);
  const a = e.attack;
  if (!a) return false;
  if (move === 'rock') Object.assign(a, { aimed: '', cx: t.x, cy: t.y });
  if (move === 'drop') Object.assign(a, { aimed: '', cx: e.x, cy: e.y, radius: 0, hit: heroes.map((h) => h.id) });
  if (move === 'rise') Object.assign(a, { aimed: '', cx: at?.x ?? e.x, cy: at?.y ?? e.y });
  quicken(a, spec, k);
  Object.assign(a, { boss: move, tell: BOSS.tell, windup: +(a.windup + BOSS.tell).toFixed(3) });
  b.lmove = move;
  return true;
}

export function stepListener(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[]): void {
  const b = e.boss!, bk = theBook();
  if (!bk) return;
  const st = listenState(bk), N = L.noise;
  // Asleep till it hears something: a sound made within earshot, or anyone right under its nose. Never by sight.
  if (e.alert === false) {
    const heard = heroes.some((h) => hearable(h) && ((st.noise.get(h.id) ?? 0) >= N.wake && Math.hypot(h.x - e.x, h.y - e.y) <= N.hear || Math.hypot(h.x - e.x, h.y - e.y) <= N.near));
    if (!heard) return;
  }
  e.alert = true;
  const t = loudest(heroes, st.noise, e);
  if (!t) return;
  // Roaring (a phase change): it faces the loudest, and nothing lands either way. Staggered or down: it does nothing.
  if (b.roarUntil > now) return void turnTo(e, t.x - e.x, t.y - e.y, 6, dt);
  if (b.stagUntil > now || b.downUntil > now) return;
  const k = b.phase === 2 ? L.faster : 1;
  const rot = listenRotation(b.phase, b.party, bk.swaps[b.phase - 1] ?? 0), next = rot[b.rot % rot.length];
  // A move it can't get to in time is passed over (a hero keeping off can't stall it for ever).
  if (e.cooldown <= 0 && now - b.rotAt > SKIP) return void advance(b, now, 0);
  const holes = currentMap().holes ?? [];
  const hole = next === 'drop' ? nearestHole(holes, e) : null;
  if (next === 'drop' && !hole) return void advance(b, now, 0);
  const who = hole ?? t, ux = who.x - e.x, uy = who.y - e.y, d = Math.hypot(ux, uy) || 1;
  const facing = turnTo(e, ux, uy, TURN * k, dt);
  if (e.cooldown > 0) return void (d > L.walk.close && toward(e, who, facing, k, dt));
  const s = SPEC[next];
  if (next === 'sweep' && b.lmove !== 'rise' && d > s.range! + 0.5) return void advance(b, now, 0);
  const ok = next === 'drop' ? d <= L.reach : next === 'sweep' ? true : facing > 0.6;
  if (ok && listenBegin(e, next, t, ev, heroes)) return void advance(b, now, e.attack!.windup + e.attack!.active + e.attack!.recover);
  if (d > (next === 'drop' ? L.reach * 0.6 : L.walk.close)) toward(e, who, facing, k, dt);
}

/** On to the next in its rotation (the clock for it starts once this blow is done). */
function advance(b: BossOn, now: number, busy: number): void {
  b.rot++;
  b.rotAt = now + busy;
}

/** Walk at `h` round what's in the way, at the pace it faces. */
function toward(e: Enemy, h: { x: number; y: number }, facing: number, k: number, dt: number): void {
  const g = wayTo(e, h.x, h.y);
  walk(e, g.x - e.x, g.y - e.y, L.walk.pace * k * Math.max(0.3, facing), dt);
}
