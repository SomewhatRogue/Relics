/**
 * The spellblade, shown: the edge in hand and the ward round the hero (sim/manashield.ts decides it and
 * keeps it on the hero, so a guest sees what the leader's room decided). In hand, the edge burns in the
 * element (embers, glitter, crackle) and glows the more magic you have. Round the hero, in both views: the
 * mana shield as a ward in the element's colour, a shell of light and a circle at your feet, full and
 * bright with magic high, its light thinning out (not emptying round like a meter) as it drains. A hit
 * that takes magic cracks it with a white flash; one that runs it out breaks it into shards. Drawing only.
 */
import { HERO, MANA_SHIELD, WEAPONS } from '../shared/tuning';
import { castElement } from '../sim/channel';
import type { Hero } from '../sim/types';
import { line, type Ctx } from './draw';
import { EL_COL } from './palette';

/** How much shield there is, 0 to 1 (magic over the bar). */
const shareOf = (h: Hero) => Math.max(0, Math.min(1, h.stamina / HERO.stamina));
/** A steady scatter in [0, 1) for dot `i`: which dots go dark first as the ward thins. */
const hash = (i: number) => ((Math.sin(i * 127.1 + 11.7) * 43758.5453) % 1 + 1) % 1;

/** The edge in hand along `a` from (ox, oy): motes of the element, and the magic up its length. */
export function bladeEdge(c: Ctx, h: Hero, ox: number, oy: number, a: number): void {
  const k = shareOf(h), g = c.glow, el = castElement(h), col = EL_COL[el];
  if (k > 0.05) {
    g.globalAlpha = 0.3 + 0.5 * k;
    line(g, ox, oy, a, 3, 3 + 9 * k, col);
  }
  // A few motes along the edge, in the element's way: embers rise, frost glitters, storm jumps.
  for (let i = 0; i < 3; i++) {
    const d = 4 + ((c.now * 9 + i * 3.1) % 8), lift = el === 'fire' ? ((c.now * 6 + i) % 1) * 3 : 0;
    const jit = el === 'storm' ? (Math.random() - 0.5) * 2 : 0;
    g.globalAlpha = 0.5 + 0.4 * Math.sin(c.now * 11 + i * 2);
    g.fillStyle = el === 'frost' && i === 1 ? '#ffffff' : col;
    g.fillRect(Math.round(ox + Math.cos(a) * d + jit), Math.round(oy + Math.sin(a) * d - lift + jit), 1, 1);
  }
  g.globalAlpha = 1;
}

const RX = 11, RY = 13, LIFT = 10, DOTS = 64;

/** Round the hero, (x, y) its feet on screen, `now` the room's time: the ward. */
export function drawBladeMark(c: Ctx, h: Hero, x: number, y: number, now: number): void {
  if (!WEAPONS[h.weapon]?.spellblade || h.act === 'down') return;
  const g = c.glow, col = EL_COL[castElement(h)], k = shareOf(h), cy = y - LIFT;
  const crack = Math.max(0, 1 - (now - (h.wardAt ?? -9)) / MANA_SHIELD.crack);
  const broke = Math.max(0, 1 - (now - (h.wardBrokeAt ?? -9)) / MANA_SHIELD.broke);
  if (broke > 0) shards(c, x, cy, broke, col);
  if (k * HERO.stamina < 1) return void (g.globalAlpha = 1);
  // The shell: each dot holds while there's magic enough for it, so the light thins out evenly.
  const turn = c.now * 0.5, band = (c.now * 1.6) % (Math.PI * 2);
  for (let i = 0; i < DOTS; i++) {
    if (hash(i) > k * 1.05) continue;
    const a = (i / DOTS) * Math.PI * 2 + turn, near = Math.cos(a - band);
    g.globalAlpha = Math.min(1, 0.4 + 0.5 * k + (near > 0.8 ? 0.3 : 0) + crack * 0.6);
    g.fillStyle = crack > 0.4 || (near > 0.9 && k > 0.6) ? '#ffffff' : col;
    g.fillRect(Math.round(x + Math.cos(a) * RX), Math.round(cy + Math.sin(a) * RY), 1, 1);
  }
  // Full and bright: an inner shell and the ward's circle round your feet.
  const ground = Math.round(28 * k);
  for (let i = 0; i < ground; i++) {
    const a = (i / 28) * Math.PI * 2 - turn;
    g.globalAlpha = 0.45 + 0.5 * k;
    g.fillStyle = col;
    g.fillRect(Math.round(x + Math.cos(a) * 9), Math.round(y + Math.sin(a) * 3), 1, 1);
  }
  if (k > 0.66) {
    g.globalAlpha = 0.35 + (k - 0.66) * 1.5;
    g.fillStyle = col;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 - turn * 1.5;
      g.fillRect(Math.round(x + Math.cos(a) * (RX - 2)), Math.round(cy + Math.sin(a) * (RY - 2)), 1, 1);
    }
  }
  if (crack > 0) cracks(c, h, x, cy, crack);
  g.globalAlpha = 1;
}

/** A hit took magic: jagged white cracks running across the shell where it struck, fading. */
function cracks(c: Ctx, h: Hero, x: number, cy: number, k: number): void {
  const g = c.glow, seed = Math.floor((h.wardAt ?? 0) * 30);
  g.fillStyle = '#ffffff';
  g.globalAlpha = 0.5 + 0.5 * k;
  for (let j = 0; j < 3; j++) {
    // From a point on the shell, a crack zigzags along it and a little in, a pixel at a time.
    let a = hash(seed + j * 7) * Math.PI * 2, r = 1;
    const dir = hash(seed + j * 3) > 0.5 ? 1 : -1;
    for (let s = 0; s < 9; s++) {
      a += dir * 0.09;
      r += (hash(seed + j * 7 + s + 1) - 0.55) * 0.16;
      g.fillRect(Math.round(x + Math.cos(a) * RX * r), Math.round(cy + Math.sin(a) * RY * r), 1, 1);
    }
  }
}

/** The shield ran out: the shell flying apart in shards, fading. */
function shards(c: Ctx, x: number, cy: number, k: number, col: string): void {
  const g = c.glow, out = 1 + (1 - k) * 0.9;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + hash(i) * 0.4;
    g.globalAlpha = k;
    g.fillStyle = i % 3 ? col : '#ffffff';
    const px = Math.round(x + Math.cos(a) * RX * out), py = Math.round(cy + Math.sin(a) * RY * out + (1 - k) * 4);
    g.fillRect(px, py, 2, 1);
  }
}
