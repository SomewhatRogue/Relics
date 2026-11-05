/**
 * Layout 4's vocabulary (docs/terrain-nodes.md slice 4, the rest of it): the new rooms in each country's
 * pool, which of them can fork, the scenes a room can hold (all of layout 3's and the new ones), and how
 * each new room is lit (the deep wood darker, a cave with no light but what you bring, the churchyard and
 * the barrows under a bigger moon). Layout 3 jobs never read any of this.
 */
import type { Job } from './jobs.js';
import { FORKS, POOL3, type Country, type Node4, type RouteNode } from './nodeports.js';
import { PIECES, type Piece, type Skin } from './nodes.js';

/** Each country's rooms on a layout-4 job (the sewers under Wickhold only the drains' sort). */
export function pool4(job: Job): Record<Country, RouteNode[]> {
  const sewers = job.place.region === 'Wickhold';
  return {
    village: [...POOL3.village, 'stackyard', 'orchard', 'mill', 'churchyard'],
    fields: [...POOL3.fields, 'stackyard', 'orchard', 'mill', 'churchyard', 'barrows'],
    wood: [...POOL3.wood, 'deepwood', 'glade'],
    fen: [...POOL3.fen, 'reedbed', 'mill'],
    rock: [...POOL3.rock, 'barrows'],
    under: [...POOL3.under, 'flooded', 'collapse', ...(sewers ? [] : (['cave', 'orechamber'] as RouteNode[]))],
  };
}

/** Rooms that can be a fork. */
export const FORKS4: RouteNode[] = [...FORKS, 'deepwood', 'glade', 'reedbed', 'orchard', 'barrows', 'cave', 'orechamber', 'churchyard', 'stackyard'];

/** Every scene a layout-4 room can roll (the forks' own ways come on top: shared/ways.ts). */
export const PIECES4: Piece[] = [...PIECES, 'burning', 'drag', 'prisoners', 'patrol', 'hanging', 'fallen', 'cache'];
const NOT_UNDER: Piece[] = ['cart', 'wreck', 'burning', 'hanging', 'fallen', 'cache'];
/** Which scenes each skin holds (no carts, houses, trees or wells underground; no hanging tree on the bare rock). */
export const PIECES4_IN: Record<Skin, Piece[]> = {
  fields: PIECES4, wood: PIECES4, fen: PIECES4, rock: PIECES4.filter((p) => p !== 'hanging'), under: PIECES4.filter((p) => !NOT_UNDER.includes(p)),
};
/** Scenes that need the room's one way on straight across from the way in (the prisoners walk the room's length to it). */
export const ONE_WAY: Piece[] = ['prisoners'];

/** How each new room is lit: its ambient and moon as a share of its country's, and whether it has torches. */
export const NODE_LIGHT: Record<Node4, { amb: number; moon: number; torches?: boolean }> = {
  deepwood: { amb: 0.6, moon: 0.2 }, glade: { amb: 1.1, moon: 1.3 }, reedbed: { amb: 0.95, moon: 1 }, flooded: { amb: 0.8, moon: 0, torches: false },
  collapse: { amb: 0.75, moon: 0, torches: false }, cave: { amb: 0.5, moon: 0, torches: false }, orechamber: { amb: 0.85, moon: 0, torches: true },
  churchyard: { amb: 0.9, moon: 1.2 }, mill: { amb: 1, moon: 1 }, orchard: { amb: 1, moon: 1.1 }, stackyard: { amb: 1.05, moon: 1 }, barrows: { amb: 0.85, moon: 1.25 },
};
export const isNode4 = (n: string): n is Node4 => n in NODE_LIGHT;
