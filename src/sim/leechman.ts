/**
 * THE LEECHMAN's turn (docs/design/deep-layer-bosses.md section 2; numbers shared/leechtune.ts). stepEnemy hands a
 * boss over to sim/doorkeepers.ts, which hands THE LEECHMAN here once its blow (if any) has run. It wakes when
 * it sees you (the room's look about) and works through its rotation (the plan's, one seeded swap, one more for a
 * party of four) at whoever it faces (sim/bosskit.ts bossTarget):
 * the LINE (a hook thrown down a thin red lane; caught, a hero is hauled to its feet and the PUNISH, a quick red
 * arc, follows at once), the LEECHES (a red circle where they land; caught, they drain until a roll), the WADE-IN
 * blow (it wades up to you first), and the PEAT bank (a striped lane, mud left along it: sim/leechbook.ts).
 * WADE: it is quick in shallow water (the reverse of a hero) and slow on dry ground, mud is nothing to it, and it
 * never goes into deep water (its way round is the path finder's: sim/pathing.ts, or a log it lays in phase 2: sim/leechlog.ts).
 * With the shallows drained (sim/leechwind.ts) it crawls and can't use THE LINE; it goes for the hero turning the windlass. Every blow has the kit's pose
 * first (BOSS.tell). Phase 2: LEECHMAN.faster its pace, turn, wind-ups and rests, never under the Doorkeepers'
 * floors. Staggered, it does nothing. `boss.cmove` says which blow is under way.
 */
import { BOSS, DOORKEEPERS, HERO, LEECHMAN as L, WEAPONS, type EnemyAttackSpec } from '../shared/tuning';
import { currentMap, inShallows, wadeAt } from '../shared/arena';
import { begin, walk } from './enemies';
import { bossTarget, turnTo, theBook, type BossOn } from './bosskit';
import { leechAim, leechState } from './leechhook';
import { wayTo } from './pathing';
import { crossing, logState, mayLay } from './leechlog';
import { turner } from './leechwind';
import type { AttackKind, Enemy, FightEvent, Hero } from './types';
import type { LeechMove } from '../shared/leechtune';

const KIND: Record<LeechMove, AttackKind> = { line: 'hook', leeches: 'slam', wade: 'cleave', peat: 'cleave', punish: 'cleave' };
const SPEC: Record<LeechMove, EnemyAttackSpec> = { line: L.line, leeches: L.leeches, wade: L.wade, peat: L.peat, punish: L.punish };
const TURN = 3.5;
/** The slowest kit's pace (a striped floor is walked out of from its middle in 60% of it at this: as bosskit.ts). */
const SLOWEST = Math.min(...Object.values(WEAPONS).map((w) => HERO.speed * (w.speed ?? 1)));
const E = DOORKEEPERS.enrage.floor;
const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

/** Its pace where it stands, as it actually moves: quick in the shallows, slow on dry peat (mud is nothing to it). */
export const leechPace = (x: number, y: number) => (currentMap().drained ? L.windlass.crawl : inShallows(x, y) ? L.walk.water : L.walk.dry);

/** The rotation for a phase: the plan's, one seeded swap of two different neighbours, one more for a party of four. */
export function leechRotation(phase: 1 | 2, party: number, swap: number): LeechMove[] {
  const r = [...L.rotation[phase]], n = r.length, i0 = ((swap % n) + n) % n;
  for (let k = 0; k < n; k++) {
    const i = (i0 + k) % n, j = (i + 1) % n;
    if (r[i] === r[j]) continue;
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

/** Begin one of its blows at `t`: the pose first, its floor after. The leeches land where `t` stands now; the line's lane ends at the first friend in it. */
export function leechBegin(e: Enemy, move: LeechMove, t: Hero, ev: FightEvent[], heroes: Hero[] = [t]): boolean {
  const spec = SPEC[move], b = e.boss!, k = b.phase === 2 ? L.faster : 1;
  begin(e, KIND[move], spec, t, ev);
  const a = e.attack;
  if (!a) return false;
  if (move === 'leeches') Object.assign(a, { aimed: '', cx: t.x, cy: t.y });
  if (move === 'punish') quickPunish(a, k);
  else quicken(a, spec, k);
  Object.assign(a, { boss: move, tell: BOSS.tell, windup: +(a.windup + BOSS.tell).toFixed(3) });
  if (move === 'line') leechAim(e, heroes);
  b.cmove = move;
  if (move === 'leeches') ev.push({ k: 'leech', what: 'throw', x: e.x, y: e.y });
  return true;
}

/** The punish is already quick: only phase 2 shortens it, to the red floor. */
function quickPunish(a: NonNullable<Enemy['attack']>, k: number): void {
  if (k > 1) (a.windup = Math.max(E.red, a.windup / k)), (a.recover /= k);
}

export function stepLeechman(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[], notice: () => boolean): void {
  const b = e.boss!, bk = theBook();
  if (!bk) return;
  if (e.alert === false && !notice()) return;
  e.alert = true;
  const live = heroes.filter(up), t = turner(bk, live) ?? bossTarget(e, live, now);
  if (!t) return;
  // Roaring (a phase change): it faces its hero, and nothing lands either way. Staggered or down: it does nothing.
  if (b.roarUntil > now) return void turnTo(e, t.x - e.x, t.y - e.y, 6, dt);
  if (b.stagUntil > now || b.downUntil > now) return;
  const k = b.phase === 2 ? L.faster : 1, st = leechState(bk);
  // A hero it has just hauled in: the punish is theirs, straight away.
  const hauled = st.punish && st.punish.until > now ? live.find((h) => h.id === st.punish!.id) : undefined;
  if (!hauled) st.punish = null;
  const who = hauled ?? t, d = Math.hypot(who.x - e.x, who.y - e.y) || 1, ux = (who.x - e.x) / d, uy = (who.y - e.y) / d;
  const facing = turnTo(e, ux, uy, TURN * k * (hauled ? 2 : 1), dt);
  if (e.cooldown > 0) return void (d > L.walk.close && toward(e, who, facing, k, dt));
  if (hauled) {
    if (facing > 0.8 && d <= L.punish.range! && leechBegin(e, 'punish', hauled, ev, heroes)) st.punish = null;
    else if (d > L.punish.range! * 0.7) toward(e, hauled, facing, k, dt);
    return;
  }
  const rot = leechRotation(b.phase, b.party, bk.swaps[b.phase - 1] ?? 0), next = rot[b.rot % rot.length], s = SPEC[next];
  // A move it can't get to in time is passed over (a hero keeping off can't stall it for ever).
  if (now - b.rotAt > L.skip) return void advance(b, now, 0);
  // THE LINE is not used while the shallows are drained.
  if (next === 'line' && currentMap().drained) return void advance(b, now, 0);
  const near = next === 'wade' || next === 'peat' ? (next === 'wade' ? s.range! - 0.2 : s.range! - 1.5) : next === 'leeches' ? L.leech.range : L.line.range! - 0.5;
  const ok = d <= near && (next !== 'line' || d >= L.lineMin) && facing > (next === 'leeches' ? 0.6 : 0.85);
  if (ok && leechBegin(e, next, t, ev, heroes)) return void advance(b, now, e.attack!.windup + e.attack!.active + e.attack!.recover);
  // Phase 2: a hero across a deep channel and no log down: it walks to the channel's near end and lays one.
  const lg = logState(bk), go = b.flood && mayLay(bk, now) ? crossing(e, who) : null;
  if (go && go.near <= L.log.reach) return void (lg.want = go);
  // Too close for the line: it backs off a step rather than waiting; otherwise it wades in.
  if (next === 'line' && d < L.lineMin) return void walkAway(e, ux, uy, k, dt);
  if (d > near * 0.9 || go) toward(e, go ? go.spot : t, facing, k, dt);
}

/** On to the next in its rotation (the clock for it starts once this blow is done). */
function advance(b: BossOn, now: number, busy: number): void {
  b.rot++;
  b.rotAt = now + busy;
}

/** Walk at `h` round what's in the way, at the pace the ground gives it (walk() applies the ground's own slowing, so this undoes it). */
function toward(e: Enemy, h: { x: number; y: number }, facing: number, k: number, dt: number): void {
  const g = wayTo(e, h.x, h.y);
  walk(e, g.x - e.x, g.y - e.y, (leechPace(e.x, e.y) * k * Math.max(0.3, facing)) / wadeAt(e.x, e.y), dt);
}

function walkAway(e: Enemy, ux: number, uy: number, k: number, dt: number): void {
  walk(e, -ux, -uy, (leechPace(e.x, e.y) * k * 0.7) / wadeAt(e.x, e.y), dt);
}
