/**
 * THE LEECHMAN's pool as the screen paints it over the room's painted floor (shared/fenarena.ts; the room's side is
 * sim/leechwind.ts, sim/leechlog.ts, sim/leechbook.ts), each frame:
 * - phase 2's rising water: every deep channel repainted to its new size, foam at its edges;
 * - the windlass's drained shallows: wet black mud with puddles, not water (the water drains away from the windlass and
 *   comes back), over the moving water;
 * - the peat bank's mud: dark heaped peat in circles, fading as it wears off;
 * - the windlass itself (client/windlassdraw.ts) and a laid log's wet ends (the log is client/staithebox.ts, a lashed trunk).
 * Drawing only.
 */
import type { GameMap, Water } from '../shared/arena';
import { POOL_SPOTS } from '../shared/fenarena';
import { LEECHMAN } from '../shared/leechtune';
import type { Hero, Prop } from '../sim/types';
import { ease, type Ctx } from './draw';
import { LEECH, isFen } from './leechstate';
import { drawWindlass } from './windlassdraw';
import { OX, OY, PX } from './world';

const hash = (n: number) => {
  const s = Math.sin(n * 57.3 + 7.7) * 43758.5453;
  return s - Math.floor(s);
};
const MUD = ['#1b1712', '#241d15', '#16120e', '#2e251a'];

/** The shallows' boxes now (the pool's, not the channels). */
const shallows = (m: GameMap): Water[] => (m.water ?? []).filter((w) => !w.deep);

/** Before the moving water: phase 2's wider channels repainted to the size they are now (the room's painting still has the old ones). */
export function drawFenBase(g: CanvasRenderingContext2D, map: GameMap, cx: number, cy: number, now: number): void {
  if (!isFen(map)) return;
  const deeps = (map.water ?? []).filter((w) => w.deep);
  if (!deeps.some((w, i) => w.w > POOL_SPOTS.deep[i % POOL_SPOTS.deep.length].w + 0.05 || w.h > POOL_SPOTS.deep[i % POOL_SPOTS.deep.length].h + 0.05)) return;
  const fresh = now - LEECH.flood;
  for (const w of deeps) {
    const x = Math.round(OX + w.x * PX - cx), y = Math.round(OY + w.y * PX - cy), W = Math.round(w.w * PX), H = Math.round(w.h * PX);
    g.fillStyle = '#1a2a22', g.fillRect(x - 1, y - 1, W + 2, H + 2);
    g.fillStyle = '#17304a', g.fillRect(x, y, W, H);
    g.fillStyle = '#122640', g.fillRect(x + 3, y + 3, W - 6, H - 6);
    g.fillStyle = '#0e1d33', g.fillRect(x + 7, y + 7, W - 14, H - 14);
    for (let i = 0; i < (W * H) / 70; i++) (g.fillStyle = i % 2 ? '#1c3552' : '#244462'), g.fillRect(x + 2 + Math.floor(hash(i + w.x * 9) * (W - 6)), y + 2 + Math.floor(hash(i * 3 + w.y * 7) * (H - 4)), 3, 1);
    g.fillStyle = '#2a4a5a', g.fillRect(x, y, W, 1);
    // Foam where the water has just come up over the bank.
    if (fresh < 2.5) {
      g.globalAlpha = 1 - fresh / 2.5;
      for (let i = 0; i < 40; i++) {
        const t = (i / 40) * 2 * (W + H), on = t < W ? [x + t, y] : t < W + H ? [x + W, y + t - W] : t < 2 * W + H ? [x + W - (t - W - H), y + H] : [x, y + H - (t - 2 * W - H)];
        g.fillStyle = i % 2 ? '#c8dcdc' : '#9ab8bc', g.fillRect(Math.round(on[0]), Math.round(on[1]), 2, 1);
      }
      g.globalAlpha = 1;
    }
  }
}

const mudTex = new Map<string, HTMLCanvasElement>();
/** One shallow's drained floor made once: dark wet mud in clods and drag marks, puddles of black water with a lit rim. */
function mudOf(w: Water, i: number): HTMLCanvasElement {
  const W = Math.round(w.w * PX), H = Math.round(w.h * PX), key = `${W}x${H}:${i}`, had = mudTex.get(key);
  if (had) return had;
  const cv = document.createElement('canvas');
  (cv.width = W), (cv.height = H);
  const g = cv.getContext('2d')!;
  g.fillStyle = MUD[0], g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 3) {
    const h = hash(x * 7 + y * 131 + i * 17);
    if (h > 0.5) (g.fillStyle = MUD[h > 0.9 ? 3 : h > 0.7 ? 1 : 2]), g.fillRect(x, y, 3, h > 0.85 ? 2 : 1);
  }
  // Wet furrows where the water ran out, long and bent.
  g.fillStyle = '#0e0b08';
  for (let k = 0; k < 18; k++) { let x = Math.floor(hash(k * 3 + 1) * W), y = Math.floor(hash(k * 5 + 2) * H); for (let j = 0; j < 14; j++) (x += 2), (y += Math.round(Math.sin(j * 0.6 + k) * 1)), g.fillRect(x, y, 2, 1); }
  // Puddles: black water pooled in the low places, a pale rim at their far lip and a sheen.
  for (let k = 0; k < Math.round((W * H) / 900); k++) {
    const px = 8 + Math.floor(hash(k * 11 + 3) * (W - 24)), py = 6 + Math.floor(hash(k * 13 + 4) * (H - 14)), rw = 6 + Math.floor(hash(k * 7) * 9), rh = Math.max(2, Math.round(rw * 0.32));
    for (let dy = -rh; dy <= rh; dy++) {
      const ww = Math.round(rw * Math.sqrt(Math.max(0, 1 - (dy * dy) / (rh * rh + 0.1))));
      g.fillStyle = dy < -rh + 1 ? '#6a8a8c' : dy > rh - 1 ? '#10181a' : dy < 0 ? '#24383c' : '#1a2a2e';
      g.fillRect(px - ww, py + dy, ww * 2, 1);
    }
    g.fillStyle = '#4a6a6e', g.fillRect(px - Math.round(rw * 0.4), py - 1, Math.round(rw * 0.5), 1);
  }
  mudTex.set(key, cv);
  return cv;
}

const peatTex = new Map<number, HTMLCanvasElement>();
/** A heap of peat a circle wide: black, fibrous, clumped at the rim, with pale sprigs of dead grass. */
function peatOf(r: number): HTMLCanvasElement {
  const had = peatTex.get(r);
  if (had) return had;
  const S = r * 2 + 3, cv = document.createElement('canvas');
  (cv.width = S), (cv.height = S);
  const g = cv.getContext('2d')!, mid = r + 1;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x, y) / r, h = hash(x * 13 + y * 29 + r);
    if (d > 1 - h * 0.18) continue;
    g.fillStyle = d > 0.78 ? (h > 0.5 ? '#6a5430' : '#523f24') : d > 0.4 ? (h > 0.7 ? '#463420' : '#382a18') : h > 0.8 ? '#4a3822' : '#2a1e12';
    g.fillRect(mid + x, mid + y, 1, 1);
  }
  g.fillStyle = '#6a5a34';
  for (let k = 0; k < 7; k++) { const a = hash(k * 5 + r) * 6.28, d = 0.45 + hash(k * 9) * 0.4; g.fillRect(Math.round(mid + Math.cos(a) * r * d), Math.round(mid + Math.sin(a) * r * d) - 1, 1, 2); }
  g.fillStyle = '#5a6a30';
  for (let k = 0; k < 4; k++) { const a = hash(k * 3 + 77) * 6.28; g.fillRect(Math.round(mid + Math.cos(a) * r * 0.6), Math.round(mid + Math.sin(a) * r * 0.6) - 2, 1, 2); }
  g.fillStyle = '#6a5a40', g.fillRect(mid - Math.round(r * 0.4), mid - Math.round(r * 0.5), 3, 1);
  peatTex.set(r, cv);
  return cv;
}

/** After the moving water: the drained shallows as mud, then the peat bank's heaps. `t` the room's time. */
export function drawFenFloor(g: CanvasRenderingContext2D, map: GameMap, cx: number, cy: number, now: number, t: number): void {
  if (!isFen(map)) return;
  // How far the mud has spread: out from the windlass's side as the water drains, and back as it returns.
  const w = LEECH.wind, drain = map.drained ? ease((now - w.drainedAt) / 1.6) : now - w.backAt < 1.3 && w.backAt > 0 ? 1 - ease((now - w.backAt) / 1.3) : 0;
  if (drain > 0) shallows(map).forEach((sh, i) => {
    const x = Math.round(OX + sh.x * PX - cx), y = Math.round(OY + sh.y * PX - cy), W = Math.round(sh.w * PX), H = Math.round(sh.h * PX), reach = Math.round(W * drain);
    g.save();
    g.beginPath(), g.rect(x, y, reach, H), g.clip();
    g.drawImage(mudOf(sh, i), x, y);
    // Sheen on the puddles, slow rings.
    for (let k = 0; k < 7; k++) {
      const ph = (now * 0.5 + hash(k) * 3) % 1, px = x + 14 + Math.floor(hash(k * 11 + 3) * (W - 28)), py = y + 8 + Math.floor(hash(k * 13 + 4) * (H - 16));
      g.fillStyle = '#9ac4c4', g.globalAlpha = (1 - ph) * 0.8, g.fillRect(px - Math.round(ph * 5), py, 1 + Math.round(ph * 10), 1), g.globalAlpha = 1;
    }
    g.restore();
    // The edge of the water going out (or coming back): a wet front, foam, streaks of draining water ahead of it.
    if (drain < 1) {
      for (let yy = 0; yy < H; yy += 2) (g.fillStyle = yy % 4 ? '#a4c8c8' : '#5e8890'), g.fillRect(x + reach + Math.round(Math.sin(now * 5 + yy) * 1), y + yy, 2, 1);
      g.fillStyle = '#6a98a0';
      for (let k = 0; k < 14; k++) g.fillRect(x + reach + 3 + Math.floor(((now * 30 + k * 13) % 24)), y + Math.floor(hash(k + 5) * H), 5, 1);
    }
  });
  for (const m of map.mud ?? []) {
    const left = m.until - t, r = Math.round(m.r * PX), tex = peatOf(r);
    g.globalAlpha = left < 1.8 ? Math.max(0.15, Math.ceil((left / 1.8) * 4) / 4) : 1;
    g.drawImage(tex, Math.round(OX + m.x * PX - cx - r - 1), Math.round(OY + m.y * PX - cy - r - 1));
  }
  g.globalAlpha = 1;
}

/** In the scene, under or among everyone: the windlass at its post. */
export function fenScene(map: GameMap, c: Ctx, cx: number, cy: number, heroes: readonly Hero[], items: { y: number; draw: () => void }[]): void {
  if (!map.windlass) return;
  const wx = OX + map.windlass.x * PX - cx, wy = OY + map.windlass.y * PX - cy;
  items.push({ y: OY + map.windlass.y * PX + 2, draw: () => drawWindlass(c, wx, wy + 4, heroes, !!map.drained, c.now) });
}

/** A laid log's wet ends, a ripple and a fleck of foam where it meets the water. (x, y) the log's middle in screen pixels. */
export function drawLogWet(c: Ctx, p: Prop, x: number, y: number): void {
  const m = LEECH.map, b = m?.blocks.find((q) => q.kind === 'gangway' && p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h);
  if (!b) return;
  const along = b.w >= b.h, g = c.lit, now = c.now, half = ((along ? b.w : b.h) * PX) / 2;
  for (const sgn of [-1, 1]) for (let i = 0; i < 6; i++) {
    const ph = (now * 0.8 + i * 0.17 + (sgn > 0 ? 0.4 : 0)) % 1, ex = along ? x + sgn * (half - 5) : x + (i - 3) * 4, ey = along ? y + (i - 3) * 3 : y + sgn * (half - 5);
    g.fillStyle = i % 2 ? '#a4c8c8' : '#5e8890', g.globalAlpha = 1 - ph, g.fillRect(Math.round(ex + (along ? sgn * ph * 4 : 0)), Math.round(ey + (along ? 0 : sgn * ph * 3)), 3, 1);
  }
  g.globalAlpha = 1;
  void LEECHMAN;
}
