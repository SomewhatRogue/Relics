/**
 * The world effects as effects (cosmetic; the room decides them all: shared/worldfx.ts). Lightning drawn
 * into an ironhide bends down into it from where it was going with a flash (ARMOR BROKEN is the 'cracked'
 * event's); a jolt through water flashes at each goblin it reached (the crackle across the water is
 * worlddraw.ts's, from the same event); a butcher sitting down to a body, taken off it, and up FED; a body
 * going up as ash; shallows icing over and melting; steam rising. In world pixels, so the 2.5D overlay
 * draws the same.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { notePool } from './worlddraw';
import { PX, toPx } from './world';

const SPARK = ['#ffffff', '#fff27a', '#cfe8ff'];
const ASH = ['#6a6470', '#8a8494', '#3a3640'];

/** True if it was one of these. */
export function worldFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'rodhit': {
      const [x2, y2] = toPx(ev.x2, ev.y2);
      // From up where it was going, bending into the iron.
      fx.arcs.push({ x, y: y - 60, x2: (x + x2) / 2, y2: (y + y2) / 2 - 40, life: 0.28, col: '#dff4ff' });
      fx.arcs.push({ x: (x + x2) / 2, y: (y + y2) / 2 - 40, x2, y2: y2 - 12, life: 0.28, col: '#ffffff' });
      fx.burst(x2, y2 - 12, 18, SPARK, 90, true);
      fx.flashes.push({ x: x2, y: y2 - 12, r: 70, i: 1.5, c: [0.8, 0.9, 1], life: 0.22, max: 0.22 });
      fx.shake = Math.max(fx.shake, 3);
      return true;
    }
    case 'pooljolt':
      notePool(ev);
      for (const [tx, ty] of ev.to) {
        const [px, py] = toPx(tx, ty);
        fx.burst(px, py - 6, 5, SPARK, 50, true);
        fx.flashes.push({ x: px, y: py - 4, r: 26, i: 0.7, c: [0.8, 0.9, 1], life: 0.12, max: 0.12 });
      }
      return true;
    case 'meal':
      fx.burst(x, y - 3, 6, ['#9a1414', '#c41a1a', '#6a0808'], 40, false, 200, true);
      return true;
    case 'mealbroken':
      fx.burst(x, y - 10, 8, ['#9a1414', '#6a0808', '#e8e4ee'], 60, false, 220, true);
      return true;
    case 'fed':
      fx.say(x, y - 44, 'GORGED', '#ff5a40', 1.1);
      fx.burst(x, y - 16, 22, ['#9a1414', '#c41a1a', '#ff5a40'], 90, false, 240, true);
      fx.rings.push({ x, y, life: 0.4, max: 0.4, col: '#e8352a', size: 18 });
      fx.flashes.push({ x, y: y - 12, r: 60, i: 0.8, c: [1, 0.25, 0.2], life: 0.25, max: 0.25 });
      fx.shake = Math.max(fx.shake, 2);
      return true;
    case 'ashed':
      // Up in a puff of ash and embers, grey left on the ground.
      fx.burst(x, y - 4, 16, ASH, 30, false, -40);
      fx.burst(x, y - 4, 8, ['#ff9a3c', '#ffd27a'], 40, true, -60);
      for (let i = 0; i < 10; i++) fx.decal(x - 5 + Math.random() * 10, y - 2 + Math.random() * 4, i % 2 ? '#4a4652' : '#5e5a66');
      return true;
    case 'iced': {
      const r = ev.r * PX;
      fx.burst(x, y - 2, Math.min(30, Math.round(ev.r * 10)), ['#ffffff', '#dff4ff', '#9fd8ff'], r * 1.5, true);
      fx.rings.push({ x, y, life: 0.3, max: 0.3, col: '#dff4ff', size: r });
      return true;
    }
    case 'thaw':
      fx.burst(x, y - 2, 10, ['#dff4ff', '#ffffff'], 40, true, -30);
      return true;
    case 'steamup':
      fx.burst(x, y - 6, 18, ['#ffffff', '#e8eef2', '#c8d0d8'], 50, false, -50);
      fx.rings.push({ x, y: y - 4, life: 0.3, max: 0.3, col: '#ffffff', size: ev.r * PX * 0.8 });
      return true;
  }
  return false;
}
