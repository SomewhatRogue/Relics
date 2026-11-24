/**
 * The chain sickle's spin, seen (sim/sickle.ts decides it): the chain whirled round the Rogue's hand (on the weapon
 * side, at arm height) out to
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
    // The whirl turns round the hand that holds the chain, out to the weapon side, not round the body's middle.
    const side = h.fx >= -0.2 ? 1 : -1, hx = x + h.fx * 0.25 + (Math.abs(h.fy) > 0.7 ? side * 0.28 : 0), hy = y + h.fy * 0.25, HAND = 0.65;
    const turn = room.time * (3.5 + 6 * k), dir = 1;
    // The ring it cuts, faint on the floor, firmer as it builds.
    const n = Math.max(24, Math.round(r * 2 * Math.PI * ppu * 0.5));
    for (let i = 0; i < n; i += 3) {
      const a = (i / n) * Math.PI * 2, [sx, sy] = P(x + Math.cos(a) * r, 0.02, y + Math.sin(a) * r);
      dot(g, sx, sy, RING, 0.12 + 0.25 * k);
    }
    // The blur of the sickle's path behind it: a fading arc, two pixels thick.
    const trail = 1.2 + 0.8 * k, m = Math.max(12, Math.round(trail * r * ppu * 0.6));
    for (let i = 1; i <= m; i++) {
      const a = turn - dir * (i / m) * trail, f = 1 - i / m;
      for (const rr of [r, r - 0.1]) {
        const [sx, sy] = P(hx + Math.cos(a) * rr, HAND, hy + Math.sin(a) * rr);
        dot(g, sx, sy, BLADE, 0.55 * f * (0.5 + 0.5 * k));
      }
    }
    // The chain out to the sickle, every link, two pixels thick.
    const steps = Math.max(10, Math.round(r * ppu));
    for (let s = 1; s <= steps; s++) {
      const f = s / steps, [sx, sy] = P(hx + Math.cos(turn) * r * f, HAND, hy + Math.sin(turn) * r * f);
      dot(g, sx, sy, CHAIN[s & 1], 0.95), dot(g, sx, sy + 1, CHAIN[(s + 1) & 1], 0.6);
    }
    // The sickle at the end: a hooked blade curling back against the turn, bright on its back.
    const [tx, ty] = P(hx + Math.cos(turn) * r, HAND, hy + Math.sin(turn) * r);
    for (let j = 0; j <= 5; j++) {
      const b = turn - dir * j * 0.07, rr = r - 0.05 - j * j * 0.012, [sx, sy] = P(hx + Math.cos(b) * rr, HAND + j * 0.03, hy + Math.sin(b) * rr);
      dot(g, sx, sy, BLADE, 1), dot(g, sx, sy + 1, '#9aa3ad', 0.9);
    }
    dot(g, tx, ty - 1, '#ffffff', 1);
  }
  g.globalAlpha = 1;
}
