/**
 * The Haulier's old working in the flat view (shared/sumparena.ts): the ore rail with its sleepers, the
 * winding gear over the shaft at the back (a wheel turning slowly, crackling when lightning falls on it),
 * the dark shaft mouth, the adit in the rock, and the ore carts (wheels turning with the roll, dust,
 * sparks, a jolt when one pulls up). The sump's water is the usual water. Drawing only.
 */
import type { GameMap } from '../shared/arena';
import type { Prop } from '../sim/types';
import { blit, line, shadow, type Ctx } from './draw';
import { HAUL_FX, secs } from './fxhaul';
import { propFlash } from './propshake';
import { SPRITES } from './sprites';
import { OX, OY, PX } from './world';

type Item = { y: number; draw: () => void };
const WOOD = '#5a3d22', WOOD_HI = '#7a5a38', WOOD_LO = '#3a2616', IRON = '#5e5a58', IRON_HI = '#9a968f', IRON_LO = '#34302f', RUST = '#6a4632';
const fill = (g: CanvasRenderingContext2D, col: string, x: number, y: number, w: number, h: number) => ((g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), w, h));

/** The working's ground and standing pieces, as scene items (the rail under everyone, the gear at its legs). */
export function sumpScene(map: GameMap, c: Ctx, cx: number, cy: number, items: Item[], phase2: boolean): void {
  const { rail, gear, adits } = map;
  if (rail) items.push({ y: -1e6 + 1, draw: () => drawRail(c, OX + rail.x0 * PX - cx, OX + rail.x1 * PX - cx, OY + rail.y * PX - cy) });
  if (gear) {
    const gx = OX + gear.x * PX - cx, gy = OY + gear.y * PX - cy;
    items.push({ y: -1e6 + 2, draw: () => drawShaft(c, gx, gy) }, { y: OY + (gear.y + 0.5) * PX + 0.2, draw: () => drawGear(c, gx, gy) });
  }
  for (const a of adits ?? []) items.push({ y: OY + (a.y + 0.4) * PX, draw: () => drawAdit(c, OX + a.x * PX - cx, OY + (a.y + 0.4) * PX - cy, phase2) });
}

function drawRail(c: Ctx, xa: number, xb: number, y: number): void {
  const g = c.lit;
  // Gravel and spilled ore along the bed.
  for (let x = Math.ceil(xa); x < xb; x += 3) {
    const h = (x * 7919) % 13;
    if (h < 6) fill(g, h < 2 ? '#4a4652' : '#3a3640', x, y - 7 + h * 2, 2, 1);
    if (h === 11) fill(g, '#8a6a3a', x, y + 7, 1, 1);
  }
  for (let x = Math.ceil(xa); x < xb - 2; x += 10) {
    fill(g, WOOD_LO, x, y - 5, 4, 11), fill(g, WOOD, x, y - 5, 3, 10), fill(g, WOOD_HI, x, y - 5, 3, 1);
    fill(g, IRON_HI, x, y - 3, 1, 1), fill(g, IRON_HI, x, y + 3, 1, 1);
  }
  for (const dy of [-3, 3]) {
    fill(g, IRON_LO, xa, y + dy + 1, xb - xa, 1), fill(g, '#8a8690', xa, y + dy, xb - xa, 1);
    for (let x = Math.ceil(xa) + 4; x < xb; x += 23) fill(g, RUST, x, y + dy, 5, 1);
  }
  // The buffers at each end.
  for (const bx of [xa - 3, xb - 1]) fill(g, IRON_LO, bx, y - 7, 5, 15), fill(g, IRON, bx, y - 7, 4, 13), fill(g, IRON_HI, bx, y - 7, 4, 1), fill(g, RUST, bx + 1, y - 2, 2, 3);
}

/** The shaft's mouth in the floor: a timber collar round a black drop, a lantern glinting far down. */
function drawShaft(c: Ctx, gx: number, gy: number): void {
  const g = c.lit, y = gy + 7;
  for (let dy = -7; dy <= 7; dy++) {
    const w = Math.round(15 * Math.sqrt(1 - (dy * dy) / 56)), edge = Math.abs(dy) >= 6;
    fill(g, edge ? WOOD_HI : WOOD_LO, gx - w, y + dy, w * 2 + 1, 1);
    const wi = Math.max(0, w - 2);
    if (!edge && wi) fill(g, dy < -3 ? '#0b0910' : '#050408', gx - wi, y + dy, wi * 2 + 1, 1);
  }
  fill(g, WOOD, gx - 15, y - 1, 3, 3), fill(g, WOOD, gx + 13, y - 1, 3, 3);
  if (Math.floor(c.now * 3.1) % 5) fill(c.glow, '#ff9a3c', gx + 4, y + 3, 1, 1);
}

/** The headframe over the shaft and the wheel in it: slow, or fast and crackling just after lightning. */
let wheel = { a: 0, at: 0 };
function drawGear(c: Ctx, gx: number, gy: number): void {
  const g = c.lit, now = secs(), dt = Math.min(0.1, Math.max(0, now - wheel.at)), k = Math.max(0, 1 - (now - HAUL_FX.gearAt) / 1.8);
  wheel = { a: wheel.a + (0.5 + k * 13) * dt, at: now };
  // The struts rise from the two posts (the rounds) to the wheel's bearings; two braces and a cap beam.
  const wy = gy - 34;
  for (const s of [-1, 1]) line(g, gx + s * 14, gy - 16, Math.atan2(wy - 4 - (gy - 16), -s * 10), 0, 24, WOOD, 3), line(g, gx + s * 14 - s, gy - 16, Math.atan2(wy - 4 - (gy - 16), -s * 10), 0, 24, WOOD_HI, 1);
  for (const by of [gy - 25, gy - 33]) { const w = Math.round(14 - ((gy - 16 - by) / 22) * 10); fill(g, WOOD_LO, gx - w, by, w * 2 + 1, 2), fill(g, WOOD, gx - w, by, w * 2 + 1, 1); }
  fill(g, IRON_LO, gx - 7, wy - 11, 15, 3), fill(g, IRON, gx - 7, wy - 11, 15, 2), fill(g, RUST, gx + 2, wy - 10, 3, 1);
  // The wheel: a rim of iron, six spokes, a hub.
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; fill(g, i % 4 ? IRON : IRON_HI, gx + Math.cos(a) * 10, wy + Math.sin(a) * 10, 2, 2); }
  for (let i = 0; i < 6; i++) line(g, gx, wy, wheel.a + (i * Math.PI) / 3, 1, 9, i % 2 ? IRON : '#7a7684');
  fill(g, IRON_LO, gx - 2, wy - 2, 5, 5), fill(g, IRON_HI, gx - 1, wy - 1, 3, 3), fill(g, RUST, gx, wy, 1, 1);
  // The rope down into the shaft, and the bucket riding it up and down.
  for (let y = wy + 10; y < gy + 6; y += 2) fill(g, '#6a5a3a', gx - 1, y, 1, 1);
  const by = gy - 6 + Math.sin(c.now * 0.6) * 9;
  fill(g, IRON_LO, gx - 4, by, 7, 6), fill(g, IRON, gx - 4, by, 7, 1), fill(g, '#5c5866', gx - 3, by - 1, 5, 1), fill(g, '#c8a84a', gx, by - 1, 1, 1);
  // Lightning on it: arcs off the wheel and the cap.
  if (k > 0) {
    const gl = c.glow, n = HAUL_FX.gearHit ? 5 : 2;
    gl.globalAlpha = Math.min(1, k * 1.4);
    for (let b = 0; b < n; b++) {
      let x = gx + (b % 2 ? 3 : -3), y = wy - 9;
      const dir = (b / n) * Math.PI * 2 + Math.random() * 0.8;
      for (let s = 0; s < 7; s++) {
        fill(gl, s % 3 ? '#bfe0ff' : '#ffffff', x, y, 1, 1);
        x += Math.cos(dir) * 3 + (Math.random() - 0.5) * 3, y += Math.sin(dir) * 3 + (Math.random() - 0.5) * 3;
      }
    }
    for (let i = 0; i < 6; i++) fill(gl, '#8ab8ff', gx + Math.cos(wheel.a * 3 + i) * 11, wy + Math.sin(wheel.a * 3 + i) * 11, 1, 1);
    gl.globalAlpha = 1;
  }
}

/** The adit: a black arch in the rock under timbers; in phase 2 eyes show far back in it. */
function drawAdit(c: Ctx, x: number, y: number, phase2: boolean): void {
  const g = c.lit, w = 9, h = 24;
  fill(g, WOOD_LO, x - w - 3, y - h - 2, w * 2 + 7, h + 3);
  for (let dy = 0; dy < h; dy++) {
    const half = dy < 7 ? Math.round(Math.sqrt(Math.max(0, w * w - (7 - dy) * (7 - dy)))) : w;
    fill(g, dy < 2 ? '#0e0c14' : '#040308', x - half, y - h + dy, half * 2 + 1, 1);
  }
  fill(g, WOOD, x - w - 3, y - h + 4, 3, h - 4), fill(g, WOOD, x + w + 1, y - h + 4, 3, h - 4), fill(g, WOOD_HI, x - w - 3, y - h + 4, 1, h - 4), fill(g, WOOD_HI, x + w + 1, y - h + 4, 1, h - 4);
  fill(g, WOOD, x - w - 4, y - h - 3, w * 2 + 9, 3), fill(g, WOOD_HI, x - w - 4, y - h - 3, w * 2 + 9, 1), fill(g, IRON, x - 3, y - h - 3, 2, 3);
  fill(g, '#2a2630', x - w, y - 1, w * 2 + 1, 2), fill(g, '#4a4652', x - w, y - 2, w * 2 + 1, 1);
  if (phase2 && Math.floor(c.now * 1.7) % 4) for (const dx of [-3, 2]) fill(c.glow, '#ff6a30', x + dx, y - 12, 2, 1);
}

const WHEEL = new Map<number, { a: number; at: number }>();
const cartKick = (p: Prop): number => {
  const j = HAUL_FX.jolt, age = j ? secs() - j.at : 9;
  return j && age < 0.35 && Math.hypot(OX + p.x * PX - j.x, OY + p.y * PX - j.y) < 36 ? Math.round(Math.sin(age * 55) * 2 * (1 - age / 0.35)) : 0;
};

/** An ore cart on the rail: its body, wheels turning with `roll`, dust and sparks while it runs, a jolt as it stops. */
export function drawCart(c: Ctx, p: Prop, x: number, y: number, t: number): void {
  const g = c.lit, now = secs(), st = WHEEL.get(p.id) ?? { a: 0, at: now }, dt = Math.min(0.1, now - st.at), roll = p.roll ?? 0, fast = Math.abs(roll) > 1;
  st.a += (roll * PX * dt) / 3, st.at = now, WHEEL.set(p.id, st);
  shadow(c, x, y, 11);
  const kx = cartKick(p), bump = fast ? Math.round(Math.sin(now * 38)) * 0 + (Math.floor(now * 30) % 2 ? 0 : -1) : 0, cxp = Math.round(x) + kx, cyp = Math.round(y) + 1 + bump;
  blit(c, SPRITES.cart, cxp, cyp, false, propFlash(p, t) ? 0.8 : 0);
  for (const wx of [-6, 6]) {
    const px = cxp + wx, py = cyp - 3;
    for (let dy = -3; dy <= 3; dy++) { const w = Math.round(Math.sqrt(Math.max(0, 12.5 - dy * dy))); fill(g, dy > 1 ? IRON_LO : '#2a2630', px - w + 1, py + dy, w * 2 - 1, 1); }
    for (let i = 0; i < 4; i++) { const a = st.a + (i * Math.PI) / 2; fill(g, i % 2 ? IRON_HI : '#7a7684', px + Math.cos(a) * 2, py + Math.sin(a) * 2, 1, 1); }
    fill(g, RUST, px, py, 1, 1);
  }
  if (!fast) return;
  const dir = roll > 0 ? 1 : -1, gl = c.glow;
  g.globalAlpha = 0.55;
  for (let i = 0; i < 7; i++) { const age = (now * 2.4 + i / 7) % 1; fill(g, '#8a8494', cxp - dir * (10 + age * 16), cyp - 2 - age * 7 - (i % 2), 2 + (age > 0.5 ? 1 : 0), 2); }
  g.globalAlpha = 1;
  if (Math.abs(roll) > 3) for (let i = 0; i < 3; i++) if (Math.floor(now * 25 + i * 3) % 3) fill(gl, i ? '#ffd27a' : '#ffb44c', cxp - dir * (9 + ((now * 70 + i * 5) % 8)), cyp - 1 - (i % 2), 1, 1);
}
