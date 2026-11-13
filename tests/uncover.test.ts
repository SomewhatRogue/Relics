import { describe, expect, it } from 'vitest';
import { overlaps, topLine, type Box } from '../src/client/uncover';
import { HUD_LINE, setTopLine, setTopPush, topPush } from '../src/client/phoneband';

describe('the top of the screen never hides danger (uncover.ts)', () => {
  it('a danger box under a panel is caught; one beside it is not', () => {
    const plate: Box = [30, 76, 360, 150];
    expect(overlaps([100, 120, 130, 170], plate)).toBe(true);
    expect(overlaps([100, 151, 130, 190], plate)).toBe(false);
  });
  it('the top line is the lowest edge docked at the top; a bottom-docked card does not count', () => {
    expect(topLine([[10, 8, 200, 70], [45, 158, 345, 300]], 844)).toBe(300);
    expect(topLine([[10, 8, 200, 70], [45, 600, 345, 700]], 844)).toBe(70);
  });
  it("the cameras' push is the plate's or the line's overhang, the larger", () => {
    setTopPush(85);
    setTopLine(HUD_LINE + 40);
    expect(topPush()).toBe(85);
    setTopLine(300);
    expect(topPush()).toBe(300 - HUD_LINE);
    setTopPush(0), setTopLine(0);
    expect(topPush()).toBe(0);
  });
});
