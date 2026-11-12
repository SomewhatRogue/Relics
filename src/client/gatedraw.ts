/**
 * An instance's gate between stretches (sim/stretches.ts), drawn straight onto the lit layer each frame: shut, a
 * heavy timber gate banded with iron between two posts under a lintel; open (`ruined`: no longer solid), the posts
 * and the lintel only, the gate hauled up out of the way. Its footprint is the block; it stands `GATE_TALL` above it.
 */
import type { Block } from '../shared/arena';
import type { Ctx } from './draw';
import { PX } from './world';

const GATE_TALL = 18;

export function drawGate(c: Ctx, b: Block, x: number, y: number): void {
  const g = c.lit, w = Math.round(b.w * PX), d = Math.round(b.h * PX), X = Math.round(x), top = Math.round(y) - GATE_TALL;
  const cv = g.canvas;
  if (X > cv.width + 20 || X + w < -20 || top > cv.height + 20 || top + GATE_TALL + d < -20) return;
  const rect = (rx: number, ry: number, rw: number, rh: number, col: string) => ((g.fillStyle = col), g.fillRect(X + rx, top + ry, rw, rh));
  const H = GATE_TALL + d;
  // Posts and lintel.
  rect(0, 0, 4, H, '#3a2a1a'), rect(w - 4, 0, 4, H, '#3a2a1a'), rect(0, 0, w, 4, '#4a3420'), rect(0, 4, w, 1, '#1e1610');
  rect(1, 1, 1, H - 2, '#5a4430'), rect(w - 3, 1, 1, H - 2, '#5a4430');
  if (b.ruined) {
    // Hauled up: the bottom of it under the lintel.
    for (let rx = 5; rx < w - 5; rx += 4) rect(rx, 5, 3, 3, '#4a3a28');
    rect(4, 8, w - 8, 1, '#1e1610');
    return;
  }
  // Shut: upright timbers, two iron bands with studs.
  for (let rx = 4; rx < w - 4; rx += 4) rect(rx, 5, 3, H - 6, (rx >> 2) % 2 ? '#4a3a28' : '#56442e'), rect(rx + 3, 5, 1, H - 6, '#2a1e14');
  for (const ry of [Math.round(H * 0.32), Math.round(H * 0.72)]) {
    rect(4, ry, w - 8, 2, '#3a3a40');
    for (let rx = 6; rx < w - 6; rx += 6) rect(rx, ry, 1, 1, '#8a8a94');
  }
  rect(0, H - 1, w, 1, '#120e0a');
}
