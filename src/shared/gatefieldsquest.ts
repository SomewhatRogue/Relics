/**
 * The North Gate and the trainer's quest to go out (docs/design/outside-the-gate.md; Kyle, 2026-11-24): the guard keeps
 * you in until level 3, and at 3 your trainer sends you out to rest at the Field Barn. Pure; the errand itself is
 * `fields` in shared/errands.ts.
 */

/** The level the trainer sends you out at (their quest to rest at the Field Barn). */
export const GATE_LEVEL = 3;
/** The level the guard lets you out at. Open from level 1 for now, so Kyle can test the land (2026-11-25: "lets make
 *  it so you can go out the gate at lvl 1 so i can test it"); set it back to GATE_LEVEL to close it again. */
export const GATE_OPEN = 1;
export const canGoOut = (level: number): boolean => level >= GATE_OPEN;

/** The north fields' shelter, as the map names it (shared/territory.ts, the gatefields land). */
export const FIELD_BARN = 'THE FIELD BARN';

/** Did this player's hero rest at the Field Barn, on a roaming job, in these events? */
export function heardBarn(ev: readonly { k: string; id?: unknown; station?: unknown }[], me: string, roam: boolean): boolean {
  return roam && ev.some((e) => e.k === 'rested' && e.id === me && e.station === FIELD_BARN);
}
