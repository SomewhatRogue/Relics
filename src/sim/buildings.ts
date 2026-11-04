/**
 * Wooden buildings on a job (cottages, barns, fences, goblin dens). Blows and blasts chip them; oil
 * fire, fire blasts and burning goblins set them alight; fire eats them and spreads to wood nearby,
 * catching goblins that stand too close; at nothing they fall in and are rubble you walk over. A den
 * that stands sends out another scrapper every few seconds. The blocks are the map's own (the room owns
 * its map), so the rules collide against what's still standing.
 */
import { currentMap, doorAt, type Block } from '../shared/arena';
import { burnable } from '../shared/kindling';
import { BLAZE } from '../shared/props';
import { CATCH, type Augment, type Swing } from '../shared/tuning';
import { burstCatch, burning, ignite, nearest, wood } from './catching';
import { inArc } from './combat';
import { isDead } from './damage';
import { afflict, type World } from './elements';
import type { FightEvent, Hero } from './types';

export { burning, wood } from './catching';

function hurt(b: Block, n: number, ev: FightEvent[]): void {
  if (!wood(b)) return;
  b.hp = Math.max(0, b.hp! - n);
  if (b.hp > 0) return;
  b.ruined = true;
  ev.push({ k: 'collapse', x: b.x, y: b.y, w: b.w, h: b.h });
}

/** A melee swing that reaches a wooden wall chips it (once a swing). */
export function sweepBlocks(h: Hero, s: Swing, ev: FightEvent[]): void {
  currentMap().blocks.forEach((b, i) => {
    if (!wood(b) || h.hitIds.includes(-10000 - i)) return;
    const [nx, ny] = nearest(b, h.x, h.y);
    if (!inArc(h.x, h.y, h.fx, h.fy, nx, ny, s.range, s.arc, 0.05)) return;
    h.hitIds.push(-10000 - i);
    ev.push({ k: 'chop', x: nx, y: ny });
    hurt(b, s.dmg * BLAZE.melee * (h.heavy ? 1.5 : 1), ev);
  });
}

/** A blast at (x, y) knocks at the walls in reach; a fire blast may set them alight (`oil`: a Lamp Oil flask). */
export function blastBlocks(w: World, x: number, y: number, r: number, dmg: number, el: Augment, oil = false): void {
  for (const b of currentMap().blocks) {
    if (!wood(b)) continue;
    if (el === 'fire') burstCatch(b, x, y, r, oil, w);
    if (nearest(b, x, y)[2] <= r && !(burnable(b) && burning(b))) hurt(b, dmg * BLAZE.blast, w.ev);
  }
}

/** Fire takes hold, burns, spreads and catches goblins; dens send out scrappers. `spawn` adds one at a den's door. */
export function stepBuildings(w: World, dt: number, spawn: (x: number, y: number) => void, near: (x: number, y: number) => boolean = () => true): void {
  const blocks = currentMap().blocks;
  if (!blocks.some(wood)) return;
  for (const e of w.ev) {
    if (e.k !== 'oilfire') continue;
    for (const b of blocks) if (nearest(b, e.x, e.y)[2] <= BLAZE.oilReach) ignite(b, w, CATCH.barrel);
  }
  for (const e of w.enemies) {
    if (isDead(e) || e.burnUntil <= w.now) continue;
    for (const b of blocks) if (nearest(b, e.x, e.y)[2] <= e.radius + BLAZE.reach) ignite(b, w, CATCH.rub * dt);
  }
  for (const b of blocks) {
    if (!burning(b)) continue;
    // A house alight burns on its own clock (sim/houseburn.ts); other wood burns down as it goes.
    if (!burnable(b)) hurt(b, BLAZE.dps * dt, w.ev);
    for (const e of w.enemies) if (!isDead(e) && e.burnUntil <= w.now && nearest(b, e.x, e.y)[2] <= e.radius + BLAZE.reach) afflict(w, e, 'fire', 4);
    if (w.now - b.burning! < BLAZE.spreadAfter) continue;
    for (const o of blocks) {
      if (o === b || !wood(o)) continue;
      const [nx, ny] = nearest(o, b.x + b.w / 2, b.y + b.h / 2), [, , d] = nearest(b, nx, ny);
      if (d <= BLAZE.spreadReach) ignite(o, w, burnable(o) ? CATCH.spread * dt : 1);
    }
  }
  // Dens breed goblins while they stand.
  const tick = Math.floor(w.now / BLAZE.denEvery) !== Math.floor((w.now - dt) / BLAZE.denEvery);
  if (!tick) return;
  let alive = w.enemies.filter((e) => !isDead(e)).length;
  for (const b of blocks) {
    if (b.kind !== 'den' || b.ruined || alive >= BLAZE.denCap) continue;
    const d = doorAt(b);
    // (On a big map, a den nobody's near breeds nothing.)
    if (!near(d.x, d.y)) continue;
    spawn(d.x, d.y + 0.2);
    w.ev.push({ k: 'denspawn', x: d.x, y: d.y });
    alive++;
  }
}
