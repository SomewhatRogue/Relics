/**
 * Who your MEND would reach now (Kyle, 2026-11-06: "Cleric could heal friends only self with V"): while
 * a Cleric's MEND is ready and there's breath for it, a small gold cross bobs over the friend it would go
 * to, with a soft gold ring at their feet. The room's own rule picks them (sim/healtap.ts healTarget),
 * so what you see is who the press heals. Nothing over yourself: no mark means it would mend you, or
 * nobody near is hurt. Flat view and the 2.5D overlay alike, by each view's projection. Drawing only.
 */
import { HEAL_SIGN } from '../shared/signs';
import { healTarget } from '../sim/healtap';
import { signFor, signLeft } from '../sim/signature';
import type { ArenaRoom } from '../sim/room';

type Proj = (x: number, y: number, z: number) => [number, number];
type At = (key: string, x: number, y: number) => [number, number];

const GOLD = '#ffd27a', HOT = '#fff1b0', EDGE = '#1a1206';
/** The cross, row by row (1 gold, 2 bright, 0 outline): seven by seven. */
const CROSS = ['0002000', '0021200', '0221220', '2211122', '0221220', '0021200', '0002000'].map((r) => r.split('').map(Number));

export function drawMendMark(g: CanvasRenderingContext2D, room: ArenaRoom, meId: string, P: Proj, at: At, ppu: number): void {
  const me = room.heroes.find((h) => h.id === meId), t = room.time;
  if (!me || signFor(me) !== 'heal' || me.act === 'down' || me.out || signLeft(me, t) > 0 || me.winded || me.stamina < HEAL_SIGN.cost) return;
  const f = healTarget(me, room.heroes, room.map.npcs ?? []);
  if (!f || f.hero === me) return;
  const [x, z] = f.hero ? at('h:' + f.hero.id, f.x, f.y) : [f.x, f.y], up = f.hero?.z ?? 0;
  // The ring at their feet: dotted, turning slowly the other way to MARK's sight.
  const r = 0.55, n = Math.max(20, Math.round(r * ppu * 4));
  g.globalAlpha = 0.75;
  for (let i = 0; i < n; i += 2) {
    const a = (i / n) * Math.PI * 2 - t * 0.6, [sx, sy] = P(x + Math.cos(a) * r, 0.02, z + Math.sin(a) * r);
    g.fillStyle = i % 4 ? GOLD : HOT;
    g.fillRect(Math.round(sx), Math.round(sy), 1, 1);
  }
  // The cross over their head, bobbing (a little higher than a chalker's tally).
  const [hx, hy] = P(x, 2.3 + up * 0.5 + Math.sin(t * 4) * 0.06, z), ox = Math.round(hx) - 3, oy = Math.round(hy) - 7;
  g.globalAlpha = 1;
  CROSS.forEach((row, j) => row.forEach((c, i) => {
    if (c) return void ((g.fillStyle = c === 1 ? GOLD : HOT), g.fillRect(ox + i, oy + j, 1, 1));
    if (CROSS[j - 1]?.[i] || CROSS[j + 1]?.[i] || row[i - 1] || row[i + 1]) (g.fillStyle = EDGE), g.fillRect(ox + i, oy + j, 1, 1);
  }));
}
