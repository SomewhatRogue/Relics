import { describe, expect, it } from 'vitest';
import { fitQuests, gateOf, isOpen, questCount, questDue, questHeld, questJob, takeQuest, type QuestFacts } from '../src/shared/heroquests';
import { openErrands, talkedTo, relicDone, told } from '../src/shared/errands';
import { gainXp, newProfile, xpFor } from '../src/shared/progress';
import { PLACES, type Job } from '../src/shared/jobs';
import { fromJson } from '../src/client/save';
import { newWorld } from '../src/shared/story';
import { expedition, fenmere, hangmansWood } from '../src/shared/expedjob';
import { openCut } from '../src/shared/instances';

const hero = (level: number) => {
  const p = { ...newProfile('WARRIOR', 'Q'), prologue: true };
  told(p), relicDone(p), talkedTo(p, 'trainer', 0);
  if (level > 1) gainXp(p, xpFor(level));
  return p;
};
const words = () => ({ title: 'T', text: 'X' });
const job = (o: Partial<Job>): Job => ({ id: 'j', place: PLACES[0], objective: 'rescue', twist: 'none', rooms: 3, reward: 1, seed: 1, title: '', text: '', ...o });
const facts = (o: Partial<QuestFacts>): QuestFacts => ({ job: job({}), won: true, rescued: 0, dens: 0, ...o });

describe('hero quests', () => {
  it('nothing till level 3; then your trainer has one, and talking hands it over', () => {
    const p = hero(1);
    expect(questDue(p)).toBeNull();
    gainXp(p, xpFor(3) - p.xp);
    expect(questDue(p)?.id).toBe('q3');
    expect(openErrands(p)).toContain('quest');
    talkedTo(p, 'trainer', 0);
    expect(questHeld(p)).toMatchObject({ q: { id: 'q3' }, n: 0 });
    expect(openErrands(p)).toEqual(['job']);
  });

  it('your board gets a job of your own for it, the same every day', () => {
    const p = hero(3);
    takeQuest(p);
    const a = questJob(p, words), b = questJob(p, words);
    expect(a).toMatchObject({ quest: 'q3', objective: 'hunt', boss: 'MAWL', place: { name: "Tollan's Farm" }, size: 'short' });
    expect(a).toEqual(b);
    expect(questJob({ ...p, id: 'someone-else' }, words)?.id).not.toBe(a?.id);
  });

  it('counts the one thing; anything else does nothing; done, the next waits on its level', () => {
    const p = hero(4);
    takeQuest(p);
    expect(questCount(p, facts({ job: job({ objective: 'rescue' }), rescued: 3 }))).toBeNull();
    expect(questCount(p, facts({ job: job({ objective: 'hunt', boss: 'SKARN' }) }))?.id).toBe('q3');
    expect(questHeld(p)).toBeNull();
    // q4: dens burned in Greyhollow, over as many jobs as it takes.
    takeQuest(p);
    const carr = PLACES.find((x) => x.name === 'Sallow Carr')!, ford = PLACES.find((x) => x.name === 'Fennick Ford')!;
    questCount(p, facts({ job: job({ place: ford }), dens: 5 }));
    expect(questHeld(p)?.n).toBe(0);
    questCount(p, facts({ job: job({ place: carr }), dens: 2, won: false }));
    expect(questHeld(p)?.n).toBe(2);
    expect(isOpen(p, 'hangman')).toBe(false);
    expect(questCount(p, facts({ job: job({ place: carr }), dens: 4 }))?.opens).toBe('hangman');
    expect(isOpen(p, 'hangman')).toBe(true);
    expect(questDue(p)).toBeNull(); // q5 is a level 5 quest
  });

  it('the Haulier counts only as himself', () => {
    const p = hero(9);
    p.quests = { at: 'q9', n: 0, done: ['q3', 'q4', 'q5', 'q7'] };
    expect(questCount(p, facts({ job: job({ objective: 'hunt', boss: 'X', deep: true }) }))).toBeNull();
    expect(questCount(p, facts({ haulier: true }))?.opens).toBe('opencut');
    expect(isOpen(p, 'opencut')).toBe(true);
  });

  it('old heroes: every quest up to their level done, nothing they have outgrown handed over', () => {
    const old = { ...newProfile('MAGE', 'OLD') } as Record<string, unknown>;
    delete old.quests;
    old.xp = xpFor(6), old.level = 6;
    const p = fromJson({ heroes: [old as never], current: 0, world: newWorld() })!.heroes[0];
    expect(p.quests?.done).toEqual(['q3', 'q4', 'q5']);
    expect(isOpen(p, 'hangman') && isOpen(p, 'exped')).toBe(true);
    expect(isOpen(p, 'deep')).toBe(false);
    expect(questDue(p)).toBeNull();
    // A broken record comes back sound.
    expect(fitQuests({ at: 'q9', n: 99, done: ['q3', 'zz', 'q3'] }, 2)).toEqual({ at: 'q9', n: 1, done: ['q3'] });
  });

  it('what each part of the board stands behind', () => {
    expect(gateOf(hangmansWood(3))).toBe('hangman');
    expect(gateOf(expedition(3))).toBe('exped');
    expect(gateOf(fenmere(3))).toBe('exped');
    expect(gateOf(openCut(3))).toBe('opencut');
    expect(gateOf(job({}))).toBeNull();
  });
});
