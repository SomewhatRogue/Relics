/** The room's still parts, painted once: back wall, floor, side walls. Tile (x, y) is pixel (OX + 16x, OY + 16y). */
import { ARENA } from '../shared/arena';
import { Rng } from '../shared/rng';

export const PX = 16;
export const OX = 8;
export const OY = 8 + ARENA.wallFace * PX;
export const WORLD_W = ARENA.w * PX + 16;
export const WORLD_H = ARENA.h * PX + OY + 8;
export const toPx = (x: number, y: number): [number, number] => [OX + x * PX, OY + y * PX];

export function paintRoom(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const g = c.getContext('2d')!;
  const rng = new Rng(7);
  const pick = (a: string[]) => a[rng.int(a.length)];
  const rect = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  rect(0, 0, WORLD_W, WORLD_H, '#14121a');
  // Back wall: a cap, then the face in brick courses.
  rect(0, 0, WORLD_W, 8, '#2a2733');
  rect(0, 0, WORLD_W, 2, '#4f4a5c');
  const faceTop = 8, faceH = OY - 8;
  rect(0, faceTop, WORLD_W, faceH, '#1f1c26');
  for (let r = 0; r * 5 < faceH - 3; r++) {
    const off = (r % 2) * 4;
    for (let x = -8 + off; x < WORLD_W; x += 8) rect(x + 1, faceTop + r * 5, 7, 4, pick(['#3b3746', '#433e50', '#36323f', '#3e3a4a']));
  }
  rect(0, OY - 3, WORLD_W, 3, '#16141b');
  // Chains and scrawl on the wall.
  for (const cx of [60, 196]) for (let y = faceTop + 2; y < faceTop + 26; y += 2) rect(cx + (y % 4 ? 1 : 0), y, 1, 1, '#6a6470');
  for (let i = 0; i < 9; i++) rect(118 + i * 2 + rng.int(2), faceTop + 14 + rng.int(6), 1, 2 + rng.int(3), '#5a1414');
  // Floor flagstones.
  for (let r = 0; r * 12 < ARENA.h * PX; r++) {
    const off = (r % 2) * 8;
    for (let x = OX - 16 + off; x < OX + ARENA.w * PX; x += 16) {
      const y0 = OY + r * 12, base = pick(['#3f3b4a', '#45404f', '#3a3644', '#4a4555', '#423d4d']);
      rect(x, y0, 16, 12, '#1d1b24');
      rect(x + 1, y0 + 1, 15, 11, base);
      for (let k = 0; k < 5; k++) rect(x + 1 + rng.int(15), y0 + 1 + rng.int(11), 1, 1, rng.next() < 0.5 ? '#36323f' : '#524c5e');
    }
  }
  for (let i = 0; i < 10; i++) {
    let x = OX + rng.int(ARENA.w * PX), y = OY + rng.int(ARENA.h * PX - 8);
    for (let k = 0; k < 6; k++) rect((x += rng.int(2)), y++, 1, 1, '#24212c');
  }
  // Old stains and bones.
  const stain = (cx: number, cy: number, r: number) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y) + rng.next() * 2;
      if (d < r) rect(cx + x, cy + y, 1, 1, d < r * 0.55 ? '#43141a' : '#33101a');
    }
  };
  stain(OX + 40, OY + 220, 6);
  stain(OX + 250, OY + 60, 5);
  rect(OX + 44, OY + 214, 3, 1, '#d9d2c0');
  rect(OX + 46, OY + 215, 1, 1, '#b8b0a0');
  rect(OX + 30, OY + 228, 2, 2, '#d9d2c0');
  // Floor darkens under the back wall.
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(OX, OY, ARENA.w * PX, 4);
  // Side and front walls.
  rect(0, 0, OX, WORLD_H, '#2a2733');
  rect(OX - 1, OY, 1, ARENA.h * PX, '#3b3746');
  rect(WORLD_W - 8, 0, 8, WORLD_H, '#2a2733');
  rect(WORLD_W - 8, OY, 1, ARENA.h * PX, '#3b3746');
  rect(0, WORLD_H - 8, WORLD_W, 8, '#2a2733');
  rect(0, WORLD_H - 8, WORLD_W, 1, '#4f4a5c');
  // Torch brackets.
  for (const t of ARENA.torches) {
    const [x, y] = toPx(t.x, t.y);
    rect(x - 1, y, 3, 8, '#3a2a1a');
    rect(x - 2, y + 7, 5, 1, '#3a2a1a');
  }
  return c;
}
