/**
 * Idles (Kyle, 2026-11-05): a hero who has stood still a few seconds, out of any fight, now and then
 * does something of their own: three things a class, and a rare fourth that comes up one pick in
 * fifty. A Ranger mostly plays with the hound. Cosmetic only: each screen decides from what it sees
 * (a hero standing still, no goblin awake near them), so nothing goes over the network and the room
 * never hears of it. Timings come from a seed made of the hero's id and the clock, so a party never
 * idles in step. Any input, a hit, moving, or a goblin waking near cuts an idle off at once.
 * This file is the catalogue and the watch; idlepose.ts poses the body, idledraw.ts draws what's in
 * hand, idlehound.ts moves the hound.
 */
import { Rng } from '../shared/rng';
import { CLASS_KITS, WEAPONS, type HeroClass, type WeaponId } from '../shared/tuning';
import { collide, currentMap, useMap, type GameMap } from '../shared/arena';
import type { Enemy, Hero } from '../sim/types';

export type IdleId =
  | 'w_stretch' | 'w_edge' | 'w_lean' | 'w_plant' | 'w_shoulder' | 'w_yawn'
  | 'r_fetch' | 'r_ruffle' | 'r_scan' | 'r_tackle'
  | 'g_flip' | 'g_coin' | 'g_glance' | 'g_fumble'
  | 'm_read' | 'm_sparks' | 'm_brim' | 'm_flop'
  | 'c_censer' | 'c_pray' | 'c_polish' | 'c_sneeze';

/**
 * One idle: how long it runs (s), how often it's picked against the others, rare, needs the hound,
 * and the weapons it needs in hand (Kyle: what's held changes it; none listed: any of the class's).
 */
export interface IdleDef { id: IdleId; dur: number; weight: number; rare?: boolean; hound?: boolean; kits?: WeaponId[] }

/**
 * Each class's three for whatever's in hand, then its rare one. A Warrior's thumb on the edge needs a
 * blade, the lean needs the sword's shield; a greatsword or spear is planted and leaned on instead, and
 * a spear rests on the shoulder. The Ranger's hound idles weigh five to one.
 */
export const IDLES: Record<HeroClass, IdleDef[]> = {
  WARRIOR: [
    { id: 'w_stretch', dur: 3.4, weight: 1 }, { id: 'w_edge', dur: 3.6, weight: 1, kits: ['sword', 'greatsword'] }, { id: 'w_lean', dur: 4.6, weight: 1, kits: ['sword'] },
    { id: 'w_plant', dur: 4.6, weight: 1, kits: ['greatsword', 'spear'] }, { id: 'w_shoulder', dur: 4, weight: 1, kits: ['spear'] }, { id: 'w_yawn', dur: 4.6, weight: 0, rare: true },
  ],
  RANGER: [{ id: 'r_fetch', dur: 6.2, weight: 3, hound: true }, { id: 'r_ruffle', dur: 3.8, weight: 2, hound: true }, { id: 'r_scan', dur: 5.2, weight: 1 }, { id: 'r_tackle', dur: 6, weight: 0, rare: true, hound: true }],
  ROGUE: [{ id: 'g_flip', dur: 3, weight: 1 }, { id: 'g_coin', dur: 2.8, weight: 1 }, { id: 'g_glance', dur: 3.2, weight: 1 }, { id: 'g_fumble', dur: 3.8, weight: 0, rare: true }],
  MAGE: [{ id: 'm_read', dur: 5.2, weight: 1 }, { id: 'm_sparks', dur: 3, weight: 1 }, { id: 'm_brim', dur: 2.8, weight: 1 }, { id: 'm_flop', dur: 3.8, weight: 0, rare: true }],
  HEALER: [{ id: 'c_censer', dur: 4.2, weight: 1 }, { id: 'c_pray', dur: 4.4, weight: 1 }, { id: 'c_polish', dur: 3.8, weight: 1 }, { id: 'c_sneeze', dur: 3.6, weight: 0, rare: true }],
};

/**
 * `settle`: still this long (s, a range) before the first; `gap`: start to start after that; `rest`:
 * at least this long between one ending and the next; `calm`: no goblin awake within this many
 * tiles; `rare`: the rare one's chance at each pick; `toss`: how far the Ranger's stick goes (tiles).
 */
export const IDLE = { settle: [4, 6], gap: [6, 10], rest: 1.5, calm: 8, rare: 1 / 50, toss: 2.4 } as const;

/** The idles that fit what's in hand (and the hound, if it's there to play). */
export const fits = (d: IdleDef, w: WeaponId, dog: boolean) => (!d.kits || d.kits.includes(w)) && (dog || !d.hound);
/** The three (or fewer, without the hound) a hero with weapon `w` picks from. */
export const commonFor = (cls: HeroClass, w: WeaponId, dog = true) => IDLES[cls].filter((d) => !d.rare && fits(d, w, dog));

/** Pick an idle: `a` and `b` are two rolls in [0, 1); `w` the weapon in hand; `dog`: the hound is there to play. */
export function pickIdle(cls: HeroClass, a: number, b: number, dog: boolean, w: WeaponId = CLASS_KITS[cls][0]): IdleDef {
  const rare = IDLES[cls].find((d) => d.rare)!;
  if (a < IDLE.rare && fits(rare, w, dog)) return rare;
  const can = commonFor(cls, w, dog), sum = can.reduce((n, d) => n + d.weight, 0);
  let r = b * sum;
  for (const d of can) if ((r -= d.weight) < 0) return d;
  return can[can.length - 1];
}

/** An idle playing now: which, how far in (s), and the side the hero faces (1 right, -1 left). */
export interface IdleFrame { def: IdleDef; t: number; side: number }

interface Watch {
  at: number; x: number; y: number; fx: number; fy: number; hp: number;
  next: number; play: IdleDef | null; start: number; side: number; poked: boolean; rng: Rng;
}
const watches = new Map<string, Watch>();
const FRAME: IdleFrame = { def: IDLES.WARRIOR[0], t: 0, side: 1 };
/** What the drawing sees this frame: the goblins (who's awake near whom) and the ground (the stick's way). */
const world: { enemies: readonly Enemy[]; map: GameMap | null } = { enemies: [], map: null };

/** Once a frame, before anything's drawn (three/views.ts). */
export function idleWorld(enemies: readonly Enemy[], map: GameMap | null): void {
  world.enemies = enemies;
  world.map = map;
}
/** Input from this player: their hero's idle stops at once. */
export function pokeIdle(id: string): void {
  const w = watches.get(id);
  if (w) w.poked = true;
}
/** Start idle `id` on a hero now (look sheets and screenshots: window.__idles). */
export function forceIdle(h: Hero, id: IdleId, now: number): void {
  const w = watch(h, now), def = idleDef(id);
  const side = id === 'r_fetch' ? tossSide(h, sideOf(h)) || sideOf(h) : sideOf(h);
  Object.assign(w, { at: now, x: h.x, y: h.y, fx: h.fx, fy: h.fy, hp: h.hp, play: def, start: now, side, next: now + def.dur + IDLE.rest, poked: false });
}
export const idleDef = (id: IdleId) => Object.values(IDLES).flat().find((d) => d.id === id)!;
/** A look sheet's frame for a hero (heroart.ts): this idle, `t` s in, whatever the watch says (null: off). */
const SHOW = new Map<string, IdleFrame>();
export function showIdle(id: string, f: { id: IdleId; t: number; side: number } | null): void {
  if (f) SHOW.set(id, { def: idleDef(f.id), t: f.t, side: f.side });
  else SHOW.delete(id);
}

const sideOf = (h: Hero) => (h.fx >= -0.2 ? 1 : -1);
const hash = (s: string) => {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return x >>> 0;
};
function watch(h: Hero, now: number): Watch {
  let w = watches.get(h.id);
  if (!w) {
    const rng = new Rng(hash(h.id) ^ Math.floor(now * 1000));
    w = { at: -1, x: h.x, y: h.y, fx: h.fx, fy: h.fy, hp: h.hp, next: now + rng.range(IDLE.settle[0], IDLE.settle[1]), play: null, start: 0, side: 1, poked: false, rng };
    watches.set(h.id, w);
  }
  return w;
}

/** No goblin awake within `IDLE.calm` tiles of the hero. */
export function calmAround(h: Hero, enemies: readonly Enemy[]): boolean {
  const r2 = IDLE.calm * IDLE.calm;
  for (const e of enemies) if (e.act !== 'dead' && e.alert !== false && (e.x - h.x) ** 2 + (e.y - h.y) ** 2 < r2) return false;
  return true;
}

/** The hound is at heel and free to play (a Ranger's own, or one that walks with another player's). */
export const dogFree = (h: Hero) => WEAPONS[h.weapon].cls === 'RANGER' && !h.noHound && (!h.hound || (h.hound.state === 'heel' && !h.hound.down));

/** Which way the stick can go: the facing side if the ground's open there, else the other, else none (0). */
function tossSide(h: Hero, side: number): number {
  const m = world.map;
  if (!m) return side;
  const was = currentMap(), open = (s: number) => [0.5, 1, 1.6, IDLE.toss].every((k) => {
    const p = { x: h.x + s * k, y: h.y + 0.15 };
    collide(p, 0.3);
    return Math.abs(p.x - (h.x + s * k)) + Math.abs(p.y - (h.y + 0.15)) < 0.05;
  });
  useMap(m);
  try {
    return open(side) ? side : open(-side) ? -side : 0;
  } finally {
    useMap(was);
  }
}

/** Anything that isn't standing still out of a fight. */
const busy = (h: Hero, w: Watch) =>
  h.act !== 'idle' || h.moving || h.blocking || !!h.carrying || !!h.lifting || !!h.stoop || h.hp < w.hp ||
  Math.abs(h.x - w.x) > 0.02 || Math.abs(h.y - w.y) > 0.02 || Math.abs(h.fx - w.fx) > 0.05 || Math.abs(h.fy - w.fy) > 0.05;

/** The idle a hero is playing this frame (wall clock `now`), or null. Updated once a frame per hero. */
export function idleFrame(h: Hero, now: number): IdleFrame | null {
  const shown = SHOW.get(h.id);
  if (shown) return shown;
  const w = watch(h, now);
  if (w.at !== now) step(w, h, now);
  if (!w.play) return null;
  return (FRAME.def = w.play), (FRAME.t = now - w.start), (FRAME.side = w.side), FRAME;
}

function step(w: Watch, h: Hero, now: number): void {
  // (Not drawn a moment, down or out of sight: start over.)
  const moved = busy(h, w) || now - w.at > 0.5;
  Object.assign(w, { at: now, x: h.x, y: h.y, fx: h.fx, fy: h.fy, hp: h.hp });
  if (moved || w.poked || !calmAround(h, world.enemies)) {
    w.poked = false;
    w.play = null;
    w.next = now + w.rng.range(IDLE.settle[0], IDLE.settle[1]);
    return;
  }
  if (w.play && now - w.start >= w.play.dur) {
    w.next = Math.max(w.start + w.rng.range(IDLE.gap[0], IDLE.gap[1]), now + IDLE.rest);
    w.play = null;
  }
  if (w.play || now < w.next) return;
  const cls = WEAPONS[h.weapon].cls as HeroClass;
  let def = pickIdle(cls, w.rng.next(), w.rng.next(), dogFree(h), h.weapon), side = sideOf(h);
  // The stick needs open ground to land on: the other way if it's walled on this side, else a ruffle.
  if (def.id === 'r_fetch' && !(side = tossSide(h, side))) (def = IDLES.RANGER[1]), (side = sideOf(h));
  Object.assign(w, { play: def, start: now, side });
}

/** Forget heroes not seen for a while (players who left town). */
export function idleSweep(now: number): void {
  for (const [id, w] of watches) if (now - w.at > 30) watches.delete(id);
}
