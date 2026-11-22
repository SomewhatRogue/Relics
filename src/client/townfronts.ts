/**
 * The living world, L3 (docs/design/living-world.md): the lived-in look by the town's doors and between its houses,
 * as small cosmetic figures a frame, drawn in both views as ambient.ts's are (three/cards3d.ts, scene.ts). Paint
 * only: nothing here is in the room, so nothing blocks a step. Clutter on doorsteps (townfrontart.ts), laundry lines
 * between houses (townlaundry.ts), shop signs that swing (townsigns.ts), notices on the JOBS house. Wickhold only,
 * and all of it found from the map's own buildings and doors, so it stays right if the town is laid out again.
 */
import type { GameMap, Block } from '../shared/arena';
import { doorAt } from '../shared/arena';
import type { Beast } from './townbeasts';
import { blocked } from './ratspots';
import { CLUTTER, CLUTTER_W, drawClutter, drawNotice } from './townfrontart';
import { drawSign, tradeOf } from './townsigns';
import { drawLine, laundryLines } from './townlaundry';

const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const BUILDINGS = new Set(['house', 'hall', 'forge', 'tavern']);

/** Which wall a block's door is in: the way out from it (ox, oy), and the way along it (ax, ay). */
export function wallOf(b: Block): { ox: number; oy: number; ax: number; ay: number; wx: number; wy: number } {
  const f = b.face;
  if (f === 'W') return { ox: 1, oy: 0, ax: 0, ay: 1, wx: b.x + b.w, wy: b.y + b.h / 2 };
  if (f === 'E') return { ox: -1, oy: 0, ax: 0, ay: 1, wx: b.x, wy: b.y + b.h / 2 };
  if (f === 'S') return { ox: 0, oy: -1, ax: 1, ay: 0, wx: b.x + b.w / 2, wy: b.y };
  return { ox: 0, oy: 1, ax: 1, ay: 0, wx: b.x + b.w / 2, wy: b.y + b.h };
}

const cache = new WeakMap<GameMap, Beast[]>();

export function frontFigs(m: GameMap, _now: number): Beast[] {
  if (m.name !== 'WICKHOLD') return [];
  let out = cache.get(m);
  if (!out) cache.set(m, (out = place(m)));
  return out;
}

/** Everything the map's doors and houses allow, found once: clutter, signs, laundry, notices. */
function place(m: GameMap): Beast[] {
  const out: Beast[] = [];
  const homes = m.blocks.filter((b) => BUILDINGS.has(b.kind) && !b.ruined && b.w >= 2 && b.h >= 2);
  const doors = homes.map((b) => doorAt(b));
  const water = (x: number, y: number) => !!m.water?.some((w) => x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h);
  /** A spot `a` tiles along b's wall from its door and `o` out from it: free ground, clear of every doorway. */
  const spot = (b: Block, a: number, o: number) => {
    const w = wallOf(b), x = w.wx + w.ox * o + w.ax * a, y = w.wy + w.oy * o + w.ay * a;
    const len = w.ax ? b.w : b.h, inside = Math.abs(a) <= len / 2 - 0.45;
    const clear = !doors.some((d) => Math.hypot(d.x - x, d.y - y) < 0.85);
    const free = [-0.2, 0, 0.2].every((s) => !blocked(m, x + w.ax * s, y + w.ay * s));
    return inside && clear && free && !water(x, y) ? { x, y } : null;
  };

  // Doorstep clutter: a third of the doors (the ones the hash ranks first), one or two things on one side, against the wall.
  let placed = 0;
  const want = Math.ceil(homes.length / 3);
  homes
    .map((b, bi) => ({ b, bi, h: hash(b.x * 3.1 + 1, b.y * 1.7 + bi) }))
    .sort((p, q) => p.h - q.h)
    .forEach(({ b, bi, h }) => {
      if (placed >= want || b.door === 'townhall') return;
      const side = hash(b.x, b.y + 5) < 0.5 ? 1 : -1;
      let a = 0.95 + hash(b.x, b.y) * 0.3, any = false;
      const n = 1 + (hash(b.y, b.x) < 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const kind = CLUTTER[Math.floor(hash(b.x + i * 7, b.y * 2 + i) * CLUTTER.length)], p = spot(b, a * side, 0.3);
        if (!p) break;
        any = true;
        out.push({ key: `fc${bi}_${i}`, x: p.x, y: p.y, up: 0, draw: (c, px, py) => drawClutter(c, kind, px, py) });
        a += CLUTTER_W[kind] + 0.35;
      }
      if (any) placed++;
      void h;
    });
  // A hanging sign on the other side of the door, for a trade.
  homes.forEach((b, bi) => {
    const trade = tradeOf(b);
    if (!trade) return;
    const w = wallOf(b), side = hash(b.x, b.y + 5) < 0.5 ? 1 : -1, taken = out.some((f) => f.key.startsWith(`fc${bi}_`));
    const s = taken ? -side : side, p = spot(b, s * 1.25, 0.1);
    if (p) out.push({ key: `fs${bi}`, x: p.x, y: p.y, up: 2.0, draw: (c, px, py) => drawSign(c, trade, px, py, w.ax ? s : w.ox, bi * 1.9) });
  });

  // Signs on the market's stalls (the tailor's, the pawnbroker's): hung at the stall's front corner.
  m.blocks.filter((b) => b.kind === 'stall' && tradeOf(b)).forEach((b, i) => {
    const trade = tradeOf(b)!;
    out.push({ key: `fst${i}`, x: b.x + 0.35, y: b.y + b.h + 0.1, up: 1.7, draw: (c, px, py) => drawSign(c, trade, px, py, 1, i * 2.7 + 1) });
  });

  laundryLines(m, out.filter((f) => f.up >= 1.5)).forEach((l, i) => out.push({ key: `fl${i}`, x: l.x, y: l.y, up: 2, draw: (c, px, py) => drawLine(c, l, px, py) }));

  // Notices pinned on the JOBS house, one of them stirring now and then.
  const jobs = m.blocks.find((b) => b.label === 'JOBS' || b.door === 'jobs');
  if (jobs) {
    // (The board itself is drawn with its own papers: these are pinned on the wall beside it.)
    const at = [[-0.45, 1.35], [jobs.w + 0.4, 1.05], [-0.95, 0.95]];
    at.forEach(([dx, up], i) => out.push({ key: `fn${i}`, x: jobs.x + dx, y: jobs.y + 0.2, up, draw: (c, px, py) => drawNotice(c, px, py, i + 1, i === 1 && (c.now * 0.23) % 1 < 0.14) }));
  }
  return out;
}
