import { describe, expect, it } from 'vitest';
import { LAYOUT, townMap } from '../src/shared/town';
import { newWorld } from '../src/shared/story';
import { inArea } from '../src/shared/arena';
import { TRAINER_DOOR } from '../src/shared/errands';
import { CLASS_ORDER } from '../src/shared/weapons';
import { runnerWay, standBy } from '../src/client/runnerpath';

describe("the runner keeps out of the millpond (Kyle, 2026-11-24: Tam ran over it)", () => {
  it('every class, from its hall to the hero at a few places in the street', () => {
    LAYOUT.town = true;
    try {
      const m = townMap(newWorld()), wet: string[] = [];
      const deep = (x: number, y: number) => m.water!.some((w) => w.deep && inArea(w, x, y));
      for (const cls of CLASS_ORDER) for (const me of [m.hero, { x: 28, y: 30 }, { x: 40, y: 24 }, { x: 18, y: 26 }]) {
        const door = TRAINER_DOOR[cls], way = runnerWay(m, door, standBy(m, door, me));
        for (let i = 1; i < way.length; i++) for (let t = 0; t <= 1; t += 0.05) {
          const x = way[i - 1].x + (way[i].x - way[i - 1].x) * t, y = way[i - 1].y + (way[i].y - way[i - 1].y) * t;
          if (deep(x, y)) wet.push(`${cls} to ${me.x},${me.y}`);
        }
      }
      expect([...new Set(wet)]).toEqual([]);
    } finally {
      LAYOUT.town = false;
    }
  });
});
