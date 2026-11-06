/**
 * What a layout-4 goblin is busy at when you come in (shared/scenes4.ts sets it): a torch-bearer holds
 * its torch to a house's wall, a guard walks the prisoners' rope for the far way out, a patrol walks its
 * round, two haul a body to their fire, a chalker chalks the captives up on its tally board. The torch-bearers and the guards keep at it even once they've
 * seen you (it's the race you're in) until you come close or hit them; a patrol and the haulers look
 * about as any goblin at rest does, and drop what they're doing when they see you. Rolls nothing.
 */
import { currentMap } from '../shared/arena';
import { SCENE } from '../shared/tuning';
import { atArc } from '../shared/scenes4';
import { isDead } from './damage';
import { walk } from './enemies';
import { players } from './party';
import { wayTo } from './pathing';
import type { Enemy, FightEvent, Hero } from './types';

/** A hero close by, or a blow just now: it stops what it's doing. */
const pulledOff = (e: Enemy, heroes: Hero[], now: number) => now - e.hitAt < 0.3 || players(heroes).some((h) => h.act !== 'down' && Math.hypot(h.x - e.x, h.y - e.y) < SCENE.stay);

/** Toward (x, y) round water and hedges at `speed`; true once there. */
function goTo(e: Enemy, x: number, y: number, speed: number, dt: number): boolean {
  const d = Math.hypot(x - e.x, y - e.y);
  if (d < 0.35) return true;
  const g = wayTo(e, x, y), gx = g.x - e.x, gy = g.y - e.y, gl = Math.hypot(gx, gy) || 1;
  (e.fx = gx / gl), (e.fy = gy / gl);
  walk(e, gx, gy, Math.min(speed, d / dt), dt);
  return false;
}

/**
 * Its task's turn, before it looks about as goblins at rest do (true: done for this tick). `notice`
 * runs the ordinary look about (a patrol and the haulers see you as any goblin does).
 */
export function stepTask(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[], notice: () => boolean): boolean {
  const t = e.task;
  if (!t || isDead(e)) return false;
  if (t.k === 'kindle' || t.k === 'escort') {
    if (t.quit) return false;
    if (pulledOff(e, heroes, now)) return (t.quit = true), (e.alert = true), (e.feeding = false), false;
    if (t.k === 'kindle') {
      // Done once the house is alight (or gone): then it's a goblin like the rest.
      const b = currentMap().blocks.find((q) => q.torched !== undefined && Math.hypot(q.x + q.w / 2 - t.x, q.y + q.h / 2 - t.y) < q.w);
      if (!b) return (t.quit = true), false;
      if (goTo(e, t.x, t.y, SCENE.patrol, dt)) {
        const dx = b.x + b.w / 2 - e.x, dy = b.y + b.h / 2 - e.y, l = Math.hypot(dx, dy) || 1;
        (e.fx = dx / l), (e.fy = dy / l);
      }
      return true;
    }
    // A guard: along the rope's path with the prisoners, a step to one side; out of the room with them at its end.
    const pts = currentMap().led?.pts;
    if (!pts) return (t.quit = true), false;
    t.s += SCENE.led * dt;
    const p = atArc(pts, t.s);
    Object.assign(e, { x: p.x - p.dy * t.off, y: p.y + p.dx * t.off, fx: p.dx, fy: p.dy, moving: true });
    if (p.end) {
      Object.assign(e, { act: 'dead', actT: 99, hp: 0, attack: null, escaped: true, respawns: false, death: '' });
      ev.push({ k: 'escaped', x: e.x, y: e.y });
    }
    return true;
  }
  if (e.alert !== false) return false;
  if (notice()) {
    if (t.k === 'haul') t.quit = true;
    return false;
  }
  // A chalker at its tally board, chalking up the captives till it sees you (shared/chalkstage.ts).
  if (t.k === 'tally') {
    const dx = t.x - e.x, dy = t.y - e.y, l = Math.hypot(dx, dy) || 1;
    return (e.fx = dx / l), (e.fy = dy / l), true;
  }
  if (t.k === 'patrol') {
    // Its round: on to the next point, and past one it can't get nearer to.
    const [x, y] = t.pts[t.i], d = Math.hypot(x - e.x, y - e.y);
    if (d < (t.best ?? Infinity) - 0.05) (t.best = d), (t.stuck = 0);
    else t.stuck = (t.stuck ?? 0) + dt;
    if (goTo(e, x, y, SCENE.patrol, dt) || (t.stuck ?? 0) > 3) (t.i = (t.i + 1) % t.pts.length), (t.best = undefined), (t.stuck = 0);
    return true;
  }
  // Hauling: the body comes along behind; at their fire it's dropped and they crouch at it.
  if (t.quit) return false;
  if (goTo(e, t.to[0], t.to[1], SCENE.haul, dt)) {
    t.quit = true;
    e.feeding = true;
    return true;
  }
  if (e.haul) Object.assign(e.haul, { x: e.x - e.fx * 0.9, y: e.y - e.fy * 0.9 });
  return true;
}
