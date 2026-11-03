/**
 * Buildings (blocks) in 3D: walls with real height and thickness, a doorway you can read (a dark way
 * in under a lintel, the door swung open; shut and barred when it's locked; fallen beams across it
 * when it's blocked), windows (warm when the fire's lit), and the roof as its own mesh so it can be
 * lifted off when you walk behind. Charred when hurt, burning, or burned down to black stumps.
 * Fences, stone walls, furniture and the rest are walls3d.ts.
 */
import * as THREE from 'three';
import { doorAt, type Block } from '../../shared/arena';
import { LOOK } from '../blocks';
import { houseOf } from '../cottage';
import { Boxes, Seed, jit } from './boxes';
import { G, VCOL, hex } from './mats';
import { gable, tent } from './roofs3d';
import { flatBlock } from './walls3d';

/** Eave height (tiles) by kind. */
const TALL: Partial<Record<Block['kind'], number>> = { house: 1.45, barn: 1.9, hall: 1.6, church: 2.4, forge: 1.8, tavern: 1.7, granary: 1.9, tower: 3.6, shack: 0.95, den: 0.7 };
const ROOFED = new Set<Block['kind']>(['house', 'barn', 'hall', 'church', 'forge', 'tavern', 'granary', 'tower', 'shack', 'den']);
const STONE = new Set<Block['kind']>(['church', 'forge', 'tower', 'hall']);

export interface Built {
  group: THREE.Group;
  roof: THREE.Mesh | null;
  /** Where flames go (burning), x y z and size. */
  fires: [number, number, number, number][];
  /** Its footprint and how high it stands (for lifting the roof when you're behind it). */
  top: number;
}

/** 0 standing, 1 charred, 2 burned down; and whether it's alight. */
export const blockState = (b: Block) => (b.ruined ? 2 : b.maxHp && (b.hp ?? 0) < b.maxHp * 0.5 ? 1 : 0) * 2 + (((b.burning ?? -1) >= 0 || b.fate === 'burning' || b.smoulder) && !b.ruined ? 1 : 0);

const shade = (c: number, k: number) => {
  const col = new THREE.Color(c);
  return col.setRGB(col.r * k, col.g * k, col.b * k).getHex();
};

export function buildBlock(b: Block): Built {
  const group = new THREE.Group(), fires: Built['fires'] = [];
  if (!ROOFED.has(b.kind)) return { group: flatBlock(b, group, fires), roof: null, fires, top: 1 };
  const st = blockState(b), ruined = st >= 4, alight = st % 2 === 1, charred = st >= 2 || alight;
  const r = new Seed(Math.round(b.x * 31 + b.y * 17 + 7)), L = LOOK[b.kind], home = houseOf(b);
  const k = charred ? 0.45 : 1, wallC = shade(hex(L.wall), k), beam = shade(0x3a2a1e, k);
  const x0 = b.x, x1 = b.x + b.w, z0 = b.y, z1 = b.y + b.h, H = TALL[b.kind] ?? 1.4, t = 0.2;
  const W = new Boxes(), R = new Boxes(), stone = STONE.has(b.kind) || b.style === 'stone';
  const door = !!b.door && b.fate !== 'blocked' ? doorAt(b).x : null, dw = 0.42, dh = Math.min(1.05, H - 0.25);
  // A wall from a0 to a1 along x (front or back) or z (sides), courses of stone or planks.
  const wall = (ax: 'x' | 'z', a0: number, a1: number, c: number, y0: number, y1: number) => {
    const ch = stone ? 0.3 : 0.24;
    for (let y = y0, row = 0; y < y1 - 0.01; y += ch, row++) {
      const top = ruined ? 0.15 + r.next() * 0.55 : y1;
      if (y > top) continue;
      let a = a0 - (row % 2 ? 0.25 : 0);
      while (a < a1) {
        const len = stone ? 0.45 + r.next() * 0.4 : 0.9 + r.next() * 0.8, sa = Math.max(a, a0), sb = Math.min(a + len, a1);
        a += len;
        if (sb - sa < 0.06) continue;
        const hh = Math.min(ch, y1 - y) - 0.03, col = ruined ? jit(0x141012, 0.3, r) : jit(wallC, stone ? 0.14 : 0.1, r);
        if (ax === 'x') W.b((sa + sb) / 2, y, c, sb - sa - 0.03, hh, t, col);
        else W.b(c, y, (sa + sb) / 2, t, hh, sb - sa - 0.03, col);
      }
    }
  };
  wall('x', x0, x1, z0 + t / 2, 0, H);
  wall('z', z0, z1, x0 + t / 2, 0, H);
  wall('z', z0, z1, x1 - t / 2, 0, H);
  if (door === null) wall('x', x0, x1, z1 - t / 2, 0, H);
  else {
    wall('x', x0, door - dw, z1 - t / 2, 0, H);
    wall('x', door + dw, x1, z1 - t / 2, 0, H);
    if (!ruined) wall('x', door - dw, door + dw, z1 - t / 2, dh, H);
  }
  if (!ruined) {
    // Timber framing on a wooden house: corner posts and a rail.
    if (!stone) for (const [px, pz] of [[x0, z1], [x1, z1], [x0, z0], [x1, z0]]) W.b(px + (px === x0 ? 0.08 : -0.08), 0, pz + (pz === z0 ? 0.08 : -0.08), 0.18, H, 0.18, beam);
    if (!stone) W.b((x0 + x1) / 2, H * 0.55, z1 - 0.06, b.w - 0.1, 0.08, 0.06, beam);
    // The floor inside, dark, so a doorway shows the dark within.
    W.b((x0 + x1) / 2, 0, (z0 + z1) / 2, b.w - 0.3, 0.02, b.h - 0.3, 0x0c0a0a);
    W.b((x0 + x1) / 2, H - 0.12, (z0 + z1) / 2, b.w - 0.3, 0.06, b.h - 0.3, 0x0c0a0a);
    if (door !== null) {
      // The way in: a frame proud of the wall, a lintel, a step, and the door swung in (or shut and barred).
      for (const s of [-1, 1]) W.b(door + s * (dw + 0.04), 0, z1 + 0.02, 0.1, dh + 0.06, t + 0.08, beam);
      W.b(door, dh, z1 + 0.02, dw * 2 + 0.2, 0.1, t + 0.1, beam);
      W.b(door, 0, z1 + 0.22, dw * 2 + 0.1, 0.05, 0.26, 0x55505e);
      if (b.locked) {
        for (let i = 0; i < 4; i++) W.b(door - dw + 0.1 + i * 0.21, 0, z1 - 0.04, 0.19, dh, 0.06, jit(0x5a3d22, 0.12, r));
        W.c(door, dh * 0.55, z1 + 0.02, dw * 2.1, 0.09, 0.06, 0x2a1e14, 0, 0, 0.2);
      } else W.c(door - dw + 0.06, dh / 2, z1 - t - 0.3, 0.06, dh, 0.62, jit(0x5a3d22, 0.1, r), b.fate === 'wrecked' ? 0.9 : 0.35);
    }
    // Windows on the front either side of the door: warm when the fire's lit, dark when not.
    const lit = !!home?.lit && !charred;
    if (b.w >= 2.6 && H > 1.2) for (const fx of [0.22, 0.78]) {
      const wx = x0 + b.w * fx;
      if (door !== null && Math.abs(wx - door) < dw + 0.4) continue;
      W.b(wx, H * 0.42, z1 + 0.01, 0.46, 0.06, 0.06, beam);
      W.b(wx, H * 0.42 + 0.36, z1 + 0.01, 0.46, 0.06, 0.06, beam);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.04), lit ? G(0xffc070, 0.35) : G(0x0a0808, 1));
      pane.position.set(wx, H * 0.42 + 0.21, z1 + 0.005);
      group.add(pane);
    }
    const thatch = home?.thatch && b.kind === 'house';
    const ridge = gable(R, x0, x1, z0, z1, H, { col: thatch ? shade(0x8a7448, k) : shade(hex(L.roof), k), ridge: shade(hex(L.ridge), k), gable: wallC, thatch: !!thatch, holes: b.fate === 'wrecked' ? 0.25 : alight ? 0.12 : 0 }, r);
    if (alight) for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.9) fires.push([x, ridge - 0.1, (z0 + z1) / 2 + (r.next() - 0.5) * 0.6, 1.4]);
    if (alight && door !== null) fires.push([door, dh * 0.6, z1 - 0.3, 1]);
    // A chimney.
    if (b.kind === 'house' && !thatch) R.b(x1 - 0.6, H, z0 + 0.5, 0.3, ridge - H + 0.35, 0.3, shade(0x4a4652, k));
  } else {
    // Burned down: black beams fallen across, embers in the ash.
    for (let i = 0; i < 4; i++) W.c(x0 + r.next() * b.w, 0.1 + r.next() * 0.2, z0 + r.next() * b.h, 0.14, 0.12, b.h * 0.8, 0x141012, r.next() * 3, 0.2);
    W.b((x0 + x1) / 2, 0, (z0 + z1) / 2, b.w - 0.3, 0.05, b.h - 0.3, 0x1a1414);
    for (let i = 0; i < 5; i++) fires.push([x0 + 0.3 + r.next() * (b.w - 0.6), 0.08, z0 + 0.3 + r.next() * (b.h - 0.6), 0.25]);
  }
  if (b.kind === 'tower') tent(R, x0, x1, z0, z1, 0x3a3050, 0x4a3e66, r);
  const wm = W.mesh(VCOL), roof = R.mesh(VCOL);
  if (wm) group.add(wm);
  if (roof) group.add(roof);
  return { group, roof, fires, top: H + 1 };
}
