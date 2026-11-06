/**
 * The Hornblower (numbers: shared/elites.ts ELITE.horn). Brought down to half its health with a hero near,
 * it stands and blows its horn: a channel of ELITE.horn.time, drawn on it (the horn up, the call going out)
 * and at the spot its small ones will come from, so you see it coming. That spot is the room's edge on
 * your screen nearest the Hornblower (if the room's edge is off your screen, the screen's own edge), never
 * within ELITE.horn.clear of a hero: they run in from there, not out of thin air beside you. Blown, three
 * small ones come from it; cut off (sim/hornstate.ts), none, and it never blows again. Pure geometry: no dice.
 */
import { collide, currentMap } from '../shared/arena';
import { ELITE, PARTY_TOUGH } from '../shared/tuning';
import { held, isDead } from './damage';
import { hasAffix } from './elite';
import type { World } from './elements';
import { calling, cutCall } from './hornstate';
import type { Enemy, Hero } from './types';

type P = { x: number; y: number };
const up = (h: Hero) => h.act !== 'down' && !h.out;

/** Free ground for a small goblin at (x, y): nothing there pushes it off. */
function free(x: number, y: number): boolean {
  const q = { x, y, z: 0 };
  collide(q, 0.4);
  return Math.hypot(q.x - x, q.y - y) < 0.05;
}

/**
 * Where its call comes from: of the four edges of the room as seen from `t` (the room's own where it's on
 * their screen, ELITE.horn.screen tiles each way; else that screen's edge), the free spot nearest the
 * Hornblower and at least ELITE.horn.clear from every hero; failing all of that, a step behind it.
 */
export function callSpot(e: Enemy, t: Hero, heroes: Hero[]): P {
  const m = currentMap(), [sx, sy] = ELITE.horn.screen, c = ELITE.horn.clear;
  const x0 = Math.max(1, t.x - sx), x1 = Math.min(m.w - 1, t.x + sx), y0 = Math.max(1.6, t.y - sy), y1 = Math.min(m.h - 1, t.y + sy);
  const cx = (v: number) => Math.max(x0, Math.min(x1, v)), cy = (v: number) => Math.max(y0, Math.min(y1, v));
  // Each edge: a point on it, which way runs along it, and whether it's the room's own (preferred).
  const edges: [P, P, boolean][] = [
    [{ x: x0, y: cy(e.y) }, { x: 0, y: 1 }, x0 <= 1],
    [{ x: x1, y: cy(e.y) }, { x: 0, y: 1 }, x1 >= m.w - 1],
    [{ x: cx(e.x), y: y0 }, { x: 1, y: 0 }, y0 <= 1.6],
    [{ x: cx(e.x), y: y1 }, { x: 1, y: 0 }, y1 >= m.h - 1],
  ];
  let best: P | null = null, bd = Infinity;
  for (const [p, a, own] of edges) for (let k = 0; k <= 16; k++) {
    const s = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.5, q = { x: p.x + a.x * s, y: p.y + a.y * s };
    if (q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1 || !free(q.x, q.y) || heroes.some((h) => up(h) && Math.hypot(h.x - q.x, h.y - q.y) < c)) continue;
    const d = Math.hypot(q.x - e.x, q.y - e.y) + (own ? 0 : 4);
    if (d < bd) (bd = d), (best = q);
    break;
  }
  if (best) return { x: +best.x.toFixed(2), y: +best.y.toFixed(2) };
  const d = Math.hypot(e.x - t.x, e.y - t.y) || 1;
  return { x: +(e.x + ((e.x - t.x) / d) * 2).toFixed(2), y: +(e.y + ((e.y - t.y) / d) * 2).toFixed(2) };
}

/** Once a tick, after the goblins move: calls begun, cut off, or blown. `spawn` makes a goblin in the room. */
export function stepCalls(w: World, spawn: (x: number, y: number) => Enemy): void {
  const { now, ev, heroes } = w;
  for (const e of w.enemies) {
    if (!hasAffix(e, 'horn')) continue;
    const c = e.call;
    if (c && !c.cut && !c.blown) {
      // Burst down, stunned, frozen, netted or knocked off balance: cut off.
      if (isDead(e) || held(e, now) || e.act === 'flinch') cutCall(e, now, ev);
      else if (now >= c.until - 1e-6) blow(e, w, spawn);
      continue;
    }
    if (c || isDead(e) || e.alert === false || e.held || e.act === 'attack' || e.act === 'flinch' || held(e, now) || e.hp > e.maxHp * ELITE.horn.at) continue;
    const near = heroes.filter((h) => up(h) && (h.z ?? 0) === (e.z ?? 0) && Math.hypot(h.x - e.x, h.y - e.y) <= ELITE.horn.near);
    if (!near.length) continue;
    const t = near.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a));
    e.call = { at: +now.toFixed(3), until: +(now + ELITE.horn.time).toFixed(3), ...callSpot(e, t, heroes) };
    Object.assign(e, { attack: null, act: 'chase', kvx: 0, kvy: 0 });
    ev.push({ k: 'horn', x: e.x, y: e.y });
  }
}

/** It stands with the horn up, turned to the nearest hero (sim/enemies.ts gives it this turn while it calls). */
export function standCall(e: Enemy, heroes: Hero[]): void {
  const t = heroes.filter(up).reduce<Hero | null>((a, b) => (!a || Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a), null);
  if (!t) return;
  const d = Math.hypot(t.x - e.x, t.y - e.y) || 1;
  (e.fx = (t.x - e.x) / d), (e.fy = (t.y - e.y) / d);
}

/** Blown: its small ones in from the spot, side by side across the way they're coming, awake and after you. */
function blow(e: Enemy, w: World, spawn: (x: number, y: number) => Enemy): void {
  const c = e.call!, d = Math.hypot(e.x - c.x, e.y - c.y) || 1, px = -(e.y - c.y) / d, py = (e.x - c.x) / d;
  const n = Math.max(1, Math.min(4, w.heroes.filter((h) => h.id !== 'squire').length)) - 1;
  c.blown = true;
  for (let i = 0; i < ELITE.horn.call; i++) {
    const q = { x: c.x + px * (i - 1) * 0.7, y: c.y + py * (i - 1) * 0.7, z: 0 };
    collide(q, 0.34);
    const g = spawn(q.x, q.y);
    Object.assign(g, { role: 'fodder', alert: true, ...(e.pack !== undefined ? { pack: e.pack } : {}) });
    // A party's are as tough as the rest of the room's (shared/threat.ts PARTY_TOUGH).
    if (n) (g.hp = g.maxHp = Math.round(g.maxHp * PARTY_TOUGH.hp[n])), (g.harm = +((g.harm ?? 1) * PARTY_TOUGH.harm[n]).toFixed(3));
  }
  w.ev.push({ k: 'called', x: c.x, y: c.y });
}

export { calling };
