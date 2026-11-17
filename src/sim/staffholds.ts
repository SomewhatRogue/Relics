/**
 * The wand's storm hold and the staff's frost hold (Kyle, 2026-11-16; the rest in sim/holds.ts). Numbers in
 * shared/spellbook.ts.
 *
 * Storm (the wand), CHAIN_BOLT: lightning off the wand at the goblin you aim at, then jumping goblin to goblin,
 * `jumps` times (`bigJumps` on the white flash), each one up to `reach` tiles from the last and taking
 * `fall` of the one before. Small goblins it touches are stunned.
 *
 * Frost (the staff), ICE_DOME: an ice dome round you, `r` across (`bigR` on the flash), for `time` s (`bigTime`).
 * Goblins caught at its edge, or inside it, when it rises are frozen solid, and no goblin can come in:
 * they're pushed back out to its edge. Nothing outside it lands a blow or a shot on anyone inside it
 * (sim/combat.ts, shelteredFrom); your shots and friends' go out through it as ever. It's kept on the
 * hero who cast it (Hero.dome), so it goes where the room's heroes go.
 */
import { CHAIN_BOLT, ICE_DOME, type Swing } from '../shared/tuning';
import { damage, frozen, isDead, small } from './damage';
import { afflict, chilled, type World } from './elements';
import { stun } from './stuns';
import type { Enemy, Hero } from './types';

const live = (e: Enemy) => !isDead(e) && e.act !== 'carried';
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** The goblin a chain bolt goes to first: the one nearest your aim within the cone, else the nearest in range. */
function firstOf(h: Hero, enemies: Enemy[]): Enemy | undefined {
  const cos = Math.cos((CHAIN_BOLT.cone * Math.PI) / 180);
  let best: Enemy | undefined, score = Infinity;
  for (const e of enemies) {
    if (!live(e)) continue;
    const d = dist(h, e);
    if (d > CHAIN_BOLT.range || d < 1e-6) continue;
    const c = ((e.x - h.x) * h.fx + (e.y - h.y) * h.fy) / d;
    // (In the cone, nearest the line; outside it, only if nothing's in it.)
    const s = c >= cos ? (1 - c) * 10 + d * 0.01 : 100 + d;
    if (s < score) (score = s), (best = e);
  }
  return best;
}

/** Storm: the chain bolt, let go. */
export function chainBolt(h: Hero, s: Swing, mult: number, w: World): void {
  const first = firstOf(h, w.enemies), jumps = h.perfect ? CHAIN_BOLT.bigJumps : CHAIN_BOLT.jumps;
  w.ev.push({ k: 'spell', what: 'chainbolt', x: h.x, y: h.y, dx: h.fx, dy: h.fy, r: CHAIN_BOLT.range, el: 'storm', big: h.perfect });
  if (!first) return;
  const hit: Enemy[] = [];
  let at: { x: number; y: number } = h, e: Enemy | undefined = first, n = s.dmg * mult * CHAIN_BOLT.dmg;
  for (let i = 0; e && i <= jumps; i++) {
    w.ev.push({ k: 'shock', x: at.x, y: at.y, x2: e.x, y2: e.y });
    hit.push(e);
    e.lastBy = h.id;
    if (small(e)) stun(e, h.id, w.now, CHAIN_BOLT.stun, w.ev);
    damage(e, Math.max(1, Math.round(n)), w.now, w.ev, { el: 'storm', src: 'spark', heavy: true });
    at = e;
    n *= CHAIN_BOLT.fall;
    const from: Enemy = e;
    e = w.enemies.filter((o) => live(o) && !hit.includes(o) && dist(o, from) <= CHAIN_BOLT.reach).sort((a, b) => dist(a, from) - dist(b, from))[0];
  }
}

/** Frost twice: frozen solid. */
function freezeSolid(w: World, e: Enemy, n: number): void {
  afflict(w, e, 'frost', n);
  if (!frozen(e, w.now) && chilled(e, w.now)) afflict(w, e, 'frost', n);
}

/** Frost: the ice dome rises round you. */
export function iceDome(h: Hero, s: Swing, mult: number, w: World): void {
  const big = h.perfect, r = big ? ICE_DOME.bigR : ICE_DOME.r;
  h.dome = { x: h.x, y: h.y, r, until: w.now + (big ? ICE_DOME.bigTime : ICE_DOME.time) };
  w.ev.push({ k: 'spell', what: 'icedome', x: h.x, y: h.y, dx: h.fx, dy: h.fy, r, el: 'frost', big });
  const n = Math.max(1, Math.round(s.dmg * mult * ICE_DOME.dmg));
  for (const e of w.enemies) if (live(e) && dist(e, h) <= r + ICE_DOME.edge) (e.lastBy = h.id), freezeSolid(w, e, n);
  pushOut(h.dome, w.enemies);
}

/** No goblin inside a dome: each is set back out at its edge. */
function pushOut(d: NonNullable<Hero['dome']>, enemies: Enemy[]): void {
  for (const e of enemies) {
    if (!live(e)) continue;
    const dx = e.x - d.x, dy = e.y - d.y, l = Math.hypot(dx, dy), out = d.r + e.radius;
    if (l >= out) continue;
    const [ux, uy] = l > 1e-6 ? [dx / l, dy / l] : [1, 0];
    Object.assign(e, { x: d.x + ux * out, y: d.y + uy * out });
  }
}

/** Each tick: a dome ended goes; the rest keep goblins out. */
export function stepDomes(heroes: Hero[], enemies: Enemy[], now: number): void {
  for (const h of heroes) {
    if (!h.dome) continue;
    if (now >= h.dome.until) h.dome = undefined;
    else pushOut(h.dome, enemies);
  }
}

/** Is `h` inside a dome that `e` is outside of? Then nothing `e` does reaches them. */
export function shelteredFrom(e: Enemy, h: Hero, heroes: Hero[], now: number): boolean {
  for (const o of heroes) {
    const d = o.dome;
    if (d && now < d.until && dist(h, d) < d.r && dist(e, d) >= d.r) return true;
  }
  return false;
}
