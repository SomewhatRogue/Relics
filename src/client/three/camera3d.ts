/**
 * The 3D view's camera: orthographic, looking down 36 degrees from the front (three-quarter), following
 * the hero a little ahead of where they face, held inside the room, and snapped to the low-res pixel
 * grid so nothing swims. Screen shake moves it by whole pixels. Also the room-to-screen sums.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';
import { LEDGE_H, WALL_H } from './ground';
import { groundLv } from '../../shared/heights';
import { upright } from '../phoneband';
import { STREET } from './streetkit';
import { SWING } from '../swing';

// (The new look's test street, `?hd&street`: a perspective chase camera, lower, looking down 26 degrees at your hero
// through a 28 degree lens, turning up to 45 degrees toward where you walk in town; streetkit.ts, swing.ts.)
export const PITCH = ((STREET ? 26 : 36) * Math.PI) / 180;
const FOV = 28, SWING_MAX = Math.PI / 4, IN_PITCH = (36 * Math.PI) / 180;
export const NEAR = 20;
export const FAR = 110;
const DIST = 60;

export class Cam {
  readonly cam: THREE.OrthographicCamera | THREE.PerspectiveCamera = STREET ? new THREE.PerspectiveCamera(FOV, 1, 2, 600) : new THREE.OrthographicCamera(-1, 1, 1, -1, NEAR, FAR);
  /** The chase camera's distance (tiles) and its yaw; where the hero was, to see which way they walk. */
  private dist = 60;
  private last: [number, number] | null = null;
  /** How high the ground under your hero stands (tiles), eased. */
  private lift = 0;
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
    if (this.cam instanceof THREE.PerspectiveCamera) {
      // Far enough back that a tile at your hero is `ppu` pixels across.
      this.cam.aspect = W / H;
      this.dist = H / (2 * ppu * Math.tan((FOV * Math.PI) / 360));
    } else Object.assign(this.cam, { left: -W / 2 / ppu, right: W / 2 / ppu, top: H / 2 / ppu, bottom: -H / 2 / ppu });
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
    if (this.cam instanceof THREE.PerspectiveCamera) return this.chase(map, x, z, dt);
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

  /**
   * The chase camera (the new look's town): eases after your hero, turns toward where they walk, up to 45 degrees
   * either way (walking back toward it holds the turn rather than spinning round), and looks down at them from
   * behind and above. Only in town; on a job it stays facing north.
   */
  private chase(map: GameMap, x: number, z: number, dt: number): void {
    const k = this.ready ? Math.min(1, dt * 5) : 1;
    if (this.last && map.name === 'WICKHOLD') {
      const dx = x - this.last[0], dz = z - this.last[1];
      if (Math.hypot(dx, dz) > 0.002) {
        const a = Math.atan2(dx, -dz);
        if (Math.abs(a) < 2) SWING.yaw += (Math.max(-SWING_MAX, Math.min(SWING_MAX, a)) - SWING.yaw) * Math.min(1, dt * 1.4);
      }
    } else if (map.name !== 'WICKHOLD') SWING.yaw = 0;
    this.last = [x, z];
    // Inside (the new look's bigger rooms), the view stays in the room: no looking out past its front or sides.
    if (map.wallH) [x, z] = inRoom(map, x, z, this.W / this.ppu / 2, this.H / this.ppu / 2 / Math.sin(IN_PITCH));
    this.at.x += (x - this.at.x) * k;
    this.at.z += (z - this.at.z) * k;
    this.ready = true;
    // Up on a raised level (the new town's Kirkhill), the camera rises with you, easing so a step doesn't jolt it.
    this.lift += ((map.ledges ? groundLv(map, x, z) * LEDGE_H : 0) - this.lift) * k;
    // (The new look's insides look down a little steeper, at the room and its back wall: shared/bighalls.ts.)
    const p = map.wallH ? IN_PITCH : PITCH, y = SWING.yaw, cp = Math.cos(p), ly = 0.8 + this.lift;
    this.cam.position.set(this.at.x - Math.sin(y) * cp * this.dist, ly - 0.8 + Math.sin(p) * this.dist, this.at.z + Math.cos(y) * cp * this.dist);
    this.cam.lookAt(this.at.x, ly, this.at.z);
    this.cam.updateMatrixWorld();
  }

  /** A point in the room (tiles; y is height) in low-res pixels. */
  px(x: number, y: number, z: number): [number, number] {
    this.v.set(x, y, z).project(this.cam);
    return [((this.v.x + 1) / 2) * this.W, ((1 - this.v.y) / 2) * this.H];
  }
}

/** Where to look so a view `hw` tiles half-wide and `hd` half-deep on the floor stays in the room (centred if it's smaller). */
function inRoom(m: GameMap, x: number, z: number, hw: number, hd: number): [number, number] {
  const fit = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
  // Your hero low on the screen and the room rising behind them, up to the back wall's top (the concepts' framing);
  // never so far up the room that your hero by the door drops off the foot of the screen.
  const H = m.wallH ?? 0, t = z - hd * 0.35;
  return [fit(x, hw - 1, m.w + 1 - hw), Math.max(z - hd * 0.4, fit(t, hd * 0.6 - H * 0.9, m.h + 2.4 - hd))];
}
