/**
 * Plants that are not copies (client/flora.ts; docs/design/flora.md, slice 2): a look is chosen by place, the
 * same every time, with real variety across a wood; a tint moves leaf greens and leaves bark and berries alone.
 */
import { describe, expect, it } from 'vitest';
import { CROWN, SIZES, TINTS, floraLook, tintCss, tintHex } from '../src/client/flora';

const wood = (kind: 'tree' | 'pine' | 'bush') => Array.from({ length: 400 }, (_, i) => floraLook(kind, 3 + (i % 20) * 2.7, 5 + Math.floor(i / 20) * 3.1, 0.5));

describe('a plant`s look', () => {
  it('is the same for the same place and differs between places', () => {
    expect(floraLook('tree', 12.5, 40.25, 0.6)).toEqual(floraLook('tree', 12.5, 40.25, 0.6));
    const keys = new Set(wood('tree').map((l) => `${l.shape}${l.green}${l.flip}`));
    expect(keys.size).toBeGreaterThanOrEqual(18);
  });

  it('gives a wood all three outlines and all four greens, with the old green the commonest', () => {
    const w = wood('tree'), n = (f: (l: (typeof w)[0]) => boolean) => w.filter(f).length;
    for (const s of [0, 1, 2]) expect(n((l) => l.shape === s)).toBeGreaterThan(80);
    for (const g of [1, 2, 3]) expect(n((l) => l.green === g)).toBeGreaterThan(40);
    expect(n((l) => l.green === 0)).toBeGreaterThan(n((l) => l.green === 1));
    expect(n((l) => l.flip)).toBeGreaterThan(120);
    expect(TINTS.length).toBe(4), expect(CROWN.length).toBe(3), expect(SIZES.length).toBe(3);
  });

  it('sizes a plant by its radius', () => {
    expect([0.25, 0.5, 0.8].map((r) => floraLook('tree', 4, 4, r).size)).toEqual([0, 1, 2]);
    expect([0.3, 0.45, 0.7].map((r) => floraLook('bush', 4, 4, r).size)).toEqual([0, 1, 2]);
  });

  it('keeps a pine one outline in two greens, and gives berries to a third of bushes and blossom to a few', () => {
    const p = wood('pine');
    expect(new Set(p.map((l) => l.shape))).toEqual(new Set([0]));
    expect(new Set(p.map((l) => l.green))).toEqual(new Set([0, 2]));
    const b = wood('bush'), berries = b.filter((l) => l.fruit === 1).length, blossom = b.filter((l) => l.fruit === 2).length;
    expect(berries).toBeGreaterThan(90), expect(berries).toBeLessThan(180);
    expect(blossom).toBeGreaterThan(20), expect(blossom).toBeLessThan(80);
    expect(wood('tree').every((l) => l.fruit === 0)).toBe(true);
  });

  it('tints leaf greens only: bark and berries are left as they are', () => {
    expect(tintHex(0x2f4a28, 0)).toBe(0x2f4a28);
    for (const g of [1, 2, 3]) expect(tintHex(0x2f4a28, g)).not.toBe(0x2f4a28);
    for (const g of [0, 1, 2, 3]) expect([tintHex(0x4a3420, g), tintHex(0x7a2a3a, g)]).toEqual([0x4a3420, 0x7a2a3a]);
    // Olive is warmer (more red, less blue), the blue-green cooler.
    const [o, b] = [tintHex(0x2f4a28, 1), tintHex(0x2f4a28, 2)];
    expect([(o >> 16) > 0x2f, (o & 255) < 0x28, (b >> 16) < 0x2f, (b & 255) > 0x28]).toEqual([true, true, true, true]);
    expect(tintCss('#2f4a28', 0)).toBe('#2f4a28');
  });
});
