/** A job's hour: seeded, night still the twist, and the room lit to match (brighter by day, warm at dusk, cold at dawn). */
import { describe, expect, it } from 'vitest';
import { board, type Job } from '../src/shared/jobs';
import { planRoom, THEMES } from '../src/shared/terrain';
import { lightFor, rollTime, timeOf, TIMES, type Time } from '../src/shared/timeofday';
import { CHAPTER_1 } from '../src/shared/story';

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const at = (kind: Job['place']['kind'], time: Time): Job => ({ ...board(4)[1], place: { name: 'Test', kind, region: 'Greyhollow', ruin: 2 }, time, twist: time === 'night' ? 'night' : 'none' });

describe('time of day on jobs', () => {
  it('every job has an hour, the same each time the day is posted; night jobs are night, and only they are', () => {
    const seen = new Set<Time>();
    for (let day = 1; day <= 30; day++) {
      const jobs = board(day);
      expect(board(day).map((j) => j.time)).toEqual(jobs.map((j) => j.time));
      for (const j of jobs) {
        expect(j.time).toBeDefined();
        expect(j.time === 'night').toBe(j.twist === 'night');
        seen.add(j.time!);
      }
    }
    expect([...seen].sort()).toEqual(['dawn', 'day', 'dusk', 'night']);
    expect(rollTime(12, false)).toBe(rollTime(12, false));
    // Old saved jobs (no hour) read as before: night if a night job, day otherwise.
    expect(timeOf({ twist: 'night' })).toBe('night');
    expect(timeOf({ twist: 'none' })).toBe('day');
  });

  it('the room is lit for it: day bright with no moon and little torchlight, dusk warm, dawn cold and misty, night darkest', () => {
    const light = (t: Time) => planRoom(at('field', t), 0).map.theme;
    const day = light('day'), dusk = light('dusk'), dawn = light('dawn'), night = light('night');
    expect(sum(day.ambient)).toBeGreaterThan(sum(dusk.ambient));
    expect(sum(dusk.ambient)).toBeGreaterThan(sum(night.ambient));
    expect(sum(dawn.ambient)).toBeGreaterThan(sum(night.ambient) * 2);
    expect(day.day).toBe(true), expect(day.moon).toBe(0), expect(day.torch!).toBeLessThan(0.5);
    expect(dusk.ambient[0]).toBeGreaterThan(dusk.ambient[2]);
    expect(dusk.sun!).toBeGreaterThan(0);
    expect(dawn.ambient[2]).toBeGreaterThan(dawn.ambient[0]);
    expect(dawn.mist!).toBeGreaterThan(0);
    expect(night.torch).toBe(1);
    // The same job lights the same room.
    expect(planRoom(at('forest', 'dusk'), 1).map.theme).toEqual(planRoom(at('forest', 'dusk'), 1).map.theme);
  });

  it('under the ground the hour changes nothing but night; a forest lets in less of the day than a field', () => {
    expect(lightFor(THEMES.mine, 'mine', 'day').ambient).toEqual(THEMES.mine.ambient);
    expect(lightFor(THEMES.mine, 'mine', 'day').day).toBeFalsy();
    expect(sum(lightFor(THEMES.forest, 'forest', 'day').ambient)).toBeLessThan(sum(lightFor(THEMES.field, 'field', 'day').ambient));
  });

  it("darker hours shorten a resting goblin's sight; by day a censer's glow carries less", () => {
    expect(TIMES.night.sight).toBeLessThan(TIMES.dusk.sight);
    expect(TIMES.dusk.sight).toBeLessThan(TIMES.day.sight);
    expect(TIMES.day.glow).toBeLessThan(TIMES.night.glow);
    expect(planRoom(at('field', 'night'), 0).map.theme.sight).toBe(TIMES.night.sight);
  });

  it('the story mission is at night', () => {
    expect(timeOf(CHAPTER_1.mission)).toBe('night');
  });
});
