/**
 * The Haulier's old working in the flat view (shared/sumparena.ts): the tracks (sleepers, two rails, crossings, lamps that light amber
 * when a cart is coming, the tunnel mouths at their ends), the
 * winding gear over the shaft at the back (a wheel turning slowly, crackling when lightning falls on it),
 * the dark shaft mouth, the adit in the rock, and the ore carts (wheels turning with the roll, dust,
 * sparks, a jolt when one pulls up). The sump's water is the usual water. Drawing only.
 */
import type { GameMap } from '../shared/arena';
import type { Prop } from '../sim/types';
import type { Light } from './light';
import { blit, line, shadow, type Ctx } from './draw';
import { HAUL_FX, secs } from './fxhaul';
import { propFlash } from './propshake';
import { SPRITES } from './sprites';
import { OX, OY, PX } from './world';
import { drawBed, fill, IRON, IRON_HI, IRON_LO, mouthsOf, RUST, seg, tf, WOOD, WOOD_HI, WOOD_LO, type Seg, type Tr } from './trackbed';
export { mouthsOf, paintTracks } from './trackbed';

type Item = { y: number; draw: () => void };

/** A track's warning as the screen needs it: which, and whether its lamps are lit (it is, from the warning's start to the cart's going). */
export type TrackLit = { i: number } | null;


/** The lamps along a track (tile coordinates): every three tiles, alternate sides, a post beside the sleepers. */
export function trackLamps(t: Tr): { x: number; y: number }[] {
  const len = Math.hypot(t.x1 - t.x0, t.y1 - t.y0), vert = t.x0 === t.x1, out: { x: number; y: number }[] = [];
  for (let u = 1.5, k = 0; u < len - 0.8; u += 3, k++) {
    const a = k % 2 ? 0.75 : -0.75;
    out.push(vert ? { x: t.x0 + a, y: Math.min(t.y0, t.y1) + u } : { x: Math.min(t.x0, t.x1) + u, y: t.y0 + a });
  }
  return out;
}

/** The working's ground and standing pieces, as scene items (the tracks under everyone, the gear at its legs). */
export function sumpScene(map: GameMap, c: Ctx, cx: number, cy: number, items: Item[], phase2: boolean, lit: TrackLit = null): void {
  const { rail, gear, adits, tracks } = map;
  // (The old single rail, where a map still has one and no tracks: THE LOADING STAGE.)
  if (rail && !tracks) items.push({ y: -1e6 + 1, draw: () => drawBed(c, seg({ x0: rail.x0, y0: rail.y, x1: rail.x1, y1: rail.y }, cx, cy), false) });
  if (tracks) {
    // Every bed's sleepers first, then every pair of rails, so a crossing reads as rails over sleepers.
    items.push({ y: -1e6 + 1, draw: () => tracks.forEach((t) => drawBed(c, seg(t, cx, cy), false)) });
    items.push({ y: -1e6 + 1.5, draw: () => tracks.forEach((t) => drawBed(c, seg(t, cx, cy), true)) });
    tracks.forEach((t, i) => {
      for (const l of trackLamps(t)) items.push({ y: OY + l.y * PX + 3, draw: () => drawLamp(c, OX + l.x * PX - cx, OY + l.y * PX - cy, lit?.i === i) });
      for (const [x, y, side] of mouthsOf(t, map)) items.push({ y: side === 't' ? -1e6 + 3 : OY + y * PX + (side === 'b' ? 20 : 4), draw: () => drawMouth(c, OX + x * PX - cx, OY + y * PX - cy, side, lit?.i === i) });
    });
  }
  if (gear) {
    const gx = OX + gear.x * PX - cx, gy = OY + gear.y * PX - cy;
    items.push({ y: -1e6 + 2, draw: () => drawShaft(c, gx, gy) }, { y: OY + (gear.y + 0.5) * PX + 0.2, draw: () => drawGear(c, gx, gy) });
  }
  for (const a of adits ?? []) items.push({ y: OY + (a.y + 0.4) * PX, draw: () => drawAdit(c, OX + a.x * PX - cx, OY + (a.y + 0.4) * PX - cy, phase2) });
}

/** The amber light of a lit track's lamps (screen coordinates, relative to the camera as the scene's others are). */
export function trackLights(map: GameMap, lit: TrackLit, cx: number, cy: number, now: number): Light[] {
  const t = lit && map.tracks?.[lit.i];
  if (!t) return [];
  return trackLamps(t).map((l, k) => ({ x: OX + l.x * PX - cx, y: OY + l.y * PX - cy - 6, r: 40, i: 0.5 + 0.2 * Math.sin(now * 17 + k * 2.3), c: [1, 0.68, 0.28] as [number, number, number] }));
}



/** A lamp on its post beside the track: dark and dim; lit, an amber flame that gutters, with a glow round it. */
function drawLamp(c: Ctx, x: number, y: number, lit: boolean): void {
  const g = c.lit, X = Math.round(x), Y = Math.round(y);
  fill(g, WOOD_LO, X - 1, Y - 8, 3, 9), fill(g, WOOD, X - 1, Y - 8, 2, 8);
  fill(g, IRON_LO, X - 2, Y - 12, 5, 5), fill(g, IRON, X - 2, Y - 12, 5, 1);
  if (!lit) return void fill(g, '#6a5430', X, Y - 10, 1, 2);
  const f = Math.floor(c.now * 14 + X) % 3, gl = c.glow;
  fill(g, '#ffb04a', X - 1, Y - 11, 3, 3), fill(gl, '#fff0b0', X, Y - 10, 1, 1 + (f ? 1 : 0));
  gl.globalAlpha = 0.35 + 0.1 * f;
  fill(gl, '#ffb04a', X - 3, Y - 12, 7, 7);
  gl.globalAlpha = 1;
}

/** A tunnel mouth at a track's end: a dark arch in the rock under timber props; lit, a warm glow on its floor. */
function drawMouth(c: Ctx, x: number, y: number, side: 'l' | 'r' | 't' | 'b', lit: boolean): void {
  const g = c.lit, X = Math.round(x), Y = Math.round(y);
  if (side === 't') return drawAdit(c, X, Y, false);
  if (side === 'b') {
    fill(g, WOOD_LO, X - 14, Y - 14, 29, 14), fill(g, '#040308', X - 11, Y - 11, 23, 11), fill(g, '#0e0c14', X - 11, Y - 11, 23, 2);
    fill(g, WOOD, X - 14, Y - 15, 3, 15), fill(g, WOOD, X + 12, Y - 15, 3, 15), fill(g, WOOD_HI, X - 14, Y - 15, 1, 15), fill(g, WOOD_HI, X + 12, Y - 15, 1, 15);
    fill(g, WOOD, X - 15, Y - 17, 31, 3), fill(g, WOOD_HI, X - 15, Y - 17, 31, 1);
  } else {
    // On the side wall: it faces the room, so the arch is seen front-on, half of it in the floor's edge.
    const d = side === 'l' ? 1 : -1, ex = X + (d > 0 ? 0 : -12);
    fill(g, WOOD_LO, ex, Y - 24, 12, 33);
    fill(g, '#040308', ex + (d > 0 ? 0 : 3), Y - 20, 9, 29), fill(g, '#0e0c14', ex + (d > 0 ? 0 : 3), Y - 20, 9, 2);
    fill(g, WOOD, ex + (d > 0 ? 9 : 0), Y - 24, 3, 33), fill(g, WOOD_HI, ex + (d > 0 ? 9 : 0), Y - 24, 1, 33);
    fill(g, WOOD, ex, Y - 26, 12, 3), fill(g, WOOD_HI, ex, Y - 26, 12, 1);
  }
  if (lit) {
    const gl = c.glow, f = Math.floor(c.now * 14) % 3;
    gl.globalAlpha = 0.25 + 0.08 * f;
    fill(gl, '#ffb04a', side === 'b' ? X - 10 : side === 'l' ? X : X - 11, side === 'b' ? Y - 10 : Y - 18, side === 'b' ? 21 : 11, side === 'b' ? 10 : 27);
    gl.globalAlpha = 1;
  }
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

/** An ore cart coming or going down the screen: its end, a heap of ore over the box, the wheels at its sides. */
function drawCartEnd(c: Ctx, x: number, y: number, now: number, sp: number): void {
  const g = c.lit, X = Math.round(x), Y = Math.round(y) - 2 + (Math.floor(now * 30) % 2 ? 0 : -1);
  fill(g, IRON_LO, X - 7, Y - 11, 15, 12), fill(g, '#5c5866', X - 6, Y - 11, 13, 10), fill(g, IRON_HI, X - 6, Y - 11, 13, 1);
  fill(g, '#2a2630', X - 5, Y - 9, 11, 3), fill(g, '#8a6a3a', X - 4, Y - 13, 9, 3), fill(g, '#a8844a', X - 2, Y - 14, 4, 1);
  for (const wx of [-8, 7]) fill(g, '#2a2630', X + wx, Y - 4, 2, 6), fill(g, IRON_HI, X + wx, Y - 4, 1, 1);
  fill(g, RUST, X - 1, Y - 7, 3, 1);
  g.globalAlpha = 0.5;
  for (let i = 0; i < 6; i++) { const age = (now * 2.4 + i / 6) % 1; fill(g, '#8a8494', X - 9 + ((i * 7) % 19), Y + 1 - age * 8, 2, 2); }
  g.globalAlpha = 1;
  if (sp > 3) for (let i = 0; i < 3; i++) if (Math.floor(now * 25 + i * 3) % 3) fill(c.glow, i ? '#ffd27a' : '#ffb44c', X + (i - 1) * 6, Y + 2, 1, 1);
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
  // Held overhead by the Haulier for its hurl: up over its head (the shadow stays on the floor).
  if (p.heldBy === 'haulier') y -= 50 + Math.round(Math.sin(now * 20));
  // Rolling down a track the long way (down the screen): seen end-on.
  if (fast && p.wy && Math.abs(p.wy) > Math.abs(p.wx ?? 0)) return drawCartEnd(c, x, y, now, Math.abs(roll)), sparkTrail(c, x, y, p.wx ?? 0, p.wy, now);
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
  sparkTrail(c, x, y, p.wx ?? dir, p.wy ?? 0, now);
}

/** A running cart's trail of white-hot sparks off its wheels, streaming back the way it came (never missed: Kyle 2026-11-12). */
function sparkTrail(c: Ctx, x: number, y: number, dx: number, dy: number, now: number): void {
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, gl = c.glow;
  for (let i = 0; i < 12; i++) {
    const age = (now * 3.2 + i / 12) % 1, side = i % 2 ? 1 : -1, d = 6 + age * 26;
    gl.globalAlpha = 1 - age * 0.8;
    fill(gl, age < 0.3 ? '#ffffff' : age < 0.6 ? '#ffd27a' : '#ff8a3a', x - ux * d - uy * side * (3 + age * 4), y - 2 - uy * d * 0.6 + ux * side * 2 - age * 4, age < 0.4 ? 2 : 1, age < 0.4 ? 2 : 1);
  }
  gl.globalAlpha = 1;
}
