import { describe, expect, it } from 'vitest';
import { COL, ROW, colFor, rowFor } from '../src/client/charframe';

const o = { row: 0, flip: false };

describe('new look characters: the frame', () => {
  it('reads the facing as the camera sees it', () => {
    expect(rowFor(0, 1, 0, o)).toEqual({ row: ROW.front, flip: false });
    expect(rowFor(0, -1, 0, o)).toEqual({ row: ROW.back, flip: false });
    expect(rowFor(1, 0, 0, o)).toEqual({ row: ROW.side, flip: false });
    expect(rowFor(-1, 0, 0, o)).toEqual({ row: ROW.side, flip: true });
    // The camera swung to look east: walking east is walking away from it.
    expect(rowFor(1, 0, Math.PI / 2, o).row).toBe(ROW.back);
  });

  it('follows the pose phase', () => {
    expect(colFor('windup', 0.2, false, 0)).toBe(COL.draw);
    expect(colFor('charge', 1, true, 0)).toBe(COL.draw);
    expect(colFor('contact', 0, false, 0)).toBe(COL.strike);
    expect(colFor('recover', 0.3, false, 0)).toBe(COL.strike);
    expect(colFor('recover', 0.7, false, 0)).toBe(COL.idle);
    expect(colFor('rest', 0, false, 0)).toBe(COL.idle);
    const walk = [0, 0.12, 0.23, 0.34].map((t) => colFor('rest', 0, true, t));
    expect(new Set(walk)).toEqual(new Set([1, 2, 3, 4]));
  });
});
