/**
 * Leeches on a hero (events {k:'leech', what: latch|drain|shake}, tracked in client/leechstate.ts; cosmetic): two or three small
 * dark leeches on the hero until they roll one off, each drain tick a little red drip. Drawing only.
 */
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';
import { leech } from './leechlie';
import { LEECH } from './leechstate';

export function drawLeechesOn(c: Ctx, h: Hero, x: number, y: number): void {
  const l = LEECH.latched.get(h.id);
  if (!l || h.act === 'down') return;
  const g = c.lit, now = c.now, k = Math.min(1, (now - l.since) / 0.25), n = 3, side = h.fx < -0.2 ? -1 : 1;
  const spots: [number, number, boolean][] = [[-6 * side - 1, -23, false], [5 * side - 1, -17, true], [-3 * side - 1, -9, false]];
  for (let i = 0; i < n; i++) leech(g, x + spots[i][0], y + spots[i][1] - (1 - k) * 4, 40 + i + h.x * 3, now, spots[i][2], k);
  const d = now - l.drip;
  if (d >= 0 && d < 0.55) {
    // A drop of blood off the first, falling.
    g.fillStyle = '#c01828', g.fillRect(Math.round(x + spots[0][0] + 1), Math.round(y + spots[0][1] + 3 + d * 34), 1, 2);
    c.glow.fillStyle = '#ff4050', c.glow.globalAlpha = 1 - d / 0.55, c.glow.fillRect(Math.round(x + spots[0][0] + 1), Math.round(y + spots[0][1] + 3 + d * 34), 1, 1), c.glow.globalAlpha = 1;
  }
}
