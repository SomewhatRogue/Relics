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
import { asBuilt, chimneyOf, houseColours, houseOf, leanW } from '../cottage';
import type { House } from '../../shared/houses';
import { Boxes, Seed, jit } from './boxes';
import { G, VCOL, hex } from './mats';
import { gable } from './roofs3d';
import { cone, dressHall, roofGap } from './halls3d';
import { flatBlock } from './walls3d';
import { woodpile } from './woodpile3d';
import type { Kindling } from '../../shared/kindling';
import { asLamp, lampMeshes } from './lamps3d';
import { doorGlow, shutDoor } from './shut3d';

/** Eave height (tiles) by kind. */
// (Walls 1.7 times their first height since the heroic proportions, Kyle 2026-11-12: "houses now look way too tiny";
// the heroes stand near two tiles, a house's wall a head over them, as the flat view's: ../blocklook.ts.)
export const TALL: Partial<Record<Block['kind'], number>> = { house: 2.45, barn: 3.2, hall: 2.7, church: 4.1, forge: 3.05, tavern: 2.9, granary: 3.2, tower: 6.1, shack: 1.6, den: 1.2 };
const ROOFED = new Set<Block['kind']>(['house', 'barn', 'hall', 'church', 'forge', 'tavern', 'granary', 'tower', 'shack', 'den']);
const STONE = new Set<Block['kind']>(['church', 'forge', 'tower', 'hall']);

export interface Built {
  group: THREE.Group;
  roof: THREE.Mesh | null;
  /** Where flames go (burning), x y z and size. */
  fires: [number, number, number, number][];
  /** Its footprint and how high it stands (for lifting the roof when you're behind it). */
  top: number;
  /** Lamp meshes (lit windows, a door lamp), lit or dark by the hour (lamps3d.ts). */
  lamps: THREE.Mesh[];
}

/** 0 standing, 1 charred, 2 burned down; and whether it's alight. */
export const blockState = (b: Block) => (b.ruined ? 2 : b.maxHp && (b.hp ?? 0) < b.maxHp * 0.5 ? 1 : 0) * 2 + (((b.burning ?? -1) >= 0 || b.fate === 'burning' || b.smoulder) && !b.ruined ? 1 : 0);

/**
 * Where a cottage's chimney stands (x, its top, z), as the flat view places it (cottage.ts), or a town
 * house's at its back corner; null for anything but a house. Smoke rises from here (smoke3d.ts).
 */
export function chimneyAt(b: Block, home: House | null): [number, number, number] | null {
  if (b.kind !== 'house') return null;
  const H = TALL.house!, top = H + (b.h / 2) * Math.tan(0.62) + 0.35;
  return [home ? b.x + (chimneyOf(asBuilt(b, home), Math.round(b.w * 16)) + 3) / 16 : b.x + b.w - 0.6, top, b.y + 0.5];
}

const shade = (c: number, k: number) => {
  const col = new THREE.Color(c);
  return col.setRGB(col.r * k, col.g * k, col.b * k).getHex();
};

export function buildBlock(b: Block, kin?: Kindling | null): Built {
  const group = new THREE.Group(), fires: Built['fires'] = [];
  if (!ROOFED.has(b.kind)) return { group: flatBlock(b, group, fires), roof: null, fires, top: 1, lamps: [] };
  const st = blockState(b), ruined = st >= 4, alight = st % 2 === 1, charred = st >= 2 || alight || b.shut === 'burnt';
  const r = new Seed(Math.round(b.x * 31 + b.y * 17 + 7)), L = LOOK[b.kind], home = houseOf(b), hc = home ? houseColours(b, home) : null;
  const k = charred ? 0.45 : 1, wallC = shade(hex(hc?.wall ?? L.wall), k), beam = shade(0x3a2a1e, k);
  // A cottage's lean-to takes one side of its footprint (cottage.ts); the house proper is the rest.
  const lean = home && b.kind === 'house' ? asBuilt(b, home).leanTo : 0, lw = lean ? leanW(asBuilt(b, home!), Math.round(b.w * 16)) / 16 : 0;
  const x0 = b.x + (lean < 0 ? lw : 0), x1 = b.x + b.w - (lean > 0 ? lw : 0), z0 = b.y, z1 = b.y + b.h, H = TALL[b.kind] ?? 1.4, t = 0.2;
  const W = new Boxes(), R = new Boxes(), stone = STONE.has(b.kind) || b.style === 'stone';
  const door = !!b.door && b.fate !== 'blocked' ? doorAt(b).x : null, dw = 0.45, dh = Math.min(2.05, H - 0.3);
  // A wall from a0 to a1 along x (front or back) or z (sides), courses of stone or planks.
  const wall = (ax: 'x' | 'z', a0: number, a1: number, c: number, y0: number, y1: number) => {
    const ch = stone ? 0.3 : 0.24;
    // Mortar (or the boards' backing) behind the courses, so a seam shows a dark line, never a hole through.
    if (!ruined && a1 - a0 > 0.05) {
      const m = shade(wallC, 0.6), l = a1 - a0, mc = (a0 + a1) / 2;
      if (ax === 'x') W.b(mc, y0, c, l, y1 - y0 - 0.02, t - 0.08, m);
      else W.b(c, y0, mc, t - 0.08, y1 - y0 - 0.02, l, m);
    }
    for (let y = y0, row = 0; y < y1 - 0.01; y += ch, row++) {
      const top = ruined ? 0.15 + r.next() * 0.55 : y1;
      if (y > top) continue;
      let a = a0 - (row % 2 ? 0.25 : 0);
      while (a < a1) {
        const len = stone ? 0.45 + r.next() * 0.4 : 0.9 + r.next() * 0.8, sa = Math.max(a, a0), sb = Math.min(a + len, a1);
        a += len;
        if (sb - sa < 0.06) continue;
        const soot = b.worn && y < H * 0.7 && r.next() < 0.7 ? 0.45 + (y / H) * 0.6 : 1;
        const hh = Math.min(ch, y1 - y) - 0.03, col = ruined ? jit(0x141012, 0.3, r) : jit(shade(wallC, soot), stone ? 0.14 : 0.1, r);
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
    W.b((x0 + x1) / 2, 0, (z0 + z1) / 2, b.w - 0.3, 0.02, b.h - 0.3, 0x24180f);
    R.b((x0 + x1) / 2, H - 0.12, (z0 + z1) / 2, b.w - 0.3, 0.06, b.h - 0.3, 0x0c0a0a);
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
    // Windows on the front either side of the door, warm while the lamps are lit (blocks.ts): a cottage's
    // only when its fire's going, a town building's (not the tower) by the hour. A worn one (wear.ts) has
    // the right window boarded and the left one's shutter hanging off its hinge.
    const lit = (home ? home.lit && !b.shut : L.windows && !b.maxHp && b.door !== 'tower') && !charred, bw = x1 - x0;
    if (bw >= 2.6 && H > 1.2 && b.door !== 'tower') for (const fx of [0.22, 0.78]) {
      const wx = x0 + bw * fx, boarded = (b.worn && fx > 0.5) || b.shut === 'boarded';
      if (door !== null && Math.abs(wx - door) < dw + 0.4) continue;
      // (Sized to the tall heroes: the sill at their chests.)
      W.b(wx, H * 0.42, z1 + 0.01, 0.64, 0.07, 0.06, beam);
      W.b(wx, H * 0.42 + 0.52, z1 + 0.01, 0.64, 0.07, 0.06, beam);
      W.b(wx, H * 0.42 + 0.07, z1 + 0.012, 0.05, 0.45, 0.05, beam);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.04), lit && !boarded ? G(0xffc070, 0.35) : G(0x0a0808, 1));
      if (lit && !boarded) asLamp(pane, G(0x0a0808, 1));
      pane.position.set(wx, H * 0.42 + 0.3, z1 + 0.005);
      group.add(pane);
      if (boarded) for (const [dy, c, rz] of [[0.18, 0x7a5a34, 0.25], [0.38, 0x6b4a2b, -0.2]] as const) W.c(wx, H * 0.42 + dy, z1 + 0.05, 0.78, 0.09, 0.03, c, 0, 0, rz);
      else if (b.worn) W.c(wx - 0.37, H * 0.42 + 0.17, z1 + 0.08, 0.06, 0.5, 0.26, shade(0x4a3420, k), 0.5, 0, 0.3);
    }
    // Shut for good (../shutdraw.ts): planks over where the door was, or a black hole burnt through.
    if (home && b.shut) shutDoor(W, b, z1, dh, r, group);
    // Enterable: firelight moving in the doorway, seen from down the street.
    if (home && door !== null && !b.shut && !alight && b.fate !== 'burning') doorGlow(group, door, dh, z1, dw);
    // A den has no door, only a dark mouth, and eyes in the dark of it (blocks.ts).
    if (b.kind === 'den' && door === null) {
      const mx = (x0 + x1) / 2;
      W.b(mx, 0, z1 + 0.01, 0.5, Math.min(H - 0.06, 0.62), 0.03, 0x0d0b10);
      for (const s of [-1, 1]) {
        const e = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.03), G(0xff4a3a, 0.2));
        e.position.set(mx + s * 0.09, 0.44, z1 + 0.03);
        group.add(e);
      }
    }
    const thatch = home && asBuilt(b, home).thatch && b.kind === 'house';
    const holes = b.fate === 'wrecked' ? 0.25 : alight ? 0.12 : 0, worn = home?.broken || b.worn ? 0.05 : 0;
    const ridge = b.kind === 'tower' ? cone(R, x0, x1, z0, z1, H, r) : gable(R, x0, x1, z0, z1, H, { col: shade(hex(hc?.roof ?? L.roof), k), ridge: shade(hex(hc?.line ?? L.ridge), k), gable: wallC, thatch: !!thatch, holes, worn, gap: roofGap(b) }, r);
    if (lw) {
      // The lean-to: lower, rough boards, a plank roof falling away from the house.
      const lx0 = lean < 0 ? b.x : x1, lh = H * 0.68, lc = lx0 + lw / 2;
      W.b(lc, 0, (z0 + z1) / 2, lw - 0.04, lh, b.h - 0.12, shade(0x4a3420, k));
      for (let x = lx0 + 0.1; x < lx0 + lw - 0.05; x += 0.19) W.b(x, 0.02, z1 - 0.05, 0.03, lh - 0.04, 0.02, shade(0x3a2818, k));
      R.c(lc, lh + 0.1 + lw * 0.14, (z0 + z1) / 2, lw + 0.2, 0.07, b.h + 0.3, shade(0x4a3a2a, k), 0, 0, lean < 0 ? 0.28 : -0.28);
    }
    if (b.label && b.door && !charred) dressHall(W, b, H, group, r);
    if (alight) for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.9) fires.push([x, ridge - 0.1, (z0 + z1) / 2 + (r.next() - 0.5) * 0.6, 1.4]);
    if (alight && door !== null) fires.push([door, dh * 0.6, z1 - 0.3, 1]);
    // A chimney (cottage.ts places a cottage's), stone with a dark cap.
    const ch = chimneyAt(b, home);
    if (ch) R.b(ch[0], H, ch[2], 0.36, ch[1] - H, 0.32, shade(0x57525e, k)), R.b(ch[0], ch[1] - 0.06, ch[2], 0.38, 0.06, 0.34, shade(0x2a2733, k));
  } else {
    // Burned down: black beams fallen across, embers in the ash.
    for (let i = 0; i < 4; i++) W.c(x0 + r.next() * b.w, 0.1 + r.next() * 0.2, z0 + r.next() * b.h, 0.14, 0.12, b.h * 0.8, 0x141012, r.next() * 3, 0.2);
    W.b((x0 + x1) / 2, 0, (z0 + z1) / 2, b.w - 0.3, 0.05, b.h - 0.3, 0x1a1414);
    for (let i = 0; i < 5; i++) fires.push([x0 + 0.3 + r.next() * (b.w - 0.6), 0.08, z0 + 0.3 + r.next() * (b.h - 0.6), 0.25]);
  }
  if (kin) woodpile(W, kin, alight, ruined);
  const wm = W.mesh(VCOL), roof = R.mesh(VCOL);
  if (wm) group.add(wm);
  if (roof) group.add(roof);
  return { group, roof, fires, top: H + 1, lamps: lampMeshes(group) };
}
