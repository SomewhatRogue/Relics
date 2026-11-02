/**
 * Waiting by the door: stepping out of a house with someone you've freed, a third of the time a few
 * goblins are there (AMBUSH), awake and on you, spread in front of the door. More for a bigger party
 * (scaleFoes, the way rooms scale), never more than a small group. Rolled on the room's own seeded Rng.
 */
import { collide } from '../shared/arena';
import { AMBUSH, VARIANTS } from '../shared/tuning';
import type { Foe } from '../shared/terrain';
import type { Rng } from '../shared/rng';
import { newEnemy } from './enemies';
import { players, scaleFoes } from './party';
import type { Enemy, FightEvent, Hero } from './types';

/** Someone came out by the door at (x, y): maybe goblins are waiting. Returns how many. */
export function ambush(enemies: Enemy[], heroes: Hero[], rng: Rng, x: number, y: number, ev: FightEvent[]): number {
  if (rng.next() >= AMBUSH.chance) return 0;
  const n = AMBUSH.min + rng.int(AMBUSH.extra + 1), base: Foe[] = [];
  for (let i = 0; i < n; i++) {
    // Fanned out in front of the door (down the screen), a couple of steps off.
    const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.75 + rng.range(-0.15, 0.15), r = rng.range(AMBUSH.near, AMBUSH.far);
    const f: Foe = { kind: 'scrapper', x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.8, awake: true };
    if (rng.next() < AMBUSH.variant) f.variant = rng.next() < 0.5 ? 'lunger' : 'shield';
    base.push(f);
  }
  const party = players(heroes).length, foes = scaleFoes(base, party, party >= 3 ? rng.int(1e6) + 1 : 1).slice(0, AMBUSH.most);
  let id = Math.max(0, ...enemies.map((e) => e.id)) + 1;
  for (const f of foes) {
    const e = newEnemy(id++, f.kind, f.x, f.y);
    if (f.variant) (e.variant = f.variant), (e.hp = e.maxHp = VARIANTS[f.variant].hp);
    Object.assign(e, { respawns: false, alert: true, z: 0 });
    collide(e, e.radius);
    const dx = x - e.x, dy = y - e.y, l = Math.hypot(dx, dy) || 1;
    (e.fx = dx / l), (e.fy = dy / l);
    enemies.push(e);
    ev.push({ k: 'spotted', x: e.x, y: e.y });
  }
  return foes.length;
}
