/**
 * What flies and what lies on the floor a while: arrows and bolts, thrown knives, a Mage's sparks,
 * orbs and lances (glowing in their element), a smite coming down, the hunter's net, the lodestone,
 * a lobbed flask; the relic javelin; blessed ground, snares, smoke and the brood mother's poison; and
 * the way out (stakes while it's shut, gold chevrons once it's open).
 */
import * as THREE from 'three';
import { EL_COL } from '../palette';
import { POTIONS } from '../../shared/potions';
import type { Bolt, Javelin } from '../../sim/types';
import { G, M, hex } from './mats';
import { part, pivot } from './rig';

const steel = M(0xd8dce4), shaft = M(0x6b4a2b);

/** A bolt's look, as a key (rebuilt when it changes: an orb landing as a well). */
export const boltLook = (b: Bolt) => b.kind + ':' + b.el + ':' + (b.kind === 'lodestone' ? b.state : '') + (b.potion ?? '');

export function makeBolt(b: Bolt): THREE.Group {
  const root = new THREE.Group(), g = pivot(root, 0, 0, 0), el = G(hex(EL_COL[b.el]), 0);
  g.name = 'dir';
  switch (b.kind) {
    case 'arrow':
    case 'bolt':
      part(g, 0.035, 0.035, b.kind === 'bolt' ? 0.4 : 0.6, shaft, 0, 0, 0);
      part(g, 0.06, 0.06, 0.08, steel, 0, 0, b.kind === 'bolt' ? 0.22 : 0.32);
      part(g, 0.1, 0.02, 0.1, M(0xd8d0bc), 0, 0, -0.26);
      break;
    case 'knife':
      part(g, 0.04, 0.02, 0.3, steel, 0, 0, 0);
      break;
    case 'spark':
      part(g, 0.14, 0.14, 0.14, el, 0, 0, 0);
      break;
    case 'orb':
      part(g, 0.32, 0.32, 0.32, el, 0, 0, 0), part(g, 0.18, 0.18, 0.18, G(0xffffff), 0, 0, 0);
      break;
    case 'lance':
      part(g, 0.08, 0.08, 1.1, el, 0, 0, 0);
      break;
    case 'smite':
      part(g, 0.22, 3.0, 0.22, G(0xfff1b0, 0), 0, 1.5, 0), part(g, 0.5, 0.04, 0.5, G(0xffd27a, 0.2), 0, -0.48, 0);
      break;
    case 'net':
      for (let i = -2; i <= 2; i++) part(g, 0.02, 0.02, 0.9, M(0xa08a6a), i * 0.2, 0, 0), part(g, 0.9, 0.02, 0.02, M(0xa08a6a), 0, 0, i * 0.2);
      break;
    case 'lodestone':
      part(g, 0.22, 0.2, 0.22, M(0x4a3a6a), 0, 0, 0);
      if (b.state === 'well') part(g, 1.4, 0.02, 1.4, G(hex(b.el ? EL_COL[b.el] : '#ffd27a'), 0.6), 0, -0.4, 0);
      break;
    case 'bomb':
      part(g, 0.26, 0.24, 0.26, M(0x5a6a30), 0, 0, 0), part(g, 0.04, 0.12, 0.04, M(0xa89878), 0.06, 0.16, 0), part(g, 0.06, 0.06, 0.06, G(0xff9a3c), 0.08, 0.24, 0);
      break;
    default:
      part(g, 0.14, 0.2, 0.14, G(hex(POTIONS[b.potion ?? 'oil'].col), 0.3), 0, 0, 0);
  }
  return root;
}

/** Where a bolt is and which way it points, this frame. */
export function placeBolt(o: THREE.Object3D, b: Bolt, lift: number): void {
  const g = o.getObjectByName('dir')!;
  let y = 0.6;
  if (b.kind === 'flask') {
    const k = Math.min(1, b.t / Math.max(0.01, b.flight));
    y = 0.5 + 4 * k * (1 - k) * 1.6;
  } else if (b.kind === 'bomb' || (b.kind === 'lodestone' && b.state !== 'well')) {
    const k = Math.min(1, b.t / Math.max(0.01, b.flight));
    y = 0.35 + 4 * k * (1 - k) * 1.5;
  } else if (b.kind === 'smite') y = 0.5 + Math.max(0, 1 - b.t / Math.max(0.01, b.flight)) * 3;
  else if (b.kind === 'net') y = 0.3;
  else if (b.state === 'well') y = 0.4;
  if (b.state === 'stuck') y = 0.25;
  o.position.set(b.x, lift + y, b.y);
  g.rotation.set(b.state === 'stuck' ? 0.5 : 0, Math.atan2(b.dx, b.dy), 0, 'YXZ');
  if (b.kind === 'spark' || b.kind === 'orb') g.rotation.x = performance.now() / 120;
}

export function makeJavelin(): THREE.Group {
  const root = new THREE.Group(), g = pivot(root, 0, 0, 0);
  g.name = 'dir';
  part(g, 0.05, 0.05, 1.5, M(0x8a6a4a), 0, 0, 0);
  part(g, 0.08, 0.08, 0.24, G(0x9fd0ff, 0.2), 0, 0, 0.8);
  return root;
}

export function placeJavelin(o: THREE.Object3D, j: Javelin, lift: number): void {
  const g = o.getObjectByName('dir')!, stuck = j.state !== 'fly';
  o.position.set(j.x, lift + (j.state === 'floor' ? 0.4 : 0.75), j.y);
  g.rotation.set(j.state === 'floor' ? 0.9 : stuck ? 0.15 : 0, Math.atan2(j.dx, j.dy), 0, 'YXZ');
}

/** A flat ring on the floor (blessed ground, a snare, poison, smoke's edge). */
export function makeRing(r: number, col: number, glow: boolean, w = 0.1): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.RingGeometry(Math.max(0.01, r - w), r, 40), glow ? G(col, 0.25) : M(col));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** A cloud of smoke: grey lumps turning slowly. */
export function makeSmoke(r: number): THREE.Group {
  const root = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, d = r * (0.3 + (i % 3) * 0.25);
    part(root, 0.7, 0.5, 0.7, M(i % 2 ? 0x6a6470 : 0x57525e), Math.cos(a) * d, 0.4 + (i % 4) * 0.25, Math.sin(a) * d, 0, a);
  }
  return root;
}

/** The way out: stakes across the gap while it's shut; gold chevrons on the floor once it's open. */
export function makeExit(w: number, open: boolean): THREE.Group {
  const root = new THREE.Group();
  if (!open) for (let x = 0.15; x < w; x += 0.32) part(root, 0.1, 1.3, 0.1, M(0x4a3424), x, 0.55, 0.2, (x * 7) % 2 ? 0.25 : -0.25);
  else for (let i = 0; i < 3; i++) for (const s of [-1, 1]) part(root, 0.5, 0.03, 0.1, G(0xffd27a, 0.15), w / 2 + s * 0.2, 0.03, 0.4 + i * 0.5, 0, s * 0.7);
  return root;
}
