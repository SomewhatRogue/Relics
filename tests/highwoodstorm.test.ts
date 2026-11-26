/** The High Wood's storm days (docs/design/the-high-wood.md slice 4): some days only, the strikes kept to the ridge. */
import { describe, expect, it } from 'vitest';
import { WOOD_STORM, stormyWood } from '../src/shared/highwood';
import { landJob, territoryPlan } from '../src/shared/territory';
import { Rng } from '../src/shared/rng';
import { pickStrike } from '../src/sim/stormpick';
import type { Hero } from '../src/sim/types';

const days = Array.from({ length: 60 }, (_, i) => i + 1);
const hero = (x: number, y: number) => ({ id: 'a', x, y, act: 'idle', hp: 10 }) as unknown as Hero;

describe('the High Wood under a storm', () => {
  it('storms some days, not most, and the map says so', () => {
    const stormy = days.filter((d) => stormyWood(landJob('highwood', d)));
    expect(stormy.length).toBeGreaterThan(8);
    expect(stormy.length).toBeLessThan(35);
    const d = stormy[0], calm = days.find((x) => !stormyWood(landJob('highwood', x)))!;
    expect(territoryPlan(landJob('highwood', d)).map.theme.sky).toBe('storm');
    expect(territoryPlan(landJob('highwood', calm)).map.theme.sky ?? 'clear').toBe('clear');
  });

  it('strikes only on the Struck Oaks, never under the canopy', () => {
    const d = days.find((x) => stormyWood(landJob('highwood', x)))!, map = territoryPlan(landJob('highwood', d)).map, z = WOOD_STORM.strikeIn;
    const rng = new Rng(9);
    let ridge = 0;
    for (let i = 0; i < 80; i++) {
      const p = pickStrike(map, [hero(48, 86)], [], rng);
      if (p) (ridge++, expect(p.y).toBeGreaterThanOrEqual(z.y), expect(p.y).toBeLessThanOrEqual(z.y + z.h));
      expect(pickStrike(map, [hero(48, 150)], [], rng)).toBeNull();
      expect(pickStrike(map, [hero(48, 40)], [], rng)).toBeNull();
    }
    expect(ridge).toBeGreaterThan(10);
  });
});
