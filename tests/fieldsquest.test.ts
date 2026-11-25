import { describe, expect, it } from 'vitest';
import { newProfile } from '../src/shared/progress';
import { ERRAND_PAY } from '../src/shared/errandpay';
import { doneErrands, fieldsDone, fitErrands, openErrands, talkedTo, told, relicDone, yardDone, backFromYard, errandWho } from '../src/shared/errands';
import { FIELD_BARN, GATE_LEVEL, canGoOut, heardBarn } from '../src/shared/gatefieldsquest';
import { CLASS_ORDER } from '../src/shared/weapons';
import { ERRANDW } from '../src/client/errandwords';

/** A hero past the first chain (church, trainer, yard told back). */
const chained = (level: number) => {
  const p = { ...newProfile('WARRIOR', 'FQ'), prologue: true };
  told(p), relicDone(p), talkedTo(p, 'trainer', 0), yardDone(p), backFromYard(p);
  p.level = level;
  return p;
};

describe('the way out of the gate (Kyle, 2026-11-24)', () => {
  it('the guard lets you out from level 3', () => {
    expect(GATE_LEVEL).toBe(3);
    // (The gate is open from level 1 while Kyle tests the land: gatefieldsquest.ts GATE_OPEN.)
    expect(canGoOut(1)).toBe(true);
  });

  it('is not offered below level 3, and is at 3', () => {
    const p = chained(2);
    talkedTo(p, 'trainer', 0);
    expect(p.errands!.fields).toBeUndefined();
    p.level = 3;
    expect(talkedTo(p, 'trainer', 0)).toBe(true);
    expect(p.errands!.fields).toBe(1);
    expect(openErrands(p)).toContain('fields');
  });

  it('is not handed over before the yard is told back', () => {
    const p = { ...newProfile('WARRIOR', 'FQ2'), prologue: true };
    told(p), relicDone(p), talkedTo(p, 'trainer', 0);
    p.level = 3;
    talkedTo(p, 'trainer', 0);
    expect(p.errands!.fields).toBeUndefined();
  });

  it('keeps a saved value and drops a bad one', () => {
    expect(fitErrands({ told: true, relic: true, trainer: true, seen: 3, fields: 2 }, 3).fields).toBe(2);
    expect(fitErrands({ told: true, relic: true, trainer: true, seen: 3, fields: 9 }, 3).fields).toBeUndefined();
    expect(fitErrands({ told: true, relic: true, trainer: true, seen: 3, fields: 'x' }, 3).fields).toBeUndefined();
  });

  it('told: the goal names the gate and the barn, and the gate is where it sends you', () => {
    const p = chained(3);
    talkedTo(p, 'trainer', 0);
    const goal = ERRANDW.todo('fields', p.cls);
    expect(goal).toContain('North Gate');
    expect(goal).toContain('Field Barn');
    expect(errandWho(p, 'fields')).toMatchObject({ talk: 'gate', spot: 'gate' });
  });

  it('resting at the barn marks it 2 and pays once; the trainer hearing makes it 3', () => {
    const p = chained(3);
    talkedTo(p, 'trainer', 0);
    const was = p.gold;
    expect(fieldsDone(p)).toBe(ERRAND_PAY.fields);
    expect(fieldsDone(p)).toBe(0);
    expect(p.gold - was).toBe(ERRAND_PAY.fields);
    expect(p.errands!.fields).toBe(2);
    expect(openErrands(p)).toContain('fieldsback');
    expect(talkedTo(p, 'trainer', 0)).toBe(true);
    expect(p.errands!.fields).toBe(3);
    expect(openErrands(p)).not.toContain('fieldsback');
  });

  it('rested is heard for my hero, at the barn, on a roaming job only', () => {
    const ev = [{ k: 'rested', id: 'me', station: FIELD_BARN }];
    expect(heardBarn(ev, 'me', true)).toBe(true);
    expect(heardBarn(ev, 'me', false)).toBe(false);
    expect(heardBarn(ev, 'you', true)).toBe(false);
    expect(heardBarn([{ k: 'rested', id: 'me', station: 'ELSEWHERE' }], 'me', true)).toBe(false);
  });

  it('an old hero at level 5 gets it from the trainer', () => {
    const p = { ...newProfile('ROGUE', 'FQ3'), errands: doneErrands(5) };
    p.level = 5;
    expect(talkedTo(p, 'trainer', CLASS_ORDER.indexOf('ROGUE'))).toBe(true);
    expect(p.errands!.fields).toBe(1);
  });
});

describe('the trainer is marked while the word to go out waits (review, 2026-11-24)', () => {
  it('an old hero at level 5 is pointed to their trainer, then to the gate, then nowhere', () => {
    const p = { ...newProfile('WARRIOR', 'FQ9'), prologue: true, level: 5, errands: doneErrands(5) };
    expect(openErrands(p)).toContain('quest');
    talkedTo(p, 'trainer', 0);
    expect(openErrands(p)).toContain('fields');
    expect(errandWho(p, 'fields').spot).toBe('gate');
    expect(fieldsDone(p)).toBe(ERRAND_PAY.fields);
    expect(openErrands(p)).toContain('fieldsback');
    talkedTo(p, 'trainer', 0);
    expect(openErrands(p).filter((id) => id === 'fields' || id === 'fieldsback')).toEqual([]);
  });
});
