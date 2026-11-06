/**
 * Lightning through a pool (numbers: shared/worldfx.ts POOL; Kyle, 2026-11-05). Storm landing on a goblin
 * standing in water jolts everyone in that same body of water (shared/waterbody.ts) within POOL.reach,
 * nearest first, POOL.cap bodies at most, friends counted. Goblins take what a wet jump takes
 * (sim/elements.ts zap does the hurting); an ironhide jolted has its guard broken (sim/rods.ts).
 * Friends in the water take nothing from a friend's storm: the wand's strike spares them, so its water
 * does too, and on a phone you can't see who's wading the far end of a ford. The sky's own lightning is
 * on nobody's side: landing in water it jolts goblins POOL.wildFoe and friends POOL.wild. Both views draw
 * the crackle across the water from the `pooljolt` event.
 */
import { currentMap } from '../shared/arena';
import { POOL } from '../shared/tuning';
import { bodyAt } from '../shared/waterbody';
import { downIfDead } from './combat';
import { damage, isDead } from './damage';
import { jolt } from './rods';
import { hurtSurvivor } from './survivors';
import type { Enemy, FightEvent, Hero, Strike, Survivor } from './types';

type At = { x: number; y: number; z?: number };
const level = (b: At) => (b.z ?? 0) === 0;

/** The body of water a body stands in (-1: dry, or up on a ledge). */
export const waterOf = (b: At) => (level(b) ? bodyAt(currentMap(), b.x, b.y) : -1);

/** A goblin that can be jolted: alive, on its feet in the water, not carried, under or dozing. */
const joltable = (o: Enemy) => !isDead(o) && o.act !== 'carried' && !o.under && !o.dozing && level(o);
const friend = (h: Hero) => h.act !== 'down' && !h.out && level(h);
const freed = (v: Survivor) => !v.dead && !v.gone && !v.taken;

export interface Pool { foes: Enemy[]; friends: (Hero | Survivor)[]; body: number }

/** Who's in water `body` within POOL.reach of (x, y), nearest first, POOL.cap at most; goblins `skip`
 *  leaves out (the one struck, those this cast has reached already). */
export function poolOf(body: number, x: number, y: number, enemies: Enemy[], heroes: Hero[], survivors: Survivor[], skip: (o: Enemy) => boolean): Pool {
  const all: { b: Enemy | Hero | Survivor; foe: boolean; d: number }[] = [];
  const near = (b: At) => Math.hypot(b.x - x, b.y - y);
  for (const o of enemies) if (joltable(o) && !skip(o) && near(o) <= POOL.reach && waterOf(o) === body) all.push({ b: o, foe: true, d: near(o) });
  for (const h of heroes) if (friend(h) && near(h) <= POOL.reach && waterOf(h) === body) all.push({ b: h, foe: false, d: near(h) });
  for (const v of survivors) if (freed(v) && near(v) <= POOL.reach && waterOf(v) === body) all.push({ b: v, foe: false, d: near(v) });
  all.sort((a, b) => a.d - b.d);
  const got = all.slice(0, POOL.cap);
  return { foes: got.filter((g) => g.foe).map((g) => g.b as Enemy), friends: got.filter((g) => !g.foe).map((g) => g.b as Hero | Survivor), body };
}

/** The jolt as both views draw it: from (x, y) across the water to each goblin, past each friend. */
export function sayPool(p: Pool, x: number, y: number, ev: FightEvent[], wild = false): void {
  if (!p.foes.length && !p.friends.length) return;
  ev.push({ k: 'pooljolt', x, y, to: p.foes.map((o) => [o.x, o.y]), spared: p.friends.map((o) => [o.x, o.y]), body: p.body, ...(wild ? { wild } : {}) });
}

/** What the sky's strike needs of its room. */
interface WildRoom { heroes: Hero[]; enemies: Enemy[]; survivors: Survivor[]; time: number; events: FightEvent[] }

/** The sky's own lightning landing in water (its circle's middle, or a goblin it struck standing in it):
 *  everyone else in that water jolted, friends too. */
export function wildJolt(r: WildRoom, s: Strike, struck: Enemy[]): void {
  const into = waterOf(s) >= 0 ? s : struck.find((e) => waterOf(e) >= 0);
  const body = into ? waterOf(into) : -1;
  if (!into || body < 0) return;
  const t = r.time, ev = r.events;
  const p = poolOf(body, into.x, into.y, r.enemies, r.heroes, r.survivors, (o) => struck.includes(o));
  sayPool(p, into.x, into.y, ev, true);
  for (const o of p.foes) {
    jolt(o, t, ev);
    damage(o, POOL.wildFoe, t, ev, { flinch: 0.25, el: 'storm', src: 'spark' });
  }
  for (const f of p.friends) {
    if ('dead' in f) {
      hurtSurvivor(f, POOL.wild, '', t, ev, 0, 0);
      continue;
    }
    // A roll gets out of it, as from any blow; the grace on coming in holds.
    if (f.act === 'roll' || f.safeT) continue;
    f.hp -= POOL.wild;
    ev.push({ k: 'hit', x: f.x, y: f.y, n: POOL.wild, heavy: false, on: 'hero', src: 'storm' });
    downIfDead(f, ev);
  }
}
