/**
 * A storm's lightning (Kyle, 2026-11-04; numbers: LIGHTNING in shared/tuning.ts). Under a stormy sky
 * (shared/sky.ts), never indoors or underground, every 8 to 14 seconds on the room's own sky stream it
 * picks something tall or metal out in the open (sim/stormpick.ts) and shows a red circle with the
 * striped edge (no block) a second before it lands. Landing, it hurts everyone in the circle, goblins
 * and heroes alike, so you can pull a fight under it: small goblins are stunned (the storm takes its
 * turn as one stunner under the 6 s cap), a siege engine is cracked, all are thrown out. The strike is
 * kept a moment after for the flash and the bolt. One shape drawn and judged: sim/stormshape.ts.
 */
import type { GameMap } from '../shared/arena';
import type { Rng } from '../shared/rng';
import { ENGINE } from '../shared/expedcamps';
import { LIGHTNING, TICK } from '../shared/tuning';
import { shove } from './bodies';
import { hurtBlock } from './buildings';
import { downIfDead } from './combat';
import { damage, isDead, small } from './damage';
import { pickStrike } from './stormpick';
import { inStrike } from './stormshape';
import { stun } from './stuns';
import { hurtSurvivor } from './survivors';
import type { Enemy, FightEvent, Hero, Strike, Survivor } from './types';
import { count } from './score';

/** What the storm needs of its room. */
export interface StormRoom {
  map: GameMap;
  heroes: Hero[];
  enemies: Enemy[];
  survivors: Survivor[];
  time: number;
  events: FightEvent[];
  indoors: boolean;
  strikes: Strike[];
  /** Room time of the next strike's circle (-1: not set yet). */
  nextStrike: number;
}

/** The storm's id for the stun cap: it takes a goblin's turn as one stunner. */
export const STORM_ID = 'storm';

export function stepStorm(r: StormRoom, rng: Rng): void {
  const t = r.time;
  for (const s of r.strikes) if (!s.done && t >= s.at) land(r, s);
  r.strikes = r.strikes.filter((s) => t - s.at < LIGHTNING.fade);
  if (r.map.theme.sky !== 'storm' || r.indoors) return;
  if (r.nextStrike < 0) return void (r.nextStrike = t + rng.range(...LIGHTNING.every));
  if (t < r.nextStrike) return;
  r.nextStrike = t + rng.range(...LIGHTNING.every);
  const p = pickStrike(r.map, r.heroes, r.enemies, rng);
  if (!p) return;
  r.strikes.push({ id: Math.round(t / TICK), x: p.x, y: p.y, r: LIGHTNING.r, at: t + LIGHTNING.warn, on: p.on });
  r.events.push({ k: 'strikewarn', x: p.x, y: p.y });
}

/** Thrown out from the strike's middle. */
const away = (s: Strike, b: { x: number; y: number }) => {
  const dx = b.x - s.x, dy = b.y - s.y, l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l] as const;
};

function land(r: StormRoom, s: Strike): void {
  const t = r.time, ev = r.events;
  s.done = true;
  ev.push({ k: 'strike', x: s.x, y: s.y });
  for (const e of r.enemies) {
    if (isDead(e) || e.under || (e.z ?? 0) !== 0 || !inStrike(s, e, e.radius)) continue;
    const [dx, dy] = away(s, e);
    if (damage(e, LIGHTNING.dmg, t, ev, { heavy: true, how: 'burst', dx, dy, el: 'storm' })) continue;
    if (small(e) && e.act !== 'carried') stun(e, STORM_ID, t, LIGHTNING.stun, ev);
    if (e.act !== 'carried' && e.act !== 'pinned') shove(e, dx, dy, LIGHTNING.knock, e.weight);
  }
  for (const h of r.heroes) {
    // A roll gets out from under it, as from any blow; the grace on coming in holds.
    if (h.act === 'down' || h.act === 'roll' || h.out || h.safeT || (h.z ?? 0) !== 0 || !inStrike(s, h)) continue;
    const [dx, dy] = away(s, h);
    h.hp -= LIGHTNING.heroDmg;
    count(h.id, 'taken', LIGHTNING.heroDmg);
    ev.push({ k: 'hit', x: h.x, y: h.y, n: LIGHTNING.heroDmg, heavy: true, on: 'hero', src: 'storm' });
    (h.kvx += dx * LIGHTNING.knock), (h.kvy += dy * LIGHTNING.knock);
    downIfDead(h, ev);
  }
  for (const v of r.survivors) if (inStrike(s, v)) hurtSurvivor(v, LIGHTNING.heroDmg, '', t, ev, ...away(s, v));
  // A siege engine struck is cracked.
  if (s.on === 'engine') for (const b of r.map.blocks) if (b.kind === 'cart' && b.look === ENGINE.look && !b.ruined && Math.hypot(b.x + b.w / 2 - s.x, b.y + b.h / 2 - s.y) < 0.5) hurtBlock(b, LIGHTNING.engine, ev);
}
