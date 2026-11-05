/**
 * The staff's fire hold: a wall of fire that rolls at a goblin (Kyle, 2026-11-05: "hold down to make a
 * wall of fire that moves towards the targeted enemy and stays up for a few seconds"). Never aimed: at the
 * release it picks the nearest goblin in a wide cone in front, else the nearest anywhere in reach, else a
 * spot ahead (numbers: shared/spellbook.ts FIRE_WALL). The wall is a line square to the way it goes; it
 * rises a tile in front of the Mage, rolls to where the goblin stood (short of a wall, or at the reach)
 * and burns on there. Each goblin it touches, rolling or standing, is scorched and set alight, then again
 * every half second while it stays in it; each friend in it (the Mage too) takes a third of what a goblin
 * loses, so they step out. It lights oil and tries wood it touches. Rain shortens it (shared/sky.ts). It
 * lives in the room's zones, so a guest sees the same wall that is judged (client/firewalldraw.ts).
 */
import { collide, currentMap } from '../shared/arena';
import { burnFor } from '../shared/sky';
import { BURN, CATCH, FIRE_WALL } from '../shared/tuning';
import { ignite, nearest, wood } from './catching';
import { downIfDead } from './combat';
import { damage, isDead } from './damage';
import { afflict, type World } from './elements';
import { fireproof } from './ladderrogue';
import { lightNear, type Slick } from './oil';
import { hurtSurvivor } from './survivors';
import type { Enemy, Hero, Zone } from './types';

type P = { x: number; y: number };

/** Where the wall's middle is now: rolling back from its stop at FIRE_WALL.speed until `at`, then there. */
export function wallAt(z: Zone, now: number): P {
  const back = Math.max(0, ((z.at ?? now) - now) * FIRE_WALL.speed);
  return { x: (z.tx ?? z.x) - (z.ax ?? 0) * back, y: (z.ty ?? z.y) - (z.ay ?? 0) * back };
}

/** In the wall, body and all (`rad`); `behind` widens it back the way it came (what it rolled over this tick). */
export function inWall(z: Zone, b: P, rad = 0, behind = 0): boolean {
  const dx = z.ax ?? 0, dy = z.ay ?? 0, rx = b.x - z.x, ry = b.y - z.y, along = rx * dx + ry * dy, across = -rx * dy + ry * dx;
  const half = FIRE_WALL.deep / 2 + rad;
  return Math.abs(across) <= z.r + rad && along <= half && along >= -half - behind;
}

const fair = (h: Hero, e: Enemy) => !isDead(e) && e.act !== 'carried' && !e.under && (e.z ?? 0) === (h.z ?? 0);

/** What it rolls at: the nearest goblin within FIRE_WALL.reach and FIRE_WALL.cone of where the Mage faces,
 *  else the nearest within reach anywhere, else FIRE_WALL.ahead in front (short of a wall). */
export function wallTarget(h: Hero, enemies: Enemy[]): P & { on?: number } {
  const l = Math.hypot(h.fx, h.fy) || 1, fx = h.fx / l, fy = h.fy / l, cos = Math.cos((FIRE_WALL.cone / 2) * (Math.PI / 180));
  let front: Enemy | undefined, any: Enemy | undefined, fd = Infinity, ad = Infinity;
  for (const e of enemies) {
    if (!fair(h, e)) continue;
    const rx = e.x - h.x, ry = e.y - h.y, d = Math.hypot(rx, ry);
    if (d > FIRE_WALL.reach) continue;
    if (d < ad) (ad = d), (any = e);
    if ((d < 0.01 || (rx * fx + ry * fy) / d >= cos) && d < fd) (fd = d), (front = e);
  }
  const e = front ?? any;
  if (e) return { x: e.x, y: e.y, on: e.id };
  const d = reachOf(h.x, h.y, fx, fy, FIRE_WALL.ahead);
  return { x: h.x + fx * d, y: h.y + fy * d };
}

/** Raise it. `mult`: the hero's damage now (a primed spell's too); `wide` WIDE BURST's widening. */
export function fireWall(h: Hero, mult: number, wide: number, w: World): Zone {
  const to = wallTarget(h, w.enemies), big = h.perfect, r = ((big ? FIRE_WALL.bigLen : FIRE_WALL.len) / 2) * wide;
  const tdx = to.x - h.x, tdy = to.y - h.y, td = Math.hypot(tdx, tdy);
  // The Mage turns to it, and it goes that way.
  if (td > 0.05) (h.fx = tdx / td), (h.fy = tdy / td);
  const dx = h.fx / (Math.hypot(h.fx, h.fy) || 1), dy = h.fy / (Math.hypot(h.fx, h.fy) || 1);
  // It rises a tile in front and stops where the goblin stood, short of a wall, and never past the reach.
  const free = reachOf(h.x, h.y, dx, dy, FIRE_WALL.reach), wallD = free < FIRE_WALL.reach ? Math.max(0, free - 0.3) : free, start = Math.min(FIRE_WALL.start, wallD);
  const stop = Math.max(start, Math.min(td, wallD)), now = w.now, at = now + (stop - start) / FIRE_WALL.speed;
  const life = (big ? FIRE_WALL.bigLife : FIRE_WALL.life) * burnFor(currentMap().theme);
  w.ev.push({ k: 'spell', x: h.x + dx * start, y: h.y + dy * start, dx, dy, el: 'fire', what: 'firewall', r, big });
  return { kind: 'firewall', x: h.x + dx * start, y: h.y + dy * start, tx: h.x + dx * stop, ty: h.y + dy * stop, ax: dx, ay: dy, r, at, next: now, until: at + life, owner: h.id, el: 'fire', big, n: Math.max(1, Math.round(FIRE_WALL.dmg * mult)), hit: {} };
}

/** What a friend in it takes a tick: FIRE_WALL.ally of what a goblin loses (the wall's scorch and a burn's tick). */
export const allyBurn = (z: Zone) => Math.max(1, Math.round(((z.n ?? FIRE_WALL.dmg) + BURN.dmg) * FIRE_WALL.ally));

/** Due to burn again (and marked so for the next FIRE_WALL.every s). */
function due(z: Zone, key: string, now: number): boolean {
  const hit = (z.hit ??= {});
  if (hit[key] !== undefined && now < hit[key]) return false;
  hit[key] = now + FIRE_WALL.every - 1e-6;
  return true;
}

/** Points along the wall's line, about half a tile apart. */
function along(z: Zone): P[] {
  const n = Math.max(2, Math.ceil((z.r * 2) / 0.5)), tx = -(z.ay ?? 0), ty = z.ax ?? 0, out: P[] = [];
  for (let i = 0; i <= n; i++) out.push({ x: z.x + tx * z.r * (2 * i / n - 1), y: z.y + ty * z.r * (2 * i / n - 1) });
  return out;
}

/** Oil it touches goes up (sim/oil.ts); wood it touches is tried once a wall (sim/catching.ts). */
function kindle(z: Zone, w: World, slicks: Slick[]): void {
  const pts = along(z), reach = FIRE_WALL.deep / 2;
  for (const p of pts) lightNear(slicks, p.x, p.y, reach, w.now, w.ev);
  currentMap().blocks.forEach((b, i) => {
    if (!wood(b) || z.hit?.['b' + i] !== undefined || nearest(b, z.x, z.y)[2] > z.r + 1) return;
    if (!pts.some((p) => nearest(b, p.x, p.y)[2] <= reach + 0.2)) return;
    (z.hit ??= {})['b' + i] = 0;
    ignite(b, w, CATCH.ring);
  });
}

/** Each wall, each tick: it rolls on to its stop (standing up there), then burns whoever it touches. */
export function stepWalls(zones: Zone[], w: World, slicks: Slick[] = []): void {
  for (const z of zones) {
    if (z.kind !== 'firewall' || w.now >= z.until) continue;
    const p = wallAt(z, w.now), behind = Math.hypot(p.x - z.x, p.y - z.y);
    (z.x = p.x), (z.y = p.y);
    if (w.now >= (z.at ?? 0) && !z.fell) {
      z.fell = true;
      w.ev.push({ k: 'wallup', x: z.x, y: z.y, r: z.r, dx: z.ax ?? 0, dy: z.ay ?? 0, big: !!z.big });
    }
    kindle(z, w, slicks);
    const n = z.n ?? FIRE_WALL.dmg, friend = allyBurn(z);
    for (const e of w.enemies) {
      if (isDead(e) || e.act === 'carried' || e.under || (e.z ?? 0) !== 0 || !inWall(z, e, e.radius, behind) || !due(z, 'e' + e.id, w.now)) continue;
      e.lastBy = z.owner;
      if (damage(e, n, w.now, w.ev, { tick: true, el: 'fire', how: 'burn', src: 'firewall' })) continue;
      afflict(w, e, 'fire', n);
    }
    for (const h of w.heroes) {
      if (h.act === 'down' || h.act === 'roll' || h.out || h.safeT || (h.z ?? 0) !== 0 || !inWall(z, h, 0.3, behind) || !due(z, 'h' + h.id, w.now)) continue;
      // SHAKE IT OFF: just after a dash, fire underfoot can't take (sim/ladderrogue.ts).
      if (fireproof(h, w.now)) {
        w.ev.push({ k: 'shakeoff', x: h.x, y: h.y });
        continue;
      }
      h.hp -= friend;
      w.ev.push({ k: 'hit', x: h.x, y: h.y, n: friend, heavy: false, on: 'hero', src: 'fire' });
      downIfDead(h, w.ev);
    }
    for (const v of w.survivors ?? []) if (inWall(z, v, 0.3, behind) && due(z, 'v' + v.id, w.now)) hurtSurvivor(v, friend, z.owner, w.now, w.ev, 0, 0, true);
  }
}

/** How far a line from (x, y) goes along (dx, dy) before a wall, up to `range`. */
export function reachOf(x: number, y: number, dx: number, dy: number, range: number): number {
  for (let d = 0.1; d <= range; d += 0.1) {
    const p = { x: x + dx * d, y: y + dy * d }, q = { ...p };
    collide(q, 0.05);
    if (Math.hypot(q.x - p.x, q.y - p.y) > 1e-4) return d;
  }
  return range;
}
