/**
 * The doors rule in 2.5D (the flat view is ../shutdraw.ts; the rule is shared/doors.ts): a house shut for
 * good has planks nailed over where its door was (boarded) or a black hole with a charred stub of frame
 * (burnt out); a house you can go into has firelight moving in its doorway. Paint only.
 */
import * as THREE from 'three';
import { doorAt, type Block } from '../../shared/arena';
import { type Boxes, type Seed, jit } from './boxes';
import { G } from './mats';

/** Over the front wall where the door would be. */
export function shutDoor(W: Boxes, b: Block, z1: number, dh: number, r: Seed, group: THREE.Group): void {
  const x = doorAt(b).x;
  if (b.shut === 'burnt') {
    const hole = new THREE.Mesh(new THREE.BoxGeometry(0.62, dh, 0.03), G(0x050404, 1));
    hole.position.set(x, dh / 2, z1 + 0.012);
    group.add(hole);
    W.b(x - 0.36, 0, z1 + 0.04, 0.08, dh * 0.7, 0.08, 0x1e1612), W.b(x + 0.36, 0, z1 + 0.04, 0.08, dh * 0.45, 0.08, 0x1e1612);
    return;
  }
  for (let i = 0, y = 0.12; y < dh; y += 0.2, i++) W.c(x, y, z1 + 0.05, 0.9, 0.12, 0.04, jit([0xb09a72, 0x9a845e, 0xc4ae84][i % 3], 0.08, r), 0, 0, (i % 2 ? 0.06 : -0.05));
}

/** Firelight in the doorway: a warm pane set back in the dark of it, flickering by the frame (three/view3d.ts lights it too). */
export function doorGlow(group: THREE.Group, x: number, dh: number, z1: number, dw: number): void {
  const pane = new THREE.Mesh(new THREE.BoxGeometry(dw * 1.6, dh * 0.8, 0.02), G(0xff8a3a, 0.45));
  pane.position.set(x, dh * 0.42, z1 - 0.24);
  pane.name = 'doorglow';
  group.add(pane);
}
