/**
 * The North Gate and the trainer's quest to go out (docs/design/outside-the-gate.md; Kyle, 2026-11-24): the guard keeps
 * you in until level 3, and at 3 your trainer sends you out to rest at the Field Barn. Pure; the errand itself is
 * `fields` in shared/errands.ts.
 */

/** The level the guard lets you out at. */
export const GATE_LEVEL = 3;
export const canGoOut = (level: number): boolean => level >= GATE_LEVEL;

/** The north fields' shelter, as the map names it (shared/territory.ts, the gatefields land). */
export const FIELD_BARN = 'THE FIELD BARN';

/** Did this player's hero rest at the Field Barn, on a roaming job, in these events? */
export function heardBarn(ev: readonly { k: string; id?: unknown; station?: unknown }[], me: string, roam: boolean): boolean {
  return roam && ev.some((e) => e.k === 'rested' && e.id === me && e.station === FIELD_BARN);
}
