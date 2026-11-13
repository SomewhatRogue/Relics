/**
 * How a Warrior's shield looks (Kyle, 2026-11-13: "let warriors customize their shield like hunter dogs can"):
 * its shape, the colour of its field, the device painted on it and the metal of its trim, chosen with Master
 * Cole at the barracks. Drawing only: the room never reads it, every shield blocks the same.
 *
 * Saved on the profile (`Profile.shield`), copied to `Hero.shieldLook`, and sent to friends with the hero's
 * look as the hound is (townpresence.ts packs it small; a party's hero carries it). Anything heard from
 * outside goes through `fitShield`.
 */
export const SHAPES = ['heater', 'round', 'kite'] as const;
export type ShapeId = (typeof SHAPES)[number];
/** Field colours (client/shieldart.ts paints them; shieldwords.ts names them). */
export const FIELDS = 6;
export const DEVICES = ['plain', 'chevron', 'cross', 'bend', 'quarters', 'lantern'] as const;
export type DeviceId = (typeof DEVICES)[number];
export const TRIMS = ['gold', 'silver', 'iron'] as const;
export type TrimId = (typeof TRIMS)[number];

export interface ShieldLook { shape: ShapeId; field: number; device: DeviceId; trim: TrimId }

/** What a new Warrior carries: the red heater with the gold chevron. */
export const defaultShield = (): ShieldLook => ({ shape: 'heater', field: 0, device: 'chevron', trim: 'gold' });

/** Anything claimed to be a shield's look, as one: unknown parts fall back to the default's. */
export function fitShield(s: unknown): ShieldLook {
  const d = defaultShield(), o = (s && typeof s === 'object' ? s : {}) as Partial<Record<keyof ShieldLook, unknown>>;
  const of = <T extends string>(list: readonly T[], v: unknown, dflt: T): T => (list.includes(v as T) ? (v as T) : dflt);
  const field = typeof o.field === 'number' && Number.isFinite(o.field) ? Math.max(0, Math.min(FIELDS - 1, Math.floor(o.field))) : d.field;
  return { shape: of(SHAPES, o.shape, d.shape), field, device: of(DEVICES, o.device, d.device), trim: of(TRIMS, o.trim, d.trim) };
}

/** Small for the town's `me` word: four numbers. */
export type PackedShield = [number, number, number, number];
export const packShield = (s: ShieldLook): PackedShield => [SHAPES.indexOf(s.shape), s.field, DEVICES.indexOf(s.device), TRIMS.indexOf(s.trim)];
export function unpackShield(p: unknown): ShieldLook | undefined {
  if (!Array.isArray(p) || p.length < 4) return undefined;
  return fitShield({ shape: SHAPES[p[0] as number], field: p[1], device: DEVICES[p[2] as number], trim: TRIMS[p[3] as number] });
}
