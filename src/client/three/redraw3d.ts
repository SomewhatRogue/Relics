/**
 * The tile redraw's buildings (docs/design/tile-redraw.md, R1; `?redraw=1`, ../tilelook.ts): a house's four wall faces
 * and its roof's front slope drawn from the tile kit (../tilekit.ts) and laid on the built house as flat faces, at 20
 * pixels a tile across and 16 a tile of height, so at the redraw's 36.87 degrees every drawn pixel is one render pixel.
 * The door, its frame, the lit panes, signs and the ridge stay the 3D ones in front. The roof's slope is a child of the
 * roof mesh, so it lifts off with it when you walk behind. Cosmetic only.
 */
import * as THREE from 'three';
import { Rng } from '../../shared/rng';
import { faceCanvas, KX, roofCanvas, type FaceWin } from '../tilekit';
import { toonize } from './post';
import { PITCH } from './camera3d';

function mat(c: HTMLCanvasElement): THREE.MeshLambertMaterial {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return toonize(new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5 }));
}

export interface Drawn {
  x0: number; x1: number; z0: number; z1: number; H: number; stone: boolean; thatch: boolean;
  /** The door's middle (x) and half width, and its height; null for none. */
  door: number | null; dw: number; dh: number;
  /** The front windows' middles (x). */
  wins: number[];
  /** The roof's pitch (radians) and whether its front slope is drawn (not a tower's cone, not gapped, not a building
   *  turned to face east or west, whose slopes are seen side-on and cannot be drawn pixel for pixel). */
  angle: number; slope: boolean;
}

/** Lay the drawn faces on `group` and the drawn slope on `roof`. */
export function drawHouse(group: THREE.Group, roof: THREE.Mesh | null, d: Drawn, seed: number): void {
  const rng = new Rng(seed), w = d.x1 - d.x0, deep = d.z1 - d.z0, e = 0.004;
  const pane = (x: number): FaceWin => ({ x: x - d.x0, y: d.H * 0.42 + 0.075, w: 0.5, h: 0.45 });
  const face = (fw: number, front: boolean) =>
    faceCanvas({ w: fw, h: d.H, stone: d.stone, seed, door: front && d.door !== null ? { x: d.door - d.x0, w: d.dw * 2, h: d.dh } : undefined, wins: front ? d.wins.map(pane) : [] }, rng);
  const put = (c: HTMLCanvasElement, pw: number, x: number, z: number, ry: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, d.H), mat(c));
    m.position.set(x, d.H / 2, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    group.add(m);
  };
  put(face(w, true), w, (d.x0 + d.x1) / 2, d.z1 + e, 0);
  put(face(w, false), w, (d.x0 + d.x1) / 2, d.z0 - e, Math.PI);
  put(face(deep, false), deep, d.x0 - e, (d.z0 + d.z1) / 2, -Math.PI / 2);
  put(face(deep, false), deep, d.x1 + e, (d.z0 + d.z1) / 2, Math.PI / 2);
  if (!roof || !d.slope) return;
  // The front slope, as roofs3d.ts gable() lays it: from the ridge down past the eave by its overhang.
  const a = d.angle, ov = 0.22, zc = (d.z0 + d.z1) / 2, hd = deep / 2 + ov, sl = hd / Math.cos(a), ridgeY = d.H + (deep / 2) * Math.tan(a);
  const rw = w + ov * 2, rows = Math.max(4, Math.round(KX * sl * Math.sin(a + PITCH))), lift = d.thatch ? 0.26 : 0.14;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(rw, sl), mat(roofCanvas(rw, rows, d.thatch, rng)));
  m.rotation.x = -(Math.PI / 2 - a);
  m.position.set((d.x0 + d.x1) / 2, ridgeY - (sl / 2) * Math.sin(a) + Math.cos(a) * lift, zc + (sl / 2) * Math.cos(a) + Math.sin(a) * lift);
  m.receiveShadow = true;
  roof.add(m);
}
