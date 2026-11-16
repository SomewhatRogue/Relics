/**
 * The new look's insides in 2.5D (docs/design/new-look-interiors.md): a room with `wallH` gets its walls run up to
 * that height in the kit's own stone or timber (so the inside reads as the same building as the outside), over the
 * painted back wall (ground.ts draws that face, its hangs and its low side walls, as for any room) and behind the
 * low side walls. Slice 1: plain tall walls. Pillars, galleries, beams, windows and the low front wall come next.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { WALL_H } from './ground';
import { mat, quad } from './streetkit';

/** The swatches are two tiles a copy (64 px at 32 a tile). */
const TILE = 0.5;

/** The tall walls for a room with `wallH`, or null. Disposed with `disposeInside`. */
export function insideKit(m: GameMap): THREE.Group | null {
  const H = m.wallH;
  if (!H) return null;
  const g = new THREE.Group(), wall = mat(m.theme.back === 'plaster' ? 'mat-timber' : 'mat-stone', true);
  const x0 = -0.9, x1 = m.w + 0.9, z0 = -1.1, z1 = m.h + 0.2;
  // The back wall, from the painted face's top up (the face itself is ground.ts's), a little proud so it overlaps.
  g.add(quad([x0, WALL_H - 0.05, 0.004], [x1, WALL_H - 0.05, 0.004], [x1, H, 0.004], [x0, H, 0.004], wall, 0, (x1 - x0) * TILE, H * TILE, WALL_H * TILE));
  // The side walls, full height, facing in.
  const d = (z1 - z0) * TILE;
  g.add(quad([x0, 0, z1], [x0, 0, z0], [x0, H, z0], [x0, H, z1], wall, 0, d, H * TILE));
  g.add(quad([x1, 0, z0], [x1, 0, z1], [x1, H, z1], [x1, H, z0], wall, 0, d, H * TILE));
  return g;
}

export function disposeInside(g: THREE.Group): void {
  g.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
}
