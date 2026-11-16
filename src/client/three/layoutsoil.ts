/**
 * Dirt and mud on the new town's street floor (docs/design/town-layout.md; Kyle, 2026-11-15: the Drowned Rat's end
 * of town mud and dirt). The street floor is one cobble picture everywhere (streetkit.ts), so the plan's soil
 * (layoutplan.ts SOIL: earth, mud, grass) is painted here as pixel art, 32 to a tile like the kit, ragged and
 * dithered at its edges, and laid over the floor in its shader by the floor's own UVs, so it runs on up the raised
 * levels' tops too (layoutledges.ts). Drawing only.
 */
import * as THREE from 'three';
import type { GameMap } from '../../shared/arena';

const PPT = 32;
const SHADES: Record<string, number[][]> = {
  earth: [[74, 58, 44], [86, 68, 51], [64, 50, 38], [104, 90, 74]],
  mud: [[52, 40, 32], [60, 47, 37], [44, 34, 28], [40, 42, 50]],
  grass: [[52, 64, 40], [62, 76, 46], [70, 58, 44], [80, 92, 56]],
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Smooth value noise, seeded by position: 0..1. */
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** The soil as a picture the size of the map, its rows from the south (the floor's v): colour where there's soil,
 *  clear where the cobbles show. */
export function soilPicture(m: GameMap): Uint8Array<ArrayBuffer> | null {
  const soil = (m.soil ?? []).filter((s) => SHADES[s.mat]);
  if (!soil.length) return null;
  const W = m.w * PPT, H = m.h * PPT, px = new Uint8Array(new ArrayBuffer(W * H * 4));
  for (const s of soil) {
    const pal = SHADES[s.mat], pad = 0.7, x0 = Math.max(0, Math.floor((s.x - pad) * PPT)), x1 = Math.min(W, Math.ceil((s.x + s.w + pad) * PPT));
    const y0 = Math.max(0, Math.floor((s.y - pad) * PPT)), y1 = Math.min(H, Math.ceil((s.y + s.h + pad) * PPT));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const tx = x / PPT, ty = y / PPT;
      // How far inside the patch (tiles), its edge eaten ragged by noise; dithered where it thins out.
      const inside = Math.min(tx - s.x, s.x + s.w - tx, ty - s.y, s.y + s.h - ty) + (noise(tx * 0.9, ty * 0.9) - 0.5) * 1.1 + (noise(tx * 3, ty * 3) - 0.5) * 0.35;
      const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      if (inside < 0 || (inside < 0.3 && inside / 0.3 < th)) continue;
      // Shade: broad blotches, a finer grain, stones or puddles (the fourth shade) here and there.
      const n = noise(tx * 0.7 + 9, ty * 0.7) * 0.6 + noise(tx * 4, ty * 4) * 0.4 + (th - 0.5) * 0.25;
      const fleck = noise(tx * 6 + 3, ty * 6 + 7) > (s.mat === 'mud' ? 0.8 : 0.86);
      const c = fleck ? pal[3] : n < 0.4 ? pal[2] : n < 0.62 ? pal[0] : pal[1], i = ((H - 1 - y) * W + x) * 4;
      (px[i] = c[0]), (px[i + 1] = c[1]), (px[i + 2] = c[2]), (px[i + 3] = 255);
    }
  }
  return px;
}

/** Lay the soil over a street floor material (after any water cut on it, so their shaders chain). */
export function soilOver(floor: THREE.MeshLambertMaterial, m: GameMap): void {
  const px = soilPicture(m);
  if (!px) return;
  const tex = new THREE.DataTexture(px, m.w * PPT, m.h * PPT, THREE.RGBAFormat);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const before = floor.onBeforeCompile.bind(floor), key = floor.customProgramCacheKey.bind(floor);
  floor.onBeforeCompile = (sh, r) => {
    before(sh, r);
    sh.uniforms.uSoil = { value: tex };
    sh.uniforms.uSoilRep = { value: floor.map?.repeat ?? new THREE.Vector2(1, 1) };
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform sampler2D uSoil; uniform vec2 uSoilRep;\nvoid main() {')
      .replace('#include <map_fragment>', '#include <map_fragment>\n{ vec4 sl = texture2D(uSoil, vMapUv / uSoilRep); diffuseColor.rgb = mix(diffuseColor.rgb, sl.rgb, sl.a); }');
  };
  floor.customProgramCacheKey = () => key() + '+soil';
  floor.needsUpdate = true;
}
