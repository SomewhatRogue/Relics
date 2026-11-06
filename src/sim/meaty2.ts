/**
 * The second three meaty sorts' turns (numbers: shared/meaty2.ts). Each has one thing and one answer:
 * - the Kegman walks in and swings; its keg is sim/blast.ts's (it bursts when it dies, or when it's lit);
 * - the Pouncer crouches and leaps at where you stood (a striped circle, locked as it crouches), lands,
 *   and is stuck (`stuckAt`: stunned, so the punish lands harder), then rakes (red) if you're close;
 * - the Gorger pulls a small one's body in and eats it (the butcher's meal, sim/meal.ts, so a heavy hit,
 *   a stun or the body burned breaks it off), growing each time, up to GORGER.most; else it bites.
 * The room's hooks: sim/ownfoes.ts (their turns and bodies), sim/enemies.ts (the leap's flight).
 */
import { GORGER, KEGMAN, POUNCER, grownBy } from '../shared/tuning';
import { begin, walk } from './enemies';
import { edible, edibleFreed } from './meal';
import type { Enemy, FightEvent, Hero, Survivor } from './types';

const BODY: Record<string, { radius: number; weight: number }> = { kegman: KEGMAN, pouncer: POUNCER, gorger: GORGER };

/** A new one's body: bigger and heavier than a small goblin's. */
export function shapeMeaty2(e: Enemy): void {
  const b = e.variant && BODY[e.variant];
  if (b) (e.radius = b.radius), (e.weight = b.weight);
}

/** The Kegman: in and swing (its keg is the room's: sim/blast.ts). */
export function stepKegman(e: Enemy, t: Hero, d: number, level: boolean, ux: number, uy: number, facing: number, speed: number, dt: number, ev: FightEvent[]): void {
  if (level && d <= KEGMAN.reach && e.cooldown <= 0 && facing > 0.8) return begin(e, 'cleave', KEGMAN.swing, t, ev);
  if (d > KEGMAN.reach * 0.8) walk(e, ux, uy, speed * KEGMAN.speed * Math.max(0.2, facing), dt);
}

/** The Pouncer: stuck once a leap is down; a leap from between POUNCER.near and .from; a rake up close; else in. */
export function stepPouncer(e: Enemy, t: Hero, d: number, level: boolean, ux: number, uy: number, facing: number, speed: number, now: number, dt: number, ev: FightEvent[]): void {
  if (e.leapAt !== undefined && e.leapAt > (e.stuckAt ?? -99)) {
    e.stuckAt = now;
    Object.assign(e, { act: 'stunned', actT: 0, actDur: POUNCER.stuck, kvx: 0, kvy: 0 });
    ev.push({ k: 'stunned', x: e.x, y: e.y });
    return;
  }
  const ready = e.cooldown <= 0 && now - (e.leapAt ?? -99) >= POUNCER.every;
  if (level && ready && d >= POUNCER.near && d <= POUNCER.from && facing > 0.85) {
    begin(e, 'slam', POUNCER.leap, t, ev);
    // Where you stand now, locked: the circle never moves.
    if (e.attack) (e.leapAt = now), (e.attack.cx = t.x), (e.attack.cy = t.y);
    return;
  }
  if (level && d <= POUNCER.reach && e.cooldown <= 0 && facing > 0.8) return begin(e, 'cleave', POUNCER.rake, t, ev);
  if (d > POUNCER.reach * 0.8) walk(e, ux, uy, speed * POUNCER.speed * Math.max(0.2, facing), dt);
}

/** How far through its flight a leap is (0 crouched, 1 landed), by the blow's own clock. */
export function leapAlong(a: { t: number; windup: number }): number {
  const k0 = a.windup * POUNCER.crouch;
  return Math.max(0, Math.min(1, (a.t - k0) / Math.max(0.01, a.windup - k0)));
}

/** Its body through the air, from where it crouched to the circle's middle, landing as the blow does. */
export function flyPounce(e: Enemy): void {
  const a = e.attack;
  if (e.variant !== 'pouncer' || !a || a.kind !== 'slam') return;
  const k = leapAlong(a);
  if (k <= 0) return;
  e.x = a.ox + (a.cx - a.ox) * k;
  e.y = a.oy + (a.cy - a.oy) * k;
  e.kvx = e.kvy = 0;
  e.moving = k < 1;
}

/** The nearest whole body within GORGER.seek: a small goblin's or one of the freed. */
function bodyNear(e: Enemy, others: Enemy[], freed: Survivor[]): { x: number; y: number; id: number; s: boolean } | null {
  let best: { x: number; y: number; id: number; s: boolean } | null = null, bd = Infinity;
  const look = (x: number, y: number, id: number, s: boolean) => {
    const d = Math.hypot(x - e.x, y - e.y);
    if (d <= GORGER.seek + e.radius && d < bd) (bd = d), (best = { x, y, id, s });
  };
  for (const o of others) if (edible(o)) look(o.x, o.y, o.id, false);
  for (const v of freed) if (edibleFreed(v)) look(v.x, v.y, v.id, true);
  return best;
}

/** Eaten: bigger, tougher (healed by what it gains) and harder hitting, once more. */
function grow(e: Enemy, ev: FightEvent[]): void {
  const n = e.grown ?? 0, was = grownBy(n), now = grownBy(n + 1), gain = Math.round((e.maxHp / was) * (now - was));
  e.grown = n + 1;
  e.maxHp += gain;
  e.hp = Math.min(e.maxHp, e.hp + gain);
  e.harm = +((e.harm ?? 1) * (now / was)).toFixed(3);
  e.radius = +(GORGER.radius * now).toFixed(3);
  e.weight = +(GORGER.weight * now).toFixed(3);
  ev.push({ k: 'grown', x: e.x, y: e.y }, { k: 'fed', x: e.x, y: e.y, n: gain });
}

/** The Gorger: at a pull (it stands, turned to the body); a body pulled in if nobody's on it; else bite or come on. */
export function stepGorger(e: Enemy, t: Hero, d: number, level: boolean, ux: number, uy: number, facing: number, speed: number, heroes: Hero[], others: Enemy[], freed: Survivor[], now: number, dt: number, ev: FightEvent[]): void {
  const m = e.meal;
  if (m) {
    const l = Math.hypot(m.x - e.x, m.y - e.y);
    if (l > 0.01) (e.fx = (m.x - e.x) / l), (e.fy = (m.y - e.y) / l);
    if (now < m.until) return;
    e.meal = null;
    e.mealCool = now + GORGER.again;
    const body = m.s ? freed.find((v) => v.id === m.b) : others.find((o) => o.id === m.b);
    if (body) body.eaten = true;
    return grow(e, ev);
  }
  const guarded = heroes.some((h) => h.act !== 'down' && !h.out && Math.hypot(h.x - e.x, h.y - e.y) < GORGER.guard + e.radius);
  if ((e.grown ?? 0) < GORGER.most && (e.mealCool ?? -9) <= now && !guarded && (e.z ?? 0) === 0) {
    const b = bodyNear(e, others, freed);
    if (b) {
      e.meal = { b: b.id, ...(b.s ? { s: true } : {}), x: b.x, y: b.y, at: +now.toFixed(3), until: +(now + GORGER.pull).toFixed(3) };
      ev.push({ k: 'meal', x: b.x, y: b.y });
      return;
    }
  }
  if (level && d <= GORGER.reach && e.cooldown <= 0 && facing > 0.8) return begin(e, 'cleave', GORGER.bite, t, ev);
  if (d > GORGER.reach * 0.8) walk(e, ux, uy, speed * GORGER.speed * Math.max(0.2, facing), dt);
}
