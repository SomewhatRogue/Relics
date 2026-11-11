/**
 * The Open Cut, area 2: THE WORKINGS. In under the hill by the adit: three chambers cut into the rock, one
 * above the next, each way through at the other side from the last so the party crosses every chamber. The
 * first, the hungry asleep by the carts; the second, a kept cage, a shield wall with an archer, three
 * walking a round; the third, the rail across it, THE BRAKESMAN at the brake at its top letting the carts go
 * (sim/brake.ts), the gate up behind it.
 *
 * Fixed by hand; the seed only places the clutter.
 */
import { block, mark, newKit, patch, prop, round } from './expedkit.js';
import type { Pt } from './spine.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, keeper, pack } from './cutkit.js';
import { CUT_AREAS, CUT_NAMES } from './opencutwords.js';

export const WORKINGS = { w: 22, h: 46 };
/** Each chamber's wall (the way through is at the other end from the last) and where its scenes are. */
export const WORKINGS_AT = {
  walls: [{ y: 30, gap: 'left' as const }, { y: 14.4, gap: 'right' as const }],
  sleepers: { x: 15, y: 37.5 }, wall: { x: 14, y: 23 }, cage: { x: 3.2, y: 26.2 }, round: 19.6, brakesman: { x: 1.7, y: 7.9 }, rail: { y: 9.4, x0: 1.2, x1: 20.8 }, chest: { x: 19.6, y: 2.6 },
};

export function workingsPlan(job: Job): RoomPlan {
  const { w, h } = WORKINGS, A = WORKINGS_AT, k = newKit(new Rng(job.seed * 5279 + 23)), gap = 6;
  patch(k, 'earth', 0, 0, w, h, false);
  // The chambers' rock: a wall across, its way through at one end, timber props either side of it.
  for (const c of A.walls) {
    const x = c.gap === 'left' ? gap : 0;
    block(k, 'rockwall', x, c.y, w - gap, 1.4);
    const gx = c.gap === 'left' ? gap - 0.4 : w - gap + 0.4;
    round(k, 'support', gx, c.y + 1.7, 0.26);
  }
  // Rails and their carts down the first and last chambers; rubble and props along the walls.
  mark(k, 'drag', 1.5, 34.25, w - 3, 0.3);
  prop(k, 'cart', 4.2, 34.4), prop(k, 'cart', 8.6, 34.4);
  // The last chamber's rail (drawn from map.rail): one cart spent at the bottom, by the way in.
  prop(k, 'cart', A.rail.x1, A.rail.y);
  for (const [x, y] of [[1.2, 44], [20.6, 43], [20.4, 17.2], [1.4, 12.2], [12, 31.9]] as [number, number][]) round(k, 'rock', x, y, 0.5 + k.rng.range(0, 0.3));
  for (const y of [40, 21, 4]) round(k, 'support', 0.7, y, 0.26), round(k, 'support', w - 0.7, y, 0.26);
  // Fire baskets: the only light under the hill.
  k.braziers.push({ x: 2.6, y: 40, r: 0.3, wild: true }, { x: 19.4, y: 25.6, r: 0.3, wild: true }, { x: 3.4, y: 4.6, r: 0.3, wild: true },
    // (One by each chamber's way through, so the rock walls read.)
    { x: 3, y: 32.4, r: 0.3, wild: true }, { x: 19, y: 16.8, r: 0.3, wild: true }, { x: 18.6, y: 12.2, r: 0.3, wild: true });

  // 1. Asleep by the carts in the first chamber.
  pack(k, 1, A.sleepers, ['fodder', 'fodder', 'sapper'], 1.2);

  // 2 and 3. The second chamber: a kept cage, and a shield wall with its archer across the way.
  prop(k, 'cage', A.cage.x, A.cage.y);
  pack(k, 2, { x: A.cage.x + 1.6, y: A.cage.y - 0.6 }, ['netter', 'fodder'], 0.9);
  pack(k, 3, A.wall, ['shield', 'shield', 'archer', 'fodder'], 1.3);

  // 4. Three walking a round across the second chamber.
  const beat: Pt[] = [[3, A.round], [w - 3, A.round]];
  for (let i = 0; i < 3; i++) k.foes.push({ kind: 'scrapper', x: 4 + i * 1.1, y: A.round, task: { k: 'patrol', pts: beat, i: 1 }, pack: 4 });

  // 5. The third chamber: THE BRAKESMAN at its brake, a few of its own over the rail.
  keeper(k, 5, A.brakesman, 'heavy', CUT_NAMES.brakesman, 380).brakes = true;
  pack(k, 5, { x: 11, y: 5.4 }, ['lunger', 'lunger', 'fodder'], 2);
  k.chests.push({ ...A.chest });
  return areaPlan(k, job, { name: CUT_AREAS[1], w, h, kind: 'mine', torches: [5, w - 5] }, { rail: { ...A.rail } });
}
