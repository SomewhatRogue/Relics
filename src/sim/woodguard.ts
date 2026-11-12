/**
 * The end of the wood (Kyle, 2026-11-04: "a guard on patrol come out to meet you, say some stuff and
 * take you to town"). Once the Stoker and its callers are dead, Orla of the watch comes along the road
 * from the west, walks up to you and says her piece (the world held, a box at a time), stoops by Hew
 * for his tally stick, and leads you west; the road out takes you to Wickhold once she's spoken.
 */
import { inArea, type Npc } from '../shared/arena';
import { ORLA } from '../shared/orla';
import { ROAD_OUT } from '../shared/wood';
import { isDead } from './damage';
import type { ArenaRoom } from './room';
import type { Hero } from './types';
import type { WoodState } from './wood';
import { say } from './woodkit';

export interface Guard {
  /** Coming up the road, talking, stooping by Hew for the stick, leading you west. */
  phase: 'come' | 'talk' | 'stick' | 'lead';
  /** Lines said so far, and seconds stooped. */
  said: number;
  t: number;
}

export const orla = (room: ArenaRoom): Npc | undefined => room.map.npcs?.find((n) => n.talk === 'orla');
/** Has she said her piece (so the road out takes you to town)? */
export const spoken = (w: WoodState): boolean => !w.relic || w.guard?.phase === 'stick' || w.guard?.phase === 'lead';

/** Walk her toward (x, y), through the gap west of the hut if the hut's on the other side of it. True once there. */
function walk(n: Npc, x: number, y: number, dt: number): boolean {
  const g = ORLA.gate, cross = (n.x < g.x + 1) !== (x < g.x + 1) && Math.abs(n.x - g.x - 1) > 0.3;
  const [tx, ty] = cross ? [g.x + 1, g.y] : [x, y], dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
  if (d < 0.05 && !cross) return (n.walking = false), true;
  const k = Math.min(d, ORLA.speed * dt) / (d || 1);
  Object.assign(n, { x: n.x + dx * k, y: n.y + dy * k, walking: true, fx: dx / (d || 1), fy: dy / (d || 1) });
  return false;
}

/** Turn her to face (x, y), standing. */
const face = (n: Npc, x: number, y: number) => {
  const l = Math.hypot(x - n.x, y - n.y) || 1;
  Object.assign(n, { fx: (x - n.x) / l, fy: (y - n.y) / l, walking: false });
};

export function stepGuard(w: WoodState, room: ArenaRoom, h: Hero, dt: number): void {
  if (!w.relic) return;
  let n = orla(room);
  if (!n) {
    // She waits until the Stoker's callers are dead too.
    if (room.enemies.some((e) => w.ids.includes(e.id) && !isDead(e))) return;
    // Along the road, out of sight to the west of you.
    n = { x: Math.max(2, Math.min(ROAD_OUT.x + ROAD_OUT.w, h.x - 12)), y: ORLA.roadY, name: ORLA.name, talk: 'orla', look: 'guard', walking: true, fx: 1, fy: 0 };
    (room.map.npcs ??= []).push(n);
    w.guard = { phase: 'come', said: 0, t: 0 };
  }
  const g = w.guard!;
  if (g.phase === 'come') {
    const far = Math.hypot(h.x - n.x, h.y - n.y) > ORLA.near;
    if (far) return void walk(n, h.x - (h.x >= n.x ? ORLA.near - 0.3 : 0.3 - ORLA.near), h.y, dt);
    face(n, h.x, h.y);
    const l = Math.hypot(n.x - h.x, n.y - h.y) || 1;
    Object.assign(h, { fx: (n.x - h.x) / l, fy: (n.y - h.y) / l });
    g.phase = 'talk';
  }
  if (g.phase === 'talk') {
    // Her lines as a strip that doesn't stop anything; a tap skips one.
    if (w.caption && w.caption.until > room.time) return;
    if (g.said < ORLA.meet.length) return void say(w, room, ORLA.who, ORLA.meet[g.said++], 3);
    g.phase = 'stick';
  }
  if (g.phase === 'stick') {
    // Down beside Hew a moment for the stick on his belt (if he's lying where she can reach him).
    const body = room.map.npcs?.find((x) => x.talk === 'hewdead');
    if (body && !walk(n, body.x - 0.9, body.y + 0.5, dt)) return;
    if (body && (g.t += dt) < ORLA.stoop) return void Object.assign(n, { sneak: true, fx: 1, fy: 0 });
    n.sneak = false;
    g.phase = 'lead';
  }
  // West, to the road out and on; you follow.
  walk(n, ROAD_OUT.x - 4, ROAD_OUT.y + ROAD_OUT.h / 2, dt);
}

/** At the road out, once she's spoken: on to Wickhold. */
export const outOfWood = (w: WoodState, h: Hero): boolean => spoken(w) && inArea(ROAD_OUT, h.x, h.y);
