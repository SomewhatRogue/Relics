/**
 * The freed (a villager in plain clothes, following you home, lying where they fell if they die) and
 * a Ranger's hound (at heel, running, biting, lying down), as small figures with simple poses.
 */
import * as THREE from 'three';
import type { Hound, Survivor } from '../../sim/types';
import { M } from './mats';
import { lurchOf } from '../falsedraw';
import { blob, collect, flash, middle, part, pivot, rest, stars, walk, type Figure } from './rig';

const CLOTH = [0x6a5a48, 0x5a6a7a, 0x7a5a4a, 0x4a5a3a], HAIR = [0x3a2a1e, 0x6a4a2a, 0x2a2420, 0x8a7a6a];

export function makeFolk(id: number): Figure {
  const root = new THREE.Group(), [mid, body] = middle(root, 0.5), cloth = M(CLOTH[id % 4]), skin = M(0xb88a6a);
  blob(root, 0.3);
  const legs = [pivot(body, 0.1, 0.52, 0), pivot(body, -0.1, 0.52, 0)];
  for (const L of legs) part(L, 0.15, 0.48, 0.17, M(0x2e2a2a), 0, -0.24, 0);
  part(body, 0.44, 0.52, 0.3, cloth, 0, 0.8, 0);
  const head = pivot(body, 0, 1.2, 0);
  part(head, 0.32, 0.32, 0.32, skin, 0, 0, 0);
  part(head, 0.36, 0.12, 0.36, M(HAIR[(id >> 2) % 4]), 0, 0.16, -0.02);
  const aR = pivot(body, -0.28, 1.0, 0), aL = pivot(body, 0.28, 1.0, 0);
  for (const A of [aR, aL]) part(A, 0.12, 0.4, 0.14, cloth, 0, -0.19, 0), part(A, 0.1, 0.1, 0.1, skin, 0, -0.42, 0);
  const st = stars(root, 1.6);
  root.scale.setScalar(0.78);
  return collect({ root, mid, body, legs, aR, aL, head, stars: st });
}

export function poseFolk(f: Figure, s: Survivor, t: number, walked: number): void {
  rest(f);
  f.root.rotation.y = s.fx >= 0 ? Math.PI / 2 : -Math.PI / 2;
  if (s.dead) return void ((f.mid.rotation.z = Math.PI / 2), (f.mid.position.y = 0.12));
  // A false prisoner (../falsedraw.ts): it jerks and swells, arms hanging, till it tears open.
  if (s.tearAt !== undefined) {
    const k = lurchOf(s, t), b = Math.floor(t * (6 + k * 16)), j = b % 3 === 0 ? (b % 2 ? 1 : -1) * (0.2 + k * 0.3) : 0;
    (f.mid.rotation.z = j), (f.mid.rotation.x = k > 0.6 ? Math.sin(t * 55) * 0.15 * k : 0), (f.head.rotation.z = -j * 1.5);
    f.body.scale.set(1 + k * 0.2, 1 + k * 0.1, 1 + k * 0.2);
    return flash(f, false);
  }
  f.body.scale.set(1, 1, 1);
  if (s.moving) walk(f, walked * 4.5, 1);
  // Just out of the cage: hands up a moment in thanks.
  if (t - s.at < 1.2) f.aR.rotation.x = f.aL.rotation.x = -2.6;
  flash(f, t - s.hitAt < 0.09);
}

export function makeHound(): Figure {
  const root = new THREE.Group(), [mid, body] = middle(root, 0.3), fur = M(0x6a4a2a), dark = M(0x3a2a1a);
  blob(root, 0.3);
  part(body, 0.26, 0.24, 0.62, fur, 0, 0.42, 0);
  const head = pivot(body, 0, 0.58, 0.34);
  part(head, 0.22, 0.2, 0.24, fur, 0, 0, 0.04);
  part(head, 0.12, 0.1, 0.14, dark, 0, -0.04, 0.2);
  for (const s of [-1, 1]) part(head, 0.06, 0.12, 0.05, dark, s * 0.08, 0.13, -0.02);
  const legs = [pivot(body, 0.09, 0.32, 0.22), pivot(body, -0.09, 0.32, -0.22)], back = [pivot(body, -0.09, 0.32, 0.22), pivot(body, 0.09, 0.32, -0.22)];
  for (const L of [...legs, ...back]) part(L, 0.07, 0.32, 0.07, dark, 0, -0.16, 0);
  const tail = pivot(body, 0, 0.5, -0.3);
  part(tail, 0.05, 0.05, 0.28, fur, 0, 0.06, -0.12, -0.6);
  const st = stars(root, 0.9);
  const f = collect({ root, mid, body, legs, aR: back[0], aL: back[1], head, stars: st });
  return f;
}

export function poseHound(f: Figure, d: Hound, walked: number): void {
  rest(f);
  f.root.rotation.y = Math.atan2(d.fx, d.fy);
  if (d.down || d.state === 'fled') return void ((f.mid.position.y = 0.12), (f.mid.scale.y = 0.6));
  if (d.moving) walk(f, walked * 6, 1.2), (f.aR.rotation.x = -f.legs[0].rotation.x), (f.aL.rotation.x = -f.legs[1].rotation.x);
  if (d.state === 'bite') (f.head.rotation.x = Math.sin(performance.now() / 40) * 0.3), (f.mid.rotation.x = 0.2);
}
