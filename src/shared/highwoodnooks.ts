/**
 * The High Wood's nooks (as the fen's: shared/fenroamnooks.ts): side pockets off the ways, each a small scene of its
 * own. Two keep a mini boss: an elite butcher (shared/elites.ts affixes, a BIG ONE so it always drops) with a guard or
 * two, over a chained chest (sim/chests.ts). No names, so no named one holds a chest shut. Fixed spots. Pure.
 */
import type { Block } from './arena.js';
import type { Affix } from './elites.js';
import { claim, mark, prop, round, type Kit } from './expedkit.js';
import { put } from './highwoodfoes.js';

export interface Nook { id: string; x: number; y: number; r: number; boss?: number }
export const WOOD_NOOKS: Nook[] = [
  { id: 'poachers', x: 12, y: 102, r: 6, boss: 486 },
  { id: 'deserter', x: 84, y: 62, r: 5.5, boss: 487 },
  { id: 'charcoal', x: 12, y: 84, r: 4 },
  { id: 'cart', x: 8, y: 151, r: 3.5 },
  { id: 'ropes', x: 14, y: 20, r: 4.5 },
];
/** The nooks' packs: the ropes' hungry band and the two mini bosses' (none of them the bounties'). */
export const WOOD_NOOK_PACKS = [485, 486, 487];

const B = (k: Kit, kind: Block['kind'], x: number, y: number, w: number, h: number) => k.blocks.push({ kind, x, y, w, h } as Block);
function boss(k: Kit, pack: number, x: number, y: number, elite: Affix[]): void {
  k.foes.push({ kind: 'butcher', x, y, pack, elite, big: true }), claim(k, x, y, 1);
}

export function layWoodNooks(k: Kit): void {
  // THE POACHERS' LEAN-TO: west of the lodge's lane; a shack, hides on the rack, a fire, barrels.
  boss(k, 486, 12.4, 100.6, ['plated', 'quick']);
  put(k, 486, [9, 103], 'shield'), put(k, 486, [15.5, 101.8], 'archer');
  B(k, 'shack', 8.6, 96, 3.6, 2.4), B(k, 'dryrack', 16.8, 98.6, 0.5, 2.2);
  round(k, 'cookfire', 14.4, 104.6, 0.4), round(k, 'chopblock', 9.4, 106, 0.3), prop(k, 'barrel', 10.8, 105), prop(k, 'tub', 16.4, 105.6);
  k.chests.push({ x: 7.6, y: 99.4, chained: true, guard: 486 });
  // THE DESERTER'S HOLLOW: deep in the bracken east of the old trees; a fallen log for a wall, a cold fire.
  boss(k, 487, 84, 61, ['gorging', 'quick']);
  put(k, 487, [87, 63.5], 'archer'), put(k, 487, [81, 64], 'fodder');
  B(k, 'log', 80.4, 58.6, 2.6, 0.6), round(k, 'cookfire', 82.6, 65.6, 0.4), round(k, 'chopblock', 86.6, 59.4, 0.3), prop(k, 'crate', 85.4, 65.4);
  k.chests.push({ x: 88, y: 59.4, chained: true, guard: 487 });
  // THE CHARCOAL BURNER'S CLAMP: west of the ridge; a shack, a fire, split wood stacked, a chest.
  B(k, 'shack', 7, 81, 3.6, 2.4), round(k, 'cookfire', 10, 87.6, 0.4), round(k, 'chopblock', 8.8, 85, 0.3), round(k, 'stump', 14.2, 82, 0.35), prop(k, 'barrel', 15, 83.6);
  mark(k, 'debris', 9.6, 86.4, 3, 0.6), k.chests.push({ x: 14.5, y: 86.8 });
  // THE DROVER'S CART: off the root stair's west; a cart left in the roots, its load about it, a chest under it.
  B(k, 'cart', 5.4, 150, 2.4, 1.2), prop(k, 'crate', 9.6, 149.2), prop(k, 'barrel', 10.2, 152.4);
  k.grim.push({ kind: 'strewn', x: 8, y: 153, k: 2 }), mark(k, 'debris', 6, 152.4, 3, 0.6), k.chests.push({ x: 6.4, y: 152.8 });
  // THE CUT ROPES: west of the rise; posts with the hanging ropes cut off them, the hungry still about, a chest.
  put(k, 485, [12, 19], 'lunger'), put(k, 485, [16.4, 20.6], 'fodder'), put(k, 485, [13.6, 23.4], 'fodder');
  for (const [x, y] of [[11, 17], [14.6, 16.4], [17.6, 17.4]]) round(k, 'post', x, y, 0.16);
  round(k, 'stump', 16.6, 22.8, 0.35), round(k, 'cookfire', 13, 21.4, 0.4), k.chests.push({ x: 9.6, y: 22.6 });
  for (const n of WOOD_NOOKS) claim(k, n.x, n.y, n.id === 'cart' ? 3 : 2);
  for (const c of k.chests.slice(-5)) claim(k, c.x, c.y, 1.2);
}
