/**
 * The new look's props (`?hd&street`, docs/decisions/new-look-buildings.md): the kit's pictures of trees, the well,
 * lamp posts, barrels, crates, sacks, a handcart, market stalls and benches, stood up as boards that turn with the
 * chase camera's swing (a shared yaw read in the vertex shader, so nothing is touched per frame). Lit like the
 * buildings, their lanterns glowing. Drawing only: what they stand for keeps its place and its footprint.
 */
import * as THREE from 'three';
import type { Round } from '../../shared/arena';
import { mat } from './streetkit';
import { PX, size } from './streetrow';
import { SWING } from '../swing';

/** The swing, turned for the boards: read by every board's shader on every draw. */
const YAW = { get value() { return -SWING.yaw; } };
const boardMats = new Map<string, THREE.Material>();
function boardMat(name: string): THREE.Material {
  let m = boardMats.get(name);
  if (!m) {
    m = (mat(name, false, true) as THREE.MeshLambertMaterial).clone();
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uYaw = YAW;
      const turn = (v: string) => `{ float c = cos(uYaw), s = sin(uYaw); ${v}.xz = vec2(c * ${v}.x + s * ${v}.z, -s * ${v}.x + c * ${v}.z); }`;
      sh.vertexShader = 'uniform float uYaw;\n' + sh.vertexShader
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + turn('objectNormal'))
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + turn('transformed'));
    };
    m.customProgramCacheKey = () => 'streetboard';
    boardMats.set(name, m);
  }
  return m;
}

const geos = new Map<string, THREE.BufferGeometry>();
/** A kit picture standing at (x, z) on the ground, `k` times its own size, facing the camera; mirrored if `flip`. */
export function board(name: string, x: number, z: number, k = 1, flip = false): THREE.Mesh {
  let g = geos.get(name);
  if (!g) {
    const [w, h] = size(name);
    geos.set(name, (g = new THREE.PlaneGeometry(w / PX, h / PX).translate(0, h / PX / 2, 0)));
  }
  const q = new THREE.Mesh(g, boardMat(name));
  q.position.set(x, 0, z);
  q.scale.set(flip ? -k : k, k, k);
  q.castShadow = q.receiveShadow = true;
  return q;
}

/** A round thing in town drawn from the kit, if the kit has it: added to `group` (`up` tiles up, on a raised level), true if done. */
export function kitRound(group: THREE.Group, o: Round, up = 0): boolean {
  const at = new THREE.Group();
  at.position.y = up;
  const done = kitRoundAt(at, o);
  if (done) group.add(at);
  return done;
}

function kitRoundAt(group: THREE.Group, o: Round): boolean {
  const flip = Math.round(o.x * 7 + o.y * 3) % 2 === 0;
  switch (o.kind) {
    case 'tree': return !!group.add(board('prop-tree', o.x, o.y, 1.25 + (Math.abs(o.x * 13 + o.y * 7) % 5) * 0.08, flip));
    case 'well': return !!group.add(board('prop-well', o.x, o.y + 0.2));
    case 'post': return !!group.add(board('prop-lamp', o.x, o.y, 0.95, flip));
    case 'crates': return !!group.add(board('prop-crates', o.x, o.y, 1, flip));
    case 'sacks': return !!group.add(board('prop-sacks', o.x, o.y, 1, flip));
    case 'handcart': return !!group.add(board('prop-cart', o.x, o.y, 1.1, flip));
    case 'barrels':
      group.add(board('prop-barrel', o.x - 0.25, o.y - 0.1), board('prop-barrel', o.x + 0.25, o.y + 0.05, 1, true), board('prop-barrel', o.x, o.y + 0.3, 0.95));
      return true;
    default: return false;
  }
}

/** A market stall, bench or cart block drawn from the kit, filling its footprint; null if the kit has none for it. */
export function kitFurniture(kind: string, x: number, y: number, w: number, h: number): THREE.Group | null {
  const pic = kind === 'stall' && h >= 1 ? 'prop-stall' : kind === 'bench' ? 'prop-bench' : kind === 'cart' ? 'prop-cart' : null;
  if (!pic) return null;
  const g = new THREE.Group(), k = w / (size(pic)[0] / PX);
  g.add(board(pic, x + w / 2, y + h / 2, k));
  return g;
}

/** Dressing by a front (drawing only): a barrel, crates or sacks against the wall at x, kept off the door. */
export function dressing(group: THREE.Group, x: number, z: number, n: number): void {
  const pick = ['prop-barrel', 'prop-crates', 'prop-sacks', 'prop-barrel'][n % 4];
  group.add(board(pick, x, z + 0.25, pick === 'prop-crates' ? 0.75 : 0.9, n % 2 === 1));
  if (pick === 'prop-barrel' && n % 3 === 0) group.add(board('prop-barrel', x + 0.45, z + 0.3, 0.85, true));
}
