// The bodies drawn at twice the detail: every row the right width, eyes on every face, and parts that
// add up to the whole body exactly (so a body at rest is its whole sprite, with no seams).
import { describe, expect, it } from 'vitest';
import { expand, pixels, remap } from '../src/client/hd/grid';
import { HD_LOOKS } from '../src/client/hd/looks';
import { BUTCHER_PAL, BUTCHER_REG, GOBLIN_PAL, GOBLIN_REG, butcherRows, goblinRows } from '../src/client/hd/goblins';

const bodies: [string, string[], Record<string, string>, typeof GOBLIN_REG, string | undefined, boolean][] = [];
for (const [cls, ls] of Object.entries(HD_LOOKS)) ls.forEach((l, i) => {
  bodies.push([`${cls} ${i} front`, expand({ rows: l.body.down.rows, over: l.down }, l.body.w), l.pal, l.body.reg, l.glow, true]);
  bodies.push([`${cls} ${i} back`, expand({ rows: l.body.up.rows, over: l.up }, l.body.w), l.pal, l.body.reg, l.glow, false]);
});
for (const k of ['plain', 'heavy', 'lunger', 'looter', 'archer']) bodies.push([`goblin ${k}`, goblinRows(k, false), GOBLIN_PAL, GOBLIN_REG, '', true]);
bodies.push(['butcher', butcherRows(false), BUTCHER_PAL, BUTCHER_REG, '', true], ['butcher back', butcherRows(true), BUTCHER_PAL, BUTCHER_REG, '', false]);

describe('bodies at twice the detail', () => {
  it('has three looks for each of the five classes', () => {
    expect(Object.keys(HD_LOOKS).sort()).toEqual(['HEALER', 'MAGE', 'RANGER', 'ROGUE', 'WARRIOR']);
    for (const ls of Object.values(HD_LOOKS)) expect(ls.length).toBe(3);
  });
  it.each(bodies)('%s: rows even, eyes where they should be, parts make the whole', (_, rows, pal, reg, glow, face) => {
    const w = rows[0].length;
    for (const r of rows) expect(r.length).toBe(w);
    const px = pixels(rows, pal, reg, glow);
    // Eyes glow on a face, and never on a back.
    expect(px.eyes.length >= 2).toBe(face);
    // Every pixel of the whole is in exactly one part.
    const n = px.W * px.H;
    for (let i = 0; i < n; i++) {
      const owners = px.parts.filter((p) => p.rgba[i * 4 + 3]).length;
      expect(owners).toBe(px.whole.rgba[i * 4 + 3] ? 1 : 0);
    }
    expect(px.parts.some((p) => p.kind === 'arm')).toBe(true);
  });
  it('mirrors half rows and lays details over them', () => {
    expect(expand({ rows: ['ab'], over: { 0: '..x.' } }, 4)).toEqual(['abxa']);
    expect(remap(['aeb'], { e: 'H' })).toEqual(['aHb']);
  });
});
