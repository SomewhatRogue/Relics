/**
 * The training yard's straw-man rack in 2.5D (the flat view's: client/rackdraw.ts): two poles and a bar
 * across in the top left corner, a rope down from the bar to each hung straw man, and the post with
 * Pell's board. The straw men and the watch themselves stand on cards, drawn by the flat code (cards3d.ts).
 * `showRack(n)`: how many wait on it (a hung one's rope goes with it).
 */
import * as THREE from 'three';
import { RACK } from '../../shared/practice';
import { rackMen } from '../rackdraw';
import { M } from './mats';
import { part } from './rig';

/** How far a hung straw man is lifted off the ground (world units). */
export const HUNG3 = 0.3;
const BAR = 1.9;
const pole = M(0x5d4a36), dark = M(0x3a2d20), rope = M(0xa08a5a), board = M(0x8a6f4a), paper = M(0xd8c8a0);

export interface RackFig { root: THREE.Group; ropes: THREE.Object3D[] }

export function makeRack(): RackFig {
  const root = new THREE.Group(), front = RACK.y + RACK.h - 0.05;
  // Two poles and the bar, at the rack's front where the straw men hang.
  part(root, 0.12, BAR, 0.12, dark, RACK.x, BAR / 2, front), part(root, 0.12, BAR, 0.12, dark, RACK.x + RACK.w, BAR / 2, front);
  part(root, RACK.w + 0.2, 0.1, 0.1, pole, RACK.x + RACK.w / 2, BAR, front);
  // A spare pole leant against the wall behind.
  part(root, 0.08, 1.8, 0.08, pole, RACK.x + RACK.w * 0.7, 0.9, RACK.y + 0.2, 0.25, 0, 0.1);
  const ropes = rackMen(RACK.holds).map((m) => (m.hung ? part(root, 0.03, BAR - 1.1 - HUNG3, 0.03, rope, m.x, (BAR + 1.1 + HUNG3) / 2, front) : new THREE.Object3D()));
  // The board on its post.
  const b = new THREE.Group();
  b.position.set(RACK.post.x, 0, RACK.post.y);
  part(b, 0.1, 1.3, 0.1, dark, 0, 0.65, 0);
  part(b, 0.8, 0.5, 0.06, board, 0, 1.3, 0.06);
  for (let k = 0; k < 3; k++) part(b, 0.55 - k * 0.12, 0.05, 0.02, paper, -0.05, 1.42 - k * 0.12, 0.1);
  root.add(b);
  return { root, ropes };
}

/** `n` waiting: the ropes of those set going come down with them. */
export function showRack(r: RackFig, n: number): void {
  r.ropes.forEach((o, i) => (o.visible = i < n));
}
