/**
 * What the pacing rules look like (sim/pacing.ts, chase.ts, bigone.ts; numbers shared/threat.ts), drawn
 * round a goblin in both views (client/strawman.ts drawFoe calls it):
 * - a held goblin jeers at its spot: it hops, and its blade flicks up and bangs down, a spark on each bang;
 * - a sprint's tell: the goblin leans forward (`lean`) and dust kicks out at its feet, then a little
 *   more while it bursts;
 * - a BIG ONE: drawn bigger, a goblin skull on a stake over its shoulder, and its name tag over its head.
 * Nothing here changes the fight; every clock is one the room sent.
 */
import { BIG, SPRINT } from '../shared/tuning';
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';
import { drawText, textWidth } from './pixfont';

/** The word over a BIG ONE (one place, for the lore pass). */
export const BIG_TAG = 'BIG ONE';

/** Where to draw the body this frame, and how big: a jeer's hop, a sprint's lean. */
export function paceOffset(c: Ctx, e: Enemy): { dx: number; dy: number; k: number } {
  const t = c.t ?? c.now, k = e.big ? BIG.size : 1;
  if (e.act === 'dead') return { dx: 0, dy: 0, k };
  if (e.held) return { dx: 0, dy: -Math.abs(Math.round(Math.sin(c.now * 7 + e.id) * 2)), k };
  const s = t - (e.sprintAt ?? -99);
  if (s >= 0 && s < SPRINT.lean) return { dx: Math.round(e.fx * 2), dy: 1, k };
  return { dx: 0, dy: 0, k };
}

/** The sprint's dust, kicked out to both sides at its feet (drawn over the body, unlit, so the tell reads in the dark). */
export function drawPaceDust(c: Ctx, e: Enemy, x: number, y: number): void {
  if (e.act === 'dead') return;
  const t = c.t ?? c.now, s = t - (e.sprintAt ?? -99), d = c.glow;
  if (s < 0 || s > SPRINT.lean + SPRINT.burst) return;
  const lean = s < SPRINT.lean;
  d.fillStyle = '#c0b090';
  for (let i = 0; i < (lean ? 6 : 4); i++) {
    const side = i % 2 ? 1 : -1, age = lean ? 0.2 + 0.6 * (s / SPRINT.lean) : (c.now * 3 + i * 0.25) % 1, out = 4 + Math.floor(i / 2) * 2 + age * 4;
    d.globalAlpha = 0.85 * (1 - age * 0.6);
    d.fillRect(Math.round(x + side * out - e.fx * 2), Math.round(y - age * 4 - (i % 3)), lean ? 3 : 2, 2);
  }
  d.globalAlpha = 1;
}

/** Over the body: a held goblin's bang, a BIG ONE's trophy and name. */
export function drawPaceOver(c: Ctx, e: Enemy, x: number, y: number): void {
  if (e.act === 'dead') return;
  const g = c.glow;
  if (e.held) {
    // The blade banged on the ground (or a shield) on the beat: a pale spark at its feet.
    const beat = (c.now * 2.4 + e.id * 0.37) % 1;
    if (beat < 0.18) {
      g.fillStyle = '#f0e6c8';
      const f = e.fx >= 0 ? 1 : -1;
      for (const [dx, dy] of [[0, 0], [-1, -1], [1, -1], [0, -2]]) g.fillRect(Math.round(x + f * 5 + dx), Math.round(y - 3 + dy), 1, 1);
    }
  }
  if (!e.big) return;
  const tall = e.kind === 'butcher' ? 30 : 22, k = BIG.size, top = Math.round(y - tall * k), f = e.fx >= 0 ? -1 : 1;
  // A goblin skull on a stake over its shoulder.
  const l = c.lit;
  l.fillStyle = '#5a4030';
  l.fillRect(Math.round(x + f * 6), top + 2, 1, 12);
  l.fillStyle = '#d8d0b8';
  l.fillRect(Math.round(x + f * 6) - 1, top, 3, 3);
  l.fillStyle = '#2a2020';
  l.fillRect(Math.round(x + f * 6) - 1, top + 1, 1, 1), l.fillRect(Math.round(x + f * 6) + 1, top + 1, 1, 1);
  // Its name tag.
  const w = textWidth(BIG_TAG);
  g.fillStyle = '#1a1012';
  g.globalAlpha = 0.7;
  g.fillRect(Math.round(x - w / 2) - 1, top - 9, w + 2, 7);
  g.globalAlpha = 1;
  drawText(g, BIG_TAG, Math.round(x - w / 2), top - 8, '#ffcf5a');
}
