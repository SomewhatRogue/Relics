/** Goblins in profile (client/gobside.ts; Kyle, 2026-11-25). */
import { describe, expect, it } from 'vitest';
import { body, gobSideOn, head } from '../src/client/gobsideparts';

const K = { S: 'S', s: 's', L: 'L', F: 'F', B: 'B', b: 'b', K: 'K', m: 'm', T: 'T', E: 'E' };
const GOB_SIDE_PARTS = { gob: [...body(K), ...head(K, false)], pale: [...body(K), ...head(K, true)] };

describe('the small goblin side on', () => {
  it('every pixel inside its 17 by 20 canvas, both kinds', () => {
    for (const parts of [GOB_SIDE_PARTS.gob, GOB_SIDE_PARTS.pale]) for (const p of parts) {
      const [x, y] = [p[1] as number, p[2] as number];
      expect(x).toBeGreaterThanOrEqual(0), expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(17), expect(y).toBeLessThan(20);
    }
  });

  it('turns side on going across, back to the front going up or down, without flicker at the edge', () => {
    expect(gobSideOn({ id: 1, fx: 1, fy: 0 })).toBe(true);
    expect(gobSideOn({ id: 1, fx: 0.7, fy: 0.72 })).toBe(true); // just past even: stays side on
    expect(gobSideOn({ id: 1, fx: 0.2, fy: 1 })).toBe(false);
    expect(gobSideOn({ id: 1, fx: 0.72, fy: 0.7 })).toBe(false); // not far enough across to turn back
  });
});

import { butcherSideParts } from '../src/client/butcherside';
import { butcherLook } from '../src/client/butcherparts';

describe('the butcher side on', () => {
  it('every build, trophy, the Stoker and the Hempen Man inside its 27 by 33 canvas', () => {
    const looks = [butcherLook(undefined), butcherLook(undefined, 'stoker'), butcherLook(undefined, undefined, 1), butcherLook(undefined, undefined, 2)];
    for (const name of ['MAWL', 'SKARN', 'OLD SPOON', 'GUTCHAIN', 'MOTHER RUST', 'OLD KNUCKLES', 'A', 'B', 'C', 'D', 'E', 'F']) looks.push(butcherLook(name));
    for (const l of looks) for (const p of butcherSideParts(l)) {
      const [x, y] = [p[1] as number, p[2] as number];
      expect(x, JSON.stringify(l)).toBeGreaterThanOrEqual(0), expect(y).toBeGreaterThanOrEqual(0);
      expect(x, JSON.stringify(l)).toBeLessThan(27), expect(y).toBeLessThan(33);
    }
  });
});
