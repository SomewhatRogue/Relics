/**
 * The Deep's layers (Kyle, 2026-11-11: "all the maps look the same ... after 5 floors other biomes, just to
 * keep it interesting"): every DEEP_BOSS.every floors the pit opens into somewhere else, each a country the
 * room builder already knows (shared/countries.ts homeOf: its ground, walls, light, set pieces and goblins).
 * The first layer is the drains under Wickhold; below it the rest go round in turn, without end. Names and
 * lines: client/deepwords.ts.
 */
import type { PlaceKind } from './jobs.js';

export interface DeepLayer { id: string; kind: PlaceKind; region: string }

/** In order down. homeOf turns each into its country: under, rock, fen, wood, village. */
export const DEEP_LAYERS: DeepLayer[] = [
  { id: 'drains', kind: 'mine', region: 'Wickhold' },
  { id: 'rock', kind: 'ruins', region: 'Copperdeep' },
  { id: 'fen', kind: 'marsh', region: 'Fenmere' },
  { id: 'wood', kind: 'forest', region: 'Greyhollow' },
  { id: 'street', kind: 'village', region: 'Barrowfields' },
];

/** Floors to a layer. */
export const LAYER_FLOORS = 5;

/** Floor `n`'s layer (from 1): the drains first, then the rest round and round. */
export function layerOf(n: number): DeepLayer {
  const i = Math.floor((Math.max(1, n) - 1) / LAYER_FLOORS);
  return i === 0 ? DEEP_LAYERS[0] : DEEP_LAYERS[1 + ((i - 1) % (DEEP_LAYERS.length - 1))];
}
