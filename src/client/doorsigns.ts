/**
 * A hanging sign at every public building's door (Kyle, 2026-11-16: side doors are hard to place; "little icons
 * hanging out into the street"): an iron bracket off the wall beside the door, jutting out into the lane the door
 * opens on, a board hanging from it with what the building is drawn on it (crossed swords, a coin, a tankard...).
 * As you come near it swings (its name is on its roof: hallnames.ts). With doorsteps.ts (the lit step and chevron),
 * drawn on the glow layer of either view through its projection `P(x, up, y)` (tiles). Homes, locked doors and
 * doors burning or in ruins get none.
 */
import { doorAt, levelAt, pushDir, type GameMap } from '../shared/arena';
import type { ArenaRoom } from '../sim/room';

type Proj = (x: number, y: number, z: number) => [number, number];

const LEVEL = 0.75, NEAR = 4.5, HIGH = 2.1, OUT = 0.95, ASIDE = 0.95;
const COL: Record<string, string> = { k: '#1a1418', w: '#d8dce2', s: '#8a929c', g: '#e8b84a', d: '#a8782a', r: '#c8302a', b: '#7a5232', y: '#f0d878', f: '#e8e0c8', n: '#3a6a3a' };

/** Each building's sign, 9 by 7 (a letter a colour, '.' the board). */
const ICON: Record<string, string[]> = {
  hall: ['w.......w', '.w.....w.', '..w...w..', '...w.w...', '....w....', '..gw.wg..', '.g.....g.'],
  bank: ['...ggg...', '..gdddg..', '.gdgggdg.', '.gdgggdg.', '.gdgggdg.', '..gdddg..', '...ggg...'],
  infirmary: ['...rrr...', '...rrr...', '.rrrrrrr.', '.rrrrrrr.', '.rrrrrrr.', '...rrr...', '...rrr...'],
  forge: ['.........', '.sssssss.', 'ssssssss.', '..sssss..', '...sss...', '..sssss..', '.kkkkkkk.'],
  tavern: ['..fffff..', '.ddddddd.', '.dyyyyd.d', '.dyyyyd.d', '.dyyyyd.d', '.ddddddd.', '.........'],
  lodge: ['..b......', '.b.w.....', 'b...w....', 'bssssssw.', 'b...w....', '.b.w.....', '..b......'],
  tower: ['....y....', '...yyy...', 'yyyyyyyyy', '.yyyyyyy.', '..yy.yy..', '.yy...yy.', '.........'],
  church: ['....g....', '....g....', '..ggggg..', '....g....', '....g....', '....g....', '....g....'],
  townhall: ['.k.......', '.krrrrr..', '.krgrgr..', '.krrrrr..', '.krrr....', '.k.......', '.k.......'],
  granary: ['..y.y.y..', '...yyy...', '..y.y.y..', '...yyy...', '....d....', '....d....', '...ddd...'],
};

function rect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string): void {
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function line(g: CanvasRenderingContext2D, a: [number, number], b: [number, number], col: string, s: number): void {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
  for (let i = 0; i <= n; i++) rect(g, a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, s, s, col);
}

export function drawDoorSigns(g: CanvasRenderingContext2D, room: ArenaRoom, meId: string, P: Proj, ppu: number): void {
  const map: GameMap = room.map;
  if (room.indoors || !map.blocks?.length) return;
  const me = room.heroes.find((h) => h.id === meId), t = room.time, s = Math.max(1, Math.round(ppu / 16));
  for (const b of map.blocks) {
    const icon = b.door && ICON[b.door];
    if (!icon || b.locked || b.ruined || (b.burning ?? -1) >= 0) continue;
    const d = doorAt(b), [dx, dy] = pushDir(b), up = levelAt(map, d.x, d.y) * LEVEL;
    // On the wall beside the door (toward the camera's right, or its far side for a side door), jutting out.
    const [lx, ly] = dy !== 0 ? [1, 0] : [0, 1];
    const wx = d.x + dx * 0.45 + lx * ASIDE, wy = d.y + dy * 0.45 + ly * ASIDE;
    const near = me ? Math.hypot(me.x - wx, me.y - wy) : NEAR * 2, k = Math.max(0, Math.min(1, 1 - (near - 1.5) / NEAR));
    const root = P(wx, up + HIGH, wy), tip = P(wx - dx * OUT, up + HIGH, wy - dy * OUT);
    g.globalAlpha = 0.8 + 0.2 * k;
    // The bracket: an iron arm with a curl under it at the wall.
    line(g, root, tip, COL.k, s);
    const under = P(wx - dx * OUT * 0.45, up + HIGH - 0.25, wy - dy * OUT * 0.45);
    line(g, [root[0], root[1] + 3 * s], under, COL.k, s);
    // The board, hung by two short chains from the arm's end, swinging as you pass.
    const sw = Math.round(Math.sin(t * 2.6) * 1.5 * k) * s, bw = 11 * s, bh = 9 * s;
    const bx = tip[0] - bw / 2 + sw, by = tip[1] + 3 * s;
    rect(g, bx + 2 * s, tip[1], s, 3 * s, COL.k), rect(g, bx + bw - 3 * s, tip[1], s, 3 * s, COL.k);
    rect(g, bx, by, bw, bh, COL.k);
    rect(g, bx + s, by + s, bw - 2 * s, bh - 2 * s, '#5a3a24');
    icon.forEach((row, j) => [...row].forEach((c, i) => c !== '.' && rect(g, bx + (1 + i) * s, by + (1 + j) * s, s, s, COL[c])));
  }
  g.globalAlpha = 1;
}
