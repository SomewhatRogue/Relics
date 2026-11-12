/**
 * The boss kit (docs/plans/bosses.md section 1; numbers shared/bosstune.ts), shared by every boss:
 * - a boss's own state on the goblin (`Enemy.boss`, BossOn: POISE, its phase, its job, its door), sent
 *   only when one of those changes;
 * - the room's bookkeeping it never draws (`ArenaRoom.bosses`, BossBook: who hurt it and when, the pair's
 *   clocks), saved with the room, never sent; in use here while the room steps (as the late list is);
 * - a boss's blow begun: the pose (BOSS.tell) before its floor, marked as a boss's, its aim turning with
 *   its hero for the first BOSS.aimLock of the wind-up, then locked;
 * - one clock a hero: one boss wind-up aimed at a hero at a time, and the hungry near that hero hold their
 *   blows while it winds up;
 * - whom it faces: a taunt, a block held in its face, else whoever hurt it most in the last BOSS.aggro s.
 */
import { BOSS, DOORKEEPERS, HERO, POISE_KIT, WEAPONS, type DoorMove, type EnemyAttackSpec } from '../shared/tuning';
import { begin } from './enemies';
import { isDead } from './damage';
import { tauntTarget } from './taunt';
import { hempenAim } from './hempenboss';
import type { AttackKind, Enemy, FightEvent, Hero } from './types';

/** On a boss goblin (drawn: the plate, its door, the stagger). Room times; -9 for "not". */
export interface BossOn {
  /** The Doorkeepers' Latch or Hasp, or Hempen (sim/hempenboss.ts). */
  who: 'latch' | 'hasp' | 'hempen' | 'haulier';
  job: 'wall' | 'move';
  phase: 1 | 2;
  poise: number;
  poiseMax: number;
  stagUntil: number;
  roarUntil: number;
  /** Where it is in its rotation, and since when it's been trying that one. */
  rot: number;
  rotAt: number;
  /** Walking back to its partner, its back open, until; its front open after a lock until; its door down until. */
  backUntil: number;
  openUntil: number;
  downUntil: number;
  straps: number;
  /** Players in the room when it was made (the plan's scaling table). */
  party: number;
  /** The Haulier (sim/haulier.ts): the move under way (the screen poses on it: client/hauldraw.ts), and its plate gone for good (phase 2). */
  move?: import('../shared/haultune').HaulMove;
  bare?: boolean;
  /** The Haulier's crank: where its sparks will fall (sim/sparkshape.ts), cleared once they have. */
  sparks?: { x: number; y: number }[];
  /** Hempen's ropes coming down out of the branches (sim/hempenbook.ts): where, when they land, on whom. Sent as they come and go. */
  ropes?: Rope[];
}

/** A rope dropped on a hero's spot: a striped circle (HEMPEN_BOSS.rope), landing at `at`, aimed at `on`. */
export interface Rope { x: number; y: number; at: number; on: string }

/** The room's own notes on its bosses (never drawn, so never sent; saved with the room). */
export interface BossBook {
  /** [boss id, hero id, at, n]: blows that landed, kept BOSS.aggro seconds. */
  hurt: [number, string, number, number][];
  /** When the fight began (they noticed), -1 not yet; the next job swap; apart since (-1 together). */
  started: number;
  swapAt: number;
  apartAt: number;
  /** Locked Doors: the mover carrying its partner (-1 none), until; not again before. */
  lockBy: number;
  lockUntil: number;
  lockCool: number;
  /** A party of two: the wall's swing at a second hero, when, and the hero it isn't for. */
  split: { at: number; not: string } | null;
  /** The wall's next jab, not before (sim/doorkeepers.ts). */
  jabAt?: number;
  /** The seeded swap in each phase's rotation (the entry swapped with the next). */
  swaps: number[];
  /** The phase the pair is in (for the adds). */
  phase: number;
  party: number;
  /** Whose book: the Doorkeepers' (none said) or Hempen's (sim/hempenbook.ts). */
  of?: 'hempen' | 'haulier';
}

let book: BossBook | null = null;
export const useBook = (b: BossBook | null): void => void (book = b);
export const theBook = () => book;

export function newBook(party: number, swaps: number[], of?: 'hempen' | 'haulier'): BossBook {
  return { hurt: [], started: -1, swapAt: -1, apartAt: -1, lockBy: -1, lockUntil: -9, lockCool: -9, split: null, swaps, phase: 1, party, ...(of ? { of } : {}) };
}

/** A boss's own state as it's made (`party` players). */
export function newBoss(who: BossOn['who'], party: number): BossOn {
  const k = POISE_KIT.party[Math.max(0, Math.min(POISE_KIT.party.length - 1, party - 1))];
  return { who, job: who === 'latch' ? 'wall' : 'move', phase: 1, poise: 0, poiseMax: Math.round(POISE_KIT.bar * k), stagUntil: -9, roarUntil: -9, rot: 0, rotAt: -9, backUntil: -9, openUntil: -9, downUntil: -9, straps: 0, party };
}

/** The rotation for a phase: the plan's, one seeded swap, and one more for a party of four. */
export function rotation(phase: 1 | 2, party: number, swap: number): DoorMove[] {
  const r = [...DOORKEEPERS.rotation[phase]];
  const i = ((swap % r.length) + r.length) % r.length, j = (i + 1) % r.length;
  [r[i], r[j]] = [r[j], r[i]];
  if (party >= 4) r.push(DOORKEEPERS.more);
  return r;
}

const KIND: Record<DoorMove, AttackKind> = { jab: 'stab', sweep: 'cleave', charge: 'charge', lock: 'charge', spin: 'slam', vault: 'slam', bash: 'cleave', quake: 'slam' };
const E = DOORKEEPERS.enrage;

/** ENRAGED: a Doorkeeper whose partner is dead (phase 2). */
export const enraged = (e: Enemy) => !!e.boss && e.boss.who !== 'hempen' && e.boss.phase === 2;

/** The slowest kit's pace (a striped floor is always walked out of from its middle in 60% of it at this). */
const slowest = Math.min(...Object.values(WEAPONS).map((w) => HERO.speed * (w.speed ?? 1)));

/** A move's floor time, enraged or not: quicker by DOORKEEPERS.enrage.windup, never under its floors. */
export function doorWindup(move: DoorMove, mad: boolean): number {
  const s: EnemyAttackSpec = DOORKEEPERS[move];
  if (!mad) return s.windup;
  const floor = move === 'jab' || move === 'bash' ? E.floor.jab : s.unblockable ? Math.max(E.floor.striped, (s.radius! + HERO.radius) / slowest / 0.6) : E.floor.red;
  return Math.max(floor, s.windup * E.windup);
}

/** Begin one of its moves at `t`: the pose first, its floor after; a spin round itself. ENRAGED, quicker and harder, with a growl. */
export function bossBegin(e: Enemy, move: DoorMove, t: Hero, ev: FightEvent[]): boolean {
  begin(e, KIND[move], DOORKEEPERS[move], t, ev);
  const a = e.attack;
  if (!a) return false;
  const mad = enraged(e);
  if (mad) {
    a.windup = doorWindup(move, true) * (a.windup / DOORKEEPERS[move].windup);
    a.dmg = Math.round(a.dmg * E.dmg);
    if (move !== 'jab') ev.push({ k: 'growl', x: e.x, y: e.y });
  }
  Object.assign(a, { boss: move, tell: BOSS.tell, windup: a.windup + BOSS.tell });
  if (move === 'spin') (a.cx = e.x), (a.cy = e.y);
  return true;
}

/** A boss wind-up aimed at `id` by anyone but `not`, or a rope of Hempen's coming down on them (one clock a hero). */
export const clocked = (id: string, foes: Enemy[], not?: Enemy) => foes.some((o) => o !== not && !!o.boss && !isDead(o) && ((!!o.attack?.boss && o.attack.aimed === id && o.attack.t < o.attack.windup) || !!o.boss.ropes?.some((r) => r.on === id)));

/** The hungry near a hero a boss is winding up at hold their blows (sim/enemies.ts begin asks). */
export const clockHolds = (e: Enemy, t: Hero, foes: Enemy[]) => !e.boss && Math.hypot(e.x - t.x, e.y - t.y) <= BOSS.clock && clocked(t.id, foes);

/** A blow on it landed: noted for whom it faces. */
export function noteHurt(e: Enemy, by: string, n: number, now: number): void {
  if (!book || !by || n <= 0) return;
  book.hurt.push([e.id, by, now, n]);
}

/** Old blows forgotten (once a tick). */
export function forget(b: BossBook, now: number): void {
  if (b.hurt.length && now - b.hurt[0][2] > BOSS.aggro) b.hurt = b.hurt.filter((x) => now - x[2] <= BOSS.aggro);
}

const up = (h: Hero) => h.act !== 'down' && !h.out;

/** Whom it faces: a taunt, a block held within BOSS.keep of its face, whoever hurt it most lately, else the nearest. */
export function bossTarget(e: Enemy, heroes: Hero[], now: number): Hero | null {
  const live = heroes.filter((h) => up(h) && h.id !== 'squire');
  if (!live.length) return null;
  const taunt = tauntTarget(e, heroes, now);
  if (taunt) return taunt;
  const d = (h: Hero) => Math.hypot(h.x - e.x, h.y - e.y);
  const face = live.filter((h) => h.blocking && d(h) <= BOSS.keep && ((h.x - e.x) * e.fx + (h.y - e.y) * e.fy) / (d(h) || 1) > 0.5);
  if (face.length) return face.reduce((a, b) => (d(b) < d(a) ? b : a));
  const sum = new Map<string, number>();
  for (const [id, by, at, n] of book?.hurt ?? []) if (id === e.id && now - at <= BOSS.aggro) sum.set(by, (sum.get(by) ?? 0) + n);
  let best: Hero | null = null, most = 0;
  for (const h of live) if ((sum.get(h.id) ?? 0) > most) (most = sum.get(h.id)!), (best = h);
  return best ?? live.reduce((a, b) => (d(b) < d(a) ? b : a));
}

/** In the wind-up: its blow turns with its hero until BOSS.aimLock of it, then holds (a spin is round itself; a lock is braced, aimed once). */
export function trackAim(e: Enemy, heroes: Hero[]): void {
  if (e.boss?.who === 'hempen') return hempenAim(e, heroes);
  const a = e.attack;
  if (!a?.boss || a.boss === 'spin' || a.boss === 'lock' || a.t >= a.windup * BOSS.aimLock) return;
  const h = heroes.find((x) => x.id === a.aimed);
  if (!h || !up(h)) return;
  const dx = h.x - a.ox, dy = h.y - a.oy, l = Math.hypot(dx, dy);
  if (l < 0.05) return;
  (a.dx = e.fx = dx / l), (a.dy = e.fy = dy / l);
}

/** Turn toward (ux, uy) at `rate` radians a second; how squarely it now faces that way. */
export function turnTo(e: Enemy, ux: number, uy: number, rate: number, dt: number): number {
  const want = Math.atan2(uy, ux), have = Math.atan2(e.fy, e.fx);
  const diff = Math.atan2(Math.sin(want - have), Math.cos(want - have)), na = have + Math.max(-rate * dt, Math.min(rate * dt, diff));
  (e.fx = Math.cos(na)), (e.fy = Math.sin(na));
  return e.fx * ux + e.fy * uy;
}
