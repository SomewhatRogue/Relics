/**
 * The body through each idle (idles.ts) and a pet (petting.ts): the pose data figure.ts already moves
 * (lean, crouch, the weapon arm's reach and lift), where the weapon points, which way the hero looks,
 * a shield planted, lying on the floor. Pose data only; idledraw.ts draws what's in hand.
 */
import type { Hero } from '../sim/types';
import { idleFrame, type IdleFrame } from './idles';
import { LODGE_DOG, petFrame } from './petting';
import type { BodyPose } from './motion';
import type { Pose } from './held';

/** What an idle changes this frame. `flip`/`up`: the way the hero looks (null: as they face); `lying`:
 *  on the floor, the head toward this side (0: standing); `shield`: planted at (dx, dy) from the feet;
 *  `a`, `ext`: the weapon's angle facing right (mirrored when facing left) and how far it's pushed out. */
export interface IdleOut { f: IdleFrame | null; pet: number; dog: number; flip: boolean | null; up: boolean | null; lying: number; shield: [number, number] | null; a: number | null; ext: number | null; /** The main-hand dagger is in the air (a Rogue's flip). */ hide: boolean; /** The weapon goes behind the body (over the shoulder). */ behind: boolean }
const O: IdleOut = { f: null, pet: -1, dog: 1, flip: null, up: null, lying: 0, shield: null, a: null, ext: null, hide: false, behind: false };

/** When a Rogue's flipped knife is out of the hand (s into the idle). */
export const KNIFE_UP = { g_flip: [[0.3, 1.1], [1.5, 2.3]], g_fumble: [[0.3, 1.45]] } as const;
const aloft = (id: 'g_flip' | 'g_fumble', t: number) => KNIFE_UP[id].some(([a, b]) => t > a && t < b);

const ease = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
/** In over `inT` from `t0`, out over `outT` to `t1` (0..1). */
const hold = (t: number, t0: number, t1: number, inT = 0.3, outT = 0.3) => ease((t - t0) / inT) * ease((t1 - t) / outT);
const pulse = (t: number, hz: number) => (Math.sin(t * Math.PI * 2 * hz) > 0 ? 1 : 0);

/** Told of each idle frame posed (herovoice.ts laughs on the floor); kept a hook so posing stays sound-free. */
export const idleHook: { fn: ((h: Hero, id: string, t: number, now: number) => void) | null } = { fn: null };

/** The idle or pet this hero is in now, posed onto `pz` (null: neither). */
export function idlePose(h: Hero, pz: BodyPose, now: number): IdleOut | null {
  // (Both watched every frame, so a blow or a step ends them even where nothing idle is drawn.)
  const pet = petFrame(h, now), f = idleFrame(h, now);
  if (h.act !== 'idle' || pz.phase !== 'rest' || h.moving) return null;
  Object.assign(O, { f: null, pet: -1, flip: null, up: null, lying: 0, shield: null, a: null, ext: null, hide: false, behind: false });
  if (pet) {
    const dx = (pet.dog === 'own' ? h.hound?.x ?? h.x + 1 : LODGE_DOG.x) - h.x, s = dx >= 0 ? 1 : -1, k = hold(pet.t, 0.1, 2.5, 0.35, 0.35);
    // Down on a knee by the hound, the hand out to it.
    Object.assign(O, { pet: pet.t, dog: s, flip: s < 0 });
    (pz.crouch = 0.35 * k), (pz.lean = Math.round(s * k)), (pz.dx = s), (pz.dy = 0), (pz.reach = k), (pz.raise = -k);
    O.a = Math.PI / 2 - 0.4;
    return O;
  }
  if (!f) return null;
  O.f = f;
  idleHook.fn?.(h, f.def.id, f.t, now);
  body(f, h, pz, f.t, f.side);
  return O;
}

function body(f: IdleFrame, h: Hero, pz: BodyPose, t: number, s: number): void {
  const w = h.weapon;
  switch (f.def.id) {
    case 'w_stretch':
      // The neck one way and the other, then the shoulders rolled twice.
      if (t < 1.6) pz.lean = Math.round(Math.sin(t * Math.PI * 1.6) * 1.6 * hold(t, 0, 1.6, 0.2, 0.2));
      else if (t < 3.2) (pz.crouch = -0.08 * pulse(t - 1.6, 1.25)), (pz.raise = pulse(t - 1.6, 1.25));
      break;
    case 'w_edge': {
      // The blade brought up across, the thumb run along its edge, the head bent to it.
      const k = hold(t, 0, 3.4, 0.4, 0.4);
      if (k > 0.3) O.a = w === 'greatsword' ? -0.3 : w === 'spear' ? -0.1 : -0.15;
      (pz.raise = Math.round(2 * k)), (pz.reach = -k), (pz.lean = Math.round(s * k));
      break;
    }
    case 'w_lean': {
      // The shield (the sword's) planted on its rim in front and leaned on, the sword hanging.
      const k = hold(t, 0, 4.6, 0.4, 0.5);
      if (k < 0.3) break;
      (O.shield = [s * 6, -4]), (O.a = Math.PI / 2 + 0.45), (pz.lean = s), (pz.crouch = 0.06 * k);
      break;
    }
    case 'w_plant': {
      // The greatsword point down in the ground in front, or the spear's butt; both hands on it, leaning.
      const k = hold(t, 0, 4.6, 0.4, 0.5);
      if (k < 0.3) break;
      if (w === 'greatsword') (O.a = Math.PI / 2), (O.ext = -6), (pz.reach = 1);
      else (O.a = -Math.PI / 2 + 0.12), (O.ext = 1);
      (pz.lean = s), (pz.crouch = 0.06 * k);
      break;
    }
    case 'w_shoulder': {
      // The spear rested back over the shoulder, the hand up at it; a tap of the foot.
      const k = hold(t, 0, 4, 0.4, 0.4);
      if (k > 0.3) (O.a = -Math.PI / 2 - 0.85), (O.ext = 3), (O.behind = true), (pz.raise = 2), (pz.reach = -1), (pz.step = t > 1 && t < 3.4 ? pulse(t, 2) : 0);
      break;
    }
    case 'w_yawn':
      // Up on the toes with the arms up, a yawn; then down into a flex, a little bounce.
      if (t < 2) (pz.crouch = -0.09 * hold(t, 0, 2, 0.4, 0.3)), (pz.raise = Math.round(3 * hold(t, 0, 2, 0.4, 0.3))), (O.a = -Math.PI / 2 + 0.4);
      else if (t < 4) (pz.crouch = 0.1 * hold(t, 2.2, 4, 0.2, 0.3) - 0.05 * pulse(t, 2)), (pz.raise = 2), (pz.reach = -1), (O.a = -Math.PI / 2 + 0.6);
      break;
    case 'r_fetch':
      // The bow let hang, the stick wound back and thrown; down to take it back off the hound.
      if (t < 0.6) (O.a = Math.PI / 2 - 0.2), (pz.raise = t < 0.35 ? 2 : 1), (pz.reach = t < 0.35 ? -1 : 2);
      else if (t > 3.4 && t < 4.3) (pz.crouch = 0.22 * hold(t, 3.4, 4.3, 0.25, 0.3)), (pz.reach = 1), (pz.raise = -1);
      break;
    case 'r_ruffle': {
      const k = hold(t, 0.4, 3.2, 0.3, 0.3);
      (pz.crouch = 0.25 * k), (pz.reach = k), (pz.raise = -k);
      if (k > 0.2) O.a = Math.PI / 2 - 0.3;
      break;
    }
    case 'r_scan':
      // A hand over the eyes one way, then the other; then over the shoulder to the fletching.
      if (t < 2.6) (O.flip = t > 1.3 ? s > 0 : s < 0), (pz.crouch = -0.06 * hold(t, 0, 2.6, 0.3, 0.2));
      else (pz.raise = Math.round(3 * hold(t, 2.6, 5.2, 0.3, 0.4))), (pz.reach = -Math.round(2 * hold(t, 2.6, 5.2, 0.3, 0.4))), (pz.lean = -s * pulse(t, 0.8));
      break;
    case 'r_tackle':
      // Knocked flat by the hound, laughing on the floor, up again, still laughing.
      if (t > 0.8 && t < 1.1) pz.lean = -s;
      else if (t >= 1.1 && t < 3.6) O.lying = -s;
      else if (t >= 3.6 && t < 4.2) pz.crouch = 0.35 * (1 - (t - 3.6) / 0.6);
      else if (t >= 4.2) (pz.lean = Math.round(Math.sin(t * 19) * 0.8) * (t < 5.6 ? 1 : 0)), (pz.crouch = 0.05 * pulse(t, 3));
      break;
    case 'g_flip':
      // With twin daggers it's the one in hand that goes up; anything else, a spare off the belt.
      O.hide = w === 'daggers' && aloft('g_flip', t);
      break;
    case 'g_glance':
      // Over one shoulder, then turned right round to look behind.
      if (t > 0.3 && t < 1.1) (O.flip = s > 0), (pz.lean = -s);
      else if (t > 1.6 && t < 2.4) O.up = true;
      break;
    case 'g_fumble':
      O.hide = w === 'daggers' && aloft('g_fumble', t);
      // Missed, snatched low on the second go; a look round to see who saw, a shrug.
      if (t > 1.2 && t < 1.6) pz.crouch = 0.15;
      else if (t > 1.9 && t < 2.4) O.flip = s > 0;
      // (A shrug after, the blade kept low: never up by the face.)
      else if (t > 2.6 && t < 3.2) pz.crouch = -0.07;
      break;
    case 'm_read':
      if (w !== 'staff') O.a = Math.PI / 2 - 0.4;
      pz.crouch = 0.05 * hold(t, 0, 5.2, 0.4, 0.4);
      break;
    case 'm_sparks':
      // The wand or the spellblade lifted to flick them off its tip (the staff's head is already up).
      if (w !== 'staff') (O.a = -0.9), (pz.raise = 2 + (t % 0.8 < 0.25 ? 1 : 0));
      break;
    case 'm_brim': {
      const k = hold(t, 0.2, 2.4, 0.3, 0.3);
      (pz.raise = Math.round(3 * k)), (pz.reach = -Math.round(k));
      if (k > 0.3 && w !== 'staff') O.a = -Math.PI / 2 + 0.3;
      break;
    }
    case 'm_flop':
      // The brim down over the eyes: a blind wobble, arms out; pushed back up, a straightening.
      if (t > 0.5 && t < 2.2) (pz.lean = Math.sin(t * 6) > 0 ? 1 : -1), (pz.raise = 1);
      else if (t >= 2.2 && t < 2.7) (pz.raise = 3), (pz.reach = -1), w !== 'staff' && (O.a = -Math.PI / 2 + 0.3);
      else if (t >= 2.7) pz.crouch = 0.05 * hold(t, 2.7, 3.8, 0.2, 0.4);
      break;
    case 'c_censer':
      pz.lean = Math.round(Math.sin(t * 2.4) * 0.7);
      break;
    case 'c_pray': {
      const k = hold(t, 0, 4.4, 0.5, 0.5);
      (pz.crouch = 0.1 * k), k > 0.3 && (O.a = Math.PI / 2 - 0.5);
      break;
    }
    case 'c_polish':
      if (hold(t, 0, 3.8, 0.3, 0.3) > 0.3) (O.a = -0.35), (pz.raise = 1), (pz.reach = -1), (pz.lean = s);
      break;
    case 'c_sneeze':
      // Smoke in the face, the head going back, the sneeze, a shake of the head.
      if (t > 1 && t < 1.9) (pz.crouch = -0.1 * ease((t - 1) / 0.6)), (pz.lean = -s);
      else if (t >= 1.9 && t < 2.2) (pz.crouch = 0.2), (pz.lean = 2 * s), (pz.oy = 1);
      else if (t >= 2.2 && t < 2.8) pz.lean = Math.sin(t * 30) > 0 ? 1 : -1;
      break;
  }
}
