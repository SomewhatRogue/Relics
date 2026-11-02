/**
 * What's become of a job's house, painted over it (shared/houses.ts `fate`): half fallen in (the roof
 * caved, one gable end down, beams sticking out of the gap, rubble at the foot of the wall), fallen in
 * across its door (beams jammed in the doorway: no way in), or on fire (scorched over the windows; the
 * flames are drawn live). A big house has a second chimney. The footprint never changes.
 */
import type { Block } from '../shared/arena';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;
const BEAM = ['#3a2a1a', '#4a3420', '#2a1e14'];

export function paintFate(g: CanvasRenderingContext2D, rect: Rect, b: Block, w: number, roofH: number, tall: number): void {
  let seed = (b.look ?? 1) * 7 + 3;
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed % Math.max(1, n));
  if (b.big && b.kind === 'house') rect(Math.round(w * 0.12), 0, 5, Math.min(7, roofH - 2), '#57525e'), rect(Math.round(w * 0.12), 0, 5, 2, '#2a2733');
  if (b.fate === 'burning') for (let i = 0; i < 3; i++) {
    // Soot licking up the wall over the windows and the door.
    const x = Math.round(w * [0.22, 0.5, 0.72][i]);
    for (let y = roofH - 2; y < roofH + tall - 8; y++) rect(x - 2 + rnd(2), y, 4 + rnd(3), 1, y % 3 ? '#1a1410' : '#241a14');
  }
  if (b.fate === 'wrecked' || b.fate === 'blocked') {
    const left = (b.look ?? 0) % 2 === 0, gw = Math.round(w * (0.24 + rnd(10) / 100));
    // The gable end come down: cut away in a jagged slope, the wall left as a broken stub.
    for (let y = 0; y < roofH + tall - 6; y++) {
      const cut = Math.max(0, Math.round(gw * (1 - y / (roofH + tall - 6))) + rnd(3) - 1);
      if (cut > 0) g.clearRect(left ? 0 : w - cut, y, cut, 1);
      if (cut > 0) rect(left ? cut : w - cut - 1, y, 1, 1, y < roofH ? '#2a1e14' : '#3a3036');
    }
    // The roof caved in the middle: a sagging dark gap, broken rafters hanging into it.
    const hx = Math.round(w * (left ? 0.38 : 0.2)), hw = Math.round(w * 0.38), hh = Math.round(roofH * 0.75);
    for (let j = 0; j < hh; j++) {
      const inset = Math.round(Math.abs(Math.sin(j * 1.3 + w)) * 3);
      rect(hx + inset, 1 + j, hw - inset * 2, 1, j > hh - 3 ? '#1a1410' : '#0d0b10');
    }
    for (let i = 0; i < 4; i++) {
      const x0 = hx + 2 + rnd(hw - 4), len = 5 + rnd(6), dir = rnd(2) ? 1 : -1;
      for (let k = 0; k < len; k++) rect(x0 + Math.round((k * dir) / 2), 1 + k, 2, 1, BEAM[i % 3]);
    }
    // Beams poking out of the fallen end.
    for (let i = 0; i < 3; i++) {
      const y0 = roofH - 4 + rnd(tall), x0 = left ? 1 + rnd(gw) : w - 2 - rnd(gw);
      for (let k = 0; k < 7; k++) rect(x0 + (left ? -k : k), y0 - Math.round(k / 2), 2, 2, BEAM[(i + k) % 3]);
    }
    // Rubble along the foot of the wall.
    for (let i = 0; i < w / 2; i++) rect(rnd(w - 3), roofH + tall - 1 - rnd(5), 2 + rnd(3), 2, ['#45414c', '#3a3036', '#5a3d22', '#2a2420'][rnd(4)]);
  }
  if (b.fate === 'blocked') {
    // The doorway jammed with what fell: beams across it, rubble heaped in it.
    const dw = b.kind === 'barn' ? 12 : 6, dh = Math.min(tall - 3, b.kind === 'barn' ? 18 : 11), dx = Math.round(w / 2 - dw / 2), dy = roofH + tall - dh;
    rect(dx, dy, dw, dh, '#0d0b10');
    for (const [s, e] of [[0, 1], [1, 0]] as const) for (let k = -2; k < dw + 2; k++) rect(dx + k, dy + Math.round(dh * (s + (e - s) * ((k + 2) / (dw + 4)))) - 1, 2, 2, '#5a3d22');
    for (let i = 0; i < dw * 2; i++) rect(dx - 2 + rnd(dw + 4), dy + dh - 1 - rnd(Math.round(dh * 0.55)), 2, 2, ['#45414c', '#3a3036', '#2a2420', '#5a3d22'][rnd(4)]);
  }
}
