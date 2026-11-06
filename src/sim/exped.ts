/**
 * An expedition's rules (Kyle, 2026-11-04, "similar to Helldivers"), run by the room every tick (the
 * room decides everything): the pinned jobs and whether each is done, the side jobs, the way out (shut
 * until the jobs are done, then lit by standing at the beacon, then held until the watch comes, then
 * walked out of together), and what's been seen of the map. The pressure (waves, horns, patrols, the
 * level going up) is sim/expedpressure.ts. Plain data on the room (`room.exped`), so a saved or
 * handed-on room carries it, and a friend's screen draws its view (expedView).
 */
import type { GoalKind, SideKind } from '../shared/expedcamps';
import type { ExpedPlan } from '../shared/expedmap';
import type { P } from '../shared/expedkit';
import { EXPED, WINCH } from '../shared/tuning';
import { newWood, stepWood, type WoodState } from './woodzone';
import { newProp } from './props';
import { themeUnder, type ExpedSky } from '../shared/expedsky';
import { holding, ringOf } from '../shared/expedrings';
import { isDead } from './damage';
import { stepPressure } from './expedpressure';
import { jettyOf } from './staithe';
import type { ArenaRoom } from './room';
import type { Enemy, FightEvent, Hero } from './types';

export type Phase = 'shut' | 'open' | 'hold' | 'leave';
/** `away`: a hold ring's seconds with nobody in it (shared/expedrings.ts). */
export interface XGoal { kind: GoalKind | SideKind; x: number; y: number; done: boolean; p: number; blocks?: number[]; cages?: P[]; foe?: number; chest?: number; away?: number }
export interface XCamp { x: number; y: number; ids: number[]; alerted: boolean; known: boolean }
export interface ExpedState {
  goals: XGoal[]; sides: XGoal[]; camps: XCamp[];
  zone: P & { r: number; away?: number }; phase: Phase; lit: number; held: number;
  /** Pressure: the level, the noise's heat and where it is, when the next wave, patrol and hold-wave may come. */
  level: number; heat: number; hx: number; hy: number; nextWave: number; nextPatrol: number; nextHold: number;
  /** Hold waves so far, and the one now due since (shared/threat.ts HOLD: it waits for room on screen, then comes anyway); old saves have none. */
  holds?: number; holdDue?: number;
  patrols: { ids: number[]; path: P[]; i: number; dir: number }[];
  /** Ground seen, a bit a cell (EXPED.cell), as hex; and a counter for the room's own rolls. */
  seen: string; n: number; seed: number; party: number;
  /** The weather and its one turn (shared/expedsky.ts); the room's theme follows it. */
  wx?: ExpedSky;
  /** Hangman's Wood (sim/woodzone.ts): its mid-point's fire and the beats said so far. */
  wood?: WoodState;
}
export type ExpedWhat = 'goal' | 'side' | 'open' | 'lit' | 'watch' | 'horn' | 'worse' | 'wave' | 'blessed' | 'weather' | 'staithelost' | 'beat' | 'check';

const W = 16, H = 12;
const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

/** A fresh expedition on a room built from `plan` (foe index i is goblin id i + 1). */
export function newExped(plan: ExpedPlan, seed: number, party: number): ExpedState {
  const g = (s: ExpedPlan['goals'][number]): XGoal => ({ kind: s.kind, x: s.x, y: s.y, done: false, p: 0, blocks: s.blocks, cages: s.cages, foe: s.foe === undefined ? undefined : s.foe + 1, chest: s.chest });
  return {
    goals: plan.goals.map(g), sides: plan.sides.map(g), camps: plan.camps.map((c) => ({ x: c.x, y: c.y, ids: c.foes.map((i) => i + 1), alerted: false, known: false })),
    zone: { ...plan.zone, r: ringOf('beacon') }, phase: 'shut', lit: 0, held: 0,
    level: 0, heat: 0, hx: plan.map.hero.x, hy: plan.map.hero.y, nextWave: 60, nextPatrol: EXPED.patrolEvery, nextHold: 0,
    patrols: plan.patrols.map((p) => ({ ids: p.foes.map((i) => i + 1), path: p.path, i: 1, dir: 1 })),
    seen: '0'.repeat((W * H) / 4), n: 0, seed, party,
    ...(plan.map.hang ? { wood: newWood(plan) } : {}),
  };
}

/** Every goblin (the dozers too, mid-tick on a big map). */
export const everyone = (room: ArenaRoom): Enemy[] => room.allEnemies;

/** One tick of the expedition's rules. */
export function stepExped(room: ArenaRoom, ev: FightEvent[], dt: number): void {
  const x = room.exped!, heroes = room.heroes.filter(up), t = room.time;
  if (room.tick % 10 === 0) look(x, heroes);
  for (const g of x.goals) if (!g.done && check(room, g, heroes, dt)) done(room, g, false, ev);
  for (const g of x.sides) if (!g.done && check(room, g, heroes, dt)) done(room, g, true, ev);
  const at = (r: number) => heroes.some((h) => Math.hypot(h.x - x.zone.x, h.y - x.zone.y) <= r);
  // (Hangman's Wood has no beacon to hold: once Hempen's dead it's out by the north path.)
  if (x.phase === 'shut' && x.goals.every((g) => g.done)) (x.phase = room.map.hang ? 'leave' : 'open'), ev.push({ k: 'exped', x: x.zone.x, y: x.zone.y, what: 'open' });
  else if (x.phase === 'open' && at(x.zone.r)) {
    x.lit += dt;
    if (x.lit >= EXPED.call) (x.phase = 'hold'), (x.nextHold = t), ev.push({ k: 'exped', x: x.zone.x, y: x.zone.y, what: 'lit' });
  } else if (x.phase === 'hold' && holding(x.zone, at(x.zone.r), dt)) {
    // Held while someone's in the ring, and a moment after they step out to roll or kite (EXPED.grace).
    x.held += dt;
    if (x.held >= EXPED.extract) (x.phase = 'leave'), ev.push({ k: 'exped', x: x.zone.x, y: x.zone.y, what: 'watch' });
  }
  stepPressure(room, x, heroes, ev, dt);
  if (x.wood) stepWood(room, x, heroes, ev, dt);
  // The weather turns once, if it's going to: said to everyone (client/expedui.ts). The theme always
  // follows it (a room handed to a new leader too).
  if (!x.wx) return;
  room.map.theme = themeUnder(room.map.theme, x.wx, t);
  if (x.wx.to && !x.wx.done && t >= (x.wx.at ?? Infinity)) {
    x.wx.done = true;
    const h = heroes[0] ?? room.heroes[0];
    ev.push({ k: 'exped', x: h?.x ?? x.zone.x, y: h?.y ?? x.zone.y, what: 'weather' });
  }
}

/** Is job `g` done (stepping its progress if it's one you stand at)? */
function check(room: ArenaRoom, g: XGoal, heroes: Hero[], dt: number): boolean {
  const near = (r: number) => heroes.some((h) => Math.hypot(h.x - g.x, h.y - g.y) <= r);
  // The gibbet's winch: a hold (its grace, its waves) that winds the cage down as it goes (shared/hangtune.ts WINCH).
  if (g.kind === 'winch') {
    if (holding(g, near(ringOf('winch')), dt)) g.p = Math.min(1, g.p + dt / WINCH.hold);
    return g.p >= 1;
  }
  if (g.kind === 'larder' || g.kind === 'pray' || g.kind === 'shrine') {
    const s = g.kind === 'shrine' ? EXPED.hold : g.kind === 'pray' ? EXPED.pray : EXPED.poison, inside = near(ringOf(g.kind));
    // The shrine is a hold: a moment's grace after the last one steps out. The small rings count only while you stand there.
    if (g.kind === 'shrine' ? holding(g, inside, dt) : inside) g.p = Math.min(1, g.p + dt / s);
    return g.p >= 1;
  }
  if (g.kind === 'engine' || g.kind === 'dens') return (g.blocks ?? []).every((i) => room.map.blocks[i]?.ruined);
  if (g.kind === 'prisoners') return (g.cages ?? []).every((c) => !room.props.some((p) => p.kind === 'cage' && !p.broken && Math.hypot(p.x - c.x, p.y - c.y) < 0.6));
  // The Staithe: done with once the punt's made its last trip, or it's played out (sim/staithe.ts).
  if (g.kind === 'staithe') return !!jettyOf(room.map)?.over;
  if (g.kind === 'butcher' || g.kind === 'oak') {
    const b = everyone(room).find((e) => e.id === g.foe);
    return !b || isDead(b);
  }
  return g.chest === undefined || (room.chests[g.chest]?.state ?? 'open') !== 'shut';
}

function done(room: ArenaRoom, g: XGoal, side: boolean, ev: FightEvent[]): void {
  g.done = true;
  g.p = 1;
  const i = (side ? room.exped!.sides : room.exped!.goals).indexOf(g);
  // The Staithe played out with nobody got over: done with (the beacon can open), but nothing paid.
  const j = g.kind === 'staithe' ? jettyOf(room.map) : undefined;
  if (j && !j.saved) return void ev.push({ k: 'exped', x: g.x, y: g.y, what: 'staithelost', i });
  ev.push({ k: 'exped', x: g.x, y: g.y, what: side ? 'side' : 'goal', i });
  // The gibbet's cage down: on the ground under the arm, to break open like any cage.
  const cage = room.map.hang?.cage;
  if (g.kind === 'winch' && cage) room.props.push(newProp('cage', cage.x, cage.y + 0.3, false));
  // A wayside shrine prayed at: the whole party blessed a while.
  if (g.kind === 'pray') for (const h of room.heroes) (h.blessedUntil = room.time + EXPED.blessed), ev.push({ k: 'exped', x: h.x, y: h.y, what: 'blessed' });
}

/** Mark the ground round each hero seen (the map screen's explored ground). */
function look(x: ExpedState, heroes: Hero[]): void {
  const bits = x.seen.split('').map((c) => parseInt(c, 16)), s = EXPED.seen, c = EXPED.cell;
  for (const h of heroes) for (let j = Math.floor((h.y - s) / c); j <= Math.floor((h.y + s) / c); j++) for (let i = Math.floor((h.x - s) / c); i <= Math.floor((h.x + s) / c); i++) {
    if (i < 0 || j < 0 || i >= W || j >= H || Math.hypot((i + 0.5) * c - h.x, (j + 0.5) * c - h.y) > s + c / 2) continue;
    const b = j * W + i;
    bits[b >> 2] |= 1 << (b & 3);
  }
  x.seen = bits.map((v) => v.toString(16)).join('');
  for (const cp of x.camps) if (!cp.known && seenAt(x.seen, cp.x, cp.y)) cp.known = true;
}

/** Whether the cell at (x, y) has been seen. */
export function seenAt(seen: string, x: number, y: number): boolean {
  const i = Math.floor(x / EXPED.cell), j = Math.floor(y / EXPED.cell);
  if (i < 0 || j < 0 || i >= W || j >= H) return false;
  const b = j * W + i;
  return ((parseInt(seen[b >> 2], 16) >> (b & 3)) & 1) === 1;
}
export const SEEN = { w: W, h: H };

/** What a friend's screen needs of it (the map screen, the pins, the banner): no patrols or heat. */
export function expedView(x: ExpedState): Partial<ExpedState> {
  const r = (g: XGoal): XGoal => ({ kind: g.kind, x: Math.round(g.x * 10) / 10, y: Math.round(g.y * 10) / 10, done: g.done, p: Math.round(g.p * 20) / 20, foe: g.foe });
  const wood = x.wood && { check: { ...x.wood.check, p: Math.round(x.wood.check.p * 10) / 10 }, beats: x.wood.beats };
  return { goals: x.goals.map(r), sides: x.sides.map(r), camps: x.camps.map((c) => ({ ...c, x: Math.round(c.x), y: Math.round(c.y), ids: [] })), zone: { x: x.zone.x, y: x.zone.y, r: x.zone.r }, phase: x.phase, lit: Math.round(x.lit * 2) / 2, held: Math.floor(x.held), level: x.level, seen: x.seen, wx: x.wx, ...(wood ? { wood } : {}) };
}
