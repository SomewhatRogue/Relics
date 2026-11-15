import { describe, expect, it } from 'vitest';
import { hides } from '../src/client/streethole';

// The new look's see-through hole (`?hd&street`): a block from x 10 to 16, z 10 to 14, 8 tiles tall.
const P = (26 * Math.PI) / 180;
const h = (me: [number, number], yaw: number) => hides(me, 10, 10, 16, 14, 8, yaw, P);
describe('the see-through hole knows the swing', () => {
  it('hides a hero just behind it with the camera due south', () => {
    expect(h([13, 8], 0)).toBe(true);
    expect(h([13, 16], 0)).toBe(false);
  });
  it('does not hide a hero beside it with the camera due south', () => {
    expect(h([19, 12], 0)).toBe(false);
  });
  it('hides a hero beside it once the camera swings round that way', () => {
    // Swung east 45 degrees, the camera stands to the west: a hero on the east side is behind the block.
    expect(h([18, 12], Math.PI / 4)).toBe(true);
    expect(h([18, 12], -Math.PI / 4)).toBe(false);
  });
  it('lets go once far enough back to be seen over the roof', () => {
    expect(h([13, -20], 0)).toBe(false);
  });
});
