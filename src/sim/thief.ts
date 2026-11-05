/**
 * The sneak-thief (numbers: shared/raiders.ts THIEF). It hangs back while the fight starts, works round
 * behind someone and darts in to grab: gold off them (or the front potion if they're carrying little),
 * then it bolts for the room's edge. Kill it and what it took drops where it falls; let it get away
 * and it's gone, and so is what it took.
 */
import { SCRAPPER, THIEF } from '../shared/tuning';
import { currentMap } from '../shared/arena';
import { isDead } from './damage';
import { begin, walk } from './enemies';
import { dropLoot, type Pickup } from './pickups';
import type { Enemy, FightEvent, Hero } from './types';

/** The thief's turn. */
export function stepThief(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, speed: number, now: number, dt: number, ev: FightEvent[]): void {
  if (e.loot) return away(e, t, dt);
  e.lurkT = (e.lurkT ?? 0) + dt;
  if (e.cooldown <= 0 && d <= THIEF.grab.range! && facing > 0.8) return begin(e, 'grab', THIEF.grab, t, ev);
  // A few seconds lurking at the edge of the fight, working round toward their back; then in.
  if (e.lurkT < 4 && d < THIEF.lurk + 1) {
    const bx = t.x - t.fx * THIEF.lurk, by = t.y - t.fy * THIEF.lurk, gd = Math.hypot(bx - e.x, by - e.y);
    if (gd > 0.6) walk(e, bx - e.x, by - e.y, speed * THIEF.speed * 0.8, dt);
    return;
  }
  walk(e, ux, uy, speed * THIEF.speed * Math.max(0.3, facing), dt);
}

/** Running with it: away from whoever's nearest, toward the nearest edge on that side of them. */
function away(e: Enemy, t: Hero, dt: number): void {
  const m = currentMap(), dx = e.x - t.x, dy = e.y - t.y, l = Math.hypot(dx, dy) || 1;
  // Of the four edges, the near one that doesn't take it back past you.
  const edges: [number, number, number][] = [[-1, 0, e.x], [1, 0, m.w - e.x], [0, -1, e.y], [0, 1, m.h - e.y]];
  const [toX, toY] = edges.filter(([x, y]) => x * dx + y * dy > -0.2 * l).sort((a, b) => a[2] - b[2])[0] ?? [dx / l, dy / l];
  const mx = dx / l + toX * 1.3, my = dy / l + toY * 1.3, ml = Math.hypot(mx, my) || 1;
  (e.fx = mx / ml), (e.fy = my / ml);
  walk(e, mx, my, SCRAPPER.speed * THIEF.run, dt);
}

/** The grab landed on `h`: gold if they've enough on them, else the front potion. */
export function rob(e: Enemy, h: Hero, ev: FightEvent[]): void {
  if (e.loot) return;
  if (h.purse >= THIEF.least) {
    const n = Math.max(1, Math.min(THIEF.take[1], Math.max(THIEF.take[0], Math.floor(h.purse / 2)), h.purse));
    h.purse -= n;
    e.loot = { gold: n };
    ev.push({ k: 'stolen', x: h.x, y: h.y, id: h.id, n });
  } else if (h.belt.length) {
    const potion = h.belt.shift()!;
    e.loot = { potion };
    ev.push({ k: 'stolen', x: h.x, y: h.y, id: h.id, n: 0, potion });
  } else return;
  e.cooldown = 99;
}

/** Thieves with what they took: a dead one drops it; one that's got away is gone with it. */
export function stepThieves(enemies: Enemy[], heroes: Hero[], pickups: Pickup[], ev: FightEvent[]): void {
  const m = currentMap();
  for (const e of enemies) {
    if (e.variant !== 'thief' || !e.loot) continue;
    if (isDead(e)) {
      dropLoot(pickups, e.x, e.y, e.loot);
      ev.push({ k: 'recovered', x: e.x, y: e.y });
      e.loot = undefined;
      continue;
    }
    const edge = e.x < THIEF.edge || e.y < THIEF.edge || e.x > m.w - THIEF.edge || e.y > m.h - THIEF.edge;
    const far = heroes.every((h) => h.act === 'down' || Math.hypot(h.x - e.x, h.y - e.y) > THIEF.escape);
    if (!edge && !far) continue;
    // Gone, with it: no body, nothing to pay.
    Object.assign(e, { act: 'dead', actT: 99, hp: 0, attack: null, escaped: true, respawns: false, death: '' });
    ev.push({ k: 'escaped', x: e.x, y: e.y });
    e.loot = undefined;
  }
}
