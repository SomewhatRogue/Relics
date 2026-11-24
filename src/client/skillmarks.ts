/**
 * Marks on the ground for the reworked skills (General chat, 2026-11-23), drawn on the glow layer of either view
 * through its projection `P(x, up, y)` (tiles), as spellground.ts is. HEARTSEEKER's aim: a sighting line out along
 * the Ranger's aim to the arrow's reach, firming as the wind-up fills, white at the end. SMOKE: a goblin lost in a
 * smoke bomb's smoke (sim/smokebomb.ts) wears a little turning swirl over its head, so you can see it's blind.
 * Cosmetic only.
 */
import { HEARTSEEKER, RELICS } from '../shared/tuning';
import { POTION } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';

type Proj = (x: number, y: number, z: number) => [number, number];
type At = (key: string, x: number, y: number) => [number, number];

const dot = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number) => {
  g.globalAlpha = a;
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
};

export function drawSkillMarks(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number, at?: At): void {
  // Heartseeker's sighting line.
  for (const h of room.heroes) {
    if (h.act !== 'throw' || h.relic !== 'sic' || h.actT > RELICS.sic.windup) continue;
    const [x, y] = at ? at('h:' + h.id, h.x, h.y) : [h.x, h.y], k = Math.min(1, h.actT / RELICS.sic.windup), r = HEARTSEEKER.range;
    const n = Math.max(20, Math.round(r * ppu * 0.5));
    for (let i = 2; i <= n; i += 2) {
      const f = i / n, [sx, sy] = P(x + h.fx * r * f, 0.55, y + h.fy * r * f);
      dot(g, sx, sy, k >= 1 ? '#ffffff' : '#ffd27a', (0.25 + 0.55 * k) * (1 - f * 0.6));
    }
  }
  // Goblins lost in a smoke bomb's smoke (not a vanish's, where none swing blind): a turning swirl overhead.
  for (const e of room.enemies) {
    if (e.act === 'dead' || e.act === 'carried') continue;
    const inSmoke = room.smokes.some((s) => !s.soft && Math.hypot(s.x - e.x, s.y - e.y) < (s.r ?? POTION.smokeR) + e.radius);
    if (!inSmoke) continue;
    const [x, y] = at ? at('e:' + e.id, e.x, e.y) : [e.x, e.y], up = 1.25 + (e.weight > 1 ? 0.7 : 0), turn = room.time * 4 + e.id;
    for (let i = 0; i < 5; i++) {
      const a = turn + i * 1.25, rr = 0.12 + i * 0.03, [sx, sy] = P(x + Math.cos(a) * rr, up + Math.sin(a) * rr * 0.5, y);
      dot(g, sx, sy, i % 2 ? '#d8ccc0' : '#ffffff', 0.55 + i * 0.08);
    }
  }
  g.globalAlpha = 1;
}
