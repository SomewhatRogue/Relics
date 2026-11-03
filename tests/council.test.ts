import { describe, expect, it } from 'vitest';
import { memoryWorldStore } from '../api/_world';
import { closeFor, localDay, weekEnd } from '../src/shared/councilweek';
import { CHAPTER_1, newWorld, settle, vote } from '../src/shared/story';
import { contribute } from '../src/shared/worldsync';

const H = 3600_000, D = 24 * H;
const open = () => Object.assign(newWorld(), { rescued: 6, storyDone: [CHAPTER_1.mission.id] });
const hero = (n: string) => ({ id: 'h' + n.padEnd(9, '0'), name: n, cls: 'MAGE' as const });
const WED = Date.UTC(2026, 10, 4, 20); // Wednesday 4 November 2026, noon Pacific (PST)

describe('the council week', () => {
  it('closes at midnight at the end of Sunday, Pacific, daylight saving or not', () => {
    expect(weekEnd(WED)).toBe(Date.UTC(2026, 10, 9, 8)); // Monday 00:00 PST
    expect(weekEnd(Date.UTC(2026, 6, 8, 19))).toBe(Date.UTC(2026, 6, 13, 7)); // July: PDT
    expect(weekEnd(Date.UTC(2026, 9, 28, 19))).toBe(Date.UTC(2026, 10, 2, 8)); // the week the clocks go back
    expect(localDay(weekEnd(WED) - 1).dow).toBe(0); // the last moment is Sunday's
    // Opened late on Sunday: it sits the next week as well.
    expect(closeFor(Date.UTC(2026, 10, 9, 6))).toBe(Date.UTC(2026, 10, 16, 8));
  });

  it('is decided lazily at the close: the most votes win, and land then', () => {
    const w = open();
    expect(vote(w, 'd1', 'refugees', WED)).toBe(true);
    expect(vote(w, 'd2', 'refugees', WED + H)).toBe(true);
    expect(vote(w, 'd3', 'farm', WED + 2 * H)).toBe(true);
    expect(vote(w, 'd3', 'refugees', WED + 3 * H)).toBe(true); // a voice can change before the close
    expect(settle(w, WED + 4 * D)).toBe(null);
    expect(w.flags[CHAPTER_1.decision.id]).toBeUndefined();
    expect(settle(w, weekEnd(WED))).toBe('refugees');
    expect(w.rescued).toBe(10);
    expect(vote(w, 'd4', 'farm', weekEnd(WED) + H)).toBe(false); // closed
  });

  it('a tie sits one more night; still tied, the reeve breaks it for the side voted for first', () => {
    const w = open();
    vote(w, 'd1', 'farm', WED);
    vote(w, 'd2', 'refugees', WED + H);
    const close = w.councilCloses!;
    expect(settle(w, close)).toBe(null);
    expect(w.councilCloses).toBe(close + D);
    expect(settle(w, close + D)).toBe('farm');
  });

  it('with no votes at all it sits another week', () => {
    const w = open();
    settle(w, WED);
    expect(settle(w, weekEnd(WED) + H)).toBe(null);
    expect(w.councilCloses).toBe(weekEnd(weekEnd(WED)));
  });

  it('the server decides it when the world is next read after the close, no timer needed', async () => {
    let now = WED;
    const store = memoryWorldStore(() => now);
    await store.apply('g', { hero: hero('ONE'), rescued: 6, story: CHAPTER_1.mission.id });
    await store.apply('g', { hero: hero('ONE'), vote: 'farm', voter: 'd1' });
    expect((await store.load('g')).world.flags[CHAPTER_1.decision.id]).toBeUndefined();
    now = weekEnd(WED) + 5 * D;
    expect((await store.load('g')).world.flags[CHAPTER_1.decision.id]).toBe('farm');
  });

  it("a browser off the server closes it the same way (contribute at its own time)", () => {
    const w = open();
    contribute(w, { hero: hero('ONE'), vote: 'refugees', voter: 'd1' }, WED, false);
    contribute(w, { hero: hero('ONE'), days: 1 }, weekEnd(WED) + H, false);
    expect(w.flags[CHAPTER_1.decision.id]).toBe('refugees');
  });
});
