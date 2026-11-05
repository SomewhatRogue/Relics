/**
 * Blocks with no roof: fences (posts and rails), stone and rock walls, a market stall's striped
 * canopy, a tent, a cart (its hoops, and the dead under sacking on the one waiting for a burying),
 * rubble, hurdles, the cordwood, and furniture (furnish3d.ts and hallfurn3d.ts, each as the flat view
 * paints it). Wooden ones burn and char like the houses (houses3d.ts).
 */
import * as THREE from 'three';
import type { Block } from '../../shared/arena';
import { LOOK } from '../blocks';
import { Boxes, Seed, jit } from './boxes';
import { VCOL, hex } from './mats';
import { tent } from './roofs3d';
import { siegeBlock } from './siege3d';
import { furnish3d } from './furnish3d';
import { hallFurn3d } from './hallfurn3d';

export function flatBlock(b: Block, group: THREE.Group, fires: [number, number, number, number][]): THREE.Group {
  const r = new Seed(Math.round(b.x * 29 + b.y * 13 + 3)), L = LOOK[b.kind], B = new Boxes();
  const x0 = b.x, x1 = b.x + b.w, z0 = b.y, z1 = b.y + b.h, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const alight = ((b.burning ?? -1) >= 0 || b.smoulder) && !b.ruined, k = b.ruined || alight ? 0.4 : 1;
  const wall = jit(hex(L.wall), 0, r), roof = hex(L.roof), dk = (c: number) => new THREE.Color(c).multiplyScalar(k).getHex();
  if (b.ruined) {
    for (let i = 0; i < Math.max(3, b.w * b.h); i++) B.c(x0 + r.next() * b.w, 0.05, z0 + r.next() * b.h, 0.3, 0.1, 0.12, 0x141012, r.next() * 3);
    for (let i = 0; i < 3; i++) fires.push([x0 + r.next() * b.w, 0.06, z0 + r.next() * b.h, 0.25]);
  } else if (b.kind === 'fence') {
    const along = b.w >= b.h, n = Math.max(2, Math.round((along ? b.w : b.h) / 0.8));
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      B.b(along ? x0 + f * b.w : cx, 0, along ? cz : z0 + f * b.h, 0.1, 0.62, 0.1, jit(dk(wall), 0.12, r));
    }
    for (const y of [0.2, 0.45]) B.b(cx, y, cz, along ? b.w : 0.06, 0.07, along ? 0.06 : b.h, dk(hex(L.ridge)));
  } else if (b.kind === 'rockwall' || b.kind === 'rubble') {
    const tall = b.kind === 'rubble' ? 0.4 : 1.1;
    for (let x = x0 + 0.25; x < x1; x += 0.45) for (let z = z0 + 0.25; z < z1; z += 0.45) {
      const h = tall * (0.5 + r.next() * 0.6), s = 0.42 + r.next() * 0.2;
      B.c(x, h / 2, z, s, h, s, jit(wall, 0.18, r), r.next() * 1.5, (r.next() - 0.5) * 0.3);
    }
  } else if (b.kind === 'wall') {
    for (let y = 0, row = 0; y < 1.3; y += 0.28, row++) {
      let x = x0 - (row % 2) * 0.25;
      while (x < x1) {
        const len = 0.45 + r.next() * 0.4, a = Math.max(x, x0), c = Math.min(x + len, x1);
        x += len;
        if (c - a > 0.06) B.b((a + c) / 2, y, cz, c - a - 0.03, 0.25, b.h, jit(0x4f4a5c, 0.14, r));
      }
    }
    B.b(cx, 1.38, cz, b.w + 0.06, 0.1, b.h + 0.08, 0x3b3746);
  } else if (b.kind === 'stall') {
    for (const [px, pz] of [[x0 + 0.1, z0 + 0.1], [x1 - 0.1, z0 + 0.1], [x0 + 0.1, z1 - 0.1], [x1 - 0.1, z1 - 0.1]]) B.b(px, 0, pz, 0.09, 1.25, 0.09, 0x4a3420);
    for (let x = x0, i = 0; x < x1 - 0.01; x += 0.4, i++) B.c(x + 0.2, 1.3, cz + 0.1, 0.4, 0.06, b.h + 0.4, i % 2 ? dk(hex(L.ridge)) : dk(roof), 0, 0.18);
    B.b(cx, 0, z1 - 0.25, b.w - 0.2, 0.6, 0.35, dk(wall));
  } else if (b.kind === 'tent') {
    tent(B, x0, x1, z0, z1, dk(roof), dk(hex(L.ridge)), r);
  } else if (b.kind === 'gallows' || b.kind === 'hurdle') {
    siegeBlock(B, b, r);
  } else if (b.kind === 'rack' && b.label === 'CORDWOOD') {
    // Split logs stacked along it between two posts: a cordwood pile, not a box.
    const along = b.w >= b.h, len = (along ? b.w : b.h) - 0.2, deep = along ? b.h : b.w;
    for (const e of [-1, 1]) B.b(along ? cx + e * (len / 2 + 0.04) : cx, 0, along ? cz : cz + e * (len / 2 + 0.04), 0.09, 0.95, 0.09, 0x3a2a1a);
    for (let row = 0; row < 4; row++) for (let d = -deep / 2 + 0.14 + (row % 2) * 0.1; d < deep / 2 - 0.08; d += 0.24) {
      const y = 0.1 + row * 0.2, c = jit(row % 2 ? 0x7a5230 : 0x6b4a2b, 0.15, r);
      B.c(along ? cx : cx + d, y, along ? cz + d : cz, along ? len : 0.2, 0.19, along ? 0.2 : len, c);
    }
  } else if (b.kind === 'cart') {
    B.b(cx, 0.32, cz, b.w * 0.9, 0.28, b.h * 0.8, dk(wall));
    B.b(cx, 0.6, cz, b.w * 0.9, 0.12, b.h * 0.8, dk(roof));
    // The bed's side boards, so it reads as a wagon and not a table.
    for (const s of [-1, 1]) B.b(cx, 0.66, cz + s * b.h * 0.38, b.w * 0.9, 0.22, 0.07, dk(wall));
    for (const s of [-1, 1]) B.c(cx, 0.28, cz + s * b.h * 0.42, 0.56, 0.56, 0.08, dk(0x3a2a1a), 0, 0, 0.4);
    B.b(x1 + 0.3, 0.3, cz, 0.8, 0.06, 0.06, 0x4a3420);
    // The bare hoops of its cover; on the one waiting for a burying, long shapes under grey sacking, a boot.
    for (let x = x0 + 0.25; x < x1 - 0.1; x += Math.max(0.3, b.w / 4)) {
      for (const s of [-1, 1]) B.b(x, 0.72, cz + s * b.h * 0.38, 0.05, 0.5, 0.05, dk(alight ? 0x3a2e24 : 0x9a8a5a));
      B.b(x, 1.2, cz, 0.05, 0.05, b.h * 0.8, dk(alight ? 0x3a2e24 : 0x9a8a5a));
    }
    if (b.look === 3) {
      for (let z = cz - b.h * 0.3; z < cz + b.h * 0.31; z += 0.26) B.lump(cx, 0.78, z, b.w * 0.8, 0.2, 0.24, jit(0x6a6670, 0.08, r), 0);
      B.b(x1 - 0.22, 0.72, cz + 0.1, 0.1, 0.14, 0.12, 0x2a1e14);
    }
  } else if (furnish3d(B, b, r, dk, group) || hallFurn3d(B, b, r, dk)) {
    // Built as the flat view paints it.
  } else {
    // Furniture and the rest: a box as tall as it stands in 2D, its top in its own colour.
    const h = Math.max(0.3, (L.tall / 16) * 0.95);
    B.b(cx, 0, cz, b.w - 0.04, h - 0.08, b.h - 0.04, jit(dk(wall), 0.08, r));
    B.b(cx, h - 0.08, cz, b.w, 0.08, b.h, dk(roof));
  }
  // Flames along it: a burning wagon's bed full of them (on top of the bed, not inside it).
  const cart = b.kind === 'cart';
  if (alight) for (let x = x0 + 0.3; x < x1; x += cart ? 0.55 : 1) fires.push([x, cart ? 0.7 : 0.4, cz + (cart ? (r.next() - 0.5) * 0.4 : 0), cart ? 1.15 : 0.9]);
  const m = B.mesh(VCOL);
  if (m) group.add(m);
  return group;
}
