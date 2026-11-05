/**
 * Lamp oil (numbers: shared/prowlers.ts OIL, TORCH). The oil thrower keeps its distance and lobs a pot
 * where you stand: a slick lies there. On a slick you slide (your stick takes hold slowly). Its
 * torch-bearer walks to a slick with someone on it and throws its torch: the slick pulses and goes up,
 * burning whoever's in it. Any fire of yours lights a slick too: a fire burst, a flask of Lamp Oil, a
 * burning goblin walking into it.
 */
import { HERO, OIL, TORCH, type EnemyAttackSpec } from '../shared/tuning';
import { isDead } from './damage';
import { begin, walk } from './enemies';
import { afflict, type World } from './elements';
import { downIfDead } from './combat';
import type { Enemy, FightEvent, Hero, Intent } from './types';

/** A slick of oil on the floor: lit (room time it went up, -1 not yet) and when it's gone. */
export interface Slick { id: number; x: number; y: number; r: number; until: number; lit: number }
let nextId = 1;
const lit = (s: Slick, now: number) => s.lit >= 0 && now - s.lit < TORCH.burn;
const on = (s: Slick, b: { x: number; y: number }, pad = 0) => Math.hypot(b.x - s.x, b.y - s.y) <= s.r + pad;

/** The oil thrower: a pot lobbed at where you stand, else its distance kept. */
export function stepOiler(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, speed: number, now: number, dt: number, ev: FightEvent[]): void {
  if (e.cooldown <= 0 && d <= OIL.reach && facing > 0.85) {
    begin(e, 'lob', OIL.lob, t, ev);
    if (e.attack) (e.attack.cx = t.x), (e.attack.cy = t.y);
    return;
  }
  if (d < OIL.keep) {
    const side = Math.sin(now * 0.7 + e.id) > 0 ? 1 : -1;
    return walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed * OIL.flee, dt);
  }
  if (d > OIL.reach * 0.85) walk(e, ux, uy, speed * Math.max(0.2, facing), dt);
}

/** The torch-bearer: to the nearest unlit slick with a hero on it, and the torch thrown into it. */
export function stepTorch(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, speed: number, slicks: Slick[], heroes: Hero[], now: number, dt: number, ev: FightEvent[]): void {
  const s = slicks.filter((q) => q.lit < 0 && heroes.some((h) => h.act !== 'down' && on(q, h, 0.4))).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
  if (s) {
    const sd = Math.hypot(s.x - e.x, s.y - e.y) || 1;
    if (sd - s.r <= TORCH.reach && e.cooldown <= 0) {
      (e.fx = (s.x - e.x) / sd), (e.fy = (s.y - e.y) / sd);
      const spec: EnemyAttackSpec = { windup: TORCH.warn, active: 0.1, recover: 0.8, dmg: 0, knock: 0, radius: s.r, unblockable: true };
      begin(e, 'torch', spec, t, ev);
      if (e.attack) (e.attack.cx = s.x), (e.attack.cy = s.y), (e.attack.dx = e.fx), (e.attack.dy = e.fy);
      return;
    }
    return walk(e, s.x - e.x, s.y - e.y, speed, dt);
  }
  // Nothing to light: it hangs back with its pot-thrower, and swings the torch at anyone close.
  if (d < TORCH.keep) {
    const side = e.id % 2 ? 1 : -1;
    return walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed, dt);
  }
  if (d > 5) walk(e, ux, uy, speed * 0.6 * Math.max(0.2, facing), dt);
}

/**
 * Once a tick: a pot that landed leaves a slick; a torch that landed, or any fire of ours, lights one;
 * a lit slick burns whoever's in it; spent ones go.
 */
export function stepSlicks(slicks: Slick[], w: World, dt: number): Slick[] {
  const { now, ev } = w;
  for (const e of [...ev]) {
    if (e.k === 'impact' && e.kind === 'lob') slicks.push({ id: nextId++, x: e.x, y: e.y, r: OIL.radius, until: now + OIL.life, lit: -1 }), ev.push({ k: 'slick', x: e.x, y: e.y });
    const fire = (e.k === 'impact' && e.kind === 'torch') || (e.k === 'burst' && e.el === 'fire') || e.k === 'oilfire' || e.k === 'ignite' || e.k === 'firering';
    if (!fire) continue;
    const reach = e.k === 'burst' ? e.r : e.k === 'firering' ? 2.5 : 0.6;
    for (const s of slicks) if (s.lit < 0 && Math.hypot(e.x - s.x, e.y - s.y) <= s.r + reach) light(s, now, ev);
  }
  // A burning goblin walking into a slick sets it off.
  for (const s of slicks) if (s.lit < 0 && w.enemies.some((e) => !isDead(e) && e.burnUntil > now && on(s, e))) light(s, now, ev);
  for (const s of slicks) {
    if (!lit(s, now)) continue;
    for (const h of w.heroes) {
      if (h.act === 'down' || h.act === 'roll' || (h.z ?? 0) !== 0 || !on(s, h, HERO.radius * 0.5)) continue;
      if (Math.floor(now * 2) === Math.floor((now - dt) * 2)) continue;
      const n = Math.round(TORCH.dps / 2);
      h.hp -= n;
      ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: false, on: 'hero', src: 'fire' });
      downIfDead(h, ev);
    }
    for (const e of w.enemies) if (!isDead(e) && (e.z ?? 0) === 0 && e.burnUntil <= now && on(s, e)) afflict(w, e, 'fire', TORCH.foeDps);
  }
  return slicks.filter((s) => s.until > now && !(s.lit >= 0 && now - s.lit >= TORCH.burn));
}

function light(s: Slick, now: number, ev: FightEvent[]): void {
  s.lit = now;
  ev.push({ k: 'oilup', x: s.x, y: s.y });
}

/** Heroes on a slick this tick (for drawing their slide too). */
export function markSlick(slicks: Slick[], heroes: Hero[]): void {
  for (const h of heroes) h.slick = slicks.some((s) => s.lit < 0 && on(s, h)) || undefined;
}

/**
 * On a slick the stick takes hold slowly: what the hero gets is their last way of going drawn toward
 * the stick at OIL.grip of the usual (so they turn wide, and slide on when they let go).
 */
export function slipIntent(h: Hero, inp: Intent, dt: number): Intent {
  if (!h.slick) return (h.slipX = inp.mx), (h.slipY = inp.my), inp;
  const k = Math.min(1, OIL.grip * 8 * dt), was = Math.hypot(h.slipX ?? 0, h.slipY ?? 0);
  h.slipX = (h.slipX ?? 0) + (inp.mx - (h.slipX ?? 0)) * k;
  h.slipY = (h.slipY ?? 0) + (inp.my - (h.slipY ?? 0)) * k;
  // Let go on oil and you slide on a while.
  if (!inp.mx && !inp.my && was > 0.2) (h.slipX *= 0.97), (h.slipY *= 0.97);
  return { ...inp, mx: h.slipX, my: h.slipY };
}

