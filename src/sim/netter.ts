/**
 * The netter (numbers: shared/raiders.ts NETTER). It keeps its distance and throws its net at whoever is
 * furthest from their friends; the striped circle goes down where they stand. Caught, a hero is held:
 * presses of attack, dodge and guard and swings of the stick work them loose, and a friend's GRAB close
 * by cuts them out at once. Any blow taken while netted keeps them netted.
 */
import { HOIST, NETTER } from '../shared/tuning';
import { downIfDead } from './combat';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero, Intent } from './types';

const players = (heroes: Hero[]) => heroes.filter((h) => h.id !== 'squire' && h.act !== 'down');
export const netted = (h: Hero, now: number) => (h.netUntil ?? -9) > now;

/** Who to net: the one furthest from any friend (alone, the one nearest). */
function loneliest(e: Enemy, heroes: Hero[], near: Hero): Hero {
  const ps = players(heroes).filter((h) => Math.hypot(h.x - e.x, h.y - e.y) <= NETTER.reach + 2);
  if (ps.length < 2) return near;
  const gap = (h: Hero) => Math.min(...players(heroes).filter((o) => o !== h).map((o) => Math.hypot(o.x - h.x, o.y - h.y)));
  return ps.reduce((a, b) => (gap(b) > gap(a) ? b : a));
}

/** The netter's turn: the net when ready and in reach, else keep its distance. */
export function stepNetter(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, speed: number, heroes: Hero[], now: number, dt: number, ev: FightEvent[]): void {
  const aim = loneliest(e, heroes, t), da = Math.hypot(aim.x - e.x, aim.y - e.y) || 1;
  // It looks for the one it means to net (a small goblin turns quickly).
  if (aim !== t) (e.fx = (aim.x - e.x) / da), (e.fy = (aim.y - e.y) / da), (ux = e.fx), (uy = e.fy), (facing = 1);
  if (e.cooldown <= 0 && da <= NETTER.reach && facing > 0.8 && !netted(aim, now)) {
    begin(e, 'net', NETTER.net, aim, ev);
    if (e.attack) (e.attack.cx = aim.x), (e.attack.cy = aim.y);
    return;
  }
  if (d < NETTER.keep) {
    const side = Math.sin(now * 0.7 + e.id) > 0 ? 1 : -1;
    return walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed * NETTER.flee, dt);
  }
  if (da > NETTER.reach * 0.85) walk(e, ux, uy, speed * Math.max(0.2, facing), dt);
}

/** A friend in a net within reach of `h` (GRAB cuts them out: the CUT FREE button). */
export const cuttable = (h: Hero, heroes: Hero[], now: number) => h.act !== 'down' && !netted(h, now) && heroes.some((o) => o !== h && netted(o, now) && Math.hypot(o.x - h.x, o.y - h.y) <= NETTER.cut);

/** The net came down on `h`: held. */
export function catchIn(h: Hero, now: number, ev: FightEvent[]): void {
  Object.assign(h, { netUntil: now + NETTER.hold, netAng: undefined, act: 'stun', actT: 0, actDur: NETTER.hold, kvx: 0, kvy: 0 });
  ev.push({ k: 'netted', x: h.x, y: h.y, id: h.id });
}

/**
 * Before anyone moves: each netted hero struggles (their presses are spent on it, never on a swing), a
 * friend's GRAB by them cuts them loose, and a hero whose net has given way is free.
 */
export function stepNets(heroes: Hero[], intents: Map<string, Intent>, none: Intent, now: number, ev: FightEvent[]): void {
  for (const h of heroes) {
    if (h.netUntil === undefined) continue;
    if (h.act === 'down') {
      h.netUntil = undefined;
      continue;
    }
    const inp = intents.get(h.id) ?? none;
    let off = 0;
    if (inp.attackSeq !== h.seen.attack) (h.seen.attack = inp.attackSeq), (off += NETTER.mash);
    if (inp.rollSeq !== h.seen.roll) (h.seen.roll = inp.rollSeq), (off += NETTER.mash);
    if (inp.blockSeq !== h.seen.block) (h.seen.block = inp.blockSeq), (off += NETTER.mash);
    if (Math.hypot(inp.mx, inp.my) > 0.6) {
      const a = Math.atan2(inp.my, inp.mx), was = h.netAng;
      if (was === undefined || Math.abs(Math.atan2(Math.sin(a - was), Math.cos(a - was))) > 1) (h.netAng = a), (off += was === undefined ? 0 : NETTER.wiggle);
    }
    // (Hoisted in a snare there's no struggling out of it: sim/snares.ts.)
    if (off && !h.hoisted) (h.netUntil -= off), ev.push({ k: 'struggle', x: h.x, y: h.y });
    // A friend close by with GRAB: cut loose.
    for (const o of players(heroes)) {
      if (o === h || netted(o, now) || Math.hypot(o.x - h.x, o.y - h.y) > NETTER.cut) continue;
      const oi = intents.get(o.id) ?? none;
      if (oi.grabSeq === o.seen.grab) continue;
      o.seen.grab = oi.grabSeq;
      h.netUntil = now;
      ev.push({ k: 'cutfree', x: h.x, y: h.y, id: h.id, by: o.id });
      if (h.hoisted) (h.hoisted = undefined), ev.push({ k: 'cutdown', x: h.x, y: h.y, id: h.id });
      break;
    }
    if (h.netUntil > now) {
      // Still held: a blow that staggered them doesn't let them out.
      if (h.act !== 'stun') Object.assign(h, { act: 'stun', actT: 0 });
      h.actDur = h.actT + (h.netUntil - now);
      continue;
    }
    h.netUntil = h.netAng = undefined;
    if (h.act === 'stun') Object.assign(h, { act: 'idle', actT: 0 });
    // Left to drop out of a snare: down hard on the ground.
    if (h.hoisted) (h.hoisted = undefined), (h.hp -= HOIST.drop), ev.push({ k: 'hit', x: h.x, y: h.y, n: HOIST.drop, heavy: false, on: 'hero', src: 'fall' }), downIfDead(h, ev);
    ev.push({ k: 'netfree', x: h.x, y: h.y, id: h.id });
  }
}

