// The first hungry piece home (Kyle, 2026-11-23): two quests at once, the church and the Keeping Room.
import { describe, expect, it } from 'vitest';
import { hungryHome, wantOpen, wantShown, wantTalked, whisperDue, whisperHeard } from '../src/shared/wanterrands';
import { errandWho, fitErrands, newErrands, openErrands } from '../src/shared/errands';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { newProfile } from '../src/shared/progress';
import { errandLine } from '../src/client/errandline';
import { WANTQW } from '../src/client/wanterrandwords';

const hero = () => { const p = newProfile('ROGUE', 'TESS', 't'); p.errands = { ...newErrands(), told: true, relic: true, trainer: true }; return p; };

describe('the first hungry piece home', () => {
  it('opens both quests once, only with hungry gear on you or in the pack', () => {
    const p = hero();
    expect(hungryHome(p)).toBe(false);
    p.bag.push(rollHungry(new Rng(2), 'ROGUE'));
    expect(hungryHome(p)).toBe(true);
    expect(openErrands(p)).toEqual(expect.arrayContaining(['church', 'under']));
    expect(hungryHome(p)).toBe(false);
  });
  it('the church, then the Keeping Room: each done by talking; the bar shows from the first', () => {
    const p = hero();
    p.bag.push(rollHungry(new Rng(2), 'ROGUE'));
    hungryHome(p);
    expect(wantShown(p)).toBe(false);
    expect(wantTalked(p, 'church')).toBe(true);
    expect(wantShown(p)).toBe(true);
    expect(wantOpen(p, 'church')).toBe(false);
    expect(wantOpen(p, 'under')).toBe(true);
    expect(wantTalked(p, 'church')).toBe(false);
    wantTalked(p, 'under');
    expect(openErrands(p)).not.toContain('under');
    // Never again, even with more hungry gear.
    expect(hungryHome(p)).toBe(false);
  });
  it('the whisper is heard once, when the quests open', () => {
    const p = hero();
    expect(whisperDue(p)).toBe(false);
    p.bag.push(rollHungry(new Rng(2), 'ROGUE'));
    hungryHome(p);
    expect(whisperDue(p)).toBe(true);
    whisperHeard(p);
    expect(whisperDue(p)).toBe(false);
  });
  it('sends you to the church, and to the grate', () => {
    const p = hero();
    expect(errandWho(p, 'church')).toEqual({ door: 'church', talk: 'church' });
    expect(errandWho(p, 'under').spot).toBe('sewer');
  });
  it('a save keeps where the quests are', () => {
    const e = fitErrands({ told: true, relic: true, trainer: true, seen: 3, church: 2, under: 1 }, 3);
    expect(e.church).toBe(2);
    expect(e.under).toBe(1);
    expect(fitErrands({ told: true, church: 7 }, 1).church).toBeUndefined();
  });
  it('the goal line names both', () => {
    const p = hero();
    p.bag.push(rollHungry(new Rng(2), 'ROGUE'));
    hungryHome(p);
    const line = errandLine(p)!;
    expect(line.rows).toContain(WANTQW.todo.church);
    expect(line.rows).toContain(WANTQW.todo.under);
    expect(line.small.length).toBeGreaterThan(5);
  });
});
