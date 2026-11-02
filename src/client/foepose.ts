/**
 * Goblin and butcher bodies through their acts, from the room's state alone: rearing back in the
 * wind-up (scaled to how long it is, so the telegraph reads in the body too), thrown at the blow,
 * settling; snapped back and flashed white when hit, a small one tumbling when hit hard, the butcher
 * staggering, the stunned swaying. Pose data only (motion.ts); foes.ts draws it.
 */
import type { Enemy } from '../sim/types';
import { MOTION, WHITE, clamp01, easeOut, newPose, pushDir, rest, struck, type BodyPose } from './motion';

const P = newPose(), D: [number, number] = [0, 0], F = MOTION.foe, B = MOTION.butcher;

/** Struck: white while the blow is fresh (and through its hitstop), snapped back along the push. */
export function foeHit(p: BodyPose, e: Enemy, t: number, heavy = 1): BodyPose {
  const age = t - e.hitAt;
  if (age < 0 || age > 0.3) return p;
  if (age < F.hit.flash || e.hitstop > 0) (p.flash = 0.9), (p.tint = WHITE);
  if (age < F.hit.time) {
    pushDir(e.kvx, e.kvy, -e.fx, -e.fy, D);
    const ph = p.phase;
    struck(p, age, D[0], D[1], { shift: F.hit.shift / heavy, time: F.hit.time, crouch: F.hit.crouch / heavy, lean: F.hit.lean });
    // A wind-up carried through the hit (the butcher's) keeps its name.
    if (ph === 'windup') p.phase = ph;
  }
  return p;
}

/** Thrown at the blow along its facing, `f` (0..1) of the way, with an afterimage while it's fresh. */
function lunge(p: BodyPose, e: Enemy, f: number, shift: number, lean: number, stretch: number, ghost: boolean): void {
  const side = e.fx >= -0.2 ? 1 : -1;
  p.ox = Math.round(e.fx * shift * f);
  p.oy = Math.round(e.fy * shift * f);
  p.lean = Math.round(side * lean * f);
  p.stretch = stretch * f;
  if (ghost) (p.ghost = 0.3 * f), (p.gx = -p.ox), (p.gy = -p.oy);
}

/** Staggered (a heavy flinch) or stunned (swaying), on top of whatever else. */
function reel(p: BodyPose, e: Enemy, now: number): void {
  if (e.act === 'flinch') {
    const k = clamp01(e.actT / Math.max(0.05, e.actDur)), f = 1 - easeOut(k);
    pushDir(e.kvx, e.kvy, -e.fx, -e.fy, D);
    p.lean += Math.round(D[0] * F.stagger.lean * f);
    p.ox += Math.round(D[0] * 2 * f);
    p.oy += Math.round(D[1] * 2 * f);
    p.crouch += F.stagger.crouch * f;
    (p.phase = 'stagger'), (p.k = k);
  } else if (e.act === 'stunned') {
    p.lean += Math.round(Math.sin(now * F.stun.rate) * F.stun.sway);
    p.crouch += F.stun.crouch;
    p.phase = 'stun';
  }
}

/** A small goblin: knife pulled back and coiled (the lunger low and shivering), then the stab. */
export function scrapperPose(e: Enemy, t: number, now: number): BodyPose {
  const p = rest(P), a = e.attack, lunger = e.variant === 'lunger';
  p.dx = e.fx;
  p.dy = e.fy;
  if (a && a.t < a.windup) {
    const W = lunger ? F.windupLunger : F.windup, k = a.t / a.windup;
    const amp = Math.min(1.3, Math.max(0.5, a.windup / F.windup.full)), q = easeOut(k) * amp;
    p.lean = -Math.round(e.fx * W.lean * q);
    p.crouch = e.bow ? 0 : W.crouch * q;
    p.ox = -Math.round(e.fx * 2 * q);
    p.oy = -Math.round(e.fy * 2 * q);
    if (lunger && k > 0.75) p.ox += Math.floor(now * 40) % 2;
    // The brute lifts its club.
    if (e.variant === 'heavy') p.raise = F.windup.raise * q;
    (p.phase = 'windup'), (p.k = k);
  } else if (a && a.t < a.windup + a.active + 0.08) {
    lunge(p, e, 1, lunger ? 5 : 3, F.release.lean, F.release.stretch * (lunger ? 1.6 : 1), !e.bow);
    (p.phase = e.hitstop > 0 ? 'contact' : 'release'), (p.k = (a.t - a.windup) / a.active);
  } else if (a) {
    const r = (a.t - a.windup - a.active - 0.08) / F.recover.time;
    if (r < 1) lunge(p, e, 1 - easeOut(r), lunger ? 5 : 3, F.release.lean, 0, false), (p.phase = 'recover'), (p.k = r);
  }
  reel(p, e, now);
  return foeHit(p, e, t);
}

const tumbles = new Map<number, { at: number; dir: number }>();
/** Hit hard enough, a small goblin goes over once: the turn so far and the hop, or null. */
export function tumble(e: Enemy, t: number): { a: number; hop: number } | null {
  let m = tumbles.get(e.id);
  if (Math.hypot(e.kvx, e.kvy) > F.tumble.speed && t - e.hitAt < 0.1 && (!m || m.at !== e.hitAt)) {
    tumbles.set(e.id, (m = { at: e.hitAt, dir: e.kvx >= 0 ? 1 : -1 }));
  }
  if (!m) return null;
  const k = (t - m.at) / F.tumble.time;
  if (k < 0 || k >= 1) return null;
  TUMBLE.a = m.dir * Math.PI * 2 * easeOut(k);
  TUMBLE.hop = Math.round(Math.sin(k * Math.PI) * F.tumble.hop);
  return TUMBLE;
}
const TUMBLE = { a: 0, hop: 0 };

/** The butcher: the cleaver hauled back high, the leap and the landing, the Stoker's coiled run. */
export function butcherPose(e: Enemy, t: number, now: number): BodyPose {
  const p = rest(P), a = e.attack, side = e.fx >= -0.2 ? 1 : -1;
  p.dx = e.fx;
  p.dy = e.fy;
  if (a && (a.kind === 'cleave' || a.kind === 'draw')) {
    const C = B.cleave, end = a.windup + a.active + 0.06;
    if (a.t < a.windup) {
      const k = a.t / a.windup, up = easeOut(k / C.coilAt);
      p.lean = -Math.round(side * C.lean * up);
      p.crouch = k < C.coilAt ? -C.tall * up : C.coil * easeOut((k - C.coilAt) / (1 - C.coilAt));
      p.ox = -Math.round(e.fx * 2 * up) + (k > 0.8 ? Math.round(Math.sin(now * 70)) : 0);
      p.oy = -Math.round(1 + e.fy * 2 * up);
      p.raise = C.raise * up;
      (p.phase = 'windup'), (p.k = k);
    } else if (a.t < end) lunge(p, e, 1, 3, C.lean, F.release.stretch, true), (p.phase = e.hitstop > 0 ? 'contact' : 'release');
    else {
      const r = (a.t - end) / F.recover.time;
      lunge(p, e, 1 - easeOut(r), 3, C.lean, 0, false);
      (p.oy += 1), (p.phase = 'recover'), (p.k = clamp01(r));
    }
  } else if (a && a.kind === 'slam') {
    const S = B.slam, k = a.t / a.windup;
    if (k < 1) {
      // Down into a crouch, then up and stretched, hanging at the top with the cleaver high.
      const r = (k - S.crouchShare) / S.riseShare;
      p.crouch = k < S.crouchShare ? S.crouch * easeOut(k / S.crouchShare) : -S.stretch * clamp01(1 - (r - 1) / 0.4) * easeOut(r);
      p.lift = k < S.crouchShare ? 0 : Math.round(S.rise * easeOut(r));
      // The cleaver goes up over his head as he crouches, and stays there.
      p.raise = S.raise * easeOut(k / S.crouchShare);
      (p.phase = 'windup'), (p.k = k);
    } else if (a.t < a.windup + a.active + 0.1) (p.crouch = S.flat), (p.phase = 'land');
    else {
      const r = (a.t - a.windup - a.active - 0.1) / S.recover;
      (p.crouch = S.flat * 0.5 * (1 - easeOut(r))), (p.oy = 1), (p.phase = 'recover'), (p.k = clamp01(r));
    }
  } else if (a && a.kind === 'charge') {
    const C = B.charge;
    if (a.t < a.windup) {
      const k = easeOut(a.t / a.windup);
      p.crouch = C.crouch * k;
      p.lean = -Math.round(side * C.lean * k);
      p.ox = Math.floor(now * 12) % 2;
      (p.phase = 'windup'), (p.k = a.t / a.windup);
    } else if (a.t < a.windup + a.active) lunge(p, e, 1, 2, C.lean, C.stretch, true), (p.phase = 'release');
  }
  reel(p, e, now);
  return foeHit(p, e, t, 2);
}
