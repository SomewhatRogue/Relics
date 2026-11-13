/**
 * The Haulier's ground in the Deep (docs/design/deep-bosses.md): an old working cut into the rock, sized to
 * an upright phone (12 by 14, as the barn). What matters on it:
 * - the tracks across the floor (`map.tracks`: two down, one across, crossing), each ending in a tunnel mouth
 *   at the room's edge at both ends: carts come down them with a warning (sim/haulcarts.ts, sim/trackshape.ts),
 *   and the Haulier, on one, is knocked down; a couple of carts rest on sidings for it to hurl at you;
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
  /**
   * The tracks, mouth to mouth at the edges (the room is SUMP.w by SUMP.h): one across, two down.
   * (`rail` and `stops` are the old single rail: THE LOADING STAGE's carts stand at them, shared/cutloading.ts.)
   */
  tracks: [{ x0: 0, y0: 7.6, x1: SUMP.w, y1: 7.6 }, { x0: 4.4, y0: 0, x1: 4.4, y1: SUMP.h }, { x0: 7.8, y0: 0, x1: 7.8, y1: SUMP.h }],
  /** Carts at rest at the start, beside the tracks: the Haulier's to hurl. */
  sidings: [{ x: 2.4, y: 5.9 }, { x: 10.0, y: 6.2 }],
  rail: { y: 6.6, x0: 0.6, x1: 11.4 },
  stops: [{ x: 1.3, y: 6.6 }, { x: 10.7, y: 6.6 }],
  // (Low enough to stand clear of the boss plate at the top of a phone's screen.)
  gear: { x: 9.4, y: 3.3 },
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
  const theme: Theme = { floor: 'rock', back: 'rockface', ambient: [0.15, 0.14, 0.19], moon: 0 };
  const map: GameMap = {
    name: SUMP_NAME, w, h, wallFace: 3, rounds, blocks, theme,
    // Fire baskets either side of the floor it fights on, so it's lit wherever it stands; one more by the way in.
    torches: [{ x: 2.8, y: 0.2 }, { x: 9.6, y: 0.2 }], braziers: [{ x: 0.9, y: 5.0, r: 0.3 }, { x: 11.1, y: 5.0, r: 0.3 }, { x: 10.8, y: 9.6, r: 0.3 }],
    water: [s.sump], tracks: s.tracks, gear: s.gear, adits: s.adits,
    hero: { x: w / 2, y: h - 1.5 }, exit: { x: w / 2 - 1.1, y: h - 0.7, w: 2.2, h: 0.7 },
  };
  const haulier = { kind: 'scrapper' as const, variant: 'ironhide' as const, ...s.haulier, hp: HAULIER.hp, name: HAUL_NAME, boss: 'haulier' as const, awake: false };
  return { map, foes: [haulier], props: s.sidings.map((q) => ({ kind: 'cart' as const, ...q })), chests: [{ ...s.chest, chained: true }] };
}
