// Who may go down (shared/deepgate.ts): level 9, or this week's word.
import { describe, expect, it } from 'vitest';
import { cleanWord, DEEP_GATE, deepWeek, deepWord, mayGoDown } from '../src/shared/deepgate';

describe('the gate to the Deep', () => {
  const now = 1_800_000_000_000, week = deepWeek(now), word = deepWord(week);
  it('opens at level 9', () => {
    expect(mayGoDown(DEEP_GATE.level - 1, undefined, now)).toBe(false);
    expect(mayGoDown(DEEP_GATE.level, undefined, now)).toBe(true);
  });
  it("opens to anyone with this week's word, however they type it, and not last week's", () => {
    expect(mayGoDown(1, word.toLowerCase() + ' ', now)).toBe(true);
    expect(mayGoDown(1, 'nonsense', now)).toBe(false);
    expect(mayGoDown(1, word, now + DEEP_GATE.weekMs)).toBe(deepWord(week + 1) === word);
    expect(cleanWord(' sp-ade! ')).toBe('SPADE');
  });
  it('the word changes week to week', () => {
    const words = new Set(Array.from({ length: 12 }, (_, i) => deepWord(week + i)));
    expect(words.size).toBeGreaterThan(6);
    for (let i = 0; i < 12; i++) expect(deepWord(week + i)).not.toBe(deepWord(week + i + 1));
  });
});
