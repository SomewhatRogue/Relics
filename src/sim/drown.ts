/**
 * A goblin thrown into deep water (Kyle, 2026-11-27: "it splashes in, struggles and dies or is eaten by a fish"):
 * thrown (`flung`) and stopped by deep water, it goes in instead, a little past the edge; it struggles THROWN.drown
 * seconds and goes under, or a pike takes it first (the room's Rng says which, at the throw). It counts as a kill to
 * whoever threw it. Its body isn't left (death 'drown'). client/foemoves.ts and fx draw the splash and the struggle.
 */
import { currentMap, inArea } from '../shared/arena';
import type { Rng } from '../shared/rng';
import { THROWN } from '../shared/tuning';
import { kill } from './damage';
import type { Enemy, FightEvent } from './types';

/** Deep water a body is up against, going (vx, vy): the box, or null. */
export function deepAhead(e: Enemy, vx: number, vy: number): { x: number; y: number; w: number; h: number } | null {
  const l = Math.hypot(vx, vy) || 1, m = currentMap();
  const ax = e.x + (vx / l) * (e.radius + 0.35), ay = e.y + (vy / l) * (e.radius + 0.35);
  return (m.water ?? []).find((w) => w.deep && !w.span && inArea(w, ax, ay)) ?? null;
}

/** Still counting as thrown. */
export const flung = (e: Enemy, now: number) => (e.flung ?? -9) > now;

/** In it goes: a little past the edge, still, struggling; a pike's time drawn now. */
export function intoWater(e: Enemy, vx: number, vy: number, w: { x: number; y: number; w: number; h: number }, now: number, rng: Rng, ev: FightEvent[]): void {
  const l = Math.hypot(vx, vy) || 1;
  const x = Math.max(w.x + 0.3, Math.min(w.x + w.w - 0.3, e.x + (vx / l) * (e.radius + 0.7)));
  const y = Math.max(w.y + 0.3, Math.min(w.y + w.h - 0.3, e.y + (vy / l) * (e.radius + 0.7)));
  Object.assign(e, { x, y, kvx: 0, kvy: 0, air: 0, attack: null, act: 'stunned', actT: 0, actDur: THROWN.drown + 1, drownAt: now, flung: undefined });
  if (rng.next() < THROWN.fish) e.pike = now + THROWN.bite;
  ev.push({ k: 'splash', x, y });
}

/** A goblin in the water: true while it's there (its turn is the water's). It goes under, or the pike takes it. */
export function stepDrown(e: Enemy, now: number, ev: FightEvent[]): boolean {
  if (e.drownAt === undefined || e.act === 'dead') return false;
  e.kvx = e.kvy = 0;
  const fish = e.pike !== undefined && now >= e.pike;
  if (fish || now - e.drownAt >= THROWN.drown) {
    ev.push({ k: 'splash', x: e.x, y: e.y, ...(fish ? { fish: true } : { under: true }) });
    Object.assign(e, { drownAt: undefined, pike: undefined });
    kill(e, ev, 'drown');
    return true;
  }
  return true;
}
