/**
 * A lived-in Wickhold (docs/design/lived-in-world.md, slice 1): townsfolk at work where they live, the street
 * things they work among, and animals about the place.
 *
 * - Folk: a smith at his anvil before the forge, a washerwoman going pond, tub, line; a woodcutter between the
 *   church and the hall; a carter pushing his handcart along the south lane; a potboy sweeping the Drowned Rat's
 *   step; two children chasing round the Lantern, one bowling a hoop. Each walks a short round and stops to work
 *   (npcstops.ts), on the wall clock so every screen has them in the same spot, `mute`, never in anyone's way.
 * - Things: fixed pieces drawn the same in both views (client/streetpieces.ts), set against walls and on the
 *   greens, off the lanes, the square and every doorway (the town tests hold it).
 * - Animals: `life`, paint only (client/townbeasts.ts): never collided, walked round or sent over the wire.
 *
 * Pure: the same world gives the same town.
 */
import type { Npc, Round } from './arena.js';
import type { WorldState } from './story.js';

export type LifeKind = 'hens' | 'ducks' | 'cat' | 'pigeons';
/** Animals at a place: `n` of them about (x, y) within `r` tiles; ducks walk `path` in file; a cat sits `up` tiles high. */
export interface Life { kind: LifeKind; x: number; y: number; n?: number; r?: number; path?: [number, number][]; up?: number; seed?: number }

/** The anvil, the washtub and the chopping block: where the folk below work at them. */
export const ANVIL = { x: 32.3, y: 8 }, WASHTUB = { x: 38.7, y: 37.3 }, CHOPBLOCK = { x: 13.9, y: 6.8 };

const rd = (kind: Round['kind'], x: number, y: number, r: number): Round => ({ kind, x, y, r });

export const STREET_THINGS: Round[] = [
  // The forge: the anvil on its stump with the quench tub, charcoal sacks the other side of the door.
  rd('anvil', ANVIL.x, ANVIL.y, 0.3), rd('sacks', 36.2, 7.8, 0.3),
  // Between the church and the hall: the woodcutter's block, the pile against the church wall.
  rd('chopblock', CHOPBLOCK.x, CHOPBLOCK.y, 0.25), rd('woodpile', 11.5, 5.5, 0.35),
  // Behind Rescue Row: the washtub, two lines strung out (each's posts from x to x + 2.4).
  rd('washtub', WASHTUB.x, WASHTUB.y, 0.3), rd('clothesline', 40.5, 36.5, 0.1), rd('clothesline', 35.6, 36.6, 0.1),
  // Barrels at the barracks' corner; crates by the market stalls (the cat's seat); a handcart left by the Rat.
  rd('barrels', 2.4, 17.7, 0.45), rd('crates', 42.25, 14.45, 0.45), rd('handcart', 11.6, 35.6, 0.45),
  // Pots of flowers either side of the church's and the infirmary's doors.
  rd('pots', 5.3, 7.9, 0.15), rd('pots', 8.7, 7.9, 0.15), rd('pots', 4.7, 33, 0.15), rd('pots', 8.3, 33, 0.15),
  // Rescue Row: the hen coop by the millpond, sacks of feed, a line of washing behind the houses.
  rd('coop', 48.4, 32.1, 0.4), rd('sacks', 50.4, 17, 0.3),
  // More lamp posts, along the north lane and down on Rescue Row.
  rd('post', 24.4, 8.9, 0.15), rd('post', 39.8, 9.1, 0.15), rd('post', 30, 29.8, 0.15),
];

/** How high the crates stand (tiles): the cat sits on top. */
export const CRATES_UP = 0.95;

export const TOWN_LIFE: Life[] = [
  // Hens scratching in the lane between Rescue Row's houses, by their coop.
  { kind: 'hens', x: 45, y: 32.2, n: 5, r: 2.2, seed: 3 },
  // A duck and her ducklings out of the millpond, across Rescue Row in file and back in.
  { kind: 'ducks', x: 51.5, y: 34.5, n: 5, path: [[51.5, 34.5], [49.2, 34.4], [46.5, 32.6], [41, 32.4], [40.5, 33], [46.8, 33.2], [49, 35.6], [51.6, 35.2]] },
  // The cat on the crates by the market, and another curled up on the sacks of feed.
  { kind: 'cat', x: 42.3, y: 14.5, up: CRATES_UP, seed: 1 },
  { kind: 'cat', x: 50.4, y: 17.05, up: 0.42, seed: 2 },
  // Pigeons by Old Wenna's bench, and more on the gate road.
  { kind: 'pigeons', x: 25.8, y: 23, n: 7, r: 1.3, seed: 5 },
  { kind: 'pigeons', x: 28.7, y: 5.4, n: 5, r: 1, seed: 9 },
];

export function streetFolk(w: WorldState): Npc[] {
  void w;
  const folk = (name: string, look: string, work: Npc['work'], path: [number, number][], stops: number[], speed: number): Npc =>
    ({ name, x: path[0][0], y: path[0][1], talk: 'chat', look, work, path, stops, speed, mute: true, clock: true });
  // (They face the way they walked in: each round is laid out so they arrive facing what they work at.)
  const ring: [number, number][] = [[25.2, 16], [31.2, 16], [31.2, 21.2], [25.2, 21.2]];
  return [
    // At the anvil (west of him, he came from the door), then back to the forge's mouth for the next heat.
    folk('A SMITH', 'smith', 'smith', [[33.05, 8.15], [34.5, 7.6]], [9, 3], 0.6),
    // Behind Rescue Row: a bucket filled at the millpond, to the tub to scrub, to the line to hang it out.
    folk('A WASHERWOMAN', 'villager', 'wash', [[48.9, 36.2], [39.45, 37.3], [41.7, 36.95]], [4, 8, 5], 0.6),
    // Splitting at the block (east of him), then an armful to the pile.
    folk('A WOODCUTTER', 'labourer', 'chop', [[13.15, 6.6], [12.1, 5.9]], [9, 2.5], 0.6),
    // Up and down the south lane with a handcart, loading at either end.
    folk('A CARTER', 'farmer', 'cart', [[9, 28.3], [48, 28.3]], [6, 6], 0.75),
    // Sweeping the Drowned Rat's step.
    folk('A POTBOY', 'labourer2', 'sweep', [[14.6, 35], [16.6, 35.2], [19.4, 35]], [3, 3, 3], 0.45),
    // Two children chasing round the Lantern, one bowling a hoop a few steps ahead of the other.
    folk('A CHILD', 'child', 'hoop', ring, [0, 0, 0, 0], 1.5),
    folk('A CHILD', 'child', undefined, [[26.8, 16], ...ring.slice(1), ring[0]], [0, 0, 0, 0, 0], 1.5),
  ];
}
