/**
 * THE YARD: the great barn at the top of the terrace, from outside (shared/tollanyard.ts). Its inside is the
 * next map (shared/tollanbarn.ts): you go in at its doors.
 *
 *   A bank barn as old as the farm, roofed, bigger than the house: the long body and a bay either side of the
 *   wagon porch, the great doors shut in the porch's mouth. What the hungry carried over from the house is set
 *   down at the doors where they wait to be let in: sacks, a handcart, the dresser's crocks. Crows on the ridge,
 *   nettles along the walls nobody walks, the water butt at the corner. The smell reaches the yard.
 *
 * The doors are the yard's gate (tollanyardland.ts `DOORS`): they open when the yard's are dead and the party
 * stands at them. The way out of this map is the porch behind them.
 */
import { block, claim, patch, round, type Kit } from './expedkit.js';
import { clump, markAt } from './tollanyardkit.js';
import { DOORS } from './tollanyardland.js';

/** The barn's body, the two bays either side of its porch, and the porch (the map's way out). */
export const BARN = { x: 18, y: 3, w: 36, h: 17.4 };
export const BAYS = [{ x: 18, y: 20.4, w: 16, h: 3.2 }, { x: 38, y: 20.4, w: 16, h: 3.2 }];
export const PORCH = { x: DOORS.x, y: 20.4, w: DOORS.w, h: 1.7 };
/** Stood for good: nothing here is smashed or burned this slice (burning the barn is a later one). */
const FAST = { door: undefined, hp: undefined, maxHp: undefined, burning: undefined };

export function layBarn(k: Kit): void {
  block(k, 'barn', BARN.x, BARN.y, BARN.w, BARN.h, FAST);
  for (const b of BAYS) block(k, 'barn', b.x, b.y, b.w, b.h, FAST);
  // The porch floor and the cobbles before the doors, straw trodden in from the mow.
  patch(k, 'flags', DOORS.x - 4, 23.4, DOORS.w + 8, 4.4), patch(k, 'straw', DOORS.x - 0.4, 20.4, DOORS.w + 0.8, 3.4, false);
  claim(k, DOORS.x + DOORS.w / 2, DOORS.y + DOORS.h + 1.6, 2.6);
  // Set down at the doors, waiting: the house's goods, a handcart, a lamp either side.
  for (const [kind, x, y, r] of [['sacks', 31.4, 24.6, 0.42], ['sacks', 32.2, 25.4, 0.38], ['crates', 30.2, 25, 0.46], ['pots', 40.4, 24.6, 0.3],
    ['handcart', 41.8, 25.6, 0.5], ['barrels', 42.6, 24.4, 0.42]] as const) round(k, kind, x, y, r);
  round(k, 'lantern', DOORS.x - 1.2, 24.2, 0.25), round(k, 'lantern', DOORS.x + DOORS.w + 1.2, 24.2, 0.25);
  for (const [x, y] of [[33, 26.6], [39.6, 26.2], [36, 27.6]] as const) markAt(k, 'straw', x, y, 1.8, 0.8);
  markAt(k, 'debris', 38.6, 25, 1, 0.5);
  // Round it: the water butt and a ladder's worth of timber at the east corner, nettles along the walls, crows.
  round(k, 'barrels', 55, 22.6, 0.45), round(k, 'woodpile', 55.2, 19.4, 0.5), round(k, 'washtub', 16.8, 22.8, 0.42);
  for (let x = 19; x < 34; x += 3.4) markAt(k, 'weeds', x, 24, 1.8, 0.7);
  for (let x = 43.6; x < 54; x += 3.4) markAt(k, 'weeds', x, 24, 1.8, 0.7);
  for (let y = 4; y < 20; y += 3.6) markAt(k, 'weeds', 17.4, y, 0.8, 1.8), markAt(k, 'weeds', 54.6, y + 1.4, 0.8, 1.8);
  clump(k, ['crows'], 30, 24.6, 2, 1, [0.02, 0.02], 0), clump(k, ['crows'], 44.6, 25.6, 1, 0.6, [0.02, 0.02], 0);
}
