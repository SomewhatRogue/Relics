// Vowed pieces grow (docs/design/holy-and-hungry.md 5b): clean jobs only, PRE-WAR to a little above TURNING.
import { describe, expect, it } from 'vitest';
import { GROW, growKit, growMult, grown, grownBy, ripe, type GrowItem } from '../src/shared/vowgrow';
import { rollVowed } from '../src/shared/vowed';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { budget } from '../src/shared/tuning';
import { growRow, VOWEDW } from '../src/client/vowedwords';

const ring = (): GrowItem => rollVowed(new Rng(3), 'RANGER', 'ring')!;
const sum = (it: GrowItem) => (it.mods ?? []).reduce((s, m) => s + m.v, 0);

describe('vowed pieces grow', () => {
  it('from nothing to the top over thirty units, then no further', () => {
    const r = ring();
    expect(growMult(r, 0)).toBe(1);
    expect(growMult(r, 1)).toBeCloseTo((budget('turning', 'ring') * GROW.top) / budget('tolmouth', 'ring'));
    const half = grownBy(r, 15), full = grownBy(half, 15), past = grownBy(full, 10);
    expect(sum(half)).toBeGreaterThan(sum(r));
    expect(sum(full)).toBeGreaterThan(sum(half));
    expect(sum(past)).toBeCloseTo(sum(full));
    expect(ripe(half)).toBe(false);
    expect(ripe(full)).toBe(true);
    expect(grown(half)).toBeCloseTo(0.5);
  });
  it('keeps its modifiers as given, so growing never compounds', () => {
    const r = ring(), a = grownBy(grownBy(grownBy(r, 5), 5), 5), b = grownBy(r, 15);
    expect(a.mods).toEqual(b.mods);
    expect(a.vowBase).toEqual(r.mods);
  });
  it('a clean job grows what is worn; a corrupt one, nothing', () => {
    const r = ring(), p = { weapon: 'longbow', arms: {}, armor: null, rings: [r], want: 0 };
    growKit(p, 2);
    expect((p.rings[0] as GrowItem).worn).toBe(2);
    const was = p.rings[0];
    p.want = 40;
    growKit(p, 2);
    expect(p.rings[0]).toBe(was);
    p.want = 0;
    p.rings = [...p.rings, { ...rollHungry(new Rng(1), 'RANGER'), slot: 'ring' }];
    growKit(p, 2);
    expect(p.rings[0]).toBe(was);
  });
  it('the card row: how far, how long, and when it has stopped', () => {
    expect(growRow(0.5, 15, false)[1]).toContain('50% grown');
    expect(growRow(0.5, 15, false)[1]).toContain('about 15 jobs');
    expect(growRow(0.99, 0.3, false)[1]).toContain('about 1 job.');
    expect(growRow(0.2, 24, true)[1]).toContain(VOWEDW.frozen);
    expect(growRow(1, 0, false)[1]).toBe(VOWEDW.full);
  });
});
