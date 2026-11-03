/**
 * Things on the floor you can break, open or pick up: barrels (the oil one marked red), crates, the
 * table and its pieces, cages with someone in them, the larder's racks of meat; chests (the lid comes
 * up, light leaks out in the colour of the best thing inside, chains on a chained one); dropped
 * weapons glinting in their tier's colour, gold, potions, a butcher's coal.
 */
import * as THREE from 'three';
import type { PropKind } from '../../shared/props';
import { POTIONS } from '../../shared/potions';
import { TIERS } from '../../shared/gear';
import type { Chest } from '../../sim/chests';
import { Boxes, Seed, jit } from './boxes';
import { G, M, VCOL, hex } from './mats';
import { part, pivot } from './rig';

const geos = new Map<string, THREE.BufferGeometry>();

function propGeo(kind: PropKind): THREE.BufferGeometry {
  let g = geos.get(kind);
  if (g) return g;
  const B = new Boxes(), r = new Seed(kind.length * 97);
  const staves = (col: number, band: number) => {
    for (let i = 0; i < 2; i++) B.c(0, 0.36, 0, 0.5, 0.72, 0.5, jit(col, 0.06, r), (i * Math.PI) / 4);
    for (const y of [0.14, 0.58]) for (let i = 0; i < 2; i++) B.c(0, y, 0, 0.53, 0.06, 0.53, band, (i * Math.PI) / 4);
    B.b(0, 0.72, 0, 0.42, 0.02, 0.42, 0x3a2a1a);
  };
  if (kind === 'barrel') staves(0x6b4a2b, 0x3a3640);
  else if (kind === 'oil') staves(0x3a2e24, 0x8a2a1a), B.c(0, 0.36, 0.27, 0.18, 0.18, 0.02, 0xc0392b);
  else if (kind === 'crate') {
    B.b(0, 0, 0, 0.62, 0.62, 0.62, 0x7a5a34);
    for (const s of [-1, 1]) B.c(0, 0.31, s * 0.32, 0.64, 0.08, 0.02, 0x4a3420), B.c(s * 0.32, 0.31, 0, 0.02, 0.08, 0.64, 0x4a3420);
    B.c(0, 0.31, 0.32, 0.08, 0.64, 0.02, 0x4a3420, 0, 0, 0.78);
  } else if (kind === 'table') {
    B.b(0, 0.48, 0, 1.1, 0.07, 0.62, 0x7a5a34);
    for (const [x, z] of [[-0.48, -0.24], [0.48, -0.24], [-0.48, 0.24], [0.48, 0.24]]) B.b(x, 0, z, 0.07, 0.48, 0.07, 0x5a3d22);
  } else if (kind === 'plank' || kind === 'stave') B.b(0, 0, 0, kind === 'plank' ? 0.9 : 0.55, 0.06, 0.14, 0x7a5a34);
  else if (kind === 'cage') {
    B.b(0, 0, 0, 1.0, 0.08, 1.0, 0x3a2a1a);
    B.b(0, 1.25, 0, 1.0, 0.08, 1.0, 0x3a2a1a);
    for (let i = 0; i <= 6; i++) {
      const a = -0.48 + i * 0.16;
      for (const s of [-1, 1]) B.b(a, 0.05, s * 0.48, 0.04, 1.2, 0.04, 0x6a6470), B.b(s * 0.48, 0.05, a, 0.04, 1.2, 0.04, 0x6a6470);
    }
    // Someone inside, hunched on the floor of it.
    B.b(0, 0.08, 0, 0.36, 0.42, 0.26, 0x6a5a48);
    B.b(0, 0.5, 0.02, 0.24, 0.24, 0.24, 0xb88a6a);
    B.b(0, 0.64, -0.02, 0.26, 0.08, 0.26, 0x3a2a1e);
  } else {
    // The larder: a rack, joints of meat hung from it.
    for (const s of [-1, 1]) B.b(s * 0.55, 0, 0, 0.1, 1.5, 0.1, 0x4a3420);
    B.b(0, 1.45, 0, 1.25, 0.08, 0.08, 0x4a3420);
    for (let i = 0; i < 4; i++) B.b(-0.38 + i * 0.25, 0.75 + r.next() * 0.2, 0, 0.16, 0.42 + r.next() * 0.2, 0.14, jit(0x7a2420, 0.15, r));
  }
  geos.set(kind, (g = B.geometry()));
  return g;
}

export function makeProp(kind: PropKind): THREE.Mesh {
  const m = new THREE.Mesh(propGeo(kind), VCOL);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export interface ChestFig { root: THREE.Group; lid: THREE.Group; glow: THREE.Mesh; chains: THREE.Group }

export function makeChest(): ChestFig {
  const root = new THREE.Group(), wood = M(0x6b4a2b), band = M(0x4a4652);
  part(root, 0.74, 0.36, 0.46, wood, 0, 0.18, 0);
  for (const x of [-0.26, 0.26]) part(root, 0.06, 0.38, 0.48, band, x, 0.19, 0);
  const glow = part(root, 0.6, 0.04, 0.36, G(0xffffff, 0.2), 0, 0.35, 0);
  const lid = pivot(root, 0, 0.36, -0.23);
  part(lid, 0.74, 0.16, 0.46, wood, 0, 0.08, 0.23);
  part(lid, 0.12, 0.1, 0.06, M(0xd4a537), 0, 0.02, 0.47);
  const chains = pivot(root, 0, 0, 0);
  for (const s of [-1, 1]) part(chains, 0.06, 0.06, 0.9, M(0x8a8494), 0, 0.3, 0, 0, s * 0.6);
  return { root, lid, glow, chains };
}

export function poseChest(f: ChestFig, c: Chest): void {
  const k = c.state === 'shut' ? 0 : c.state === 'opening' ? Math.min(1, c.t / 1.2) : 1;
  f.lid.rotation.x = -k * 1.9;
  f.glow.visible = k > 0;
  if (k > 0) f.glow.material = G(hex(TIERS[c.tier].col), 0.1);
  f.chains.visible = c.chained && c.state === 'shut';
}

/** A weapon on the floor: a blade in its tier's colour, turning slowly. */
export function makeDrop(col: string): THREE.Group {
  const root = new THREE.Group(), g = pivot(root, 0, 0.25, 0);
  part(g, 0.06, 0.5, 0.03, M(0xe4eaf2), 0, 0.1, 0);
  part(g, 0.2, 0.05, 0.06, G(hex(col), 0.3), 0, -0.16, 0);
  part(g, 0.05, 0.14, 0.05, M(0x5a3d22), 0, -0.25, 0);
  g.rotation.z = 0.5;
  return root;
}

export function makePickup(gold: boolean, potion?: string, relic?: string): THREE.Group {
  const root = new THREE.Group();
  // A relic: a little gold standing stone, glowing in its element's colour.
  if (relic) return part(root, 0.16, 0.3, 0.16, G(hex(relic), 0.6), 0, 0.2, 0, 0.6), part(root, 0.5, 0.02, 0.5, G(hex(relic), 0.15), 0, 0.02, 0), root;
  if (gold) for (let i = 0; i < 3; i++) part(root, 0.12, 0.05, 0.12, G(0xffd27a, 0.3), (i - 1) * 0.1, 0.03 + (i % 2) * 0.05, (i % 2) * 0.08);
  else part(root, 0.14, 0.2, 0.14, G(hex(potion ? POTIONS[potion as keyof typeof POTIONS].col : '#c0392b'), 0.35), 0, 0.12, 0), part(root, 0.06, 0.08, 0.06, M(0x6a4a2a), 0, 0.26, 0);
  return root;
}

export function makeCoal(): THREE.Group {
  const root = new THREE.Group();
  part(root, 0.18, 0.12, 0.16, G(0xff7a28, 0.1), 0, 0.06, 0);
  part(root, 0.1, 0.08, 0.1, G(0xffe890), 0.02, 0.1, 0);
  return root;
}
