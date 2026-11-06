/**
 * The wand's storm hold: lightning called down from the sky (numbers: shared/spellbook.ts SKY_STRIKE;
 * Kyle, 2026-11-05: "call down a lightning strike in an AOE after a brief delay, similar to smite but
 * quicker, and have a thunder crack with it"). Let go, it marks its spot, a zone of kind 'skystrike' in the
 * room's own list, so a guest's screen has the same spot, size and second. It falls SKY_STRIKE.delay later
 * on everything in the circle: the hold's damage, shields or no; small goblins stunned (the stun cap
 * holds); wet ones 1.5x and it jumps on (sim/elements.ts). It spares friends, so its mark is drawn in the
 * friendly gold (client/skystrikedraw.ts), never the goblins' red. One shape: `inSkyStrike` is what the
 * room judges and the circle both views draw. An ironhide within ROD.reach of where it's aimed draws it
 * onto itself (sim/rods.ts), and the mark is called there.
 */
import { collide } from '../shared/arena';
import { SKY_STRIKE, type Swing } from '../shared/tuning';
import { damage, isDead, small } from './damage';
import { afflict, newCast, type World } from './elements';
import { spare } from './foundrelics';
import { burstMult } from './knacks';
import { stun } from './stuns';
import { rodHit, rodNear } from './rods';
import type { Enemy, Hero, Zone } from './types';

/** Whether a body at (x, y), `rad` round, is caught: its edge inside the circle. */
export const inSkyStrike = (z: Zone, b: { x: number; y: number }, rad = 0) => Math.hypot(b.x - z.x, b.y - z.y) <= z.r + rad;

/** How long until it falls (0 once it has, or as it does). */
export const strikeLead = (z: Zone, t: number) => Math.max(0, (z.at ?? t) - t);

const standing = (e: Enemy, h: Hero) => !isDead(e) && e.act !== 'carried' && !e.under && (e.z ?? 0) === (h.z ?? 0);

/** Which way: where the Mage faces, turned onto the nearest goblin within SKY_STRIKE.assist degrees. */
function aimOf(h: Hero, enemies: Enemy[]): [number, number] {
  const l = Math.hypot(h.fx, h.fy) || 1, fx = h.fx / l, fy = h.fy / l, cos = Math.cos((SKY_STRIKE.assist * Math.PI) / 180);
  let best: Enemy | undefined, bd = Infinity;
  for (const e of enemies) {
    const rx = e.x - h.x, ry = e.y - h.y, d = Math.hypot(rx, ry);
    if (!standing(e, h) || d < 0.01 || d > SKY_STRIKE.range || (rx * fx + ry * fy) / d < cos || d >= bd) continue;
    (bd = d), (best = e);
  }
  return best ? [(best.x - h.x) / bd, (best.y - h.y) / bd] : [fx, fy];
}

/** Where it falls: `dist` along the aim, onto the goblin nearest there (within SKY_STRIKE.snap of its edge),
 *  kept inside the room. */
function spotOf(h: Hero, enemies: Enemy[], dx: number, dy: number, dist: number): { x: number; y: number } {
  const p = { x: h.x + dx * dist, y: h.y + dy * dist };
  let best: Enemy | undefined, bd = Infinity;
  for (const e of enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y) - e.radius;
    if (standing(e, h) && d <= SKY_STRIKE.snap && d < bd) (bd = d), (best = e);
  }
  const at = best ? { x: best.x, y: best.y } : p;
  collide(at, 0.2);
  return at;
}

/** Call it: `s` the hold, `mult` the hero's damage now, `aim(range, fallback)` how far the hero aims. */
export function callStrike(h: Hero, s: Swing, mult: number, aim: (range: number, fallback: number) => number, zones: Zone[], w: World): void {
  const [dx, dy] = aimOf(h, w.enemies), big = h.perfect;
  (h.fx = dx), (h.fy = dy);
  const aimed = spotOf(h, w.enemies, dx, dy, Math.min(SKY_STRIKE.range, aim(SKY_STRIKE.range, SKY_STRIKE.fallback)));
  // An ironhide near where it would fall draws it (sim/rods.ts): it falls on the iron instead.
  const rod = rodNear(w.enemies, aimed.x, aimed.y), { x, y } = rod ? { x: rod.x, y: rod.y } : aimed;
  // (WIDE BURST widens it as it does any burst.)
  const r = (big ? SKY_STRIKE.bigR : SKY_STRIKE.r) * burstMult(h), at = w.now + SKY_STRIKE.delay;
  const n = Math.max(1, Math.round(s.dmg * SKY_STRIKE.dmg * mult));
  zones.push({ kind: 'skystrike', x, y, r, at, until: at + SKY_STRIKE.show, next: at, owner: h.id, el: 'storm', big, n, ...(rod ? { rod: rod.id, rx: aimed.x, ry: aimed.y } : {}) });
  w.ev.push({ k: 'spell', x, y, dx, dy, el: 'storm', what: 'strike', r, big });
}

/** It falls: everything in the circle struck, small ones stunned, friends spared. */
function fall(z: Zone, w: World): void {
  z.fell = true;
  w.ev.push({ k: 'skystrike', x: z.x, y: z.y, r: z.r, big: !!z.big });
  const by = w.heroes.find((o) => o.id === z.owner), n = z.n ?? 1, cast = newCast();
  const hit = w.enemies.filter((e) => !isDead(e) && e.act !== 'carried' && !e.under && inSkyStrike(z, e, e.radius));
  // Drawn into a rod: the bolt bends into it (its guard broken, wherever it has stepped to).
  const rod = z.rod ? w.enemies.find((e) => e.id === z.rod) : undefined;
  if (rod && !isDead(rod)) {
    rodHit(rod, z.rx ?? z.x, z.ry ?? z.y, w.now, w.ev);
    if (!hit.includes(rod)) hit.push(rod);
  }
  // (All of them reached by this cast already, so a jump from one never lands twice on another in it.)
  for (const e of hit) e.jolted = cast;
  for (const e of hit) {
    e.lastBy = z.owner;
    const dx = e.x - z.x, dy = e.y - z.y;
    if (damage(e, n, w.now, w.ev, { heavy: true, flinch: 0.4, mult: true, el: 'storm', src: 'spark', how: 'burst', dx, dy })) continue;
    if (small(e) && e.act !== 'pinned') stun(e, z.owner, w.now, z.big ? SKY_STRIKE.bigStun : SKY_STRIKE.stun, w.ev);
    afflict(w, e, 'storm', n, { cast });
  }
  // Friends under it take nothing, and are told so.
  spare(w, by ?? { id: z.owner }, (o) => inSkyStrike(z, o, 0.3));
}

/** Every strike called, each tick: those due fall. */
export function stepSkyStrikes(zones: Zone[], w: World): void {
  for (const z of zones) if (z.kind === 'skystrike' && !z.fell && w.now >= (z.at ?? 0)) fall(z, w);
}
