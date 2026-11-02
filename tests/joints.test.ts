// Sprites cut into parts: every pixel goes to exactly one part, and a body at rest is laid out with
// nothing moved, so it draws as exactly today's sprite. A charge moves the weapon arm, never the head.
import { describe, expect, it } from 'vitest';
import { BUTCHER_CUT, SCRAPPER_CUT, heroCut, split, type Cut, type Jointed } from '../src/client/joints';
import { LAYOUT, layout } from '../src/client/figure';
import { heroPose } from '../src/client/heropose';
import { newPose } from '../src/client/motion';
import { newHero } from '../src/sim/hero';

/** A sprite's canvas size (its pixels plus the outline) and how it's cut. */
const BODIES: [string, number, number, Cut][] = [
  ['hero', 14, 18, heroCut(0, false)], ['mage', 14, 23, heroCut(5, true)], ['frost', 14, 20, heroCut(2, true)],
  ['scrapper', 13, 15, SCRAPPER_CUT], ['butcher', 20, 24, BUTCHER_CUT],
];

describe('sprites in parts', () => {
  it.each(BODIES)('%s: every pixel in exactly one part', (_, W, H, cut) => {
    const rgba = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) (rgba[i * 4] = i % 251), (rgba[i * 4 + 3] = (i * 7) % 5 ? 255 : 0);
    const parts = split(rgba, W, H, cut);
    for (let i = 0; i < W * H; i++) {
      const has = [...parts.values()].filter((p) => p.rgba[i * 4 + 3]);
      expect(has.length).toBe(rgba[i * 4 + 3] ? 1 : 0);
      if (has.length) expect(has[0].rgba[i * 4]).toBe(rgba[i * 4]);
    }
    expect([...parts.keys()]).toEqual(expect.arrayContaining(['head', 'torso', 'arm', 'back', 'legL', 'legR']));
  });

  it.each(BODIES)('%s: at rest nothing moves', (_, W, H, cut) => {
    const j = { s: { w: W, h: H }, parts: [], cut } as unknown as Jointed;
    layout(j, 40, 60, false, newPose());
    expect([LAYOUT.drop, LAYOUT.lean, LAYOUT.ax, LAYOUT.ay]).toEqual([0, 0, 0, 0]);
    expect([LAYOUT.left, LAYOUT.top]).toEqual([Math.round(40 - W / 2), 60 - H]);
  });

  it('a held charge draws the weapon arm back and up and leaves the head and body alone', () => {
    const h = newHero('me', 5, 5);
    Object.assign(h, { weapon: 'sword', act: 'charge', actT: 2, fx: 1, fy: 0 });
    const p = heroPose(h, 3, 0.5);
    expect([p.lean, p.crouch, p.stretch, p.ox, p.oy]).toEqual([0, 0, 0, 0, 0]);
    expect(p.reach).toBeLessThan(0);
    expect(p.raise).toBeGreaterThan(0);
  });

  it('a release knocks the body back against the blow, without stretching it', () => {
    const h = newHero('me', 5, 5);
    Object.assign(h, { weapon: 'staff', act: 'attack', heavy: true, power: 1, actT: 0.13, fx: 1, fy: 0 });
    const p = heroPose(h, 3, 0.5);
    expect(p.ox).toBeLessThan(0);
    expect([p.lean, p.crouch, p.stretch]).toEqual([0, 0, 0]);
  });
});
