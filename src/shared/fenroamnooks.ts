/**
 * The Fen's nooks (Kyle, 2026-11-25: "little nooks to explore with little scenes or themes. Maybe even mini bosses
 * that drop better loot but you have to find."): side pockets off the causeways, the boards and the reeds, out of
 * sight of the track, each a small scene of its own built from pieces the fen already has. Two keep a mini boss: an
 * elite brute of a butcher (shared/elites.ts affixes, a BIG ONE so it always drops, rolled higher: sim/loot.ts) with
 * a guard or two, over a chained chest (two rolls, a tier up: sim/chests.ts). No names: a named one would hold every
 * chained chest shut. Fixed spots; the seed moves nothing here. Pure.
 */
import type { Block } from './arena.js';
import type { Affix } from './elites.js';
import { claim, mark, prop, round, type Kit } from './expedkit.js';
import { put } from './fenroamfoes.js';

/** A nook: where its open middle is, how far it reaches, and its mini boss's pack if it has one. */
export interface Nook { id: string; x: number; y: number; r: number; boss?: number }
export const NOOKS: Nook[] = [
  { id: 'reedcutter', x: 22, y: 91.6, r: 6, boss: 469 },
  { id: 'sexton', x: 10.4, y: 45.2, r: 5.5, boss: 470 },
  { id: 'eeltraps', x: 80.6, y: 103.6, r: 5 },
  { id: 'cart', x: 9.4, y: 75.6, r: 4 },
  { id: 'peatshelter', x: 9.6, y: 9.6, r: 4.5 },
];
/** The nooks' packs: the eel-trap store's band and the two mini bosses' (none of them the bounties'). */
export const NOOK_PACKS = [464, 469, 470];

const B = (k: Kit, kind: Block['kind'], x: number, y: number, w: number, h: number, more: Partial<Block> = {}) => k.blocks.push({ kind, x, y, w, h, ...more } as Block);
function boss(k: Kit, pack: number, x: number, y: number, elite: Affix[]): void {
  k.foes.push({ kind: 'butcher', x, y, pack, elite, big: true }), claim(k, x, y, 1);
}

export function layNooks(k: Kit): void {
  // THE REED-CUTTER'S LANDING: the far islet up the winding causeway; cut reed in stooks, a punt drawn up, a cold fire.
  boss(k, 469, 22.4, 90.4, ['plated', 'gorging']);
  put(k, 469, [19.6, 92.8], 'shield'), put(k, 469, [25, 90.2], 'archer');
  round(k, 'hay', 17.6, 94, 0.45), round(k, 'hay', 19, 94.3, 0.4), round(k, 'cookfire', 24.8, 93.4, 0.4), round(k, 'chopblock', 17.2, 90.6, 0.3);
  prop(k, 'punt', 26.6, 92.6);
  k.chests.push({ x: 17.8, y: 89, chained: true, guard: 469 });
  // THE SEXTON'S ISLE: off the churchyard wall's bank; old stones, one grave dug fresh, flowers on it.
  boss(k, 470, 11, 45.8, ['quick', 'plated']);
  put(k, 470, [13.8, 44.6], 'hexer'), put(k, 470, [8.4, 47.2], 'fodder');
  round(k, 'headstone', 7, 43, 0.3), round(k, 'headstone', 8.6, 42.8, 0.3), round(k, 'headstone', 14.8, 43, 0.3);
  B(k, 'awash', 14.4, 47.4, 0.8, 0.45, { look: 1 }), mark(k, 'mound', 12, 46.6, 1.8, 0.8), mark(k, 'flowers', 12.4, 46.4, 1, 0.5);
  k.chests.push({ x: 6.6, y: 46.6, chained: true, guard: 470 });
  // THE EEL-TRAP STORE: the east island at the end of the winding boards; nets hung, a rack, sacks, a tub, a skimmer.
  put(k, 464, [81, 100.6], 'skimmer', { task: { k: 'pour', x: 76, y: 102.9 } }), put(k, 464, [82.6, 104], 'fodder'), put(k, 464, [80.4, 106], 'fodder');
  B(k, 'hungnet', 78.2, 99.5, 2, 0.4), B(k, 'dryrack', 83.2, 101, 0.5, 2);
  round(k, 'sacks', 78.8, 105.2, 0.34), round(k, 'post', 77.2, 101.4, 0.16), round(k, 'post', 77.2, 104.4, 0.16);
  prop(k, 'tub', 82.6, 107.4), prop(k, 'barrel', 83.2, 106);
  // THE DROWNED CART: behind the reeds in the west; a cart gone into the water, its load about it, a chest under it.
  B(k, 'drownedcart', 6.4, 74.4, 2.4, 1.2), prop(k, 'crate', 10.8, 73.8), prop(k, 'barrel', 11.6, 76.6);
  k.grim.push({ kind: 'strewn', x: 9, y: 77.2, k: 2 }), mark(k, 'debris', 6.6, 76.4, 3, 0.6);
  k.chests.push({ x: 7.6, y: 77.4 });
  // THE PEAT-CUTTER'S SHELTER: the cuts' far west strip; a shack, cut peat stacked to dry, a fire, the block.
  B(k, 'shack', 5.6, 4.2, 3.6, 2.4), round(k, 'peat', 10.6, 5, 0.45), round(k, 'peat', 10.8, 7.2, 0.45);
  round(k, 'cookfire', 7.4, 8.2, 0.4), round(k, 'chopblock', 5.8, 9.2, 0.3);
  for (const n of NOOKS) claim(k, n.x, n.y, n.id === 'cart' ? 3 : 2);
  for (const c of k.chests.slice(-3)) claim(k, c.x, c.y, 1.2);
}
