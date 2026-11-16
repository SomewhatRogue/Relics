/**
 * The new look's sky and what lies past the town walls (`?hd&street`, docs/decisions/new-look-buildings.md): the low
 * chase camera sees over the walls, where there was black. A sky graded from the zenith to a hazy horizon, by the
 * hour (the theme's ambient and moon) on a dome; ground running out to it; and two rings of silhouettes standing in the haze,
 * the near one roofs, chimneys, spires and trees with a few lit windows at night, the far one hills. Painted once,
 * coloured by the hour. Drawing only.
 */
import * as THREE from 'three';
import { gorgeSpan } from './layoutledges';
import type { GameMap, Theme } from '../../shared/arena';

type C3 = [number, number, number];
const mix = (a: C3, b: C3, t: number): C3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** How light the hour is, 0 deep night to 1 noon, from the theme's ambient and moon. */
function daylight(t: Theme): number {
  const a = t.ambient, lum = (a[0] + a[1] + a[2]) / 3;
  return t.day ? 1 : Math.max(0, Math.min(1, (lum - 0.12) / 0.55));
}

/** A strip of skyline: roofs, chimneys, the odd spire, trees between; white on clear, windows on their own canvas. */
function skyline(seed: number, hills: boolean): [HTMLCanvasElement, HTMLCanvasElement] {
  const W = 2048, H = 256, c = document.createElement('canvas'), w = document.createElement('canvas');
  c.width = w.width = W, c.height = w.height = H;
  const g = c.getContext('2d')!, gw = w.getContext('2d')!;
  let n = seed;
  const rnd = () => ((n = (Math.imul(n, 1103515245) + 12345) >>> 0) / 4294967296);
  g.fillStyle = '#fff';
  gw.fillStyle = '#fff';
  if (hills) {
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, H * (0.35 + 0.18 * Math.sin(x / 210 + seed) + 0.1 * Math.sin(x / 67 + seed * 2)));
    g.lineTo(W, H);
    g.fill();
    return [c, w];
  }
  for (let x = 0; x < W;) {
    if (rnd() < 0.22) {
      // Trees: a clump of round crowns.
      for (let i = 0; i < 3; i++) g.beginPath(), g.arc(x + 10 + i * 12, H * (0.62 + rnd() * 0.08), 12 + rnd() * 6, 0, Math.PI * 2), g.fill();
      g.fillRect(x, H * 0.7, 46, H * 0.3);
      x += 44;
      continue;
    }
    const bw = 26 + rnd() * 34, top = H * (0.48 + rnd() * 0.2), eave = top + bw * 0.55;
    g.beginPath();
    g.moveTo(x, H), g.lineTo(x, eave), g.lineTo(x + bw / 2, top), g.lineTo(x + bw, eave), g.lineTo(x + bw, H);
    g.fill();
    if (rnd() < 0.5) g.fillRect(x + bw * (0.2 + rnd() * 0.5), top - 8 + bw * 0.25, 5, 14);
    // Now and then a spire or a tower over the roofs.
    if (rnd() < 0.08) {
      const sx = x + bw / 2, sh = H * (0.25 + rnd() * 0.15);
      g.fillRect(sx - 7, top - sh * 0.4, 14, sh * 0.5);
      g.beginPath(), g.moveTo(sx - 9, top - sh * 0.4), g.lineTo(sx, top - sh), g.lineTo(sx + 9, top - sh * 0.4), g.fill();
    }
    for (let i = 0; i < 2; i++) if (rnd() < 0.45) gw.fillRect(Math.round(x + 5 + rnd() * (bw - 12)), Math.round(eave + 6 + rnd() * (H - eave - 20)), 3, 4);
    x += bw - 4 + rnd() * 6;
  }
  return [c, w];
}

/** The strip of land left open for a gorge (z from, to). */
const GAP = { value: new THREE.Vector2(1e6, 1e6) };
/** The town's own ground (x, z to x, z): the land past the walls stops at it, so nothing below the floor (the
 * millpond, a gorge) is covered over. */
const TOWN = { value: new THREE.Vector4(0, 0, 0, 0) };

/** Only the side of a ring beyond the town's middle (as the camera sees it): the camera backs off outside the ring. */
const MID = { value: new THREE.Vector3() };
function farSide(m: THREE.MeshBasicMaterial): THREE.MeshBasicMaterial {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uMid = MID;
    sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying vec3 vW;\nuniform vec3 uMid;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if (distance(vW.xz, cameraPosition.xz) < distance(uMid.xz, cameraPosition.xz)) discard;');
  };
  m.customProgramCacheKey = () => 'streetring';
  return m;
}

function ring(r: number, h: number, y0: number, tex: THREE.Texture, mat: THREE.MeshBasicMaterial, reps: number): THREE.Mesh {
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(reps, 1);
  tex.magFilter = THREE.NearestFilter;
  mat.map = tex;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 96, 1, true), mat);
  m.position.y = y0 + h / 2;
  return m;
}

export class StreetSky {
  readonly group = new THREE.Group();
  private near = farSide(new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, fog: false }));
  private far = farSide(new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, fog: false }));
  private lit = farSide(new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, fog: false }));
  /** The land past the walls, coloured by distance: earth at the walls, haze far out (the camera looks down on it). */
  private land = new THREE.Mesh(new THREE.RingGeometry(0.5, 420, 64, 40), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  private R = 30;
  /** The sky: a dome round the town, coloured by height (drawn in the first pass only: it's on layer 0). */
  private dome = new THREE.Mesh(new THREE.SphereGeometry(380, 24, 16), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  private key = '';

  constructor() {
    // (Open where a gorge runs past the town's south edge, the new town's: three/layoutledges.ts.)
    const lm = this.land.material as THREE.MeshBasicMaterial;
    lm.onBeforeCompile = (sh) => {
      sh.uniforms.uGap = GAP;
      sh.uniforms.uTown = TOWN;
      sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vW;\nuniform vec2 uGap;\nuniform vec4 uTown;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n  if (vW.z > uGap.x && vW.z < uGap.y) discard;\n  if (vW.x > uTown.x && vW.x < uTown.z && vW.z > uTown.y && vW.z < uTown.w) discard;');
    };
    lm.customProgramCacheKey = () => 'streetland';
    const g = this.dome.geometry;
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
    this.dome.renderOrder = -10;
    const lg = this.land.geometry;
    lg.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(lg.attributes.position.count * 3), 3));
    this.land.rotation.x = -Math.PI / 2;
  }

  /** Lay out the ground and the rings round a map (only the town gets them; a job keeps its own edges). */
  build(map: GameMap): void {
    this.group.clear();
    if (map.name !== 'WICKHOLD') return;
    const cx = map.w / 2, cz = map.h / 2, R = Math.max(map.w, map.h) * 0.5;
    this.R = R;
    this.land.position.set(cx, -0.08, cz);
    const gap = gorgeSpan(map);
    GAP.value.set(gap ? gap[0] : 1e6, gap ? gap[1] : 1e6);
    TOWN.value.set(0.5, 0.5, map.w - 0.5, map.h - 0.5);
    this.key = '';
    const [town, lights] = skyline(7, false), [hills] = skyline(3, true);
    this.dome.position.set(cx, 0, cz);
    MID.value.set(cx, 0, cz);
    const near = ring(R + 10, 13, -0.5, new THREE.CanvasTexture(town), this.near, 3);
    const win = ring(R + 9.8, 13, -0.5, new THREE.CanvasTexture(lights), this.lit, 3);
    const far = ring(R + 55, 40, -2, new THREE.CanvasTexture(hills), this.far, 2);
    for (const o of [near, win, far]) o.position.x = cx, o.position.z = cz;
    this.group.add(this.dome, this.land, far, near, win);
  }

  /** Colour the sky, the haze, the rings and the ground by the hour. */
  update(theme: Theme): void {
    const d = daylight(theme), moon = theme.moon ?? 0, key = `${d.toFixed(2)}:${moon.toFixed(2)}`;
    if (key === this.key) return;
    this.key = key;
    const top = mix([0.05, 0.07, 0.15], [0.36, 0.48, 0.64], d), haze = mix([0.26, 0.33, 0.48], [0.74, 0.76, 0.76], d);
    // (Colours go in as they are: the 2.5D view's pipeline doesn't convert them.)
    const lin = (c: C3) => new THREE.Color().setRGB(...c);
    // The dome: haze at the horizon and below, the zenith colour from about 40 degrees up.
    const pos = this.dome.geometry.attributes.position, col = this.dome.geometry.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const up = Math.max(0, pos.getY(i) / 380), c = lin(mix(haze, top, Math.min(1, Math.pow(up / 0.65, 0.8))));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    // Nearer things darker, further ones lost in the haze; the ground fading from earth to haze.
    this.near.color.copy(lin(mix([0.025, 0.03, 0.045], haze, 0.08 + d * 0.3)));
    this.far.color.copy(lin(mix([0.025, 0.03, 0.045], haze, 0.45)));
    // The land: earth to the near ring, then thinning into the haze.
    const earth = mix([0.05, 0.055, 0.065], [0.24, 0.24, 0.2], d), lp = this.land.geometry.attributes.position, lc = this.land.geometry.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < lp.count; i++) {
      const r = Math.hypot(lp.getX(i), lp.getY(i)), t = Math.min(1, Math.max(0, (r - this.R - 12) / 60)), c = lin(mix(earth, haze, Math.pow(t, 0.55)));
      lc.setXYZ(i, c.r, c.g, c.b);
    }
    lc.needsUpdate = true;
    // Lit windows only after dark.
    this.lit.color.setRGB(1, 0.55, 0.22).multiplyScalar(Math.max(0, 1 - d * 1.6)).lerp(this.near.color, Math.min(1, d * 1.6));
  }
}
