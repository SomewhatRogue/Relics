/**
 * The four breeds' builds, in pixels, for houndbody.ts: how long in the leg and body, how deep in the
 * chest and how tucked at the loin, the skull and muzzle, the ears, the tail and how it's carried, and
 * the coat's texture. All four stand on the same ground in the same box (HOUND_BOX), so a hound of any
 * breed takes up the same room on screen as any other; the room's hound is one size whatever it looks like.
 */
import type { BreedId } from '../shared/houndlook';

export interface Shape {
  /** Rows of leg under the belly, the body's length (hip to shoulder), chest depth and depth at the loin. */
  leg: number; body: number; depth: number; waist: number;
  /** Rows of neck above the withers, the skull (w, h), the muzzle's length and its height in rows. */
  neck: number; skull: [number, number]; muzzle: number; snout: number;
  /** Rose ears fold back, drop ears hang, semi ears stand with the tips tipped over. */
  ear: 'rose' | 'drop' | 'semi';
  /** The tail: angle off the rump (degrees, 0 straight back, 90 straight up), its curl a pixel, its length, its thickness. */
  tail: { base: number; curl: number; len: number; thick: 1 | 2 };
  /** Leg thickness; a wiry coat (beard, brows, a broken back line); a collie's ruff and feathering; a lurcher's arched loin. */
  legW: 1 | 2; rough?: boolean; ruff?: boolean; arch?: boolean;
  /** Its shadow's half width. */
  shadow: number;
}

export const SHAPES: Record<BreedId, Shape> = {
  // Big, rough, long in the leg; a beard, a long low tail with an upward hook at the end.
  wolfhound: { leg: 5, body: 9, depth: 4, waist: 3, neck: 2, skull: [3, 3], muzzle: 3, snout: 2, ear: 'rose', tail: { base: -62, curl: 11, len: 6, thick: 1 }, legW: 2, rough: true, shadow: 6 },
  // Lean and tucked up, deep in the chest, fine legs, a long narrow head, a long whip of a tail.
  lurcher: { leg: 5, body: 8, depth: 4, waist: 2, neck: 2, skull: [3, 2], muzzle: 3, snout: 2, ear: 'rose', tail: { base: -72, curl: 14, len: 6, thick: 1 }, legW: 1, arch: true, shadow: 5 },
  // Solid and lower to the ground, long drop ears, a tail carried up like a sabre.
  hillhound: { leg: 4, body: 8, depth: 4, waist: 3, neck: 2, skull: [3, 3], muzzle: 2, snout: 2, ear: 'drop', tail: { base: 48, curl: -7, len: 5, thick: 1 }, legW: 2, shadow: 5 },
  // Smallest, scruffy, a ruff at the neck, semi-pricked ears, a full tail low with a sweep up.
  collie: { leg: 4, body: 7, depth: 3, waist: 3, neck: 1, skull: [3, 3], muzzle: 2, snout: 2, ear: 'semi', tail: { base: -46, curl: 17, len: 6, thick: 2 }, legW: 2, ruff: true, shadow: 5 },
};

/**
 * The box every hound is drawn in (pixels): `w` by `h`, its feet's line on row `ground`, its middle at
 * column `x`. One box for every breed, coat and pose (tests/hound.test.ts holds them all inside it).
 */
export const HOUND_BOX = { w: 26, h: 16, x: 13, ground: 15 } as const;
