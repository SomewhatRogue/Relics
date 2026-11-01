/**
 * A map's still parts, painted once: the floor, the back wall's face, the side walls. Tile (x, y) is
 * pixel (OX + 16x, OY + 16y). Buildings, trees and rocks are drawn with the actors (so you can walk
 * behind them); see blocks.ts.
 */
import type { GameMap } from '../shared/arena';
import { Rng } from '../shared/rng';

export const PX = 16;
export const OX = 8;
/** Every map has a 3-tile back wall face. */
export const OY = 8 + 3 * PX;
export const worldW = (m: GameMap) => m.w * PX + 16;
export const worldH = (m: GameMap) => m.h * PX + OY + 8;
export const toPx = (x: number, y: number): [number, number] => [OX + x * PX, OY + y * PX];

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

const FLOORS: Record<GameMap['theme']['floor'], { tile: [number, number]; base: string[]; line: string; fleck: string[] }> = {
  flagstone: { tile: [16, 12], base: ['#3f3b4a', '#45404f', '#3a3644', '#4a4555', '#423d4d'], line: '#1d1b24', fleck: ['#36323f', '#524c5e'] },
  cobble: { tile: [8, 6], base: ['#4a4450', '#524b56', '#45404a', '#575060', '#4d4652'], line: '#24212a', fleck: ['#3a3640', '#5e5866'] },
  grass: { tile: [16, 16], base: ['#26331f', '#2b3923', '#233021', '#2e3d25'], line: '#26331f', fleck: ['#3a4c2c', '#1d2818', '#46582f'] },
  dirt: { tile: [16, 16], base: ['#3a3024', '#3e3428', '#362c21', '#423628'], line: '#3a3024', fleck: ['#2a2219', '#4e4232'] },
  rock: { tile: [12, 10], base: ['#2e2c34', '#34313a', '#29272f', '#38353f'], line: '#18161c', fleck: ['#222027', '#45414c'] },
  wheat: { tile: [16, 16], base: ['#3e3424', '#433827'], line: '#3e3424', fleck: ['#2e2619'] },
};

export function paintMap(m: GameMap): HTMLCanvasElement {
  const W = worldW(m), H = worldH(m), c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!, rng = new Rng(m.w * 31 + m.h * 7 + m.name.length);
  const pick = (a: string[]) => a[rng.int(a.length)];
  const rect: Rect = (x, y, w, h, col) => ((g.fillStyle = col), g.fillRect(x, y, w, h));
  rect(0, 0, W, H, '#14121a');
  back(m, rect, rng, pick, W);
  // Floor.
  const f = FLOORS[m.theme.floor], [tw, th] = f.tile, fw = m.w * PX, fh = m.h * PX;
  for (let r = 0; r * th < fh; r++) {
    const off = (r % 2) * (tw / 2);
    for (let x = OX - tw + off; x < OX + fw; x += tw) {
      const y0 = OY + r * th;
      rect(x, y0, tw, th, f.line);
      rect(x + (f.line === f.base[0] ? 0 : 1), y0 + (f.line === f.base[0] ? 0 : 1), tw - 1, th - 1, pick(f.base));
      for (let k = 0; k < (tw * th) / 40; k++) rect(x + 1 + rng.int(tw - 1), y0 + 1 + rng.int(th - 1), 1, 1, pick(f.fleck));
    }
  }
  if (m.theme.floor === 'wheat') {
    // Rows of standing wheat, trampled in places.
    for (let y = OY + 6; y < OY + fh; y += 7) for (let x = OX + rng.int(4); x < OX + fw; x += 3) {
      if (rng.next() < 0.25) continue;
      const h = 3 + rng.int(4);
      rect(x, y - h, 1, h, rng.next() < 0.5 ? '#8a7a3a' : '#a08c44');
      if (rng.next() < 0.5) rect(x, y - h - 1, 1, 1, '#c8b060');
    }
  }
  if (m.theme.floor === 'grass') for (let i = 0; i < m.w * m.h * 0.8; i++) {
    const x = OX + rng.int(fw), y = OY + rng.int(fh);
    rect(x, y, 1, 2, '#3a4c2c');
    rect(x + 1, y + 1, 1, 1, '#46582f');
  }
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(OX, OY, fw, 4);
  // Side and front walls.
  const side = m.theme.back === 'trees' ? '#141a12' : m.theme.back === 'palisade' ? '#2a2018' : '#2a2733';
  rect(0, 0, OX, H, side);
  rect(W - 8, 0, 8, H, side);
  rect(0, H - 8, W, 8, side);
  rect(0, H - 8, W, 1, '#4f4a5c');
  for (const t of m.torches) {
    const [x, y] = toPx(t.x, t.y);
    rect(x - 1, y, 3, 8, '#3a2a1a');
    rect(x - 2, y + 7, 5, 1, '#3a2a1a');
  }
  return c;
}

/** The back wall's face: stone courses, a log palisade, a treeline, or bare rock. */
function back(m: GameMap, rect: Rect, rng: Rng, pick: (a: string[]) => string, W: number): void {
  const top = 8, faceH = OY - 8, kind = m.theme.back;
  if (kind === 'stone') {
    rect(0, 0, W, 8, '#2a2733');
    rect(0, 0, W, 2, '#4f4a5c');
    rect(0, top, W, faceH, '#1f1c26');
    for (let r = 0; r * 5 < faceH - 3; r++) {
      const off = (r % 2) * 4;
      for (let x = -8 + off; x < W; x += 8) rect(x + 1, top + r * 5, 7, 4, pick(['#3b3746', '#433e50', '#36323f', '#3e3a4a']));
    }
  } else if (kind === 'palisade') {
    rect(0, 0, W, OY, '#120f14');
    for (let x = 0; x < W; x += 6) {
      const h = faceH + 2 + rng.int(4);
      rect(x, OY - h, 5, h, pick(['#4a3424', '#523a28', '#44301f']));
      rect(x + 1, OY - h - 2, 3, 2, '#3a2a1c');
      rect(x + 4, OY - h, 1, h, '#2e2016');
    }
  } else if (kind === 'trees') {
    rect(0, 0, W, OY, '#0c100b');
    for (let x = -10; x < W + 10; x += 9) {
      const r = 8 + rng.int(6), cy = 10 + rng.int(12);
      for (let y = -r; y <= r; y++) for (let dx = -r; dx <= r; dx++) if (dx * dx + y * y <= r * r) rect(x + dx, cy + y, 1, 1, y < -r / 3 ? '#26361f' : '#1c2817');
      rect(x - 1, cy + r - 2, 3, OY - cy - r + 2, '#2a1f16');
    }
  } else {
    rect(0, 0, W, OY, '#1a1820');
    for (let i = 0; i < W * 2; i++) rect(rng.int(W), rng.int(OY), 2 + rng.int(4), 1 + rng.int(3), pick(['#2a2730', '#232029', '#302c36']));
  }
  rect(0, OY - 3, W, 3, '#16141b');
}
