/**
 * The new look's buildings (`?hd&street`, docs/decisions/new-look-buildings.md): a block's row of fronts
 * (streetrow.ts) built in 3D. Each front is its picture, its two side walls in the kit's side-wall art (so the chase
 * camera's swing shows a real wall, windows and all), a back, a slate roof from its eaves to its ridge running back
 * from the street, and for a church's bell tower or a forge's chimney a stone stack rising behind the picture. A
 * landmark is built about its own foot and turned toward the middle of town. Guild signs hang by the doors that
 * lack one in their picture. Drawing only.
 */
import * as THREE from 'three';
import type { Block } from '../../shared/arena';
import { mat, quad, tri } from './streetkit';
import { PX, rowOf, size, type Front, type Side } from './streetrow';
import SIZES from './kit/kit.json';

const SIDES = Object.keys(SIZES).filter((k) => k.startsWith('side-'));
const sideArt = (side: Side, n: number) => {
  const all = SIDES.filter((k) => k.startsWith(`side-${side}-`));
  return all.length ? all[n % all.length] : null;
};

/** A wall along z at x (facing out by `dir`), from z0 to z1 and the ground to `top`, in a stretch of side-wall art. */
function sideWall(g: THREE.Group, x: number, z0: number, z1: number, top: number, art: string | null, dir: 1 | -1, n: number): void {
  if (!art) {
    const sm = mat('mat-stone', true);
    g.add(dir > 0 ? quad([x, 0, z1], [x, 0, z0], [x, top, z0], [x, top, z1], sm, 0, (z1 - z0) / 2, top / 2) : quad([x, 0, z0], [x, 0, z1], [x, top, z1], [x, top, z0], sm, 0, (z1 - z0) / 2, top / 2));
    return;
  }
  // The art is four tiles tall, two storeys. A taller wall takes it at that size and repeats its upper storey above.
  const art4 = Math.min(top, top > 4.6 ? 4 : top), [aw, ah] = size(art), span = Math.min(1, (z1 - z0) / ((aw / ah) * art4)), u0 = ((n * 0.6180339) % 1) * (1 - span);
  const m = mat(art, false, true), a = dir > 0 ? u0 : u0 + span, b = dir > 0 ? u0 + span : u0;
  const band = (y0: number, y1: number, v0: number) => {
    if (dir > 0) g.add(quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], m, a, b, 1, v0));
    else g.add(quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], m, a, b, 1, v0));
  };
  band(0, art4, 0);
  for (let y = art4; y < top - 0.05; y += 2) band(y, Math.min(top, y + 2), 1 - Math.min(2, top - y) / 4);
}

/** A box of stone (a tower, a chimney) from y0 to y1, x0 to x1, z0 to z1, its front face left open (the picture's). */
function stack(g: THREE.Group, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  const sm = mat('mat-stone', true), h = y1 - y0, w = x1 - x0, d = z1 - z0;
  g.add(quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], sm, 0, d / 2, h / 2));
  g.add(quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], sm, 0, d / 2, h / 2));
  g.add(quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], sm, 0, w / 2, h / 2));
  g.add(quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], mat('mat-slate', true), 0, w / 2, d / 2));
}

/** One front, built in its own frame: x across from -w/2, y up, z back from its face at 0 to -d. */
function building(f: Front, d: number, flip: boolean, n: number): { g: THREE.Group; roof: THREE.Group } {
  const g = new THREE.Group(), roof = new THREE.Group(), x0 = -f.w / 2, x1 = f.w / 2, H = f.H, eave = H * f.eave, ridge = H * f.ridge;
  g.add(quad([x0, 0, 0], [x1, 0, 0], [x1, H, 0], [x0, H, 0], mat(f.name, false, true), flip ? 1 : 0, flip ? 0 : 1));
  const art = sideArt(f.side, n);
  sideWall(g, x0, -d, -0.02, eave, art, -1, n);
  sideWall(g, x1, -d, -0.02, eave, art, 1, n + 1);
  const sm = mat('mat-stone', true);
  g.add(quad([x1, 0, -d], [x0, 0, -d], [x0, eave, -d], [x1, eave, -d], sm, 0, f.w / 2, eave / 2));
  // The roof: slate down both sides from the ridge to the eaves, running back from just behind the picture.
  const rm = mat('mat-slate', true), slope = Math.hypot(f.w / 2, ridge - eave), ov = 0.15, zf = -0.04;
  roof.add(quad([x0 - ov, eave - 0.1, zf], [x0 - ov, eave - 0.1, -d - ov], [0, ridge, -d - ov], [0, ridge, zf], rm, 0, (d + ov) / 2, slope / 2));
  roof.add(quad([x1 + ov, eave - 0.1, -d - ov], [x1 + ov, eave - 0.1, zf], [0, ridge, zf], [0, ridge, -d - ov], rm, 0, (d + ov) / 2, slope / 2));
  roof.add(tri([x0, eave, -d], [x1, eave, -d], [0, ridge, -d], [0, 0, f.w / 2, 0, f.w / 4, (ridge - eave) / 2], sm));
  // A bell tower or a chimney, rising behind the picture's own.
  if (f.stack) {
    const [mx, sw, top] = f.stack, cx = x0 + mx * f.w, hw = (sw * f.w) / 2, sd = Math.min(sw * f.w, d * 0.7);
    stack(g, cx - hw, cx + hw, ridge - 0.4, top * H - 0.05, -sd - 0.05, -0.06);
  }
  g.add(roof);
  return { g, roof };
}

/** The sign a block hangs by its door when its picture has none: by what the block is. */
function signOf(b: Block, f: Front): string | null {
  const l = (b.label ?? '').toUpperCase();
  if (/INFIRM|HEAL|APOTH/.test(l)) return 'sign-mortar';
  if (f.kind === 'forge') return 'sign-anvil';
  if (f.kind === 'tavern' && !/LODGE/.test(l)) return 'sign-tankard';
  if (f.kind === 'chapel' && b.door) return 'sign-lantern';
  return null;
}

/** Build a roofed block from the kit into `group`; returns its roofs and how tall it stands. */
export function kitBlock(b: Block, group: THREE.Group): { roof: THREE.Group; top: number } {
  const row = rowOf(b), roofs = new THREE.Group(), z1 = b.y + b.h, d = b.h, total = row.reduce((s, f) => s + f.w, 0);
  let x = b.x + (b.w - total) / 2, top = 0;
  row.forEach((f, i) => {
    const n = Math.round(b.x * 3 + b.y * 5) + i * 7, { g, roof } = building(f, d, i % 2 === 1 && !f.turn, n);
    g.position.set(x + f.w / 2, 0, z1);
    g.rotation.y = f.turn ?? 0;
    group.add(g);
    roof.removeFromParent();
    roof.position.copy(g.position);
    roof.rotation.copy(g.rotation);
    roofs.add(roof);
    top = Math.max(top, f.H);
    const sign = f.main && !f.turn ? signOf(b, f) : null;
    if (sign && b.door && f.w > 2) {
      const [sw, sh] = size(sign), w = sw / PX, h = sh / PX, sx = x + f.w - 0.25, sy = Math.min(2.6, f.H * f.eave - h - 0.1);
      group.add(quad([sx - w * 0.1, sy, z1 + 0.5], [sx + w * 0.9, sy, z1 + 0.5], [sx + w * 0.9, sy + h, z1 + 0.5], [sx - w * 0.1, sy + h, z1 + 0.5], mat(sign)));
    }
    x += f.w;
  });
  group.add(roofs);
  return { roof: roofs, top };
}

