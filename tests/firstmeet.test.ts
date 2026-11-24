import { describe, expect, it } from 'vitest';
import { ERRANDW } from '../src/client/errandwords';
import { CLASS_ORDER } from '../src/shared/weapons';
import { newProfile } from '../src/shared/progress';
import { openErrands, told, talkedTo } from '../src/shared/errands';
import { questHeld } from '../src/shared/heroquests';

describe('the first meeting with your trainer (General, 2026-11-24)', () => {
  it('two beats for every class: teaching in time, then the board; never says "reputation"', () => {
    for (const c of CLASS_ORDER) {
      expect(ERRANDW.firstVisit[c]).toBeTruthy();
      expect(ERRANDW.firstWork[c]).toMatch(/board/i);
      expect(ERRANDW.firstVisit[c] + ERRANDW.firstWork[c]).not.toMatch(/reputation|—/i);
    }
  });
  it('leaves you holding the first job, pointed at the board', () => {
    const p = newProfile('ROGUE');
    p.prologue = true, told(p);
    talkedTo(p, 'trainer', CLASS_ORDER.indexOf('ROGUE'));
    expect(questHeld(p)?.q.id).toBe('q1');
    expect(openErrands(p)).toContain('job');
  });
});
