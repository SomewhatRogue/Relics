/** The way out's lit threshold in the 2.5D view: a warm mat on the floor, a gold rim and an arrow out (where: ../exitmark.ts). */
import * as THREE from 'three';
import type { ExitMat } from '../exitmark';
import { G, M } from './mats';
import { part } from './rig';

/** Built at the mat's top-left corner (x, y); z runs down the screen, as y does in the map. */
export function makeExitMat(t: ExitMat): THREE.Group {
  const root = new THREE.Group(), rim = G(0xffd27a, 0.35), hot = G(0xfff1b0, 0.6), { w, d } = t;
  part(root, w, 0.02, d, M(0x5a4220), w / 2, 0.01, d / 2);
  for (const z of [0.04, d - 0.04]) part(root, w, 0.03, 0.08, rim, w / 2, 0.025, z);
  for (const x of [0.04, w - 0.04]) part(root, 0.08, 0.03, d, rim, x, 0.025, d / 2);
  // The arrow: a shaft and a head, pointing out of the room.
  const cx = w / 2, cz = d / 2, o = t.out;
  part(root, 0.14, 0.035, 0.5, hot, cx, 0.03, cz - o * 0.1);
  for (const s of [-1, 1]) part(root, 0.38, 0.035, 0.12, hot, cx + s * 0.12, 0.03, cz + o * 0.25, 0, s * o * 0.8);
  return root;
}
