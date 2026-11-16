/**
 * The pieces the new look's insides are dressed with (insidedress.ts), at the kit's 32 px a tile: windows of leaded
 * or coloured glass that glow with the moon, the moonlight falling from them, the floor's marks laid back over the
 * kit's floor (rugs, rushes, sawdust, soot, a sand ring), a gallery with its balustrade, beams, an arcade's arches.
 */
import * as THREE from 'three';
import type { Mark } from '../../shared/arena';
import { Boxes, Seed, jit } from './boxes';

const PX = 32;
const css = (c: number, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
export function canvasTex(w: number, h: number, paint: (g: CanvasRenderingContext2D, W: number, H: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w * PX));
  c.height = Math.max(2, Math.round(h * PX));
  paint(c.getContext('2d')!, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
}

const STAINED = [0x2a4a8a, 0x2a6a6a, 0x8a2a2a, 0xb08a3a, 0x3a6a3a, 0x5a3a7a];
const PLAIN = [0x8aa0b8, 0x7a90a8, 0x9ab0c4];
/** A window `w` by `h` tiles, pointed at the top, leaded; `stained` in colours, else moonlit panes. Glows (no light needed). */
export function windowMesh(w: number, h: number, stained: boolean, r: Seed): THREE.Mesh {
  const t = canvasTex(w, h, (g, W, H) => {
    const arch = W * 0.9;
    g.fillStyle = '#1a1820';
    g.beginPath(), g.moveTo(0, H), g.lineTo(0, arch), g.quadraticCurveTo(0, 0, W / 2, 0), g.quadraticCurveTo(W, 0, W, arch), g.lineTo(W, H), g.fill();
    g.save(), g.clip();
    const cell = stained ? 5 : 6;
    for (let y = 2; y < H - 2; y += cell) for (let x = 2; x < W - 2; x += cell) {
      const pal = stained ? STAINED : PLAIN, c = pal[Math.floor(r.next() * pal.length)], k = 0.55 + 0.45 * (1 - y / H);
      g.fillStyle = css(((((c >> 16) & 255) * k) << 16) | ((((c >> 8) & 255) * k) << 8) | ((c & 255) * k));
      g.fillRect(x, y, cell - 1, cell - 1);
    }
    g.restore();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  return m;
}

let shaftTex: THREE.Texture | null = null;
/** Moonlight falling from a window: a soft pale plane from (a, top) down to the floor at b, `w` wide, across `dir`. */
export function shaft(top: THREE.Vector3, foot: THREE.Vector3, w: number, across: THREE.Vector3, k = 1): THREE.Mesh {
  shaftTex ??= canvasTex(1, 4, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(150,175,215,0.55)'), gr.addColorStop(1, 'rgba(150,175,215,0)');
    g.fillStyle = gr, g.fillRect(0, 0, W, H);
  });
  (shaftTex as THREE.Texture & { shared?: boolean }).shared = true;
  const h = across.clone().multiplyScalar(w / 2), p = [top.clone().sub(h), top.clone().add(h), foot.clone().add(h), foot.clone().sub(h)];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p.flatMap((v) => [v.x, v.y, v.z]), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
  geo.setIndex([0, 2, 1, 0, 3, 2]);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.35 * k, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
}

/** A floor mark laid over the kit's floor, as the flat view paints it (the kit's floor would hide the painted one). */
export function markMesh(k: Mark, rug: number, r: Seed): THREE.Mesh | null {
  const paint: Record<string, (g: CanvasRenderingContext2D, W: number, H: number) => void> = {
    rug: (g, W, H) => {
      g.fillStyle = css(rug), g.fillRect(0, 0, W, H);
      g.fillStyle = css(0xb08a3a, 0.7), g.fillRect(2, 2, W - 4, 2), g.fillRect(2, H - 4, W - 4, 2), g.fillRect(2, 2, 2, H - 4), g.fillRect(W - 4, 2, 2, H - 4);
      g.fillStyle = css(0x000000, 0.25);
      for (let y = 10; y < H - 8; y += 12) for (let x = 10; x < W - 8; x += 12) g.fillRect(x, y, 4, 4);
      for (let i = 0; i < W * H * 0.02; i++) (g.fillStyle = css(0x000000, 0.15 + r.next() * 0.2)), g.fillRect(r.next() * W, r.next() * H, 1, 1);
    },
    rushes: (g, W, H) => strew(g, W, H, [0x8a7a48, 0x6a5a34, 0x9a8a58], 0.05, 3, r),
    sawdust: (g, W, H) => strew(g, W, H, [0xb0a07a, 0x9a8a68], 0.04, 1, r),
    soot: (g, W, H) => {
      for (let i = 0; i < 14; i++) {
        const x = r.next() * W, y = r.next() * H, rad = 10 + r.next() * 30, gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(10,8,8,0.55)'), gr.addColorStop(1, 'rgba(10,8,8,0)'), (g.fillStyle = gr), g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
    },
    chalk: (g, W, H) => {
      g.fillStyle = css(0x7a6a4a), g.fillRect(0, 0, W, H);
      for (let i = 0; i < W * H * 0.08; i++) (g.fillStyle = css(r.next() < 0.5 ? 0x8a7a58 : 0x6a5a3e)), g.fillRect(r.next() * W, r.next() * H, 1, 1);
    },
  };
  const p = paint[k.kind];
  if (!p) return null;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(k.w, k.h), new THREE.MeshLambertMaterial({ map: canvasTex(k.w, k.h, p), transparent: true, alphaTest: 0.1, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(k.x + k.w / 2, 0.012, k.y + k.h / 2);
  m.receiveShadow = true;
  return m;
}
function strew(g: CanvasRenderingContext2D, W: number, H: number, cols: number[], n: number, len: number, r: Seed): void {
  for (let i = 0; i < W * H * n; i++) {
    g.fillStyle = css(cols[Math.floor(r.next() * cols.length)], 0.85);
    r.next() < 0.5 ? g.fillRect(r.next() * W, r.next() * H, len, 1) : g.fillRect(r.next() * W, r.next() * H, 1, len);
  }
}

/** A gallery along x (from a to b, its wall at z, reaching `d` toward the room) or along z (its wall at x): deck, joists, balustrade. */
export function gallery(B: Boxes, along: 'x' | 'z', at: number, a: number, b: number, d: number, y: number, r: Seed): void {
  const wood = 0x3a2818, rail = 0x4a3420, len = b - a, mid = (a + b) / 2, s = Math.sign(d), e = at + d;
  const put = (u: number, h: number, v: number, w: number, hh: number, dd: number, c: number) => (along === 'x' ? B.b(u, h, v, w, hh, dd, c) : B.b(v, h, u, dd, hh, w, c));
  put(mid, y - 0.2, at + d / 2, len, 0.2, Math.abs(d), jit(wood, 0.05, r));
  for (let u = a + 0.3; u < b; u += 0.8) put(u, y - 0.36, at + d / 2, 0.14, 0.16, Math.abs(d), 0x2a1d12);
  put(mid, y, e - s * 0.05, len, 0.08, 0.1, rail);
  put(mid, y + 0.86, e - s * 0.05, len, 0.08, 0.14, rail);
  for (let u = a + 0.15; u < b; u += 0.32) put(u, y, e - s * 0.05, 0.06, 0.86, 0.06, jit(rail, 0.08, r));
}

/** A beam across the room at depth z (or along a side wall at x), its top at y. */
export function beam(B: Boxes, x0: number, x1: number, z: number, y: number, r: Seed): void {
  B.b((x0 + x1) / 2, y - 0.3, z, x1 - x0, 0.3, 0.3, jit(0x2e2016, 0.05, r));
}

/** A pointed arch's rib over an arcade: from pillar (x, za) to pillar (x, zb), springing at y and peaking `rise` higher. */
export function arch(B: Boxes, x: number, za: number, zb: number, y: number, rise: number, r: Seed): void {
  const n = 9, half = (zb - za) / 2;
  for (let i = 0; i <= n; i++) {
    const t = i / n, side = t < 0.5 ? t * 2 : (1 - t) * 2, h = y + rise * Math.sin((side * Math.PI) / 2), z = za + t * (zb - za);
    B.b(x, h, z, 0.32, 0.2, (half * 2) / n + 0.04, jit(0x7a7484, 0.05, r));
  }
}
