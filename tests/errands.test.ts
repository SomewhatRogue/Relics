import { describe, expect, it } from 'vitest';
import { firstErrands, fitErrands, openErrands, openSkillLevel, relicDone, runnerDue, talkedTo, told } from '../src/shared/errands';
import { gainXp, newProfile, xpFor } from '../src/shared/progress';
import { fromJson } from '../src/client/save';
import { newWorld } from '../src/shared/story';

const fresh = (cls: Parameters<typeof newProfile>[0] = 'WARRIOR') => ({ ...newProfile(cls, 'T'), prologue: true });

describe('town errands', () => {
  it('a new hero has the runner due, and nothing open till told', () => {
    const p = fresh();
    expect(runnerDue(p)).toBe(true);
    expect(openErrands(p)).toEqual([]);
    told(p);
    expect(runnerDue(p)).toBe(false);
    expect(openErrands(p)).toEqual(['relic', 'trainer']);
  });

  it('not before the wood is done (or skipped)', () => {
    expect(runnerDue({ ...newProfile('WARRIOR'), prologue: false })).toBe(false);
  });

  it('each ticks off in either order; both done, the first two are over', () => {
    const p = fresh('RANGER');
    told(p);
    expect(talkedTo(p, 'trainer', 0)).toBe(false); // the Warrior's trainer isn't a Ranger's
    expect(talkedTo(p, 'trainer', 1)).toBe(true);
    expect(firstErrands(p)).toEqual([{ id: 'relic', done: false }, { id: 'trainer', done: true }]);
    expect(relicDone(p)).toBe(true);
    expect(relicDone(p)).toBe(false);
    expect(openErrands(p)).toEqual([]);
    expect(firstErrands(p)).toEqual([]);
  });

  it('old saves: a hero from before errands never gets the first two', () => {
    const old = { ...newProfile('MAGE', 'OLD') } as Record<string, unknown>;
    delete old.errands;
    const s = fromJson({ heroes: [old as never], current: 0, world: newWorld() })!;
    const p = s.heroes[0];
    expect(p.errands).toMatchObject({ told: true, relic: true, trainer: true });
    expect(runnerDue(p)).toBe(false);
    expect(openErrands(p)).toEqual([]);
    // A broken record comes back sound.
    expect(fitErrands({ told: 1, seen: 'x' }, 4)).toEqual({ told: true, relic: false, trainer: false, seen: 1 });
  });

  it('a new hero keeps their record across a save', () => {
    const p = fresh();
    told(p);
    const s = fromJson(JSON.parse(JSON.stringify({ heroes: [p], current: 0, world: newWorld() })))!;
    expect(openErrands(s.heroes[0])).toEqual(['relic', 'trainer']);
  });

  it('a level that opens a skill sends you to the trainer; talking to them ends it', () => {
    const p = fresh();
    told(p), relicDone(p), talkedTo(p, 'trainer', 0);
    expect(openSkillLevel(p)).toBe(0);
    gainXp(p, xpFor(3));
    expect(openSkillLevel(p)).toBe(3);
    expect(openErrands(p)).toEqual(['skill']);
    talkedTo(p, 'trainer', 0);
    expect(openErrands(p)).toEqual([]);
    // Level 4 opens nothing new; level 5 does (the second skill).
    gainXp(p, xpFor(4) - p.xp);
    expect(openErrands(p)).toEqual([]);
    gainXp(p, xpFor(5) - p.xp);
    expect(openErrands(p)).toEqual(['skill']);
  });
});
