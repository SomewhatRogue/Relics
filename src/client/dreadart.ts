/**
 * The dread's pixel art, drawn in code at the overlay's low resolution (dreadfx.ts): the thing in the
 * wild dark (a vast hunched shape, a hand bigger than a cottage, pale pinprick eyes) and the hungry
 * pouring out of it (small hunched shapes, big ears, sickly green eyes). Near-black with a cold rim so
 * it reads against the dark. Whole pixels only; ragged edges come from a fixed hash, so nothing shimmers.
 */
type G = CanvasRenderingContext2D;

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const VOID = '#020104', RIM = '#2e2740';

/** A pair of pinprick eyes `gap` apart, `open` 0 (shut) to 1: a bright point or slit each, a dim pixel either side. */
export function eyes(g: G, x: number, y: number, gap: number, open: number, col = '#e8eeff', halo = '#4a5a7a'): void {
  if (open <= 0.05) return;
  const w = Math.max(1, Math.min(3, Math.round(gap / 12)));
  for (const s of [-1, 1]) {
    const ex = Math.round(x + (s * gap) / 2 - w / 2), ey = Math.round(y);
    g.fillStyle = halo;
    g.fillRect(ex - 1, ey, w + 2, 1);
    if (w > 1) g.fillRect(ex, ey - 1, w, 3);
    g.fillStyle = col;
    g.fillRect(ex, ey, w, 1);
  }
}

/** Fill a row span with the void, a rim pixel at each end. */
function span(g: G, y: number, x0: number, x1: number): void {
  if (x1 <= x0) return;
  g.fillStyle = VOID;
  g.fillRect(x0, y, x1 - x0, 1);
  g.fillStyle = RIM;
  g.fillRect(x0, y, 1, 1);
  g.fillRect(x1 - 1, y, 1, 1);
}

/**
 * The thing at the edge of the dark: a head and hunched shoulders `h` pixels tall, its middle at x,
 * its foot at `base` (usually below the screen), crooked spines off its back. Eyes near the top.
 */
export function vast(g: G, x: number, base: number, h: number, blink: number, dir = 1): void {
  const top = base - h, hx = x + dir * h * 0.3;
  for (let y = Math.max(0, Math.floor(top)); y < base; y++) {
    const q = (y - top) / h;
    // A small skull on a long neck, then the shoulders rolling out.
    // A small skull thrust out on a long neck toward the light, then the shoulders rolling out behind.
    const head = q < 0.22 ? Math.sqrt(Math.max(0, 1 - ((q - 0.11) / 0.11) ** 2)) * h * 0.11 : 0, nx = x + (hx - x) * Math.max(0, 1 - q * 1.6);
    const body = q > 0.16 ? h * (0.1 + 0.42 * Math.min(1, (q - 0.16) / 0.38) ** 0.7) : 0, j = (hash(y, 3) - 0.5) * 3;
    if (head) span(g, y, Math.round(hx - head - j), Math.round(hx + head + j));
    if (q > 0.08 && q < 0.4) span(g, y, Math.round(nx - h * 0.05), Math.round(nx + h * 0.05));
    if (body) span(g, y, Math.round(x - body - j), Math.round(x + body * 1.08 + j));
  }
  // Spines off the shoulders, leaning back.
  for (let i = 0; i < 5; i++) {
    const sx = x + h * (0.12 + i * 0.07) * (i % 2 ? 1 : -1), sy = top + h * (0.32 + i * 0.03), len = h * (0.12 + hash(i, 9) * 0.1);
    for (let k = 0; k < len; k++) span(g, Math.round(sy - k), Math.round(sx + k * 0.35 * (i % 2 ? 1 : -1) - (1 - k / len) * 2), Math.round(sx + k * 0.35 * (i % 2 ? 1 : -1) + (1 - k / len) * 2));
  }
  eyes(g, hx + dir * h * 0.02, top + h * 0.11, h * 0.09, blink);
}

/**
 * A hand coming down out of the dark, as wide as `s` pixels, its palm's middle at (x, y); `close` 0
 * (fingers spread, reaching) to 1 (closed hard on whatever is under it).
 */
export function hand(g: G, x: number, y: number, s: number, close: number): void {
  const discs: [number, number, number][] = [], dot = (cx: number, cy: number, r: number) => discs.push([cx, cy, Math.max(1, Math.round(r))]);
  // The forearm back up into the dark.
  for (let k = 0; k < s * 1.8; k += 2) dot(x + Math.sin(k * 0.02) * s * 0.05, y - s * 0.32 - k, s * (0.13 + k / (s * 16)));
  dot(x, y - s * 0.05, s * 0.27);
  dot(x - s * 0.12, y + s * 0.1, s * 0.2);
  dot(x + s * 0.12, y + s * 0.1, s * 0.2);
  // Four long jointed fingers and a thumb, curling in as it closes; a claw at each tip.
  const tips: [number, number][] = [];
  [-0.42, -0.15, 0.13, 0.4].forEach((f, i) => {
    let a = Math.PI / 2 + f * (1.6 - close * 0.9), px = x + f * s * 0.5, py = y + s * 0.2;
    const len = s * (0.44 + (i === 1 || i === 2 ? 0.08 : 0)), r = s * 0.075;
    for (let seg = 0; seg < 3; seg++) {
      for (let k = 0; k < len / 3; k++) dot(px + Math.cos(a) * k, py + Math.sin(a) * k, r * (1 - seg * 0.22));
      px += Math.cos(a) * (len / 3);
      py += Math.sin(a) * (len / 3);
      a += close * 0.55 * -Math.sign(f) * 0.6 + close * 0.15;
    }
    tips.push([px, py]);
  });
  const ta = Math.PI * (0.75 - close * 0.35);
  for (let k = 0; k < s * 0.3; k++) dot(x - s * 0.25 + Math.cos(ta) * k, y + s * 0.02 + Math.sin(ta) * k, s * 0.055);
  const fill = (col: string, grow: number) => {
    g.fillStyle = col;
    for (const [cx, cy, r0] of discs) {
      const r = r0 + grow;
      for (let j = -r; j <= r; j++) {
        const w = Math.round(Math.sqrt(Math.max(0, r * r - j * j)));
        g.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1);
      }
    }
  };
  fill(RIM, 1);
  fill(VOID, 0);
  g.fillStyle = '#6a5e7e';
  for (const [px, py] of tips) g.fillRect(Math.round(px), Math.round(py), 1, Math.max(2, Math.round(s * 0.05)));
}

/** One of the hungry, `s` pixels tall, running (`f` its stride phase), eyes lit sickly green. */
export function runner(g: G, x: number, y: number, s: number, f: number, flip: boolean): void {
  const R = (ox: number, oy: number, w: number, h: number) => g.fillRect(Math.round(flip ? x - ox * s - w * s : x + ox * s), Math.round(y + oy * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)));
  const step = Math.sin(f) * 0.18;
  g.fillStyle = '#05080a';
  // Hunched body, head thrust forward, long ears laid back, legs going.
  R(-0.25, -0.6, 0.5, 0.35);
  R(0.1, -0.85, 0.3, 0.28);
  R(-0.15, -0.95, 0.35, 0.08);
  R(-0.12 + step, -0.26, 0.1, 0.26);
  R(0.08 - step, -0.26, 0.1, 0.26);
  R(0.25, -0.55, 0.22, 0.07);
  g.fillStyle = '#c8f060';
  R(0.3, -0.76, 0.01, 0.01);
  if (s > 9) R(0.2, -0.76, 0.01, 0.01);
}

/** A dithered pool of dark on the ground, `r` wide, `k` 0 to 1 how deep. */
export function pool(g: G, x: number, y: number, r: number, k: number): void {
  g.fillStyle = VOID;
  for (let j = -r * 0.5; j <= r * 0.5; j++) for (let i = -r; i <= r; i++) {
    const q = Math.hypot(i / r, j / (r * 0.5));
    if (q > 1) continue;
    const a = k * (1 - q * q) * 16;
    const px = Math.round(x + i), py = Math.round(y + j);
    if (a > BAYER[(px & 3) + (py & 3) * 4]) g.fillRect(px, py, 1, 1);
  }
}
