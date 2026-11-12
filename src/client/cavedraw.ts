/**
 * THE LISTENER's cave in the flat view (shared/cavearena.ts; the Listener itself is client/listendraw.ts):
 * the holes in the floor (dark pits with broken rims, a dust tremor at the one it will rise from), the lanes of
 * the dripstone columns that are falling (sim/columnshape.ts, striped like any floor you can only step out of),
 * the rock in flight and breaking, drips on the floor, and phase 2's dark: the torches and braziers out and the
 * ambient down, while the heroes keep their own light and the Listener its eyes. Drawing and sound only.
 */
import type { GameMap } from '../shared/arena';
import { LISTENER } from '../shared/listentune';
import { columnShapes } from '../sim/columnshape';
import type { ArenaRoom } from '../sim/room';
import type { Enemy, EnemyAttack } from '../sim/types';
import type { Ctx } from './draw';
import { drawTelegraph } from './foes';
import type { Fx } from './fx';
import type { Light } from './light';
import { lump } from './listendraw';
import { PAL } from './listenpose';
import { sfx } from './sfx';
import { OX, OY, PX } from './world';

type Item = { y: number; draw: () => void };
const hash = (n: number) => {
  const s = Math.sin(n * 57.3 + 7.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Where THE LISTENER is now (tiles), for the effects that ask (client/fxlisten.ts), and how dark the cave has gone (0..1). */
export const CAVE = { at: null as null | { x: number; y: number; under: boolean }, rock: null as null | { x: number; y: number }, dark: 0, last: 0 };
const BASE = new WeakMap<object, [number, number, number]>();
const listenerOf = (room: ArenaRoom): Enemy | undefined => room.enemies.find((e) => e.boss?.who === 'listener');
export const isCave = (map: GameMap) => !!map.holes?.length;

/**
 * Once a frame, before anything is drawn (both views): note where it is, and ease the cave toward dark or
 * light. The lamps and the ambient are the map theme's own (shared/lamps.ts `lamps`, the ambient), so every
 * torch, brazier and light pass in either view follows. Cosmetic.
 */
export function caveLook(room: ArenaRoom, now: number): void {
  const e = listenerOf(room), th = room.map.theme;
  if (!e) return void (CAVE.at = CAVE.rock = null);
  CAVE.at = { x: e.x, y: e.y, under: !!e.boss?.under };
  const a = e.attack;
  CAVE.rock = a && e.boss?.lmove === 'rock' ? { x: a.cx, y: a.cy } : null;
  const dt = Math.min(0.1, Math.max(0, now - CAVE.last));
  CAVE.last = now;
  const want = e.boss?.dark && e.act !== 'dead' ? 1 : 0;
  CAVE.dark += Math.max(-dt * 0.8, Math.min(dt * 0.8, want - CAVE.dark));
  if (!BASE.has(th)) BASE.set(th, [...th.ambient] as [number, number, number]);
  const b = BASE.get(th)!, k = 1 - 0.3 * CAVE.dark;
  th.lamps = 1 - CAVE.dark;
  th.ambient = [b[0] * k, b[1] * k, b[2] * k];
}

/** The holes, at the floor under everyone. */
export function caveScene(map: GameMap, c: Ctx, cx: number, cy: number, items: Item[]): void {
  (map.holes ?? []).forEach((h, i) => items.push({ y: -1e6 + 2, draw: () => drawHole(c, OX + h.x * PX - cx, OY + h.y * PX - cy, i) }));
}

function drawHole(c: Ctx, x: number, y: number, i: number): void {
  const g = c.lit, X = Math.round(x), Y = Math.round(y), rx = 15, ry = 7;
  // A broken rim: chips of stone round it, some fallen in, a crack or two running off.
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2 + hash(i * 9 + a) * 0.3, rr = 1 + hash(i * 5 + a) * 0.25;
    g.fillStyle = a % 3 === 0 ? '#2e2c3a' : a % 3 === 1 ? '#7c7a8e' : '#56546a';
    g.fillRect(Math.round(X + Math.cos(t) * (rx + 1) * rr), Math.round(Y + Math.sin(t) * (ry + 1) * rr), 1 + (a % 4 === 0 ? 1 : 0), 1);
  }
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.01))));
    g.fillStyle = dy === ry || dy === -ry ? '#3a3748' : '#1c1a24';
    g.fillRect(X - w - 1, Y + dy, w * 2 + 3, 1);
  }
  for (let dy = -ry + 1; dy < ry; dy++) {
    const w = Math.round((rx - 2) * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry - 1) * (ry - 1) + 0.01))));
    g.fillStyle = dy < -ry + 2 ? '#0e0d12' : dy > ry - 3 ? '#16141c' : '#07060a';
    g.fillRect(X - w, Y + dy, w * 2 + 1, 1);
  }
  // The lip catches light at the front; the back wall of the hole shows a little.
  g.fillStyle = '#6a667a';
  for (let dx = -9; dx <= 9; dx += 1) g.fillRect(X + dx, Y + ry - Math.round((dx * dx) / 40), 1, 1);
  g.fillStyle = '#26232e';
  for (let dx = -10; dx <= 10; dx += 2) g.fillRect(X + dx, Y - ry + 1 + Math.round((dx * dx) / 36), 1, 2);
  g.fillStyle = '#15131a';
  for (let k = 0; k < 4; k++) {
    const t = hash(i * 3 + k) * 6.28, len = 6 + hash(i + k * 7) * 8;
    for (let r = rx + 2; r < rx + 2 + len; r++) g.fillRect(Math.round(X + Math.cos(t) * r), Math.round(Y + Math.sin(t) * r * 0.5 + (r % 3 === 0 ? 1 : 0)), 1, 1);
  }
}

/** Under everyone: column lanes, the rise's tremor, the rock in flight and breaking, drips, grit. */
export function drawCaveMarks(c: Ctx, room: ArenaRoom, cx: number, cy: number, fx: Fx): void {
  const map = room.map;
  if (!isCave(map)) return;
  const t = room.time, now = c.now;
  for (const s of columnShapes(room.props, t)) drawTelegraph(c, s, cx, cy);
  const e = listenerOf(room), a = e?.attack;
  if (e && a && e.boss) {
    const m = e.boss.lmove, hx = OX + a.cx * PX - cx, hy = OY + a.cy * PX - cy;
    // (Under the floor it is 'carried', so the scene's own pass skips its blow: the rise's circle is shown here.)
    if (m === 'rise' && e.act !== 'attack') drawTelegraph(c, a, cx, cy);
    if (m === 'rise' && (e.boss.under || a.t < a.windup + 0.5)) tremor(c, hx, hy, Math.min(1, a.t / a.windup), a.t - a.windup, e.id);
    if (m === 'rock') rock(c, e, a, cx, cy, fx);
    if (m === 'charge' && a.t < a.windup) dustLane(c, a, cx, cy);
  }
  // Drips on the floor, a few, ringing where they land (the columns drip as they stand: columndraw.ts).
  for (let i = 0; i < 5; i++) {
    const ph = (now * 0.33 + hash(i * 13) * 4) % 1;
    if (ph > 0.2) continue;
    const fxx = OX + (1.2 + hash(i * 3 + 1) * (map.w - 2.4)) * PX - cx, fyy = OY + (2.5 + hash(i * 7 + 2) * (map.h - 4)) * PX - cy, d = ph / 0.2;
    c.glow.globalAlpha = 0.5 * (1 - d), c.glow.fillStyle = '#bfe0f4';
    c.glow.fillRect(Math.round(fxx - 1 - d * 2), Math.round(fyy), 3 + Math.round(d * 4), 1);
    c.glow.globalAlpha = 1;
  }
}

/** A hole it will rise from: the floor shudders, chips hop on the rim, cracks creep out, dust climbs; at the burst, rubble. */
function tremor(c: Ctx, x: number, y: number, k: number, since: number, id: number): void {
  const g = c.lit, X = Math.round(x), Y = Math.round(y);
  g.fillStyle = '#15131a';
  for (let j = 0; j < 7; j++) {
    const t = j * 0.9 + hash(id + j) * 0.4, len = Math.round(5 + 14 * k);
    for (let r = 14; r < 14 + len; r++) g.fillRect(Math.round(X + Math.cos(t) * r), Math.round(Y + Math.sin(t) * r * 0.5 + (r % 4 === 0 ? 1 : 0)), 1, 1);
  }
  for (let j = 0; j < 9; j++) {
    const t = j * 0.7 + 0.2, hop = Math.abs(Math.sin(c.now * (12 + j) + j)) * (1 + 3 * k);
    g.fillStyle = j % 2 ? '#8a889c' : '#5c5a6e';
    g.fillRect(Math.round(X + Math.cos(t) * 17), Math.round(Y + Math.sin(t) * 8 - hop), 2, 1);
  }
  for (let j = 0; j < 10; j++) {
    const ph = (c.now * (0.7 + 0.5 * k) + j / 10) % 1;
    g.globalAlpha = 0.55 * k * (1 - ph), g.fillStyle = '#a8a4b4';
    g.fillRect(Math.round(X + (hash(j + id) - 0.5) * 24), Math.round(Y - 2 - ph * (10 + 14 * k)), 2, 1);
  }
  g.globalAlpha = 1;
  // The burst: stone thrown up out of the mouth.
  if (since >= 0 && since < 0.5) for (let j = 0; j < 14; j++) {
    const a = j * 0.9 + 1, v = 22 + hash(j) * 30, tt = since;
    g.fillStyle = j % 3 ? '#8a889c' : '#4c4a5e';
    g.fillRect(Math.round(X + Math.cos(a) * v * tt * 1.2), Math.round(Y - 3 + Math.sin(a) * v * tt * 0.5 - (v * tt - 60 * tt * tt)), 2, 2);
  }
}

/** The rock: a lump hauled off, thrown in an arc to the circle it shows, and broken there. */
function rock(c: Ctx, e: Enemy, a: EnemyAttack, cx: number, cy: number, fx: Fx): void {
  const w = a.windup, T = LISTENER.rock.active, flight = 0.35, tt = a.t, done = oneShot(a);
  const f = e.fx < -0.2 ? -1 : 1, ex = OX + e.x * PX - cx, ey = OY + e.y * PX - cy, tx = OX + a.cx * PX - cx, ty = OY + a.cy * PX - cy;
  if (tt > w * 0.12 && done(1)) fx.burst(ex + f * 10, ey - 2, 8, ['#8a8494', '#6a647a', '#4c4a5e'], 40, false, 90, true), sfx.rumble();
  if (tt > w - flight && done(2)) sfx.throw(), fx.burst(ex + f * 6, ey - 34, 6, ['#a8a4b4', '#6a647a'], 35, false, 60, true);
  if (tt >= w - flight && tt < w) {
    const u = (tt - (w - flight)) / flight, sx = ex + f * 6, sy = ey - 44, x = sx + (tx - sx) * u, gy = ey + (ty - ey) * u, y = gy - 44 * (1 - u) - Math.sin(Math.PI * u) * 26;
    c.lit.fillStyle = 'rgba(8,6,12,0.45)', c.lit.fillRect(Math.round(x - 4), Math.round(gy), 8, 2);
    lump(c.lit, x, y, PAL);
    for (let i = 1; i <= 3; i++) (c.glow.globalAlpha = 0.25 / i), (c.glow.fillStyle = '#cfd0dc'), c.glow.fillRect(Math.round(x - (tx - sx) * 0.03 * i), Math.round(y + 3 + i), 2, 2);
    c.glow.globalAlpha = 1;
  } else if (tt >= w && tt < w + T + 0.35) {
    const s = tt - w;
    for (let j = 0; j < 9; j++) {
      const an = j * 0.7 + 0.4, v = 18 + hash(j + e.id) * 26;
      c.lit.fillStyle = j % 3 ? PAL.rock : PAL.rockLo;
      c.lit.fillRect(Math.round(tx + Math.cos(an) * v * s * 1.3), Math.round(ty - 2 + Math.sin(an) * v * s * 0.5 - (v * s - 70 * s * s)), 2, 2);
    }
  }
}

/** Run each marker once per attack (a bitmask on the attack object itself, never sent). */
const SEEN = new WeakMap<object, number>();
const oneShot = (a: object) => (bit: number) => {
  const m = SEEN.get(a) ?? 0;
  if (m & (1 << bit)) return false;
  return SEEN.set(a, m | (1 << bit)), true;
};

/** The charge winding up: dust kicked back along the lane it will run. */
function dustLane(c: Ctx, a: EnemyAttack, cx: number, cy: number): void {
  const k = Math.min(1, a.t / a.windup), x = OX + a.ox * PX - cx, y = OY + a.oy * PX - cy;
  for (let j = 0; j < 6; j++) {
    const ph = (c.now * 2 + j / 6) % 1;
    c.lit.globalAlpha = 0.5 * k * (1 - ph), c.lit.fillStyle = '#a8a4b4';
    c.lit.fillRect(Math.round(x - a.dx * (5 + ph * 12) + (hash(j) - 0.5) * 8), Math.round(y - a.dy * (5 + ph * 8) - ph * 5), 2, 1);
  }
  c.lit.globalAlpha = 1;
}

/**
 * Its lights (screen x, y of its feet): a cool pale fill so the grey-green skin reads in the torch-dark, its
 * eyes' own shine, a red wash through a wind-up; a pale breath at the hole it will rise from. In the dark it
 * keeps a steadier fill and brighter eyes (the room's torches are out). Cosmetic only.
 */
export function listenLights(e: Enemy, x: number, y: number, now: number, ax?: number, ay?: number): Light[] {
  const b = e.boss!, a = e.attack, d = CAVE.dark, out: Light[] = [];
  if (b.under) {
    if (a && ax !== undefined && ay !== undefined) out.push({ x: ax, y: ay - 4, r: 46, i: 0.15 + 0.2 * Math.min(1, a.t / a.windup), c: [0.7, 0.8, 0.9] });
    return out;
  }
  out.push({ x, y: y - 22, r: 74, i: 0.1 + 0.22 * d, c: [0.74, 0.86, 0.8] });
  out.push({ x, y: y - 38, r: 30 + 8 * d, i: 0.4 + 0.3 * d, c: [0.92, 0.97, 1] });
  if (a && a.t < a.windup + a.active && b.lmove !== 'drop') out.push({ x, y: y - 24, r: 60, i: 0.12 + 0.28 * Math.min(1, a.t / a.windup), c: [1, 0.25, 0.15] });
  void now;
  return out;
}
