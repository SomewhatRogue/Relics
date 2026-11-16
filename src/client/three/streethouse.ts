/**
 * A town house from parts (`?hd&street&parts`, docs/decisions/new-look-buildings.md), in place of a picture on a box:
 * a stone plinth; a ground floor of fieldstone or plaster; an upper storey jettied out over the street on joists;
 * oak framing standing proud of the plaster, braced; windows and a door set back in their walls with sills, lintels
 * and a step; a roof with real eaves, fascia, bargeboards and a ridge, slate or thatch, gable to the street or
 * eaves to it; a chimney with its cap. Every piece throws its own shadow. Built in its own frame: x across from
 * -w/2, z back from its front at 0 to -d, as the kit's fronts are. Drawing only.
 */
import * as THREE from 'three';
import { Parts, type V } from './streetparts';
import SIZES from './kit/kit.json';
import { size } from './streetrow';

const has = (n: string) => n in (SIZES as Record<string, unknown>);
const pick = (...names: string[]) => names.find(has) ?? names[names.length - 1];
// The kit's parts, falling back to the swatches if the parts sheet isn't cut.
const PLASTER = pick('part-plaster', 'mat-flags'), BEAM = pick('part-beam', 'mat-timber'), THATCH = pick('part-thatch', 'mat-planks');
const FIELD = pick('part-field', 'mat-stone'), STONE = 'mat-stone', SLATE = 'mat-slate';
const WINS = ['part-win-0', 'part-win-1', 'part-win-2', 'part-win-3'].filter(has), DOORS = ['part-door-0', 'part-door-1', 'part-door-2', 'part-door-3'].filter(has);

export interface HouseOpts { w: number; d: number; door: boolean; seed: number }

export function partsHouse(o: HouseOpts): { g: THREE.Group; roof: THREE.Group; top: number } {
  let n = o.seed >>> 0 || 1;
  const rnd = () => ((n = (Math.imul(n, 1103515245) + 12345) >>> 0) / 4294967296);
  const P = new Parts(), R = new Parts(), { w, d } = o, x0 = -w / 2, x1 = w / 2, zf = 0, zb = -d;
  const two = w >= 2.2 && rnd() < 0.72, h0 = 2.1, h1 = two ? 1.9 : 0, jet = two ? 0.32 : 0;
  const ground = rnd() < 0.5 ? FIELD : PLASTER, thatch = !two && rnd() < 0.6;
  // The plinth, a course of stone a little proud of the walls.
  P.box(STONE, x0 - 0.06, 0, zb - 0.06, x1 + 0.06, 0.32, zf + 0.06);
  P.box(ground, x0, 0.32, zb, x1, h0, zf);
  // The upper storey, out over the street on its joists, a sill beam along its foot.
  if (two) {
    P.box(PLASTER, x0 - 0.06, h0, zb, x1 + 0.06, h0 + h1, zf + jet);
    for (let x = x0 + 0.2; x < x1 - 0.1; x += 0.45) P.box(BEAM, x - 0.07, h0 - 0.14, zf - 0.05, x + 0.07, h0, zf + jet + 0.04);
    P.box(BEAM, x0 - 0.1, h0, zf + jet - 0.02, x1 + 0.1, h0 + 0.18, zf + jet + 0.05);
  }
  const yT = h0 + h1, zF = zf + jet;
  // Every wall built the same way, in its own frame (across, up, out) and turned onto its side: the front with the
  // door, the back, and both sides, each storey framed (if plaster) and windowed.
  const dx = o.door ? 0 : x0 + w * (0.25 + rnd() * 0.5);
  const walls: { len: number; mid: number; at: (y0: number, out: number) => (v: V) => V; front?: boolean }[] = [
    { len: w, mid: 0, at: (_, out) => ([u, y, n]) => [u, y, out + n], front: true },
    { len: w, mid: 0, at: () => ([u, y, n]) => [-u, y, zb - n] },
    { len: d, mid: -d / 2, at: (_, out) => ([u, y, n]) => [x1 + out + n, y, -d / 2 - u] },
    { len: d, mid: -d / 2, at: (_, out) => ([u, y, n]) => [x0 - out - n, y, -d / 2 + u] },
  ];
  walls.forEach((W, i) => {
    // The ground floor.
    P.map = W.at(0, 0);
    const L = W.len, u0 = -L / 2, u1 = L / 2;
    if (ground === PLASTER) frame(P, u0, u1, 0.32, h0, 0, -0.2, rnd);
    if (W.front) door(P, dx, 0, rnd);
    for (const x of slots(u0, u1, W.front ? dx : null, W.front ? 0.95 : 1.3)) win(P, x, 1.07, 0, 0.62, 0.72, rnd);
    // The upper storey: the front out on the jetty, the sides running out to it.
    if (two) {
      const side = i >= 2, len = side ? L + jet : L, off = side ? jet / 2 : 0;
      P.map = W.front ? W.at(h0, jet) : side ? ((m, k) => ([u, y, n]: V) => m([u + k, y, n]))(W.at(h0, 0.06), i === 2 ? -off : off) : W.at(h0, 0);
      frame(P, -len / 2 - 0.06, len / 2 + 0.06, h0 + 0.18, h0 + h1, 0, -0.2, rnd);
      for (const x of slots(-len / 2, len / 2, null, W.front ? 1.0 : 1.2)) win(P, x, h0 + 0.55, 0, 0.6, 0.76, rnd);
    }
    P.map = (v) => v;
  });
  // The roof.
  const along = rnd() < 0.6, cover = thatch ? THATCH : SLATE, top = roofOf(R, P, x0, x1, zF, zb, yT, along, cover, thatch, rnd);
  // A chimney through the roof, capped.
  if (rnd() < 0.75) {
    const cx = (rnd() < 0.5 ? x0 + 0.55 : x1 - 0.55), cz = zb + 0.5;
    P.box(STONE, cx - 0.28, yT - 0.2, cz - 0.28, cx + 0.28, top + 0.7, cz + 0.28);
    P.box(STONE, cx - 0.36, top + 0.7, cz - 0.36, cx + 0.36, top + 0.82, cz + 0.36);
  }
  const g = P.build(), roof = R.build();
  g.add(roof);
  return { g, roof, top: top + 0.8 };
}

/** Where windows go along a wall x0..x1, spaced `gap` apart, kept off a door at `dx`. */
function slots(x0: number, x1: number, dx: number | null, gap: number): number[] {
  const n = Math.max(1, Math.floor((x1 - x0) / gap)), step = (x1 - x0) / n, out: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + step * (i + 0.5);
    if (dx === null || Math.abs(x - dx) > 0.75) out.push(x);
  }
  return out;
}

/** Oak framing on a plaster face (the front at zf, the sides): corner posts, a rail, posts between, a brace or two. */
function frame(P: Parts, x0: number, x1: number, y0: number, y1: number, zf: number, zb: number, rnd: () => number, dir: 1 | -1 = 1): void {
  const t = 0.07, z = zf + dir * 0.04;
  P.box(BEAM, x0 - 0.04, y0, zf - 0.04, x0 + 0.12, y1, zf + 0.04);
  P.box(BEAM, x1 - 0.12, y0, zf - 0.04, x1 + 0.04, y1, zf + 0.04);
  P.box(BEAM, x0, y1 - 0.14, zf - 0.04, x1, y1, zf + 0.04);
  const posts = Math.max(1, Math.round((x1 - x0) / 1.1));
  for (let i = 1; i < posts; i++) {
    const x = x0 + ((x1 - x0) * i) / posts;
    P.box(BEAM, x - t, y0, zf - 0.04, x + t, y1, zf + 0.04);
  }
  // A brace across the first panel, sometimes the last.
  const pw = (x1 - x0) / posts;
  for (const xa of rnd() < 0.5 ? [x0 + 0.12] : [x0 + 0.12, x1 - pw]) {
    const xb = xa + pw - 0.2, ya = y0 + 0.1, yb = y1 - 0.16;
    P.face(BEAM, [xa, ya, z], [xa + 0.14, ya, z], [xb, yb, z], [xb - 0.14, yb, z], [0, 0, 1, 0.07]);
  }
  // Corner posts down the sides too.
  if (dir > 0) for (const x of [x0 - 0.04, x1 - 0.12]) P.box(BEAM, x, y0, zb, x + 0.16, y1, zb + 0.14);
}

function door(P: Parts, x: number, zf: number, rnd: () => number): void {
  const pic = DOORS.length ? DOORS[Math.floor(rnd() * DOORS.length)] : 'mat-planks', [pw, ph] = size(pic);
  const h = 1.6, w = Math.min(1.5, (h * pw) / ph), y = 0.32, z = zf + 0.015;
  if (DOORS.length) P.picture(pic, [x - w / 2, y, z], [x + w / 2, y, z], [x + w / 2, y + h, z], [x - w / 2, y + h, z]);
  else P.tiled(pic, [x - w / 2, y, z], [x + w / 2, y, z], [x + w / 2, y + h, z], [x - w / 2, y + h, z]);
  // On the wall's face, its posts and a lintel standing out round it (the depth a doorway has), a stone step.
  P.box(BEAM, x - w / 2 - 0.1, y, zf, x - w / 2, y + h, zf + 0.14);
  P.box(BEAM, x + w / 2, y, zf, x + w / 2 + 0.1, y + h, zf + 0.14);
  P.box(BEAM, x - w / 2 - 0.18, y + h, zf, x + w / 2 + 0.18, y + h + 0.18, zf + 0.18);
  P.box(STONE, x - w / 2 - 0.12, 0, zf, x + w / 2 + 0.12, 0.18, zf + 0.38);
}

/** A window at x on a wall facing +z at zf (or -z, `dir` -1), its foot at y, `h` tall at its own width; `zi` its glass. */
function win(P: Parts, x: number, y: number, zf: number, _w: number, h: number, rnd: () => number, dir: 1 | -1 = 1): void {
  const pic = WINS.length ? WINS[Math.floor(rnd() * WINS.length)] : null, [pw, ph] = pic ? size(pic) : [1, 1], w = (h * pw) / ph;
  const zi = zf + dir * 0.015, zo = (k: number) => zf + dir * k, lo = (a: number, b: number) => Math.min(a, b), hi = (a: number, b: number) => Math.max(a, b);
  const xa = x - (dir * w) / 2, xb = x + (dir * w) / 2;
  if (pic) P.picture(pic, [xa, y, zi], [xb, y, zi], [xb, y + h, zi], [xa, y + h, zi]);
  // On the wall's face, cheeks either side and a lintel standing out (the depth a window has), a sill out further.
  P.box(BEAM, x - w / 2 - 0.06, y, lo(zf, zo(0.1)), x - w / 2, y + h, hi(zf, zo(0.1)));
  P.box(BEAM, x + w / 2, y, lo(zf, zo(0.1)), x + w / 2 + 0.06, y + h, hi(zf, zo(0.1)));
  P.box(STONE, x - w / 2 - 0.1, y - 0.1, lo(zf, zo(0.18)), x + w / 2 + 0.1, y, hi(zf, zo(0.18)));
  P.box(BEAM, x - w / 2 - 0.1, y + h, lo(zf, zo(0.12)), x + w / 2 + 0.1, y + h + 0.12, hi(zf, zo(0.12)));
}

/** A window in a side wall at x (facing out by s), its middle at z. */
function sideWin(P: Parts, x: number, s: -1 | 1, z: number, y: number, rnd: () => number): void {
  const w = 0.55, h = 0.7, xi = x - s * 0.08, pic = WINS.length ? WINS[Math.floor(rnd() * WINS.length)] : null;
  const a: [number, number, number] = [xi, y, z + (s * w) / 2], b: [number, number, number] = [xi, y, z - (s * w) / 2];
  if (pic) P.picture(pic, a, b, [b[0], y + h, b[2]], [a[0], y + h, a[2]]);
  P.box(STONE, Math.min(x, x + s * 0.12), y - 0.1, z - w / 2 - 0.08, Math.max(x, x + s * 0.12), y, z + w / 2 + 0.08);
  P.box(BEAM, Math.min(x, x + s * 0.05), y + h, z - w / 2 - 0.1, Math.max(x, x + s * 0.05), y + h + 0.12, z + w / 2 + 0.1);
}

/**
 * The roof over x0..x1 by zb..zF from the eaves at yT: gable to the street (`along`, its ridge running back) or
 * eaves to it. Slabs with thickness at the edges (fascia), bargeboards up the gables, a ridge along the top, the
 * gable walls in plaster with a king post. Returns its ridge height.
 */
function roofOf(R: Parts, P: Parts, x0: number, x1: number, zF: number, zb: number, yT: number, along: boolean, cover: string, thatch: boolean, rnd: () => number): number {
  const eo = thatch ? 0.42 : 0.32, go = 0.26, th = thatch ? 0.3 : 0.12;
  const span = along ? x1 - x0 : zF - zb, pitch = thatch ? 1.15 : 0.85 + rnd() * 0.35, rise = (span / 2 + eo) * pitch, top = yT + rise - eo * pitch;
  if (along) {
    const xm = (x0 + x1) / 2, za = zF + go, zc = zb - go, ye = yT - eo * pitch;
    R.tiled(cover, [x0 - eo, ye, za], [x0 - eo, ye, zc], [xm, top, zc], [xm, top, za]);
    R.tiled(cover, [x1 + eo, ye, zc], [x1 + eo, ye, za], [xm, top, za], [xm, top, zc]);
    // Fascia along both eaves; bargeboards up both gables; the ridge.
    for (const [x, s] of [[x0 - eo, -1], [x1 + eo, 1]] as const) R.box(thatch ? cover : BEAM, Math.min(x, x - s * 0.04), ye - th, zc, Math.max(x, x - s * 0.04) + 0.04, ye, za);
    for (const z of [za, zc]) {
      R.face(BEAM, [x0 - eo, ye - th, z], [xm, top - th, z], [xm, top + 0.02, z], [x0 - eo, ye, z], [0, 0, 1, 0.1]);
      R.face(BEAM, [xm, top - th, z], [x1 + eo, ye - th, z], [x1 + eo, ye, z], [xm, top + 0.02, z], [0, 0, 1, 0.1]);
    }
    R.box(thatch ? cover : SLATE, xm - 0.1, top - 0.05, zc, xm + 0.1, top + 0.1, za);
    // The gable walls, plaster, a king post up the middle.
    for (const z of [zF, zb]) P.gable(PLASTER, [x0, yT, z], [x1, yT, z], [xm, top - 0.05, z]);
    for (const [z, s] of [[zF, 1], [zb, -1]] as const) {
      P.box(BEAM, xm - 0.07, yT, z - 0.04, xm + 0.07, top - 0.3, z + 0.04);
      P.box(BEAM, x0, yT - 0.05, z - 0.04, x1, yT + 0.1, z + 0.05);
      if (top - yT > 1.3) for (const x of [xm - (x1 - x0) * 0.22, xm + (x1 - x0) * 0.22]) win(P, x, yT + 0.2, z, 0.4, 0.5, rnd, s);
    }
  } else {
    const zm = (zF + zb) / 2, xa = x0 - go, xc = x1 + go, ye = yT - eo * pitch;
    R.tiled(cover, [xa, ye, zF + eo], [xc, ye, zF + eo], [xc, top, zm], [xa, top, zm]);
    R.tiled(cover, [xc, ye, zb - eo], [xa, ye, zb - eo], [xa, top, zm], [xc, top, zm]);
    for (const z of [zF + eo, zb - eo]) R.box(thatch ? cover : BEAM, xa, ye - th, Math.min(z, z + 0.04), xc, ye, Math.max(z, z + 0.04) + 0.04);
    for (const x of [xa, xc]) {
      R.face(BEAM, [x, ye - th, zF + eo], [x, top - th, zm], [x, top + 0.02, zm], [x, ye, zF + eo], [0, 0, 1, 0.1]);
      R.face(BEAM, [x, top - th, zm], [x, ye - th, zb - eo], [x, ye, zb - eo], [x, top + 0.02, zm], [0, 0, 1, 0.1]);
    }
    R.box(thatch ? cover : SLATE, xa, top - 0.05, zm - 0.1, xc, top + 0.1, zm + 0.1);
    for (const x of [x0, x1]) {
      P.gable(PLASTER, [x, yT, zb], [x, yT, zF], [x, top - 0.05, zm]);
      P.box(BEAM, x - 0.04, yT, zm - 0.07, x + 0.04, top - 0.3, zm + 0.07);
      P.box(BEAM, x - 0.05, yT - 0.05, zb, x + 0.05, yT + 0.1, zF);
    }
    // A dormer on a two-storey front, now and then.
    if (!thatch && x1 - x0 > 2.6 && rnd() < 0.5) {
      const dx = (x0 + x1) / 2, dz = zF - 0.2, dy = yT + 0.15, dw = 0.6;
      P.box(PLASTER, dx - dw, dy - 0.3, dz - 1.0, dx + dw, dy + 0.9, dz);
      win(P, dx, dy + 0.05, dz, 0.55, 0.62, rnd);
      R.tiled(cover, [dx - dw - 0.15, dy + 0.85, dz + 0.15], [dx - dw - 0.15, dy + 0.85, dz - 1.0], [dx, dy + 1.35, dz - 1.0], [dx, dy + 1.35, dz + 0.15]);
      R.tiled(cover, [dx + dw + 0.15, dy + 0.85, dz - 1.0], [dx + dw + 0.15, dy + 0.85, dz + 0.15], [dx, dy + 1.35, dz + 0.15], [dx, dy + 1.35, dz - 1.0]);
      P.gable(PLASTER, [dx - dw, dy + 0.9, dz], [dx + dw, dy + 0.9, dz], [dx, dy + 1.3, dz]);
    }
  }
  return top;
}
