/**
 * The new look, slice 0b (docs/design/new-look.md): Wickhold's buildings from the generated kit (scripts/kitprep.py,
 * pictures in ./kit), behind `?street` (with `?hd`). A block becomes a row of gable-fronted houses at their natural
 * size (32 px a tile), packed along its front: what the block is (a forge, the Drowned Rat, the church) in the middle,
 * town houses either side, each with its own slate roof running back from the street and stone or timber down its
 * sides. A guild sign hangs on a bracket beside the door of the ones you can go in. Lit windows glow in their own
 * colours. Drawing only: the block's footprint, door and collision are the room's, unchanged.
 */
import * as THREE from 'three';
import type { Block } from '../../shared/arena';
import { HD } from './hdlook';
import SIZES from './kit/kit.json';

/** Whether this screen builds the town from the kit (`?street`, under `?hd`). */
export const STREET = HD && typeof location !== 'undefined' && new URLSearchParams(location.search).has('street');

const PICS = import.meta.glob('./kit/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const pic = (name: string) => PICS[`./kit/${name}.png`];
const size = (name: string) => (SIZES as Record<string, number[]>)[name] ?? [64, 64];
const PX = 32;

const loader = new THREE.TextureLoader();
const tex = new Map<string, THREE.Texture>();
/** A kit picture, nearest-sampled; swatches wrap (mirrored, so their seams meet themselves). */
function kitTex(name: string, wrap = false): THREE.Texture {
  const k = name + (wrap ? '#w' : '');
  let t = tex.get(k);
  if (!t) {
    t = loader.load(pic(name));
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    if (wrap) t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    tex.set(k, t);
  }
  return t;
}
const mats = new Map<string, THREE.Material>();
function mat(name: string, wrap = false, glow = false): THREE.Material {
  const k = name + wrap + glow;
  let m = mats.get(k);
  if (!m) mats.set(k, (m = new THREE.MeshLambertMaterial({ map: kitTex(name, wrap), ...(glow ? { emissive: 0xffffff, emissiveMap: kitTex(name + '-glow'), emissiveIntensity: 1 } : {}), side: THREE.DoubleSide, alphaTest: 0.5 })));
  return m;
}

type Front = 'forge' | 'tavern' | 'chapel' | 'house';
/** Which front and sign a block wears, by what it is. */
function frontOf(b: Block): { front: Front; sign: string | null } {
  const l = (b.label ?? '').toUpperCase();
  if (b.kind === 'forge' || /FORGE|SMITH/.test(l)) return { front: 'forge', sign: 'sign-anvil' };
  if (b.kind === 'tavern' || /RAT|INN|TAVERN/.test(l)) return { front: 'tavern', sign: 'sign-tankard' };
  if (b.kind === 'church' || /CHURCH|CHAPEL/.test(l)) return { front: 'chapel', sign: 'sign-lantern' };
  if (/INFIRM|HEAL|APOTH/.test(l)) return { front: 'house', sign: 'sign-mortar' };
  return { front: 'house', sign: null };
}

/** A flat quad from four corners (counter-clockwise from bottom-left), UVs from u0 to u1 across and 0 to rv up. */
function quad(a: number[], b: number[], c: number[], d: number[], m: THREE.Material, u0 = 0, u1 = 1, rv = 1): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, 0, u1, 0, u1, rv, u0, 0, u1, rv, u0, rv], 2));
  g.computeVertexNormals();
  const q = new THREE.Mesh(g, m);
  q.castShadow = q.receiveShadow = true;
  return q;
}
function tri(a: number[], b: number[], c: number[], uv: number[], m: THREE.Material): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return new THREE.Mesh(g, m);
}

/** The fronts along a block: [picture, width] filling its width, its own front in the middle. */
function rowOf(b: Block, front: Front): { name: string; w: number }[] {
  let n = Math.round(b.x * 7 + b.y * 13) >>> 0;
  const pick = (k: Front) => `facade-${k}-${(n = (Math.imul(n, 1103515245) + 12345) >>> 0) % 4}`;
  const main = pick(front), out = [{ name: main, w: size(main)[0] / PX }];
  // Houses either side, alternately, until the block's width is filled.
  for (let left = true; out.reduce((s, f) => s + f.w, 0) < b.w - 0.6; left = !left) {
    const h = pick('house'), f = { name: h, w: size(h)[0] / PX };
    if (left) out.unshift(f);
    else out.push(f);
  }
  // Squeezed or stretched a little so the row is exactly the block's width.
  const k = b.w / out.reduce((s, f) => s + f.w, 0);
  return out.map((f) => ({ ...f, w: f.w * k }));
}

/** Build a roofed block from the kit into `group`; returns its roofs (lifted off when you're behind) and height. */
export function kitBlock(b: Block, group: THREE.Group): { roof: THREE.Group; top: number } {
  const z0 = b.y, z1 = b.y + b.h, d = z1 - z0, roof = new THREE.Group(), { front, sign } = frontOf(b);
  const stone = b.kind === 'church' || b.kind === 'tower' || b.kind === 'forge' || b.kind === 'hall', side = stone ? 'mat-stone' : 'mat-timber';
  let x = b.x, top = 0, signX = b.x + b.w / 2;
  rowOf(b, front).forEach((f, i, row) => {
    const H = size(f.name)[1] / PX, eave = H * 0.58, xr = x + f.w, xc = (x + xr) / 2, flip = i % 2 === 1, sm = mat(side, true);
    top = Math.max(top, H);
    // The front picture, mirrored on every other house so a row doesn't repeat itself.
    group.add(quad([x, 0, z1], [xr, 0, z1], [xr, H, z1], [x, H, z1], mat(f.name, false, true), flip ? 1 : 0, flip ? 0 : 1));
    // The row's two ends and every house's back, up to the eave.
    if (i === 0) group.add(quad([x, 0, z0], [x, 0, z1], [x, eave, z1], [x, eave, z0], sm, 0, d / 2, eave / 2));
    if (i === row.length - 1) group.add(quad([xr, 0, z1], [xr, 0, z0], [xr, eave, z0], [xr, eave, z1], sm, 0, d / 2, eave / 2));
    group.add(quad([xr, 0, z0], [x, 0, z0], [x, eave, z0], [xr, eave, z0], sm, 0, f.w / 2, eave / 2));
    // Its roof: a ridge running back from the street, slate down both sides to the eaves, the back gable filled.
    const rm = mat('mat-slate', true), slope = Math.hypot(f.w / 2, H - eave), ov = 0.12;
    roof.add(quad([x - ov, eave - 0.1, z1 - 0.02], [x - ov, eave - 0.1, z0 - ov], [xc, H - 0.15, z0 - ov], [xc, H - 0.15, z1 - 0.02], rm, 0, (d + ov) / 2, slope / 2));
    roof.add(quad([xr + ov, eave - 0.1, z0 - ov], [xr + ov, eave - 0.1, z1 - 0.02], [xc, H - 0.15, z1 - 0.02], [xc, H - 0.15, z0 - ov], rm, 0, (d + ov) / 2, slope / 2));
    roof.add(tri([x, eave, z0], [xr, eave, z0], [xc, H - 0.15, z0], [0, 0, f.w / 2, 0, f.w / 4, (H - eave) / 2], sm));
    if (f.name.startsWith(`facade-${front}`) && front !== 'house') signX = xr - 0.2;
    x = xr;
  });
  group.add(roof);
  // The guild sign on its bracket, out from the front by the door, facing the street.
  if (sign && b.door) {
    const [sw, sh] = size(sign), w = sw / PX, h = sh / PX, sy = 2.6;
    group.add(quad([signX - w * 0.1, sy, z1 + 0.5], [signX + w * 0.9, sy, z1 + 0.5], [signX + w * 0.9, sy + h, z1 + 0.5], [signX - w * 0.1, sy + h, z1 + 0.5], mat(sign)));
  }
  return { roof, top };
}

/** The floor laid with the cobble swatch, a copy every 1.2 tiles (`?street`), so cobbles sit small beside the people. */
export function streetFloor(m: THREE.MeshLambertMaterial, w: number, h: number): void {
  const t = kitTex('mat-cobble', true).clone();
  t.needsUpdate = true;
  t.repeat.set(w / 1.2, h / 1.2);
  m.map = t;
}

/** Render pixels a tile on the test street: about 40 tiles across a laptop, 20 across an upright phone. */
export const streetPpu = (W: number, H: number) => Math.max(24, W / (H > W ? 20 : 40));

/** Where your hero is on the render (x, y from the bottom) and the see-through hole's radius, in render pixels. */
export const HOLE = { value: new THREE.Vector3(-1e4, -1e4, 0) };

const ghosts = new WeakMap<THREE.Material, THREE.Material>();
/** A material's see-through twin: a soft round hole round your hero, its edge dithered (no blending, no sorting). */
function ghostOf(m: THREE.Material): THREE.Material {
  let g = ghosts.get(m);
  if (!g) {
    g = m.clone();
    g.onBeforeCompile = (sh) => {
      sh.uniforms.uHole = HOLE;
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', `uniform vec3 uHole;
float gb(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
void main() {
  float hk = length((gl_FragCoord.xy - uHole.xy) * vec2(1.0, 0.8)) / max(uHole.z, 1.0);
  if (hk < 1.0 && gb(gl_FragCoord.xy) * 0.25 + gb(gl_FragCoord.xy * 0.5) > smoothstep(0.6, 1.0, hk) * 1.25) discard;`);
    };
    g.customProgramCacheKey = () => 'kitghost';
    ghosts.set(m, g);
  }
  return g;
}
const own = new WeakMap<THREE.Mesh, THREE.Material>();
/** A kit building with the hole round your hero while you're behind it (in place of the roof lifting off), or whole. */
export function ghostKit(group: THREE.Group, on: boolean): void {
  group.traverse((o) => {
    const q = o as THREE.Mesh;
    if (!q.isMesh) return;
    if (!own.has(q)) own.set(q, q.material as THREE.Material);
    const m = own.get(q)!;
    q.material = on ? ghostOf(m) : m;
  });
}
