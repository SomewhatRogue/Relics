/**
 * Pack rushes (Kyle, 2026-11-04: "I love blasting through waves but I also want to have to block
 * sometimes and parry"; "as long as the ones that wind up can all be blocked or parried at once"; parry went
 * on 2026-11-05: one block or one dodge answers it now).
 * A fighting pack's first rush comes as it closes in (RUSH.first), then every RUSH.every seconds of
 * fighting (seeded): a free goblin of it calls one on a hero it isn't behind; two or three packmates join
 * as they come free, step into a fan before that hero on the pack's side, and once the fan's middle is in
 * front of the hero they wind up together, every blow landing in the one instant. One guard answers it all
 * (sim/rushguard.ts), a dodge through it slips it all. Never from behind, never off screen, one rush on a
 * hero at a time (a party spreads them). Held by the room; its goblins carry what both views draw.
 */
import { RUSH } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import { begin } from './enemies';
import { frozen, isDead, snared } from './damage';
import { netted } from './netter';
import type { Enemy, FightEvent, Hero } from './types';

/** `want`: how many it's for, the caller with them (it goes with fewer, from 1 + RUSH.join[0], once the call closes). */
interface Rush { id: number; pack: number; hero: string; members: number[]; want: number; t0: number; land?: number; dx: number; dy: number; cx?: number; cy?: number }
/** `fought`: seconds each pack has fought since its last rush; `due`: when its next is called. */
export interface Rushes { next: number; fought: Map<number, number>; due: Map<number, number>; live: Rush[] }
export const newRushes = (): Rushes => ({ next: 1, fought: new Map(), due: new Map(), live: [] });

/** Sorts that fight with a blade up close (no archers, back-liners, wolves or the newer sorts' own tricks). */
const MELEE = new Set(['lunger', 'shield', 'heavy', 'ironhide']);
export const melee = (e: Enemy) => e.kind === 'scrapper' && !e.bow && (!e.variant || MELEE.has(e.variant));
/** Its blow already landed and it's only getting its breath back: free to answer a call. */
const spent = (e: Enemy) => e.act === 'attack' && !!e.attack && !e.attack.rush && e.attack.kind !== 'charge' && e.attack.t >= e.attack.windup + e.attack.active;
/** Free to join: awake, on its feet and chasing or past its blow (not stunned, frozen, carried, winding up, routed or blinded). */
const free = (e: Enemy, now: number) => melee(e) && !isDead(e) && ((e.act === 'chase' && !e.attack) || spent(e)) && e.alert !== false && !e.dozing && !e.rushTo &&
  !frozen(e, now) && !snared(e, now) && (e.routUntil ?? -9) <= now && (e.blindUntil ?? -9) <= now && (e.z ?? 0) === 0;
const up = (h: Hero) => h.act !== 'down' && !h.safeT && !h.out && (h.z ?? 0) === 0;
/** In front of the hero (or, `wide`, anywhere but behind them) and on the screen with them. */
const before = (h: Hero, p: { x: number; y: number }, wide = false) => {
  const dx = p.x - h.x, dy = p.y - h.y, d = Math.hypot(dx, dy);
  return d <= RUSH.seen && (d < 0.01 || (h.fx * dx + h.fy * dy) / d > (wide ? RUSH.side : RUSH.front));
};

/** Once a tick, before the goblins move: rushes called, gathered, wound up and finished. */
export function stepRushes(s: Rushes, enemies: Enemy[], heroes: Hero[], rng: Rng, now: number, dt: number, ev: FightEvent[]): void {
  const byId = new Map(enemies.map((e) => [e.id, e]));
  s.live = s.live.filter((r) => keep(r, s, enemies, byId, heroes, rng, now, ev));
  // Anyone left marked for a rush that's gone (a leader taking over starts the clocks again) goes back to fighting.
  for (const e of enemies) if (e.rushTo && !s.live.some((r) => r.id === e.rushTo!.id)) e.rushTo = null;
  const fighting = new Set<number>();
  for (const e of enemies) if (e.pack !== undefined && !isDead(e) && e.alert !== false && !e.dozing && heroes.some((h) => up(h) && Math.hypot(h.x - e.x, h.y - e.y) < RUSH.fight)) fighting.add(e.pack);
  for (const p of [...fighting].sort((a, b) => a - b)) {
    // The first comes sooner, so a quick fight still meets one; then every RUSH.every.
    if (!s.due.has(p)) s.due.set(p, rng.range(RUSH.first[0], RUSH.first[1]));
    if (s.live.some((r) => r.pack === p)) continue;
    const t = (s.fought.get(p) ?? 0) + dt;
    s.fought.set(p, t);
    if (t < s.due.get(p)!) continue;
    if (!call(s, p, enemies, heroes, rng, now)) s.due.set(p, t + RUSH.retry);
  }
}

/** In the fight and on its feet: could answer a call once its blow is done. */
const able = (e: Enemy, now: number) => melee(e) && !isDead(e) && (e.act === 'chase' || e.act === 'attack' || e.act === 'flinch') && e.alert !== false && !e.dozing &&
  !e.rushTo && !e.attack?.rush && !frozen(e, now) && !snared(e, now) && (e.routUntil ?? -9) <= now && (e.blindUntil ?? -9) <= now && (e.z ?? 0) === 0;

/**
 * A goblin of pack `p` that's free calls a rush on a hero it's in front of, with two or more packmates in
 * the fight in front of them too; they join as each comes free (sim: keep, `RUSH.call`).
 */
function call(s: Rushes, p: number, enemies: Enemy[], heroes: Hero[], rng: Rng, now: number): boolean {
  const mine = enemies.filter((e) => e.pack === p && able(e, now));
  const taken = new Set(s.live.map((r) => r.hero));
  const options = heroes.filter((h) => up(h) && !taken.has(h.id) && !netted(h, now)).map((h) => ({ h, front: mine.filter((e) => before(h, e, true)) }))
    .filter((o) => o.front.length >= 1 + RUSH.join[0] && o.front.some((e) => free(e, now)));
  if (!options.length) return false;
  // The hero with most of the pack in front of them; the nearest free goblin of those calls it.
  options.sort((a, b) => b.front.length - a.front.length || a.h.id.localeCompare(b.h.id));
  const { h, front } = options[0], d = (e: Enemy) => Math.hypot(e.x - h.x, e.y - h.y);
  const caller = front.filter((e) => free(e, now)).sort((a, b) => d(a) - d(b) || a.id - b.id)[0];
  if (front.filter((e) => e !== caller && Math.hypot(e.x - caller.x, e.y - caller.y) <= RUSH.near).length < RUSH.join[0]) return false;
  // The fan faces the hero from where the pack is (the caller and the rest in front of them), so the hero sees it gather there.
  const mx = front.reduce((t, e) => t + e.x, caller.x) / (front.length + 1) - h.x, my = front.reduce((t, e) => t + e.y, caller.y) / (front.length + 1) - h.y, ml = Math.hypot(mx, my) || 1;
  const r: Rush = { id: s.next++, pack: p, hero: h.id, members: [caller.id], want: 1 + RUSH.join[0] + rng.int(RUSH.join[1] - RUSH.join[0] + 1), t0: now, dx: mx / ml, dy: my / ml };
  s.live.push(r);
  join(r, caller, h);
  return true;
}

/** Into the rush (one getting its breath back after a blow leaves it to answer). */
function join(r: Rush, e: Enemy, h: Hero): void {
  if (spent(e)) Object.assign(e, { attack: null, act: 'chase', actT: 0 });
  e.rushTo = { id: r.id, x: e.x, y: e.y, hx: h.x, hy: h.y };
}

/** While the call is open, packmates in front of the hero join it as they come free, nearest the caller first. */
function recruit(r: Rush, enemies: Enemy[], members: Enemy[], h: Hero, now: number): void {
  const caller = members[0];
  if (!caller || now - r.t0 > RUSH.call) return;
  const near = enemies.filter((e) => e.pack === r.pack && free(e, now) && before(h, e, true) && Math.hypot(e.x - caller.x, e.y - caller.y) <= RUSH.near)
    .sort((a, b) => Math.hypot(a.x - caller.x, a.y - caller.y) - Math.hypot(b.x - caller.x, b.y - caller.y) || a.id - b.id);
  for (const e of near.slice(0, r.want - members.length)) join(r, e, h), members.push(e);
}

/** Each goblin's place: a fan before the hero on the pack's side, in the order they stand round them (so none cross). */
function place(r: Rush, members: Enemy[], h: Hero): void {
  const face = Math.atan2(r.dy, r.dx), rel = (e: Enemy) => Math.atan2(Math.sin(Math.atan2(e.y - h.y, e.x - h.x) - face), Math.cos(Math.atan2(e.y - h.y, e.x - h.x) - face));
  const n = members.length;
  [...members].sort((a, b) => rel(a) - rel(b) || a.id - b.id).forEach((e, i) => {
    const a = face + (i - (n - 1) / 2) * RUSH.spread;
    e.rushTo = { id: r.id, x: h.x + Math.cos(a) * RUSH.slot, y: h.y + Math.sin(a) * RUSH.slot, hx: h.x, hy: h.y };
  });
}

/** A rush's tick; false once it's over. */
function keep(r: Rush, s: Rushes, enemies: Enemy[], byId: Map<number, Enemy>, heroes: Hero[], rng: Rng, now: number, ev: FightEvent[]): boolean {
  const h = heroes.find((x) => x.id === r.hero);
  if (r.land !== undefined) {
    // Winding up: a goblin frozen, held or knocked out of it is out of the rush (the rest still come).
    for (const id of r.members) {
      const e = byId.get(id), a = e?.attack;
      if (e && a?.rush === r.id && a.t < a.windup && (frozen(e, now) || snared(e, now) || e.act !== 'attack')) e.attack = null;
    }
    if (now < r.land + 0.05) return true;
    return done(r, s, byId, rng);
  }
  // Gathering: one stunned, pinned, carried, frozen or netted is out (a flinch only holds it up a moment).
  const members = r.members.map((id) => byId.get(id)).filter((e): e is Enemy => !!e && e.rushTo?.id === r.id && !isDead(e) && (e.act === 'chase' || e.act === 'flinch') && !frozen(e, now) && !snared(e, now));
  for (const id of r.members) if (!members.some((e) => e.id === id)) { const e = byId.get(id); if (e?.rushTo?.id === r.id) e.rushTo = null; }
  if (!h || !up(h) || !members.length) return done(r, s, byId, rng, RUSH.retry);
  recruit(r, enemies, members, h, now);
  const open = now - r.t0 < RUSH.call && members.length < r.want;
  if (members.length < 1 + RUSH.join[0] && !open) return done(r, s, byId, rng, RUSH.retry);
  r.members = members.map((e) => e.id);
  place(r, members, h);
  const ready = members.filter((e) => Math.hypot(e.rushTo!.x - e.x, e.rushTo!.y - e.y) <= RUSH.at && before(h, e, true));
  const late = now - r.t0 >= RUSH.gather;
  if ((open || ready.length < members.length) && !late) return true;
  if (ready.length < 1 + RUSH.join[0]) return done(r, s, byId, rng, RUSH.retry);
  // The middle of the fan must be in front of them too: no rush from behind.
  const mx = ready.reduce((t, e) => t + e.x, 0) / ready.length, my = ready.reduce((t, e) => t + e.y, 0) / ready.length;
  if (!before(h, { x: mx, y: my })) return late ? done(r, s, byId, rng, RUSH.retry) : true;
  for (const e of members) e.rushTo = null;
  r.members = ready.map((e) => e.id);
  Object.assign(r, { land: now + RUSH.blow.windup, cx: mx, cy: my });
  for (const e of ready) {
    begin(e, 'stab', { ...RUSH.blow, dmg: e.variant === 'heavy' || e.variant === 'ironhide' ? RUSH.big : RUSH.blow.dmg }, h, ev);
    Object.assign(e.attack!, { windup: RUSH.blow.windup, land: r.land, rush: r.id, rcx: mx, rcy: my, crush: false });
  }
  ev.push({ k: 'rush', x: mx, y: my, n: ready.length, id: h.id });
  return true;
}

/** Over: its goblins back to fighting, and the pack's clock starts again (sooner if it came to nothing). */
function done(r: Rush, s: Rushes, byId: Map<number, Enemy>, rng: Rng, again?: number): false {
  for (const id of r.members) {
    const e = byId.get(id);
    if (e?.rushTo?.id === r.id) e.rushTo = null;
  }
  s.fought.set(r.pack, 0);
  s.due.set(r.pack, again ?? rng.range(RUSH.every[0], RUSH.every[1]));
  return false;
}

/** Make pack `p` call its rush at the next chance (tests, the look script). */
export function rushNow(s: Rushes, p: number): void {
  s.due.set(p, 0);
}
