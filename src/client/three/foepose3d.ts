/**
 * A goblin's figure in the pose of what the room says: walking, winding up the blow its telegraph
 * shows (the arm comes back over the same wind-up the red shape fills in), the blow, stunned, thrown,
 * dead (lying where it fell and sinking away; burst or shattered, gone). Frozen goblins are ice.
 */
import type { Enemy } from '../../sim/types';
import type { FoeFig } from './goblins3d';
import { CHAR, FLASH, ICE } from './mats';
import { flash, rest, walk } from './rig';

const ease = (k: number) => 1 - (1 - Math.min(1, Math.max(0, k))) ** 2;

/** `t` the room's time (hits are stamped in it), `now` the wall clock. Returns false when nothing should show. */
export function poseFoe(f: FoeFig, e: Enemy, t: number, now: number, walked: number): boolean {
  rest(f);
  f.tor.rotation.z = 0;
  f.root.rotation.y = Math.atan2(e.fx, e.fy);
  f.root.position.y = 0;
  f.head.visible = true;
  if (e.act === 'dead') return dead(f, e);
  const spider = e.kind === 'spider' || e.kind === 'brood';
  if (e.moving && e.act === 'chase') {
    walk(f, walked * (f.big ? 3 : 5.5), 1);
    if (spider) f.legs.forEach((L, i) => (L.rotation.x = Math.sin(walked * 9 + i * 1.7) * 0.35));
  }
  f.aR.rotation.x = -0.4;
  f.aL.rotation.x = -0.3;
  const a = e.attack;
  if (a && e.act === 'attack') {
    const wk = Math.min(1, a.t / a.windup), hit = Math.min(1, Math.max(0, (a.t - a.windup) / Math.max(0.05, a.active)));
    const winding = a.t < a.windup;
    switch (a.kind) {
      case 'slam':
      case 'hex':
        (f.aR.rotation.x = f.aL.rotation.x = winding ? -3.0 * ease(wk) : -3.0 + hit * 2.6), (f.mid.position.y += winding ? -0.06 * wk : Math.sin(hit * Math.PI) * 0.2);
        break;
      case 'stab':
        if (a.arc <= 40) {
          // The lunger: coiled back low over the wind-up, the spear drawn right back; then thrown out
          // full length along the red, the back leg straight behind.
          const c = ease(wk);
          if (winding) (f.mid.rotation.x = -0.3 * c), (f.mid.position.y -= 0.12 * c), (f.mid.position.z = -0.25 * c), (f.aR.rotation.x = 1.3 * c), (f.aL.rotation.x = -0.9 * c), (f.legs[0].rotation.x = -0.6 * c), (f.legs[1].rotation.x = 0.5 * c);
          else (f.mid.rotation.x = 0.65), (f.mid.position.z = 0.55), (f.mid.position.y -= 0.06), (f.aR.rotation.x = -1.65), (f.aL.rotation.x = 0.6), (f.legs[0].rotation.x = -0.9), (f.legs[1].rotation.x = 0.9);
          break;
        }
      // falls through
      case 'pounce':
      case 'bite':
        (f.aR.rotation.x = winding ? 0.7 * ease(wk) : -1.5), (f.mid.rotation.x = winding ? -0.2 * wk : 0.35), (f.mid.position.z = winding ? -0.1 * wk : 0.25);
        break;
      case 'shot':
        (f.aL.rotation.x = -1.5), (f.aR.rotation.x = -1.4 + wk * 0.4), (f.aR.rotation.z = -0.5 * wk);
        break;
      case 'charge':
      case 'draw':
        (f.mid.rotation.x = 0.5), (f.aR.rotation.x = winding ? -2.2 : -0.6);
        break;
      default:
        // Cleave and swing: hauled back over the shoulder, then across.
        f.aR.rotation.x = winding ? -2.5 * ease(wk / 0.8) : -2.5 + hit * 2.4;
        f.tor.rotation.z = winding ? 0.25 * wk : -0.3 * hit;
        f.mid.rotation.y = winding ? 0.5 * ease(wk) : 0.5 - hit * 1.1;
    }
    if (winding && wk > 0.75) f.mid.position.x += Math.sin(now * 50) * 0.015;
  }
  if (e.act === 'stunned') (f.stars.visible = true), (f.stars.rotation.y = now * 3), (f.mid.rotation.z = Math.sin(now * 4) * 0.2), (f.aR.rotation.x = 0.3);
  if (e.act === 'flinch') f.mid.rotation.x = -0.35;
  if (e.act === 'pinned') (f.mid.rotation.x = -Math.PI / 2), (f.mid.position.y = 0.15), (f.legs[0].rotation.x = Math.sin(now * 14) * 0.5);
  if (e.feeding && e.act === 'idle') (f.mid.rotation.x = 0.6), (f.mid.position.y -= 0.12), (f.aR.rotation.x = -1 + Math.sin(now * 8) * 0.4);
  // Flying through the air (thrown, knocked hard): tumbling end over end.
  if (Math.hypot(e.kvx, e.kvy) > 6 || (e.air ?? 0) > 0) (f.mid.rotation.x = now * 18), (f.root.position.y = 0.3);
  const frozen = e.frozenUntil > t;
  flash(f, frozen || t - e.hitAt < 0.09, frozen ? ICE : FLASH);
  return true;
}

/** Lying where it fell, then sinking into the floor as the body fades. */
function dead(f: FoeFig, e: Enemy): boolean {
  if (e.death === 'burst' || e.death === 'shatter') return false;
  const left = e.actDur - e.actT;
  if (left <= 0) return false;
  f.mid.rotation.z = Math.PI / 2;
  f.mid.position.y = 0.12;
  f.head.visible = e.death !== 'behead';
  if (e.corpse) f.mid.rotation.x = 0.3;
  if (left < 0.8) f.root.position.y = -0.5 * (1 - left / 0.8);
  flash(f, e.death === 'burn', CHAR);
  return true;
}
