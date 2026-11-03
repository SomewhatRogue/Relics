/**
 * Building a figure from boxes on pivots (shoulders, hips, neck), so a pose is a few rotations. A
 * figure faces +z at no turn. Shared by heroes, goblins, the freed and the hound.
 */
import * as THREE from 'three';
import { FLASH, G, M } from './mats';

export const BOX = new THREE.BoxGeometry(1, 1, 1);
const DISC = new THREE.CylinderGeometry(0.5, 0.5, 0.02, 10);

/** The root's middle at height y, and the body hung from it with its feet on the floor. */
export function middle(root: THREE.Object3D, y: number): [THREE.Group, THREE.Group] {
  const mid = pivot(root, 0, y, 0);
  mid.userData.y = y;
  return [mid, pivot(mid, 0, -y, 0)];
}

export function pivot(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

/** A box part at (x, y, z) in its parent, sized w, h, d. */
export function part(parent: THREE.Object3D, w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const m = new THREE.Mesh(BOX, mat);
  m.position.set(x, y, z);
  m.scale.set(w, h, d);
  m.rotation.set(rx, ry, rz);
  m.castShadow = !(mat as THREE.MeshBasicMaterial).isMeshBasicMaterial;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** The dark pool under a figure (always there, even with no shadow map). */
export function blob(parent: THREE.Object3D, r: number): THREE.Mesh {
  const m = new THREE.Mesh(DISC, M(0x07070a));
  m.scale.set(r * 2, 1, r * 2);
  m.position.y = 0.012;
  m.userData.keep = true;
  parent.add(m);
  return m;
}

/** Little stars turning over a stunned head. */
export function stars(parent: THREE.Object3D, y: number, r = 0.3): THREE.Group {
  const g = pivot(parent, 0, y, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    part(g, 0.09, 0.09, 0.09, G(i % 2 ? 0xffe070 : 0xfff6c0), Math.cos(a) * r, (i % 2) * 0.07, Math.sin(a) * r).userData.keep = true;
  }
  g.visible = false;
  return g;
}

export interface Figure {
  root: THREE.Group;
  /** The middle of the body: leans, tumbles and lies down turn about it. */
  mid: THREE.Group;
  body: THREE.Group;
  legs: THREE.Group[];
  aR: THREE.Group;
  aL: THREE.Group;
  head: THREE.Group;
  stars: THREE.Group;
  /** Every part's own material, so a hit can flash it white and back. */
  parts: [THREE.Mesh, THREE.Material][];
  flashed: boolean;
}

/** Note each part's material (call once the figure is built). */
export function collect(f: Omit<Figure, 'parts' | 'flashed'>): Figure {
  const parts: [THREE.Mesh, THREE.Material][] = [];
  f.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !m.userData.keep) parts.push([m, m.material as THREE.Material]);
  });
  return { ...f, parts, flashed: false };
}

/** White for a hit (or back), or any other material over every part (burned black). */
export function flash(f: Figure, on: boolean, mat: THREE.Material = FLASH): void {
  if (on === f.flashed && !on) return;
  for (const [m, own] of f.parts) m.material = on ? mat : own;
  f.flashed = on;
}

/** A walk: legs and the free arm swing, the body bobs. */
export function walk(f: Figure, phase: number, amt: number): void {
  const s = Math.sin(phase) * amt;
  f.legs[0].rotation.x = s * 0.7;
  f.legs[1].rotation.x = -s * 0.7;
  f.mid.position.y = f.mid.userData.y + Math.abs(Math.cos(phase)) * 0.04 * amt;
}

/** Back to standing. */
export function rest(f: Figure): void {
  f.root.position.y = 0;
  f.mid.position.set(0, f.mid.userData.y, 0);
  f.mid.rotation.set(0, 0, 0);
  f.mid.scale.set(1, 1, 1);
  f.body.rotation.set(0, 0, 0);
  for (const g of [...f.legs, f.aR, f.aL, f.head]) g.rotation.set(0, 0, 0);
  f.stars.visible = false;
}
