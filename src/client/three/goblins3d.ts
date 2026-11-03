/**
 * Goblins as low-poly figures: hunched, sickly green, eyes that glow. Size and kit by kind: the little
 * scrapper with its knife, the archer, the lunger's spear, the shield, the hexer's fetish, the
 * drummer, the heavy brute, the butcher with his cleaver (a named one wears a gold torc). Spiders and
 * the training dummies are in spiders3d.ts.
 */
import * as THREE from 'three';
import type { Enemy } from '../../sim/types';
import { G, M } from './mats';
import { blob, collect, middle, part, pivot, stars, type Figure } from './rig';

export interface FoeFig extends Figure {
  wpn: THREE.Group;
  off: THREE.Group;
  tor: THREE.Group;
  big: boolean;
}

const EYE = G(0xff4818), EYE_BIG = G(0xff3a10), EYE_HEX = G(0x9be040);
const rag = M(0x4a3a2a), metal = M(0x6e6a68), rust = M(0x6a4632), woodM = M(0x5a3d22), bone = M(0xd8d0a8);

/** What a goblin looks like, as a key (a new figure is built when it changes). */
export function foeLook(e: Enemy): string {
  return e.kind + ':' + (e.variant ?? '') + (e.bow ? ':bow' : '') + (e.name ? ':named' : '');
}

export function makeGoblin(e: Enemy): FoeFig {
  const big = e.kind === 'butcher' || e.variant === 'heavy' || e.variant === 'stoker', v = e.variant;
  const root = new THREE.Group(), [mid, body] = middle(root, 0.4);
  const skin = M(big ? 0x587434 : v === 'hexer' ? 0x56702e : 0x5f7e30), dskin = M(big ? 0x3e5226 : 0x415a24);
  const eye = v === 'hexer' ? EYE_HEX : big ? EYE_BIG : EYE;
  blob(root, 0.34);
  const legs = [pivot(body, 0.12, 0.36, 0), pivot(body, -0.12, 0.36, 0)];
  for (const L of legs) part(L, 0.13, 0.28, 0.14, dskin, 0, -0.14, 0), part(L, 0.16, 0.08, 0.24, dskin, 0, -0.32, 0.05);
  part(body, 0.44, 0.16, 0.34, rag, 0, 0.36, 0);
  const tor = pivot(body, 0, 0.38, 0);
  tor.rotation.x = 0.45;
  part(tor, 0.42, 0.4, 0.32, skin, 0, 0.2, 0);
  if (big) {
    part(tor, 0.56, 0.42, 0.42, skin, 0, 0.14, 0.06);
    if (e.kind === 'butcher') part(tor, 0.5, 0.5, 0.06, M(0x7a6e5c), 0, 0.08, 0.28), part(tor, 0.14, 0.12, 0.07, M(0x5a1410), 0.1, 0.0, 0.31), part(tor, 0.1, 0.16, 0.07, M(0x5a1410), -0.12, 0.18, 0.31);
    else part(tor, 0.5, 0.3, 0.46, metal, 0, 0.3, 0.02);
    part(tor, 0.12, 0.16, 0.12, metal, 0.26, 0.42, -0.04, 0, 0, -0.5);
    part(tor, 0.12, 0.16, 0.12, metal, -0.26, 0.42, -0.04, 0, 0, 0.5);
  }
  if (e.name) part(tor, 0.46, 0.08, 0.4, M(0xd4a537), 0, 0.4, 0.04);
  if (v === 'looter') part(tor, 0.36, 0.36, 0.26, M(0x7a6a48), 0, 0.22, -0.28);
  if (v === 'drummer') part(tor, 0.4, 0.3, 0.3, M(0x8a6a3a), 0, 0.06, 0.3, Math.PI / 2), part(tor, 0.42, 0.04, 0.42, M(0xc8b890), 0, 0.06, 0.46, Math.PI / 2);
  const head = pivot(tor, 0, 0.44, 0.12);
  head.rotation.x = -0.4;
  part(head, 0.42, 0.32, 0.36, skin, 0, 0.08, 0.02);
  part(head, 0.34, 0.1, 0.3, dskin, 0, -0.1, 0.06);
  part(head, 0.08, 0.12, 0.1, dskin, 0, 0.03, 0.24);
  part(head, 0.28, 0.07, 0.1, skin, 0.3, 0.15, -0.02, 0, 0, 0.4);
  part(head, 0.28, 0.07, 0.1, skin, -0.3, 0.15, -0.02, 0, 0, -0.4);
  if (v === 'hexer') part(head, 0.36, 0.26, 0.05, bone, 0, 0.06, 0.2);
  if (e.bow) part(head, 0.46, 0.14, 0.4, rag, 0, 0.26, -0.02);
  for (const ex of [0.1, -0.1]) part(head, 0.09, 0.07, 0.04, eye, ex, 0.11, 0.225).castShadow = false;
  part(head, 0.04, 0.05, 0.03, bone, 0.08, -0.14, 0.215);
  const aR = pivot(tor, -0.26, 0.34, 0.02), aL = pivot(tor, 0.26, 0.34, 0.02);
  for (const A of [aR, aL]) (A.rotation.order = 'YXZ'), part(A, 0.1, 0.4, 0.1, skin, 0, -0.18, 0);
  const wpn = pivot(aR, 0, -0.38, 0), off = pivot(aL, 0, -0.36, 0.04);
  if (e.kind === 'butcher') part(wpn, 0.06, 0.3, 0.06, rag, 0, 0, 0), part(wpn, 0.06, 0.34, 0.5, metal, 0, -0.3, 0.16), part(wpn, 0.07, 0.06, 0.5, M(0x8a8884), 0, -0.47, 0.16);
  else if (v === 'heavy') part(wpn, 0.08, 0.5, 0.08, woodM, 0, -0.2, 0), part(wpn, 0.2, 0.26, 0.2, woodM, 0, -0.5, 0);
  else if (v === 'stoker') part(wpn, 0.05, 1.3, 0.05, woodM, 0, -0.3, 0.1, 0.3), part(wpn, 0.4, 0.05, 0.05, metal, 0, -0.9, 0.3);
  else if (v === 'lunger') part(wpn, 0.05, 1.5, 0.05, woodM, 0, 0.0, 0.2, 1.2), part(wpn, 0.07, 0.22, 0.03, M(0xb8bcc6), 0, -0.3, 0.85, 1.2);
  else if (v === 'hexer') part(wpn, 0.05, 0.7, 0.05, woodM, 0, 0.1, 0), part(wpn, 0.14, 0.14, 0.14, G(0x9be040, 0.2), 0, 0.48, 0), part(wpn, 0.16, 0.1, 0.05, bone, 0, 0.36, 0);
  else if (v === 'drummer') part(wpn, 0.04, 0.3, 0.04, woodM, 0, -0.1, 0.05), part(off, 0.04, 0.3, 0.04, woodM, 0, -0.1, 0.05);
  else if (!e.bow) part(wpn, 0.05, 0.12, 0.05, rag, 0, 0, 0), part(wpn, 0.07, 0.42, 0.03, rust, 0, -0.26, 0);
  if (e.bow) {
    for (const s of [-1, 1]) part(off, 0.05, 0.3, 0.05, woodM, 0, s * 0.14, 0.1, s * 0.5);
    part(off, 0.015, 0.5, 0.015, M(0xd8d0bc), 0, 0, -0.03);
  }
  if (v === 'shield') part(off, 0.5, 0.5, 0.07, M(0x5a4228), 0, 0.05, 0.12), part(off, 0.12, 0.12, 0.08, metal, 0, 0.05, 0.16);
  const st = stars(root, 1.2);
  root.scale.setScalar(big ? (e.name ? 1.75 : e.kind === 'butcher' ? 1.6 : 1.3) : v === 'looter' ? 0.68 : 0.76);
  return { ...collect({ root, mid, body, legs, aR, aL, head, stars: st }), wpn, off, tor, big };
}
