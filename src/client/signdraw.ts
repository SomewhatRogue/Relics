/**
 * A Ranger's MARK over the goblin that carries it (sim/mark.ts), on every screen: a gold sight on the
 * floor round its feet and a gold chevron bobbing over its head, pointing down at it, for as long as the
 * room says it's marked. Flat view and the 2.5D overlay alike, by each view's projection, over the bodies.
 * Gold, not the goblins' red: it's yours, not a blow coming.
 */
import { isMarked } from '../shared/signs';
import type { ArenaRoom } from '../sim/room';
import type { Enemy } from '../sim/types';

/** Floor (x, z) at height y (tiles) to the screen; where a body is drawn now, in tiles. */
type Proj = (x: number, y: number, z: number) => [number, number];
type At = (key: string, x: number, y: number) => [number, number];

const GOLD = '#ffcf4a', HOT = '#fff1b0', EDGE = '#1a1206';
/** The chevron, row by row (1 gold, 2 bright, 0 outline): seven wide, pointing down. */
const CHEVRON = ['0000000', '0111110', '0212120', '0012100', '0001000', '0000000'].map((r) => r.split('').map(Number));
const tall = (e: Enemy) => (e.kind === 'butcher' ? 2.4 : e.kind === 'spider' ? 1.1 : 1.55);

export function drawHuntMarks(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, at: At, ppu: number): void {
  const t = room.time;
  for (const e of room.enemies) {
    if (!isMarked(e, t) || e.act === 'dead') continue;
    const [x, z] = at('e:' + e.id, e.x, e.y), left = (e.markedUntil ?? 0) - t;
    // In its last second it blinks, so you know it's going.
    if (left < 1 && Math.floor(t * 8) % 2) continue;
    // The sight round its feet: four short arcs, turning slowly.
    const r = e.radius + 0.25, n = Math.max(24, Math.round(r * ppu * 4));
    g.globalAlpha = 0.9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.8;
      if ((i % (n / 4)) / (n / 4) > 0.6) continue;
      const [sx, sy] = P(x + Math.cos(a) * r, 0.02, z + Math.sin(a) * r);
      g.fillStyle = i % 3 ? GOLD : HOT;
      g.fillRect(Math.round(sx), Math.round(sy), 1, 1);
    }
    // The chevron over its head, bobbing.
    const [hx, hy] = P(x, tall(e) + Math.sin(t * 5) * 0.06, z), ox = Math.round(hx) - 3, oy = Math.round(hy) - 6;
    g.globalAlpha = 1;
    CHEVRON.forEach((row, j) => row.forEach((c, i) => {
      if (!c && !(CHEVRON[j - 1]?.[i] || CHEVRON[j + 1]?.[i] || row[i - 1] || row[i + 1])) return;
      g.fillStyle = c === 2 ? HOT : c === 1 ? GOLD : EDGE;
      g.fillRect(ox + i, oy + j, 1, 1);
    }));
  }
  g.globalAlpha = 1;
}
