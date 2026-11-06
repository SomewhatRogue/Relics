/**
 * Where a hound is drawn while it plays (idles.ts) or is petted (petting.ts), and the hound that walks
 * at another player's Ranger's heel in town (the town sends where players stand, not their hounds).
 * Positions are in tiles, so the flat scene and the 2.5D cards put the hound in the same place. Only
 * draws: the room's hound stays where the room has it.
 */
import { WEAPONS } from '../shared/tuning';
import type { Hero, Hound } from '../sim/types';
import { IDLE, idleFrame } from './idles';
import { LODGE_HOUND, PET, pettedBy, type Dog } from './petting';
import type { Mood } from './hound';

/** A hound's place this frame (tiles), the way it faces, how it looks; `down`: lying. */
export interface HoundAt { x: number; y: number; fx: number; mood: Mood; down: boolean }

const mix = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));
const wagOf = (now: number) => Math.floor(now * 10) % 2 === 0;
/** (A new one each call: the drawing keeps it until the frame's figures are sorted and drawn.) */
function at(x: number, y: number, fx: number, mood: Mood, down = false): HoundAt {
  return { x, y, fx: fx >= 0 ? 1 : -1, mood, down };
}
/** Running from (x0, y0) to (x1, y1) over [t0, t1]: where it is at `t`, facing the way it runs. */
function run(t: number, t0: number, t1: number, x0: number, y0: number, x1: number, y1: number, mood: Mood): HoundAt {
  const k = (t - t0) / (t1 - t0);
  return at(mix(x0, x1, k), mix(y0, y1, k), x1 - x0, { ...mood, moving: k > 0 && k < 1 });
}

/** The stick's way in a fetch (tiles from the hero): where it lands, and where the hound brings it. */
export const FETCH = { land: (s: number) => [s * IDLE.toss, 0.15], back: (s: number) => [s * 1.05, 0.1], ruffle: (s: number) => [s * 0.8, 0.1], fly: [0.4, 1.15], pick: 1.75, take: 3.9 } as const;

/**
 * A hero's own hound (the room's, at `ax, ay` drawn) while they play with it or pet it; null to draw it
 * where it is. `hx, hy`: where the hero is drawn.
 */
export function houndAt(h: Hero, ax: number, ay: number, hx: number, hy: number, now: number): HoundAt | null {
  const p = pettedBy([], 'own', h, now);
  if (p) return petted(p.t, ax, ay, hx, hy, false, now);
  const f = idleFrame(h, now);
  if (!f || !f.def.hound) return null;
  const t = f.t, s = f.side, wag = wagOf(now), [lx, ly] = FETCH.land(s), [rx, ry] = f.def.id === 'r_fetch' ? FETCH.back(s) : FETCH.ruffle(s);
  const L = [hx + lx, hy + ly], R = [hx + rx, hy + ry];
  if (f.def.id === 'r_fetch') {
    if (t < 0.5) return at(ax, ay, s, { sit: true, wag });
    if (t < 1.55) return run(t, 0.5, 1.55, ax, ay, L[0], L[1], {});
    if (t < 1.9) return at(L[0], L[1], s, { headDown: true, stick: t >= FETCH.pick, wag });
    if (t < 3) return run(t, 1.9, 3, L[0], L[1], R[0], R[1], { stick: true });
    if (t < 4.3) return at(R[0], R[1], -s, { sit: true, wag, stick: t < FETCH.take, happy: t >= FETCH.take });
    if (t < 5.5) return run(t, 4.3, 5.5, R[0], R[1], ax, ay, {});
    return at(ax, ay, s, { sit: true, wag });
  }
  if (f.def.id === 'r_ruffle') {
    if (t < 0.6) return run(t, 0, 0.6, ax, ay, R[0], R[1], {});
    if (t < 3.1) return at(R[0] - s * 0.06, R[1], -s, { wag, happy: true, lean: 1 });
    return run(t, 3.1, 3.8, R[0], R[1], ax, ay, {});
  }
  // The rare one: a play bow, a run, a leap, and the Ranger on the floor with the hound standing on them.
  const C = [hx + s * 0.3, hy + 0.05];
  if (t < 0.5) return at(ax, ay, hx - ax, { headDown: true, wag });
  if (t < 0.95) return run(t, 0.5, 0.95, ax, ay, C[0], C[1], {});
  if (t < 1.25) return at(mix(C[0], hx, (t - 0.95) / 0.3), C[1], hx - ax, { lift: Math.round(Math.sin(((t - 0.95) / 0.3) * Math.PI) * 6) });
  if (t < 3.6) return at(hx + s * 0.1, hy + 0.08, -s, { lift: 2, wag, lick: Math.floor(now * 4) % 3 === 0, happy: true });
  if (t < 4.2) return run(t, 3.6, 4.2, hx + s * 0.1, hy + 0.08, R[0], R[1], {});
  if (t < 5.4) return at(R[0], R[1], -s, { wag, happy: true });
  return run(t, 5.4, 6, R[0], R[1], ax, ay, {});
}

/** A hound being petted: up (if lying), in to lean on the hero, wagging; back where it was after. */
function petted(t: number, ax: number, ay: number, hx: number, hy: number, lies: boolean, now: number): HoundAt {
  const s = ax >= hx ? 1 : -1, tx = hx + s * 1, ty = hy + 0.05, wag = wagOf(now);
  if (t < 0.15 && lies) return at(ax, ay, -s, { wag }, true);
  if (t < 0.45) return run(t, lies ? 0.15 : 0, 0.45, ax, ay, tx, ty, {});
  if (t < PET.time - 0.4) return at(tx, ty, -s, { wag, happy: true, lean: 1 });
  return run(t, PET.time - 0.4, PET.time, tx, ty, ax, ay, { wag });
}

/** Maeve's hound in the lodge: lying by the fire, or up and leaning on whoever's petting it. */
export function lodgeHoundAt(heroes: readonly Hero[], now: number): HoundAt {
  const p = pettedBy(heroes, 'lodge' as Dog, null, now), d = LODGE_HOUND;
  // Lying by the fire, the tail thumping now and then.
  if (!p) return at(d.x, d.y, -1, { wag: Math.floor(now * 0.4) % 4 === 0 && wagOf(now) }, true);
  return petted(p.t, d.x, d.y, p.h.x, p.h.y, true, now);
}

/** The hound that walks with another player's Ranger in town (this screen's own, at their heel). */
const company = new Map<string, { d: Hound; at: number }>();
export function companion(h: Hero, now: number): Hound | null {
  if (WEAPONS[h.weapon].cls !== 'RANGER' || h.noHound) return null;
  const side = h.id.length % 2 ? 1 : -1, gx = h.x - h.fx * 1.1 - h.fy * side * 0.8, gy = h.y - h.fy * 1.1 + h.fx * side * 0.8 + 0.2;
  let c = company.get(h.id);
  if (!c || now - c.at > 2) company.set(h.id, (c = { d: { x: gx, y: gy, fx: h.fx, fy: h.fy, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false }, at: now }));
  const d = c.d, dt = Math.min(0.1, Math.max(0, now - c.at)), dx = gx - d.x, dy = gy - d.y, l = Math.hypot(dx, dy);
  c.at = now;
  d.moving = l > 0.3;
  // Far behind (a door, a jump across town): there at once.
  if (l > 6) (d.x = gx), (d.y = gy);
  else if (d.moving) (d.x += (dx / l) * Math.min(l - 0.3, 6 * dt)), (d.y += (dy / l) * Math.min(l - 0.3, 6 * dt)), (d.fx = dx / l), (d.fy = dy / l);
  return d;
}
