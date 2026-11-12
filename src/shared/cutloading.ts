/**
 * The Open Cut, over the top: THE LOADING STAGE (docs/design/open-cut-arc.md), at the lip of the pit, where the
 * ore comes up the ropeway and is loaded out. THE HAULIER works it, this way's boss: its whole fight as in its own
 * ground (shared/sumparena.ts), laid here at the top of the map: the ore rail across the stage with a cart at each
 * stop, the winding gear over the ropeway's shaft, the flooded sump, the adit the small ones come out of in phase
 * 2. The chained chest at the back opens at the kill. Its fight is set going by the instance's room
 * (sim/instanceroom.ts), as its arena's is (sim/arenaroom.ts).
 *
 * Fixed by hand; the seed only places the clutter.
 */
import { block, mark, newKit, patch, round } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, body } from './cutkit.js';
import { HAULIER } from './haultune.js';
import { HAUL_NAME } from './bosswords.js';
import { SUMP_SPOTS } from './sumparena.js';

export const LOADING = { w: 18, h: 24, name: 'THE LOADING STAGE' };
/** Where the Haulier's working lies on the stage: its own ground's spots, moved by this. */
export const LOADING_AT = { dx: 3, dy: 4 };

export function loadingPlan(job: Job): RoomPlan {
  const { w, h } = LOADING, { dx, dy } = LOADING_AT, s = SUMP_SPOTS, k = newKit(new Rng(job.seed * 2711 + 89));
  const at = <T extends { x: number; y: number }>(p: T): T => ({ ...p, x: p.x + dx, y: p.y + dy });
  patch(k, 'earth', 0, 0, w, h, false), patch(k, 'swept', dx, dy, 12, 14);
  // The lip of the pit behind: rock either side of the way out, the stage hut and the ore bins.
  block(k, 'rockwall', 0, 0, 6.6, 1.4), block(k, 'rockwall', w - 6.6, 0, 6.6, 1.4);
  block(k, 'shack', 0.6, 1.8, 3.2, 2.2), block(k, 'sacks', w - 3.4, 2, 2.6, 1.2), block(k, 'sacks', w - 2.6, 3.4, 1.8, 1);
  // The working: the gear's headframe legs either side of the shaft, two more by the sump; spoil at the edges.
  const g = at(s.gear);
  for (const [x, y] of [[g.x - 0.9, g.y + 0.5], [g.x + 0.9, g.y + 0.5], [dx + 3.2, dy + 10.4], [dx + 8.8, dy + 10.4]] as [number, number][]) round(k, 'support', x, y, 0.28);
  block(k, 'rubble', dx + 0.2, dy + 0.1, 2.4, 1), block(k, 'rubble', dx + 10.6, dy + 12.2, 1.2, 1.2);
  k.water.push(at(s.sump));
  // The ropeway's pylons down the stage's sides; spilled ore; a loader who didn't get out.
  for (const y of [5, 11, 17]) round(k, 'support', 1.2, y, 0.3), round(k, 'support', w - 1.2, y + 1, 0.3);
  mark(k, 'debris', dx + 4.6, dy + 12.6, 3, 1.4), mark(k, 'trample', dx + 4.4, dy + 4.8, 3.6, 3.2);
  body(k, dx + 1.4, dy + 12.4, 'villager');
  k.braziers.push(at({ x: 0.9, y: 5.0, r: 0.3 }), at({ x: 11.1, y: 5.0, r: 0.3 }), at({ x: 10.8, y: 9.6, r: 0.3 }), { x: 2.2, y: h - 2.4, r: 0.3, wild: true });
  // THE HAULIER on its stage, the carts at their stops, the chained chest behind.
  k.foes.push({ kind: 'scrapper', variant: 'ironhide', ...at(s.haulier), hp: HAULIER.hp, name: HAUL_NAME, boss: 'haulier', awake: false });
  for (const q of s.stops) k.props.push({ kind: 'cart', ...at(q) });
  k.chests.push({ ...at(s.chest), chained: true });
  return areaPlan(k, job, { name: LOADING.name, w, h, kind: 'mine', torches: [dx + 3.4, dx + 7.6] }, {
    rail: { y: s.rail.y + dy, x0: s.rail.x0 + dx, x1: s.rail.x1 + dx }, gear: g, adits: s.adits.map(at),
  });
}
