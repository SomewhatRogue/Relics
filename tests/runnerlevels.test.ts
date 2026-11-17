// The first-time runner in the new town (docs/decisions/town-layout.md): out of any hall's door and round to the hero,
// from one level to the next only by the steps, never straight down or up a retaining wall.
import { afterAll, describe, expect, it } from 'vitest';
import { LAYOUT, townMap, townSpots } from '../src/shared/town';
import { newWorld } from '../src/shared/story';
import { runnerWay, stepOk } from '../src/client/runnerpath';
import { levelAt } from '../src/shared/arena';

describe('the runner on the new town levels', () => {
  LAYOUT.town = true;
  afterAll(() => void (LAYOUT.town = false));
  const w = { ...newWorld(), dens: 6, rescued: 16 };
  const map = townMap(w), spots = townSpots(w);
  const doors = [...new Set(map.blocks.flatMap((b) => (b.door && !b.locked ? [b.door] : [])))];
  // The job board (the town), Public Works (the lower quarter), the north gate (where a new hero comes in).
  const stands = ['board', 'works', 'gate'].map((id) => spots.find((s) => s.id === id)!);

  it('has doors and places on more than one level to walk between', () => {
    expect(doors.length).toBeGreaterThan(5);
    expect(stands.every(Boolean)).toBe(true);
  });

  it('walks every way by the steps', () => {
    const bad: string[] = [];
    let climbs = 0;
    for (const door of doors) for (const s of stands) {
      const way = runnerWay(map, door, { x: s.x, y: s.y + 0.8 });
      if (new Set(way.map((p) => levelAt(map, p.x, p.y))).size > 1) climbs++;
      for (let k = 1; k < way.length; k++) {
        const a = way[k - 1], b = way[k], n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.1);
        for (let i = 1; i <= n; i++) {
          const x0 = a.x + ((b.x - a.x) * (i - 1)) / n, y0 = a.y + ((b.y - a.y) * (i - 1)) / n;
          const x1 = a.x + ((b.x - a.x) * i) / n, y1 = a.y + ((b.y - a.y) * i) / n;
          if (!stepOk(map, x0, y0, x1, y1)) { bad.push(`${door} to ${s.id} at ${x1.toFixed(1)},${y1.toFixed(1)}`); break; }
        }
      }
    }
    expect(bad).toEqual([]);
    // (Most of them go up or down a level on the way.)
    expect(climbs).toBeGreaterThan(doors.length);
  });
});

describe("the trainers' directions follow the town", () => {
  it('says Kirkhill in the new town and the north-west in the old', async () => {
    const { TRAINERS } = await import('../src/shared/town');
    LAYOUT.town = true;
    expect(TRAINERS.HEALER.where).toContain('Kirkhill');
    expect(TRAINERS.ROGUE.where).not.toContain('sewer');
    LAYOUT.town = false;
    expect(TRAINERS.HEALER.where).toContain('north-west');
  });
});
