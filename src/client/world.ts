/**
 * A map's still parts, painted once: the floor, the back wall's face, the side walls. Tile (x, y) is
 * pixel (OX + 16x, OY + 16y). Buildings, trees and rocks are drawn with the actors (so you can walk
 * behind them); see blocks.ts.
 */
import type { GameMap, Ledge } from '../shared/arena';
import { Rng } from '../shared/rng';
import { paintBreach } from './breach';
import { paintMarks } from './marks';
import { paintSoil } from './soil';
import { paintGaps } from './wayout';

export const PX = 16;
export const OX = 8;
/** Every map has a 3-tile back wall face. */
export const OY = 8 + 3 * PX;
export const worldW = (m: GameMap) => m.w * PX + 16;
export const worldH = (m: GameMap) => m.h * PX + OY + 8;
export const toPx = (x: number, y: number): [number, number] => [OX + x * PX, OY + y * PX];
/** How far up (pixels) level 1 is drawn: a ledge's top, and whoever stands on it. */
export const LIFT = 12;

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

const FLOORS: Record<GameMap['theme']['floor'], { tile: [number, number]; base: string[]; line: string; fleck: string[] }> = {
  flagstone: { tile: [16, 12], base: ['#3f3b4a', '#45404f', '#3a3644', '#4a4555', '#423d4d'], line: '#1d1b24', fleck: ['#36323f', '#524c5e'] },
  cobble: { tile: [8, 6], base: ['#4a4450', '#524b56', '#45404a', '#575060', '#4d4652'], line: '#24212a', fleck: ['#3a3640', '#5e5866'] },
  grass: { tile: [16, 16], base: ['#26331f', '#2b3923', '#233021', '#2e3d25'], line: '#26331f', fleck: ['#3a4c2c', '#1d2818', '#46582f'] },
  dirt: { tile: [16, 16], base: ['#3a3024', '#3e3428', '#362c21', '#423628'], line: '#3a3024', fleck: ['#2a2219', '#4e4232'] },
  rock: { tile: [12, 10], base: ['#2e2c34', '#34313a', '#29272f', '#38353f'], line: '#18161c', fleck: ['#222027', '#45414c'] },
  wheat: { tile: [16, 16], base: ['#3e3424', '#433827'], line: '#3e3424', fleck: ['#2e2619'] },
  mud: { tile: [16, 16], base: ['#2c2a20', '#302d22', '#28261d', '#333024'], line: '#2c2a20', fleck: ['#3a3a26', '#22201a', '#3e4228'] },
  planks: { tile: [24, 5], base: ['#5a3f28', '#5e432a', '#553b25', '#624630', '#583d27'], line: '#2a1d12', fleck: ['#4a321f', '#6b4e34'] },
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
  paintBreach(m, rect);
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
  // Water: deep runs dark with slow ripples; shallow shows the stones under it.
  for (const wt of m.water ?? []) {
    const [x0, y0] = toPx(wt.x, wt.y), w = wt.w * PX, h = wt.h * PX;
    rect(x0 - 1, y0 - 1, w + 2, h + 2, wt.deep ? '#1a2a22' : '#3a3a2a');
    rect(x0, y0, w, h, wt.deep ? '#122036' : '#3e5a62');
    if (wt.deep) for (let i = 0; i < (w * h) / 60; i++) rect(x0 + rng.int(w - 3), y0 + rng.int(h), 3, 1, rng.next() < 0.5 ? '#1a2c46' : '#22405c');
    else {
      // A ford: sandy bottom through clear water, and stepping stones to show the way over.
      for (let i = 0; i < (w * h) / 14; i++) rect(x0 + rng.int(w - 2), y0 + rng.int(h), 2, 1, rng.next() < 0.5 ? '#6a6a52' : '#4e6a6a');
      for (let y = y0 + 4; y < y0 + h - 3; y += 7) {
        const x = x0 + 3 + rng.int(Math.max(1, w - 10));
        rect(x, y, 5, 3, '#8a8474'), rect(x + 1, y, 3, 1, '#a8a290'), rect(x, y + 3, 5, 1, '#2e3e44');
      }
    }
    rect(x0, y0, w, 1, wt.deep ? '#2a4a5a' : '#7a9a9a');
  }
  paintSoil(m, g);
  paintMarks(m, rect);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(OX, OY, fw, 4);
  for (const l of m.ledges ?? []) ledge(l, rect, rng, pick);
  // Side and front walls.
  const side = m.theme.back === 'trees' ? '#141a12' : m.theme.back === 'palisade' || m.theme.back === 'plaster' ? '#2a2018' : '#2a2733';
  rect(0, 0, OX, H, side);
  rect(W - 8, 0, 8, H, side);
  rect(0, H - 8, W, 8, side);
  rect(0, H - 8, W, 1, '#4f4a5c');
  // The ways out: a gap in the back wall, a house's doorway in the front (wayout.ts).
  paintGaps(m, rect);
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
  } else if (kind === 'plaster') {
    // A room's back wall: plaster over a timber frame, a skirting board.
    rect(0, 0, W, OY, '#16121a');
    rect(0, top, W, faceH, '#6a5e52');
    for (let i = 0; i < W * 3; i++) rect(rng.int(W), top + rng.int(faceH), 1, 1, pick(['#5e534a', '#74685a', '#665a4e']));
    for (let x = 4; x < W; x += 28) rect(x, top, 4, faceH, '#3e2a1a');
    rect(0, top, W, 3, '#3e2a1a');
    rect(0, OY - 7, W, 4, '#3e2a1a');
  } else {
    rect(0, 0, W, OY, '#1a1820');
    for (let i = 0; i < W * 2; i++) rect(rng.int(W), rng.int(OY), 2 + rng.int(4), 1 + rng.int(3), pick(['#2a2730', '#232029', '#302c36']));
  }
  rect(0, OY - 3, W, 3, '#16141b');
}

/** Raised ground: its top lifted, a face down to the floor, stairs or a slope where the ramp is. */
function ledge(l: Ledge, rect: Rect, rng: Rng, pick: (a: string[]) => string): void {
  const rock = l.kind !== 'wood', x = OX + l.x * PX, y = OY + l.y * PX - LIFT, w = l.w * PX, h = l.h * PX;
  // The face first, a shadow at its foot, then the top over it.
  rect(x, y + h, w, LIFT, rock ? '#2a2733' : '#3a2a1a');
  for (let i = 0; i < w; i += rock ? 5 : 4) rect(x + i, y + h + (rock ? rng.int(LIFT) : 0), rock ? 3 : 1, rock ? 1 : LIFT, rock ? '#36323f' : '#2a1d12');
  rect(x, y + h + LIFT, w, 3, 'rgba(0,0,0,0.4)');
  if (rock) {
    rect(x, y, w, h, '#4a4652');
    for (let i = 0; i < (w * h) / 30; i++) rect(x + rng.int(w), y + rng.int(h), 2, 1, pick(['#403c48', '#57525e', '#45414c']));
  } else for (let j = 0; j < h; j += 5) {
    rect(x, y + j, w, 5, pick(['#6b4a2b', '#5e432a', '#734f2e']));
    rect(x, y + j + 4, w, 1, '#3a2a1a');
  }
  rect(x, y + h - 1, w, 1, rock ? '#6a6470' : '#8b6a3a');
  // Ramps: steps from the floor up to the top.
  for (const r of l.ramps) {
    const rx = OX + r.x * PX, top = OY + r.y * PX - LIFT, bot = OY + (r.y + r.h) * PX, n = 6;
    rect(rx, top, r.w * PX, bot - top, rock ? '#3e3a46' : '#5a3d22');
    for (let i = 0; i <= n; i++) rect(rx, Math.round(top + ((bot - top) * i) / n), r.w * PX, 1, rock ? '#57525e' : '#8b6a3a');
    rect(rx, top, 1, bot - top, '#1d1b24');
    rect(rx + r.w * PX - 1, top, 1, bot - top, '#1d1b24');
  }
}
