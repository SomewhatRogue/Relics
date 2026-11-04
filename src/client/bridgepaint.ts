/**
 * A bridge broken in the middle, painted on the floor (both views; three/ground.ts stands its ends up a
 * little and hangs the rope in 3D). Its two ends still reach out over the water, boards across, beams
 * along the sides, and they end in snapped and splintered boards with a gap of deep water between. A
 * rope hangs from the far end into the river; a beam slants down off the near end. The `bridge` mark
 * spans both ends and the gap (shared/river.ts).
 */
import type { Rng } from '../shared/rng';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

const BOARDS = ['#6a4a2c', '#5e4228', '#735030', '#563c24'];

/** One end of the deck, `len` px from its bank at y0, running down (dir 1) or up (dir -1), its tip ragged. */
function deckEnd(rect: Rect, rng: Rng, x: number, y0: number, w: number, len: number, dir: 1 | -1): void {
  for (let i = 0; i < len; i += 3) {
    const y = dir > 0 ? y0 + i : y0 - i - 2, last = i + 3 >= len;
    // The last boards are snapped off short, each at its own length, splinters pale at the break.
    for (let x0 = x + 2; x0 < x + w - 2; x0 += 4) {
      if (last && rng.next() < 0.45) continue;
      const bw = Math.min(4, x + w - 2 - x0);
      rect(x0, y, bw - 1, 2, BOARDS[rng.int(BOARDS.length)]);
      if (last) rect(x0 + rng.int(Math.max(1, bw - 1)), y + (dir > 0 ? 2 : -1), 1, 1, '#c8a878');
    }
    rect(x + 2, y + 2, w - 4, 1, '#2a1c10');
  }
  // The side beams, one snapped a little shorter than the other.
  const a = len + 2, b = len - 2 - rng.int(3);
  rect(x, dir > 0 ? y0 : y0 - a, 2, a, '#3e2a18'), rect(x + w - 2, dir > 0 ? y0 : y0 - b, 2, b, '#3e2a18');
  rect(x, dir > 0 ? y0 + a - 1 : y0 - a, 2, 1, '#b89868'), rect(x + w - 2, dir > 0 ? y0 + b - 1 : y0 - b, 2, 1, '#b89868');
}

export function paintBridge(rect: Rect, rng: Rng, x: number, y: number, w: number, h: number): void {
  const len = Math.round(h * 0.36);
  deckEnd(rect, rng, x, y, w, len, 1);
  deckEnd(rect, rng, x, y + h, w, len, -1);
  // Posts at the corners: tall at the banks, broken short at the snapped ends.
  for (const px of [x - 1, x + w - 2]) {
    rect(px, y - 4, 3, 6, '#2e1e12'), rect(px, y - 4, 3, 1, '#6a5038');
    rect(px, y + h - 3, 3, 5, '#2e1e12'), rect(px, y + h - 3, 3, 1, '#6a5038');
    rect(px, y + len - 3, 3, 3, '#2e1e12'), rect(px, y + h - len, 3, 3, '#2e1e12');
  }
  // The gap: a gouge of white water where the current runs through the stumps of the piers.
  const g0 = y + len + 2, g1 = y + h - len - 2;
  for (let i = 0; i < 4; i++) rect(x + 3 + rng.int(Math.max(1, w - 8)), g0 + rng.int(Math.max(1, g1 - g0)), 4, 1, '#9ab8bc');
  rect(x + 3, g0 + Math.floor((g1 - g0) / 2), 3, 3, '#2a2420'), rect(x + w - 7, g0 + Math.floor((g1 - g0) / 2) - 2, 3, 3, '#2a2420');
  // A rope off the far end, hanging into the water; a beam slanting down off the near end.
  const rx = x + w - 6;
  for (let j = 0; j < Math.max(4, (g1 - g0) * 0.7); j++) rect(rx + (j % 4 < 2 ? 0 : 1), g0 - 2 + j, 1, 1, '#9a8a62');
  rect(rx - 1, g0 - 2 + Math.round(Math.max(4, (g1 - g0) * 0.7)), 4, 1, '#c8dcdc');
  for (let k = 0; k < 9; k++) rect(x + 4 + k, Math.round(g1 - k * 0.6), 2, 2, k % 3 ? '#4a3420' : '#2a1e14');
}
