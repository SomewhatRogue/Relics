/**
 * One touch button drawn as pixel art into its own small canvas (shown at --px CSS pixels a pixel):
 * the shape says what kind of button it is (round to strike or cast, a heater shield to guard, a
 * diamond to dodge, a glass orb for the flask), lit from the top left, iron or gilt or dull stone. Over
 * the face: the icon, a cooldown swept in 16 steps, a one-frame flash when it comes ready, a relic's
 * charge, the potion's liquid at your health, and the stamina pips round ATTACK.
 */
export type Shape = 'round' | 'shield' | 'diamond' | 'orb';
export interface Face {
  shape: Shape;
  /** The shape's width in art pixels. */
  size: number;
  grade: 'iron' | 'gilt' | 'stone';
  down?: boolean;
  icon?: CanvasImageSource | null;
  iconScale?: number;
  /** A 1px inner ring in the skill's element colour. */
  ring?: string;
  /** Cooldown still to run, 0 to 1. */
  cd?: number;
  flash?: boolean;
  /** The orb's liquid (0 to 1), its colour, and the low-health pulse frame. */
  fill?: number;
  liquid?: string;
  pulse?: boolean;
  /** A relic's charge along the foot. */
  charge?: number;
  chargeCol?: string;
  /** Stamina pips round the button: how many lit of `of`, and their colour. */
  pips?: { lit: number; of: number; col: string };
}

type Rgb = [number, number, number];
const hex = (h: string): Rgb => { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const GRADES = {
  iron: { out: '#07080a', l1: '#8a95a5', s1: '#22262c', l2: '#4c5460', s2: '#2e333a', face: '#1d2025' },
  gilt: { out: '#1a1004', l1: '#ffd27a', s1: '#8a5c16', l2: '#e0a640', s2: '#6a4812', face: '#2a2114' },
  stone: { out: '#0b0c0f', l1: '#3a3e46', s1: '#15171b', l2: '#26292f', s2: '#1c1e22', face: '#18191d' },
};

function inside(shape: Shape, x: number, y: number, r: number): boolean {
  if (shape === 'round' || shape === 'orb') return x * x + y * y <= r * r + r * 0.6;
  if (shape === 'diamond') return Math.abs(x) + Math.abs(y) <= r && !(Math.abs(x) + Math.abs(y) > r - 2 && (Math.abs(x) < 2 || Math.abs(y) < 2));
  // A heater shield: square shoulders, straight sides, curving in to a point.
  const top = -r * 0.92, mid = r * 0.05;
  if (y < top) return false;
  if (y <= mid) return Math.abs(x) <= r * 0.86 - (y < top + 2 ? 1 : 0);
  const t = (y - mid) / (r - mid);
  return t <= 1 && Math.abs(x) <= r * 0.86 * Math.sqrt(Math.max(0, 1 - t * t));
}

/** Paint face `f` into canvas `c` (sized here: the shape plus room for the pips). */
export function paintButton(c: HTMLCanvasElement, f: Face): void {
  const m = f.pips ? 5 : 0, n = f.size + m * 2;
  if (c.width !== n) (c.width = n), (c.height = n);
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, n, n);
  const r = f.size / 2, cx = n / 2, cy = n / 2;
  const d = new Int8Array(n * n).fill(-1);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= n || y >= n ? -1 : d[y * n + x]);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (inside(f.shape, x + 0.5 - cx, y + 0.5 - cy, r)) d[y * n + x] = 99;
  // Distance in from the edge, by peeling a ring at a time (8 neighbours).
  for (let k = 0; k < 4; k++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (d[y * n + x] !== 99) continue;
    let edge = false;
    for (let j = -1; j <= 1 && !edge; j++) for (let i = -1; i <= 1; i++) { const v = at(x + i, y + j); if (v === -1 || (v < k && v >= 0)) { edge = true; break; } }
    if (edge) d[y * n + x] = k;
  }
  const G = f.down ? { ...GRADES[f.grade], l1: GRADES[f.grade].s1, s1: GRADES[f.grade].l1, l2: GRADES[f.grade].s2, s2: GRADES[f.grade].l2, face: '#15171b' } : GRADES[f.grade];
  const img = g.createImageData(n, n), px = img.data;
  const put = (x: number, y: number, [R, Gr, B]: Rgb, a = 255) => { const o = (y * n + x) * 4; px[o] = R; px[o + 1] = Gr; px[o + 2] = B; px[o + 3] = a; };
  const level = f.fill !== undefined ? Math.round(cy + r - 3 - (f.size - 6) * Math.max(0, Math.min(1, f.fill))) : 0;
  const liq = hex(f.liquid ?? '#a8261c');
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const k = d[y * n + x];
    if (k < 0) continue;
    const lit = x - cx + (y - cy) < 0;
    if (f.flash && (k === 1 || k === 2)) { put(x, y, [255, 255, 255]); continue; }
    if (k === 0) put(x, y, hex(G.out));
    else if (k === 1) put(x, y, hex(lit ? G.l1 : G.s1));
    else if (k === 2) put(x, y, hex(lit ? G.l2 : G.s2));
    else if (k === 3 && f.ring) put(x, y, hex(f.ring));
    else if (f.shape === 'orb') {
      // The flask: liquid in stepped bands up to your health, a lighter line at its top, dark glass above.
      const deep = y - level;
      if (deep < 0) put(x, y, (x + y) % 4 === 0 ? [30, 33, 40] : [20, 22, 28]);
      else if (deep === 0) put(x, y, f.pulse ? [255, 140, 110] : [222, 84, 62]);
      else { const band = deep < 3 ? 1 : y > cy + r * 0.5 ? 0.62 : 0.82, p = f.pulse ? 1.25 : 1; put(x, y, [Math.min(255, liq[0] * band * p), liq[1] * band * p, liq[2] * band * p]); }
    } else put(x, y, (x * 3 + y * 5) % 7 === 0 ? hex(G.face).map((v) => v + 8) as Rgb : hex(G.face));
  }
  if (f.shape === 'orb') for (let a = 0; a < 6; a++) { const t = 3.5 + a * 0.18, x = Math.round(cx + Math.cos(t) * (r - 5)), y = Math.round(cy + Math.sin(t) * (r - 5)); if (d[y * n + x] >= 3) put(x, y, [220, 230, 240], a < 4 ? 200 : 110); }
  g.putImageData(img, 0, 0);
  if (f.icon) {
    const s = f.iconScale ?? 1, iw = (f.icon as HTMLCanvasElement).width * s, ih = (f.icon as HTMLCanvasElement).height * s;
    g.imageSmoothingEnabled = false;
    g.drawImage(f.icon, Math.round(cx - iw / 2), Math.round(cy - ih / 2 + (f.shape === 'shield' ? -1 : 0)), iw, ih);
    if (f.grade === 'stone') desaturate(g, n);
  }
  if (f.cd && f.cd > 0) {
    // What's still to come, swept clockwise from the top in sixteen steps.
    const q = Math.ceil(f.cd * 16) / 16;
    g.fillStyle = 'rgba(4,5,7,0.68)';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (d[y * n + x] < 2) continue;
      const a = (Math.atan2(x + 0.5 - cx, -(y + 0.5 - cy)) / (Math.PI * 2) + 1) % 1;
      if (a < q) g.fillRect(x, y, 1, 1);
    }
  }
  if (f.charge !== undefined) {
    const w = Math.round(f.size * 0.44), x0 = Math.round(cx - w / 2), y0 = Math.round(cy + r - 6);
    g.fillStyle = '#07080a', g.fillRect(x0 - 1, y0 - 1, w + 2, 3);
    g.fillStyle = f.chargeCol ?? '#ffd27a', g.fillRect(x0, y0, Math.round(w * f.charge), 1);
  }
  if (f.pips) {
    // Along the top left of the button, from straight up round to the left.
    const R = r + 3;
    for (let i = 0; i < f.pips.of; i++) {
      const t = (100 + (i * 92) / Math.max(1, f.pips.of - 1)) * (Math.PI / 180), x = Math.round(cx + Math.cos(t) * R - 1), y = Math.round(cy - Math.sin(t) * R - 1);
      g.fillStyle = '#07080a', g.fillRect(x - 1, y - 1, 4, 4);
      g.fillStyle = i < f.pips.lit ? f.pips.col : '#2a2d33', g.fillRect(x, y, 2, 2);
      if (i < f.pips.lit) (g.fillStyle = 'rgba(255,255,255,0.35)'), g.fillRect(x, y, 1, 1);
    }
  }
}

function desaturate(g: CanvasRenderingContext2D, n: number): void {
  const im = g.getImageData(0, 0, n, n), p = im.data;
  for (let i = 0; i < p.length; i += 4) { const v = (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) * 0.55; p[i] = p[i + 1] = v; p[i + 2] = v + 4; }
  g.putImageData(im, 0, 0);
}
