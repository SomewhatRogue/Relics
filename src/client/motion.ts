/**
 * How bodies move around a blow: the wind-up you read, the release you feel, the snap of being hit
 * and the settle after. Drawing only (the room never reads any of this), so every number lives here.
 *
 * Each act is split into named phases (windup, charge, release, contact, recover, hit, stagger, land,
 * stun) and each phase gives pose data, not pictures: how far the top of the body leans, how low it
 * crouches (negative: rises tall), how far it stretches along the blow, how far the whole body shifts,
 * and its flash. The sprites are cut into parts (joints.ts) and figure.ts moves each part by it, a
 * whole pixel at a time. Pixels are scene pixels, times are seconds of room time, shares are of body size.
 */
export const MOTION = {
  hero: {
    /**
     * Kyle: a charge reads through the weapon, never by stretching the body or moving the head. A quick
     * wind-up draws the weapon arm back (`draw`, pixels) and up (`raise`); `full`: a wind-up this long
     * gets all of it.
     */
    windup: { draw: 1, raise: 1, full: 0.2 },
    /** Held for a heavy, at full charge: the arm drawn back and the weapon up; a blade at full shivers in the hand. */
    charge: { draw: 2, raise: 2 },
    /** The blow going out: the arm snaps through (`reach`) and the body is knocked back a little by it. */
    release: { reach: 2, recoil: 1 },
    releaseHeavy: { reach: 3, recoil: 2 },
    /** A shot: the hands kick back and the body with them (the staff's orb hardest). */
    shot: { reach: -1, recoil: 1, heavy: 2 },
    /** Back to rest after the blow. */
    recover: { time: 0.16 },
    /** Hit: the snap along the blow, squashed, top thrown back; white through the hitstop, then a fading red. */
    hit: { shift: 2, time: 0.16, crouch: 0.16, lean: 2, white: 0.05, red: 0.2 },
    /** A roll, jump or dash ending, or a carried goblin slammed down. */
    land: { crouch: 0.2, time: 0.12 },
    /** Stunned: the top sways. */
    stun: { sway: 1.5, rate: 4 },
  },
  foe: {
    /** A wind-up: pulled back and coiled. `full`: a wind-up this long gets the whole pose. */
    windup: { lean: 2, crouch: 0.1, full: 0.8, raise: 1 },
    /** The lunger coils far lower before its long spring, and shivers at the end of it. */
    windupLunger: { lean: 3, crouch: 0.2 },
    /** The blow going out: the weapon arm out along it (pixels), leaning in. */
    release: { reach: 2, lean: 2 },
    recover: { time: 0.25 },
    /** Hit: a white flash this long (and all through the hitstop after it), a snap back, squashed. */
    hit: { flash: 0.09, shift: 2, time: 0.14, crouch: 0.14, lean: 2 },
    /** A small goblin hit this hard goes head over heels once, with a hop, and lands squashed. */
    tumble: { speed: 4.5, time: 0.32, hop: 4 },
    /** A heavy flinch (the butcher's): thrown back on its heels, then righting itself. */
    stagger: { lean: 3, crouch: 0.08 },
    stun: { sway: 2, rate: 4, crouch: 0.06 },
  },
  butcher: {
    /** Cleave: rising tall as the cleaver goes back, then a coil just before the chop. */
    cleave: { tall: 0.07, coil: 0.07, coilAt: 0.75, lean: 3, raise: 3 },
    /** Slam: a crouch before the leap, stretched in the air, flattened on landing, then rising. */
    slam: { crouch: 0.18, crouchShare: 0.15, rise: 9, riseShare: 0.55, stretch: 0.12, flat: 0.3, recover: 0.35, raise: 5 },
    /** The Stoker's run: coiled low and pawing, then thrown forward along the lane. */
    charge: { crouch: 0.15, lean: 3, reach: 2 },
  },
  /** The view: a jolt along the blow when you're hit, a nudge when your heavy connects. */
  cam: { hit: 3, hitTime: 0.14, contact: 1 },
  /** Dust at the feet: motes a puff, how fast, how sharp a turn throws one (and how often), the slowest that counts. */
  dust: { n: 5, speed: 22, turnDot: -0.2, turnGap: 0.25, minSpeed: 1.5 },
} as const;

export type Phase = 'rest' | 'windup' | 'charge' | 'release' | 'contact' | 'recover' | 'hit' | 'stagger' | 'land' | 'stun' | 'tumble';

/**
 * A body's pose this frame. `k` is how far through its phase (0..1). `lean` shifts the top of the body
 * sideways in pixels; `crouch` lowers it onto folding legs (negative rises tall); `stretch` is kept
 * for sprites drawn whole (the dummies); `reach` moves the weapon arm along (dx, dy) and `raise` lifts
 * it (pixels; a negative reach draws it back); `ox, oy` shift the whole body (a lunge, a recoil);
 * `lift` raises it off the ground (a leap, a hop); `flash` washes it in `tint`; `ghost` is an
 * afterimage left at (gx, gy) from the body.
 */
export interface BodyPose {
  phase: Phase;
  k: number;
  lean: number;
  crouch: number;
  stretch: number;
  dx: number;
  dy: number;
  ox: number;
  oy: number;
  reach: number;
  raise: number;
  lift: number;
  flash: number;
  tint: string;
  ghost: number;
  gx: number;
  gy: number;
  /** A walking step: -1 the left foot is up a pixel, 1 the right, 0 both down (figure.ts). */
  step: number;
}

export const WHITE = '#ffffff', HURT_RED = '#ff3a2a';

/** Back to standing still (pose objects are reused every frame, so nothing is allocated). */
export function rest(p: BodyPose): BodyPose {
  p.phase = 'rest';
  p.k = p.lean = p.crouch = p.stretch = p.ox = p.oy = p.reach = p.raise = p.lift = p.flash = p.ghost = p.gx = p.gy = p.step = 0;
  p.dx = 1;
  p.dy = 0;
  p.tint = WHITE;
  return p;
}

export const newPose = (): BodyPose => rest({} as BodyPose);

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const easeOut = (t: number) => 1 - (1 - clamp01(t)) ** 2;

/** The pose's stretch and crouch as a width and height share for a single sprite (feet stay put). */
export function scaleOf(p: BodyPose, out: [number, number]): [number, number] {
  const ax = Math.abs(p.dx), ay = Math.abs(p.dy);
  out[0] = (1 + p.stretch * (ax - 0.6 * ay)) * (1 + p.crouch * 0.7);
  out[1] = (1 + p.stretch * (ay - 0.6 * ax)) * (1 - p.crouch);
  return out;
}

/** The direction a blow pushed a body (its slide), or (fx, fy) if it isn't sliding. */
export function pushDir(kvx: number, kvy: number, fx: number, fy: number, out: [number, number]): [number, number] {
  const l = Math.hypot(kvx, kvy);
  if (l > 0.3) (out[0] = kvx / l), (out[1] = kvy / l);
  else (out[0] = fx), (out[1] = fy);
  return out;
}

/** The hit reaction shared by every body: `age` seconds since the blow, pushed along (dx, dy). */
export function struck(p: BodyPose, age: number, dx: number, dy: number, m: { shift: number; time: number; crouch: number; lean: number }): void {
  const k = clamp01(age / m.time), f = 1 - easeOut(k);
  p.phase = 'hit';
  p.k = k;
  p.ox += Math.round(dx * m.shift * f);
  p.oy += Math.round(dy * m.shift * 0.6 * f);
  p.lean += Math.round(dx * m.lean * f);
  p.crouch += age < m.time * 0.5 ? m.crouch : 0;
}
