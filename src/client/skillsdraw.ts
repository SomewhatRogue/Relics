/**
 * The skills taught after the first, on the floor, from the same numbers the room judges them by
 * (shared/skillkit.ts): the ring a Warrior's stamp, a Mage's fire ring or a Cleric's lantern light will
 * fill while they wind it up; a Ranger's volley marked, then falling; a fire ring burning on; a storm
 * tether's lightning; a censer chain hauling someone in. Player skills are never red (red is a
 * goblin's blow). Cosmetic only: Math.random is fine here.
 */
import { FIRE_RING, LIGHT, RELICS, STAMP } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Ctx } from './draw';
import type { Light } from './light';
import { OX, OY, PX } from './world';

/** The skills with a ring telegraph, its radius and colour. */
const WINDS: Partial<Record<string, { r: number; col: string }>> = {
  stamp: { r: STAMP.radius, col: '#e0d8c8' },
  firering: { r: FIRE_RING.radius, col: '#ff9a3c' },
  light: { r: LIGHT.radius, col: '#fff1b0' },
};

/** A ring of single pixels: dotted when `dots`, its share `fill` of the way round lit brighter. */
function ring(g: CanvasRenderingContext2D, x: number, y: number, R: number, col: string, a: number, dots = false): void {
  g.fillStyle = col;
  g.globalAlpha = a;
  const step = 1 / Math.max(8, R);
  for (let t = 0; t < Math.PI * 2; t += step) {
    if (dots && Math.floor(t / step) % 3) continue;
    g.fillRect(Math.round(x + Math.cos(t) * R), Math.round(y + Math.sin(t) * R), 1, 1);
  }
  g.globalAlpha = 1;
}

export function drawSkills(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  const g = c.glow, t = room.time;
  // Wound up: the ring the blow will land in, filling from the middle.
  for (const h of room.heroes) {
    const w = WINDS[h.relic];
    if (!w || h.act !== 'throw') continue;
    const wind = RELICS[h.relic].windup, k = Math.min(1, h.actT / wind);
    if (h.actT > wind) continue;
    const x = OX + h.x * PX - cx, y = OY + h.y * PX - cy, R = w.r * PX;
    ring(g, x, y, R, w.col, 0.9);
    ring(g, x, y, R * k, w.col, 0.55);
  }
  for (const z of room.zones) {
    if (!z.kind) continue;
    const x = OX + z.x * PX - cx, y = OY + z.y * PX - cy, R = z.r * PX, fade = Math.min(1, (z.until - t) / 0.6);
    if (z.kind === 'volley') {
      const waiting = t < (z.at ?? 0);
      ring(g, x, y, R, '#e8d8a0', waiting ? 0.5 + 0.3 * Math.sin(c.now * 18) : 0.7 * fade, waiting);
      if (waiting) continue;
      // Arrows coming down: short bright streaks, and the odd one stood in the floor.
      g.fillStyle = '#f4ecd0';
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * R, ax = Math.round(x + Math.cos(a) * d), ay = Math.round(y + Math.sin(a) * d);
        g.globalAlpha = 0.85 * fade;
        g.fillRect(ax, ay - 6 - Math.floor(Math.random() * 10), 1, 4);
      }
      g.globalAlpha = 1;
    } else if (z.kind === 'fire') {
      // Burning on: a flickering ring and embers rising off it.
      for (let a = 0; a < Math.PI * 2; a += 1 / R) {
        const f = Math.random();
        g.fillStyle = f > 0.7 ? '#ffd27a' : '#ff6a20';
        g.globalAlpha = (0.5 + f * 0.5) * fade;
        g.fillRect(Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R - f * 3), 1, 1 + Math.round(f * 2));
      }
      g.globalAlpha = 1;
    }
  }
  // A storm tether: a jagged bright line, new every frame.
  for (const h of room.heroes) {
    const e = h.tether && room.enemies.find((o) => o.id === h.tether!.id);
    if (!e) continue;
    jag(g, OX + h.x * PX - cx, OY + h.y * PX - cy - 12, OX + e.x * PX - cx, OY + e.y * PX - cy - 10, '#fff27a');
  }
  // Someone on a censer chain: the links back to where it's hauling them.
  for (const b of [...room.heroes, ...room.enemies]) {
    if (!b.tow) continue;
    const x0 = OX + b.x * PX - cx, y0 = OY + b.y * PX - cy - 8, x1 = OX + b.tow.x * PX - cx, y1 = OY + b.tow.y * PX - cy - 8, n = Math.hypot(x1 - x0, y1 - y0);
    g.fillStyle = '#ffe9a8';
    for (let d = 0; d < n; d += 3) g.fillRect(Math.round(x0 + ((x1 - x0) * d) / n), Math.round(y0 + ((y1 - y0) * d) / n), 2, 1);
  }
}

function jag(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string): void {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 6));
  g.fillStyle = col;
  let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const k = i / n, nx = x0 + (x1 - x0) * k + (i < n ? (Math.random() - 0.5) * 6 : 0), ny = y0 + (y1 - y0) * k + (i < n ? (Math.random() - 0.5) * 6 : 0);
    const steps = Math.max(1, Math.round(Math.hypot(nx - px, ny - py)));
    for (let s = 0; s <= steps; s++) g.fillRect(Math.round(px + ((nx - px) * s) / steps), Math.round(py + ((ny - py) * s) / steps), 1, 1);
    (px = nx), (py = ny);
  }
}

/** The light the skills give off: a volley's spot as it falls, a fire ring, a tether, a ring wound up. */
export function skillLights(room: ArenaRoom, cx: number, cy: number, now: number): Light[] {
  const out: Light[] = [];
  for (const z of room.zones) {
    if (!z.kind || z.kind === 'flamering' || z.kind === 'stormring') continue;
    const x = OX + z.x * PX - cx, y = OY + z.y * PX - cy, k = Math.min(1, (z.until - room.time) / 0.6);
    if (z.kind === 'fire') out.push({ x, y: y - 4, r: z.r * PX * 1.5 + Math.sin(now * 15) * 3, i: 0.9 * k, c: [1, 0.55, 0.25] });
    else if (room.time >= (z.at ?? 0)) out.push({ x, y, r: z.r * PX, i: 0.3 * k, c: [1, 0.92, 0.7] });
  }
  for (const h of room.heroes) {
    const e = h.tether && room.enemies.find((o) => o.id === h.tether!.id);
    if (e) out.push({ x: OX + ((h.x + e.x) / 2) * PX - cx, y: OY + ((h.y + e.y) / 2) * PX - cy - 10, r: 46, i: 0.6, c: [1, 0.95, 0.6] });
    const w = WINDS[h.relic];
    if (w && h.act === 'throw' && h.actT <= RELICS[h.relic].windup)
      out.push({ x: OX + h.x * PX - cx, y: OY + h.y * PX - cy, r: w.r * PX, i: 0.35, c: h.relic === 'firering' ? [1, 0.55, 0.25] : [1, 0.9, 0.65] });
  }
  return out;
}
