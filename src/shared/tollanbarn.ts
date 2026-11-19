/**
 * Tollan's Farm, map 3: THE BARN (docs/design/territories.md, "2. Tollan's Farm"). Inside the great barn, in
 * through the doors the yard's dead were keeping: 26 by 18, one room, one fight. It is the hunt's last ground:
 * MAWL is here and the job is done when it is dead.
 *
 *   A bank barn as old as the farm. The hay mow banked down the west aisle, the roof posts in two rows, the
 *   threshing floor flagged and swept between them, the stalls along the back. The east aisle is MAWL's larder: everything carried over from the house is heaped there (the dresser's
 *   crocks, the flour, the cider, the washing) and it eats among it. Three of the small ones feed at its heap.
 *   The family's chest is chained behind it.
 *
 * What matters in the fight: the six roof posts and the three hay stacks break a line and stop a rush, the
 * middle is open for the cleave to be seen and stepped out of, and the larder's heap narrows the east aisle.
 * The seed moves loose things only (the wisps, which heap has which goods); never the posts, the stacks, the
 * way in, MAWL or the chest. It was first laid as a walled court at the top of the yard map and read as one,
 * not as a barn: an inside is a room with walls and a roof's shade (2026-11-18). Pure.
 */
import type { GameMap, Theme } from './arena.js';
import { cast } from './encounter.js';
import { block, claim, newKit, patch, round, type Kit, type P } from './expedkit.js';
import type { Job } from './jobs.js';
import { markAt, sprinkle } from './lowfurrowrisekit.js';
import { Rng } from './rng.js';
import { wooden } from './sitekit.js';
import type { TerrPlan, TerrZone } from './territory.js';

export const BARN = { w: 26, h: 18 };
/** Fixed: where MAWL stands at its heap, the chained chest behind it, the roof posts, the hay stacks. */
export const BARN_SPOTS = {
  mawl: { x: 19.6, y: 6.6 } as P,
  chest: { x: 23.4, y: 2.2 } as P,
  posts: [[7.4, 4.2], [7.4, 9], [7.4, 13.8], [18.6, 4.2], [18.6, 9], [18.6, 13.8]] as [number, number][],
  stacks: [{ x: 0.5, y: 2.4, w: 4.6, h: 2.6 }, { x: 0.5, y: 6.4, w: 5, h: 2.8 }, { x: 0.5, y: 10.8, w: 4.2, h: 2.4 }],
};
export const BARN_ZONES: TerrZone[] = [{ name: 'THE BARN', kind: 'zone', x: 0, y: 0, w: BARN.w, h: BARN.h, stretch: 0 }];

/** The mow down the west aisle: three stacks against the wall, loose hay come down off them onto the floor. */
function mow(k: Kit): void {
  patch(k, 'straw', 0, 1.4, 6.4, 13.4, false);
  for (const q of BARN_SPOTS.stacks) k.blocks.push(wooden({ kind: 'haystack', ...q })), claim(k, q.x + q.w / 2, q.y + q.h / 2, 3);
  for (const [x, y, r] of [[5.6, 4, 0.42], [6, 10, 0.4], [1.6, 14.4, 0.45], [3.4, 15, 0.4]] as const) round(k, 'hay', x, y, r);
  for (const [x, y] of [[6.6, 6.6], [6.2, 12.2], [5, 15.6]] as const) markAt(k, 'straw', x, y, 2.4, 1.1);
}

/** The threshing floor between the posts, and the stalls along the back wall. */
function floor(k: Kit): void {
  patch(k, 'swept', 8, 3.6, 10, 11.6), patch(k, 'flags', 9, 5, 8, 8.4, false);
  for (const [x, y] of BARN_SPOTS.posts) k.rounds.push({ kind: 'support', x, y, r: 0.3 }), claim(k, x, y, 0.5);
  for (const x of [7, 10.2, 13.4]) block(k, 'pen', x, 0.3, 3, 2.2);
  round(k, 'sacks', 8.4, 15.6, 0.4), round(k, 'sacks', 9.4, 16.2, 0.36), round(k, 'barrels', 17.4, 16, 0.4);
  round(k, 'lantern', 7.4, 6.6, 0.22), round(k, 'lantern', 18.6, 11.4, 0.22);
  sprinkle(k, 'straw', 6, 8.4, 4, 17.6, 15, 1.3, 0.6);
}

/** MAWL's larder in the east aisle: the house's goods heaped, eaten among; blood in two places only. */
function larder(k: Kit): void {
  patch(k, 'mud', 19.4, 2.6, 6.2, 9.6), patch(k, 'straw', 20, 12.4, 5.6, 3.4);
  const goods = ['crates', 'barrels', 'sacks', 'pots', 'crates', 'washtub', 'barrels', 'sacks', 'pots'] as const, turn = k.rng.int(goods.length);
  ([[21.2, 1.4, 0.46], [18.2, 1.3, 0.42], [24.8, 4.4, 0.4], [24.9, 6.4, 0.3], [24.6, 8.6, 0.44], [24.4, 11, 0.46], [22.6, 12.6, 0.4], [21.8, 4.2, 0.36], [22.4, 10.2, 0.28]] as const)
    .forEach(([x, y, r], i) => round(k, goods[(i + turn) % goods.length], x, y, r));
  markAt(k, 'blood', BARN_SPOTS.mawl.x + 1.4, BARN_SPOTS.mawl.y + 1.2, 2, 1.1), markAt(k, 'blood', 23, 13.6, 1.2, 0.7);
  for (const [x, y] of [[20.6, 8.8], [22.8, 6], [20.4, 3.6], [23.4, 9.6]] as const) markAt(k, 'debris', x, y, 1.3, 0.6);
  k.chests.push({ ...BARN_SPOTS.chest, chained: true }), claim(k, BARN_SPOTS.chest.x, BARN_SPOTS.chest.y, 0.8);
}

export function barnPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 8111 + 47));
  Object.assign(k, { mw: BARN.w, mh: BARN.h });
  const { w, h } = BARN, s = BARN_SPOTS;
  claim(k, w / 2, h - 2, 2.4), claim(k, s.mawl.x, s.mawl.y, 1.4);
  mow(k), floor(k), larder(k);
  // Three feeding at the heap, backs to the doors; MAWL at it.
  for (const [x, y] of [[21.6, 8.2], [17.4, 5.2], [22.2, 5.6]] as const) {
    k.foes.push(Object.assign(cast({ kind: 'scrapper', x: x + k.rng.range(-0.2, 0.2), y: y + k.rng.range(-0.2, 0.2), pack: 328 }, 'fodder'), { feeding: true }));
  }
  k.foes.push({ kind: 'butcher', x: s.mawl.x, y: s.mawl.y, hp: 520, name: 'MAWL', pack: 329 });
  // Dim: the day comes in at the doors behind you and through the gaps in the boards; two lanterns left burning.
  const theme: Theme = { floor: 'dirt', back: 'palisade', moon: 0.38, ambient: [0.26, 0.23, 0.22] };
  const map: GameMap = {
    name: "TOLLAN'S FARM", w, h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, theme, soil: k.soil, marks: k.marks,
    torches: [{ x: 5.4, y: 0.2 }, { x: 17.4, y: 0.2 }], braziers: [{ x: 10.4, y: 16.4, r: 0.3 }, { x: 15.6, y: 16.4, r: 0.3 }],
    hero: { x: w / 2, y: h - 1.6 }, exit: { x: w / 2 - 1.5, y: h - 0.7, w: 3, h: 0.7 },
    stretches: [{ name: 'THE BARN', keep: [], packs: [328, 329] }],
    // The dog never comes in while MAWL stands. After, it is at the doors, to follow you home.
    dog: { posts: [[w / 2 - 1.4, h - 1.2]], late: true },
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: BARN_ZONES.map((z) => ({ ...z })) };
}
