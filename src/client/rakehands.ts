/**
 * Rakehead's four in the Open Cut (docs/design/instances.md, art pass slice 6): goblins a size up (foes.ts),
 * each known by what it carries in place of a club. THE DROVER a goad and a coil of rope on the shoulder; THE
 * BRAKESMAN a great iron lever, gloves and a chain at the belt; THE RAKER a long rake; THE SLUICER a bucket,
 * dripping. Drawn in the old pixels on the goblin pen (gobpen.ts), from the hand as the body posed it. The tool
 * swings back through the wind-up and comes forward on the blow, from the room's own attack clock. Looks only.
 */
import { CUT_NAMES } from '../shared/opencutwords';
import type { Enemy } from '../sim/types';
import { line, type Ctx } from './draw';

export type Rake = 'drover' | 'brakesman' | 'raker' | 'sluicer';
const BY_NAME = new Map<string, Rake>(Object.entries(CUT_NAMES).map(([k, v]) => [v, k as Rake]));

/** Which of the four this is, or null. */
export const rakeOf = (e: Enemy): Rake | null => (e.name ? BY_NAME.get(e.name) ?? null : null);

/** The tool's angle: at rest along the facing, drawn back through the wind-up, thrown forward on the blow. */
function toolAngle(e: Enemy, f: number): number {
  const fa = Math.atan2(e.fy, e.fx), a = e.attack;
  if (!a) return fa + f * 1.1;
  if (a.t < a.windup) return fa - f * (1.1 + 1.4 * (a.t / a.windup));
  if (a.t < a.windup + a.active + 0.1) return fa;
  return fa + f * 0.5;
}

/** Its tool at the hand (hx, hy), feet at (bx, by), all in the old pixels on the pen `c`. */
export function drawRakeTool(c: Ctx, e: Enemy, who: Rake, bx: number, by: number, hx: number, hy: number, now: number): void {
  const f = e.fx < -0.2 ? -1 : 1, a = toolAngle(e, f), g = c.lit, nx = -Math.sin(a), ny = Math.cos(a);
  if (who === 'drover') {
    // The goad, and the rope coiled over the off shoulder.
    line(g, hx, hy, a, -2, 11, '#6b4a2b');
    line(g, hx, hy, a, 10, 12, '#9a8a6a');
    g.fillStyle = '#a89a72';
    for (let i = 0; i < 10; i++) {
      const q = (i / 10) * Math.PI * 2;
      g.fillRect(Math.round(bx - f * 3 + Math.cos(q) * 2.2), Math.round(by - 9 + Math.sin(q) * 1.4), 1, 1);
    }
  } else if (who === 'brakesman') {
    // A great iron lever, its grip wound in leather, a knob on the end; gloved hands; a chain at the belt.
    line(g, hx, hy, a, -4, 13, '#5a5660', 2);
    line(g, hx, hy, a, -4, -1, '#5a3d22', 2);
    g.fillStyle = '#8a8696';
    g.fillRect(Math.round(hx + Math.cos(a) * 13) - 1, Math.round(hy + Math.sin(a) * 13) - 1, 3, 3);
    g.fillStyle = '#2a2018';
    g.fillRect(Math.round(hx) - 1, Math.round(hy) - 1, 2, 2);
    g.fillStyle = '#7a7684';
    for (let i = -3; i <= 3; i += 2) g.fillRect(Math.round(bx + i), Math.round(by - 4 + (i % 4 ? 0 : 1)), 1, 1);
  } else if (who === 'raker') {
    // A long rake: the haft, a crossbar at its head and the tines off it.
    line(g, hx, hy, a, -3, 15, '#7a5a38');
    const tx = hx + Math.cos(a) * 15, ty = hy + Math.sin(a) * 15;
    line(g, tx - nx * 3, ty - ny * 3, a + Math.PI / 2, 0, 6, '#8a8690');
    for (let i = -3; i <= 3; i += 2) line(g, tx + nx * i, ty + ny * i, a, 0, 2, '#b0acb8');
  } else {
    // A bucket in the hand, slopping; water running off it.
    g.fillStyle = '#5a4a3a';
    g.fillRect(Math.round(hx) - 2, Math.round(hy), 4, 4);
    g.fillStyle = '#8a8690';
    g.fillRect(Math.round(hx) - 2, Math.round(hy), 4, 1);
    g.fillStyle = '#4a6a8a';
    g.fillRect(Math.round(hx) - 1, Math.round(hy) + 1, 2, 1);
    g.fillStyle = '#6a8aaa';
    for (let i = 0; i < 4; i++) {
      const k = (now * (0.9 + i * 0.2) + i * 0.29) % 1;
      g.fillRect(Math.round(bx - 3 + i * 2), Math.round(by - 11 + k * 11), 1, 1);
    }
  }
}
