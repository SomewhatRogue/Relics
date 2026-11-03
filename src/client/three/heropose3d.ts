/**
 * A hero's figure put in the pose of what the room says it's doing: walking, a swing (a combo's
 * swings alternate sides; a heavy comes over the top), a charge held back, the guard up, a roll, a
 * dash or a blink, hurt, stunned, down. Rough on purpose: the room's numbers stay the truth.
 */
import { EL_COL, heldEl } from '../palette';
import { WEAPONS } from '../../shared/tuning';
import type { Hero } from '../../sim/types';
import type { HeroFig } from './heroes3d';
import { G, hex } from './mats';
import { flash, rest, walk } from './rig';

const ease = (k: number) => 1 - (1 - Math.min(1, Math.max(0, k))) ** 2;

/** `walked`: how far this hero has walked (tiles), so the stride matches the ground. */
export function poseHero(f: HeroFig, h: Hero, now: number, walked: number): void {
  rest(f);
  f.root.visible = true;
  f.root.rotation.y = Math.atan2(h.fx, h.fy);
  const k = h.actDur > 0 ? Math.min(1, h.actT / h.actDur) : 0, w = WEAPONS[h.weapon], cls = f.cls, side = h.combo % 2 ? -1 : 1;
  const bow = cls === 'RANGER', caster = cls === 'MAGE';
  // At rest: arms a little forward, a breath.
  f.aR.rotation.x = -0.25;
  f.aL.rotation.x = bow ? -0.5 : -0.2;
  f.mid.position.y += Math.sin(now * 2.2) * 0.008;
  if (h.moving && (h.act === 'idle' || h.act === 'carry')) {
    walk(f, walked * 4.2, 1);
    f.aL.rotation.x += -Math.sin(walked * 4.2) * 0.4;
    f.aR.rotation.x += Math.sin(walked * 4.2) * 0.3;
  }
  if (h.blocking && h.act === 'idle') (f.aL.rotation.x = -1.35), (f.aL.rotation.y = -0.5), (f.aR.rotation.x = -0.6);
  switch (h.act) {
    case 'charge': {
      const shake = Math.sin(now * 40) * 0.03 * Math.min(1, h.actT);
      if (bow) (f.aL.rotation.x = -1.55), (f.aR.rotation.x = -1.4), (f.aR.rotation.z = 0.5 + shake);
      else if (caster) (f.aR.rotation.x = -1.9 + shake), (f.aL.rotation.x = -1.4);
      else (f.aR.rotation.x = -2.7 + shake), (f.mid.rotation.x = -0.15), (f.body.rotation.y = 0.5);
      break;
    }
    case 'attack': {
      const e = ease(k * 1.6);
      if (bow) (f.aL.rotation.x = -1.55), (f.aR.rotation.x = -1.4 + e * 0.8);
      else if (caster) (f.aR.rotation.x = -1.6), (f.mid.rotation.x = 0.12 * (1 - e));
      else if (h.heavy || cls === 'HEALER') (f.aR.rotation.x = -3.0 + e * 2.4), (f.mid.rotation.x = 0.25 * e);
      else if (h.weapon === 'spear') (f.aR.rotation.x = -1.5), (f.mid.position.z = -0.2 + e * 0.5), (f.mid.rotation.x = 0.2);
      else {
        f.aR.rotation.x = -1.45;
        f.body.rotation.y = side * (1.1 - e * 2.2);
        f.mid.rotation.x = 0.12;
        if (cls === 'ROGUE') (f.aL.rotation.x = -1.3), (f.aL.rotation.y = -side * 0.8 * e);
      }
      break;
    }
    case 'throw':
      f.aR.rotation.x = -2.8 + ease(k * 1.4) * 2.2;
      break;
    case 'zip':
    case 'bash':
      (f.mid.rotation.x = 0.4), (f.aL.rotation.x = -1.4), (f.aR.rotation.x = -0.8);
      break;
    case 'roll': {
      const kind = w.dodge.kind;
      if (kind === 'blink') (f.mid.scale.y = 1 - Math.sin(k * Math.PI) * 0.8), (f.root.visible = Math.floor(now * 30) % 2 === 0 || k > 0.8);
      else if (kind === 'dash') (f.mid.rotation.x = 0.7), (f.legs[0].rotation.x = 0.9), (f.legs[1].rotation.x = -0.6), (f.aR.rotation.x = 0.8), (f.aL.rotation.x = 0.8);
      else if (kind === 'backstep') (f.mid.rotation.x = -0.35), (f.mid.position.y += Math.sin(k * Math.PI) * 0.3);
      else (f.mid.rotation.x = k * Math.PI * 2), (f.mid.position.y -= Math.sin(k * Math.PI) * 0.2), (f.legs[0].rotation.x = f.legs[1].rotation.x = -1.2);
      break;
    }
    case 'hurt':
      (f.mid.rotation.x = -0.3), (f.aR.rotation.x = 0.3), (f.aL.rotation.x = 0.3);
      break;
    case 'stun':
      (f.stars.visible = true), (f.stars.rotation.y = now * 3), (f.mid.rotation.z = Math.sin(now * 4) * 0.18), (f.aR.rotation.x = f.aL.rotation.x = 0.2);
      break;
    case 'down':
      (f.mid.rotation.x = -Math.PI / 2), (f.mid.position.y = 0.2), (f.aR.rotation.x = f.aL.rotation.x = -0.3);
      break;
    case 'carry':
      f.aR.rotation.x = f.aL.rotation.x = -2.9;
      break;
    case 'slam':
      f.aR.rotation.x = f.aL.rotation.x = -2.9 + ease(k * 1.3) * 2.2;
      break;
  }
  // A Mage's tip burns in the element its spells are in; brighter primed.
  if (f.tip && caster) f.tip.material = G(hex(EL_COL[heldEl(h)]), h.primed ? 0 : 0.2);
  flash(f, h.act === 'hurt' && h.actT < 0.08);
}
