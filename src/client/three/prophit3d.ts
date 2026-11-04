/**
 * A prop in the 2.5D view taking a blow it holds: the model shudders on its spot and flashes white, as
 * the flat view's sprite does (../propshake.ts, the same numbers). The sparks, splinters and sound come
 * from the room's `prophit` event (../fxcages.ts), drawn on the overlay. Drawing only.
 */
import type * as THREE from 'three';
import type { Prop } from '../../sim/types';
import { propFlash, propShake } from '../propshake';
import { M, VCOL } from './mats';

/** After the prop is placed: knock it off its spot and light it up while the hit lasts. */
export function shakeProp(o: THREE.Object3D, p: Prop, t: number): void {
  const [jx, jy] = propShake(p, t), m = o as THREE.Mesh;
  o.position.x += jx;
  o.position.z += jy;
  // A little rock about its foot too, so a cage's bars visibly jar.
  o.rotation.z += jx * 0.9;
  // Lit pale, not the figures' unlit white: a cage's bars stay bars, not a white block.
  m.material = propFlash(p, t) ? M(0xfff0d8) : VCOL;
}
