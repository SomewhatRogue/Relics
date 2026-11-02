import { describe, expect, it } from 'vitest';
import { SCORES } from '../src/client/scores';
import { parseTune } from '../src/client/score';
import { SAMPLES } from '../src/client/samplemap';

describe('music', () => {
  const all = Object.entries(SCORES).flatMap(([area, list]) => list.map((s) => [area, s] as const));

  it('has three pieces for every place, with names the bard can tell apart', () => {
    for (const list of Object.values(SCORES)) expect(list.length).toBe(3);
    const names = all.map(([, s]) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('writes every melody bar to fill its bar exactly, one bar per chord', () => {
    for (const [area, s] of all)
      for (const tune of [s.theme, s.answer].filter(Boolean) as string[]) {
        const bars = parseTune(tune);
        expect(bars.length, `${area} ${s.name}`).toBe(s.prog.length);
        bars.forEach((bar, i) => expect(bar.reduce((t, n) => t + n.len, 0), `${s.name} bar ${i + 1}`).toBe(s.beats * 2));
      }
  });

  it('gives every pattern part a pattern and every section a voice', () => {
    for (const [, s] of all) {
      for (const p of s.parts) if (p.role === 'arp' || p.role === 'perc') expect(p.pattern, s.name).toBeTruthy();
      expect(s.form).toMatch(/^[iAaBQ]+$/);
      expect(s.parts.some((p) => p.role === 'theme' && (p.in ?? 'A').includes('A')), s.name).toBe(true);
    }
  });

  it("keeps each instrument's recorded notes close together (an octave apart at most)", () => {
    for (const [id, notes] of Object.entries(SAMPLES)) {
      const roots = notes.map((n) => n.root).sort((a, b) => a - b);
      for (let i = 1; i < roots.length; i++) expect(roots[i] - roots[i - 1], id).toBeLessThanOrEqual(12);
    }
  });
});
