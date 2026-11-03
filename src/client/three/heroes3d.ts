/**
 * The five classes as low-poly figures built from boxes, in each class's three looks (the colours of
 * the pixel sprites in sprites.ts). What's in the hands follows the kit (sword and shield, greatsword,
 * spear; a bow; twin daggers; wand, staff or rod; mace and censer).
 */
import * as THREE from 'three';
import { WEAPONS, type WeaponId } from '../../shared/tuning';
import { G, M, hex } from './mats';
import { blob, collect, middle, part, pivot, stars, type Figure } from './rig';

type Cls = 'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER';
/** body, trim, metal (or hood), head covering, accent, eyes, legs. */
type Pal = [string, string, string, string, string, string, string];
const PALS: Record<Cls, Pal[]> = {
  WARRIOR: [['#2f5d9b', '#d4a537', '#9aa3ad', '#9aa3ad', '#c0392b', '#bfe0ff', '#3a3a44'], ['#5a4030', '#2a1e16', '#6a6e74', '#7a7f86', '#7a1d1d', '#bfe0ff', '#4a3a2e'], ['#2a2830', '#8a7a4a', '#3a3a42', '#34343c', '#8a1e1e', '#ff5a3a', '#1e1c22']],
  RANGER: [['#3f6b3a', '#5a3d22', '#5a4a32', '#3f5a32', '#5a4a32', '#ffd27a', '#3a3a2a'], ['#6b4a2b', '#3a2a1a', '#8a7a66', '#4a3420', '#5a3d22', '#ffd27a', '#3a2e24'], ['#4a5a6a', '#2a2420', '#3a4652', '#5a6a7a', '#9aa3ad', '#bfe0ff', '#3a3e46']],
  ROGUE: [['#3a3346', '#5a3d22', '#2a2630', '#2a2630', '#5a3d22', '#c9a8ff', '#26222c'], ['#5a4030', '#2a1e16', '#4a3428', '#3a2a22', '#8a2a1a', '#ffd27a', '#3a3028'], ['#1e1c24', '#2a2630', '#18161c', '#1e1c24', '#c8c0b0', '#bfe0ff', '#1a1a20']],
  MAGE: [['#3e2760', '#b89a4a', '#4a2f6e', '#3e2760', '#a8a2b4', '#c9a8ff', '#2e1c48'], ['#6a1e1a', '#d4a537', '#7a2a1e', '#6a1e1a', '#3a3036', '#ff8a3a', '#3a1210'], ['#5a7a9a', '#cfe0ec', '#6a8aaa', '#6a8aaa', '#e8eef2', '#bfe0ff', '#3a4a5a']],
  HEALER: [['#6a7078', '#d4a537', '#7a8088', '#8a9098', '#e0d8c4', '#ffe9a8', '#4a4e56'], ['#5a4232', '#c8b88a', '#4a3428', '#5a4232', '#5a4232', '#ffe9a8', '#2a2420'], ['#c8c0b0', '#d4a537', '#8a9098', '#d8d4cc', '#8a1e1e', '#ffe9a8', '#4a4e56']],
};

export interface HeroFig extends Figure {
  cls: Cls;
  /** In the right hand, and the left (a shield, a bow, a censer). */
  held: THREE.Group;
  off: THREE.Group;
  /** A Mage's glowing tip (its colour is the element), a Cleric's censer. */
  tip: THREE.Mesh | null;
}

const steelBlade = M(0xe4eaf2), wood = M(0x5a3d22), dark = M(0x16141c);

function hands(cls: Cls, w: WeaponId, held: THREE.Group, off: THREE.Group, c: Pal): THREE.Mesh | null {
  const metal = M(hex(c[2])), gold = M(0xd4a537);
  if (cls === 'WARRIOR') {
    if (w === 'spear') return part(held, 0.05, 2.1, 0.05, wood, 0, 0.35, 0.1, 0.25), part(held, 0.08, 0.28, 0.04, steelBlade, 0, 1.45, 0.38, 0.25), null;
    const long = w === 'greatsword';
    part(held, 0.28, 0.06, 0.07, metal, 0, -0.04, 0);
    part(held, long ? 0.12 : 0.09, long ? 1.2 : 0.8, 0.035, steelBlade, 0, long ? -0.66 : -0.46, 0);
    part(held, 0.05, 0.12, 0.05, gold, 0, 0.06, 0);
    if (!long) {
      part(off, 0.5, 0.58, 0.08, M(hex(c[4])), 0, 0, 0.12);
      part(off, 0.54, 0.06, 0.1, metal, 0, 0.29, 0.12);
      part(off, 0.08, 0.58, 0.1, gold, 0, 0, 0.13);
    }
    return null;
  }
  if (cls === 'RANGER') {
    part(held, 0.06, 0.36, 0.03, steelBlade, 0, -0.22, 0);
    if (w === 'crossbow') return part(off, 0.5, 0.06, 0.08, wood, 0, 0, 0.2), part(off, 0.08, 0.08, 0.5, wood, 0, 0, 0.1), null;
    const len = w === 'shortbow' ? 0.36 : 0.5;
    for (const s of [-1, 1]) part(off, 0.05, len, 0.05, wood, 0, s * len * 0.45, 0.1 - Math.abs(s) * 0.02, s * 0.5);
    part(off, 0.015, len * 1.7, 0.015, M(0xd8d0bc), 0, 0, -0.04);
    return null;
  }
  if (cls === 'ROGUE') {
    for (const g of [held, off]) part(g, 0.13, 0.04, 0.05, metal, 0, -0.04, 0), part(g, 0.05, 0.32, 0.025, steelBlade, 0, -0.22, 0);
    return null;
  }
  if (cls === 'MAGE') {
    const len = w === 'wand' ? 0.4 : w === 'rod' ? 0.8 : 1.5;
    part(held, 0.06, len, 0.06, w === 'rod' ? M(0x8a8494) : wood, 0, -0.1 + len * 0.35, 0.05);
    return part(held, 0.13, 0.13, 0.13, G(0xc9a8ff), 0, -0.1 + len * 0.85, 0.05);
  }
  // The Cleric: a flanged mace in the right hand, the censer swinging from the left on its chain.
  part(held, 0.06, 0.5, 0.06, wood, 0, -0.22, 0);
  part(held, 0.18, 0.18, 0.18, M(0x8a8e98), 0, -0.48, 0, 0, 0.78);
  part(off, 0.02, 0.3, 0.02, M(0x6a6470), 0, -0.15, 0);
  return part(off, 0.15, 0.15, 0.15, G(0xff9a3c, 0.3), 0, -0.34, 0);
}

export function makeHero(cls: Cls, look: number, weapon: WeaponId): HeroFig {
  const c = PALS[cls][look] ?? PALS[cls][0], root = new THREE.Group();
  const [mid, body] = middle(root, 0.55);
  const main = M(hex(c[0])), trim = M(hex(c[1])), side = M(hex(c[2])), headM = M(hex(c[3])), acc = M(hex(c[4])), legM = M(hex(c[6])), eye = G(hex(c[5]));
  const robe = cls === 'MAGE' || (cls === 'HEALER' && look === 1);
  blob(root, 0.36);
  const legs = [pivot(body, 0.12, 0.6, 0), pivot(body, -0.12, 0.6, 0)];
  for (const L of legs) part(L, 0.17, 0.46, 0.2, legM, 0, -0.25, 0), part(L, 0.19, 0.12, 0.28, M(0x241c16), 0, -0.54, 0.04);
  if (robe) part(body, 0.6, 0.6, 0.42, main, 0, 0.35, 0), part(body, 0.12, 0.6, 0.02, trim, 0, 0.38, 0.215);
  part(body, cls === 'WARRIOR' ? 0.56 : 0.46, 0.52, 0.34, main, 0, 0.9, 0);
  part(body, 0.5, 0.07, 0.36, cls === 'MAGE' ? trim : M(0x4a3426), 0, 0.66, 0);
  if (cls === 'WARRIOR') part(body, 0.22, 0.14, 0.32, side, 0.33, 1.12, 0), part(body, 0.22, 0.14, 0.32, side, -0.33, 1.12, 0), part(body, 0.08, 0.4, 0.04, trim, 0, 0.9, 0.18);
  if (cls === 'HEALER') part(body, 0.34, 0.6, 0.04, acc, 0, 0.82, 0.18), part(body, 0.12, 0.12, 0.05, G(0xffd27a, 0.5), 0, 0.98, 0.2);
  if (cls === 'RANGER' || cls === 'ROGUE') part(body, 0.42, 0.7, 0.05, headM, 0, 0.75, -0.19, 0.12);
  if (cls === 'RANGER') part(body, 0.12, 0.46, 0.12, M(0x4a3420), 0.12, 1.0, -0.24, 0, 0, 0.3), part(body, 0.1, 0.06, 0.1, M(0xd8c48a), 0.2, 1.24, -0.24);
  const head = pivot(body, 0, 1.3, 0);
  part(head, 0.38, 0.38, 0.38, headM, 0, 0, 0);
  // The face, in shadow (a visor, a hood, a beard), and the eyes.
  part(head, 0.28, 0.12, 0.04, dark, 0, 0.0, 0.19);
  for (const ex of [0.07, -0.07]) part(head, 0.06, 0.045, 0.03, eye, ex, 0.0, 0.205).castShadow = false;
  if (cls === 'WARRIOR') part(head, 0.07, 0.16, 0.32, acc, 0, 0.26, -0.02);
  if (cls === 'RANGER' && look === 1) part(head, 0.62, 0.05, 0.62, side, 0, 0.18, 0), part(head, 0.36, 0.12, 0.36, headM, 0, 0.25, 0);
  else if (cls === 'RANGER' || cls === 'ROGUE') part(head, 0.16, 0.12, 0.2, headM, 0, 0.22, -0.08);
  if (cls === 'ROGUE' && look === 1) part(head, 0.3, 0.12, 0.04, acc, 0, -0.1, 0.2);
  if (cls === 'ROGUE' && look === 2) part(head, 0.26, 0.16, 0.03, acc, 0, -0.02, 0.2);
  if (cls === 'MAGE') {
    part(head, 0.22, 0.2, 0.05, acc, 0, -0.18, 0.18);
    if (look < 2) {
      part(head, 0.6, 0.05, 0.6, side, 0, 0.18, 0);
      for (let i = 0; i < 4; i++) part(head, 0.34 - i * 0.08, 0.14, 0.34 - i * 0.08, main, -i * 0.03, 0.27 + i * 0.13, -i * 0.04);
      part(head, 0.3, 0.05, 0.3, trim, 0, 0.22, 0);
    } else part(head, 0.44, 0.3, 0.44, side, 0, 0.1, -0.02);
  }
  if (cls === 'HEALER') part(head, 0.3, 0.05, 0.05, trim, 0, 0.2, 0.17);
  const arm = (x: number) => {
    const A = pivot(body, x, 1.06, 0);
    A.rotation.order = 'YXZ';
    part(A, 0.14, 0.42, 0.16, cls === 'MAGE' ? side : cls === 'WARRIOR' ? side : main, 0, -0.2, 0);
    part(A, 0.13, 0.1, 0.13, M(0x4a3426), 0, -0.42, 0);
    return A;
  };
  const aR = arm(-0.32), aL = arm(0.32);
  const held = pivot(aR, 0, -0.44, 0.02), off = pivot(aL, 0, -0.36, 0.04);
  const tip = hands(cls, weapon, held, off, c);
  const st = stars(root, 1.75);
  root.scale.setScalar(0.82);
  return { ...collect({ root, mid, body, legs, aR, aL, head, stars: st }), cls, held, off, tip };
}

export const heroKey = (h: { weapon: WeaponId; look?: number }) => WEAPONS[h.weapon].cls + ':' + (h.look ?? 0) + ':' + h.weapon;
export const clsOf = (w: WeaponId) => WEAPONS[w].cls as Cls;
