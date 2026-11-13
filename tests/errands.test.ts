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

import { Runner } from '../src/client/runner';
import type { GameMap } from '../src/shared/arena';

describe('the runner', () => {
  const street = (): GameMap => ({ name: 'WICKHOLD', w: 40, h: 30, wallFace: 3, rounds: [], blocks: [], braziers: [], npcs: [{ name: 'RECRUIT WAT', x: 14, y: 10, talk: 'chat', look: 'soldier' }], hero: { x: 10, y: 10 } } as unknown as GameMap);
  const play = (r: Runner, w: Parameters<Runner['frame']>[0], secs: number, from = 0) => {
    for (let t = from; t < from + secs; t += 0.05) r.frame(w, t, 0.05);
    return from + secs;
  };

  it('comes after a few seconds, says it (the errands are yours), and goes back where they stood', () => {
    const r = new Runner(), p = fresh('WARRIOR'), map = street(), w = { street: map, hero: { x: 10, y: 10 }, profile: p, busy: false, keep: () => {} };
    let t = play(r, w, 2.5);
    expect(map.npcs!.map((n) => n.name)).toEqual(['RECRUIT WAT']);
    t = play(r, w, 2, t);
    // Wat left his spot to come: the standing one is gone while the runner is out.
    expect(map.npcs!.map((n) => n.name)).toEqual(['WAT']);
    t = play(r, w, 1, t);
    expect(r.caption(t)?.who).toBe('WAT');
    expect(p.errands!.told).toBe(true);
    r.skip(t);
    play(r, w, 4, t);
    expect(map.npcs!.map((n) => n.name)).toEqual(['RECRUIT WAT']);
    expect(r.caption(99)).toBeNull();
  });

  it('waits while a panel is up, and never comes for a hero who has been told', () => {
    const r = new Runner(), p = fresh('RANGER'), map = street();
    play(r, { street: map, hero: { x: 10, y: 10 }, profile: p, busy: true, keep: () => {} }, 6);
    expect(r.hound()).toBeNull();
    play(r, { street: map, hero: { x: 10, y: 10 }, profile: p, busy: false, keep: () => {} }, 3.2);
    // A Ranger's is Maeve's hound, not a person in the street.
    expect(r.hound()).not.toBeNull();
    expect(map.npcs!.length).toBe(1);
    const q = fresh('WARRIOR');
    told(q);
    const r2 = new Runner();
    play(r2, { street: map, hero: { x: 10, y: 10 }, profile: q, busy: false, keep: () => {} }, 8);
    expect(map.npcs!.map((n) => n.name)).toEqual(['RECRUIT WAT']);
  });

  it('walking off before the line: they go back, and come again next time', () => {
    const r = new Runner(), p = fresh('WARRIOR'), map = street(), w = { street: map, hero: { x: 10, y: 10 }, profile: p, busy: false, keep: () => {} };
    play(r, w, 3.2);
    r.frame({ ...w, street: null }, 4, 0.05);
    expect(map.npcs!.map((n) => n.name)).toEqual(['RECRUIT WAT']);
    expect(p.errands!.told).toBe(false);
  });
});
