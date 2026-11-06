/**
 * A house on fire inside, drawn from the same plan and clock the rules judge (shared/blaze.ts,
 * sim/blaze.ts): a patch about to catch smokes with its edge dotted on the floor; a burning one is
 * flames over the whole of it with a hot edge (stand in it and you burn); a beam's circle fills like an
 * unblockable blow before it lands, then it lies burning where it fell; in the last seconds before the
 * roof comes in, dust and embers pour down everywhere.
 */
import { beamArea, roofGoing, smoking } from '../shared/blaze';
import type { Area } from '../shared/arena';
import { HOUSEFIRE } from '../shared/tuning';
import type { EnemyAttack } from '../sim/types';
import type { ArenaRoom } from '../sim/room';
import type { Ctx } from './draw';
import { drawTelegraph } from './foes';
import type { Light } from './light';
import { OX, OY, PX } from './world';

const FLAME = ['#fff1b0', '#ffd27a', '#ffb44c', '#ff8a30', '#ff6a20', '#d8441a'];

function edge(c: Ctx, a: Area, cx: number, cy: number, col: string, alpha: number, every: number): void {
  const x = Math.round(OX + a.x * PX - cx), y = Math.round(OY + a.y * PX - cy), w = Math.round(a.w * PX), h = Math.round(a.h * PX), g = c.glow;
  g.globalAlpha = alpha;
  g.fillStyle = col;
  for (let i = 0; i < w; i += every) g.fillRect(x + i, y, 1, 1), g.fillRect(x + i, y + h - 1, 1, 1);
  for (let j = 0; j < h; j += every) g.fillRect(x, y + j, 1, 1), g.fillRect(x + w - 1, y + j, 1, 1);
  g.globalAlpha = 1;
}

/** Flames over a whole area: char under them, tongues flickering up from every few pixels. */
function flames(c: Ctx, a: Area, cx: number, cy: number, seed: number): void {
  const x = Math.round(OX + a.x * PX - cx), y = Math.round(OY + a.y * PX - cy), w = Math.round(a.w * PX), h = Math.round(a.h * PX), t = c.now;
  c.lit.fillStyle = '#1a1210';
  c.lit.globalAlpha = 0.6;
  c.lit.fillRect(x, y, w, h);
  c.lit.globalAlpha = 1;
  for (let j = 2; j < h; j += 4) for (let i = 1 + (j % 3); i < w - 1; i += 3) {
    const s = i * 1.7 + j * 2.3 + seed, tall = 2 + Math.round(3 * (0.5 + 0.5 * Math.sin(t * 11 + s)));
    for (let k = 0; k < tall; k++) {
      c.glow.fillStyle = FLAME[Math.min(FLAME.length - 1, Math.floor(((k + 1) / tall) * FLAME.length))];
      c.glow.fillRect(x + i + Math.round(Math.sin(t * 7 + s + k) * 0.6), y + j - k, 1, 1);
    }
  }
  edge(c, a, cx, cy, '#ff6a20', 0.9, 2);
}

/** Under everyone: the patches, the beams' circles and where they lie. */
export function drawBlaze(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  const b = room.map.blaze;
  if (!b) return;
  const t = room.time, fallen = !!room.blaze?.fallen;
  b.patches.forEach((p, i) => {
    if (t >= p.at && !fallen) return flames(c, p, cx, cy, i * 13);
    if (!smoking(p, t)) return;
    // About to catch: smoke curling up off it, its edge dotted, quickening.
    const k = 1 - (p.at - t) / HOUSEFIRE.warn;
    edge(c, p, cx, cy, '#ff8a30', 0.35 + 0.45 * k * (0.5 + 0.5 * Math.sin(c.now * (6 + 10 * k))), 3);
    c.lit.fillStyle = '#5a5458';
    for (let s = 0; s < 6; s++) {
      const q = (c.now * 0.5 + s / 6) % 1;
      c.lit.globalAlpha = (1 - q) * 0.5 * k;
      c.lit.fillRect(Math.round(OX + (p.x + ((s * 0.37) % 1) * p.w) * PX - cx + Math.sin(q * 5 + s) * 2), Math.round(OY + (p.y + p.h / 2) * PX - cy - q * 22), 3, 2);
    }
    c.lit.globalAlpha = 1;
  });
  for (const m of b.beams) {
    const lead = m.at - t;
    if (lead > 0 && lead <= HOUSEFIRE.beamWarn) {
      // A falling beam's circle: the striped edge of a blow you can't block, filling as it comes.
      const a = { kind: 'slam', cx: m.x, cy: m.y, radius: HOUSEFIRE.beamR, t: HOUSEFIRE.beamWarn - lead, windup: HOUSEFIRE.beamWarn, active: 0.1, unblockable: true } as EnemyAttack;
      drawTelegraph(c, a, cx, cy);
    } else if (lead <= 0) {
      const a = beamArea(m.x, m.y), x = Math.round(OX + a.x * PX - cx), y = Math.round(OY + a.y * PX - cy), hot = -lead < HOUSEFIRE.beamBurn && !fallen;
      c.lit.fillStyle = hot ? '#2a1a10' : '#1a1410';
      c.lit.fillRect(x, y + 2, Math.round(a.w * PX), 4);
      c.lit.fillStyle = '#3a2a1a';
      c.lit.fillRect(x, y + 2, Math.round(a.w * PX), 1);
      if (hot) flames(c, a, cx, cy, m.x * 7);
    }
  }
}

/** Over everyone: a beam in the last instant of its fall, and the roof coming apart at the end. */
export function drawBlazeAbove(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  const b = room.map.blaze;
  if (!b || room.blaze?.fallen) return;
  const t = room.time;
  for (const m of b.beams) {
    const lead = m.at - t;
    if (lead <= 0 || lead > 0.3) continue;
    const x = Math.round(OX + (m.x - 0.9) * PX - cx), y = Math.round(OY + m.y * PX - cy - (lead / 0.3) * 70) - 4;
    c.lit.fillStyle = '#3a2a1a';
    c.lit.fillRect(x, y, Math.round(1.8 * PX), 4);
    c.glow.fillStyle = '#ff8a30';
    for (let i = 0; i < 1.8 * PX; i += 3) c.glow.fillRect(x + i, y - 1 - (i % 2), 1, 1);
  }
  if (!roofGoing(b, t)) return;
  // Dust and embers coming down all over, thicker as the roof goes.
  const k = 1 - (b.fall - t) / HOUSEFIRE.fallWarn, n = Math.round(20 + 80 * k), W = room.map.w * PX, H = room.map.h * PX;
  for (let i = 0; i < n; i++) {
    const q = (c.now * (0.7 + (i % 5) * 0.12) + i * 0.618) % 1, px = OX + ((i * 97.13) % W) - cx, py = OY - 20 + q * (H + 20) - cy;
    if (i % 4) (c.lit.fillStyle = i % 3 ? '#6a6058' : '#45403c'), c.lit.fillRect(Math.round(px), Math.round(py), 1, 2);
    else (c.glow.fillStyle = q < 0.5 ? '#ffd27a' : '#ff6a20'), c.glow.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
}

/** The fire's light: every patch alight and every beam still burning. */
export function blazeLights(room: ArenaRoom, cx: number, cy: number, now: number, out: Light[]): void {
  const b = room.map.blaze;
  if (!b || room.blaze?.fallen) return;
  const t = room.time, glow = (a: Area, i: number, s: number) =>
    out.push({ x: OX + (a.x + a.w / 2) * PX - cx, y: OY + (a.y + a.h / 2) * PX - cy - 8, r: (40 + a.w * 12) * s + Math.sin(now * 12 + i) * 3, i: 0.9 * s, c: [1, 0.55, 0.25] });
  b.patches.forEach((p, i) => (t >= p.at ? glow(p, i, 1) : smoking(p, t) && glow(p, i, 0.35)));
  b.beams.forEach((m, i) => t >= m.at && t < m.at + HOUSEFIRE.beamBurn && glow(beamArea(m.x, m.y), i + 9, 0.7));
}
