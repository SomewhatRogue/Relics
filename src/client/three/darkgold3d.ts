/**
 * Dark and gold in 2.5D (docs/design/dark-gold.md, slice 1): a built block's vertex colours put through the same
 * grade as the flat view (../darkgold.ts), the roof as slate, and moss laid on: on the upward faces of roof
 * courses and on the lowest stones of a wall, face by face (six vertices to a box face). Once per build
 * (buildings3d.ts), cosmetic only.
 */
import * as THREE from 'three';
import { gradeHex, MOSS, type Grade } from '../darkgold';
import { TILES } from '../tilelook';

const c = new THREE.Color(), MOSSN = MOSS.map((h) => parseInt(h.slice(1), 16));
const memo = new Map<string, number>();

/** A linear vertex colour graded, through sRGB hex as the flat view sees it. */
function grade(r: number, g: number, b: number, mode: Grade): THREE.Color {
  const hx = c.setRGB(r, g, b).getHex(), k = mode + hx;
  let v = memo.get(k);
  if (v === undefined) memo.set(k, (v = gradeHex(hx, mode)));
  return c.setHex(v);
}

/** Grade every mesh with vertex colours in a built block; the `roof` mesh as a roof. `seed` places the moss. */
export function gradeBuilt(group: THREE.Group, roof: THREE.Mesh | null, seed: number): void {
  let n = seed | 0;
  const rnd = () => ((n = (n * 1103515245 + 12345) & 0x7fffffff), n / 0x7fffffff);
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const col = m.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
    if (!col) return;
    const isRoof = m === roof, mode: Grade = isRoof ? 'roof' : 'wall', a = col.array as Float32Array;
    const pos = m.geometry.getAttribute('position').array as Float32Array, nor = m.geometry.getAttribute('normal').array as Float32Array;
    for (let i = 0; i < a.length; i += 3) {
      const g = grade(a[i], a[i + 1], a[i + 2], mode);
      a[i] = g.r, a[i + 1] = g.g, a[i + 2] = g.b;
    }
    // Moss, a face at a time: on a roof the faces turned up; on a wall the low faces turned out, on stone.
    for (let f = 0; f + 18 <= a.length; f += 18) {
      const ny = nor[f + 1], y = pos[f + 1];
      // (The tile look, ../tilelook.ts: a third as much, so a roof reads as one slate with a little moss, not a speckle.)
      const k = TILES.on ? 0.35 : 1, want = isRoof ? ny > 0.55 && rnd() < 0.13 * k : ny < 0.3 && y < 0.55 && stoneish(a, f) && rnd() < 0.2 * k;
      if (!want) continue;
      c.setHex(MOSSN[Math.floor(rnd() * MOSSN.length)]);
      for (let v = f; v < f + 18; v += 3) a[v] = c.r, a[v + 1] = c.g, a[v + 2] = c.b;
    }
    col.needsUpdate = true;
  });
}

/** Whether a face's colour is the slate the grade gave stone (../darkgold.ts; not timber, not a lit pane). */
function stoneish(a: Float32Array, f: number): boolean {
  const r = a[f], g = a[f + 1], b = a[f + 2];
  return b >= g && g >= r && b - r < 0.07 && b > 0.01 && b < 0.24;
}
