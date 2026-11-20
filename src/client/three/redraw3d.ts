/**
 * The tile redraw's drawn faces (docs/design/tile-redraw.md; `?redraw=1`, ../tilelook.ts). Every face is a flat quad
 * whose picture is mapped by where its corners land on screen: a column for each 20th of a tile across, a row for each
 * render pixel down (12 a tile of floor, 16 a tile of height at 36.87 degrees). So one drawn pixel is one render pixel
 * whichever way the face points, and the kit (../tilekit.ts) draws each face as the camera sees it.
 * Here: a house's four walls and its roof's slopes (R1, and the slopes of a building turned east or west, seen
 * side-on), a level's retaining walls and its steps (R2, from layoutledges.ts). The door, its frame, the lit panes, signs
 * and the ridge stay the 3D ones in front. A roof's slopes are children of the roof mesh, so they lift off with it.
 */
import * as THREE from 'three';
import { Rng } from '../../shared/rng';
import { faceCanvas, KX, KY, KZ, ledgeCanvas, roofCanvas, stepCanvas, type FaceWin } from '../tilekit';
import { toonize } from './post';
import { PITCH } from './camera3d';

type V3 = [number, number, number];
const TO_CAM = new THREE.Vector3(0, Math.sin(PITCH), Math.cos(PITCH));

function mat(c: HTMLCanvasElement): THREE.MeshLambertMaterial {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return toonize(new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide }));
}

/**
 * A quad (corners in order round it, in its parent's space; `world` takes them to the room's) with its picture mapped
 * to the screen's pixels. `draw(cols, rows)` makes the picture at exactly the size it covers.
 */
export function screenQuad(c: V3[], draw: (cols: number, rows: number) => HTMLCanvasElement, world: (p: V3) => V3 = (p) => p): THREE.Mesh {
  const sp = c.map((p) => {
    const [x, y, z] = world(p);
    return [x * KX, z * KZ - y * KY];
  });
  const c0 = Math.min(...sp.map((p) => p[0])), r0 = Math.min(...sp.map((p) => p[1]));
  const cols = Math.max(1, Math.round(Math.max(...sp.map((p) => p[0])) - c0)), rows = Math.max(1, Math.round(Math.max(...sp.map((p) => p[1])) - r0));
  const uv = sp.map(([x, r]) => [(x - c0) / cols, 1 - (r - r0) / rows]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 2, 0, 2, 3].flatMap((i) => c[i]), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 2, 0, 2, 3].flatMap((i) => uv[i]), 2));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat(draw(cols, rows)));
  m.receiveShadow = true;
  return m;
}

export interface Drawn {
  x0: number; x1: number; z0: number; z1: number; H: number; stone: boolean; thatch: boolean;
  /** The door's middle (x) and half width, and its height; null for none. */
  door: number | null; dw: number; dh: number;
  /** The front windows' middles (x). */
  wins: number[];
  /** The roof's pitch (radians) and whether its slopes are drawn (not a tower's cone, not gapped). */
  angle: number; slope: boolean;
  /** The quarter turn the building is given after it's built (turn3d.ts), about its middle (cx, cz). */
  turn: number; cx: number; cz: number;
  /** The building's own wall and roof colours (graded), for the drawn faces to take (tilekit.ts tint). */
  wall: number; roof: number;
}

/** Lay the drawn walls on `group` and the drawn slopes on `roof` (both built facing south, before any turn). */
export function drawHouse(group: THREE.Group, roof: THREE.Mesh | null, d: Drawn, seed: number): void {
  const rng = new Rng(seed), w = d.x1 - d.x0, deep = d.z1 - d.z0, e = 0.004, cs = Math.cos(d.turn), sn = Math.sin(d.turn);
  const world = ([x, y, z]: V3): V3 => [d.cx + (x - d.cx) * cs + (z - d.cz) * sn, y, d.cz - (x - d.cx) * sn + (z - d.cz) * cs];
  const pane = (x: number): FaceWin => ({ x: x - d.x0, y: d.H * 0.42 + 0.075, w: 0.5, h: 0.45 });
  const face = (fw: number, front: boolean) =>
    faceCanvas({ w: fw, h: d.H, stone: d.stone, seed, base: d.wall, door: front && d.door !== null ? { x: d.door - d.x0, w: d.dw * 2, h: d.dh } : undefined, wins: front ? d.wins.map(pane) : [] }, rng);
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
  // The slopes, as roofs3d.ts gable() lays them: from the ridge down past the eave by its overhang, a little proud.
  const a = d.angle, ov = 0.22, zc = (d.z0 + d.z1) / 2, hd = deep / 2 + ov, ridgeY = d.H + (deep / 2) * Math.tan(a), drop = hd * Math.tan(a);
  const lift = d.thatch ? 0.26 : 0.14, xa = d.x0 - ov, xb = d.x1 + ov;
  for (const s of [1, -1]) {
    // Drawn only if it faces the camera once the building is turned.
    const n = new THREE.Vector3(0, Math.cos(a), s * Math.sin(a)).applyAxisAngle(new THREE.Vector3(0, 1, 0), d.turn);
    if (n.dot(TO_CAM) < 0.05) continue;
    const ly = Math.cos(a) * lift, lz = s * Math.sin(a) * lift, top = ridgeY + ly, foot = ridgeY - drop + ly, ez = zc + s * hd + lz;
    const corners: V3[] = [[xa, foot, ez], [xb, foot, ez], [xb, top, zc + lz], [xa, top, zc + lz]];
    const side = Math.abs(n.x) > Math.abs(n.z);
    roof.add(screenQuad(corners, (cols, rows) => roofCanvas(cols, rows, d.thatch, rng, side, d.roof), world));
  }
}

/** A level's retaining wall facing the camera, from a0 to a1 along x at z, h high (layoutledges.ts). */
export function drawnLedgeFace(a0: number, a1: number, z: number, h: number, seed: number): THREE.Mesh {
  const rng = new Rng(seed);
  return screenQuad([[a0, 0, z], [a1, 0, z], [a1, h, z], [a0, h, z]], (c, r) => ledgeCanvas(c, r, rng));
}

/** A step: its tread at height y from z0 to z1, and its riser at z1 from y0 up to y (when it faces the camera). */
export function drawnStep(group: THREE.Group, x0: number, x1: number, z0: number, z1: number, y0: number, y: number, riser: boolean, seed: number): void {
  const rng = new Rng(seed), e = 0.004;
  group.add(screenQuad([[x0, y + e, z1], [x1, y + e, z1], [x1, y + e, z0], [x0, y + e, z0]], (c, r) => stepCanvas(c, r, false, rng)));
  if (riser && y - y0 > 0.01) group.add(screenQuad([[x0, y0, z1 + e], [x1, y0, z1 + e], [x1, y, z1 + e], [x0, y, z1 + e]], (c, r) => stepCanvas(c, r, true, rng)));
}
