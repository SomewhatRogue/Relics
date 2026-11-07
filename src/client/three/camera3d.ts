/**
 * The 3D view's camera: orthographic, looking down 36 degrees from the front (three-quarter), following
 * the hero a little ahead of where they face, held inside the room, and snapped to the low-res pixel
 * grid so nothing swims. Screen shake moves it by whole pixels. Also the room-to-screen sums.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { WALL_H } from './ground';
import { upright } from '../phoneband';

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

  /**
   * Ease toward (x, z) over dt, keep the view in the room, snap to the pixel grid, shake by `shake` pixels.
   * `keep`: on an upright phone, the hero's floor z and the band (low-res pixels down the screen) their
   * feet must stay in, over the room's edge if need be (phoneband.ts). `ins`: low-res pixels a boss's plate
   * covers under the top HUD; the view looks that much higher and the room's top may come down under it.
   */
  follow(map: GameMap, x: number, z: number, dt: number, shake: number, keep?: { z: number; top: number; bottom: number }, ins = 0): void {
    const k = this.ready ? Math.min(1, dt * 7) : 1, up = ins / (Math.sin(PITCH) * this.ppu);
    z -= up;
    this.at.x += (x - this.at.x) * k;
    this.at.z += (z - this.at.z) * k;
    this.ready = true;
    const hw = this.W / this.ppu / 2, hd = this.H / this.ppu / 2 / Math.sin(PITCH);
    const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
    this.at.x = clamp(this.at.x, hw - 1, map.w + 1 - hw);
    // (Upright, the view may run past the room's foot, a short room needn't sit centred, so the hero stays above the touch buttons.)
    const foot = upright(this.W, this.H) ? hd * 0.44 : 0, zlo = hd - 1 - (WALL_H / Math.tan(PITCH)) * 0.8, zhi = map.h + 1 - hd;
    const lo = Math.min(zlo > zhi ? (zlo + zhi) / 2 : zlo, zlo - up);
    this.at.z = Math.max(lo, Math.min(Math.max(lo, zhi) + foot, this.at.z));
    // A floor point's height on screen: H / 2 + (its z - at.z) * sin(pitch) * ppu.
    if (keep) {
      const per = Math.sin(PITCH) * this.ppu;
      this.at.z = Math.max(keep.z - (keep.bottom - this.H / 2) / per, Math.min(keep.z - (keep.top - this.H / 2) / per, this.at.z));
    }
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
