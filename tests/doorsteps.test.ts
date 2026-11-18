// The doorsteps skip doors off the canvas, and what lands on the canvas is exactly what it was.
import { describe, expect, it } from 'vitest';
import { doorAt, levelAt, pushDir, type GameMap } from '../src/shared/arena';
import { newWorld } from '../src/shared/story';
import { townMap } from '../src/shared/town';
import { drawDoorsteps } from '../src/client/doorsteps';
import type { ArenaRoom } from '../src/sim/room';

type Proj = (x: number, y: number, z: number) => [number, number];

/** The old drawDoorsteps, kept as the reference. */
function oldDoorsteps(g: CanvasRenderingContext2D, room: ArenaRoom, meId: string, P: Proj, ppu: number): void {
  const LEVEL = 0.75, NEAR = 5, FAINT = 0.55, FULL = 1, WARM = ['#ffcf7a', '#fff2c8'];
  const px = (x: number, y: number, col: string, a: number) => ((g.globalAlpha = a), (g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), 1, 1));
  const map: GameMap = room.map;
  if (room.indoors || !map.blocks?.length) return;
  const me = room.heroes.find((h) => h.id === meId), t = room.time;
  for (const b of map.blocks) {
    if (!b.door || b.locked || b.ruined || (b.burning ?? -1) >= 0) continue;
    const d = doorAt(b), [dx, dy] = pushDir(b), up = levelAt(map, d.x, d.y) * LEVEL;
    const far = me ? Math.hypot(me.x - d.x, me.y - d.y) : NEAR * 2, k = Math.max(0, Math.min(1, 1 - (far - 1) / NEAR));
    const a = FAINT + (FULL - FAINT) * k;
    const n = Math.max(6, Math.round(0.5 * ppu));
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
      if ((i + j) & 1) continue;
      const r = Math.hypot(i / n, j / n);
      if (r > 1) continue;
      const [sx, sy] = P(d.x + (i / n) * 0.5, up + 0.01, d.y + (j / n) * 0.32);
      px(sx, sy, WARM[0], a * 0.7 * (1 - r * 0.6));
    }
    const bob = k > 0 ? Math.sin(t * 5) * 0.08 * k : 0, [lx, ly] = [-dy, dx], steps = Math.max(6, Math.round(0.4 * ppu));
    for (const back of [0, 0.3]) {
      const cx = d.x + dx * (0.25 - back + bob), cy = d.y + dy * (0.25 - back + bob);
      for (let s = 0; s <= steps; s++) for (const side of [-1, 1]) for (const thick of [0, 0.06]) {
        const f = s / steps, wx = cx - dx * (0.28 * f + thick) + lx * side * 0.28 * f, wy = cy - dy * (0.28 * f + thick) + ly * side * 0.28 * f;
        const [sx, sy] = P(wx, up + 0.02, wy);
        px(sx, sy, WARM[1], a * (back ? 0.6 : 1));
      }
    }
  }
  g.globalAlpha = 1;
}

/** A pen that records each pixel set inside its canvas, and counts every call. */
function pen(W: number, H: number) {
  const on: string[] = [];
  let calls = 0;
  const g = {
    canvas: { width: W, height: H }, globalAlpha: 1, fillStyle: '#000',
    fillRect(x: number, y: number) {
      calls++;
      if (x >= 0 && y >= 0 && x < W && y < H) on.push(`${x},${y},${g.fillStyle},${g.globalAlpha}`);
    },
  };
  return { g: g as unknown as CanvasRenderingContext2D, on, calls: () => calls, raw: g };
}

const map = townMap(newWorld());
const doors = map.blocks.filter((b) => b.door && !b.locked && !b.ruined && (b.burning ?? -1) < 0);

/** The flat view's projection round a camera at (cx, cy) tiles, and a perspective one (a point near the eye flips). */
const flat = (cx: number, cy: number, PX = 16): Proj => (x, y, z) => [200 + (x - cx) * PX, 140 + (z - cy) * PX - y * PX];
const persp = (cx: number, cy: number): Proj => (x, y, z) => {
  const w = cy + 12 - z;
  return [195 + ((x - cx) * 300) / w, 140 + ((10 - y) * 300) / w - 200];
};

describe('doorsteps', () => {
  it('a town has many doors to draw', () => expect(doors.length).toBeGreaterThan(8));
  for (const [name, mk] of [['flat', flat], ['perspective', persp]] as const) {
    it(`draws the same pixels as before, in order, with far fewer calls (${name})`, () => {
      const d0 = doorAt(doors[0]);
      let seen = 0;
      for (const [cx, cy] of [[d0.x, d0.y], [map.w / 2, map.h / 2], [2, 2], [map.w - 3, map.h - 3], [-40, -40]]) {
        for (const time of [0, 1.37]) {
          const room = { map, indoors: false, heroes: [{ id: 'me', x: cx + 1, y: cy }], time } as unknown as ArenaRoom;
          const a = pen(390, 280), b = pen(390, 280), P = mk(cx, cy);
          oldDoorsteps(a.g, room, 'me', P, 16);
          drawDoorsteps(b.g, room, 'me', P, 16);
          expect(b.on).toEqual(a.on);
          seen += a.on.length;
          expect([b.raw.fillStyle, b.raw.globalAlpha]).toEqual([a.raw.fillStyle, a.raw.globalAlpha]);
          if (name === 'flat' && cx === map.w / 2) expect(b.calls()).toBeLessThan(a.calls() / 2);
        }
      }
      expect(seen).toBeGreaterThan(100);
    });
  }
});
