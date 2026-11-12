/**
 * THE LEECHMAN's old windlass on the west bank of its pool (shared/fenarena.ts `map.windlass`; the room's side is
 * sim/leechwind.ts): a wooden drum on two timbers, an iron crank, a chain running down into the water. A hero's hands turn the
 * crank when they hold it (the drum scrolls, the chain draws taut and drips); when the water is out the chain lies on the mud;
 * after the water comes back it is stuck fast a while (rust, the chain slack, a rattle when tried). Drawing only.
 */
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';
import { LEECH } from './leechstate';

const TAU = Math.PI * 2;

export function drawWindlass(c: Ctx, x: number, y: number, heroes: readonly Hero[], drained: boolean, now: number): void {
  const g = c.lit, w = LEECH.wind, held = !!w.by && !drained, stuck = now < w.stuckUntil && !drained, rattle = now - w.rattle < 0.4 ? Math.round(Math.sin(now * 60) * 1.5) : 0;
  const X = Math.round(x), Y = Math.round(y), P = (dx: number, dy: number, ww: number, hh: number, col: string) => ((g.fillStyle = col), g.fillRect(X + dx, Y + dy, ww, hh));
  const ang = w.p * TAU * 3 + (held ? Math.sin(now * 14) * 0.2 : 0);
  // Its shadow and the mud round its feet.
  g.fillStyle = 'rgba(8,6,12,0.5)';
  for (let dy = -3; dy <= 3; dy++) g.fillRect(X - 17 + Math.abs(dy), Y + dy + 1, 34 - Math.abs(dy) * 2, 1);
  P(-15, -2, 8, 3, '#2a2016'), P(8, -2, 8, 3, '#2a2016'), P(-13, 1, 4, 1, '#4a3a26');
  // The two timbers, wet black oak, a brace to each.
  for (const sx of [-12, 8]) {
    P(sx, -28, 5, 28, '#6a5030'), P(sx, -28, 1, 28, '#9a7a4a'), P(sx + 4, -28, 1, 28, '#3a2c1c'), P(sx - 1, -29, 7, 2, '#4a3a26');
    P(sx + (sx < 0 ? -2 : 5), -9, 2, 9, '#2e2216');
  }
  // The drum between them: staves scrolling round as it turns, iron bands, the chain wrapped on it.
  const rust = stuck ? '#a8642e' : '#7a7a88';
  P(-8, -25, 16, 15, '#8a6a40'), P(-8, -25, 16, 2, '#b8944c'), P(-8, -12, 16, 2, '#5a4328');
  c.glow.globalAlpha = 0.28, c.glow.fillStyle = '#e8c888', c.glow.fillRect(X - 8, Y - 25, 16, 1), c.glow.fillRect(X - 12, Y - 28, 1, 26), c.glow.fillRect(X + 8, Y - 28, 1, 26), c.glow.globalAlpha = 1;
  for (let i = 0; i < 4; i++) { const sx = -8 + ((i * 5 + Math.floor(((ang / TAU) * 20) % 5) + 20) % 16); P(sx, -23, 1, 11, '#4a3820'); }
  P(-8, -25, 2, 15, rust), P(6, -25, 2, 15, rust), P(-1, -24, 2, 13, stuck ? '#6a4224' : '#3e3e48');
  for (let i = 0; i < 3; i++) P(2 + i, -21 + (i % 2) * 5, 1, 4, '#8a8a94');
  // The crank on the near timber: the arm turning round the axle, the handle across its end.
  const ax = -16, ay = -17, hx = ax - 1 + Math.round(Math.cos(ang) * 2), hy = ay + Math.round(Math.sin(ang) * 8);
  for (let i = 0; i <= 8; i++) P(Math.round(ax + (hx - ax) * (i / 8)), Math.round(ay + (hy - ay) * (i / 8)) + (rattle ? 1 : 0), 2, 2, i % 3 ? rust : '#8a8a94');
  P(ax - 1, ay - 1, 4, 4, '#2a2a30'), P(ax, ay, 2, 2, '#9a9aa4');
  P(hx - 2 + rattle, hy - 1, 4, 3, '#8a6a3a'), P(hx - 2 + rattle, hy - 1, 4, 1, '#b08a50');
  // The chain, from the drum down to the water: slack and sagging, or drawn taut and dripping while it turns; lying out in the mud when drained.
  const sag = held ? 1 : drained ? 3 : 6, run = drained ? 46 : 30;
  for (let i = 0; i < run; i += 2) {
    const k = i / run, cy = -14 + k * 17 + Math.sin(k * Math.PI) * sag + (held ? Math.sin(now * 20 + i) * 0.5 : 0);
    g.fillStyle = (i / 2) % 2 ? '#8a8a94' : '#3e3e48';
    g.globalAlpha = !drained && k > 0.6 ? 1 - (k - 0.6) * 1.6 : 1;
    g.fillRect(X + 9 + i, Y + Math.round(cy), 2, 2);
  }
  g.globalAlpha = 1;
  if (held) for (let i = 0; i < 4; i++) { const ph = (now * 2.5 + i * 0.27) % 1; g.fillStyle = '#9fe8ff', g.fillRect(X + 20 + i * 4, Y - 6 + Math.round(ph * 8), 1, 2); }
  // The hero's hands on the handle.
  if (held) {
    const hero = heroes.find((h) => h.id === w.by);
    g.fillStyle = hero ? '#e8c8a0' : '#d8b890';
    g.fillRect(X + hx - 2, Y + hy - 2, 2, 2), g.fillRect(X + hx, Y + hy + 1, 2, 2);
  } else if (!drained && !stuck) {
    // Ready: a faint warm glint on the handle, so it reads as something to take hold of.
    c.glow.globalAlpha = 0.35 + 0.25 * Math.sin(now * 3), c.glow.fillStyle = '#ffd890', c.glow.fillRect(X + hx - 1, Y + hy - 1, 3, 3), c.glow.globalAlpha = 1;
  }
}
