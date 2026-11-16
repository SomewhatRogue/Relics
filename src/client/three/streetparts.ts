/**
 * Building from parts (`?hd&street&parts`, docs/decisions/new-look-buildings.md): faces and boxes with real depth,
 * textured at the kit's 32 px a tile (a swatch is two tiles, mirrored as it repeats; a picture part fills its face),
 * gathered by material and merged into one mesh each, so a house of a hundred pieces is a handful of draws.
 */
import * as THREE from 'three';
import { mat } from './streetkit';

export type V = [number, number, number];
interface Bucket { p: number[]; uv: number[]; wrap: boolean; glow: boolean }

export class Parts {
  private buckets = new Map<string, Bucket>();
  /** Where a point goes: set to build a wall in its own frame (across, up, out) and have it turned onto its side. */
  map: (v: V) => V = (v) => v;

  private bucket(name: string, wrap: boolean, glow: boolean): Bucket {
    const k = `${name}|${wrap}|${glow}`;
    let b = this.buckets.get(k);
    if (!b) this.buckets.set(k, (b = { p: [], uv: [], wrap, glow }));
    return b;
  }

  /** A face from four corners, counter-clockwise from its bottom left as seen from outside, with its UVs. */
  face(name: string, a: V, b: V, c: V, d: V, uv: [number, number, number, number], wrap = true, glow = false): void {
    const B = this.bucket(name, wrap, glow), [u0, v0, u1, v1] = uv;
    [a, b, c, d] = [a, b, c, d].map(this.map);
    B.p.push(...a, ...b, ...c, ...a, ...c, ...d);
    B.uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
  }

  /** A face of tiled material: UVs by its own size (a swatch two tiles across), from (u, v) along the world. */
  tiled(name: string, a: V, b: V, c: V, d: V, u = 0, v = 0): void {
    const w = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), h = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
    this.face(name, a, b, c, d, [u / 2, v / 2, (u + w) / 2, (v + h) / 2]);
  }

  /** A three-cornered face of tiled material (a gable): its base a to b, its peak c. */
  gable(name: string, a: V, b: V, c: V): void {
    const B = this.bucket(name, true, false), w = Math.hypot(b[0] - a[0], b[2] - a[2]), h = c[1] - a[1];
    [a, b, c] = [a, b, c].map(this.map);
    B.p.push(...a, ...b, ...c);
    B.uv.push(0, 0, w / 2, 0, w / 4, h / 2);
  }

  /** A box of tiled material, x0..x1 by y0..y1 by z0..z1 (no bottom). */
  box(name: string, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
    this.tiled(name, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], x0, y0);
    this.tiled(name, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], -x1, y0);
    this.tiled(name, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], -z1, y0);
    this.tiled(name, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], z0, y0);
    this.tiled(name, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], x0, -z1);
  }

  /** A picture part (a window, a door) filling a face, its lit panes glowing if `glow`. */
  picture(name: string, a: V, b: V, c: V, d: V, glow = true): void {
    this.face(name, a, b, c, d, [0, 0, 1, 1], false, glow);
  }

  /** The merged meshes, one per material, casting and taking shadows. */
  build(): THREE.Group {
    const g = new THREE.Group();
    for (const [k, b] of this.buckets) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat(k.split('|')[0], b.wrap, b.glow));
      m.castShadow = m.receiveShadow = true;
      m.name = k;
      g.add(m);
    }
    return g;
  }
}
