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
    // (Meeting the trainer handed over the first job: tests/heroquests.test.ts.)
    expect(openErrands(p)).toEqual(['job']);
    expect(firstErrands(p)).toEqual([]);
  });

  it('old saves: a hero from before errands never gets the first two', () => {
    const old = { ...newProfile('MAGE', 'OLD') } as Record<string, unknown>;
    delete old.errands, delete old.quests;
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
    p.quests = undefined; // (the skill's word alone: hero quests are tests/heroquests.test.ts)
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

import { Runner, type RunnerWorld } from '../src/client/runner';
import { wayThrough } from '../src/client/runnerpath';
import type { GameMap } from '../src/shared/arena';

describe('the arrival and the runner', () => {
  // A street: the barracks (Cole's hall, its door at the bottom) with a wall of a house between it and the gate.
  const street = (): GameMap => ({
    name: 'WICKHOLD', w: 40, h: 30, wallFace: 3, rounds: [], braziers: [], hero: { x: 10, y: 10 },
    blocks: [{ x: 2, y: 12, w: 6, h: 4, kind: 'house', door: 'hall' }, { x: 6, y: 6, w: 10, h: 3, kind: 'house' }],
    npcs: [{ name: 'RECRUIT WAT', x: 20, y: 20, talk: 'chat', look: 'soldier' }],
  } as unknown as GameMap);
  const world = (p: ReturnType<typeof fresh>, map: GameMap, over: Partial<RunnerWorld> = {}): RunnerWorld => {
    const hero = { x: 10, y: 2.8 };
    return { street: map, hero, profile: p, busy: false, keep: () => {}, gate: { x: 10, y: 1.2 }, place: (x, y) => Object.assign(hero, { x, y }), ...over };
  };
  /** Frames at 20 a second; the hero steps as the scene's stick says. */
  const play = (r: Runner, w: RunnerWorld, secs: number, from = 0) => {
    for (let t = from; t < from + secs; t += 0.05) {
      r.frame(w, t, 0.05);
      const s = r.walk();
      if (s && w.hero) w.hero.y += s.my * 3 * 0.05;
    }
    return from + secs;
  };

  it('held on the gate, walks in, cuts to the runner out of their hall, follows them in, then the line', () => {
    const r = new Runner(), p = fresh('WARRIOR'), map = street(), w = world(p, map);
    r.frame(w, 0, 0.05);
    expect(r.scene()).toBe(true);
    expect(w.hero!.y).toBeCloseTo(1.55);
    expect(r.walk()).toEqual({ mx: 0, my: 0 });
    let t = play(r, w, 0.9);
    expect(r.walk()).toEqual({ mx: 0, my: 0.5 });
    // Through the gate, then the cut: the runner in the barracks doorway, the camera snapped onto them; Wat's away from his spot.
    let snapped = false;
    for (let k = 0; k < 80 && !snapped; k++) {
      r.frame(w, (t += 0.05), 0.05);
      const s = r.walk();
      if (s) w.hero!.y += s.my * 3 * 0.05;
      snapped = !!r.focus(w.hero)?.snap;
    }
    expect(w.hero!.y).toBeGreaterThan(3.5);
    expect(snapped).toBe(true);
    expect(map.npcs!.map((n) => n.name)).toEqual(['WAT']);
    expect(map.npcs![0].y).toBeGreaterThan(15);
    t = play(r, w, 8, t);
    expect(r.caption(t)?.who).toBe('WAT');
    expect(p.errands!.told).toBe(true);
    expect(r.scene()).toBe(true);
    r.skip(t);
    r.frame(w, (t += 0.05), 0.05);
    // The line said: the player's again, and Wat goes home.
    expect(r.scene()).toBe(false);
    expect(r.walk()).toBeNull();
    play(r, w, 10, t);
    expect(map.npcs!.map((n) => n.name)).toEqual(['RECRUIT WAT']);
  });

  it('not at the gate (back in later): straight to the runner, no walk in', () => {
    const r = new Runner(), p = fresh('WARRIOR'), map = street(), w = world(p, map);
    w.hero!.x = 30, w.hero!.y = 20;
    play(r, w, 0.8);
    expect(w.hero).toEqual({ x: 30, y: 20 });
    expect(map.npcs!.map((n) => n.name)).toEqual(['WAT']);
  });

  it('waits while a panel is up; never comes for a hero who has been told; a Ranger gets the hound', () => {
    const r = new Runner(), p = fresh('RANGER'), map = street();
    play(r, world(p, map, { busy: true }), 3);
    expect(r.scene()).toBe(false);
    const w = world(p, map);
    play(r, w, 4);
    expect(r.hound()).not.toBeNull();
    expect(map.npcs!.map((n) => n.name)).toEqual(['RECRUIT WAT']);
    const q = fresh('WARRIOR');
    told(q);
    const r2 = new Runner();
    play(r2, world(q, map), 8);
    expect(r2.scene()).toBe(false);
  });

  it('leaving the street before the line: all as it was, and they come again next time', () => {
    const r = new Runner(), p = fresh('WARRIOR'), map = street(), w = world(p, map);
    play(r, w, 4);
    r.frame({ ...w, street: null }, 5, 0.05);
    expect(r.scene()).toBe(false);
    expect(map.npcs!.map((n) => n.name)).toEqual(['RECRUIT WAT']);
    expect(p.errands!.told).toBe(false);
  });

  it("the runner's way goes round a building, not through it", () => {
    const map = street(), way = wayThrough(map, { x: 11, y: 11 }, { x: 11, y: 4 });
    expect(way.length).toBeGreaterThan(2);
    for (const q of way) expect(q.y > 6 - 0.3 && q.y < 9 + 0.3 && q.x > 6 - 0.3 && q.x < 16 + 0.3).toBe(false);
  });
});
