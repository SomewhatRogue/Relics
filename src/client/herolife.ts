/**
 * What moves on a hero, drawn around the posed body (figure.ts LAYOUT) each frame: a Warrior's cape and
 * plume, a Ranger's cloak edges, a Rogue's scarf tail and sash end, a robe's hem, a hat's tip, a
 * tabard's foot, long hair. Each sways at rest and trails behind when walking. Cloth behind the body
 * goes in the `back` layer (before the body), cloth over it in `front`. Lit layer only: none of it is
 * light. Only draws; timings come from the wall clock and a phase seeded by the hero's id, so a party
 * never sways in step but a hero always moves the same way.
 */
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';
import { LAYOUT } from './figure';
import type { LookDef } from './lookkit';
import { OUTLINE } from './sprites';
import { mix } from './heroeyes';

/** A stable number in [0, 1) from a hero's id (their sway's phase, their step's timing). */
export function idPhase(id: string): number {
  let x = 2166136261;
  for (let i = 0; i < id.length; i++) x = Math.imul(x ^ id.charCodeAt(i), 16777619);
  return ((x >>> 0) % 1000) / 1000;
}

/** How far each hero's cloth has swung out behind them (eased toward walking or still). */
const swing = new Map<string, { k: number; at: number }>();
function trail(h: Hero, now: number): number {
  let s = swing.get(h.id);
  if (!s) swing.set(h.id, (s = { k: 0, at: now }));
  const dt = Math.min(0.1, Math.max(0, now - s.at)), goal = h.moving && h.act !== 'roll' ? 1 : 0;
  s.k += (goal - s.k) * Math.min(1, dt * 7);
  s.at = now;
  return s.k;
}

type Att = 0 | 1 | 2;
const BUF: number[] = [], COLS: string[] = [];
let lay: 'back' | 'front' = 'back';

/** A rect in the sprite's own pixels (x across from the facing side's back, y down), on the torso, head or legs. */
function rect(want: 'back' | 'front', x: number, y: number, w: number, h: number, col: string, att: Att = 0): void {
  if (want !== lay || w <= 0 || h <= 0) return;
  const L = LAYOUT, dx = att === 2 ? 0 : att === 1 ? L.lean : Math.round(L.lean / 2), dy = att === 2 ? Math.min(0, L.drop) : L.drop;
  BUF.push((L.flip ? L.left + 13 - x - w : L.left + 1 + x) + dx, L.top + 1 + y + dy, w, h);
  COLS.push(col);
}

/** Outlines first (one pixel round every rect), then the cloth; the glow under it erased; a hit's flash over it. */
function flush(c: Ctx, flash: number, tint: string): void {
  const n = COLS.length;
  if (!n) return;
  const g = c.lit;
  g.fillStyle = OUTLINE;
  for (let i = 0; i < n; i++) g.fillRect(BUF[i * 4] - 1, BUF[i * 4 + 1] - 1, BUF[i * 4 + 2] + 2, BUF[i * 4 + 3] + 2);
  for (let i = 0; i < n; i++) (g.fillStyle = COLS[i]), g.fillRect(BUF[i * 4], BUF[i * 4 + 1], BUF[i * 4 + 2], BUF[i * 4 + 3]);
  c.glow.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < n; i++) c.glow.fillRect(BUF[i * 4] - 1, BUF[i * 4 + 1] - 1, BUF[i * 4 + 2] + 2, BUF[i * 4 + 3] + 2);
  c.glow.globalCompositeOperation = 'source-over';
  if (flash > 0) {
    c.glow.globalAlpha = Math.min(1, flash);
    c.glow.fillStyle = tint;
    for (let i = 0; i < n; i++) c.glow.fillRect(BUF[i * 4], BUF[i * 4 + 1], BUF[i * 4 + 2], BUF[i * 4 + 3]);
    c.glow.globalAlpha = 1;
  }
  BUF.length = COLS.length = 0;
}

/**
 * Draw one layer of a hero's moving cloth. `up`: walking away (the back view). `dark`: how far the
 * eye dial has gone to red (0 to 1, heroeyes.ts): a cape or cloak goes darker and its hem ragged.
 */
export function drawLife(c: Ctx, h: Hero, d: LookDef, up: boolean, layer: 'back' | 'front', flash: number, tint: string, dark = 0): void {
  lay = layer;
  const now = c.now, ph = idPhase(h.id) * 6.283, k = layer === 'back' ? trail(h, now) : swing.get(h.id)?.k ?? 0;
  const side = Math.abs(h.fx) > 0.35 ? k : 0, rate = 2 + 7 * k;
  const wave = (i: number, amp = 1) => Math.round(Math.sin(now * rate + ph + i * 0.9) * amp);
  const L = d.life, t = d.tall, bottom = d.h - 2, rag = !!L.ragged || dark > 0.5;
  const shade = (col: string) => (dark > 0.5 ? mix(col, '#140a0a', (dark - 0.5) * 1.2) : col);
  // A cape (or the cloak's skirts): behind the body facing you, flying out behind when walking.
  const cloth = L.cape ?? L.cloak;
  if (cloth) {
    const [col, lin] = [shade(cloth[0]), shade(cloth[1])], top = L.cape ? 6 + t : 9 + t, n = bottom - top;
    for (let r = top; r <= bottom; r++) {
      const i = r - top, low = i > n / 2, ext = Math.round(side * 3.5 * (i / n) ** 1.2), sw = i >= n - 1 ? wave(i, k > 0.2 ? 1 : 0.6) : k > 0.2 ? wave(i) : 0;
      const hem = r === bottom && rag && (Math.floor(now * 3 + ph) + r) % 2 ? 1 : 0;
      if (!up) {
        const x0 = (low ? 0 : 1) - ext + Math.min(0, sw), x1 = (low ? 11 : 10) + Math.max(0, sw);
        rect('back', x0, r, x1 - x0 + 1 - hem, 1, lin);
        if (ext > 0) rect('back', x0, r, ext, 1, col);
      } else if (L.cape || r > 11 + t) {
        const x0 = (low ? 1 : 2) - ext + sw, x1 = (low ? 10 : 9) + sw;
        rect('front', x0 + hem, r, x1 - x0 + 1 - hem * 2, 1, col);
        if (low && L.cape) rect('front', 4 + sw, r, 1, 1, lin), rect('front', 7 + sw, r, 1, 1, lin);
      }
    }
  }
  // The plume off the top of the helm, nodding, and streaming back when walking.
  if (L.plume) {
    const back = Math.round(side * 2), nod = wave(0, 0.6 + k * 0.6);
    rect('front', 5, -1, 2, 1, L.plume, 1);
    rect('front', 5 - back + nod, -2, 2, 1, L.plume, 1);
    if (k > 0.3) rect('front', 4 - back + nod, -2, 1, 1, L.plume, 1);
  }
  // Long hair: past the face on both sides, swinging; down the back walking away.
  if (L.hair) {
    const y = d.eyes[0] + 1, sw = wave(2, 0.5 + k);
    if (!up) rect('back', 1 - Math.round(side * 2) + Math.min(0, sw), y, 1 + Math.round(side * 2), 3, L.hair, 1), rect('back', 10, y + Math.max(0, sw), 1, 3 - Math.max(0, sw), L.hair, 1);
    else rect('front', 3 + sw, y + 2, 6, 2, L.hair, 1);
  }
  // A Rogue's scarf tail from the knot at the neck: it hangs at rest and streams out behind at a run.
  if (L.scarf) {
    const ax = up ? 6 : 2, ay = 6 + t;
    for (let i = 1; i <= 5; i++) {
      const x = Math.round(ax - i * side * 1.1) + wave(i, 0.4 + k * 0.8), y = Math.round(ay + i * (1 - 0.8 * side));
      rect(up ? 'front' : 'back', x, y, i < 3 ? 2 : 1, 1, i % 2 ? L.scarf[0] : L.scarf[1]);
    }
    // The sash's end at the hip, swinging.
    if (!up) rect('front', 9 + Math.max(0, wave(7)), 11 + t, 1, 2, L.scarf[0], 2);
  }
  // A robe's hem flaring at the foot, the side behind kicking out when walking.
  if (L.hem) {
    const sw = wave(3, 0.6 + k), y = bottom;
    rect('front', sw > 0 ? 12 : -1, y, 1, 1, L.hem[1], 2);
    if (side > 0.3) rect('front', -1, y - 1, 1, 1, L.hem[0], 2), rect('front', 0, y - 2, 1, 2, L.hem[0], 2);
  }
  // A hat's crooked tip nodding as they walk.
  if (L.tip && k > 0.2 && wave(4, 1) > 0) rect('front', 8, 0, 1, 1, L.tip, 1);
  // The tabard's foot flicking.
  if (L.tabard && !up) {
    const sw = wave(5, 0.4 + k);
    if (sw) rect('front', sw > 0 ? 7 : 4, 14 + t, 1, 1, L.tabard, 2);
  }
  flush(c, flash, tint);
}
