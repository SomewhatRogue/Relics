/**
 * The pool of shade under each tree in the tile redraw (Kyle, 2026-11-23: "trees are weirdly flat"): a solid dark
 * oval on the ground, the SNES way, a little toward the lower right (the light from the upper left), sized in whole
 * floor pixels (20 a tile across, 12 a tile deep) so its edge is as crisp as the floor's. One mesh, rebuilt with
 * the trees (ground.ts), so a felled tree takes its shade with it.
 */
import * as THREE from 'three';
import { KX, KZ } from '../tilekit';

/** How far (tiles of radius) each kind's shade reaches, about its drawn crown's half width (a trunk's own radius is
 *  far smaller); anything else casts none. */
const REACH: Record<string, number> = { tree: 1.05, pine: 0.85, deadtree: 0.6, bush: 0.6 };

export interface Shaded { x: number; y: number; r: number; kind: string; up: number }

export function treeShade(list: readonly Shaded[]): THREE.Mesh | null {
  const shapes = list.filter((o) => REACH[o.kind]).map((o) => {
    const rad = REACH[o.kind] * Math.min(1.4, Math.max(0.8, o.r / 0.45));
    return { o, rad, w: Math.max(8, Math.round(rad * 2.3 * KX)), h: Math.max(6, Math.round(rad * 1.7 * KZ)) };
  });
  if (!shapes.length) return null;
  // One atlas row of ovals, each drawn pixel by pixel (whole pixels, no soft edge).
  const W = shapes.reduce((s, q) => s + q.w + 1, 0), H = Math.max(...shapes.map((q) => q.h));
  const can = Object.assign(document.createElement('canvas'), { width: W, height: H }), g = can.getContext('2d')!;
  g.fillStyle = '#fff';
  const pos: number[] = [], uv: number[] = [];
  let ax = 0;
  for (const { o, rad, w, h } of shapes) {
    for (let py = 0; py < h; py++) {
      const dy = (py + 0.5 - h / 2) / (h / 2), half = Math.sqrt(Math.max(0, 1 - dy * dy)) * (w / 2);
      const x0 = Math.round(w / 2 - half), x1 = Math.round(w / 2 + half);
      if (x1 > x0) g.fillRect(ax + x0, py, x1 - x0, 1);
    }
    // Lying on the ground, centred right of and below the trunk's foot, so most of it shows past the trunk.
    const cx = o.x + rad * 0.3, cz = o.y + rad * 0.4, hw = w / KX / 2, hd = h / KZ / 2, y = o.up + 0.004;
    const l = cx - hw, r = cx + hw, f = cz - hd, b = cz + hd;
    pos.push(l, y, b, r, y, b, r, y, f, l, y, b, r, y, f, l, y, f);
    const u0 = ax / W, u1 = (ax + w) / W, v0 = 1 - h / H, v1 = 1;
    uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
    ax += w + 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const tex = new THREE.CanvasTexture(can);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  // The floor under the oval multiplied down to about half, its alpha (post.ts's "how ordinary") left as it was:
  // a see-through black blended into that alpha and vanished in the lighting pass.
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x808080, alphaTest: 0.5, depthWrite: false, transparent: true });
  Object.assign(mat, {
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
    blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1;
  return mesh;
}
