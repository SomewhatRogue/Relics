import { describe, expect, it } from 'vitest';
import { AREAS, GATES, woodMap } from '../src/shared/wood';
import { VIGNETTES } from '../src/shared/woodscenes';
import { collide, useMap } from '../src/shared/arena';
import { HERO } from '../src/shared/tuning';

/** Everywhere a hero can walk in the wood with every gate open, on a half-tile grid. */
function reach(): [number, number][] {
  const m = woodMap();
  m.blocks = m.blocks.filter((b) => b.kind !== 'fence');
  useMap(m);
  const S = 0.5, W = Math.round(m.w / S), H = Math.round(m.h / S), seen = new Uint8Array(W * H), out: [number, number][] = [];
  const free = (i: number, j: number) => {
    const p = { x: i * S, y: j * S };
    collide(p, HERO.radius);
    return Math.hypot(p.x - i * S, p.y - j * S) < 0.05;
  };
  const q: [number, number][] = [[Math.round(m.hero.x / S), Math.round(m.hero.y / S)]];
  seen[q[0][1] * W + q[0][0]] = 1;
  while (q.length) {
    const [i, j] = q.pop()!;
    out.push([i * S, j * S]);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= W || b >= H || seen[b * W + a]) continue;
      seen[b * W + a] = 1;
      if (free(a, b)) q.push([a, b]);
    }
  }
  return out;
}

describe('the wood either side of the way through', () => {
  const walked = reach(), open = [...AREAS, ...GATES.map((g) => g.open)];
  const inOpen = (x: number, y: number) => open.some((r) => x >= r.x - 0.5 && x <= r.x + r.w + 0.5 && y >= r.y - 0.5 && y <= r.y + r.h + 0.5);

  it('lets nobody off the way: every step you can take is in a clearing or a way between', () => {
    expect(walked.length).toBeGreaterThan(1000);
    expect(walked.filter(([x, y]) => !inOpen(x, y))).toEqual([]);
  });

  it('still reaches every clearing and the road out', () => {
    for (const r of AREAS) expect(walked.some(([x, y]) => x > r.x + 1 && x < r.x + r.w - 1 && y > r.y + 1 && y < r.y + r.h - 1)).toBe(true);
  });

  it('keeps every scene past the trees well out of reach', () => {
    for (const v of VIGNETTES) for (const [px, py] of [[v.x, v.y], v.to ?? [v.x, v.y]]) {
      const closest = Math.min(...walked.map(([x, y]) => Math.hypot(x - px, y - py)));
      expect(closest).toBeGreaterThan(2.4);
    }
  });
});
