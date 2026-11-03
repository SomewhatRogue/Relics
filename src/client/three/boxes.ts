/**
 * Boxes merged into one mesh: every stone, plank and shingle of a building (or the whole map's still
 * things) is one draw. Each box has its own colour, kept per vertex. `jit` shades a colour a little
 * either way from a seed, so a wall of stones isn't one flat colour (cosmetic only).
 */
import * as THREE from 'three';

type Shape = [Float32Array, Float32Array];
const shape = (g: THREE.BufferGeometry): Shape => ((g = g.toNonIndexed()), [g.getAttribute('position').array as Float32Array, g.getAttribute('normal').array as Float32Array]);
const BOX = shape(new THREE.BoxGeometry(1, 1, 1));
// A six-sided cone (a pine's tier) and a twenty-faced lump (a leafy crown): low enough to read as pixel art.
const CONE = shape(new THREE.ConeGeometry(0.5, 1, 6, 1));
const LUMP = shape(new THREE.IcosahedronGeometry(0.5, 0));
const mat = new THREE.Matrix4(), nmat = new THREE.Matrix3(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), p = new THREE.Vector3();
const col = new THREE.Color();

/** A tiny repeatable shuffle for looks (never for outcomes). */
export class Seed {
  constructor(private n: number) {}
  next(): number {
    this.n = (this.n * 1103515245 + 12345) & 0x7fffffff;
    return this.n / 0x7fffffff;
  }
}

/** A colour shaded by up to `amt` either way. */
export function jit(hex: number, amt: number, r: Seed): number {
  const k = 1 + (r.next() * 2 - 1) * amt;
  col.setHex(hex);
  return col.setRGB(Math.min(1, col.r * k), Math.min(1, col.g * k), Math.min(1, col.b * k)).getHex();
}

export class Boxes {
  private pos: number[] = [];
  private nor: number[] = [];
  private cols: number[] = [];

  get count(): number {
    return this.pos.length / 108;
  }

  /** A box by its centre, size, colour and turn (y, then x, then z). */
  c(x: number, y: number, z: number, w: number, h: number, d: number, hex: number, ry = 0, rx = 0, rz = 0): void {
    this.put(BOX, x, y, z, w, h, d, hex, ry, rx, rz);
  }

  /** A six-sided cone by its centre, width across and height. */
  cone(x: number, y: number, z: number, w: number, h: number, hex: number, ry = 0): void {
    this.put(CONE, x, y, z, w, h, w, hex, ry);
  }

  /** A rounded lump by its centre and size (a crown of leaves, a bush). */
  lump(x: number, y: number, z: number, w: number, h: number, d: number, hex: number, ry = 0): void {
    this.put(LUMP, x, y, z, w, h, d, hex, ry);
  }

  private put([UP, UN]: Shape, x: number, y: number, z: number, w: number, h: number, d: number, hex: number, ry = 0, rx = 0, rz = 0): void {
    mat.compose(p.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz, 'YXZ')), s.set(w, h, d));
    nmat.getNormalMatrix(mat);
    col.setHex(hex);
    for (let i = 0; i < UP.length; i += 3) {
      v.set(UP[i], UP[i + 1], UP[i + 2]).applyMatrix4(mat);
      this.pos.push(v.x, v.y, v.z);
      v.set(UN[i], UN[i + 1], UN[i + 2]).applyMatrix3(nmat).normalize();
      this.nor.push(v.x, v.y, v.z);
      this.cols.push(col.r, col.g, col.b);
    }
  }

  /** A box standing on y (its base), centred on x and z. */
  b(x: number, y: number, z: number, w: number, h: number, d: number, hex: number, ry = 0): void {
    this.c(x, y + h / 2, z, w, h, d, hex, ry);
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.cols, 3));
    g.computeBoundingSphere();
    return g;
  }

  /** The merged mesh (casting and taking shadows), or null if nothing was added. */
  mesh(material: THREE.Material, cast = true): THREE.Mesh | null {
    if (!this.pos.length) return null;
    const m = new THREE.Mesh(this.geometry(), material);
    m.castShadow = cast;
    m.receiveShadow = true;
    return m;
  }
}
