/**
 * Each of Wickhold's halls looks like what it is from the street, in 3D (exterior.ts is the flat one),
 * by its door: the mage's tower's crooked slate cone and its slits lit odd colours; shields and a
 * banner on the barracks; antlers, pelts and log ends at the hunters' lodge; the church's empty belfry
 * and round window; casks and a lamp at the Drowned Rat; the forge's chimney stack and its horseshoes;
 * notices and a banner at the town hall; herbs drying at the infirmary; the counting house's fallen end.
 */
import * as THREE from 'three';
import { doorAt, type Block } from '../../shared/arena';
import { Boxes, Seed, jit } from './boxes';
import { asLamp } from './lamps3d';
import { G } from './mats';

/** The roof's span (x) left open: the counting house's fallen-in end. */
export const roofGap = (b: Block): [number, number] | undefined => (b.door === 'bank' ? [b.x + b.w * 0.58, b.x + b.w * 0.94] : undefined);

/** The tower's cone of slates, its tip bent over, a vane on it. Returns its top. */
export function cone(R: Boxes, x0: number, x1: number, z0: number, z1: number, h: number, r: Seed): number {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, half = Math.max(x1 - x0, z1 - z0) / 2 + 0.25, n = 12, tall = half * 2.4;
  for (let i = 0; i < n; i++) {
    const k = i / n, s = half * 2 * (1 - k) ** 0.9, bend = k ** 2.2 * 0.7;
    R.c(cx + bend, h + (i + 0.5) * (tall / n), cz, s, tall / n + 0.02, s, jit(i % 2 ? 0x3a3050 : 0x45385e, 0.06, r), (i * 0.13) % 0.8);
  }
  const top = h + tall;
  R.b(cx + 0.72, top, cz, 0.05, 0.4, 0.05, 0x2a2630);
  R.b(cx + 0.72, top + 0.36, cz, 0.42, 0.05, 0.05, 0x8a8494);
  R.b(cx + 0.9, top + 0.3, cz, 0.12, 0.05, 0.05, 0xd4a537);
  return top;
}

/** Dress a hall by its door: boxes onto W (walls, lit), glowing bits into `group`. `H` is its eave height. */
export function dressHall(W: Boxes, b: Block, H: number, group: THREE.Group, r: Seed): void {
  const x0 = b.x, x1 = b.x + b.w, z1 = b.y + b.h, f = z1 + 0.06, mid = b.door ? doorAt(b).x : (x0 + x1) / 2;
  const glow = (x: number, y: number, z: number, w: number, h: number, d: number, col: number, a = 0.2) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), G(col, a));
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  // A door lamp: lit with the town's other lamps, dark glass by day (lamps3d.ts).
  const lamp = (x: number, y: number, z: number) => asLamp(glow(x, y, z, 0.14, 0.2, 0.14, 0xffc070, 0.3), G(0x2a2420, 1));
  switch (b.door) {
    case 'tower': {
      // Slit windows lit violet, pale blue and the witchfire's green.
      const cols = [0xc9a8ff, 0x9fe8ff, 0x8aff7a, 0xc9a8ff];
      [[0.24, 0.8], [0.7, 0.62], [0.46, 0.45], [0.22, 0.3]].forEach(([fx, fy], i) => glow(x0 + b.w * fx, H * fy, f - 0.02, 0.1, 0.36, 0.06, cols[i], 0.1));
      return;
    }
    case 'hall':
      // The barracks: shields along the wall, red and blue, a banner over the door.
      for (let x = x0 + 0.5, i = 0; x < x1 - 0.4; x += 1.0, i++) {
        if (Math.abs(x - mid) < 0.8) continue;
        W.b(x, H * 0.45, f, 0.5, 0.56, 0.06, 0x2a1d12);
        W.b(x, H * 0.48, f + 0.03, 0.38, 0.44, 0.04, i % 2 ? 0x2a4a6a : 0x7a1d1d);
        W.b(x, H * 0.6, f + 0.05, 0.1, 0.1, 0.04, 0x8a8494);
      }
      W.b(mid, H * 0.68, f, 0.5, 0.56, 0.04, 0x5a1818), W.b(mid, H * 0.8, f + 0.02, 0.12, 0.16, 0.04, 0xd4a537);
      return;
    case 'lodge':
      // Log ends at the corners, antlers over the door, pelts drying on the wall, a bow.
      for (let y = 0.1; y < H; y += 0.26) for (const x of [x0 + 0.05, x1 - 0.05]) W.c(x, y + 0.1, f - 0.05, 0.22, 0.2, 0.2, jit(0x7a5a34, 0.1, r), 0, Math.PI / 2);
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) W.c(mid + s * (0.12 + i * 0.1), H * 0.9 + i * 0.05 + (i % 2) * 0.06, f + 0.04, 0.12, 0.04, 0.04, 0xd8ccb0, 0, 0, s * 0.5);
      for (let x = x1 - 1.6; x < x1 - 0.3; x += 0.48) W.b(x, H * 0.25, f, 0.34, 0.6, 0.04, jit(0x6a4a2e, 0.1, r));
      W.c(x0 + 0.7, H * 0.55, f + 0.02, 0.05, 0.9, 0.04, 0x6b4a2b, 0, 0, 0.15);
      return;
    case 'church': {
      // A round window over the door in coloured glass; an empty belfry on the ridge.
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
        const d = x * x + y * y;
        if (d > 5) continue;
        if (d > 3) W.b(mid + x * 0.11, H * 0.72 + y * 0.11, f, 0.11, 0.11, 0.06, 0x3e3a46);
        else glow(mid + x * 0.11, H * 0.72 + y * 0.11 + 0.05, f + 0.01, 0.11, 0.11, 0.05, (x + y) % 3 ? 0x3a4a8a : (x * y) % 2 ? 0x7a2a2a : 0xd4a537, 0.4);
      }
      const bx = x0 + b.w * 0.3, top = H + (b.h / 2) * Math.tan(0.62);
      for (const sx of [-0.35, 0.35]) for (const sz of [-0.35, 0.35]) W.b(bx + sx, top - 0.4, b.y + b.h / 2 + sz, 0.1, 1.2, 0.1, 0x6a6470);
      W.b(bx, top + 0.8, b.y + b.h / 2, 0.9, 0.12, 0.9, 0x4f4a5c);
      W.b(bx, top + 0.92, b.y + b.h / 2, 0.5, 0.3, 0.5, 0x3a3640);
      return;
    }
    case 'tavern':
      // Casks by the door, a lamp on its bracket.
      for (const x of [mid - 1.1, mid - 0.7]) W.b(x, 0, f + 0.2, 0.32, 0.44, 0.32, jit(0x6b4a2b, 0.08, r)), W.b(x, 0.14, f + 0.2, 0.34, 0.05, 0.34, 0x2a2630);
      W.b(mid + 0.5, H * 0.75, f + 0.1, 0.3, 0.04, 0.2, 0x2a2630);
      lamp(mid + 0.6, H * 0.62, f + 0.18);
      return;
    case 'forge':
      // A stone chimney stack up through the roof, horseshoes over the door, the quench barrel.
      W.b(x1 - 1.0, 0, b.y + 0.6, 0.6, H + 2.2, 0.6, 0x4a4652);
      W.b(x1 - 1.0, H + 2.2, b.y + 0.6, 0.7, 0.12, 0.7, 0x6a6470);
      glow(x1 - 1.0, H + 2.25, b.y + 0.6, 0.3, 0.04, 0.3, 0xff7a28, 0.2);
      for (const x of [mid - 0.45, mid + 0.45]) W.b(x, H * 0.82, f, 0.2, 0.04, 0.04, 0x8a8494), W.b(x - 0.08, H * 0.74, f, 0.04, 0.16, 0.04, 0x8a8494), W.b(x + 0.08, H * 0.74, f, 0.04, 0.16, 0.04, 0x8a8494);
      W.b(x0 + 0.6, 0, f + 0.25, 0.42, 0.5, 0.42, 0x5a3d22), W.b(x0 + 0.6, 0.5, f + 0.25, 0.34, 0.02, 0.34, 0x1e2a36);
      return;
    case 'townhall':
      // Notices nailed up by the door, the town's banner, worn steps.
      W.b(mid + 0.9, H * 0.4, f, 0.66, 0.56, 0.04, 0x4a3420);
      for (const [dx, dy] of [[0.72, 0.5], [0.98, 0.45], [0.82, 0.32]]) W.b(mid + dx, H * dy, f + 0.03, 0.2, 0.22, 0.02, 0xd8d0bc);
      W.b(x0 + 0.7, H * 0.4, f, 0.38, 0.78, 0.04, 0x5a1818), W.b(x0 + 0.7, H * 0.55, f + 0.02, 0.12, 0.18, 0.03, 0xd4a537);
      W.b(mid, 0, f + 0.3, 1.2, 0.08, 0.4, 0x6a6470);
      return;
    case 'bank': {
      // The fallen end: rafters still up, one across, rubble inside; a window boarded over.
      const [g0, g1] = roofGap(b)!;
      for (const x of [g0 + (g1 - g0) * 0.3, g0 + (g1 - g0) * 0.7]) W.c(x, H + 0.4, b.y + b.h / 2, 0.1, 0.1, b.h + 0.2, 0x4a3420, 0, 0.2);
      W.c((g0 + g1) / 2, H * 0.6, b.y + b.h / 2, g1 - g0, 0.1, 0.1, 0x5a3d22, 0.5, 0, 0.5);
      for (let i = 0; i < 8; i++) W.c(g0 + r.next() * (g1 - g0), 0.12, b.y + 0.3 + r.next() * (b.h - 0.6), 0.3, 0.2, 0.25, jit(0x3a3640, 0.2, r), r.next() * 3);
      W.b(x0 + 0.7, H * 0.45, f, 0.66, 0.5, 0.03, 0x14121a);
      for (const y of [0.5, 0.68]) W.b(x0 + 0.7, H * y, f + 0.03, 0.78, 0.1, 0.03, 0x6b4a2b);
      return;
    }
    case 'infirmary':
      // Herbs drying under the eaves, a lamp by the door.
      W.b((x0 + x1) / 2, H * 0.92, f + 0.05, b.w - 0.5, 0.03, 0.03, 0x8a7a5a);
      for (let x = x0 + 0.4, i = 0; x < x1 - 0.4; x += 0.38, i++) if (Math.abs(x - mid) > 0.5) W.b(x, H * 0.66, f + 0.05, 0.16, 0.34, 0.08, i % 2 ? 0x4a6a3a : 0x6a5a3a);
      lamp(mid + 0.6, H * 0.55, f + 0.1);
      return;
  }
}
