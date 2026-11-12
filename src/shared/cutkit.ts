/**
 * What every area of an instance is built with (shared/instances.ts): a map the size of the area, its way in
 * at the bottom and its gate at the top (areas run bottom to top, as a route does), lit by the hour of the
 * job, and its goblins put down as packs by hand. On the expedition kit (shared/expedkit.ts).
 */
import type { GameMap } from './arena.js';
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import type { Kit, P } from './expedkit.js';
import type { Job } from './jobs.js';
import { THEMES, type Foe, type RoomPlan } from './terrain.js';
import { lightFor, timeOf } from './timeofday.js';
import { INSTANCE } from './instancetune.js';

export interface AreaShape {
  name: string; w: number; h: number;
  /** Village ground (the rows) or rock (under the hill). */
  kind: 'village' | 'mine';
  /** Torches on the back wall, by x. */
  torches?: number[];
}

/** The area's map from what the kit laid: in at the bottom middle, the gate at the top middle; `more`, the area's own (a roped line). */
export function areaPlan(k: Kit, job: Job, a: AreaShape, more: Partial<GameMap> = {}): RoomPlan {
  const base = THEMES[a.kind], theme = lightFor(a.kind === 'mine' ? { ...base, moon: 0 } : base, a.kind, timeOf(job));
  const map: GameMap = {
    name: a.name, w: a.w, h: a.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers,
    torches: (a.torches ?? []).map((x) => ({ x, y: 0.2 })), theme, water: k.water, soil: k.soil, marks: k.marks,
    hero: { x: a.w / 2, y: a.h - 1.6 }, exit: { x: a.w / 2 - 1.3, y: 0, w: 2.6, h: 0.9 },
    ...(k.dead.length ? { npcs: k.dead } : {}),
    ...more,
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests };
}

/**
 * A pack: `roles` stood about `at`, in a loose ring (`r` across), all of pack `id`, led by an elite. `more` goes on
 * each (feeding at the dead, a task, asleep).
 */
export function pack(k: Kit, id: number, at: P, roles: Role[], r = 1.1, more: Partial<Foe> = {}): Foe[] {
  const lead = INSTANCE.leaders[Math.floor(k.rng.next() * INSTANCE.leaders.length)];
  return roles.map((role, i) => {
    const a = (i / roles.length) * Math.PI * 2 + id, f: Foe = { kind: 'scrapper', x: at.x + Math.cos(a) * r, y: at.y + Math.sin(a) * r * 0.7, pack: id, ...more };
    k.foes.push(cast(f, role));
    // The first of every pack of two or more leads it, an elite (INSTANCE.leaders).
    if (i === 0 && roles.length > 1) f.elite = [lead];
    return f;
  });
}

/** The named one keeping an area's gate: the area opens when it's dead (sim/goal.ts). */
export function keeper(k: Kit, id: number, at: P, role: Role, name: string, hp: number): Foe {
  const f = cast({ kind: 'scrapper', x: at.x, y: at.y, pack: id, name, hp }, role);
  k.foes.push(f);
  return f;
}

/** Someone the goblins killed, lying where they fell (the pack at them eats). */
export const body = (k: Kit, x: number, y: number, look = 'villager') => k.dead.push({ x, y, name: '', talk: 'dead', look, pose: 'corpse' });
