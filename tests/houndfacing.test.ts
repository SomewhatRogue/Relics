/** A hound going up or down the screen, seen end on (client/houndfacing.ts; Kyle, 2026-11-25). */
import { describe, expect, it } from 'vitest';
import { houndFacing } from '../src/client/houndfacing';
import { defaultHound } from '../src/shared/houndlook';

describe('the hound from the front and from behind', () => {
  it('every breed, both views, every gait and frame, wagging or tucked, inside the box', () => {
    for (const breed of ['wolfhound', 'lurcher', 'hillhound', 'collie'] as const) for (const view of ['front', 'back'] as const)
      for (const g of ['walk', 'trot', 'run'] as const) for (let f = 0; f < 4; f++) for (const [wag, tuck] of [[24, false], [-14, true]] as const) {
        const m = houndFacing({ ...defaultHound(''), breed, mark: 'both' }, view, g, f, wag, tuck);
        expect(m.clipped, `${breed} ${view} ${g} ${f}`).toBe(0);
        expect(m.parts.length).toBeGreaterThan(60);
      }
  });

  it('the legs move: a gait frame differs from the next', () => {
    const look = defaultHound('');
    const key = (f: number) => JSON.stringify(houndFacing(look, 'front', 'trot', f).parts);
    expect(key(0)).not.toBe(key(2));
  });
});
