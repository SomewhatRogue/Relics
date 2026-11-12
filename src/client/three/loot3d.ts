/**
 * Loot in the 2.5D view (../lootart.ts is the flat view's): each weapon lying on the floor as itself, a glint
 * running down its blade now and then, a breastplate, an amulet; a dotted ring of its tier's colour round it;
 * coins and a heap of them; a corked bottle with its potion glowing inside. Kyle, 2026-11-12: "a better pass".
 */
import * as THREE from 'three';
import { POTIONS } from '../../shared/potions';
import type { Item } from '../../shared/loot';
import { G, M, hex } from './mats';
import { part, pivot } from './rig';

const STEEL = 0xe4eaf2, DARK = 0x9aa6b2, WOOD = 0x8b6a3a, GRIP = 0x5a3d22, GOLD = 0xd4a537;

/** A weapon built standing (its length up y from the grip), to be laid down; returns its blade's run for the glint. */
function weapon(g: THREE.Group, kit: string, tier: number): [number, number] | null {
  const blade = (w: number, len: number, col = STEEL, guard = 0.22, grip = 0.16) => {
    part(g, 0.05, grip, 0.05, M(GRIP), 0, grip / 2, 0), part(g, 0.08, 0.06, 0.08, M(GOLD), 0, -0.02, 0);
    part(g, guard, 0.05, 0.07, G(tier, 0.3), 0, grip + 0.02, 0);
    part(g, w, len, 0.025, M(col), 0, grip + 0.05 + len / 2, 0), part(g, w * 0.4, 0.06, 0.025, M(col), 0, grip + 0.05 + len + 0.02, 0);
    return [grip + 0.08, grip + 0.05 + len] as [number, number];
  };
  switch (kit) {
    case 'greatsword': return blade(0.09, 0.85, STEEL, 0.32, 0.24);
    case 'spellblade': return blade(0.06, 0.6, 0xd8e0f4, 0.22);
    case 'daggers': {
      part(g, 0.04, 0.1, 0.04, M(GRIP), 0.08, 0.05, 0), part(g, 0.05, 0.28, 0.02, M(STEEL), 0.08, 0.25, 0);
      part(g, 0.04, 0.1, 0.04, M(GRIP), -0.08, 0.1, 0.03), part(g, 0.05, 0.28, 0.02, M(STEEL), -0.08, 0.3, 0.03);
      return [0.14, 0.38];
    }
    case 'spear': return part(g, 0.04, 1.15, 0.04, M(WOOD), 0, 0.58, 0), part(g, 0.09, 0.2, 0.025, M(STEEL), 0, 1.25, 0), [1.16, 1.34];
    case 'longbow': case 'shortbow': {
      const L = kit === 'longbow' ? 0.95 : 0.7;
      part(g, 0.04, L * 0.5, 0.04, M(WOOD), 0.05, L / 2, 0), part(g, 0.04, L * 0.3, 0.04, M(WOOD), 0, L * 0.13, 0, 0, 0, 0.35), part(g, 0.04, L * 0.3, 0.04, M(WOOD), 0, L * 0.87, 0, 0, 0, -0.35);
      part(g, 0.012, L, 0.012, M(0xd8d0bc), -0.05, L / 2, 0);
      return null;
    }
    case 'crossbow': return part(g, 0.07, 0.6, 0.05, M(GRIP), 0, 0.3, 0), part(g, 0.62, 0.05, 0.05, M(WOOD), 0, 0.56, 0), part(g, 0.03, 0.2, 0.03, M(STEEL), 0, 0.68, 0), null;
    case 'wand': return part(g, 0.04, 0.42, 0.04, M(WOOD), 0, 0.21, 0), part(g, 0.07, 0.07, 0.07, G(0xc9a8ff), 0, 0.45, 0), null;
    case 'staff': return part(g, 0.06, 1.2, 0.06, M(WOOD), 0, 0.6, 0), part(g, 0.1, 0.1, 0.1, G(0xc9a8ff), 0, 1.24, 0), null;
    case 'mace': return part(g, 0.05, 0.45, 0.05, M(GRIP), 0, 0.22, 0), part(g, 0.17, 0.17, 0.17, M(0x9aa3ad), 0, 0.5, 0), part(g, 0.24, 0.05, 0.05, M(0x6a727c), 0, 0.5, 0), part(g, 0.05, 0.05, 0.24, M(0x6a727c), 0, 0.5, 0), [0.42, 0.58];
    default: return blade(0.06, 0.6);
  }
}

/** Gear on the floor: lying at a slant, a dotted ring of its tier's colour round it. `userData.tick(now)` runs the glint. */
export function makeLoot(item: Item, col: string, id: number): THREE.Group {
  const root = new THREE.Group(), tier = hex(col);
  for (let i = 0; i < 12; i++) if (i % 3) part(root, 0.06, 0.01, 0.06, G(tier, 0.3), Math.cos((i / 12) * Math.PI * 2) * 0.5, 0.01, Math.sin((i / 12) * Math.PI * 2) * 0.3);
  const lay = pivot(root, 0, 0.05, 0);
  lay.rotation.set(-Math.PI / 2, 0, 0.6 + (id % 5) * 0.5);
  const g = pivot(lay, 0, -0.35, 0), kind = item.slot ?? 'weapon';
  let run: [number, number] | null = null;
  if (kind === 'weapon') run = weapon(g, item.kit ?? 'sword', tier);
  else if (kind === 'armor') {
    const a = item.armor === 'heavy' ? 0xb4bcc6 : item.armor === 'light' ? 0x7a5a34 : 0x8a929c;
    part(g, 0.42, 0.4, 0.07, M(a), 0, 0.35, 0), part(g, 0.14, 0.12, 0.08, M(a), -0.2, 0.55, 0), part(g, 0.14, 0.12, 0.08, M(a), 0.2, 0.55, 0);
  } else part(g, 0.1, 0.1, 0.05, G(tier), 0, 0.3, 0), part(g, 0.18, 0.02, 0.02, M(GOLD), 0, 0.42, 0, 0, 0, 0.6), part(g, 0.18, 0.02, 0.02, M(GOLD), 0, 0.42, 0, 0, 0, -0.6);
  if (run) {
    const glint = part(g, 0.08, 0.08, 0.04, G(0xffffff), 0, run[0], 0.02);
    glint.visible = false;
    root.userData.tick = (now: number) => {
      const t = (now * 0.45 + id * 0.37) % 1;
      glint.visible = t < 0.25;
      if (glint.visible) glint.position.y = run![0] + (run![1] - run![0]) * (t / 0.25);
    };
  }
  return root;
}

/** Coins on the floor: two or three, or a heap for a lot. */
export function makeCoins(gold: number): THREE.Group {
  const root = new THREE.Group(), n = gold >= 18 ? 9 : Math.min(3, 2 + Math.floor(gold / 9));
  for (let i = 0; i < n; i++) {
    const ring = i < 5 ? 0 : 1, a = i * 2.3;
    part(root, 0.13, 0.035, 0.13, M(i % 2 ? 0xb08a3a : 0xecc860), Math.cos(a) * (0.16 - ring * 0.08) * (n > 3 ? 1 : 1.2), 0.02 + ring * 0.05 + (n > 3 && i === 8 ? 0.05 : 0), Math.sin(a) * 0.1, 0, a, 0);
  }
  return root;
}

/** A potion: a corked bottle, its colour glowing inside. */
export function makeBottle(potion?: string): THREE.Group {
  const root = new THREE.Group(), col = hex(potion ? POTIONS[potion as keyof typeof POTIONS].col : '#c0392b');
  part(root, 0.2, 0.18, 0.2, M(0x8a9aa8), 0, 0.1, 0), part(root, 0.15, 0.13, 0.15, G(col), 0, 0.1, 0.03);
  part(root, 0.07, 0.08, 0.07, M(0x8a9aa8), 0, 0.23, 0), part(root, 0.08, 0.06, 0.08, M(0x8a6a3a), 0, 0.3, 0);
  return root;
}
