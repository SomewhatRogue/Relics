/**
 * The Night Watch's numbers, in one place (Kyle 2026-11-05, docs/plans/town-activities.md). The field is
 * a side-on picture WATCH.w pixels across (two fields: FIELDS): the wall on the right, the hero on its walk, the fields
 * rolling away to the left. Each goblin's hit zones are given here in the same pixels its sprite is
 * drawn in (client/watchgobs.ts paints from `SHAPES`), so what you see is what's judged.
 */

export const WATCH = {
  /** The picture's width in pixels (the sim works in these too); each field has its own height. */
  w: 232,
  /** A shift: three minutes. */
  duration: 180,
  /** The sim's own fixed step (a run replays the same from its seed and the same inputs). */
  step: 1 / 60,
  /** The wall walk (the hero's feet), the hero, and the bow they loose from. */
  walkY: 70, heroX: 212, bowX: 204, bowY: 58,
  /** The wall's field face, and the low parapet in front of the hero. */
  wallX: 196, parapetTop: 61,
  /** Past this a goblin is down in the ditch under the wall, out of sight: the watch below have it. */
  reachX: 177,
  /** Goblins come in this far before the field's edge. */
  spawnX: -10,
};

/**
 * Two fields, chosen when a shift starts. `wide` (a laptop, a phone on its side): the whole long field,
 * rolling gently down to the ditch. `tall` (a phone held upright): a shorter field over the brow of a
 * steep hill, so it fills the screen and the goblins are big enough to aim at (Kyle's phone, 2026-11-05).
 * The same wall, bow, goblins and numbers; only where they come from and the ground they walk on differ.
 */
export type FieldName = 'wide' | 'tall';
export interface Field {
  /** The field's left edge (goblins come in at from + WATCH.spawnX); its height; the far hills' rise. */
  from: number; h: number; hills: number;
  /** Where the moon hangs; how fast goblins walk here (the tall field's slope is steeper); where archers stop. */
  moon: [number, number]; pace: number; archerStop: [number, number];
}
export const FIELDS: Record<FieldName, Field> = {
  wide: { from: 0, h: 174, hills: 0, moon: [46, 22], pace: 1, archerStop: [55, 110] },
  tall: { from: 90, h: 210, hills: -26, moon: [112, 22], pace: 0.8, archerStop: [100, 128] },
};

/** The ground's height at `x` on a field (its rolling ground, then the ditch under the wall). Works off either edge too. */
export function groundY(x: number, f: FieldName = 'wide'): number {
  const tall = f === 'tall', k = Math.max(0, Math.min(1, tall ? (x - 90) / 82 : x / 176));
  const field = tall ? 84 + Math.pow(k, 1.1) * 86 + 2.5 * Math.sin(x / 11) + 1.5 * Math.sin(x / 5 + 1)
    : 116 + Math.pow(k, 1.3) * 32 + 3 * Math.sin(x / 23) + 2 * Math.sin(x / 9 + 1.3);
  if (x < 172) return field;
  // The lip of the ditch, then down to the wall's foot.
  if (x < 179) return field - 3 * Math.sin(((x - 172) / 7) * Math.PI);
  return tall ? Math.min(196, field + (x - 179) * 1.5) : Math.min(166, field + (x - 179) * 1.1);
}

export const BOW = {
  /** Seconds to a full draw; anything less is a quicker, weaker, wilder shot. */
  full: 0.5,
  /** Seconds after loosing before the next arrow is on the string. */
  nock: 0.22,
  /** Arrow speed in pixels a second, from a tap to a full draw, and the pull of the earth on it. */
  vTap: 170, vFull: 330, gravity: 70,
  /** How far off a tap can fly, in degrees either way (none at a full draw). */
  wobble: 2.4,
  /** At or past this much draw a body shot hits for 2 (a tap hits for 1); a head shot doubles it. */
  hard: 0.85,
  /** A leg hit: this much damage, and the goblin limps at this fraction of its pace from then on. */
  legDmg: 1, limp: 0.45,
};

/** A rectangle from (x0, y0) to (x1, y1), and a circle, both from the goblin's feet, facing the wall (+x). */
export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface Disc { x: number; y: number; r: number }
export interface Shape { head: Disc; body: Box; legs: Box; shield?: Box; torch?: Box }

export type GobKind = 'plain' | 'helmet' | 'shield' | 'runner' | 'torch' | 'archer';
const upright = (): Shape => ({ head: { x: 1.5, y: -16.5, r: 3.5 }, body: { x0: -3, y0: -13, x1: 4, y1: -6 }, legs: { x0: -3, y0: -6, x1: 3, y1: 0 } });
export const SHAPES: Record<GobKind, Shape> = {
  plain: upright(),
  helmet: upright(),
  // The shield is held out in front: it covers the body and the top of the legs; the head shows over the rim.
  shield: { ...upright(), shield: { x0: 4, y0: -14, x1: 7, y1: -3 } },
  // Bent low and running: a smaller target, head forward.
  runner: { head: { x: 5.5, y: -11.5, r: 3 }, body: { x0: -3, y0: -10, x1: 4, y1: -5 }, legs: { x0: -3, y0: -5, x1: 3, y1: 0 } },
  // The torch held up in front: the stick and the flame.
  torch: { ...upright(), torch: { x0: 4, y0: -26, x1: 7, y1: -13 } },
  archer: upright(),
};

export interface GobDef { hp: number; speed: number; points: number; from: number; weight: number }
/** Each kind: hit points, pace (pixels a second), points for the kill, the second it first comes, how often after. */
export const GOBS: Record<GobKind, GobDef> = {
  plain: { hp: 2, speed: 13, points: 10, from: 0, weight: 3 },
  helmet: { hp: 2, speed: 12, points: 15, from: 14, weight: 2.2 },
  runner: { hp: 1, speed: 30, points: 15, from: 38, weight: 1.5 },
  shield: { hp: 2, speed: 9, points: 20, from: 58, weight: 1.6 },
  torch: { hp: 2, speed: 14, points: 15, from: 80, weight: 1.2 },
  archer: { hp: 2, speed: 11, points: 20, from: 100, weight: 1.1 },
};

export const FOES = {
  /** Seconds between goblins at the start and at the end (each one jittered by up to a third). */
  gapStart: 3.0, gapEnd: 1.0, jitter: 0.3,
  /** Goblins stop coming this long before the bell. */
  lastCall: 4,
  /** How far up the field a goblin can walk (0 on the near line, up to this many pixels further back). */
  lane: 4,
  /** A shield takes this many arrows and breaks on the last. */
  shieldHits: 3,
  /** A goblin set alight by its own torch: runs this much faster and burns out after this long. */
  burnRun: 1.7, burn: 1.6, burnBonus: 10,
  /** Archers stop somewhere in their field's band (FIELDS), loose this many times this far apart, then walk on. */
  archerShots: 3, archerEvery: 3.2,
  /** Their arrows take this long to reach the wall; the near miss shakes your aim this long, this many pixels. */
  arrowFlight: 1.1, shake: 0.7, shakePx: 5,
  /** How long the fallen lie there (for the arrows in them to be seen). */
  corpse: 6,
};

export const SCORE = {
  /** Hits in a row: each `step` of them adds `add` to the multiplier, up to `max`. */
  step: 3, add: 0.5, max: 3,
  /** A headshot kill's points are doubled. */
  head: 2,
  /** At the end: this many points for each hit, scaled by the share of arrows that hit (so it pays to shoot well, and to shoot). */
  accuracy: 5,
};

export const NIGHT = {
  /** Cloud over the moon: this many passes, each this long (with a ramp), darkening it by up to `dark`. */
  clouds: 3, cloudLen: [12, 20] as [number, number], ramp: 3, dark: 0.75,
  /** Fog banks drifting in from the fields: when each comes, how fast, how wide, how thick, how high. */
  fogs: [30, 75, 120], fogSpeed: [5, 9] as [number, number], fogWide: [50, 90] as [number, number], fogThick: 0.85, fogHigh: 24,
};

/** Pay: a gold piece for every so many points, and no more than so much a night (shared/watchpay.ts). */
export const WATCH_PAY = { per: 50, cap: 30 };
/** The watch only stands at night: Wickhold's daylight under this (shared/daylight.ts). */
export const WATCH_DARK = 0.15;
