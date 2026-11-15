/**
 * Stacked levels in 2.5D (docs/design/town-layout.md): a map whose ledges carry a level (`lv`) is drawn with each
 * level's top laid in the floor's own material at its height (so the cobbles and the painted ground run on up), its
 * edge a coursed stone retaining wall, and its ramps as flights of steps from the level below to the one above.
 * Drawing only; shared/arena.ts decides who stands where.
 */
import * as THREE from 'three';
import { levelAt, type Area, type GameMap, type Ledge } from '../../shared/arena';
import { Boxes, Seed, jit } from './boxes';

/** Whether a map's ledges are stacked levels (drawn here) rather than a job's rock shelves (ground.ts). */
export const stacked = (m: GameMap) => !!m.ledges?.some((l) => l.lv !== undefined);

/** A level's top: a flat quad in the floor's material, its UVs the floor's, so the ground lines up. */
function top(l: Ledge, y: number, m: GameMap, mat: THREE.Material): THREE.Mesh {
  const x0 = l.x, x1 = l.x + l.w, z0 = l.y, z1 = l.y + l.h, u = (x: number) => x / m.w, v = (z: number) => 1 - z / m.h;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([u(x0), v(z1), u(x1), v(z1), u(x1), v(z0), u(x0), v(z1), u(x1), v(z0), u(x0), v(z0)], 2));
  g.computeVertexNormals();
  const q = new THREE.Mesh(g, mat);
  q.receiveShadow = true;
  return q;
}

/** A retaining wall's face along one edge: courses of stone, proud of the core, a coping along the top. */
function wall(B: Boxes, ax: 'x' | 'z', a0: number, a1: number, c: number, out: number, h: number, r: Seed): void {
  const ch = 0.25;
  for (let y = 0, row = 0; y < h - 0.01; y += ch, row++) {
    let a = a0 - (row % 2 ? 0.3 : 0);
    while (a < a1) {
      const len = 0.5 + r.next() * 0.45, sa = Math.max(a, a0), sb = Math.min(a + len, a1), hh = Math.min(ch, h - y) - 0.03;
      a += len;
      if (sb - sa < 0.08) continue;
      const col = jit(0x4a4652, 0.13, r);
      if (ax === 'x') B.b((sa + sb) / 2, y, c + out * 0.06, sb - sa - 0.04, hh, 0.12, col);
      else B.b(c + out * 0.06, y, (sa + sb) / 2, 0.12, hh, sb - sa - 0.04, col);
    }
  }
  if (ax === 'x') B.b((a0 + a1) / 2, h - 0.02, c + out * 0.08, a1 - a0, 0.1, 0.2, 0x5c5866);
  else B.b(c + out * 0.08, h - 0.02, (a0 + a1) / 2, 0.2, 0.1, a1 - a0, 0x5c5866);
}

/** A ramp as a flight of steps, from the level on its low side up to the level on its high side. */
function steps(B: Boxes, q: Area, m: GameMap, H: number, r: Seed): void {
  const mx = q.x + q.w / 2, my = q.y + q.h / 2, lv = (x: number, y: number) => levelAt(m, x, y);
  const n = lv(mx, q.y - 0.2), s = lv(mx, q.y + q.h + 0.2), w = lv(q.x - 0.2, my), e = lv(q.x + q.w + 0.2, my);
  const alongY = n !== s || w === e, lo = alongY ? Math.min(n, s) : Math.min(w, e), hi = alongY ? Math.max(n, s) : Math.max(w, e);
  const len = alongY ? q.h : q.w, k = Math.max(2, Math.round(len / 0.32)), up = alongY ? (n > s ? -1 : 1) : (w > e ? -1 : 1);
  for (let i = 0; i < k; i++) {
    // Step i from the low end: its height, and where it sits along the flight.
    const h = (lo + ((hi - lo) * (i + 1)) / (k + 1)) * H, f = (i + 0.5) / k, d = len / k;
    const at = up > 0 ? f : 1 - f, col = jit(i % 2 ? 0x4a4652 : 0x6a6674, 0.05, r);
    if (alongY) B.b(mx, 0, q.y + at * q.h, q.w, h, d + 0.01, col);
    else B.b(q.x + at * q.w, 0, my, d + 0.01, h, q.h, col);
  }
}

/** Every stacked level of the map: cores, faces, tops and steps. Tops go in `group`, stone in `B`. */
export function stackLedges(B: Boxes, group: THREE.Group, m: GameMap, floor: THREE.Material, H: number): void {
  const r = new Seed(m.w * 13 + m.h * 7), all = [...(m.ledges ?? [])].sort((a, b) => (a.lv ?? 1) - (b.lv ?? 1));
  for (const l of all) {
    const h = (l.lv ?? 1) * H;
    B.b(l.x + l.w / 2, 0, l.y + l.h / 2, l.w - 0.02, h - 0.02, l.h - 0.02, 0x2e2b34);
    group.add(top(l, h, m, floor));
    // Faces only where the ground beside the edge is lower than this level (and inside the map).
    const face = (ax: 'x' | 'z', c: number, out: number, a0: number, a1: number) => {
      let s = -1;
      for (let a = a0; a < a1 - 1e-6; a += 0.5) {
        const mid = (a + Math.min(a + 0.5, a1)) / 2, px = ax === 'x' ? mid : c + out * 0.2, pz = ax === 'x' ? c + out * 0.2 : mid;
        const low = px > 0 && pz > 0 && px < m.w && pz < m.h && levelAt(m, px, pz) < (l.lv ?? 1);
        if (low && s < 0) s = a;
        if (!low && s >= 0) wall(B, ax, s, a, c, out, h, r), (s = -1);
      }
      if (s >= 0) wall(B, ax, s, a1, c, out, h, r);
    };
    face('x', l.y + l.h, 1, l.x, l.x + l.w);
    face('x', l.y, -1, l.x, l.x + l.w);
    face('z', l.x, -1, l.y, l.y + l.h);
    face('z', l.x + l.w, 1, l.y, l.y + l.h);
    for (const q of l.ramps) steps(B, q, m, H, r);
  }
}
