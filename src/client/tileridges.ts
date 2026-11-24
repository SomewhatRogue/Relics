/**
 * Ridges (docs/design/forest-redraw.md, "Ridges"): the pattern book's low banks, where flat ground is drawn stepping
 * down toward you: a lit lip of turf (or pale earth), a short dark face of earth with a stone or two in it, a shadow
 * at its foot; the line bows and wavers and dies into the ground at each end. Paint only: nobody is stopped by one
 * (a real rise is the room's, shared/arena.ts ledges, drawn by three/landledges.ts), and at five to seven pixels it
 * reads as a step in the land, not a wall. It parts for a path or laid ground. Laid before the zones.
 */
import type { GameMap } from '../shared/arena';
import { KX, KZ, type Rect } from './tilekit';
import { motifsOf } from './looks';
import { openPx } from './tilelitter';
import { hash } from './tiletrees';

const TURF = ['#2a3a25', '#43583a', '#56703f'], PALE = ['#453b31', '#5a4c3c', '#6b5b48'], FACE = ['#15100b', '#2e2318', '#3a2c1e'], STONE = '#4a4652';

export function paintRidges(m: GameMap, rect: Rect): void {
  const floor = m.theme.floor as string, lip = floor === 'grass' || floor === 'wheat' ? TURF : PALE, open = openPx(m);
  for (const o of motifsOf(m)) {
    if (o.kind !== 'ridge') continue;
    const L = Math.round(o.rx * KX), cx = Math.round(o.x * KX), cy = Math.round(o.y * KZ), p = (o.v % 89) * 0.07;
    // (Five to seven pixels of face; a bow of up to half a tile either way.)
    const tall = 5 + (o.v % 3), bow = (((o.v >> 2) % 9) - 4) * 1.4;
    for (let i = -L; i <= L; i++) {
      const u = (i + L) / (2 * L), s = Math.sin(u * Math.PI), px = cx + i;
      const y0 = cy + Math.round(s * bow + Math.sin(i * 0.09 + p) * 1.5 + o.a * i * 0.12), h = Math.round(tall * Math.min(1, s * 2.4));
      if (h < 1 || !open(px, y0) || !open(px, y0 + h)) continue;
      // The lip: turf catching the light, ragged along its top, brightest at the edge.
      if (h > 2 && hash(px >> 1, o.v, 3) < 0.5) rect(px, y0 - 2, 1, 1, lip[0]);
      rect(px, y0 - 1, 1, 1, lip[1]);
      rect(px, y0, 1, 1, h > 2 ? lip[2] : lip[1]);
      // The face: dark under the lip's overhang, earth below with a paler streak, a stone here and there, a dark foot.
      const stone = h > 3 && hash(px >> 1, o.v, 7) < 0.08;
      for (let j = 1; j <= h; j++) rect(px, y0 + j, 1, 1, j === 1 || j === h ? FACE[0] : stone && j <= 3 ? STONE : FACE[1 + ((px + j * 2) % 5 === 0 ? 1 : 0)]);
      rect(px, y0 + h + 1, 1, 1, 'rgba(0, 0, 0, 0.4)');
      if (h > 2) rect(px, y0 + h + 2, 1, 1, 'rgba(0, 0, 0, 0.22)');
    }
  }
}
