/**
 * Hangman's Wood, drawn in both views from the room alone (shared/hangwood.ts lays it, sim/snares.ts,
 * dropper.ts, hangfire.ts, woodzone.ts run it). On the ground (flat glow layer, the 2.5D overlay): each
 * snare a faint striped mark; a dropper's shadow circle with its striped edge, darkening as it comes down;
 * the oak's burning wood coming down, each a striped red circle; the ring at the mid-point's fire. Stood
 * up (flat items, 2.5D cards): the gibbet's cage on its chain at the height the winch has it, someone in it
 * waving; Hew's axe marks on the trunks; the fire itself. A perched dropper's rope, a hooded snarer's coil
 * and a hoisted hero's rope are drawn with the body (strawman.ts, foekits.ts, actors.ts). Drawing only.
 */
import { CHECK, DROPPER, OAK, SNARER } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Enemy, Hero } from '../sim/types';
import type { Ctx } from './draw';
import type { Ground } from './expeddraw';
import { PX } from './world';
import { drawRopes } from './hempendraw';

/** A circle on the ground: a dark fill (`fill` how dark), its edge in stripes of two colours. */
function striped(g: CanvasRenderingContext2D, P: Ground, x: number, y: number, r: number, a: string, b: string, alpha: number, fill: number): void {
  const n = Math.max(12, Math.round(r * 26));
  if (fill > 0) {
    g.globalAlpha = fill;
    g.fillStyle = '#1a0a08';
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2, [px, py] = P(x + Math.cos(t) * r, y + Math.sin(t) * r);
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.fill();
  }
  g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, [px, py] = P(x + Math.cos(t) * r, y + Math.sin(t) * r);
    g.fillStyle = Math.floor(i / 2) % 2 ? a : b;
    g.fillRect(Math.round(px), Math.round(py), 2, 1);
  }
  g.globalAlpha = 1;
}

/** Live goblins up a tree with their drop coming. */
const dropping = (e: Enemy, t: number) => e.task?.k === 'perch' && e.task.at !== undefined && e.task.at !== -1 && e.task.at > t - 0.05 && e.act !== 'dead';

export function drawWoodGround(g: CanvasRenderingContext2D, room: ArenaRoom, P: Ground, now: number): void {
  const hang = room.map.hang, t = room.time;
  if (!hang || room.indoors) return;
  // Snares: faint, a rope's pale and a dull red (you have to look for them).
  for (const n of room.nooses ?? []) striped(g, P, n.x, n.y, SNARER.r, '#a8946a', '#6a2a20', t - n.at < SNARER.arm ? 0.25 : 0.55, 0);
  // A dropper coming down: its shadow darkening on the spot, a striped red edge (walk out of it).
  for (const e of room.enemies) if (dropping(e, t) && e.task?.k === 'perch') {
    const k = Math.max(0, Math.min(1, 1 - (e.task.at! - t) / DROPPER.fall));
    striped(g, P, e.task.tx!, e.task.ty!, DROPPER.r * (0.55 + 0.45 * k), '#ff4a3a', '#f0e0d0', 0.9, 0.2 + 0.45 * k);
  }
  // Burning wood coming down off the oak.
  const oak = room.map.blocks[hang.oak];
  for (const [x, y, at] of oak?.falls ?? []) {
    const k = Math.max(0, Math.min(1, 1 - (at - t) / OAK.warn));
    striped(g, P, x, y, OAK.fall, '#ff4a3a', '#ffd27a', 0.75 + 0.25 * Math.sin(now * 14), 0.1 + 0.35 * k);
  }
  // Hempen's ropes coming down on a second hero (hempendraw.ts).
  drawRopes(g, room.enemies, P, t, now);
  // The mid-point's fire, still to light: a ring of gold dots filling as you stand there.
  const c = room.exped?.wood?.check;
  if (c && !c.lit) for (let i = 0, n = 26; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2, [px, py] = P(c.x + Math.cos(a) * CHECK.r, c.y + Math.sin(a) * CHECK.r), lit = i / n < c.p;
    if (!lit && (i + Math.floor(now * 6)) % 3 === 0) continue;
    g.fillStyle = lit ? '#ffd27a' : '#a0782a';
    g.fillRect(Math.round(px), Math.round(py), lit ? 2 : 1, lit ? 2 : 1);
  }
}

export interface WoodFig { key: string; x: number; y: number; draw: (c: Ctx, px: number, py: number) => void }

/** The things that stand up: the cage on its chain, Hew's marks, the fire. */
export function woodFigs(room: ArenaRoom, t: number): WoodFig[] {
  const hang = room.map.hang, out: WoodFig[] = [];
  if (!hang || room.indoors) return out;
  const winch = room.exped?.goals.find((g) => g.kind === 'winch');
  if (winch && !winch.done) out.push({ key: 'cage', x: hang.cage.x, y: hang.cage.y, draw: (c, px, py) => drawGibbetCage(c, px, py, winch.p, t) });
  hang.blazes.forEach((b, i) => out.push({ key: 'bl' + i, x: b.x, y: b.y + b.r * 0.4 + 0.02, draw: (c, px, py) => drawBlaze(c, px, py, i) }));
  const check = room.exped?.wood?.check ?? { ...hang.check, lit: false };
  out.push({ key: 'fire', x: hang.check.x, y: hang.check.y, draw: (c, px, py) => drawFirePit(c, px, py, check.lit, t) });
  return out;
}

/** The iron cage on its chain from the gibbet's arm, at the height the winch has it (`p` 0 up, 1 down), someone in it. */
export function drawGibbetCage(c: Ctx, x: number, y: number, p: number, t: number): void {
  const g = c.lit, arm = Math.round(y - 3.25 * PX), up = Math.round((1 - p) * 2.1 * PX + 0.2 * PX), sway = Math.round(Math.sin(t * 1.3) * (1 + (1 - p)));
  const top = y - up - 18;
  g.fillStyle = '#55505e';
  for (let yy = arm; yy < top; yy += 2) g.fillRect(Math.round(x + (sway * (yy - arm)) / Math.max(1, top - arm)), yy, 1, 1);
  const cx = Math.round(x + sway);
  // The iron: a dark outline; someone in it, hunched, a pale face; the bars catching what light there is; an arm out waving.
  g.fillStyle = '#14121a', g.fillRect(cx - 7, top - 1, 14, 20);
  g.fillStyle = '#5a4a3a', g.fillRect(cx - 3, top + 6, 6, 9);
  g.fillStyle = '#d8b090', g.fillRect(cx - 2, top + 3, 4, 3);
  g.fillStyle = '#7a7480';
  for (const bx of [-6, -3, 0, 3, 5]) g.fillRect(cx + bx, top, 1, 18);
  g.fillRect(cx - 6, top, 12, 1), g.fillRect(cx - 6, top + 17, 12, 2), g.fillRect(cx - 3, top - 2, 6, 2);
  if (Math.floor(t * 3) % 2) (g.fillStyle = '#d8b090'), g.fillRect(cx + 6, top + 4 + Math.round(Math.sin(t * 8)), 3, 1);
  // Its shadow on the ground, smaller the higher it hangs.
  g.globalAlpha = 0.35, (g.fillStyle = '#000');
  g.fillRect(Math.round(x - 4 + up * 0.05), Math.round(y - 1), Math.max(4, 8 - Math.round(up / 10)), 2);
  g.globalAlpha = 1;
}

/** An axe mark cut in a trunk: the bark taken off in a pale slash, the cut wood showing. */
export function drawBlaze(c: Ctx, x: number, y: number, i: number): void {
  const g = c.lit, h = Math.round(y - 14 - (i % 2) * 3);
  g.fillStyle = '#2a1e14', g.fillRect(Math.round(x - 2), h - 1, 5, 6);
  g.fillStyle = '#d8c8a0', g.fillRect(Math.round(x - 1), h, 3, 4);
  g.fillStyle = '#b09a72', g.fillRect(Math.round(x - 1), h + 3, 3, 1);
}

/** The mid-point's fire: a ring of stones, cold ash or flames. */
export function drawFirePit(c: Ctx, x: number, y: number, lit: boolean, t: number): void {
  const g = c.lit;
  g.fillStyle = '#6a6470';
  for (let i = 0; i < 8; i++) g.fillRect(Math.round(x + Math.cos((i / 8) * Math.PI * 2) * 7), Math.round(y - 2 + Math.sin((i / 8) * Math.PI * 2) * 3), 3, 2);
  g.fillStyle = '#2a2420', g.fillRect(Math.round(x - 4), Math.round(y - 3), 8, 3);
  if (!lit) return;
  for (let i = 0; i < 5; i++) {
    const h = 4 + Math.round(3 * (0.5 + 0.5 * Math.sin(t * 9 + i * 1.7))), fx = Math.round(x - 3 + i * 1.5);
    c.glow.fillStyle = i % 2 ? '#ff9a3c' : '#ffd27a';
    c.glow.fillRect(fx, Math.round(y - 3 - h), 1, h);
  }
}

/** A dropper up a tree: its rope going up into the branches over it (with the body: strawman.ts). */
export function drawPerchRope(c: Ctx, e: Enemy, x: number, y: number): void {
  if (e.task?.k !== 'perch' || e.task.at === -1 || e.act === 'dead') return;
  c.lit.fillStyle = '#8a7a5a';
  for (let yy = Math.round(y - 40); yy < Math.round(y - 10); yy++) c.lit.fillRect(Math.round(x + 2), yy, 1, 1);
}

/** A hoisted hero (actors.ts): the rope from their ankles up out of sight, a loop round them. */
export function drawHoistRope(c: Ctx, h: Hero, x: number, y: number): void {
  if (!h.hoisted) return;
  const g = c.lit;
  g.fillStyle = '#a8946a';
  for (let yy = Math.round(y - 52); yy < Math.round(y - 2); yy++) g.fillRect(Math.round(x + (yy % 7 === 0 ? 1 : 0)), yy, 1, 1);
  g.fillRect(Math.round(x - 3), Math.round(y - 3), 7, 1);
  g.globalAlpha = 0.35, (g.fillStyle = '#000'), g.fillRect(Math.round(x - 4), Math.round(y + 8), 9, 2), (g.globalAlpha = 1);
}

/** The fire's light once it's lit, in tiles (both views). */
export function zoneLights(room: ArenaRoom, now: number): { x: number; y: number; r: number; i: number; c: [number, number, number] }[] {
  const c = room.exped?.wood?.check, out: { x: number; y: number; r: number; i: number; c: [number, number, number] }[] = [];
  if (c?.lit && !room.indoors) out.push({ x: c.x, y: c.y, r: 4.2 + Math.sin(now * 7) * 0.2, i: 0.9, c: [1, 0.6, 0.28] });
  return out;
}

/** What a snarer carries (foekits.ts hands it here): a coil of rope over its shoulder, a stake and mallet in hand; kneeling, a noose spread on the ground before it. */
export function drawSnarerKit(c: Ctx, e: Enemy, bx: number, by: number, hx: number, hy: number, f: number): void {
  const g = c.lit;
  g.fillStyle = '#a8946a';
  for (let i = 0; i < 5; i++) g.fillRect(Math.round(bx - f * 2 + Math.cos(i * 1.3) * 3), Math.round(by - 10 + Math.sin(i * 1.3) * 2), 1, 1);
  g.fillStyle = '#6a5038', g.fillRect(hx, hy - 3, 1, 4);
  g.fillStyle = '#8a7a5a', g.fillRect(hx - 1, hy - 4, 3, 1);
  if (e.act === 'stunned' && e.cooldown > 0) (g.fillStyle = '#a8946a'), g.fillRect(Math.round(bx + f * 4), Math.round(by), 4, 1), g.fillRect(Math.round(bx + f * 4 + 1), Math.round(by - 1), 2, 1);
}
