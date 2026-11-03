/**
 * The spiders (a small one, the brood mother, the nest they hatch from) and the training dummies, in
 * the same parts as a goblin so the pose and the flash work the same way.
 */
import * as THREE from 'three';
import type { Enemy } from '../../sim/types';
import type { FoeFig } from './goblins3d';
import { G, M } from './mats';
import { blob, collect, middle, part, pivot, stars } from './rig';

export function makeSpider(e: Enemy): FoeFig {
  const root = new THREE.Group(), [mid, body] = middle(root, 0.25), brood = e.kind === 'brood', nest = e.kind === 'nest';
  const shell = M(brood ? 0x2a1e26 : 0x26222a), leg = M(0x1c181e), eye = G(0xff3a2a);
  blob(root, nest ? 0.6 : 0.4);
  const tor = pivot(body, 0, 0.22, 0), head = pivot(tor, 0, 0.02, 0.26), legs: THREE.Group[] = [];
  if (nest) {
    // A mound of grey web with eggs in it, pale and swelling.
    part(tor, 1.1, 0.4, 0.9, M(0x5a5662), 0, 0.0, 0);
    part(tor, 0.7, 0.3, 0.6, M(0x6e6a76), 0.1, 0.3, -0.05);
    for (let i = 0; i < 5; i++) part(tor, 0.18, 0.2, 0.18, M(0xd8d0bc), Math.cos(i * 1.3) * 0.35, 0.28, Math.sin(i * 1.3) * 0.25);
  } else {
    part(tor, 0.36, 0.2, 0.34, shell, 0, 0, 0.05);
    part(tor, 0.5, 0.36, 0.56, shell, 0, 0.08, -0.36);
    if (brood) part(tor, 0.16, 0.04, 0.36, M(0x8a2a1a), 0, 0.27, -0.36);
    part(head, 0.22, 0.14, 0.14, shell, 0, 0, 0);
    for (const [x, y] of [[0.05, 0.03], [-0.05, 0.03], [0.09, -0.02], [-0.09, -0.02]]) part(head, 0.04, 0.04, 0.03, eye, x, y, 0.075).castShadow = false;
    for (let i = 0; i < 8; i++) {
      const s = i < 4 ? 1 : -1, L = pivot(tor, s * 0.16, 0, 0.12 - (i % 4) * 0.08);
      L.rotation.y = s * (Math.PI / 2 - 0.7 + (i % 4) * 0.45);
      part(L, 0.05, 0.05, 0.36, leg, 0, 0.08, 0.16, -0.4);
      part(L, 0.04, 0.32, 0.04, leg, 0, -0.04, 0.32);
      legs.push(L);
    }
  }
  const aR = pivot(tor, 0, 0, 0), aL = pivot(tor, 0, 0, 0);
  const st = stars(root, 0.7);
  root.scale.setScalar(brood ? 2.2 : nest ? 1.2 : 1);
  return { ...collect({ root, mid, body, legs: legs.length ? legs : [aR, aL], aR, aL, head, stars: st }), wpn: aR, off: aL, tor, big: brood };
}

/** A straw man on a post; the swinging one has an arm on a pivot that swings back at you. */
export function makeDummy(e: Enemy): FoeFig {
  const root = new THREE.Group(), [mid, body] = middle(root, 0.5), straw = M(0xb89a5a), post = M(0x6b4a2b);
  blob(root, 0.3);
  part(body, 0.1, 1.0, 0.1, post, 0, 0.5, 0);
  part(body, 0.4, 0.06, 0.3, M(0x4a3420), 0, 0.03, 0);
  const tor = pivot(body, 0, 0.75, 0);
  part(tor, 0.38, 0.42, 0.3, straw, 0, 0, 0);
  part(tor, 0.7, 0.07, 0.07, post, 0, 0.12, 0);
  const head = pivot(tor, 0, 0.34, 0);
  part(head, 0.26, 0.24, 0.24, M(0xc8aa6a), 0, 0, 0);
  const aR = pivot(tor, -0.3, 0.1, 0), aL = pivot(tor, 0.3, 0.1, 0);
  aR.rotation.order = 'YXZ';
  if (e.kind === 'swingDummy') part(aR, 0.08, 0.08, 0.7, post, 0, 0, 0.35);
  const st = stars(root, 1.4);
  return { ...collect({ root, mid, body, legs: [aL, aL], aR, aL, head, stars: st }), wpn: aR, off: aL, tor, big: false };
}
