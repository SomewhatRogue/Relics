/**
 * THE LAMPMAN's lamps on screen (sim/lampman.ts): each hung on its post, lit (a flame on the glow and its pool of
 * light, LAMP.r across) or out (dark glass); the one it's snuffing gutters. Which are lit is the Lampman's own
 * (`lamps`), so every screen has the same.
 */
import type { GameMap } from '../shared/arena';
import { LAMP } from '../shared/tuning';
import type { Enemy } from '../sim/types';
import { lampsLit } from '../sim/lampman';
import { flame } from './lampsdraw';
import type { Ctx } from './draw';
import { OX, OY, PX } from './world';

const BRASS = '#9a7a3a', BRASS_HI = '#c8a65a', GLASS = '#2a2630', SOOT = '#1a1612';

/** The lamp `i` is being snuffed (the Lampman stood at it). */
const snuffing = (enemies: Enemy[], i: number) => enemies.some((e) => e.lamps?.at === i && e.lamps.snuffT !== undefined);

/** The lamps as scene items, sorted with the bodies by their posts. */
export function lampItems(c: Ctx, map: GameMap, enemies: Enemy[], cx: number, cy: number, now: number): { y: number; draw: () => void }[] {
  const L = map.lamps ?? [], lit = lampsLit(enemies, L.length);
  return L.map((l, i) => ({
    // (Just in front of its post, so the lamp hangs over it.)
    y: OY + l.y * PX + 0.5,
    draw: () => {
      // (Hung near the top of its post, which the art pass made tall; a cage you can read across the room.)
      const x = Math.round(OX + l.x * PX - cx), y = Math.round(OY + l.y * PX - cy) - 34, g = c.lit;
      g.fillStyle = SOOT, g.fillRect(x - 6, y - 10, 13, 1), g.fillRect(x, y - 9, 1, 3);
      g.fillStyle = BRASS, g.fillRect(x - 5, y - 6, 11, 3), g.fillRect(x - 5, y - 3, 2, 11), g.fillRect(x + 4, y - 3, 2, 11), g.fillRect(x - 6, y + 8, 13, 3);
      g.fillStyle = lit[i] ? '#8a6a30' : GLASS, g.fillRect(x - 3, y - 3, 7, 11);
      g.fillStyle = BRASS_HI, g.fillRect(x - 5, y - 6, 2, 1), g.fillRect(x - 6, y + 8, 2, 1), g.fillRect(x, y - 3, 1, 11);
      if (!lit[i]) {
        // Dark: its edge faint on the glow layer, so it reads as a lamp to light (BURN).
        const e = c.glow;
        e.globalAlpha = 0.3 + 0.12 * Math.sin(now * 2.4 + i);
        e.fillStyle = '#cfc6ae';
        e.fillRect(x - 7, y - 7, 15, 1), e.fillRect(x - 7, y + 11, 15, 1), e.fillRect(x - 7, y - 7, 1, 19), e.fillRect(x + 7, y - 7, 1, 19);
        e.globalAlpha = 1;
        return;
      }
      // Guttering while it's snuffed: the flame shrinks and jumps.
      const gut = snuffing(enemies, i);
      if (!gut || Math.floor(now * 14) % 3) flame(c.glow, x, y + 5, now, gut ? 1 : 3), (c.glow.fillStyle = '#ffd27a'), c.glow.fillRect(x - 2, y + 1, 5, 5);
    },
  }));
}

/** The lit lamps' light, for the scene's light pass (map units; scene.ts turns them to the screen). */
export function lampLights(map: GameMap, enemies: Enemy[], now: number): { x: number; y: number; r: number; i: number; c: [number, number, number] }[] {
  const L = map.lamps ?? [], lit = lampsLit(enemies, L.length);
  return L.flatMap((l, i) => (lit[i] ? [{ x: l.x, y: l.y - 1.6, r: LAMP.r * 1.6, i: snuffing(enemies, i) ? 0.5 + 0.5 * Math.abs(Math.sin(now * 23)) : 1.25, c: [1, 0.7, 0.38] as [number, number, number] }] : []));
}
