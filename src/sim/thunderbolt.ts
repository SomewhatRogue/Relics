/**
 * The wand's storm hold: a lightning bolt from the hand (numbers: shared/spellbook.ts THUNDERBOLT; Kyle,
 * 2026-11-04: "a lightning bolt, not a chain lightning"). Thrown at the release, straight along where the
 * Mage faces, at once: a wall stops it, and it hits the first goblin on its line hard, shield or no shield.
 * Let go on the white flash, it runs through the whole line and breaks off whatever each was doing. Wet,
 * it lands harder and jumps (sim/elements.ts). Judged here; the event carries how far it went, so both
 * views draw the line that was judged.
 */
import { collide } from '../shared/arena';
import { THUNDERBOLT, type Swing } from '../shared/tuning';
import { damage, isDead } from './damage';
import { afflict, newCast, type World } from './elements';
import { interrupt, windingUp } from './spells';
import type { Enemy, Hero } from './types';

/** How far the bolt goes along (dx, dy) from (x, y) before a wall, up to `range`. */
function reachOf(x: number, y: number, dx: number, dy: number, range: number): number {
  for (let d = 0.1; d <= range; d += 0.1) {
    const p = { x: x + dx * d, y: y + dy * d }, q = { ...p };
    collide(q, 0.05);
    if (Math.hypot(q.x - p.x, q.y - p.y) > 1e-4) return d;
  }
  return range;
}

/** The goblins on the line, nearest first. */
function onLine(h: Hero, enemies: Enemy[], dx: number, dy: number, len: number): Enemy[] {
  const out: [number, Enemy][] = [];
  for (const e of enemies) {
    if (isDead(e) || e.act === 'carried' || (e.z ?? 0) !== (h.z ?? 0)) continue;
    const rx = e.x - h.x, ry = e.y - h.y, along = rx * dx + ry * dy;
    if (along < 0 || along > len + e.radius) continue;
    if (Math.abs(rx * dy - ry * dx) <= THUNDERBOLT.width + e.radius) out.push([along, e]);
  }
  return out.sort((a, b) => a[0] - b[0]).map(([, e]) => e);
}

/** Where it goes: where the Mage faces, turned onto the nearest goblin within THUNDERBOLT.assist degrees. */
function aimOf(h: Hero, enemies: Enemy[]): [number, number] {
  const l = Math.hypot(h.fx, h.fy) || 1, fx = h.fx / l, fy = h.fy / l, cos = Math.cos((THUNDERBOLT.assist * Math.PI) / 180);
  let best: Enemy | undefined, bd = Infinity;
  for (const e of enemies) {
    const rx = e.x - h.x, ry = e.y - h.y, d = Math.hypot(rx, ry);
    if (isDead(e) || e.act === 'carried' || (e.z ?? 0) !== (h.z ?? 0) || d < 0.01 || d > THUNDERBOLT.range || (rx * fx + ry * fy) / d < cos || d >= bd) continue;
    (bd = d), (best = e);
  }
  return best ? [(best.x - h.x) / bd, (best.y - h.y) / bd] : [fx, fy];
}

/** Throw it: `s` the hold, `mult` the hero's damage now. */
export function thunderbolt(h: Hero, s: Swing, mult: number, w: World): void {
  const [dx, dy] = aimOf(h, w.enemies), big = h.perfect;
  (h.fx = dx), (h.fy = dy);
  const wall = reachOf(h.x, h.y, dx, dy, THUNDERBOLT.range), line = onLine(h, w.enemies, dx, dy, wall);
  const hit = big ? line : line.slice(0, 1), first = hit[0];
  // It stops in the first goblin (or runs on to the wall, on the flash).
  const len = !big && first ? Math.max(0.5, (first.x - h.x) * dx + (first.y - h.y) * dy) : wall;
  w.ev.push({ k: 'spell', x: h.x, y: h.y, dx, dy, el: 'storm', what: 'thunderbolt', r: len, big });
  const n = Math.max(1, Math.round(s.dmg * THUNDERBOLT.dmg * mult)), cast = newCast();
  for (const e of hit) {
    const winding = windingUp(e);
    e.lastBy = h.id;
    w.ev.push({ k: 'shock', x: h.x + dx * 0.5, y: h.y + dy * 0.5, x2: e.x, y2: e.y });
    if (damage(e, n, w.now, w.ev, { heavy: true, flinch: 0.4, mult: true, el: 'storm', src: 'spark', dx, dy })) continue;
    // The wand's breaking: a bolt into a wind-up breaks that blow; on the flash, whatever it was doing.
    interrupt(e, winding, big, h.id, w.now, w.ev);
    afflict(w, e, 'storm', n, { cast });
  }
}
