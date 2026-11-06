/**
 * Kiting answered (Kyle, 2026-11-05: "it's a bit too easy to kite right now"; numbers shared/threat.ts
 * SPRINT, LEAP, FLANK, RANGED). All of it telegraphed and none of it from off screen:
 * - the sprint: chasing the same hero SPRINT.after seconds without getting into reach, a goblin leans
 *   and kicks up dust (SPRINT.lean, slowed: the tell), then bursts at SPRINT.pace for SPRINT.burst;
 * - flankers: in a pack chasing one hero, every second goblin by its place goes wide and ahead of where
 *   a running hero is going, to cut them off, instead of filing after the rest;
 * - a running hero: one moving away from a goblin (a lunger leaps at them: sim/enemies.ts), or out in
 *   the open with nothing solid near (archers, netters and oil throwers aim at them first).
 * Only in a job's or an expedition's rooms (OWN_KIT.pace), so the wood's lessons and the yard play as taught.
 */
import { currentMap } from '../shared/arena';
import { FLANK, RANGED, SPRINT } from '../shared/tuning';
import { isDead } from './damage';
import type { Enemy, Hero } from './types';

/** Running from `e`: moving, and facing away from it (a hero faces where they walk unless they aim). */
export const fleeing = (h: Hero, e: { x: number; y: number }) => {
  if (!h.moving || h.act === 'down') return false;
  const dx = h.x - e.x, dy = h.y - e.y, l = Math.hypot(dx, dy) || 1;
  return (h.fx * dx + h.fy * dy) / l > 0.5;
};

/** Running out in the open: moving, with no block, house or wall within RANGED.cover. */
export function inOpen(h: Hero): boolean {
  if (!h.moving || h.act === 'down') return false;
  const m = currentMap(), c = RANGED.cover;
  return !m.blocks.some((b) => h.x > b.x - c && h.x < b.x + b.w + c && h.y > b.y - c && h.y < b.y + b.h + c);
}

/** How a ranged goblin weighs a hero's distance: one running in the open counts RANGED.pull nearer. */
export const rangedPull = (e: Enemy, h: Hero) => ((e.bow || e.variant === 'netter' || e.variant === 'oiler') && inOpen(h) ? RANGED.pull : 0);

/**
 * The chase clock, once a tick while it walks after `t` (out of reach). Starts when it takes up a hero;
 * `in reach` stops it. Then, chasing long enough and near enough, the lean begins (`sprintAt`).
 */
export function chaseOn(e: Enemy, t: Hero, d: number, reach: number, level: boolean, now: number): void {
  if (d <= reach * 1.2) {
    if (e.chaseAt !== undefined && e.chaseAt <= now) delete e.chaseAt;
    return;
  }
  if (e.chaseOn !== t.id) (e.chaseOn = t.id), (e.chaseAt = now);
  else if (e.chaseAt === undefined) e.chaseAt = now;
  if (level && now - e.chaseAt >= SPRINT.after && d < SPRINT.near && !sprinting(e, now)) {
    e.sprintAt = now;
    // Winded after: the next can come SPRINT.after seconds after this one is over.
    e.chaseAt = now + SPRINT.lean + SPRINT.burst;
  }
}

/** Its sprint now: 'lean' (the tell), 'burst', or false. */
export function sprinting(e: Enemy, now: number): 'lean' | 'burst' | false {
  const k = now - (e.sprintAt ?? -99);
  return k < 0 ? false : k < SPRINT.lean ? 'lean' : k < SPRINT.lean + SPRINT.burst ? 'burst' : false;
}

/** Its pace multiplier from the sprint (and the pace back to plain otherwise). */
export function sprintPace(e: Enemy, now: number): number {
  const s = sprinting(e, now);
  return s === 'lean' ? SPRINT.leanPace : s === 'burst' ? SPRINT.pace : 1;
}

/** Who flanks this tick: goblin id to its side (1 or -1). Rebuilt by `flankers` once a tick. */
const FLANKS = new Map<number, number>();

/** Once a tick, before the goblins move: in each pack chasing one hero with FLANK.from or more, every second one by id flanks. */
export function flankers(enemies: Enemy[], heroes: Hero[]): void {
  FLANKS.clear();
  const by = new Map<string, Enemy[]>();
  for (const e of enemies) {
    if (e.pack === undefined || isDead(e) || e.alert === false || e.held || e.bow || e.kind !== 'scrapper' || !e.chaseOn) continue;
    if (e.variant && e.variant !== 'lunger' && e.variant !== 'shield') continue;
    const k = e.pack + ':' + e.chaseOn;
    (by.get(k) ?? by.set(k, []).get(k)!).push(e);
  }
  for (const es of by.values()) {
    if (es.length < FLANK.from || !heroes.some((h) => h.id === es[0].chaseOn)) continue;
    es.sort((a, b) => a.id - b.id).forEach((e, i) => i % 2 === 1 && FLANKS.set(e.id, Math.floor(i / 2) % 2 ? -1 : 1));
  }
}

/** Where a flanker makes for instead of the hero (null: straight at them). */
export function flankTo(e: Enemy, t: Hero, d: number): { x: number; y: number } | null {
  const side = FLANKS.get(e.id);
  if (!side || d < FLANK.close) return null;
  // Round from the line between them, and ahead of where a running hero is going.
  const a = Math.atan2(e.y - t.y, e.x - t.x) + side * FLANK.angle, r = Math.min(d * 0.6, 3);
  const lead = t.moving ? FLANK.lead : 0;
  return { x: t.x + Math.cos(a) * r + t.fx * lead, y: t.y + Math.sin(a) * r + t.fy * lead };
}
