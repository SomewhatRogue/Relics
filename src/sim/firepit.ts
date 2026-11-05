/**
 * The staff's fire hold: a fire pit dropped on a goblin (Kyle, 2026-11-05: "Maybe it is a circle on the
 * enemy or something? Like a filled-in AOE? Allies gotta run from it"). Never aimed: at the release it
 * picks the nearest goblin in a wide cone in front, else the nearest anywhere in reach, else a spot ahead
 * (numbers: shared/spellbook.ts FIRE_PIT). It catches for a moment, then burns: every half second each
 * goblin in it is scorched and set alight, and each friend in it (the Mage too) takes a third of what a
 * goblin loses, so they step out. Rain shortens it (shared/sky.ts). It lives in the room's zones, so a
 * guest sees the same pit that is judged (client/firepitdraw.ts draws it from these numbers).
 */
import { currentMap } from '../shared/arena';
import { burnFor } from '../shared/sky';
import { BURN, FIRE_PIT } from '../shared/tuning';
import { ringCatch } from './catching';
import { downIfDead } from './combat';
import { damage, isDead } from './damage';
import { afflict, type World } from './elements';
import { fireproof } from './ladderrogue';
import { lightNear, type Slick } from './oil';
import { hurtSurvivor } from './survivors';
import { reachOf } from './thunderbolt';
import type { Enemy, Hero, Zone } from './types';

/** In the pit, body and all. */
export const inPit = (z: Zone, b: { x: number; y: number }, rad = 0) => Math.hypot(b.x - z.x, b.y - z.y) <= z.r + rad;

const fair = (h: Hero, e: Enemy) => !isDead(e) && e.act !== 'carried' && !e.under && (e.z ?? 0) === (h.z ?? 0);

/** Where it drops: on the nearest goblin within FIRE_PIT.reach and FIRE_PIT.cone of where the Mage faces,
 *  else the nearest within reach anywhere, else FIRE_PIT.ahead in front (short of a wall). */
export function pitSpot(h: Hero, enemies: Enemy[]): { x: number; y: number; on?: number } {
  const l = Math.hypot(h.fx, h.fy) || 1, fx = h.fx / l, fy = h.fy / l, cos = Math.cos((FIRE_PIT.cone / 2) * (Math.PI / 180));
  let front: Enemy | undefined, any: Enemy | undefined, fd = Infinity, ad = Infinity;
  for (const e of enemies) {
    if (!fair(h, e)) continue;
    const rx = e.x - h.x, ry = e.y - h.y, d = Math.hypot(rx, ry);
    if (d > FIRE_PIT.reach) continue;
    if (d < ad) (ad = d), (any = e);
    if ((d < 0.01 || (rx * fx + ry * fy) / d >= cos) && d < fd) (fd = d), (front = e);
  }
  const e = front ?? any;
  if (e) return { x: e.x, y: e.y, on: e.id };
  const d = reachOf(h.x, h.y, fx, fy, FIRE_PIT.ahead);
  return { x: h.x + fx * d, y: h.y + fy * d };
}

/** Drop it. `mult`: the hero's damage now (a primed spell's too); `wide` WIDE BURST's widening. */
export function firePit(h: Hero, mult: number, wide: number, w: World): Zone {
  const at = pitSpot(h, w.enemies), big = h.perfect, r = (big ? FIRE_PIT.bigR : FIRE_PIT.r) * wide;
  const dx = at.x - h.x, dy = at.y - h.y, d = Math.hypot(dx, dy);
  // The Mage turns to it.
  if (d > 0.05) (h.fx = dx / d), (h.fy = dy / d);
  w.ev.push({ k: 'spell', x: at.x, y: at.y, dx: h.fx, dy: h.fy, el: 'fire', what: 'firepit', r, big });
  const flare = w.now + FIRE_PIT.catch, life = (big ? FIRE_PIT.bigLife : FIRE_PIT.life) * burnFor(currentMap().theme);
  return { kind: 'firepit', x: at.x, y: at.y, r, at: flare, next: flare, until: flare + life, owner: h.id, el: 'fire', big, n: Math.max(1, Math.round(FIRE_PIT.dmg * mult)) };
}

/** What a friend in it takes a tick: FIRE_PIT.ally of what a goblin loses (the pit's scorch and a burn's tick). */
export const allyBurn = (z: Zone) => Math.max(1, Math.round(((z.n ?? FIRE_PIT.dmg) + BURN.dmg) * FIRE_PIT.ally));

/** Each pit, each tick: it flares up when it's caught, then burns whoever's in it every FIRE_PIT.every. */
export function stepPits(zones: Zone[], w: World, slicks: Slick[] = []): void {
  for (const z of zones) {
    if (z.kind !== 'firepit' || w.now < z.next || w.now >= z.until) continue;
    if (z.next <= (z.at ?? 0)) {
      w.ev.push({ k: 'pitup', x: z.x, y: z.y, r: z.r, big: !!z.big });
      // Wood it reaches may catch (sim/catching.ts), and a slick in it goes up (sim/oil.ts).
      ringCatch(z.x, z.y, z.r, w);
      lightNear(slicks, z.x, z.y, z.r, w.now, w.ev);
    }
    z.next += FIRE_PIT.every;
    const n = z.n ?? FIRE_PIT.dmg, friend = allyBurn(z);
    for (const e of w.enemies) {
      if (isDead(e) || e.act === 'carried' || e.under || (e.z ?? 0) !== 0 || !inPit(z, e, e.radius)) continue;
      e.lastBy = z.owner;
      if (damage(e, n, w.now, w.ev, { tick: true, el: 'fire', how: 'burn', src: 'firepit' })) continue;
      afflict(w, e, 'fire', n);
    }
    for (const h of w.heroes) {
      if (h.act === 'down' || h.act === 'roll' || h.out || h.safeT || (h.z ?? 0) !== 0 || !inPit(z, h)) continue;
      // SHAKE IT OFF: just after a dash, fire underfoot can't take (sim/ladderrogue.ts).
      if (fireproof(h, w.now)) {
        w.ev.push({ k: 'shakeoff', x: h.x, y: h.y });
        continue;
      }
      h.hp -= friend;
      w.ev.push({ k: 'hit', x: h.x, y: h.y, n: friend, heavy: false, on: 'hero', src: 'fire' });
      downIfDead(h, w.ev);
    }
    for (const v of w.survivors ?? []) if (inPit(z, v)) hurtSurvivor(v, friend, z.owner, w.now, w.ev, 0, 0, true);
  }
}
