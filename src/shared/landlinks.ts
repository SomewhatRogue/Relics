/**
 * How the land's maps join (docs/design/the-fen.md, "Getting there and back"; Kyle: "maps that you can access by just
 * going out of the gate"): walking out of one map's far end takes the party on into the next, and walking back to
 * the next one's way in takes them back, arriving at the far end they left by, not at the gate. Each map is its own
 * roaming job (shared/territory.ts); the leader's choice moves the run onto the other's (client/game.ts crossLand).
 * Pure.
 */
import type { LandId } from './territory.js';

type P = { x: number; y: number };
/** Going on: where on this map you stand to be asked (its far end), and the land it leads to (you arrive at its way in). */
export interface Onward { from: P; to: LandId }
/** Going back: from this map's way in to the land before, arriving at its named way (`WAYS`). */
export interface Backward { to: LandId; at: string }

export const ONWARD: Partial<Record<LandId, Onward>> = { gatefields: { from: { x: 40, y: 0.8 }, to: 'fenroam' } };
export const BACKWARD: Partial<Record<LandId, Backward>> = { fenroam: { to: 'gatefields', at: 'NORTH END' } };

/** Arrival points that are not shelters (a job's `at` may name one): the north fields' far end, under the wood. */
export const WAYS: Partial<Record<LandId, Record<string, P>>> = { gatefields: { 'NORTH END': { x: 40.3, y: 2.8 } } };
export const wayOf = (land: LandId | undefined, name: string | undefined): P | undefined => (land && name ? WAYS[land]?.[name] : undefined);
