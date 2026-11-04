/**
 * A hero's body through each act, from what the room already says (act, actT, the swing, the charge,
 * hitstop, the slide). Kyle: a charge reads through the weapon, not the body, and the face never
 * moves with it: the weapon arm draws back and up while the charge fills, snaps through on release
 * while the body is knocked back a pixel or two; snapped back when hit, a little lower on landing.
 * Pose data only (motion.ts); actors.ts draws it.
 */
import { CHARGE, GRAB, RELICS, WEAPONS } from '../shared/tuning';
import { chargeFull, currentSwing } from '../sim/hero';
import type { Hero } from '../sim/types';
import { HURT_RED, MOTION, WHITE, clamp01, easeOut, newPose, pushDir, rest, struck, type BodyPose } from './motion';

const P = newPose(), D: [number, number] = [0, 0], M = MOTION.hero;

/**
 * When each hero last lost health (room time). Heavy armor takes a small goblin's blow without a
 * stagger (no 'hurt' act), so the drop in health is what says it landed.
 */
const lost = new Map<string, { hp: number; at: number; t: number }>();
function struckAt(h: Hero, t: number): number {
  let m = lost.get(h.id);
  if (!m) lost.set(h.id, (m = { hp: h.hp, at: -9, t }));
  // A new room starts its clock again: forget the old one.
  if (t < m.t) (m.at = -9), (m.hp = h.hp);
  if (h.hp < m.hp) m.at = t;
  (m.hp = h.hp), (m.t = t);
  return h.act === 'hurt' ? t - h.actT : m.at;
}

/** White through the hitstop, then a fading red. */
function flashHit(p: BodyPose, age: number): void {
  if (age < M.hit.white) (p.flash = 0.9), (p.tint = WHITE);
  else if (age < M.hit.red) (p.flash = 0.8 * (1 - (age - M.hit.white) / (M.hit.red - M.hit.white))), (p.tint = HURT_RED);
}

/** The weapon arm drawn back from the facing and lifted (pixels); the body and head stay where they are. */
function draw(p: BodyPose, back: number, up: number): void {
  p.reach = -back;
  p.raise = up;
}

/** The blow or shot going out, `e` (0..1) of the way: the arm snaps through, the body knocked back by it. */
function release(p: BodyPose, h: Hero, e: number): void {
  const s = currentSwing(h), big = h.heavy || h.counter || s.knock >= 7;
  // A thrown dagger goes out like a blow (the arm snaps forward); a bow or a spell kicks the hands back.
  const shot = !!s.shot && s.shot !== 'knife', R = shot ? M.shot : big ? M.releaseHeavy : M.release;
  const kick = shot ? (h.heavy ? M.shot.heavy * Math.max(0.5, h.power) : M.shot.recoil) : R.recoil;
  p.ox = -Math.round(h.fx * kick * e);
  p.oy = -Math.round(h.fy * kick * 0.6 * e);
  p.reach = R.reach * (s.thrust ? 1.5 : 1) * e;
  // A Mage's quick spell is flicked out from the wrist: the arm goes forward with it, no kick back.
  if (shot && !h.heavy && WEAPONS[h.weapon].cls === 'MAGE') (p.ox = p.oy = 0), (p.reach = M.release.reach * e);
}

/** The pose this frame; `t` is room time, `now` the wall clock (for shivers). Reused: read it at once. */
export function heroPose(h: Hero, t: number, now: number): BodyPose {
  const p = rest(P), w = WEAPONS[h.weapon], shot = !!w.heavy.shot, hitAge = t - struckAt(h, t);
  p.dx = h.fx;
  p.dy = h.fy;
  heroAct(p, h, t, now, w, shot);
  // Hit without a stagger (heavy armor, mid-swing): still a flash and a flinch along the push.
  if (h.act !== 'hurt' && hitAge >= 0 && hitAge < M.hit.red) {
    flashHit(p, hitAge);
    pushDir(h.kvx, h.kvy, -h.fx, -h.fy, D);
    if (hitAge < M.hit.time) (p.ox += Math.round(D[0] * (1 - hitAge / M.hit.time))), (p.lean += Math.round(D[0] * M.hit.lean * 0.5));
  }
  return p;
}

function heroAct(p: BodyPose, h: Hero, t: number, now: number, w: (typeof WEAPONS)[keyof typeof WEAPONS], shot: boolean): BodyPose {
  // Crouched at a nest, setting it alight (sim/torch.ts): down low, the hand out to it.
  if (h.stoop && h.act === 'idle') return (p.crouch = 0.35), (p.reach = 2), (p.phase = 'rest'), p;
  if (h.act === 'charge') {
    const k = clamp01((h.actT + CHARGE.start) / chargeFull(w, h));
    draw(p, M.charge.draw * k, M.charge.raise * k);
    // A blade held at full shivers in the hand (the arm, not the body).
    if (k >= 1 && !shot) p.raise += Math.floor(now * 30) % 2;
    return (p.phase = 'charge'), (p.k = k), p;
  }
  if (h.act === 'attack') {
    const s = currentSwing(h), T = h.actT;
    if (T < s.windup) {
      const k = T / s.windup;
      const q = h.heavy ? h.power : easeOut(k) * Math.min(1, s.windup / M.windup.full);
      if (h.heavy) draw(p, M.charge.draw * q, M.charge.raise * q);
      // A spell cast from the tap: the casting arm comes up, the light gathers at the tip (held.ts).
      else if (s.shot && s.shot !== 'knife') draw(p, 0, M.charge.raise * q);
      else draw(p, M.windup.draw * q, M.windup.raise * q);
      return (p.phase = 'windup'), (p.k = k), p;
    }
    if (T < s.windup + s.active) {
      const k = (T - s.windup) / s.active;
      // The blow snaps out (it lands on the first active tick), and holds full through the hitstop.
      release(p, h, h.hitstop > 0 ? 1 : easeOut(0.5 + k * 2));
      // Frozen on the blow while the hitstop holds.
      return (p.phase = h.hitstop > 0 ? 'contact' : 'release'), (p.k = k), p;
    }
    const r = (T - s.windup - s.active) / M.recover.time;
    if (r < 1) {
      release(p, h, 1 - easeOut(r));
      return (p.phase = 'recover'), (p.k = r), p;
    }
    return p;
  }
  if (h.act === 'throw') {
    const r = RELICS[h.relic], k = h.actT / r.windup;
    if (k < 1) draw(p, M.windup.draw * easeOut(k), M.windup.raise * easeOut(k));
    else p.reach = M.release.reach * clamp01(1 - (h.actT - r.windup) / M.recover.time);
    return (p.phase = k < 1 ? 'windup' : 'release'), (p.k = clamp01(k)), p;
  }
  if (h.act === 'slam') {
    // Up on the toes as it goes overhead, then flattened as it comes down.
    const k = h.actT / GRAB.slamWindup;
    if (k < 1) return (p.crouch = -0.1 * k), (p.phase = 'windup'), (p.k = k), p;
    const a = h.actT - GRAB.slamWindup;
    if (a < M.land.time) (p.crouch = M.land.crouch * (1 - a / M.land.time)), (p.phase = 'land'), (p.k = a / M.land.time);
    return p;
  }
  if (h.act === 'hurt') {
    pushDir(h.kvx, h.kvy, -h.fx, -h.fy, D);
    if (h.actT < M.hit.time) struck(p, h.actT, D[0], D[1], M.hit);
    else (p.phase = 'stagger'), (p.ox = Math.round(Math.sin(now * 90) * 1.2));
    return flashHit(p, h.actT), p;
  }
  if (h.act === 'stun') {
    p.lean = Math.round(Math.sin(now * M.stun.rate) * M.stun.sway);
    return (p.phase = 'stun'), (p.flash = 0.3), p;
  }
  // Just out of a roll, a jump or a dash: the landing.
  const d = w.dodge, age = t - (h.lastRollAt + d.time);
  if (h.act !== 'roll' && d.kind !== 'blink' && age >= 0 && age < M.land.time) {
    p.crouch = M.land.crouch * (d.kind === 'backstep' ? 1.3 : 1) * (1 - age / M.land.time);
    return (p.phase = 'land'), (p.k = age / M.land.time), p;
  }
  return p;
}

/** How far the view jolts this frame for my hero: along a blow that hit me, or along my heavy as it connects. */
export function camKick(h: Hero | undefined, t: number, out: [number, number]): [number, number] {
  out[0] = out[1] = 0;
  if (!h) return out;
  const age = t - struckAt(h, t);
  if (age >= 0 && age < MOTION.cam.hitTime) {
    const f = MOTION.cam.hit * (h.act === 'hurt' ? 1 : 0.5) * (1 - age / MOTION.cam.hitTime);
    pushDir(h.kvx, h.kvy, -h.fx, -h.fy, D);
    (out[0] = -Math.round(D[0] * f)), (out[1] = -Math.round(D[1] * f));
  } else if (h.act === 'attack' && h.hitstop > 0 && (h.heavy || h.counter)) (out[0] = -Math.round(h.fx * MOTION.cam.contact)), (out[1] = -Math.round(h.fy * MOTION.cam.contact));
  return out;
}
