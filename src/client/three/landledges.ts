/**
 * Land's heights in 2.5D (docs/design/elevation.md, "You can always read it"): a map whose ledges are earth
 * (shared/terrkit.ts) is drawn as ground, not masonry. Each level's top is the floor's own painting at its height, a
 * step lighter and warmer than the one below; each slope is the painted ground running up the bank, shaded and combed
 * downhill; each face is an earth bank with a lit turf lip, a dark foot and a soft shadow on the ground below it.
 * Drawing only: shared/arena.ts decides who stands where; shared/heights.ts gives the eye its smooth height.
 */
import * as THREE from 'three';
import { FACE_FOOT, inArea, type Area, type GameMap, type Ledge } from '../../shared/arena';
import { groundLv, runOf, upRamp } from '../../shared/heights';
import { Boxes, Seed, jit } from './boxes';
import { VCOL } from './mats';
import { graded } from '../darkgold';

type V = [number, number, number];
type C = [number, number, number];
const rgb = (h: number): C => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const mul = (c: C, f: number): C => [c[0] * f, c[1] * f, c[2] * f];
const ONE: C = [1, 1, 1];

// The bank's earth, stones and turf, through the world's grade (../darkgold.ts).
const EARTH = graded(0x6e5a44, 'floor'), FOOT = graded(0x2a2119, 'floor'), STONE = graded(0x5e5a56, 'wall'), CORE = 0x1c1915;
const TURF = graded(0x34421f, 'floor'), LIT = graded(0x56683a, 'floor'), STRAW = graded(0x7a6c40, 'floor');
// Steps: the trodden tread, the log risers, the pale cut top of a post. A ramp this narrow or narrower is steps
// (a way up a raised area, a flight across a lane); a wider one is a grass slope.
const TROD = graded(0x5a4a36, 'floor'), LOG = graded(0x4a3824, 'wall'), LOG2 = graded(0x3a2c1c, 'wall'), POST_CAP = graded(0xa89468, 'wall'), STEPS_MAX = 6;
/** How far a face's foot leans out from its top (the rules' own number: a body stops there), so a bank seen side-on still shows; its shadow's reach. */
const BAT = FACE_FOOT, SHADOW = 1.8;

/** Triangles with colours (VCOL, the shade) or the floor's UVs (the ground). */
class Tris {
  pos: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  constructor(private m?: GameMap) {}
  /** A quad (corners in order round it), turned to face `f`. */
  quad(p: V[], c: C[] | null, f: V): void {
    const [a, b, d] = p, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const i of n[0] * f[0] + n[1] * f[1] + n[2] * f[2] < 0 ? [0, 3, 2, 0, 2, 1] : [0, 1, 2, 0, 2, 3]) {
      this.pos.push(...p[i]);
      if (c) this.col.push(...c[i]);
      if (this.m) this.uv.push(p[i][0] / this.m.w, 1 - p[i][2] / this.m.h);
    }
  }
  /** A flat rectangle at height `y`, all one colour (or the floor's UVs). */
  flat(x: number, z: number, w: number, d: number, y: number, c: C | null): void {
    this.quad([[x, y, z + d], [x + w, y, z + d], [x + w, y, z], [x, y, z]], c && [c, c, c, c], UP);
  }
  mesh(mat: THREE.Material): THREE.Mesh | null {
    if (!this.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    if (this.col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    if (this.uv.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeVertexNormals();
    const q = new THREE.Mesh(g, mat);
    q.receiveShadow = true;
    return q;
  }
}
const UP: V = [0, 1, 0];

/** Multiplies what is under it by its colour: the levels' light, a slope's shade, a face's shadow. Unlit, so the
 *  hour's light still does the rest. */
const SHADE = new THREE.MeshBasicMaterial({
  vertexColors: true, transparent: true, depthWrite: false, fog: false, toneMapped: false,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
});

/** A ledge's top less every ramp on the map: the slopes take those (cut on the ramps' lines). */
function cells(l: Ledge, ramps: Area[]): Area[] {
  const cut = (a0: number, a1: number, ks: number[]) => [...new Set([a0, a1, ...ks.filter((k) => k > a0 && k < a1)])].sort((p, q) => p - q);
  const xs = cut(l.x, l.x + l.w, ramps.flatMap((q) => [q.x, q.x + q.w])), ys = cut(l.y, l.y + l.h, ramps.flatMap((q) => [q.y, q.y + q.h]));
  const out: Area[] = [];
  for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < ys.length; j++) {
    const c = { x: xs[i], y: ys[j], w: xs[i + 1] - xs[i], h: ys[j + 1] - ys[j] };
    if (!ramps.some((q) => inArea(q, c.x + c.w / 2, c.y + c.h / 2))) out.push(c);
  }
  return out;
}

/** Every level of a land map: tops, slopes, faces. Tops and slopes go in `group`, earth and stones in `B`. */
export function landLedges(B: Boxes, group: THREE.Group, m: GameMap, floor: THREE.Material, H: number): void {
  const r = new Seed(m.w * 17 + m.h * 5), ground = new Tris(m), earth = new Tris(), shade = new Tris();
  const ledges = m.ledges ?? [], ramps = ledges.flatMap((l) => l.ramps), most = Math.max(0, ...ledges.map((l) => l.lv ?? 1));
  // Higher is lighter and warmer, lower darker and cooler: a step a level.
  const tint = (lv: number): C => { const k = most - lv; return [0.89 ** k, 0.915 ** k, 0.975 ** k]; };
  shade.flat(0, 0, m.w, m.h, 0.002, tint(0));
  for (const l of ledges) {
    const lv = l.lv ?? 1, h = lv * H;
    for (const c of cells(l, ramps)) {
      B.b(c.x + c.w / 2, 0, c.y + c.h / 2, c.w - 0.02, h - 0.02, c.h - 0.02, CORE);
      ground.flat(c.x, c.y, c.w, c.h, h, null);
      shade.flat(c.x, c.y, c.w, c.h, h + 0.002, tint(lv));
    }
    for (const q of l.ramps) slope(q, runOf(m, l, q));
    for (const [ax, c, out, a0, a1] of [['x', l.y + l.h, 1, l.x, l.x + l.w], ['x', l.y, -1, l.x, l.x + l.w], ['z', l.x, -1, l.y, l.y + l.h], ['z', l.x + l.w, 1, l.y, l.y + l.h]] as const) face(l, ax, c, out, a0, a1);
  }
  for (const [t, mat, order] of [[ground, floor, 0], [earth, VCOL, 0], [shade, SHADE, -10]] as const) {
    const q = t.mesh(mat);
    if (q) (q.renderOrder = order), group.add(q);
  }

  /** A ramp as a real slope of the floor's own ground, shaded, combed downhill, closed at its ends. */
  function slope(q: Area, run: ReturnType<typeof runOf>): void {
    // A point on it from `s` (0..1 along its edge) and `t` (0 at its foot, 1 at its brow), and its height there.
    const at = (s: number, t: number, lift = 0): V => {
      const f = run.hiFirst ? 1 - t : t, y = (run.lo + (run.hi - run.lo) * t) * H + lift;
      return run.alongY ? [q.x + s * q.w, y, q.y + f * q.h] : [q.x + f * q.w, y, q.y + s * q.h];
    };
    const corners = (lift: number) => [at(0, 0, lift), at(1, 0, lift), at(1, 1, lift), at(0, 1, lift)];
    ground.quad(corners(0), null, UP);
    // A narrow way up a raised area (elevation.md, "Raised areas") is steps, not a grass slope: trodden earth, a
    // log riser to each step, a post either side of its foot. It has to be seen from across the field.
    if ((run.alongY ? q.w : q.h) <= STEPS_MAX) return void steps(q, run, at, corners);
    // Darker than the flat above and below it, darkest at its foot.
    const foot = mul(tint(run.lo), 0.62), brow = mul(tint(run.hi), 0.84);
    shade.quad(corners(0.002), [foot, foot, brow, brow], UP);
    // Closed at each end, down to the ground (hidden where what's beside it is higher).
    for (const s of [0, 1]) {
      const a = at(s, 0), b = at(s, 1), lo = (p: V): V => [p[0], 0, p[2]], f: V = run.alongY ? [s ? 1 : -1, 0, 0] : [0, 0, s ? 1 : -1];
      earth.quad([lo(a), a, b, lo(b)], [rgb(FOOT), rgb(EARTH), rgb(EARTH), rgb(FOOT)], f);
      // Where it cuts into higher ground (a track up a bank), that ground's cheek, earth from the slope up to it.
      const past = (p: V): V => { const x = p[0] + f[0] * 0.03, z = p[2] + f[2] * 0.03; return [p[0], Math.max(p[1], groundLv(m, x, z) * H), p[2]]; };
      const pa = past(a), pb = past(b);
      if (pa[1] - a[1] > 0.02 || pb[1] - b[1] > 0.02) earth.quad([a, pa, pb, b], [rgb(FOOT), rgb(EARTH), rgb(EARTH), rgb(FOOT)], [-f[0], 0, -f[2]]);
    }
    // Combed: strokes lying on it pointing downhill, more toward the brow; a few tufts standing along the brow.
    const len = run.alongY ? q.w : q.h, deep = run.alongY ? q.h : q.w;
    for (let i = Math.round(len * deep * 5); i > 0; i--) {
      const s = r.next(), t1 = 1 - r.next() ** 1.3 * 0.95, t0 = Math.max(0, t1 - (0.25 + r.next() * 0.3) / deep), w = 0.035 / len;
      const top = rgb(jit(r.next() < 0.25 ? STRAW : LIT, 0.1, r)), low = rgb(jit(TURF, 0.1, r));
      earth.quad([at(s - w, t0, 0.012), at(s + w, t0, 0.012), at(s + w, t1, 0.012), at(s - w, t1, 0.012)], [low, low, top, top], UP);
    }
    // A verge of turf along the brow, catching the light, broken here and there.
    for (let s = 0, k = 0.3 / len; s < 1 - 1e-6; s += k) if (r.next() < 0.8) {
      const c = rgb(jit(LIT, 0.1, r)), t0 = 0.9 - r.next() * 0.05;
      earth.quad([at(s, t0, 0.014), at(Math.min(1, s + k), t0, 0.014), at(Math.min(1, s + k), 1, 0.014), at(s, 1, 0.014)], [c, c, c, c], UP);
    }
    for (let i = Math.round(len * 1.2); i > 0; i--) {
      const p = at(r.next(), 0.88 + r.next() * 0.1);
      B.b(p[0], p[1] - 0.02, p[2], 0.07, 0.1 + r.next() * 0.08, 0.07, jit(LIT, 0.15, r), r.next() * 3);
    }
  }

  /** Steps up a narrow ramp: the tread trodden to bare earth, logs across it, its sides closed, posts at its foot. */
  function steps(q: Area, run: ReturnType<typeof runOf>, at: (s: number, t: number, lift?: number) => V, corners: (lift: number) => V[]): void {
    const tread = rgb(TROD), low = mul(rgb(TROD), 0.7), wide = run.alongY ? q.w : q.h, deep = run.alongY ? q.h : q.w;
    earth.quad(corners(0.01), [low, low, tread, tread], UP);
    for (const s of [0, 1]) {
      const a = at(s, 0), b = at(s, 1), lo = (p: V): V => [p[0], 0, p[2]], f: V = run.alongY ? [s ? 1 : -1, 0, 0] : [0, 0, s ? 1 : -1];
      earth.quad([lo(a), a, b, lo(b)], [rgb(FOOT), rgb(EARTH), rgb(EARTH), rgb(FOOT)], f);
      const past = (p: V): V => { const x = p[0] + f[0] * 0.03, z = p[2] + f[2] * 0.03; return [p[0], Math.max(p[1], groundLv(m, x, z) * H), p[2]]; };
      const pa = past(a), pb = past(b);
      if (pa[1] - a[1] > 0.02 || pb[1] - b[1] > 0.02) earth.quad([a, pa, pb, b], [rgb(FOOT), rgb(EARTH), rgb(EARTH), rgb(FOOT)], [-f[0], 0, -f[2]]);
    }
    const n = Math.max(3, Math.round(deep / 0.42));
    for (let i = 0; i < n; i++) {
      const p = at(0.5, (i + 0.5) / n), c = jit(i % 2 ? LOG : LOG2, 0.06, r);
      B.b(p[0], p[1] - 0.05, p[2], run.alongY ? wide * 0.98 : 0.17, 0.15, run.alongY ? 0.17 : wide * 0.98, c);
    }
    for (const s of [-0.06, 1.06]) {
      const p = at(s, 0);
      B.b(p[0], p[1], p[2], 0.2, 1.05, 0.2, jit(LOG2, 0.08, r)), B.b(p[0], p[1] + 1.05, p[2], 0.26, 0.08, 0.26, POST_CAP);
    }
  }

  /** An earth bank along one edge wherever the ground beside it is lower (its own ramps included, so a face tapers
   *  down to meet a slope's end): leaning, a turf lip on top, stones in it, a dark foot, a shadow below. */
  function face(l: Ledge, ax: 'x' | 'z', c: number, out: 1 | -1, a0: number, a1: number): void {
    const S = 0.25, pt = (s: number, o: number): [number, number] => (ax === 'x' ? [s, c + o] : [c + o, s]);
    const P = (s: number, y: number, o: number): V => { const [x, z] = pt(s, o); return [x, y, z]; };
    const own = (s: number) => { const [x, z] = pt(s, -out * 0.03); return (x > l.x && x < l.x + l.w && z > l.y && z < l.y + l.h) || l.ramps.some((q) => inArea(q, x, z)); };
    const inMap = (s: number) => { const [x, z] = pt(s, out * 0.03); return x > 0 && z > 0 && x < m.w && z < m.h; };
    const hi = (s: number) => groundLv(m, ...pt(s, -out * 0.03)), lo = (s: number) => groundLv(m, ...pt(s, out * 0.03));
    const facing: V = ax === 'x' ? [0, 0, out] : [out, 0, 0];
    for (let a = a0 - 1.25; a < a1 + 1.25 - 1e-6; a += S) {
      const b = a + S, mid = a + S / 2;
      if (!own(mid) || !inMap(mid) || hi(mid) - lo(mid) < 0.08) continue;
      const ta = Math.max(hi(a), lo(a)) * H, tb = Math.max(hi(b), lo(b)) * H, fa = lo(a) * H, fb = lo(b) * H, tall = hi(mid) - lo(mid);
      // The bank itself, lit earth at the top going dark at the foot.
      earth.quad([P(a, ta, 0), P(b, tb, 0), P(b, fb, out * BAT), P(a, fa, out * BAT)], [rgb(jit(EARTH, 0.06, r)), rgb(jit(EARTH, 0.06, r)), rgb(FOOT), rgb(FOOT)], facing);
      // The dark foot on the ground, and the shadow it casts there (pure darkening: the level's light is already on it).
      earth.quad([P(a, fa + 0.006, out * BAT), P(b, fb + 0.006, out * BAT), P(b, fb + 0.006, out * (BAT + 0.12)), P(a, fa + 0.006, out * (BAT + 0.12))], Array(4).fill(mul(rgb(FOOT), 0.85)), UP);
      const dark: C = mul(ONE, 1 - 0.55 * Math.min(1, tall));
      shade.quad([P(a, fa + 0.004, out * BAT), P(b, fb + 0.004, out * BAT), P(b, fb + 0.004, out * (BAT + SHADOW)), P(a, fa + 0.004, out * (BAT + SHADOW))], [dark, dark, ONE, ONE], UP);
      // Stones in the earth, and the turf lip along the top catching the light, a tuft hanging over.
      const sh = (ta + tb) / 2, sf = (fa + fb) / 2;
      if (r.next() < 0.35 && tall > 0.3) {
        const k = 0.2 + r.next() * 0.65, [x, z] = pt(mid + (r.next() - 0.5) * 0.15, out * (BAT * k + 0.03));
        B.c(x, sh - k * (sh - sf), z, 0.1 + r.next() * 0.12, 0.07 + r.next() * 0.06, 0.1 + r.next() * 0.08, jit(STONE, 0.14, r), r.next() * 3);
      }
      if (tall > 0.2) {
        const [x, z] = pt(mid, out * 0.05);
        const lw = 0.16 + r.next() * 0.14, lh = 0.08 + r.next() * 0.06;
        B.b(x, sh - lh + 0.03, z, ax === 'x' ? S + 0.02 : lw, lh, ax === 'x' ? lw : S + 0.02, jit(r.next() < 0.7 ? LIT : TURF, 0.12, r));
        if (r.next() < 0.35) { const [hx, hz] = pt(mid, out * 0.16); B.b(hx, sh - 0.2, hz, 0.06, 0.15, 0.06, jit(TURF, 0.15, r)); }
      }
    }
  }
}
