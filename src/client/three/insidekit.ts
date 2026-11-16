/**
 * The new look's insides in 2.5D (docs/design/new-look-interiors.md): a room with `wallH` gets its walls run up to
 * that height in the kit's own stone or timber (so the inside reads as the same building as the outside), over the
 * painted back wall (ground.ts draws that face, its hangs and its low side walls, as for any room) and behind the
 * low side walls; the floor's marks laid back over the kit's floor; plates and beams along the top, posts down a
 * timbered wall; a low front wall across the cutaway with the door's gap; then the room's own dressing
 * (insidedress.ts: windows and moonlight, galleries, arches, banners, chimneys).
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { Boxes, Seed, jit } from './boxes';
import { WALL_H } from './ground';
import { DRESS, windows } from './insidedress';
import { beam, markMesh } from './insideparts';
import { VCOL } from './mats';
import { mat, quad } from './streetkit';

/** The swatches are two tiles a copy (64 px at 32 a tile). */
const TILE = 0.5;

const GLOW = new THREE.MeshBasicMaterial({ vertexColors: true });

/** The tall walls and the dressing for a room with `wallH`, or null. Disposed with `disposeInside`. */
export function insideKit(m: GameMap): THREE.Group | null {
  const H = m.wallH;
  if (!H) return null;
  const g = new THREE.Group(), B = new Boxes(), glow = new Boxes(), r = new Seed(m.w * 13 + m.h * 7), dress = DRESS[m.name];
  const timber = m.theme.back === 'plaster', wall = mat(timber ? 'mat-timber' : 'mat-stone', true);
  const x0 = -0.9, x1 = m.w + 0.9, z0 = -1.1, z1 = m.h + 0.2, keep = (o: THREE.Mesh) => ((o.userData.keep = true), o);
  // The back wall, from the painted face's top up (the face itself is ground.ts's), a little proud so it overlaps.
  g.add(keep(quad([x0, WALL_H - 0.05, 0.004], [x1, WALL_H - 0.05, 0.004], [x1, H, 0.004], [x0, H, 0.004], wall, 0, (x1 - x0) * TILE, H * TILE, WALL_H * TILE)));
  // The side walls, full height, facing in.
  const d = (z1 - z0) * TILE;
  g.add(keep(quad([x0, 0, z1], [x0, 0, z0], [x0, H, z0], [x0, H, z1], wall, 0, d, H * TILE)));
  g.add(keep(quad([x1, 0, z0], [x1, 0, z1], [x1, H, z1], [x1, H, z0], wall, 0, d, H * TILE)));
  // Plates along the walls' tops, rafter ends out of them, tie beams near the back (never across the room, where
  // they'd hide the floor), and posts down a timbered wall.
  B.b(x0 + 0.2, H - 0.35, (z0 + z1) / 2, 0.4, 0.35, z1 - z0, 0x2a1d12), B.b(x1 - 0.2, H - 0.35, (z0 + z1) / 2, 0.4, 0.35, z1 - z0, 0x2a1d12);
  B.b((x0 + x1) / 2, H - 0.35, -0.2, x1 - x0, 0.35, 0.4, 0x2a1d12);
  for (let z = 0.5; z < m.h; z += 2) for (const x of [x0 + 0.5, x1 - 0.5]) B.b(x, H - 0.75, z, 0.6, 0.24, 0.22, jit(0x3a2818, 0.05, r));
  beam(B, x0, x1, 0.9, H - 0.1, r);
  if (timber) for (let z = 1; z < m.h; z += 3) for (const x of [x0 + 0.08, x1 - 0.08]) B.b(x, 0, z, 0.16, H, 0.26, jit(0x2a1d12, 0.04, r));
  // The low front wall across the cutaway, cut for the door (or the forge's open mouth), a post either side.
  const gap = dress?.gap ?? (m.exit ? m.exit.w + 0.6 : 2.6), mid = m.exit ? m.exit.x + m.exit.w / 2 : m.w / 2, ga = mid - gap / 2, gb = mid + gap / 2;
  for (const [a, b] of [[x0, ga], [gb, x1]]) if (b - a > 0.1) {
    B.b((a + b) / 2, 0, m.h + 0.45, b - a, 0.9, 0.5, jit(timber ? 0x3a2818 : 0x3e3a46, 0.04, r));
    B.b((a + b) / 2, 0.9, m.h + 0.45, b - a, 0.1, 0.6, timber ? 0x2a1d12 : 0x57525e);
  }
  for (const x of [ga, gb]) B.b(x, 0, m.h + 0.45, 0.36, 1.4, 0.6, timber ? 0x2a1d12 : 0x4a4652);
  // The floor's marks back over the kit's floor.
  for (const k of m.marks ?? []) {
    const mm = markMesh(k, dress?.rug ?? 0x4a2a1e, r);
    if (mm) g.add(mm);
  }
  if (dress) windows(g, m, dress.wins, r), dress.build?.(B, glow, g, m, r);
  const lit = B.mesh(VCOL), bright = glow.mesh(GLOW, false);
  if (lit) g.add(keep(lit));
  if (bright) g.add(keep(bright));
  return g;
}

/** Free what the room made for itself (the kit's own materials are shared and stay). */
export function disposeInside(g: THREE.Group): void {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.geometry) return;
    m.geometry.dispose();
    if (m.userData.keep) return;
    const mt = m.material as THREE.MeshBasicMaterial;
    if (mt.map && !(mt.map as THREE.Texture & { shared?: boolean }).shared) mt.map.dispose();
    mt.dispose();
  });
}
