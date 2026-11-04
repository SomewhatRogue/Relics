/**
 * What a hero holds, by kit, each its own thing in hand (a new figure is built when the kit changes,
 * so one replaces the other, never on top): sword and shield, greatsword, spear; longbow, shortbow,
 * crossbow (and the Ranger's short sword); twin daggers, the rapier, the short sword with a blowgun;
 * wand, staff, rod; mace and censer, sword and censer, flail and censer.
 */
import type * as THREE from 'three';
import type { WeaponId } from '../../shared/tuning';
import { G, M, hex } from './mats';
import { part } from './rig';

/** The class's colours the kit borrows: metal (index 2) and accent (index 4). */
type Pal = readonly string[];

const steel = M(0xe4eaf2), wood = M(0x5a3d22), dark = M(0x2a2420), gold = M(0xd4a537), chain = M(0x6a6470), iron = M(0x8a8e98), string = M(0xd8d0bc);

/** A Cleric's censer on its chain at the off hand, a coal from the Last Lantern in it. Returns the coal. */
function censer(off: THREE.Group): THREE.Mesh {
  part(off, 0.02, 0.3, 0.02, chain, 0, -0.15, 0);
  part(off, 0.17, 0.12, 0.17, M(0xb08a3a), 0, -0.36, 0);
  return part(off, 0.1, 0.06, 0.1, G(0xff9a3c, 0.3), 0, -0.29, 0);
}

/** The poisoner's blowgun: a long reed tube, bound at the ends, a sickly green bead at its mouth. */
function blowgun(g: THREE.Group): void {
  part(g, 0.05, 0.05, 0.8, M(0x7a6a3a), 0, 0, 0.3);
  part(g, 0.07, 0.07, 0.05, dark, 0, 0, -0.08), part(g, 0.07, 0.07, 0.05, dark, 0, 0, 0.68);
  part(g, 0.04, 0.04, 0.04, G(0x9be040, 0.4), 0, 0, 0.72);
}

/** Put the kit in `held` (the right hand) and `off` (the left). Returns what glows (a caster's tip, a censer's coal), or null. */
export function hands(cls: string, w: WeaponId, held: THREE.Group, off: THREE.Group, c: Pal): THREE.Mesh | null {
  const metal = M(hex(c[2]));
  if (cls === 'WARRIOR') {
    if (w === 'spear') return part(held, 0.05, 2.1, 0.05, wood, 0, 0.35, 0.1, 0.25), part(held, 0.08, 0.28, 0.04, steel, 0, 1.45, 0.38, 0.25), null;
    const long = w === 'greatsword';
    part(held, long ? 0.36 : 0.28, 0.06, 0.07, metal, 0, -0.04, 0);
    part(held, long ? 0.12 : 0.09, long ? 1.2 : 0.8, 0.035, steel, 0, long ? -0.66 : -0.46, 0);
    part(held, 0.05, long ? 0.22 : 0.12, 0.05, long ? wood : gold, 0, long ? 0.1 : 0.06, 0);
    if (!long) {
      part(off, 0.5, 0.58, 0.08, M(hex(c[4])), 0, 0, 0.12);
      part(off, 0.54, 0.06, 0.1, metal, 0, 0.29, 0.12);
      part(off, 0.08, 0.58, 0.1, gold, 0, 0, 0.13);
    }
    return null;
  }
  if (cls === 'RANGER') {
    part(held, 0.06, 0.36, 0.03, steel, 0, -0.22, 0);
    if (w === 'crossbow') return part(off, 0.56, 0.06, 0.08, wood, 0, 0, 0.2), part(off, 0.08, 0.08, 0.56, wood, 0, 0, 0.1), part(off, 0.54, 0.01, 0.01, string, 0, 0.02, 0.12), null;
    const len = w === 'shortbow' ? 0.36 : 0.56;
    for (const s of [-1, 1]) part(off, 0.05, len, 0.05, w === 'shortbow' ? M(0x6b4a2b) : wood, 0, s * len * 0.45, 0.1 - Math.abs(s) * 0.02, s * 0.5);
    part(off, 0.015, len * 1.7, 0.015, string, 0, 0, -0.04);
    return null;
  }
  if (cls === 'ROGUE') {
    if (w === 'rapier') {
      // A long thin blade, a swept gilt hilt round the hand; nothing in the other.
      part(held, 0.03, 0.95, 0.02, steel, 0, -0.58, 0);
      part(held, 0.2, 0.03, 0.05, gold, 0, -0.06, 0), part(held, 0.03, 0.12, 0.1, gold, 0.08, -0.02, 0.03);
      part(held, 0.04, 0.12, 0.04, dark, 0, 0.04, 0);
      return null;
    }
    if (w === 'poisoner') {
      // A short sword in hand, a touch broader than a dagger; the blowgun along the other arm.
      part(held, 0.15, 0.04, 0.05, metal, 0, -0.04, 0), part(held, 0.07, 0.48, 0.03, steel, 0, -0.3, 0);
      part(held, 0.04, 0.1, 0.04, dark, 0, 0.04, 0);
      blowgun(off);
      return null;
    }
    for (const g of [held, off]) part(g, 0.13, 0.04, 0.05, metal, 0, -0.04, 0), part(g, 0.05, 0.32, 0.025, steel, 0, -0.22, 0);
    return null;
  }
  if (cls === 'MAGE') {
    if (w === 'staff') {
      // Taller than they are, a crook at the top round the light.
      part(held, 0.07, 1.6, 0.07, wood, 0, 0.45, 0.05);
      part(held, 0.07, 0.07, 0.2, wood, 0, 1.25, 0.12), part(held, 0.07, 0.18, 0.07, wood, 0, 1.18, 0.2);
      return part(held, 0.15, 0.15, 0.15, G(0xc9a8ff), 0, 1.33, 0.05);
    }
    if (w === 'rod') {
      // Grey iron, banded, a squared head holding the light.
      part(held, 0.06, 0.8, 0.06, M(0x8a8494), 0, 0.18, 0.05);
      for (const y of [0, 0.3]) part(held, 0.09, 0.04, 0.09, M(0x5a5560), 0, y, 0.05);
      part(held, 0.16, 0.06, 0.16, M(0x5a5560), 0, 0.6, 0.05);
      return part(held, 0.12, 0.12, 0.12, G(0xc9a8ff), 0, 0.68, 0.05);
    }
    part(held, 0.05, 0.42, 0.05, M(0x6b4a2b), 0, -0.02, 0.05);
    return part(held, 0.1, 0.1, 0.1, G(0xc9a8ff), 0, 0.22, 0.05);
  }
  // The Cleric: the censer at the left whatever is in the right.
  if (w === 'censer') {
    part(held, 0.07, 0.75, 0.035, steel, 0, -0.45, 0), part(held, 0.24, 0.05, 0.07, gold, 0, -0.04, 0), part(held, 0.05, 0.12, 0.05, gold, 0, 0.06, 0);
    // The censer bigger, on a longer chain: it's swung in this kit, not just carried.
    part(off, 0.02, 0.5, 0.02, chain, 0, -0.25, 0);
    part(off, 0.22, 0.16, 0.22, M(0xb08a3a), 0, -0.56, 0);
    return part(off, 0.13, 0.07, 0.13, G(0xff9a3c, 0.2), 0, -0.47, 0);
  }
  if (w === 'flail') {
    // A short haft, a chain, a spiked iron head hanging from it.
    part(held, 0.06, 0.36, 0.06, wood, 0, -0.16, 0);
    part(held, 0.02, 0.26, 0.02, chain, 0, -0.47, 0);
    part(held, 0.16, 0.16, 0.16, M(0x5a5560), 0, -0.66, 0);
    for (const [x, y, z] of [[0.1, -0.66, 0], [-0.1, -0.66, 0], [0, -0.66, 0.1], [0, -0.76, 0]]) part(held, 0.05, 0.05, 0.05, M(0xcfd6dc), x, y, z);
    return censer(off);
  }
  // The mace, flanged.
  part(held, 0.06, 0.5, 0.06, wood, 0, -0.22, 0);
  part(held, 0.18, 0.18, 0.18, iron, 0, -0.48, 0, 0, 0.78);
  return censer(off);
}
