/**
 * The wilds' map screen's own words (client/landmapui.ts; Kyle 2026-11-25: "a map on these bigger wilds maps"). MAP and CLOSE
 * are the expedition map's (shared/expedjob.ts MAP_WORDS); the rest are the ways on the map and the key under it.
 */
import type { LandId } from './territory.js';

export const LANDMAP_WORDS = {
  /** The way in from Wickhold, on the land that has the gate. */
  gate: 'THE NORTH GATE',
  /** The way back, on the land walked into from another. */
  back: { fenroam: 'BACK TO THE NORTH FIELDS', highwood: 'BACK TO THE FEN' } as Partial<Record<LandId, string>>,
  /** The way on to the next land, at this land's far end. */
  on: { gatefields: 'ON INTO THE FEN', fenroam: 'ON INTO THE HIGH WOOD' } as Partial<Record<LandId, string>>,
  /** Under the map. */
  shelters: (found: number, n: number) => `${found} OF ${n} SHELTERS FOUND`,
  bounty: (n: number) => (n === 1 ? '1 BOUNTY TAKEN' : `${n} BOUNTIES TAKEN`),
};
