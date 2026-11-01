/**
 * Wooden buildings on a job (cottages, barns, fences, goblin dens). Blows and blasts chip them; oil
 * fire, fire blasts and burning goblins set them alight; fire eats them and spreads to wood nearby,
 * catching goblins that stand too close; at nothing they fall in and are rubble you walk over. A den
 * that stands sends out another scrapper every few seconds. The blocks are the map's own (the room owns
 * its map), so the rules collide against what's still standing.
 */
import { currentMap, doorAt, type Block } from '../shared/arena';
import { BLAZE } from '../shared/props';
import type { Augment, Swing } from '../shared/tuning';
import { inArc } from './combat';
import { isDead } from './damage';
import { afflict, type World } from './elements';
import type { FightEvent, Hero } from './types';

export const wood = (b: Block) => b.hp !== undefined && !b.ruined;
export const burning = (b: Block) => (b.burning ?? -1) >= 0 && !b.ruined;

/** The nearest point of a block to (x, y), and how far it is. */
function nearest(b: Block, x: number, y: number): [number, number, number] {
  const nx = Math.max(b.x, Math.min(b.x + b.w, x)), ny = Math.max(b.y, Math.min(b.y + b.h, y));
  return [nx, ny, Math.hypot(x - nx, y - ny)];
}

function ignite(b: Block, now: number, ev: FightEvent[]): void {
  if (!wood(b) || burning(b)) return;
  b.burning = now;
  ev.push({ k: 'blaze', x: b.x + b.w / 2, y: b.y + b.h / 2 });
}

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

/** A blast at (x, y) knocks at the walls in reach; a fire blast sets them alight. */
export function blastBlocks(x: number, y: number, r: number, dmg: number, el: Augment, now: number, ev: FightEvent[]): void {
  for (const b of currentMap().blocks) {
    if (!wood(b) || nearest(b, x, y)[2] > r) continue;
    if (el === 'fire') ignite(b, now, ev);
    hurt(b, dmg * BLAZE.blast, ev);
  }
}

/** Fire takes hold, burns, spreads and catches goblins; dens send out scrappers. `spawn` adds one at a den's door. */
export function stepBuildings(w: World, dt: number, spawn: (x: number, y: number) => void): void {
  const blocks = currentMap().blocks;
  if (!blocks.some(wood)) return;
  for (const e of w.ev) {
    if (e.k !== 'oilfire') continue;
    for (const b of blocks) if (nearest(b, e.x, e.y)[2] <= BLAZE.oilReach) ignite(b, w.now, w.ev);
  }
  for (const e of w.enemies) {
    if (isDead(e) || e.burnUntil <= w.now) continue;
    for (const b of blocks) if (nearest(b, e.x, e.y)[2] <= e.radius + BLAZE.reach) ignite(b, w.now, w.ev);
  }
  for (const b of blocks) {
    if (!burning(b)) continue;
    hurt(b, BLAZE.dps * dt, w.ev);
    for (const e of w.enemies) if (!isDead(e) && e.burnUntil <= w.now && nearest(b, e.x, e.y)[2] <= e.radius + BLAZE.reach) afflict(w, e, 'fire', 4);
    if (w.now - b.burning! < BLAZE.spreadAfter) continue;
    for (const o of blocks) {
      if (o === b || !wood(o)) continue;
      const [nx, ny] = nearest(o, b.x + b.w / 2, b.y + b.h / 2), [, , d] = nearest(b, nx, ny);
      if (d <= BLAZE.spreadReach) ignite(o, w.now, w.ev);
    }
  }
  // Dens breed goblins while they stand.
  const tick = Math.floor(w.now / BLAZE.denEvery) !== Math.floor((w.now - dt) / BLAZE.denEvery);
  if (!tick) return;
  let alive = w.enemies.filter((e) => !isDead(e)).length;
  for (const b of blocks) {
    if (b.kind !== 'den' || b.ruined || alive >= BLAZE.denCap) continue;
    const d = doorAt(b);
    spawn(d.x, d.y + 0.2);
    w.ev.push({ k: 'denspawn', x: d.x, y: d.y });
    alive++;
  }
}
