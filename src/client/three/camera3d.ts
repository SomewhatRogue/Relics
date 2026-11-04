/**
 * The 3D view's camera: orthographic, looking down 36 degrees from the front (three-quarter), following
 * the hero a little ahead of where they face, held inside the room, and snapped to the low-res pixel
 * grid so nothing swims. Screen shake moves it by whole pixels. Also the room-to-screen sums.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { WALL_H } from './ground';

export const PITCH = (36 * Math.PI) / 180;
export const NEAR = 20;
export const FAR = 110;
const DIST = 60;

export class Cam {
  readonly cam = new THREE.OrthographicCamera(-1, 1, 1, -1, NEAR, FAR);
  /** Where it looks (tiles, on the floor). */
  readonly at = new THREE.Vector3();
  private ready = false;
  W = 1;
  H = 1;
  ppu = 16;
  private v = new THREE.Vector3();
  private right = new THREE.Vector3(1, 0, 0);
  private up = new THREE.Vector3(0, Math.cos(PITCH), -Math.sin(PITCH));
  private back = new THREE.Vector3(0, Math.sin(PITCH), Math.cos(PITCH));

  constructor() {
    this.cam.rotation.set(-PITCH, 0, 0, 'YXZ');
  }

  size(W: number, H: number, ppu: number): void {
    Object.assign(this, { W, H, ppu });
    Object.assign(this.cam, { left: -W / 2 / ppu, right: W / 2 / ppu, top: H / 2 / ppu, bottom: -H / 2 / ppu });
    this.cam.updateProjectionMatrix();
  }

  reset(): void {
    this.ready = false;
  }

  /** Ease toward (x, z) over dt, keep the view in the room, snap to the pixel grid, shake by `shake` pixels. */
  follow(map: GameMap, x: number, z: number, dt: number, shake: number): void {
    const k = this.ready ? Math.min(1, dt * 7) : 1;
    this.at.x += (x - this.at.x) * k;
    this.at.z += (z - this.at.z) * k;
    this.ready = true;
    const hw = this.W / this.ppu / 2, hd = this.H / this.ppu / 2 / Math.sin(PITCH);
    const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
    this.at.x = clamp(this.at.x, hw - 1, map.w + 1 - hw);
    // (Upright, the view may run past the room's foot, so the hero stays above the touch buttons.)
    const foot = this.H > this.W * 1.2 ? hd * 0.44 : 0;
    this.at.z = clamp(this.at.z, hd - 1 - (WALL_H / Math.tan(PITCH)) * 0.8, map.h + 1 - hd + foot);
    let r = this.at.dot(this.right), u = this.at.dot(this.up);
    const b = this.at.dot(this.back);
    r = Math.round(r * this.ppu) / this.ppu;
    u = Math.round(u * this.ppu) / this.ppu;
    if (shake > 0.2) r += Math.round((Math.random() - 0.5) * shake) / this.ppu, (u += Math.round((Math.random() - 0.5) * shake) / this.ppu);
    this.cam.position.copy(this.right).multiplyScalar(r).addScaledVector(this.up, u).addScaledVector(this.back, b + DIST);
    this.cam.updateMatrixWorld();
  }

  /** A point in the room (tiles; y is height) in low-res pixels. */
  px(x: number, y: number, z: number): [number, number] {
    this.v.set(x, y, z).project(this.cam);
    return [((this.v.x + 1) / 2) * this.W, ((1 - this.v.y) / 2) * this.H];
  }
}
