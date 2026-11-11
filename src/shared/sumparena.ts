/**
 * The Haulier's ground in the Deep (docs/design/deep-bosses.md): an old working cut into the rock, sized to
 * an upright phone (12 by 14, as the barn). What matters on it:
 * - the ore rail across the floor (`map.rail`) with a cart at each stop: GRAB one at its stop to send it
 *   down the rail (sim/haulbook.ts), and the Haulier shoves them at you;
 * - the winding gear over the shaft at the back (`map.gear`): lightning near it falls on it and crackles
 *   out, cracking the Haulier's plate if it's under;
 * - the flooded sump at the front (`map.water`): a jolt through it while it wades cracks the plate too;
 * - the adit in the left wall (`map.adits`), where the small ones come out in phase 2.
 * The chained chest at the back opens at the kill; the way in at the bottom is shut until then.
 * Pure: the same job gives the same working on every screen.
 */
import type { Block, GameMap, Round, Theme } from './arena.js';
import type { Job } from './jobs.js';
import type { RoomPlan } from './terrain.js';
import { HAULIER } from './haultune.js';
import { HAUL_NAME, SUMP_NAME } from './bosswords.js';

export const SUMP = { w: 12, h: 14 };

export const SUMP_SPOTS = {
  haulier: { x: 6, y: 4.2 },
  /** The rail: its line across, and the two stops a cart stands at. */
  rail: { y: 6.6, x0: 0.6, x1: 11.4 },
  stops: [{ x: 1.3, y: 6.6 }, { x: 10.7, y: 6.6 }],
  gear: { x: 9.4, y: 2.2 },
  sump: { x: 0.6, y: 9.2, w: 3.4, h: 2.6 },
  adits: [{ x: 0.7, y: 3.4 }],
  chest: { x: 6, y: 1.4 },
};

/** The working: its floor, the rail and carts, the gear, the sump, the adit, and the Haulier. */
export function sumpArena(job: Job): RoomPlan {
  const { w, h } = SUMP, s = SUMP_SPOTS;
  // The headframe's two legs either side of the shaft (they stop a body; the shaft between them is the gear's).
  const rounds: Round[] = [
    { x: s.gear.x - 0.9, y: s.gear.y + 0.5, r: 0.28, kind: 'support' }, { x: s.gear.x + 0.9, y: s.gear.y + 0.5, r: 0.28, kind: 'support' },
    { x: 3.2, y: 10.4, r: 0.3, kind: 'support' }, { x: 8.8, y: 10.4, r: 0.3, kind: 'support' },
  ];
  const blocks: Block[] = [{ kind: 'rubble', x: 0.2, y: 0.1, w: 2.4, h: 1 }, { kind: 'rubble', x: 10.6, y: 12.2, w: 1.2, h: 1.2 }];
  const theme: Theme = { floor: 'rock', back: 'rockface', ambient: [0.12, 0.11, 0.16], moon: 0 };
  const map: GameMap = {
    name: SUMP_NAME, w, h, wallFace: 3, rounds, blocks, theme,
    torches: [{ x: 3.4, y: 0.2 }, { x: 7.6, y: 0.2 }], braziers: [{ x: 10.8, y: 9.6, r: 0.3 }],
    water: [s.sump], rail: s.rail, gear: s.gear, adits: s.adits,
    hero: { x: w / 2, y: h - 1.5 }, exit: { x: w / 2 - 1.1, y: h - 0.7, w: 2.2, h: 0.7 },
  };
  const haulier = { kind: 'scrapper' as const, variant: 'ironhide' as const, ...s.haulier, hp: HAULIER.hp, name: HAUL_NAME, boss: 'haulier' as const, awake: false };
  return { map, foes: [haulier], props: s.stops.map((q) => ({ kind: 'cart' as const, ...q })), chests: [{ ...s.chest, chained: true }] };
}
