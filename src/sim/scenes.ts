/**
 * Layout 4's scenes as rules of the room (shared/scenes4.ts lays them out; sim/tasks.ts moves the
 * goblins in them). A house the torch-bearers are at catches as they keep at it (the ring at its woodpile
 * is how far: the house goes up when it's full); once it's alight, someone caged inside can still be
 * dragged out of its door by a hero who stands at it (alight and hurt). Prisoners on their rope walk for
 * the far way out while any guard still drives them; with every guard dead they're freed (bring them
 * out as anyone freed); at the way out they're gone. Oil a wrecked cart spilled lies from the start.
 */
import { currentMap, doorAt, type GameMap } from '../shared/arena';
import { atArc } from '../shared/scenes4';
import { SCENE } from '../shared/tuning';
import { isDead } from './damage';
import type { World } from './elements';
import { players } from './party';
import { freeSurvivor } from './survivors';
import type { Slick } from './oil';
import type { Survivor } from './types';

/** The prisoners as the room begins, on their rope behind the front guard; the scene's oil on the floor. */
export function initScenes(map: GameMap, survivors: Survivor[], now: number): Slick[] {
  const led = map.led;
  if (led) for (let i = 0; i < led.n; i++) {
    const s = 1.4 + i * 0.8, p = atArc(led.pts, s), v = freeSurvivor(survivors, p.x, p.y, now);
    v.led = { s };
  }
  return (map.oil ?? []).map((o, i) => ({ id: 900 + i, x: o.x, y: o.y, r: o.r, until: now + 1e6, lit: -1 }));
}

/** A prisoner's turn on the rope (survivors.ts hands it over): true while still led. */
export function stepLed(s: Survivor, w: World, dt: number): boolean {
  const pts = currentMap().led?.pts;
  if (!s.led || !pts) return false;
  const guards = w.enemies.filter((e) => e.task?.k === 'escort' && !isDead(e));
  if (!guards.length) {
    // Every guard dead: they stand a moment, then follow whoever's near (survivors.ts).
    delete s.led;
    s.at = w.now;
    return false;
  }
  const driving = guards.some((e) => e.task?.k === 'escort' && !e.task.quit);
  s.moving = driving;
  if (driving) s.led.s += SCENE.led * dt;
  const p = atArc(pts, s.led.s);
  Object.assign(s, { x: p.x, y: p.y, fx: p.dx < -0.2 ? -1 : p.dx > 0.2 ? 1 : s.fx });
  if (p.end) {
    Object.assign(s, { taken: true, gone: true, moving: false });
    delete s.led;
    w.ev.push({ k: 'ledoff', x: s.x, y: s.y });
  }
  return true;
}

/** Each tick: the torch-bearers' house catching, and anyone dragged out of a house alight. */
export function stepScenes(map: GameMap, w: World, dt: number): void {
  for (const b of map.blocks) {
    if (b.held === undefined || b.ruined) continue;
    if (b.torched !== undefined && (b.burning ?? -1) < 0) {
      // Catching while a torch-bearer is at its wall; alight when the ring is full.
      const wall = (x: number, y: number) => Math.hypot(x - Math.max(b.x, Math.min(b.x + b.w, x)), y - Math.max(b.y, Math.min(b.y + b.h, y)));
      const at = w.enemies.some((e) => !isDead(e) && e.task?.k === 'kindle' && !e.task.quit && wall(e.x, e.y) < 1.1);
      if (!at) continue;
      b.torched = Math.min(1, b.torched + dt / SCENE.kindle);
      if (b.torched < 1) continue;
      Object.assign(b, { torched: undefined, burning: w.now });
      w.ev.push({ k: 'houselit', x: b.x + b.w / 2, y: b.y + b.h, by: '' }, { k: 'blaze', x: b.x + b.w / 2, y: b.y + b.h / 2 });
      continue;
    }
    // Alight with someone still in there (and the leader's game hasn't said they're out): drag them out of the door.
    if ((b.burning ?? -1) < 0 || (b.held ?? 0) - (b.pulled ?? 0) <= 0 || b.cry === false) continue;
    const d = doorAt(b), h = players(w.heroes).find((q) => q.act === 'idle' && !q.moving && (q.z ?? 0) === 0 && Math.hypot(q.x - d.x, q.y - d.y) <= SCENE.pullReach);
    if (!h) {
      if (b.pullT) b.pullT = 0;
      continue;
    }
    b.pullT = (b.pullT ?? 0) + dt;
    if (b.pullT < SCENE.pull) continue;
    Object.assign(b, { pullT: 0, pulled: (b.pulled ?? 0) + 1 });
    const s = freeSurvivor(w.survivors ?? [], d.x, d.y + 0.7, w.now);
    // Out of the smoke burning, hurt by it.
    Object.assign(s, { hp: Math.max(1, s.hp - 6), burnUntil: w.now + 1.5, burnNext: w.now + 0.5 });
    w.ev.push({ k: 'pulled', x: s.x, y: s.y });
  }
}
