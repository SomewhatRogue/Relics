/**
 * What the goblins left that moves, in 3D (grimdraw.ts is the flat one; the rest is painted into the
 * floor): one hung by the ankles from a rafter hook like meat, opened, turning slowly and dripping;
 * and the cook-pot on their fire, simmering, an arm or a leg over the rim, steam going up. Grown men
 * and women only (the story bible's den limit: never a child). Built per room, swayed each frame.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { BONE, GUT, SKIN } from '../grimpaint';
import type { L3 } from './lights3d';
import { G, M, hex } from './mats';
import { part, pivot } from './rig';
import type { Spot } from './rounds3d';

const CLOTH = ['#5a4a3a', '#4a5a6a', '#6a5a48', '#5a3a3a'];
const rope = M(0x8a7a5a), iron = M(0x2a2630), rim = M(0x57525e), dark = M(0x3a0808), red = M(0x8a1414), drop = M(0x5a1616);

interface Hung { root: THREE.Group; body: THREE.Group; drip: THREE.Mesh; k: number }
interface Pot { root: THREE.Group; steam: THREE.Mesh[]; k: number; x: number; z: number }

export class Grim3D {
  readonly group = new THREE.Group();
  private hung: Hung[] = [];
  private pots: Pot[] = [];

  build(map: GameMap): void {
    this.clear();
    for (const q of map.grim ?? []) {
      if (q.kind === 'hung') this.hung.push(hung(q.x, q.y, q.k));
      if (q.kind === 'pot') this.pots.push(pot(q.x, q.y, q.k));
    }
    for (const h of this.hung) this.group.add(h.root);
    for (const p of this.pots) this.group.add(p.root);
  }

  /** Sway and drip; the pot's fire and its light. */
  update(now: number, fires: Spot[], lights: L3[]): void {
    for (const h of this.hung) {
      h.body.rotation.y = now * 0.25 + h.k;
      h.body.rotation.z = Math.sin(now * 0.7 + h.k) * 0.05;
      const p = (now * 0.9 + h.k * 0.37) % 1;
      h.drip.visible = p < 0.8;
      h.drip.position.y = 0.3 - p * 0.3;
    }
    for (const p of this.pots) {
      p.steam.forEach((s, i) => {
        const k = (now * 0.5 + i / 3 + p.k * 0.1) % 1;
        s.position.set(-0.12 + i * 0.12 + Math.sin(k * 6 + i) * 0.06, 0.62 + k * 0.9, 0);
        s.visible = k < 0.75;
      });
      fires.push([p.x - 0.22, 0.12, p.z + 0.12, 0.7], [p.x + 0.2, 0.12, p.z + 0.1, 0.6]);
      lights.push({ x: p.x, y: 0.7, z: p.z + 0.3, r: 3.5, i: 0.7, c: [1, 0.55, 0.25], f: 11 });
    }
  }

  clear(): void {
    for (const o of [...this.hung, ...this.pots]) this.group.remove(o.root);
    this.hung = [];
    this.pots = [];
  }
}

/** Hung by the ankles from a hook up in the rafters, head down, split from the groin to the chest, emptied. */
function hung(x: number, z: number, k: number): Hung {
  const root = new THREE.Group(), cloth = M(hex(CLOTH[k % 4])), skin = M(hex(SKIN[0])), bone = M(hex(BONE[0]));
  root.position.set(x, 0, z);
  part(root, 0.03, 0.6, 0.03, rope, 0, 2.55, 0);
  part(root, 0.2, 0.04, 0.04, rim, 0, 2.25, 0);
  const body = pivot(root, 0, 2.2, 0);
  part(body, 0.16, 0.08, 0.14, rope, 0, -0.04, 0);
  for (const s of [-1, 1]) part(body, 0.13, 0.55, 0.14, cloth, s * 0.08, -0.32, 0);
  part(body, 0.38, 0.62, 0.22, cloth, 0, -0.9, 0);
  // Opened: the dark inside, red at the edges, ribs showing.
  for (const f of [1, -1]) {
    part(body, 0.22, 0.54, 0.04, dark, 0, -0.88, f * 0.11);
    for (const s of [-1, 1]) part(body, 0.05, 0.54, 0.04, red, s * 0.12, -0.88, f * 0.115);
    for (let i = 0; i < 3; i++) part(body, 0.3, 0.035, 0.03, bone, 0, -0.98 + i * 0.1, f * 0.125);
  }
  if (k % 3 === 0) part(body, 0.08, 0.2, 0.06, M(hex(GUT[0])), 0.03, -1.12, 0.13);
  // Arms hanging past the head, the hands open; the head with its hair.
  for (const s of [-1, 1]) part(body, 0.11, 0.6, 0.12, cloth, s * 0.25, -1.38, 0), part(body, 0.1, 0.1, 0.1, skin, s * 0.25, -1.72, 0);
  part(body, 0.28, 0.28, 0.28, skin, 0, -1.37, 0);
  part(body, 0.3, 0.1, 0.3, M(k % 2 ? 0x2a1a10 : 0x5a4a2a), 0, -1.53, 0);
  const drip = part(root, 0.04, 0.04, 0.04, drop, 0, 0.3, 0.02);
  return { root, body, drip, k };
}

/** Iron, black with soot, on the coals; broth, and a hand or a foot in it; steam. */
function pot(x: number, z: number, k: number): Pot {
  const root = new THREE.Group(), skin = M(hex(SKIN[1]));
  root.position.set(x, 0, z);
  for (let i = 0; i < 5; i++) part(root, 0.18 + i * 0.05, 0.03, 0.18 + i * 0.05, M(i % 2 ? 0x3a3238 : 0x2a2428), 0, 0.02, 0, 0, i * 0.7);
  for (const [w, y] of [[0.42, 0.18], [0.56, 0.3], [0.6, 0.44], [0.56, 0.54]] as const) part(root, w, 0.13, w, iron, 0, y, 0);
  part(root, 0.6, 0.04, 0.6, rim, 0, 0.62, 0);
  part(root, 0.5, 0.02, 0.5, M(0x4a2a1a), 0, 0.61, 0);
  part(root, 0.08, 0.04, 0.08, G(0x7a4a2a, 0.6), 0.1, 0.63, 0.05);
  if (k % 2) {
    // An arm over the rim, the fingers curled.
    part(root, 0.08, 0.36, 0.08, M(hex(SKIN[0])), 0.18, 0.74, 0.1, 0.3, 0, -0.5);
    part(root, 0.1, 0.07, 0.1, skin, 0.3, 0.92, 0.12);
  } else {
    // A leg bone, the foot still on it.
    part(root, 0.06, 0.4, 0.06, M(hex(BONE[0])), -0.16, 0.76, 0, 0, 0, 0.6);
    part(root, 0.16, 0.08, 0.1, skin, -0.32, 0.95, 0);
  }
  const steam = [0, 1, 2].map(() => part(root, 0.08, 0.05, 0.05, G(0x8a8494, 0.7), 0, 0.7, 0));
  return { root, steam, k, x, z };
}
