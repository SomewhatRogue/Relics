/**
 * Materials (docs/design/materials.md): what the land gives, kept as counts in a satchel on the save
 * (`Profile.mats`), never squares in the pack. Halvard's higher pluses ask for them (forgeplus.ts), and the
 * corner's elements will (element-augments.md).
 */

export type MatId = 'hide' | 'silk' | 'brood' | 'charcoal';
export const MAT_IDS: MatId[] = ['hide', 'silk', 'brood', 'charcoal'];

/** How many of each a hero holds. */
export type Mats = Partial<Record<MatId, number>>;

export const isMat = (x: unknown): x is MatId => typeof x === 'string' && (MAT_IDS as string[]).includes(x);

/** A save's satchel, whatever it says: known ids only, whole counts from 0. */
export function fitMats(m: unknown): Mats {
  const out: Mats = {};
  if (!m || typeof m !== 'object') return out;
  for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
    const n = Math.floor(Number(v));
    if (isMat(k) && Number.isFinite(n) && n > 0) out[k] = n;
  }
  return out;
}

/** Whether `have` covers `need`. */
export const hasMats = (have: Mats | undefined, need: Mats): boolean =>
  MAT_IDS.every((k) => (have?.[k] ?? 0) >= (need[k] ?? 0));

/** Take `need` from `have` (call only after hasMats). */
export function spendMats(have: Mats, need: Mats): void {
  for (const k of MAT_IDS) if (need[k]) have[k] = (have[k] ?? 0) - need[k]!;
}

/** Add `n` of `id`. */
export const addMat = (have: Mats, id: MatId, n = 1): void => void (have[id] = (have[id] ?? 0) + n);
