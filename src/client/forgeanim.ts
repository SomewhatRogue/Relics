/**
 * Two relics left together, and one back (churchrelics.ts): the two are drawn in from either side, a
 * column of warm light rises between them, they go into it, pictures of relics flicker past in the
 * light like a slot machine's wheel slowing, a flash, and the new one turns in the light. About 2.6 s;
 * a tap skips to the end. The new relic was rolled and kept before this starts: this only shows it.
 * Cosmetic, so Math.random is fine for the shuffle.
 */
import { FOUND_RELICS } from '../shared/tuning';
import { relicName, type RelicItem } from '../shared/relicitems';
import type { Panel } from './panels';
import { drawText, textWidth } from './pixfont';
import { relicCol, relicItemIcon } from './relicicons';
import { RELICW } from './relicwords';
import { sfx } from './sfx';

const W = 96, H = 66, CX = 48, CY = 32, END = 2.6;
const ease = (k: number) => k * k * (3 - 2 * k);
const clamp = (k: number) => Math.max(0, Math.min(1, k));

const imgs = new Map<string, HTMLImageElement>();
function img(src: string): HTMLImageElement {
  let i = imgs.get(src);
  if (!i) (i = new Image()), (i.src = src), imgs.set(src, i);
  return i;
}
/** A relic picture centred at (x, y), `s` times, squeezed across by `turn` (a coin turning), at `a`. */
function icon(g: CanvasRenderingContext2D, src: string, x: number, y: number, s: number, turn = 1, a = 1): void {
  const i = img(src);
  if (!i.complete || a <= 0) return;
  g.globalAlpha = a;
  const w = Math.max(1, Math.round(12 * s * Math.abs(turn))), h = Math.round(12 * s);
  g.drawImage(i, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
  g.globalAlpha = 1;
}

function frame(g: CanvasRenderingContext2D, t: number, a: RelicItem, b: RelicItem, got: RelicItem, wheel: string[]): void {
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#100e14';
  g.fillRect(0, 0, W, H);
  // The step: worn stone along the foot.
  for (let x = 0; x < W; x += 2) (g.fillStyle = (x / 2) % 3 ? '#2a2733' : '#34303f'), g.fillRect(x, H - 10, 2, 10);
  // The column of light: it rises, holds, and narrows to the new one.
  const rise = ease(clamp((t - 0.45) / 0.6)), fade = 1 - clamp((t - 2.1) / 0.5) * 0.6, cw = Math.round(4 + 10 * rise);
  for (let y = 0; y < H - 10; y++) {
    const top = (H - 10) * (1 - rise);
    if (y < top) continue;
    for (let dx = -cw; dx <= cw; dx++) {
      const k = 1 - Math.abs(dx) / (cw + 1), dither = (dx + y) % 2 === 0 ? 0.06 : 0;
      g.fillStyle = `rgba(255,${210 + Math.round(30 * k)},${120 + Math.round(60 * k)},${(0.12 + 0.55 * k * k + dither) * fade})`;
      g.fillRect(CX + dx, y, 1, 1);
    }
  }
  // The two drawn in.
  const pull = ease(clamp(t / 1.0)), into = 1 - clamp((t - 0.85) / 0.25);
  icon(g, relicItemIcon(a), 14 + (CX - 14) * pull, CY + Math.sin(t * 6) * 1.5 * (1 - pull), 2, 1, into);
  icon(g, relicItemIcon(b), W - 14 - (W - 14 - CX) * pull, CY + Math.cos(t * 6) * 1.5 * (1 - pull), 2, 1, into);
  // The wheel: pictures flicker past in the light, slowing.
  if (t >= 1.0 && t < 1.75) {
    const k = (t - 1.0) / 0.75, n = Math.floor(16 * k - 6 * k * k);
    icon(g, wheel[n % wheel.length], CX, CY + ((t * 40) % 6) - 3, 2, 1, 0.85);
  }
  // The flash.
  const fl = 1 - clamp((t - 1.75) / 0.25);
  if (t >= 1.75 && fl > 0) (g.fillStyle = `rgba(255,246,224,${fl})`), g.fillRect(0, 0, W, H);
  // The new one, turning in the light, with rays.
  if (t >= 1.75) {
    const k = clamp((t - 1.75) / 0.6), col = relicCol(got);
    g.fillStyle = col;
    for (let r = 0; r < 8; r++) {
      const ang = r * (Math.PI / 4) + t * 0.8, len = 12 + 4 * Math.sin(t * 5 + r);
      for (let s = 9; s < len; s += 2) g.fillRect(Math.round(CX + Math.cos(ang) * s), Math.round(CY + Math.sin(ang) * s * 0.8), 1, 1);
    }
    icon(g, relicItemIcon(got), CX, CY - 2 * k, 2 + 0.4 * k, t >= END - 0.15 ? 1 : Math.cos((t - 1.75) * 7));
    const name = relicName(got);
    if (t > 2.05) drawText(g, name, Math.round(CX - textWidth(name) / 2), H - 8, col);
  }
}

/** Play it in `panel`, then `done` (the last frame is left as an image, `img.forge`, for the result). */
export function forgeAnim(panel: Panel, a: RelicItem, b: RelicItem, got: RelicItem, done: () => void): void {
  panel.show(RELICW.twoTitle, `<canvas class="forge"></canvas><div class="forgeskip">${RELICW.tapSkip}</div>`, [], true);
  const cv = document.querySelector<HTMLCanvasElement>('#panel canvas.forge'), host = document.getElementById('panel'), g = cv?.getContext('2d');
  if (!cv || !g || !host) return done();
  const s = Math.max(2, Math.floor(Math.min(cv.parentElement?.clientWidth || W * 3, 360) / W));
  cv.width = W;
  cv.height = H;
  cv.style.width = `${W * s}px`;
  cv.style.height = `${H * s}px`;
  const wheel = Array.from({ length: 12 }, (_, i) => relicItemIcon({ kind: FOUND_RELICS[(i * 5 + Math.floor(Math.random() * 7)) % FOUND_RELICS.length], el: i % 4 === 3 ? 'fire' : '', charge: 1 }));
  const start = performance.now();
  let over = false, rang = false;
  const finish = () => {
    if (over) return;
    over = true;
    host.removeEventListener('click', skip);
    frame(g, END, a, b, got, wheel);
    cv.outerHTML = `<img class="forge" alt="${relicName(got)}" src="${cv.toDataURL()}" style="width:${W * s}px;height:${H * s}px">`;
    done();
  };
  const skip = () => performance.now() - start > 200 && finish();
  host.addEventListener('click', skip);
  const tick = () => {
    if (over) return;
    if (!cv.isConnected || !panel.open) return void (over = true, host.removeEventListener('click', skip));
    const t = (performance.now() - start) / 1000;
    if (t >= 1.75 && !rang) (rang = true), sfx.fanfare();
    if (t >= END) return finish();
    frame(g, t, a, b, got, wheel);
    requestAnimationFrame(tick);
  };
  tick();
}

/** For the screenshot script: draw a frame at `t` into a fresh canvas (no panel). */
export const forgeFrame = (t: number, a: RelicItem, b: RelicItem, got: RelicItem, g: CanvasRenderingContext2D) =>
  frame(g, t, a, b, got, FOUND_RELICS.map((k) => relicItemIcon({ kind: k, el: '', charge: 1 })));
