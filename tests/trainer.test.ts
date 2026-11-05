/** The trainer: every rank waits on a level and costs gold; old heroes keep what they have; the rows say so. */
import { describe, expect, it } from 'vitest';
import { DRILLS, DRILL_ORDER, TEACHES, drillLevel, drillPrice, newProfile, type DrillId } from '../src/shared/tuning';
import { buyDrill, drillState, learnLesson, lessonState } from '../src/shared/training';
import { trainerRows } from '../src/shared/trainrows';
import { knowsSkill, learnSkill, skillState } from '../src/shared/skillteach';
import { SKILL_STEPS } from '../src/shared/drills';

const hero = (level: number, gold: number, cls: Parameters<typeof newProfile>[0] = 'WARRIOR') => Object.assign(newProfile(cls), { level, gold });

describe('trainer', () => {
  it('each rank needs its level: base stats every two levels, the skill and technique later', () => {
    for (const id of ['power', 'health', 'speed', 'crit', 'wind'] as DrillId[]) expect(DRILLS[id].levels).toEqual([2, 4, 6, 8, 10]);
    expect(drillLevel('skill', 0)).toBeGreaterThan(drillLevel('power', 0));
    expect(drillLevel('technique', 0)).toBeGreaterThan(drillLevel('power', 0));
    for (const id of DRILL_ORDER) {
      expect(DRILLS[id].levels).toHaveLength(DRILLS[id].max);
      expect(Math.max(...DRILLS[id].levels)).toBeLessThanOrEqual(10);
      for (let r = 1; r < DRILLS[id].max; r++) expect(drillPrice(id, r)).toBeGreaterThan(drillPrice(id, r - 1));
    }
    // Dearer than they were: the first rank of power was 40.
    expect(drillPrice('power', 0)).toBe(80);
    expect(TEACHES.skill).toEqual({ level: 3, price: 150 });
    expect(TEACHES.leave).toEqual({ level: 5, price: 250 });
  });

  it('buying refuses below the level or without the gold, and spends nothing', () => {
    const p = hero(1, 10000);
    expect(buyDrill(p, 'power')).toBe(false);
    expect(p.gold).toBe(10000);
    p.level = 2;
    expect(buyDrill(p, 'power')).toBe(true);
    expect(p.drills?.power).toBe(1);
    expect(p.gold).toBe(10000 - drillPrice('power', 0));
    // Rank 2 waits on level 4.
    expect(drillState(p, 'power')).toBe('locked');
    expect(buyDrill(p, 'power')).toBe(false);
    p.level = 4;
    p.gold = drillPrice('power', 1) - 1;
    expect(drillState(p, 'power')).toBe('poor');
    expect(buyDrill(p, 'power')).toBe(false);
    expect(p.gold).toBe(drillPrice('power', 1) - 1);
  });

  it('lessons wait on their level and gold; the skill drill waits on the skill', () => {
    const p = hero(2, 1000);
    expect(lessonState(p, 'skill')).toBe('locked');
    expect(learnLesson(p, 'skill')).toBe(false);
    p.level = drillLevel('skill', 0);
    expect(drillState(p, 'skill')).toBe('needs');
    expect(buyDrill(p, 'skill')).toBe(false);
    expect(learnLesson(p, 'skill')).toBe(true);
    expect(p.gold).toBe(1000 - TEACHES.skill.price);
    expect(drillState(p, 'skill')).toBe('buy');
    // A Warrior's dodge leaves nothing behind; a Ranger's technique waits on the snare.
    expect(learnLesson(Object.assign(hero(10, 1000), { learned: ['skill'] }), 'leave')).toBe(false);
    const r = hero(Math.max(drillLevel('technique', 0), TEACHES.leave.level), 1000, 'RANGER');
    expect(drillState(r, 'technique')).toBe('needs');
    expect(learnLesson(r, 'leave')).toBe(true);
    expect(drillState(r, 'technique')).toBe('buy');
  });

  it('old heroes keep ranks above the new caps, and only buy on once their level allows', () => {
    const p = Object.assign(hero(3, 5000), { drills: { power: 3, skill: 2 }, learned: undefined });
    expect(drillState(p, 'power')).toBe('locked');
    expect(buyDrill(p, 'power')).toBe(false);
    expect(p.drills.power).toBe(3);
    const row = trainerRows(p).find((x) => x.id === 'power')!;
    expect(row.pips).toEqual(['on', 'on', 'on', 'lock', 'lock']);
    expect(row.tag).toBe('LEVEL 8');
    // Lessons from before lessons existed: known.
    expect(trainerRows(p).find((x) => x.id === 'skill')!.tag).toBe('LEARNED');
  });

  it('the rows say what can be bought, what is locked and what is done', () => {
    const fresh = trainerRows(hero(1, 0, 'MAGE'));
    // The technique drill is three rows of techniques, then the movement ladder's three rungs.
    expect(fresh.map((x) => x.id)).toEqual(['skill', 'firering', 'tether', 'leave', ...DRILL_ORDER.flatMap((d) => (d === 'technique' ? ['primed', 'attuned', 'spellthief', 'blinkburst', 'blinkthrough', 'halfblink'] : [d]))]);
    expect(new Set(fresh.map((x) => x.key)).size).toBe(fresh.length);
    expect(fresh.every((x) => x.state === 'locked')).toBe(true);
    expect(fresh.find((x) => x.id === 'power')!.tag).toBe('LEVEL 2');
    expect(fresh.find((x) => x.id === 'leave')!.tag).toBe('LEVEL 5');

    const mid = hero(5, 300, 'WARRIOR');
    mid.drills = { power: 2, health: 1 };
    const rows = trainerRows(mid), at = (id: string) => rows.find((x) => x.id === id)!;
    expect(rows.find((x) => x.id === 'leave')).toBeUndefined();
    expect(at('skill').state).toBe('buy');
    expect(at('skill').tag).toBe('150g');
    expect(at('power').state).toBe('locked');
    expect(at('health').state).toBe('buy');
    expect(at('health').gain).toBe('+8 health');
    expect(at('crit').tag).toBe(`${drillPrice('crit', 0)}g`);
    expect(at('power').now).toBe('+10% damage');
    expect(at('power').next).toBe('+15% damage');
    // A Warrior's technique is three rows of moves now (shared/techniques.ts): the first at level 4.
    expect(rows.filter((x) => x.tech).map((x) => x.name)).toEqual(['WIDE SLAM', 'STRIDING BLOW', 'IRON FEET']);
    expect(rows.find((x) => x.tech === 'slam')!.state).toBe('buy');

    const top = hero(10, 0, 'ROGUE');
    top.drills = { power: 5, technique: 3 };
    const done = trainerRows(top).find((x) => x.id === 'power')!;
    expect(done.state).toBe('max');
    expect(done.tag).toBe('MAX');
    expect(done.gain).toBe('');
    expect(trainerRows(top).find((x) => x.id === 'speed')!.state).toBe('poor');
  });

  it('three skills a class: the first at level 3, the next at 5 and 7, each bought on its own', () => {
    expect(SKILL_STEPS.map((x) => x.level)).toEqual([3, 5, 7]);
    expect(SKILL_STEPS.map((x) => x.price)).toEqual([150, 250, 400]);
    const p = hero(5, 1000, 'ROGUE');
    // The second waits on the first.
    expect(skillState(p, 'vanish')).toBe('needs');
    expect(learnSkill(p, 'vanish')).toBe(false);
    expect(learnSkill(p, 'shadow')).toBe(true);
    expect(learnSkill(p, 'vanish')).toBe(true);
    expect(p.gold).toBe(1000 - 150 - 250);
    expect(knowsSkill(p, 'vanish')).toBe(true);
    // The third waits on level 7.
    expect(skillState(p, 'knives')).toBe('locked');
    expect(trainerRows(p).find((x) => x.id === 'knives')!.tag).toBe('LEVEL 7');
    p.level = 7;
    expect(learnSkill(p, 'knives')).toBe(true);
    expect(trainerRows(p).filter((x) => x.group === 'skills').every((x) => x.state === 'max')).toBe(true);
  });

  it('a Warrior taught before there were three keeps the War Cry; a new one buys it', () => {
    const old = Object.assign(hero(3, 0), { learned: ['skill'] as ('skill' | 'leave')[] });
    expect(knowsSkill(old, 'horn')).toBe(true);
    expect(knowsSkill(old, 'stamp')).toBe(false);
    old.level = 7;
    old.gold = 400;
    expect(learnSkill(old, 'stamp')).toBe(true);
    expect(knowsSkill(old, 'horn')).toBe(true);
    const fresh = hero(3, 150);
    expect(learnSkill(fresh, 'bash')).toBe(true);
    expect(knowsSkill(fresh, 'horn')).toBe(false);
    expect(skillState(fresh, 'horn')).toBe('locked');
  });
});
