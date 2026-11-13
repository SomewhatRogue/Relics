/** Deep skills, step 1 (docs/design/deep-skills.md): the deepest floor on the hero, the trainer's row hidden till
 *  floor 20, paying for it, A NEW SKILL on reaching it, and the button's press counted in the room. */
import { describe, expect, it } from 'vitest';
import { DEEP_SKILL, deepSkillFor, deepSkillOpen, deepSkillState, fitDeepBest, learnDeepSkill, reachFloor } from '../src/shared/deepskill';
import { trainerRows } from '../src/shared/trainrows';
import { openErrands, talkedTo } from '../src/shared/errands';
import { newProfile } from '../src/shared/progress';
import { CLASS_ORDER } from '../src/shared/weapons';
import { fromJson } from '../src/client/save';
import { newWorld } from '../src/shared/story';
import { deepDue, deepPressed } from '../src/sim/deepskill';
import { newHero } from '../src/sim/hero';
import { NO_INTENT } from '../src/sim/types';

const rogue = () => ({ ...newProfile('ROGUE', 'T'), gold: 100000 });

describe('the deepest floor on the hero', () => {
  it('only goes up, and a floor 20 opens the Rogue’s skill', () => {
    const p = rogue();
    expect(reachFloor(p, 12)).toBe(true);
    expect(reachFloor(p, 9)).toBe(false);
    expect(p.deepBest).toBe(12);
    expect(deepSkillOpen(p)).toBe(false);
    reachFloor(p, DEEP_SKILL.floor);
    expect(deepSkillOpen(p)).toBe(true);
  });

  it('an older hero’s comes from their saved run, or their line on a board', () => {
    expect(fitDeepBest({ deep: { floor: 14 } as never })).toBe(14);
    expect(fitDeepBest({ id: 'a', deepBest: 3 }, [[{ id: 'a', n: 21 }, { id: 'b', n: 40 }]])).toBe(21);
    const p = { ...newProfile('ROGUE', 'Old'), id: 'old1' };
    const s = fromJson({ heroes: [p], current: 0, world: { ...newWorld(), deepParty: [{ id: 'old1', name: 'Old', n: 22, gold: 0 }] as never } });
    expect(s!.heroes[0].deepBest).toBe(22);
  });

  it('classes without a built skill are never offered one', () => {
    for (const cls of CLASS_ORDER.filter((c) => c !== 'ROGUE')) {
      const p = { ...newProfile(cls, 'T'), deepBest: 50 };
      expect(deepSkillOpen(p)).toBe(false);
      expect(trainerRows(p).some((r) => r.id === 'deep')).toBe(false);
    }
  });
});

describe('the trainer', () => {
  it('lists nothing till floor 20, then a lesson to buy', () => {
    const p = rogue();
    reachFloor(p, 19);
    expect(trainerRows(p).some((r) => r.id === 'deep')).toBe(false);
    expect(deepSkillState(p)).toBe('hidden');
    reachFloor(p, 20);
    const row = trainerRows(p).find((r) => r.id === 'deep')!;
    expect(row.state).toBe('buy');
    expect(row.price).toBe(DEEP_SKILL.price);
  });

  it('paying teaches it once and puts it on the hero; short of gold, nothing', () => {
    const poor = { ...rogue(), gold: 1, deepBest: 20 };
    expect(learnDeepSkill(poor)).toBe(false);
    expect(deepSkillState(poor)).toBe('poor');
    const p = { ...rogue(), deepBest: 20 }, had = p.gold;
    expect(deepSkillFor(p)).toBeUndefined();
    expect(learnDeepSkill(p)).toBe(true);
    expect(p.gold).toBe(had - DEEP_SKILL.price);
    expect(learnDeepSkill(p)).toBe(false);
    expect(deepSkillFor(p)).toBe('cut');
    expect(trainerRows(p).find((r) => r.id === 'deep')!.state).toBe('max');
  });

  it('A NEW SKILL when the floor opens it, gone once the trainer has seen you', () => {
    const p = rogue();
    expect(openErrands(p)).not.toContain('skill');
    reachFloor(p, 20);
    expect(openErrands(p)).toContain('skill');
    talkedTo(p, 'trainer', CLASS_ORDER.indexOf('ROGUE'));
    expect(openErrands(p)).not.toContain('skill');
  });
});

describe('the button in the room', () => {
  it('a press is counted; it starts only when taught and ready', () => {
    const h = newHero('me', 5, 5);
    deepPressed(h, { ...NO_INTENT, deepSeq: 1 }, 1);
    expect(deepDue(h, 1)).toBe(false); // not taught: the press is spent
    h.deepSkill = 'cut';
    deepPressed(h, { ...NO_INTENT, deepSeq: 2 }, 2);
    h.deepReady = 5;
    expect(deepDue(h, 2)).toBe(false); // still waiting
    deepPressed(h, { ...NO_INTENT, deepSeq: 3 }, 6);
    expect(deepDue(h, 6)).toBe(true);
  });
});
