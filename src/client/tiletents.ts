/**
 * A tent the tile way (docs/design/tile-redraw.md, "Making a new asset"): the camp's ridge tents on the north fields
 * (shared/gatefieldscamp.ts) stood as the flat view's striped rectangle on its edge, a pallet. Here a ridge tent seen
 * as everything in the redraw is: its open end toward you (a triangle of canvas, the doorway a dark slit, one flap
 * lit), the two slopes of its roof running back from it up the screen, the nearer to the light paler, a seam every
 * few pixels, the ridge pole's end standing proud. Old undyed canvas in five shades, a dark outline, a stain on some.
 * Cosmetic only: the block is the room's; a hash of where it stands picks the stain, never Math.random.
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { KX, KZ } from './tilekit';
import { Grid, hash } from './tiletrees';

const COLS = ['#100e0b', '#2a2620', '#3b362c', '#4d4739', '#625b48', '#7a7159', '#3a2c1c', '#070605', '#3c1513'];
const POLE = 6, INSIDE = 7, STAIN = 8;

export function tentCut(b: Block): Cut {
  const W = Math.max(24, Math.round(b.w * KX)), D = Math.max(6, Math.round(b.h * KZ) - 2), tri = Math.min(30, Math.round(W * 0.56)), M = 3;
  const G = new Grid(W + M * 2, tri + D + 5), base = G.h - 2, cx = M + W / 2, v = Math.round(b.x * 31 + b.y * 17);
  for (let x = M; x < M + W; x++) {
    const t = Math.abs(x + 0.5 - cx) / (W / 2), front = Math.round(base - tri * (1 - t)), left = x + 0.5 < cx;
    // The roof, running back: lit on the side toward the light, a seam every seven pixels, the ridge brightest.
    for (let y = front - D; y < front; y++) G.set(x, y, Math.abs(x + 0.5 - cx) < 1 ? 5 : (x - M) % 7 === 3 ? (left ? 3 : 1) : left ? 4 : 2);
    // The open end: canvas a shade down from its roof, darker at the hem.
    for (let y = front; y <= base; y++) G.set(x, y, y >= base - 1 ? 1 : left ? 3 : 2);
  }
  // The doorway: a dark slit widening to the ground, the flap on the light's side turned back.
  const doorTop = Math.round(base - tri * 0.72);
  for (let y = doorTop; y <= base; y++) {
    const half = Math.max(1, Math.round(((y - doorTop) / (base - doorTop)) * 4));
    for (let x = Math.round(cx) - half; x < Math.round(cx) + half; x++) G.set(x, y, INSIDE);
    G.set(Math.round(cx) - half - 1, y, 5);
  }
  if (hash(v, 1, 91) < 0.5) for (let i = 0; i < 9; i++) G.set(M + 3 + Math.floor(hash(v, i, 92) * (W * 0.3)), base - 3 - Math.floor(hash(v, i, 93) * (tri * 0.4)), STAIN);
  G.outline(0);
  // The ridge pole's end over the door, and a peg and its line at each corner.
  G.set(Math.round(cx), base - tri - 1, POLE), G.set(Math.round(cx), base - tri - 2, POLE);
  for (const sx of [M - 2, M + W + 1]) G.set(sx, base, POLE), G.set(sx, base - 1, POLE), G.set(sx + (sx < cx ? 1 : -1), base - 2, POLE);
  return G.cut(COLS, Math.round(cx), base);
}
