/**
 * Hempen in the boss format (docs/plans/bosses.md "Hempen, brought into the format"; numbers
 * shared/hangtune.ts HEMPEN_BOSS, the kit's shared/bosstune.ts). stepEnemy hands a boss over to
 * sim/doorkeepers.ts, which hands Hempen here once its blow (if any) has run. Its turn, in order:
 * - a hero hoisted (its noose, or a snare) within its rope's reach: the HAUL, a red lane down the rope;
 * - every HEMPEN.every s, the NOOSE at whoever's furthest from a friend: a thin red lane;
 * - else the next of its rotation: the butcher's CLEAVE (red) and SLAM (striped), and in phase 2 ROPE
 *   RAIN, a striped circle dropped where its hero stands.
 * Every blow has the kit's pose first (BOSS.tell), and the lanes and the cleave turn with their hero until
 * BOSS.aimLock of the wind-up. A rope ends at the first thing in its lane: one of the four trunks, or a
 * friend standing in front (who takes it on a block, or dodges it). It fights on its own ground (or after
 * whoever hurt it lately), and goes back to it. The room's once-a-tick part is sim/hempenbook.ts.
 */
import { BOSS, HEMPEN, HEMPEN_BOSS as H, HERO, type EnemyAttackSpec, type HempenMove } from '../shared/tuning';
import { currentMap } from '../shared/arena';
import { travelTo } from '../shared/sweep';
import { begin, walk } from './enemies';
import { inArc } from './combat';
import { bossStun } from './poise';
import { bossTarget, theBook, turnTo, type BossOn } from './bosskit';
import { hoist } from './snares';
import { wayTo } from './pathing';
import type { AttackKind, Enemy, EnemyAttack, FightEvent, Hero } from './types';

const KIND: Record<HempenMove, AttackKind> = { noose: 'hook', haul: 'hook', cleave: 'cleave', slam: 'slam', rain: 'slam' };
const SPEC: Record<HempenMove, EnemyAttackSpec> = { noose: H.noose, haul: H.haul, cleave: H.cleave, slam: H.slam, rain: H.rain };
/** What a rope can't pass: the trunks (bushes it goes through). */
const TRUNKS = new Set(['tree', 'pine', 'deadtree', 'hangtree']);
const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';
const far = (e: Enemy, h: Hero) => Math.hypot(h.x - e.x, h.y - e.y);
/** On an upright phone's screen with it (no further across than HEMPEN_BOSS.across). */
const onScreen = (e: Enemy, h: Hero) => Math.abs(h.x - e.x) <= H.across;
const rope = (m: string | undefined) => m === 'noose' || m === 'haul';

/** The rotation for a phase: the plan's, one seeded swap, and one more for a party of four. */
export function hempenRotation(phase: 1 | 2, party: number, swap: number): HempenMove[] {
  const r = [...H.rotation[phase]];
  const i = ((swap % r.length) + r.length) % r.length, j = (i + 1) % r.length;
  [r[i], r[j]] = [r[j], r[i]];
  if (party >= 4) r.push(H.more);
  return r;
}

/** The heroes it fights: on its ground, or whoever hurt it lately, to HEMPEN_BOSS.chase. */
export function inPlay(e: Enemy, heroes: Hero[], now: number): Hero[] {
  const hurt = new Set((theBook()?.hurt ?? []).filter((x) => x[0] === e.id && now - x[2] <= BOSS.aggro).map((x) => x[1]));
  const off = (h: Hero) => Math.hypot(h.x - e.home.x, h.y - e.home.y);
  return heroes.filter((h) => up(h) && (h.z ?? 0) === (e.z ?? 0) && (off(h) <= H.ground || (hurt.has(h.id) && off(h) <= H.chase)));
}

/**
 * How far a rope goes down its lane from (a.ox, a.oy): its reach (the haul's, to its hero), cut at the
 * first trunk across it, and at the first hero standing in it short of the one it's for.
 */
export function ropeReach(a: Pick<EnemyAttack, 'ox' | 'oy' | 'dx' | 'dy' | 'arc' | 'aimed'> & { boss?: string }, heroes: Hero[], most: number): number {
  let r = most;
  for (const o of currentMap().rounds) {
    if (!TRUNKS.has(o.kind) || Math.abs(o.x - a.ox) > r + 1 || Math.abs(o.y - a.oy) > r + 1) continue;
    const px = o.x - a.ox, py = o.y - a.oy, along = px * a.dx + py * a.dy;
    if (along > 0 && along - o.r < r && Math.abs(px * a.dy - py * a.dx) < o.r) r = Math.max(0.3, along - o.r);
  }
  for (const h of heroes) {
    if (h.id === a.aimed || !up(h) || (h.z ?? 0) !== 0) continue;
    const d = Math.hypot(h.x - a.ox, h.y - a.oy);
    if (d > 0.4 && d < r && inArc(a.ox, a.oy, a.dx, a.dy, h.x, h.y, r, a.arc, HERO.radius)) r = d;
  }
  return +r.toFixed(2);
}

/** Begin one of its moves at `t`: the pose first, its floor after. The rain falls where `t` stands. */
export function hempenBegin(e: Enemy, move: HempenMove, t: Hero, heroes: Hero[], now: number, ev: FightEvent[]): boolean {
  begin(e, KIND[move], SPEC[move], t, ev);
  const a = e.attack;
  if (!a) return false;
  Object.assign(a, { boss: move, tell: BOSS.tell, windup: +(a.windup + BOSS.tell).toFixed(3) });
  if (move === 'rain') (a.cx = t.x), (a.cy = t.y);
  if (rope(move)) a.range = ropeReach(a, heroes, move === 'haul' ? Math.min(H.haul.range!, far(e, t) + 0.2) : H.noose.range!);
  // A party of two or more: a rope out of the branches on a second hero a moment after (sim/hempenbook.ts).
  const bk = theBook();
  if (bk && (e.boss?.party ?? 1) >= 2) bk.split = { at: now + H.split, not: t.id };
  return true;
}

/** A haul whose hero was cut down (or dropped) before it landed: the rope comes back empty, and it stands open. */
export function haulLost(e: Enemy, heroes: Hero[], ev: FightEvent[]): void {
  const a = e.attack;
  if (a?.boss !== 'haul' || a.t >= a.windup || heroes.find((x) => x.id === a.aimed)?.hoisted) return;
  bossStun(e, H.lost);
  ev.push({ k: 'stunned', x: e.x, y: e.y });
}

/** In the wind-up (sim/bosskit.ts trackAim hands Hempen here): its aim, and where its rope ends. */
export function hempenAim(e: Enemy, heroes: Hero[]): void {
  const a = e.attack;
  if (!a?.boss || a.t >= a.windup) return;
  const h = heroes.find((x) => x.id === a.aimed);
  if (h && up(h) && a.t < a.windup * BOSS.aimLock && (rope(a.boss) || a.boss === 'cleave')) {
    const dx = h.x - a.ox, dy = h.y - a.oy, l = Math.hypot(dx, dy);
    if (l > 0.05) (a.dx = e.fx = dx / l), (a.dy = e.fy = dy / l);
  }
  // Where the rope ends, till it lands: a trunk in its lane, or a friend who steps in front.
  if (rope(a.boss)) a.range = ropeReach(a, heroes, a.boss === 'haul' && h ? Math.min(H.haul.range!, Math.hypot(h.x - a.ox, h.y - a.oy) + 0.2) : H.noose.range!);
}

/** Its rope landed on `h` (sim/ownfoes.ts landed): the noose hoists them; the haul drags them to its feet. */
export function noosed(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[]): void {
  if (a.boss !== 'haul') return hoist(h, now, ev);
  const l = Math.hypot(e.x - h.x, e.y - h.y) || 1;
  travelTo(h, e.x - ((e.x - h.x) / l) * H.pull.to, e.y - ((e.y - h.y) / l) * H.pull.to, HERO.radius);
  Object.assign(h, { hoisted: undefined, netUntil: undefined, netAng: undefined, act: 'stun', actT: 0, actDur: H.pull.stun, kvx: 0, kvy: 0 });
}

/** The noose's hero: in reach, in sight past the trunks, the one furthest from a friend. */
function nooseFor(e: Enemy, live: Hero[]): Hero | null {
  const fits = live.filter((h) => !h.hoisted && far(e, h) >= HEMPEN.min && far(e, h) <= H.noose.range! && onScreen(e, h) && clearTo(e, h, live));
  if (!fits.length) return null;
  const alone = (h: Hero) => Math.min(99, ...live.filter((o) => o !== h).map((o) => Math.hypot(o.x - h.x, o.y - h.y)));
  return fits.reduce((p, q) => (alone(q) > alone(p) ? q : p));
}

/** Nothing (a trunk) between it and `h` that would take its rope. */
const clearTo = (e: Enemy, h: Hero, live: Hero[]) => {
  const d = far(e, h) || 1, a = { ox: e.x, oy: e.y, dx: (h.x - e.x) / d, dy: (h.y - e.y) / d, arc: H.noose.arc!, aimed: h.id };
  return ropeReach(a, live.filter((o) => o === h), d + 0.2) >= d - 0.3;
};

/** Its turn (`notice`: the room's look about, while it hasn't seen you). */
export function stepHempen(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[], notice: () => boolean): void {
  const b = e.boss!;
  if (e.alert === false && !notice()) return;
  e.alert = true;
  const live = inPlay(e, heroes, now), t = bossTarget(e, live, now);
  // Roaring (a phase change): it faces you, and nothing lands either way.
  if (b.roarUntil > now) return void (t && turnTo(e, t.x - e.x, t.y - e.y, 9, dt));
  if (!t) return goHome(e, dt);
  // Whom it turns to this tick: a hoisted hero to haul, the noose's hero when it's time, else its own.
  const hung = live.find((h) => h.hoisted && far(e, h) >= 1 && far(e, h) <= H.haul.range! && onScreen(e, h) && clearTo(e, h, live));
  const noose = !hung && now - (e.snareAt ?? -99) >= HEMPEN.every ? nooseFor(e, live) : null;
  const who = hung ?? noose ?? t, d = far(e, who) || 1, ux = (who.x - e.x) / d, uy = (who.y - e.y) / d;
  const facing = turnTo(e, ux, uy, H.turn, dt);
  if (e.cooldown > 0) return void (d > H.cleave.range! * 0.8 && toward(e, who, facing, dt));
  if (hung) return void (facing > 0.85 && hempenBegin(e, 'haul', hung, heroes, now, ev));
  if (noose) {
    if (facing > 0.85 && hempenBegin(e, 'noose', noose, heroes, now, ev)) (e.snareAt = now), ev.push({ k: 'noosed', x: e.x, y: e.y });
    return;
  }
  const rot = hempenRotation(b.phase, b.party, theBook()?.swaps[b.phase - 1] ?? 0), next = rot[b.rot % rot.length];
  // A move it can't get to in time is passed over (a hero keeping off can't stall it for ever).
  if (now - b.rotAt > H.skip) return void advance(b, now, 0);
  const s = SPEC[next];
  const ok = next === 'cleave' ? d <= s.range! + 0.1 && facing > 0.8 : next === 'slam' ? d <= s.ahead! + s.radius! - 0.3 && facing > 0.8 : d <= s.range! && onScreen(e, t) && facing > 0.6;
  if (ok && hempenBegin(e, next, t, heroes, now, ev)) return void advance(b, now, e.attack!.windup + e.attack!.active + e.attack!.recover);
  if (d > (next === 'rain' ? s.range! - 1 : H.cleave.range! * 0.8)) toward(e, t, facing, dt);
}

/** On to the next in its rotation (the clock for it starts once this blow is done). */
function advance(b: BossOn, now: number, busy: number): void {
  b.rot++;
  b.rotAt = now + busy;
}

/** Walk at `h` round what's in the way, at the pace it faces. */
function toward(e: Enemy, h: { x: number; y: number }, facing: number, dt: number): void {
  const g = wayTo(e, h.x, h.y);
  walk(e, g.x - e.x, g.y - e.y, H.walk * Math.max(0.2, facing), dt);
}

/** Nobody on its ground: back to where it stands. */
function goHome(e: Enemy, dt: number): void {
  const dx = e.home.x - e.x, dy = e.home.y - e.y, l = Math.hypot(dx, dy);
  if (l < 0.6) return;
  toward(e, e.home, turnTo(e, dx / l, dy / l, H.turn, dt), dt);
}
