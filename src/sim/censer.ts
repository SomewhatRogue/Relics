/**
 * The censer's coals, in the room (numbers: shared/cleric.ts CENSER). Its swung arc drops burning coals
 * along the arc; they lie in the room's coal list beside the butchers' slivers (so they're drawn, lit and
 * sent to guests the same way) but carry their Cleric's id, and no censer feeds on them. A goblin that
 * stands in one catches fire. The censer swung through your own coals bursts them, mending friends near;
 * the spin let go on the white flash flares them all, burning goblins, and shields friends near you.
 * Weakness: a wall within the swing snags the chain. Coals only ever touch goblins (a Cleric's mercy).
 */
import { collide } from '../shared/arena';
import { BURN, CENSER, HEAL_RADIUS, type Swing } from '../shared/tuning';
import { inArc } from './combat';
import { damage, isDead } from './damage';
import { afflict, type World } from './elements';
import { friendsNear, mend, shieldNear } from './holy';
import { censerCoal, type Coal } from './lantern';
import type { Hero } from './types';

/** Directions across the swing's arc, as unit vectors (every 45 degrees of a whirl). */
function across(h: Hero, s: Swing): [number, number][] {
  const n = s.arc >= 360 ? 8 : Math.max(3, Math.round(s.arc / 45) + 1), a0 = Math.atan2(h.fy, h.fx), out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = s.arc >= 360 ? a0 + (i / n) * Math.PI * 2 : a0 + ((i / (n - 1) - 0.5) * s.arc * Math.PI) / 180;
    out.push([Math.cos(a), Math.sin(a)]);
  }
  return out;
}

/** A wall within the swing: the chain catches on it. Where, or null. */
export function snagAt(h: Hero, s: Swing): { x: number; y: number } | null {
  for (const [dx, dy] of across(h, s)) {
    const want = { x: h.x + dx * s.range * 0.85, y: h.y + dy * s.range * 0.85 }, p = { ...want };
    collide(p, 0.05);
    if (Math.hypot(p.x - want.x, p.y - want.y) > 1e-4) return want;
  }
  return null;
}

const mine = (c: Coal, h: Hero) => c.owner === h.id;

/** The moment a censer swing comes round (sim/room.ts loose): snag, flare, burst, and drop. */
export function censerSwing(h: Hero, s: Swing, w: World, coals: Coal[]): void {
  h.snagged = false;
  if (!s.burn) return;
  const snag = snagAt(h, s);
  if (snag) {
    h.snagged = true;
    h.hitstop = Math.max(h.hitstop, CENSER.jar);
    return void w.ev.push({ k: 'snag', x: snag.x, y: snag.y });
  }
  if (h.heavy && h.perfect && s.holy) flare(h, w, coals), shieldNear(h, w.heroes, HEAL_RADIUS, w.now, w.ev);
  burst(h, s, w, coals);
  if (s.coals) drop(h, s, w, coals);
}

/** The spin let go on the flash: every coal of yours near flares, and goblins by it burn. */
function flare(h: Hero, w: World, coals: Coal[]): void {
  for (const c of coals.filter((c) => mine(c, h) && Math.hypot(c.x - h.x, c.y - h.y) <= CENSER.reach)) {
    coals.splice(coals.indexOf(c), 1);
    w.ev.push({ k: 'coalflare', x: c.x, y: c.y });
    for (const e of w.enemies) {
      if (isDead(e) || e.act === 'carried' || Math.hypot(e.x - c.x, e.y - c.y) > CENSER.flare + e.radius) continue;
      e.lastBy = h.id;
      if (!damage(e, CENSER.flareDmg, w.now, w.ev, { heavy: true, how: 'burn', src: 'smite', dx: e.x - c.x, dy: e.y - c.y })) afflict(w, e, 'fire', CENSER.flareDmg);
    }
  }
}

/** Swung through your own coals (old enough): they burst, and every friend near one mends once. */
function burst(h: Hero, s: Swing, w: World, coals: Coal[]): void {
  const hit = coals.filter((c) => mine(c, h) && w.now - (c.at ?? 0) >= CENSER.arm && inArc(h.x, h.y, h.fx, h.fy, c.x, c.y, s.range, s.arc, CENSER.radius));
  if (!hit.length) return;
  const healed = new Set<Hero>();
  for (const c of hit) {
    coals.splice(coals.indexOf(c), 1);
    w.ev.push({ k: 'coalburst', x: c.x, y: c.y });
    for (const o of friendsNear(w.heroes, c.x, c.y, CENSER.burst)) healed.add(o);
  }
  for (const o of healed) mend(h, o, CENSER.heal, w.ev);
}

/** Coals dropped along the arc; a Cleric keeps CENSER.max at most (the oldest goes out). */
function drop(h: Hero, s: Swing, w: World, coals: Coal[]): void {
  const a0 = Math.atan2(h.fy, h.fx), spread = (s.arc * 0.8 * Math.PI) / 180;
  for (let i = 0; i < CENSER.drop; i++) {
    const a = a0 + (CENSER.drop > 1 ? i / (CENSER.drop - 1) - 0.5 : 0) * spread;
    const p = { x: h.x + Math.cos(a) * s.range * CENSER.at, y: h.y + Math.sin(a) * s.range * CENSER.at };
    collide(p, 0.1);
    coals.push(censerCoal(p.x, p.y, h.id, w.now));
  }
  const own = coals.filter((c) => mine(c, h));
  for (const c of own.slice(0, Math.max(0, own.length - CENSER.max))) coals.splice(coals.indexOf(c), 1);
}

/** Each tick: a goblin standing in a Cleric's coal catches (credited to that Cleric). */
export function stepEmbers(coals: Coal[], w: World): void {
  for (const c of coals) {
    if (!c.owner) continue;
    for (const e of w.enemies) {
      if (isDead(e) || e.act === 'carried' || e.burnUntil > w.now + BURN.time * 0.5 || Math.hypot(e.x - c.x, e.y - c.y) > CENSER.radius + e.radius) continue;
      e.lastBy = c.owner;
      afflict(w, e, 'fire', 0);
    }
  }
}
