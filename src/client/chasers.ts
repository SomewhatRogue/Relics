/**
 * Goblins on your trail that you can't see (Kyle, 2026-11-03): a red point at the screen's edge toward
 * each one chasing or swinging within `CHASE.reach` tiles but off screen, and a count, "3 CHASING", at
 * the top. Drawn in both views (scene.ts, three/overlay3d.ts). Drawing only.
 */
import type { ArenaRoom } from '../sim/room';
import type { Enemy } from '../sim/types';
import { isDead } from '../sim/damage';

export const CHASE = { reach: 22, red: '#ff5a48' };

/** Goblins awake and coming (chasing or swinging) near `me`. */
export function chasers(room: ArenaRoom, me: { x: number; y: number }): Enemy[] {
  return room.enemies.filter((e) => !isDead(e) && !e.dozing && e.alert !== false && !e.held && (e.act === 'chase' || e.act === 'attack') && Math.hypot(e.x - me.x, e.y - me.y) < CHASE.reach);
}

export const chaseLabel = (n: number) => `${n} CHASING`;

/** A small solid point at (x, y) aimed along (ux, uy). */
export function chasePoint(g: CanvasRenderingContext2D, x: number, y: number, ux: number, uy: number): void {
  g.fillStyle = CHASE.red;
  for (let k = 0; k < 4; k++) for (let w = -(3 - k); w <= 3 - k; w++) g.fillRect(Math.round(x + ux * k - uy * w), Math.round(y + uy * k + ux * w), 1, 1);
}
