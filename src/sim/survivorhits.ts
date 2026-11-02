/**
 * What of the party's reaches the freed (survivors.ts), at full weight, solo or in a party: they aren't
 * fighters. Swings, shots and spells, blasts, a slammed barrel, the oil going up, a thrown javelin,
 * goblins and props flung into them, the Warrior's shield charge, and fire caught from burning goblins
 * and buildings. A holy smite spares them as it spares the party; the hound and the net don't hurt them.
 */
import { currentMap } from '../shared/arena';
import { BASH, BLAZE, BURN, JAVELIN, KNOCK, PROP, SURVIVOR, type Augment, type Swing } from '../shared/tuning';
import { inArc } from './combat';
import { isDead } from './damage';
import type { World } from './elements';
import { hurtSurvivor, igniteSurvivor, living } from './survivors';
import type { Bolt, Hero, Survivor } from './types';

const key = (s: Survivor) => 's:' + s.id;

/** A swing's live frames: a survivor in its arc takes it once a swing. */
export function sweepSurvivors(h: Hero, sw: Swing, w: World): void {
  if (sw.shot) return;
  for (const s of living(w)) {
    if (h.hitAllies?.includes(key(s)) || (s.z ?? 0) !== (h.z ?? 0) || !inArc(h.x, h.y, h.fx, h.fy, s.x, s.y, sw.range, sw.arc, SURVIVOR.radius)) continue;
    (h.hitAllies ??= []).push(key(s));
    hurtSurvivor(s, sw.dmg, h.id, w.now, w.ev, s.x - h.x, s.y - h.y);
  }
}

/** The survivor a flying shot has just reached, if any. */
export const survivorIn = (w: World, b: Bolt) =>
  living(w).find((s) => !b.hitHeroes?.includes(key(s)) && Math.hypot(s.x - b.x, s.y - b.y) <= SURVIVOR.radius + (b.kind === 'orb' ? 0.3 : 0.14));

/** A shot (no burst) lands in a survivor: once a shot, and a fire one sets them alight. */
export function shotSurvivor(w: World, b: Bolt, s: Survivor): void {
  (b.hitHeroes ??= []).push(key(s));
  hurtSurvivor(s, b.dmg, b.owner, w.now, w.ev, b.dx, b.dy);
  if (b.el === 'fire') igniteSurvivor(s, b.owner, w.now, w.ev);
}

/** A blast at (x, y): survivors in reach are hit and thrown outward; a fire one sets them alight. */
export function blastSurvivors(w: World, x: number, y: number, r: number, dmg: number, by: string, el: Augment): void {
  for (const s of living(w)) {
    if (Math.hypot(s.x - x, s.y - y) > r + SURVIVOR.radius) continue;
    hurtSurvivor(s, dmg, by, w.now, w.ev, s.x - x, s.y - y);
    if (el === 'fire') igniteSurvivor(s, by, w.now, w.ev);
  }
}

/** The Warrior's shield charge runs over them (once a charge; `hit` keeps the charge's tally). */
export function bashSurvivors(h: Hero, w: World, hit: Set<number>): void {
  for (const s of living(w)) {
    if (hit.has(-s.id) || Math.hypot(s.x - h.x, s.y - h.y) > 0.32 + SURVIVOR.radius + BASH.reach) continue;
    hit.add(-s.id);
    const side = h.rollDx * (s.y - h.y) - h.rollDy * (s.x - h.x) >= 0 ? 1 : -1;
    hurtSurvivor(s, BASH.dmg, h.id, w.now, w.ev, h.rollDx * 0.6 - h.rollDy * side, h.rollDy * 0.6 + h.rollDx * side);
  }
}

/** Driving into the survivor at least as fast as a body hurts (not flying away from them). */
const into = (s: Survivor, b: { x: number; y: number; kvx: number; kvy: number }) => {
  const d = Math.hypot(s.x - b.x, s.y - b.y) || 1;
  return ((b.kvx - s.kvx) * (s.x - b.x) + (b.kvy - s.kvy) * (s.y - b.y)) / d;
};

/** Distance from (px, py) to the segment (ax, ay)-(bx, by). */
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay, l = vx * vx + vy * vy, t = l ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l)) : 0;
  return Math.hypot(px - ax - vx * t, py - ay - vy * t);
}

/** Each tick, before they walk: javelins, flung goblins and props, and fire that reaches them. */
export function survivorHazards(w: World, dt: number): void {
  const list = living(w);
  if (!list.length) return;
  for (const j of w.javelins) {
    if (j.state !== 'fly') continue;
    const step = JAVELIN.speed * dt;
    for (const s of list) {
      if (s.dead || j.hit.includes(-s.id) || segDist(s.x, s.y, j.x - j.dx * step, j.y - j.dy * step, j.x, j.y) > SURVIVOR.radius + 0.18) continue;
      j.hit.push(-s.id);
      hurtSurvivor(s, JAVELIN.dmg, j.owner, w.now, w.ev, j.dx, j.dy);
      // It stops in them (unless it's already carrying a goblin to the wall).
      if (!j.enemy) j.state = 'floor';
      break;
    }
  }
  for (const s of list) {
    if (s.dead) continue;
    const bumped = w.now - s.hitAt < SURVIVOR.bumpEvery;
    for (const e of w.enemies) {
      if (bumped || isDead(e) || e.act === 'carried' || Math.hypot(e.x - s.x, e.y - s.y) > e.radius + SURVIVOR.radius + 0.05) continue;
      const rel = into(s, e);
      if (rel < KNOCK.bodySpeed) continue;
      w.ev.push({ k: 'bodyhit', x: (e.x + s.x) / 2, y: (e.y + s.y) / 2 });
      hurtSurvivor(s, Math.min(KNOCK.bodyMax, Math.round(rel * KNOCK.bodyDmg)), e.lastBy, w.now, w.ev, e.kvx, e.kvy);
      (e.kvx *= 0.5), (e.kvy *= 0.5);
      break;
    }
    // A burning goblin close enough spreads it, like goblin to goblin.
    for (const e of w.enemies) if (!isDead(e) && e.burnUntil > w.now && Math.hypot(e.x - s.x, e.y - s.y) <= e.radius + SURVIVOR.radius + BURN.spread) igniteSurvivor(s, e.lastBy, w.now, w.ev);
    for (const p of w.props) {
      if (s.dead || w.now - s.hitAt < SURVIVOR.bumpEvery || p.broken || p.lifted || Math.hypot(p.x - s.x, p.y - s.y) > p.radius + SURVIVOR.radius + 0.05) continue;
      const rel = into(s, p);
      if (rel < KNOCK.bodySpeed) continue;
      w.ev.push({ k: 'bodyhit', x: (p.x + s.x) / 2, y: (p.y + s.y) / 2 });
      hurtSurvivor(s, Math.min(PROP.hitMax, Math.round(rel * PROP.hitPerSpeed * p.weight)), p.lastBy, w.now, w.ev, p.kvx, p.kvy);
      (p.kvx *= 0.3), (p.kvy *= 0.3);
    }
    // Too close to a burning building.
    for (const b of currentMap().blocks) {
      if ((b.burning ?? -1) < 0 || b.ruined) continue;
      const nx = Math.max(b.x, Math.min(b.x + b.w, s.x)), ny = Math.max(b.y, Math.min(b.y + b.h, s.y));
      if (Math.hypot(s.x - nx, s.y - ny) <= SURVIVOR.radius + BLAZE.reach) igniteSurvivor(s, '', w.now, w.ev);
    }
  }
}
