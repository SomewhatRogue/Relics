/**
 * A friend down or out is marked by their shield fallen on the ground, never a skull: in this world
 * "out" is never dead (Kyle, 2026-11-06). The goblins' skulls (the hexer's fetish, a BIG ONE's stake)
 * are drawn in their own code and aren't icons.
 */
import { describe, expect, it, vi } from 'vitest';
import { ICONS } from '../src/client/icons';

describe('the mark on a fallen friend', () => {
  it('there is no skull among the HUD icons, and the fallen shield is a whole grid', () => {
    expect('skull' in ICONS).toBe(false);
    const g = ICONS.fallen;
    expect(g.length).toBe(7);
    for (const row of g) expect(row.length).toBe(g[0].length);
    // Gold over it, pointing up (they can be raised), and the shield's blue below.
    expect(g[0]).toContain('Y');
    expect(g.slice(2).join('')).toContain('u');
  });

  it('the CSS gets --ic-fallen, and no --ic-skull', async () => {
    const set = new Map<string, string>();
    vi.stubGlobal('document', {
      documentElement: { style: { setProperty: (k: string, v: string) => void set.set(k, v) } },
      createElement: () => ({ getContext: () => ({ fillRect: () => {}, set fillStyle(_: string) {} }), toDataURL: () => 'data:', width: 0, height: 0 }),
    });
    const { iconVars } = await import('../src/client/icons');
    iconVars();
    expect(set.has('--ic-fallen')).toBe(true);
    expect(set.has('--ic-skull')).toBe(false);
    vi.unstubAllGlobals();
  });
});
