/** Found shelters kept on the hero, and a job that starts at one (client/save.ts, sim/landroom.ts, sim/travel.ts). */
import { describe, expect, it } from 'vitest';
import { fromJson } from '../src/client/save';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';
import { landJob } from '../src/shared/territory';
import { newRun, runRoom } from '../src/sim/run';

const load = (shelters: unknown) => fromJson({ heroes: [{ ...newProfile('WARRIOR'), shelters } as never], current: 0, world: newWorld() })!.heroes[0].shelters;

describe('found shelters in a save', () => {
  it('keeps names and drops anything else', () => {
    expect(load(['THE FIELD BARN', 'THE CHARCOAL HUT'])).toEqual(['THE FIELD BARN', 'THE CHARCOAL HUT']);
    expect(load(['THE FIELD BARN', 4, null])).toEqual(['THE FIELD BARN']);
    expect(load('THE FIELD BARN')).toBeUndefined();
    expect(load({ a: 1 })).toBeUndefined();
    expect(load(undefined)).toBeUndefined();
  });
});

describe('a job that starts at a shelter', () => {
  const start = (at?: string) => {
    const run = { ...newRun({ ...landJob('gatefields', 3), at }), index: 0 }, room = runRoom(run);
    return { run, room, h: room.join('me') };
  };
  it('puts the party inside that ring with the rest point there', () => {
    const base = start(), st = base.room.map.stations!;
    const it = st.find((s) => s.name === 'THE FIELD BARN')!;
    // (Until the second shelter lands, the barn is the one to name; a second would be found the same way.)
    const w = start(it.name);
    expect(Math.hypot(w.h.x - it.x, w.h.y - it.y)).toBeLessThanOrEqual(it.r);
    expect(w.run.rest).toEqual({ x: w.room.map.hero.x, y: w.room.map.hero.y });
    expect(Math.hypot(w.run.rest!.x - it.x, w.run.rest!.y - it.y)).toBeLessThanOrEqual(it.r);
  });
  it('starts at the way in without it, or with a name that is no station', () => {
    expect(start().run.rest).toBeUndefined();
    expect(start('NOWHERE').run.rest).toBeUndefined();
  });
});
