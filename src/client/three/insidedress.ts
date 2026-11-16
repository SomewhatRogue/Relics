/**
 * Each new-look inside dressed as its concept (docs/design/ref/inside-*.jpg), by the room's name: windows high on the
 * walls with moonlight falling from them, galleries, the church's arcade, the hall's clock and banners, chimney
 * breasts, the forge's hood, the infirmary's curtains and herbs. All paint: nothing here is walked into or decided on.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { Boxes, Seed, jit } from './boxes';
import { arch, beam, canvasTex, gallery, shaft, windowMesh } from './insideparts';
import { kitTex } from './streetkit';
import SIZES from './kit/kit.json';

/** A window: on the back wall at x, or on a side wall ('W' or 'E') at z; from y0 to y1; coloured or not. */
type Win = { on: 'N' | 'W' | 'E'; at: number; y0: number; y1: number; w: number; stained?: boolean };
export interface Dress {
  wins: Win[];
  /** A rug's colour (the flat view's rugs are painted in the room's own). */
  rug: number;
  /** How wide the low front wall's gap is (the door's, or the forge's open mouth). */
  gap?: number;
  build?(B: Boxes, glow: Boxes, g: THREE.Group, m: GameMap, r: Seed): void;
}

const side = (on: 'W' | 'E', zs: number[], y0: number, y1: number, stained = false): Win[] => zs.map((at) => ({ on, at, y0, y1, w: 1.2, stained }));
const back = (xs: number[], y0: number, y1: number, stained = false, w = 1.1): Win[] => xs.map((at) => ({ on: 'N', at, y0, y1, w, stained }));

/** A cloth banner hung flat on the back wall: dark green, a pale tree (or a tower), a pointed foot. */
function banner(g: THREE.Group, x: number, y0: number, y1: number, w: number, tower = false): void {
  const t = canvasTex(w, y1 - y0, (c, W, H) => {
    c.fillStyle = '#1e3a2e', c.beginPath(), c.moveTo(0, 0), c.lineTo(W, 0), c.lineTo(W, H - 8), c.lineTo(W / 2, H), c.lineTo(0, H - 8), c.fill();
    c.fillStyle = '#a89a6a', c.fillRect(2, 2, W - 4, 2);
    const cx = W / 2, cy = H * 0.42;
    if (tower) c.fillRect(cx - 5, cy - 8, 10, 18), c.fillRect(cx - 7, cy - 11, 3, 4), c.fillRect(cx - 1, cy - 11, 3, 4), c.fillRect(cx + 4, cy - 11, 3, 4);
    else {
      c.fillRect(cx - 1, cy, 3, 14);
      for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, rr = 5 + (i % 3) * 2; c.fillRect(cx + Math.cos(a) * rr - 1, cy - 4 + Math.sin(a) * rr * 0.8, 3, 3); }
    }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.5 }));
  m.position.set(x, (y0 + y1) / 2, 0.03);
  g.add(m);
}

/** The town hall's clock, high on the back wall. */
function clock(g: THREE.Group, x: number, y: number, d: number): void {
  const t = canvasTex(d, d, (c, W) => {
    c.fillStyle = '#2a1d12', c.beginPath(), c.arc(W / 2, W / 2, W / 2, 0, Math.PI * 2), c.fill();
    c.fillStyle = '#d8ccaa', c.beginPath(), c.arc(W / 2, W / 2, W / 2 - 4, 0, Math.PI * 2), c.fill();
    c.fillStyle = '#2a2420';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillRect(W / 2 + Math.sin(a) * (W / 2 - 8) - 1, W / 2 - Math.cos(a) * (W / 2 - 8) - 1, 3, 3); }
    c.fillRect(W / 2 - 1, W / 2 - 13, 3, 14), c.fillRect(W / 2, W / 2 - 1, 10, 3);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(d, d), new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.5 }));
  m.position.set(x, y, 0.04);
  g.add(m);
}

/** A showpiece cut from the concepts into the kit (scripts/insideprep.py), flat on a wall: `w` tiles wide, centred at
 *  (x, y, z); `lit` by the room's light, or glowing (a window). */
function piece(g: THREE.Group, name: string, x: number, y: number, z: number, w: number, lit = true): void {
  const [pw, ph] = (SIZES as Record<string, number[]>)['inside-' + name], h = (w * ph) / pw, map = kitTex('inside-' + name);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lit ? new THREE.MeshLambertMaterial({ map, transparent: true, alphaTest: 0.5, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.3 }) : new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.5 }));
  m.position.set(x, y, z);
  // (The kit's pictures are shared: the room frees its own material, not the picture: insidekit.ts disposeInside.)
  (map as THREE.Texture & { shared?: boolean }).shared = true;
  g.add(m);
}

/** An iron ring of candles hung from the roof. */
function chandelier(B: Boxes, glow: Boxes, x: number, z: number, y: number, top: number): void {
  B.b(x, y + 0.1, z, 0.04, top - y, 0.04, 0x1a1820);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, px = x + Math.cos(a) * 0.55, pz = z + Math.sin(a) * 0.55;
    B.b(px, y, pz, 0.24, 0.06, 0.24, 0x2a2630);
    glow.b(px, y + 0.06, pz, 0.05, 0.14, 0.05, 0xffc870);
  }
}

/** A chimney breast up a side wall from a hearth (x0..x1 across it, z0..z1 along it), to the top. */
const breast = (B: Boxes, x0: number, x1: number, z0: number, z1: number, H: number, r: Seed) => {
  for (let y = 1.2; y < H; y += 0.5) B.b((x0 + x1) / 2, y, (z0 + z1) / 2, x1 - x0, 0.5, z1 - z0, jit(0x4a4250, 0.07, r));
};

export const DRESS: Record<string, Dress> = {
  'THE CHURCH': {
    rug: 0x5a1e22,
    wins: [...back([3.5, 7.5, 16.5, 20.5], 3, 6.4, true), ...side('W', [5, 10, 15], 2, 5.8, true), ...side('E', [5, 10, 15], 2, 5.8, true)],
    build(B, glow, g, m, r) {
      // The rose window over the altar, and the moon through it.
      piece(g, 'rose', 12, 4.75, 0.03, 3.6, false);
      g.add(shaft(new THREE.Vector3(12, 6, 0.1), new THREE.Vector3(12, 0, 5.4), 2.6, new THREE.Vector3(1, 0, 0), 0.8));
      // The arcade: the pillars run up to their capitals, pointed arches between them, a wall over them.
      const zs = [3.5, 6.5, 9.5, 12.5, 15.5];
      for (const x of [7, 17]) {
        for (const z of zs) {
          for (let y = 2.4; y < 4.4; y += 0.4) B.b(x, y, z, 0.46, 0.4, 0.46, jit(0x6e6878, 0.05, r));
          B.b(x, 4.4, z, 0.66, 0.16, 0.66, 0x7e788a);
        }
        for (let i = 0; i + 1 < zs.length; i++) arch(B, x, zs[i], zs[i + 1], 4.4, 1.1, r);
        arch(B, x, 0, zs[0], 4.4, 0.9, r);
      }
      // The altar's three low steps, tomb slabs in the aisles.
      for (let i = 0; i < 3; i++) B.b(12, 0, 2.2, 6 - i * 1.2, 0.03 + i * 0.03, 2.6 - i * 0.5, jit(0x57525e, 0.04, r));
      for (const [x, z] of [[2.4, 9], [2.4, 12.6], [21.4, 12], [21.4, 15.4]]) B.b(x, 0, z, 1, 0.02, 2, jit(0x625c6c, 0.05, r)), B.b(x, 0.02, z - 0.3, 0.12, 0.01, 0.9, 0x3a3640), B.b(x, 0.02, z - 0.45, 0.5, 0.01, 0.12, 0x3a3640);
      chandelier(B, glow, 12, 2.4, 4.8, m.wallH!);
    },
  },
  'THE BARRACKS': {
    rug: 0x3a2a1e,
    wins: side('W', [3, 8, 13], 2, 4.2),
    build(B, _glow, g, m, r) {
      gallery(B, 'z', m.w + 0.9, 4.6, 15.2, -1.4, 2.8, r);
      banner(g, 5, 2.7, 5, 1.2, true), banner(g, 19, 2.7, 5, 1.2, true);
      // A rope round the sparring ring, post to post.
      for (const [x0, z0, x1, z1] of [[2, 5, 8, 5], [8, 5, 8, 11.6], [2, 11.6, 8, 11.6], [2, 5, 2, 11.6]]) B.b((x0 + x1) / 2, 0.9, (z0 + z1) / 2, Math.abs(x1 - x0) + 0.04, 0.04, Math.abs(z1 - z0) + 0.04, 0x8a7a58);
    },
  },
  'THE TOWN HALL': {
    rug: 0x1e3a2e,
    wins: [...side('W', [4, 9, 13.5], 1.6, 4.6), ...side('E', [4, 12.5], 1.6, 4.6)],
    build(B, glow, g, m, r) {
      gallery(B, 'x', 0, -0.9, m.w + 0.9, 1.3, 3.6, r);
      for (const x of [3.4, 7, 15, 18.6]) banner(g, x, 3.9, 6.2, 1.1);
      clock(g, 11, 5.1, 1.4);
      piece(g, 'map', 11, 1.72, 0.035, 5.2);
      breast(B, m.w + 0.1, m.w + 0.9, 5.8, 8.8, m.wallH!, r);
      chandelier(B, glow, 8, 5.6, 4.4, m.wallH!), chandelier(B, glow, 14, 5.6, 4.4, m.wallH!);
    },
  },
  'THE DROWNED RAT': {
    rug: 0x4a2a1e,
    wins: side('E', [6.5, 11.5], 1.4, 3.4),
    build(B, glow, g, m, r) {
      gallery(B, 'x', 0, 2.4, m.w + 0.9, 1.2, 3.2, r);
      piece(g, 'ratsign', 10.5, 3.62, 1.26, 2.6);
      breast(B, -0.9, 0.9, 9.2, 12.2, m.wallH!, r);
      for (const [x, z] of [[8, 6.2], [17, 10]]) chandelier(B, glow, x, z, 3.6, m.wallH!);
    },
  },
  'THE FORGE': {
    rug: 0x3a2a1e,
    gap: 10,
    wins: side('W', [6, 11], 2.2, 4),
    build(B, glow, _g, m, r) {
      // The hood over the hearth narrowing into the chimney, up through the roof.
      for (let i = 0; i < 5; i++) B.b(11, 1.6 + i * 0.32, 0.75, 3.4 - i * 0.45, 0.32, 1.5 - i * 0.12, jit(0x4a3028, 0.06, r));
      for (let y = 3.2; y < m.wallH!; y += 0.5) B.b(11, y, 0.5, 1.3, 0.5, 1, jit(0x5a3a2e, 0.07, r));
      glow.b(11, 1.48, 0.75, 3, 0.1, 1.3, 0xff8a3a);
    },
  },
  'THE INFIRMARY': {
    rug: 0x2e3a2a,
    wins: [...side('W', [3.6, 8.8], 1.4, 4.4), ...side('E', [3.6, 8.8], 1.4, 4.4)],
    build(B, _glow, _g, m, r) {
      // Linen on rails between the beds; herbs hung from a beam by the hearth.
      for (const x of [2.7, 4.7, 17.3, 19.3]) for (const z of [3.6, 9.2]) B.b(x, 0, z, 0.04, 1.75, 2, jit(0x8a8474, 0.04, r)), B.b(x, 1.75, z, 0.06, 0.05, 2.1, 0x3a2818);
      beam(B, 0, m.w, 1.5, 4.4, r);
      for (let x = 1; x < m.w - 0.5; x += 0.9) B.b(x, 3.5, 1.5, 0.24, 0.6, 0.24, jit(r.next() < 0.5 ? 0x4a5a2e : 0x6a5a34, 0.1, r)), B.b(x, 4.1, 1.5, 0.02, 0.05, 0.02, 0x2a1d12);
    },
  },
};

/** The windows and the moonlight from them. */
export function windows(g: THREE.Group, m: GameMap, wins: Win[], r: Seed): void {
  const W = m.w + 0.88;
  for (const w of wins) {
    const mesh = windowMesh(w.w, w.y1 - w.y0, !!w.stained, r), yc = (w.y0 + w.y1) / 2, fall = w.y1 * 0.75;
    if (w.on === 'N') {
      mesh.position.set(w.at, yc, 0.03);
      g.add(mesh, shaft(new THREE.Vector3(w.at, w.y1 - 0.3, 0.1), new THREE.Vector3(w.at, 0, fall), w.w, new THREE.Vector3(1, 0, 0), w.stained ? 0.7 : 1));
    } else {
      const x = w.on === 'W' ? -0.88 : W, s = w.on === 'W' ? 1 : -1;
      mesh.position.set(x, yc, w.at);
      mesh.rotation.y = (s * Math.PI) / 2;
      g.add(mesh, shaft(new THREE.Vector3(x, w.y1 - 0.3, w.at), new THREE.Vector3(x + s * fall, 0, w.at + 1.2), w.w, new THREE.Vector3(0, 0, 1)));
    }
  }
}
