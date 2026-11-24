import { describe, expect, it } from 'vitest';
import { RUMOURS } from '../src/client/rumours';
import { CAP_GUEST, CAP_LEAD, MIN_SHOW, QUIET, canLift, joinNames, rumourFor, whoIsComing } from '../src/client/loadpage';

describe('the rumour a job gets', () => {
  it('is the same for one seed', () => {
    expect(rumourFor(4242)).toBe(rumourFor(4242));
    expect(RUMOURS).toContain(rumourFor(77));
  });
  it('spreads over the list', () => {
    const seen = new Set<string>();
    for (let s = 0; s < 200; s++) seen.add(rumourFor(s * 101 + 1));
    expect(seen.size).toBe(RUMOURS.length);
  });
});

describe('when the page lifts', () => {
  const base = { drawn: true, shown: 3, waiting: 0, quiet: null, cap: CAP_LEAD };
  it('waits for the map to be drawn and the words to be read', () => {
    expect(canLift({ ...base, drawn: false })).toBe(false);
    expect(canLift({ ...base, shown: MIN_SHOW - 0.1 })).toBe(false);
    expect(canLift(base)).toBe(true);
  });
  it('waits for those still coming, until the cap', () => {
    expect(canLift({ ...base, waiting: 2 })).toBe(false);
    expect(canLift({ ...base, waiting: 2, shown: CAP_LEAD })).toBe(true);
  });
  it('a friend with no word from the leader lifts after a quiet moment, and one with a word does not wait for it', () => {
    expect(canLift({ ...base, quiet: QUIET - 0.1, cap: CAP_GUEST })).toBe(false);
    expect(canLift({ ...base, quiet: QUIET, cap: CAP_GUEST })).toBe(true);
    expect(canLift({ ...base, waiting: 1, quiet: 9, cap: CAP_GUEST })).toBe(false);
  });
  it('never before the drawn map and the minimum, even past the cap', () => {
    expect(canLift({ ...base, drawn: false, shown: 99 })).toBe(false);
  });
});

describe('who is still coming', () => {
  it('names friends not gone who have not said they are in the room they are in', () => {
    const f = [
      { name: 'Ann', gone: false, here: 5, key: 5 },
      { name: 'Bo', gone: false, here: 4, key: 5 },
      { name: 'Cy', gone: false, key: 5 },
      { name: 'Di', gone: true, key: 5 },
    ];
    expect(whoIsComing(f)).toEqual(['Bo', 'Cy']);
    expect(whoIsComing(f.slice(0, 1))).toEqual([]);
  });
  it('joins names plainly', () => {
    expect(joinNames(['Ann'])).toBe('Ann');
    expect(joinNames(['Ann', 'Bo'])).toBe('Ann and Bo');
    expect(joinNames(['Ann', 'Bo', 'Cy'])).toBe('Ann, Bo and Cy');
  });
});
