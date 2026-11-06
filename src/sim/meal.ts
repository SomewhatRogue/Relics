/**
 * Butchers eat the dead (numbers: shared/worldfx.ts MEAL; Kyle, 2026-11-05). A butcher with a body near
 * (a small goblin's, or one of the freed killed) and no hero right on it goes to the body and eats: a
 * clock of MEAL.time, not a blow, drawn as a red ring filling round the body (client/worlddraw.ts). Done,
 * it heals and comes up FED: harder blows, quicker wind-ups, quicker feet (sim/enemies.ts reads `fed`). A
 * heavy hit takes it off the body (sim/damage.ts), as a stun, a freeze, a net or a grab does here; fire
 * on the body turns it to ash first (sim/worldfire.ts), and ash, a burned body or a burst one feeds nothing.
 */
import { MEAL } from '../shared/tuning';
import { held, isDead } from './damage';
import { walk } from './enemies';
import { wayTo } from './pathing';
import type { Enemy, FightEvent, Hero, Survivor } from './types';

type Body = { x: number; y: number; id: number; s: boolean };

/** A small goblin's body a butcher can eat: whole (not burst, shattered or burned), lying free, not eaten or ash,
 *  and still there to see (a body fades over its kind's `respawn` seconds: client/foes.ts). */
export const edible = (o: Enemy) =>
  isDead(o) && o.kind === 'scrapper' && !o.escaped && !o.corpse && !o.under && !o.eaten && !o.ashed && o.death !== 'burst' && o.death !== 'shatter' && o.death !== 'burn' && o.actT < o.actDur - 0.3;
/** One of the freed, killed: the same. */
export const edibleFreed = (v: Survivor) => v.dead && !v.gone && !v.taken && !v.eaten && !v.ashed;

/** Burned to ash (sim/worldfire.ts; a small goblin dying alight, sim/elements.ts): it feeds nothing now. */
export function toAsh(b: Enemy | Survivor, ev: FightEvent[]): void {
  if (b.ashed || b.eaten) return;
  b.ashed = true;
  ev.push({ k: 'ashed', x: b.x, y: b.y });
}

function bodies(others: Enemy[], freed: Survivor[]): Body[] {
  const out: Body[] = [];
  for (const o of others) if (edible(o)) out.push({ x: o.x, y: o.y, id: o.id, s: false });
  for (const v of freed) if (edibleFreed(v)) out.push({ x: v.x, y: v.y, id: v.id, s: true });
  return out;
}

const still = (m: NonNullable<Enemy['meal']>, others: Enemy[], freed: Survivor[]) =>
  m.s ? freed.some((v) => v.id === m.b && edibleFreed(v)) : others.some((o) => o.id === m.b && edible(o));

/** Taken off the meal (`cool`: and it waits MEAL.again before the next). */
export function offMeal(e: Enemy, now: number, ev: FightEvent[], cool = true): void {
  if (!e.meal) return;
  e.meal = null;
  if (cool) e.mealCool = now + MEAL.again;
  ev.push({ k: 'mealbroken', x: e.x, y: e.y });
}

/** Once a tick, before the goblins move: FED or not, and meals broken off by a stun, a freeze, a net, a grab, or the body gone. */
export function mealWatch(enemies: Enemy[], freed: Survivor[], now: number, ev: FightEvent[]): void {
  for (const e of enemies) {
    if (e.kind !== 'butcher') continue;
    const fed = (e.fedUntil ?? -9) > now && !isDead(e);
    if (fed || e.fed) e.fed = fed;
    const m = e.meal;
    if (!m) continue;
    if (isDead(e)) e.meal = null;
    else if (held(e, now) || e.act === 'flinch' || e.act === 'attack' || !still(m, enemies, freed)) offMeal(e, now, ev);
  }
}

/** A butcher's turn, before it goes for anyone: at a meal, or making for one. True if that's its turn. */
export function stepMeal(e: Enemy, heroes: Hero[], others: Enemy[], freed: Survivor[], pace: number, now: number, dt: number, ev: FightEvent[]): boolean {
  const m = e.meal;
  // (The Stoker and the wood's drilled goblins keep to their lessons.)
  if (!m && (e.variant === 'stoker' || e.drill)) return false;
  if (m) {
    const l = Math.hypot(m.x - e.x, m.y - e.y);
    if (l > 0.01) (e.fx = (m.x - e.x) / l), (e.fy = (m.y - e.y) / l);
    if (now < m.until) return true;
    // Eaten: it heals, and comes up FED.
    const n = Math.min(e.maxHp - e.hp, Math.round(e.maxHp * MEAL.heal));
    e.hp += n;
    Object.assign(e, { meal: null, mealCool: now + MEAL.again, fedUntil: now + MEAL.fedTime, fed: true });
    const body = m.s ? freed.find((v) => v.id === m.b) : others.find((o) => o.id === m.b);
    if (body) body.eaten = true;
    ev.push({ k: 'fed', x: e.x, y: e.y, n });
    return true;
  }
  if ((e.mealCool ?? -9) > now || e.fed || e.attack || e.rushTo || (e.z ?? 0) !== 0) return false;
  // A hero right on it gets the blow instead.
  if (heroes.some((h) => h.act !== 'down' && !h.out && Math.hypot(h.x - e.x, h.y - e.y) < MEAL.guard + e.radius)) return false;
  let best: Body | undefined, bd = Infinity;
  for (const b of bodies(others, freed)) {
    const d = Math.hypot(b.x - e.x, b.y - e.y);
    if (d <= MEAL.seek + e.radius && d < bd) (bd = d), (best = b);
  }
  if (!best) return false;
  if (bd <= MEAL.reach + e.radius) {
    e.meal = { b: best.id, ...(best.s ? { s: true } : {}), x: best.x, y: best.y, at: now, until: now + MEAL.time };
    ev.push({ k: 'meal', x: best.x, y: best.y });
    return true;
  }
  const go = wayTo(e, best.x, best.y), gd = Math.hypot(go.x - e.x, go.y - e.y) || 1;
  (e.fx = (go.x - e.x) / gd), (e.fy = (go.y - e.y) / gd);
  walk(e, e.fx, e.fy, pace, dt);
  return true;
}
