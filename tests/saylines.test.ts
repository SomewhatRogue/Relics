import { describe, expect, it } from 'vitest';
import { clearTop, crosses, LINE_CHARS, LINE_H, wrapLine } from '../src/client/saylines';
import { textWidth } from '../src/client/pixfont';
import { WOOD_BEATS, WOOD_EXIT } from '../src/shared/hangwords';
import { EXPED_SAYS } from '../src/shared/expedjob';

/** An upright phone's scene across (390 at 3x, scaled by 6: Scene.resize; measured 195). */
const PHONE_W = 195;

describe('scene lines over a hero (saylines.ts)', () => {
  it('a short call stays one line', () => {
    expect(wrapLine('HEMPEN DONE')).toEqual(['HEMPEN DONE']);
  });

  it("Hempen's line is broken at spaces into lines that fit a phone, nothing lost", () => {
    const s = WOOD_BEATS.hempen, lines = wrapLine(s);
    expect(textWidth(s)).toBeGreaterThan(PHONE_W);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(s);
    for (const l of lines) expect(textWidth(l)).toBeLessThanOrEqual(PHONE_W - 4);
  });

  it('every scene line and expedition call fits a phone once broken', () => {
    const all = [...Object.values(WOOD_BEATS), ...Object.values(WOOD_EXIT), ...Object.values(EXPED_SAYS)].filter((s): s is string => typeof s === 'string');
    for (const s of all) for (const l of wrapLine(s)) expect(l.length <= LINE_CHARS || !l.includes(' ')).toBe(true);
  });

  it('a long word stands alone rather than being cut', () => {
    expect(wrapLine('a ' + 'x'.repeat(40) + ' b', 10)).toEqual(['a', 'x'.repeat(40), 'b']);
  });

  it('lines said at the same spot together stack, none crossing another', () => {
    const up: { x: number; y: number; lines: string[] }[] = [];
    for (const s of ['HEMPEN DONE', 'THE OAK IS BURNT OUT', WOOD_BEATS.hempen]) {
      const b = { x: 150, y: 80, lines: wrapLine(s) };
      b.y = clearTop(b, up);
      for (const o of up) expect(crosses(b, o)).toBe(false);
      up.push(b);
    }
    expect(up[2].y).toBeLessThan(up[1].y);
    expect(up[1].y).toBeLessThanOrEqual(up[0].y - LINE_H);
  });

  it('a line clear of the others stays where it was said', () => {
    const far = { x: 20, y: 80, lines: ['UP'] };
    expect(clearTop({ x: 250, y: 80, lines: ['LOOK UP'] }, [far])).toBe(80);
  });
});
