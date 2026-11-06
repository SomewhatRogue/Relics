// The heroes' looks (Kyle, 2026-11-05): people with plain dark eyes, each class its own outline, three
// looks a class that really differ; and the eye dial (PLAN.md "red eyes and gold eyes"): a hero with no
// dial draws plain, and setting it changes the drawing, red one way and gold the other.
import { describe, expect, it } from 'vitest';
import { LOOK_DEFS, type Cls } from '../src/client/herolooks';
import { dialLook, drawDialAura, drawDialEyes, type DialCtx } from '../src/client/heroeyes';

const CLS: Cls[] = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'];
/** The colours sprites.ts treats as light (glow layer): no hero pixel may be one of them. */
const GLOW = ['#ff4a3a', '#7dff8a', '#ffd27a', '#c9a8ff', '#ffe9a8', '#bfe0ff', '#ff8a3a'];
const shape = (parts: { 1: number; 2: number }[]) => new Set(parts.map((p) => p[1] + ',' + p[2]));

describe('hero looks', () => {
  it('three looks a class, none with a glowing pixel, eyes dark and where the look says', () => {
    for (const c of CLS) {
      expect(LOOK_DEFS[c]).toHaveLength(3);
      for (const d of LOOK_DEFS[c]) {
        for (const p of [...d.down, ...d.up]) expect(GLOW).not.toContain(p[p.length - 1]);
        const [row, l, r] = d.eyes, at = (x: number) => d.down.find((p) => p[1] === x && p[2] === row);
        expect(at(l)?.[3]).toBe('#16121a');
        expect(at(r)?.[3]).toBe('#16121a');
      }
    }
  });

  it('each class has its own outline', () => {
    const outlines = CLS.map((c) => [...shape(LOOK_DEFS[c][0].down as never)].sort().join(' '));
    expect(new Set(outlines).size).toBe(5);
  });

  it('a class looks differ in colour, not only in one or two pixels', () => {
    for (const c of CLS) {
      const cols = LOOK_DEFS[c].map((d) => d.down.map((p) => p[p.length - 1]).join());
      expect(new Set(cols).size).toBe(3);
    }
  });
});

/** A context that only records what's drawn, per layer. */
function fake(now = 2): DialCtx & { calls: string[] } {
  const calls: string[] = [];
  const layer = (name: string) => ({
    fillStyle: '' as string | CanvasGradient | CanvasPattern,
    globalAlpha: 1,
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push(`${name} ${String(this.fillStyle)} ${x},${y},${w},${h} ${this.globalAlpha.toFixed(2)}`);
    },
  });
  return { lit: layer('lit'), glow: layer('glow'), now, calls };
}
const draw = (dial: number | undefined) => {
  const c = fake(), L = dialLook(dial);
  drawDialEyes(c, L, 10, 13, 20, 0.3);
  drawDialAura(c, L, 12, 30, 12, 0.3);
  return c.calls;
};

describe('the eye dial', () => {
  it('a hero with no dial (or the middle) draws nothing extra: plain eyes', () => {
    expect(draw(undefined)).toEqual([]);
    expect(draw(0)).toEqual([]);
  });

  it('near the middle only a faint tint in the eyes', () => {
    const calls = draw(0.25);
    expect(calls.length).toBe(2);
    expect(calls.every((s) => s.startsWith('glow'))).toBe(true);
  });

  it('red and gold draw differently, and more toward the ends', () => {
    const red = draw(-1), gold = draw(1), half = draw(-0.5);
    expect(red).not.toEqual(gold);
    expect(red.length).toBeGreaterThan(half.length);
    // Red smokes (matter, on the lit layer); gold never puts anything on the lit layer.
    expect(red.some((s) => s.startsWith('lit'))).toBe(true);
    expect(gold.some((s) => s.startsWith('lit'))).toBe(false);
    expect(dialLook(1).halo).toBe(1);
    expect(dialLook(-1).halo).toBe(0);
    expect(dialLook(-1).smoke).toBe(1);
  });
});
