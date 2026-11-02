/**
 * The halls' floor marks (shared/townhalls.ts): the tower's chalked circle, a rug, rushes strewn on
 * stone, the tavern's sawdust, a pelt for a rug, the forge's soot, the hounds' bowls. Painted once
 * with the other marks (marks.ts), each from its own seed.
 */
import type { Mark } from '../shared/arena';
import type { Painter } from './groundpaint';

export const HALL_FLOOR: Partial<Record<Mark['kind'], Painter>> = {
  chalk(rect, rng, x, y, w, h) {
    // Two rings in chalk going grey with feet, cut into three (fire, frost, storm), and Vell's sums
    // round the rim between them: some rubbed out to a smear and done again beside.
    const cx = x + w / 2, cy = y + h / 2, at = (a: number, k: number) => [Math.round(cx + Math.cos(a) * (w / 2) * k), Math.round(cy + Math.sin(a) * (h / 2) * k)];
    for (const k of [1, 0.78]) for (let a = 0; a < Math.PI * 2; a += 0.025) {
      if (rng.next() < 0.12) continue;
      const [px, py] = at(a, k);
      rect(px, py, 1, 1, rng.next() < 0.3 ? '#8a8698' : '#b8b4c8');
    }
    for (let i = 0; i < 28; i++) {
      const [px, py] = at((i / 28) * Math.PI * 2 + rng.next() * 0.08, 0.89);
      if (rng.next() < 0.3) rect(px - 1, py - 1, 3, 2, 'rgba(184,180,200,0.25)');
      else for (let j = 0; j < 2 + rng.int(2); j++) rect(px - 1 + j, py - 1 + rng.int(2), 1, 1 + rng.int(2), '#a8a4b8');
    }
    // The three lines, and a little sign in each part, chalked in its own colour.
    const signs = ['#c86a3a', '#8ab8d8', '#c8c070'];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
      for (let t = 0; t <= 0.78; t += 0.03) {
        const [px, py] = at(a, t);
        if (rng.next() > 0.08) rect(px, py, 1, 1, '#9894a8');
      }
      const [sx, sy] = at(a + Math.PI / 3, 0.45), c = signs[i];
      if (i === 0) rect(sx, sy - 2, 1, 1, c), rect(sx - 1, sy - 1, 3, 2, c), rect(sx, sy + 1, 1, 1, c);
      if (i === 1) rect(sx - 2, sy, 5, 1, c), rect(sx, sy - 2, 1, 5, c), rect(sx - 1, sy - 1, 1, 1, c), rect(sx + 1, sy + 1, 1, 1, c);
      if (i === 2) rect(sx + 1, sy - 2, 1, 2, c), rect(sx, sy, 2, 1, c), rect(sx - 1, sy + 1, 1, 2, c);
    }
  },
  rug(rect, rng, x, y, w, h) {
    rect(x, y, w, h, '#3a1414'), rect(x + 2, y + 2, w - 4, h - 4, '#5a2422');
    for (let j = 6; j < h - 6; j += 8) for (let i = 6; i < w - 6; i += 8) rect(x + i, y + j, 3, 3, (i + j) % 16 ? '#7a3a2a' : '#8a6a3a');
    for (let i = 0; i < w; i += 2) if (rng.next() < 0.6) rect(x + i, y - 1, 1, 1, '#8a7a5a'), rect(x + i, y + h, 1, 1, '#8a7a5a');
  },
  rushes(rect, rng, x, y, w, h) {
    for (let i = 0; i < (w * h) / 20; i++) {
      const c = ['#6a6a3a', '#7a7444', '#5a5a32'][rng.int(3)];
      rng.next() < 0.5 ? rect(x + rng.int(w), y + rng.int(h), 3, 1, c) : rect(x + rng.int(w), y + rng.int(h), 1, 2, c);
    }
  },
  sawdust(rect, rng, x, y, w, h) {
    for (let i = 0; i < (w * h) / 10; i++) rect(x + rng.int(w), y + rng.int(h), 1, 1, ['#8a7a5a', '#9a8a62', '#6b5a3a'][rng.int(3)]);
    for (let i = 0; i < w / 30; i++) {
      const sx = x + rng.int(w - 10), sy = y + rng.int(h - 5);
      rect(sx, sy, 8 + rng.int(6), 3 + rng.int(3), 'rgba(30,16,8,0.35)');
    }
  },
  pelt(rect, _rng, x, y, w, h) {
    // A bear's hide, laid flat: the body, four legs, the head.
    const c = '#4a3a2e', d = '#3a2c22';
    rect(x + 6, y + 3, w - 12, h - 6, c), rect(x + 2, y, 6, 5, c), rect(x + w - 8, y, 6, 5, c), rect(x + 2, y + h - 5, 6, 5, c), rect(x + w - 8, y + h - 5, 6, 5, c);
    rect(x + w - 6, y + Math.round(h / 2) - 4, 7, 8, c), rect(x + w, y + Math.round(h / 2) - 1, 2, 2, '#14121a');
    rect(x + 8, y + 5, w - 16, h - 10, d);
  },
  soot(rect, rng, x, y, w, h) {
    for (let i = 0; i < (w * h) / 6; i++) {
      const dx = rng.int(w), dy = rng.int(h), k = Math.hypot(dx / w - 0.3, dy / h - 0.3);
      if (rng.next() > k) rect(x + dx, y + dy, 2, 1, ['#1a1618', '#221e20', '#2a2426'][rng.int(3)]);
    }
  },
  bowls(rect, _rng, x, y) {
    for (const [dx, water] of [[0, true], [11, false]] as const) {
      rect(x + dx, y, 8, 4, '#5a3d22'), rect(x + dx + 1, y, 6, 2, water ? '#2e3a4a' : '#3a2818');
    }
  },
};
