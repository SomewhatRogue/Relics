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
  legW: 2 | 3; rough?: boolean; ruff?: boolean; arch?: boolean;
  /** Its shadow's half width. */
  shadow: number;
}

// At 1.5x for the art pass (2026-11-11): every build measured again half as big again, the tail's curl
// spread over its longer length so it bends as far, legs a pixel thicker.
export const SHAPES: Record<BreedId, Shape> = {
  // Big, rough, long in the leg; a beard, a long low tail with an upward hook at the end.
  wolfhound: { leg: 9, body: 14, depth: 6, waist: 4, neck: 3, skull: [5, 4], muzzle: 4, snout: 3, ear: 'rose', tail: { base: -62, curl: 7, len: 9, thick: 1 }, legW: 3, rough: true, shadow: 9 },
  // Lean and tucked up, deep in the chest, fine legs, a long narrow head, a long whip of a tail.
  lurcher: { leg: 9, body: 12, depth: 6, waist: 3, neck: 3, skull: [4, 3], muzzle: 5, snout: 3, ear: 'rose', tail: { base: -72, curl: 9, len: 9, thick: 1 }, legW: 2, arch: true, shadow: 8 },
  // Solid and lower to the ground, long drop ears, a tail carried up like a sabre.
  hillhound: { leg: 6, body: 12, depth: 6, waist: 5, neck: 3, skull: [4, 4], muzzle: 3, snout: 3, ear: 'drop', tail: { base: 48, curl: -5, len: 8, thick: 1 }, legW: 3, shadow: 8 },
  // Smallest, scruffy, a ruff at the neck, semi-pricked ears, a full tail low with a sweep up.
  collie: { leg: 6, body: 11, depth: 5, waist: 4, neck: 2, skull: [4, 4], muzzle: 3, snout: 3, ear: 'semi', tail: { base: -46, curl: 11, len: 9, thick: 2 }, legW: 3, ruff: true, shadow: 8 },
};

/**
 * The box every hound is drawn in (pixels): `w` by `h`, its feet's line on row `ground`, its middle at
 * column `x`. One box for every breed, coat and pose (tests/hound.test.ts holds them all inside it).
 */
export const HOUND_BOX = { w: 39, h: 24, x: 20, ground: 23 } as const;
