/**
 * What you can tell about each way out of a layout-4 fork from where you stand (shared/ways.ts): its
 * word over the gap, lit even before the room's cleared, and a cue just past it: smoke rolling up, crows
 * wheeling over, firelight and a drum's ripple, the glint of water, webs across the gap, moths in the
 * quiet; and what you hear as you come near (drums, someone crying out). The flat view and the 2.5D view
 * both draw these from the room's own roads, so they agree. Paint and sound only.
 */
import type { GameMap, Road } from '../shared/arena';
import { WAYS, type WayKind } from '../shared/ways';
import type { Ctx } from './draw';
import { drawText, textWidth } from './pixfont';

/** Each way's word colour. */
export const WAY_COL: Record<WayKind, string> = { smoke: '#d8ccc0', cries: '#f0c8b8', crows: '#c0b8d0', drums: '#ffa060', quiet: '#a8e0b0', ford: '#9fe8ff', webs: '#e8e8f4', nets: '#ffd890' };

/** Where a way's cue is, in tiles: in its gap (behind the back wall for a gap in it), and how high. */
export function cueAt(r: Road, map: GameMap): { x: number; y: number; z: number } {
  const a = r.area, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
  if (r.side === 'E') return { x: map.w - 0.6, y: cy, z: 0 };
  if (r.side === 'W') return { x: 0.6, y: cy, z: 0 };
  return { x: cx, y: -0.6, z: 1.2 };
}

/** The cue itself at (x, y) on screen (its foot), as time goes. */
export function drawCue(c: Ctx, way: WayKind, x: number, y: number, seed: number): void {
  const t = c.now, g = c.glow;
  if (way === 'smoke') {
    // A thick column rolling up past the gap, pale enough to read against the dark (something big is burning).
    const l = c.lit;
    for (let j = 0; j < 12; j++) {
      const p = (t * 0.18 + j / 12 + seed * 0.13) % 1, r = 4 + p * 12;
      l.globalAlpha = (1 - p) * 0.6;
      l.fillStyle = p < 0.25 ? '#4a4450' : p < 0.6 ? '#7a7480' : '#9a94a0';
      l.beginPath(), l.ellipse(Math.round(x + Math.sin(p * 4 + j * 1.3) * 5 + p * 20), Math.round(y - 8 - p * 90), r, r * 0.8, 0, 0, Math.PI * 2), l.fill();
    }
    l.globalAlpha = 1;
    // Firelight at its root.
    g.globalAlpha = 0.3 + 0.15 * Math.sin(t * 11 + seed);
    g.fillStyle = '#ff7a30', g.fillRect(Math.round(x - 4), Math.round(y - 6), 8, 4);
    g.globalAlpha = 1;
    return;
  }
  if (way === 'crows') {
    // Wheeling over something on the ground past the gap.
    for (let i = 0; i < 5; i++) {
      const a = t * (0.9 + i * 0.07) + i * 1.3, bx = Math.round(x + Math.cos(a) * (10 + i * 2)), by = Math.round(y - 34 + Math.sin(a) * 5 - i * 2), flap = Math.floor(t * 8 + i) % 2;
      c.lit.fillStyle = '#16141c';
      c.lit.fillRect(bx - 1, by, 3, 1), c.lit.fillRect(bx - 3, by - flap, 2, 1), c.lit.fillRect(bx + 2, by - flap, 2, 1);
    }
    return;
  }
  if (way === 'drums') {
    // Their firelight on the gap, and the drum's ripple going out on each beat.
    const beat = (t / 0.55) % 1;
    g.globalAlpha = 0.25 + 0.1 * Math.sin(t * 9);
    g.fillStyle = '#ff7a30', g.fillRect(Math.round(x - 6), Math.round(y - 10), 12, 6);
    g.globalAlpha = 0.6 * (1 - beat);
    g.fillStyle = '#ffb060';
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2, r = 4 + beat * 14;
      g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 8 + Math.sin(a) * r * 0.45), 1, 1);
    }
    g.globalAlpha = 1;
    return;
  }
  if (way === 'ford') {
    // Water past the gap, catching the light.
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.6 + i * 0.37) % 1;
      g.globalAlpha = 0.7 * Math.sin(k * Math.PI);
      g.fillStyle = i % 2 ? '#9fe8ff' : '#e8fbff';
      g.fillRect(Math.round(x - 10 + ((i * 7) % 20)), Math.round(y - 4 + (i % 3) * 2), 3 + (i % 2) * 2, 1);
    }
    g.globalAlpha = 1;
    return;
  }
  if (way === 'webs') {
    // Webs strung across the gap, catching the light.
    c.lit.globalAlpha = 0.55;
    c.lit.fillStyle = '#d8d8e8';
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.32;
      for (let r = 2; r < 16; r += 2) c.lit.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 18 + Math.sin(a) * r * -0.8 + 14), 1, 1);
    }
    for (const r of [6, 11]) for (let k = 0; k < 9; k++) c.lit.fillRect(Math.round(x + Math.cos(-Math.PI / 2 + (k - 4) * 0.24) * r), Math.round(y - 4 - Math.sin(Math.PI / 2 + (k - 4) * 0.24) * r * 0.8), 1, 1);
    c.lit.globalAlpha = 1;
    return;
  }
  if (way === 'nets') {
    // The Staithe past the gap: two lamps on their posts over water, a net hung between them, stirring.
    const l = c.lit, sway = Math.sin(t * 1.3 + seed);
    l.fillStyle = '#3a2a1a';
    l.fillRect(Math.round(x - 10), Math.round(y - 18), 1, 18), l.fillRect(Math.round(x + 9), Math.round(y - 18), 1, 18);
    l.fillStyle = '#a89a72';
    for (let j = 0; j < 9; j++) for (let i = 0; i < 18; i++) if ((i + j) % 3 === 0) l.fillRect(Math.round(x - 9 + i + sway * (j / 9) * 2), Math.round(y - 16 + j + Math.sin(i / 3) * 0.6), 1, 1);
    g.globalAlpha = 0.65 + 0.2 * Math.sin(t * 7 + seed);
    g.fillStyle = '#ffd27a';
    g.fillRect(Math.round(x - 11), Math.round(y - 21), 3, 3), g.fillRect(Math.round(x + 8), Math.round(y - 21), 3, 3);
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.5 + i * 0.29) % 1;
      g.globalAlpha = 0.6 * Math.sin(k * Math.PI);
      g.fillStyle = i % 2 ? '#ffd27a' : '#9fe8ff';
      g.fillRect(Math.round(x - 8 + ((i * 5) % 16)), Math.round(y - 2 + (i % 2) * 2), 3, 1);
    }
    g.globalAlpha = 1;
    return;
  }
  if (way === 'quiet') {
    // Nothing moving but a few moths.
    g.fillStyle = '#e8e0b0';
    for (let i = 0; i < 3; i++) g.fillRect(Math.round(x + Math.sin(t * 1.7 + i * 2) * 7), Math.round(y - 14 + Math.cos(t * 2.3 + i) * 4), 1, 1);
  }
  // CRIES: heard, not seen (soundscape.ts).
}

/** A way's word, beside its gap (as the old road labels sat), dim till the way's open. */
export function drawWayWord(g: CanvasRenderingContext2D, r: Road, x: number, y: number, open: boolean): void {
  const word = r.way ? WAYS[r.way].word : r.label, tw = textWidth(word);
  const tx = r.side === 'W' ? x : r.side === 'E' ? x - tw : x - tw / 2;
  g.globalAlpha = open ? 1 : 0.7;
  drawText(g, word, Math.round(tx), Math.round(y), r.way ? WAY_COL[r.way] : r.road === 'high' ? '#ffd27a' : '#9fe8ff');
  g.globalAlpha = 1;
}
