/**
 * The chain sickle's spin, seen (sim/sickle.ts decides it): the chain whirled out from the Rogue's hand to
 * the sickle at its reach, turning faster as the spin builds, and a faint ring on the floor where it cuts.
 * Drawn on the glow layer of either view through its projection `P(x, up, y)` (tiles), as spellground.ts is.
 */
import type { ArenaRoom } from '../sim/room';
import { spinBuild, spinning } from '../sim/sickle';
import { SICKLE_SPIN } from '../shared/sickle';

type Proj = (x: number, y: number, z: number) => [number, number];
type At = (key: string, x: number, y: number) => [number, number];

const CHAIN = ['#6a6470', '#9aa3ad'], BLADE = '#dfe6ee', RING = '#b7c0ca';

const dot = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number) => {
  g.globalAlpha = a;
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
};

export function drawSpins(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number, at?: At): void {
  for (const h of room.heroes) {
    if (!spinning(h)) continue;
    const [x, y] = at ? at('h:' + h.id, h.x, h.y) : [h.x, h.y], k = spinBuild(h), r = SICKLE_SPIN.r;
    // The ring it cuts: faint, firmer as it builds.
    const n = Math.max(20, Math.round(r * 2 * Math.PI * ppu * 0.5));
    for (let i = 0; i < n; i += 2) {
      const a = (i / n) * Math.PI * 2, [sx, sy] = P(x + Math.cos(a) * r, 0.02, y + Math.sin(a) * r);
      dot(g, sx, sy, RING, 0.15 + 0.3 * k);
    }
    // The chain out to the sickle, and a short trail behind it.
    const turn = room.time * (6 + 10 * k);
    for (const [lag, fade] of [[0, 1], [0.35, 0.45], [0.7, 0.2]] as const) {
      const a = turn - lag, steps = Math.max(8, Math.round(r * ppu * 0.5));
      for (let s = 1; s <= steps; s++) {
        const f = s / steps, [sx, sy] = P(x + Math.cos(a) * r * f, 0.5, y + Math.sin(a) * r * f);
        if (lag === 0) dot(g, sx, sy, CHAIN[s & 1], 0.9);
        else if (s === steps) dot(g, sx, sy, BLADE, fade);
      }
      if (lag === 0) {
        const [bx, by] = P(x + Math.cos(a) * r, 0.5, y + Math.sin(a) * r), [cx, cy] = P(x + Math.cos(a + 0.12) * r * 0.92, 0.5, y + Math.sin(a + 0.12) * r * 0.92);
        dot(g, bx, by, BLADE, 1), dot(g, cx, cy, BLADE, 1), dot(g, (bx + cx) / 2, (by + cy) / 2 - 1, BLADE, 1);
      }
    }
  }
  g.globalAlpha = 1;
}
