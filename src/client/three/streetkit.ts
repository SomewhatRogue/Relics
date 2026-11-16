/**
 * The new look, slice 0b (docs/design/new-look.md): the generated kit (scripts/kitprep.py, pictures in ./kit) behind
 * `?street` (with `?hd`): its textures and materials (lit windows glowing in their own colours), the cobbled floor,
 * the street's density, and the see-through hole round your hero. What a block's row is: streetrow.ts; building it:
 * streetbuild.ts. Drawing only: footprints, doors and collision are the room's, unchanged.
 */
import * as THREE from 'three';
import { HD } from './hdlook';

/** Whether this screen builds the town from the kit (`?street`, under `?hd`). */
export const STREET = HD && typeof location !== 'undefined' && new URLSearchParams(location.search).has('street');

const PICS = import.meta.glob('./kit/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const pic = (name: string) => PICS[`./kit/${name}.png`];

const loader = new THREE.TextureLoader();
const tex = new Map<string, THREE.Texture>();
/** A kit picture, nearest-sampled; swatches wrap (mirrored, so their seams meet themselves). */
export function kitTex(name: string, wrap = false): THREE.Texture {
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
export function mat(name: string, wrap = false, glow = false): THREE.Material {
  const k = name + wrap + glow;
  let m = mats.get(k);
  if (!m) mats.set(k, (m = new THREE.MeshLambertMaterial({ map: kitTex(name, wrap), ...(glow ? { emissive: 0xffffff, emissiveMap: kitTex(name + '-glow'), emissiveIntensity: 1 } : {}), side: THREE.DoubleSide, alphaTest: 0.5 })));
  return m;
}

/** A flat quad from four corners (counter-clockwise from bottom-left), UVs from u0 to u1 across and v0 to rv up. */
export function quad(a: number[], b: number[], c: number[], d: number[], m: THREE.Material, u0 = 0, u1 = 1, rv = 1, v0 = 0): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, rv, u0, v0, u1, rv, u0, rv], 2));
  g.computeVertexNormals();
  const q = new THREE.Mesh(g, m);
  q.castShadow = q.receiveShadow = true;
  return q;
}
export function tri(a: number[], b: number[], c: number[], uv: number[], m: THREE.Material): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return new THREE.Mesh(g, m);
}

/** The floor laid with the cobble swatch, a copy every 1.2 tiles (`?street`), so cobbles sit small beside the people.
 *  (`swatch`: another of the kit's floors at its own size, two tiles a copy: the new look's insides, insidekit.ts.) */
export function streetFloor(m: THREE.MeshLambertMaterial, w: number, h: number, swatch?: string): void {
  const t = kitTex(swatch ?? 'mat-cobble', true).clone(), k = swatch ? 2 : 1.2;
  t.needsUpdate = true;
  t.repeat.set(w / k, h / k);
  m.map = t;
}

/**
 * The new look's zoom. The kit and the figures are 32 px a tile, so under `?street` a tile is always 32 render pixels
 * at your hero (one art pixel to one render pixel) and the zoom is how many screen pixels each render pixel takes,
 * always a whole number: a tile is 32, 64, 96 ... screen pixels, never between, so no pixel is drawn wider than its
 * neighbour. Aimed at about `STREET_TILE` CSS pixels a tile: in town closer (Kyle's pick, 4 screen pixels an art
 * pixel on a 3x phone and a retina laptop), on a job as before. `&zoom=N` in the address picks the step outright.
 */
export const STREET_PPU = 32;
const STREET_TILE = { tall: 30, wide: 54 }, TOWN_TILE = { tall: 42, wide: 64 };
const ZOOM_ASK = typeof location !== 'undefined' ? Number(new URLSearchParams(location.search).get('zoom')) || 0 : 0;
export function streetScale(dpr: number, cssW: number, cssH: number, town: boolean): number {
  if (ZOOM_ASK) return Math.max(1, Math.round(ZOOM_ASK));
  const aim = town ? TOWN_TILE : STREET_TILE;
  return Math.max(1, Math.round(((cssH > cssW ? aim.tall : aim.wide) * dpr) / STREET_PPU));
}

/** Where your hero is on the render (x, y from the bottom) and the see-through hole's radius, in render pixels. */
export const HOLE = { value: new THREE.Vector3(-1e4, -1e4, 0) };

/**
 * How a kit building lets you see what's behind it (docs/decisions/new-look-buildings.md): by default your hero shows
 * as a silhouette through it and, when it matters, the whole building fades (`fadeKit`). `&hole=old` brings back the
 * round hole that follows your hero (`ghostKit`), for comparing.
 */
export const OLD_HOLE = typeof location !== 'undefined' && new URLSearchParams(location.search).get('hole') === 'old';

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

/** A building's fade: its own copy of each material, every pixel dithered away past its share (no blending, no sorting). */
const fades = new WeakMap<THREE.Group, { u: { value: number }; mats: Map<THREE.Material, THREE.Material> }>();
const BAY = 'float fb2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }\nfloat fb4(vec2 a){ return fb2(0.5 * a) * 0.25 + fb2(a); }\n';
/** Fade a kit building as one piece: `k` 1 solid (its own materials back), down to 0 gone. */
export function fadeKit(group: THREE.Group, k: number): void {
  let st = fades.get(group);
  if (!st) fades.set(group, (st = { u: { value: 1 }, mats: new Map() }));
  st.u.value = k;
  const solid = k >= 0.999;
  group.traverse((o) => {
    const q = o as THREE.Mesh;
    if (!q.isMesh) return;
    if (!own.has(q)) own.set(q, q.material as THREE.Material);
    const m = own.get(q)!;
    if (solid) return void (q.material = m);
    let f = st!.mats.get(m);
    if (!f) {
      f = m.clone();
      const u = st!.u;
      f.onBeforeCompile = (sh) => {
        sh.uniforms.uFade = u;
        sh.fragmentShader = sh.fragmentShader.replace('void main() {', `uniform float uFade;\n${BAY}void main() {\n  if (fb4(gl_FragCoord.xy) >= uFade) discard;`);
      };
      f.customProgramCacheKey = () => 'kitfade';
      st!.mats.set(m, f);
    }
    q.material = f;
  });
}
