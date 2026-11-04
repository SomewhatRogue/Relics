/**
 * Off the edge of the world. A hero out of bounds (shared/reach.ts: past the map's edge, inside
 * something solid, on ground nobody can walk to, or somewhere the room forbids) feels something notice
 * them: the dread builds a second a second, the warning at once and worse at DREAD.late. Still out at
 * DREAD.take, they're seized, and DREAD.crush later crushed where they stand (wild places: something
 * huge in the dark) or pulled down (settled ones: the hungry pour out of the dark). Downed under the
 * party's usual rules, and the body is put back on the last spot they stood in bounds, so nothing is
 * gained. Back in bounds the dread drains fast. Town and the yard never kill: out a moment, you're set back.
 *
 * The room judges it all (the leader's room, online, so a friend's hero is caught there too); every
 * screen draws it from the hero's `dread`, `dreadBy` and `takenT` and the `dread` events.
 */
import type { Area, GameMap } from '../shared/arena';
import { outOfBounds } from '../shared/reach';
import { DREAD, HERO } from '../shared/tuning';
import { release } from './grab';
import { players } from './party';
import type { Enemy, FightEvent, Hero } from './types';

export type DreadBy = 'shadow' | 'swarm' | 'setback';
/** What a room does to someone out of bounds: what comes, any ground it forbids, and where else counts as the way in. */
export interface DreadRule { by: DreadBy; forbid?: Area[]; seeds?: { x: number; y: number }[] }

/** The last spot each hero stood in bounds, and on which map (a hero carried into a new room starts over). */
const safe = new WeakMap<Hero, { map: GameMap; x: number; y: number; z: number }>();
export const safeSpot = (h: Hero) => safe.get(h);

/** 0 in bounds, 1 the warning, 2 worse, 3 taken. */
export const dreadStage = (d: number) => (d <= 0 ? 0 : d < DREAD.late ? 1 : d < DREAD.take ? 2 : 3);

export function stepDread(rule: DreadRule | null, map: GameMap, heroes: Hero[], enemies: Enemy[], dt: number, ev: FightEvent[]): void {
  if (!rule) return;
  for (const h of players(heroes)) {
    if ((h.takenT ?? -1) >= 0) {
      taken(h, rule.by, map, dt, ev);
      continue;
    }
    const was = h.dread ?? 0, down = h.act === 'down' || !!h.out;
    const out = !down && outOfBounds(map, h.x, h.y, h.z ?? 0, rule.forbid, rule.seeds);
    if (!out) {
      if (!down) safe.set(h, { map, x: h.x, y: h.y, z: h.z ?? 0 });
      if (was > 0) {
        h.dread = Math.max(0, was - dt * DREAD.lift);
        if (!h.dread) say(h, 0, rule.by, ev);
      }
      continue;
    }
    const d = (h.dread = was + dt);
    h.dreadBy = rule.by;
    if (rule.by === 'setback') {
      if (!was) say(h, 1, rule.by, ev);
      if (d >= DREAD.setback) (say(h, 5, rule.by, ev), putBack(h, map));
      continue;
    }
    const a = dreadStage(was), b = dreadStage(d);
    if (b > a) say(h, b, rule.by, ev);
    if (b === 3) seize(h, enemies, ev);
  }
}

const say = (h: Hero, n: number, by: DreadBy, ev: FightEvent[]) => ev.push({ k: 'dread', x: h.x, y: h.y, id: h.id, n, by });

/** Held where they stand: nothing they press does anything now. */
function seize(h: Hero, enemies: Enemy[], ev: FightEvent[]): void {
  if (h.carrying) release(h, enemies, ev);
  Object.assign(h, { takenT: 0, act: 'stun', actT: 0, actDur: 99, kvx: 0, kvy: 0, blocking: false, moving: false });
}

function taken(h: Hero, by: DreadBy, map: GameMap, dt: number, ev: FightEvent[]): void {
  const t = (h.takenT = (h.takenT ?? 0) + dt);
  Object.assign(h, { act: 'stun', actT: 0, kvx: 0, kvy: 0 });
  if (t < DREAD.crush) return;
  // Crushed where they stood (drawn there), then the body back where they last stood in bounds, down.
  say(h, 4, by, ev);
  putBack(h, map);
  h.takenT = -1;
  Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: HERO.respawn, kvx: 0, kvy: 0 });
  ev.push({ k: 'down', x: h.x, y: h.y, id: h.id });
}

function putBack(h: Hero, map: GameMap): void {
  const s = safe.get(h), at = s && s.map === map ? s : { ...map.hero, z: 0 };
  Object.assign(h, { x: at.x, y: at.y, z: at.z, dread: 0, kvx: 0, kvy: 0 });
  if (h.act !== 'down' && h.act !== 'stun') Object.assign(h, { act: 'idle', actT: 0 });
}
