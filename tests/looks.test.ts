import { describe, expect, it } from 'vitest';
import { newRun, runRoom } from '../src/sim/run';
import { board } from '../src/shared/jobs';
import { LOOKS, countryOf, lookOf, motifsOf, openAt } from '../src/client/looks';
import { scenesOf } from '../src/client/tilescenes';

/**
 * The pattern book (docs/design/forest-redraw.md): a map draws one look from its own name, lays that look's motifs on
 * open ground, and takes its scenes from the look. Kyle, 2026-11-23: "patterns and aesthetics that we can shuffle and
 * use for real looks that seem intentional".
 */
const maps = () => Array.from({ length: 6 }, (_, d) => board(d + 1)).flat().flatMap((j) => [0, 1].map((index) => runRoom({ ...newRun(j), index }).map));

describe('the pattern book', () => {
  it('every look names motifs and scenes, and every country has more than one look', () => {
    for (const l of LOOKS) expect(l.motifs.length > 0 && l.scenes.length > 0).toBe(true);
    for (const c of ['wood', 'fen', 'fields', 'yard'] as const) expect(LOOKS.filter((l) => l.country === c).length).toBeGreaterThan(1);
  });

  it('a map has one look of its own country, the same every time, with its motifs on open ground', () => {
    const seen = new Set<string>();
    let laid = 0;
    for (const m of maps()) {
      const c = countryOf(m), look = lookOf(m);
      if (!c) {
        expect(look).toBeNull();
        expect(motifsOf(m)).toEqual([]);
        continue;
      }
      expect(look!.country).toBe(c);
      expect(lookOf(m)).toBe(look);
      seen.add(look!.name);
      for (const o of motifsOf(m)) {
        laid++;
        expect(look!.motifs.some(([k]) => k === o.kind)).toBe(true);
        expect(openAt(m, o.x, o.y)).toBe(true);
      }
      for (const s of scenesOf(m)) expect(look!.scenes).toContain(s.kind);
    }
    expect(laid).toBeGreaterThan(10);
    expect(seen.size).toBeGreaterThan(2);
  });
});
