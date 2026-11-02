import { describe, expect, it } from 'vitest';
import { plan, Reveal, type Beat, type Unit } from '../src/client/reveal';

// Orla's greeting: the road (narration, typed), her first line, a look, her second line.
const P1 = {}, P2 = {}, P3 = {}, P4 = {};
const orla: Unit<string>[] = [
  { item: 'road', parent: P1, line: { fresh: true } },
  { item: 'Orla1:', parent: P2 },
  { item: 'line1', parent: P2, line: { fresh: true } },
  { item: 'look', parent: P3, letters: 36 },
  { item: 'Orla2:', parent: P4 },
  { item: 'line2', parent: P4, line: { fresh: true } },
];

describe('reading order', () => {
  it('hides everything after the first line, and brings each name with its line', () => {
    const p = plan(orla);
    expect(p.hide).toEqual(['Orla1:', 'look', 'Orla2:']);
    expect(p.beats.map((b) => [b.show, b.type])).toEqual([
      [[], 'road'], [['Orla1:'], 'line1'], [['look'], null], [['Orla2:'], 'line2'],
    ]);
  });

  it('shows what comes before the first new line at once, and plain things after the last one at the end', () => {
    const p = plan<string>([
      { item: 'stats', parent: 1 },
      { item: 'old', parent: 2, line: { fresh: false } },
      { item: 'new', parent: 3, line: { fresh: true } },
      { item: 'shelf', parent: 4 },
      { item: 'again', parent: 5, line: { fresh: false } },
    ]);
    expect(p.hide).toEqual(['shelf', 'again']);
    expect(p.beats.map((b) => [b.show, b.type])).toEqual([[[], 'new'], [['shelf', 'again'], null]]);
  });

  it('a panel with nothing new to say shows whole', () => {
    expect(plan<string>([{ item: 'a', parent: 1 }, { item: 'b', parent: 1, line: { fresh: false } }])).toEqual({ hide: [], beats: [] });
  });
});

/** A reveal of `lines` (letters each), logging what happens. */
function playing(lines: number[]) {
  const log: string[] = [];
  const beats: Beat[] = lines.map((n, k) => ({
    show: () => log.push(`show${k}`), waits: Array(n).fill(0.1), letter: (i) => log.push(`${k}.${i}`), after: 0.3,
  }));
  let done = 0;
  return { log, rev: new Reveal(beats, () => done++), done: () => done };
}

describe('the reveal', () => {
  it('types each line in turn, never two at once', () => {
    const { log, rev, done } = playing([2, 0, 2]);
    rev.step(0.05);
    expect(log).toEqual(['show0', '0.0']);
    rev.step(0.1);
    expect(log).toEqual(['show0', '0.0', '0.1']);
    rev.step(0.25); // still in the gap after line 0
    expect(log).not.toContain('show1');
    rev.step(0.2);
    expect(log).toContain('show1');
    expect(log).not.toContain('show2');
    for (let i = 0; i < 20; i++) rev.step(0.1);
    expect(log.slice(-3)).toEqual(['show2', '2.0', '2.1']);
    expect(rev.pending).toBe(false);
    expect(done()).toBe(1);
  });

  it('a tap finishes the line; the rest still waits its turn; another tap shows it all', () => {
    const { log, rev, done } = playing([3, 0, 2]);
    rev.step(0.01);
    rev.skip();
    expect(log).toEqual(['show0', '0.0', '0.1', '0.2']);
    expect(rev.pending).toBe(true);
    rev.step(0.1);
    expect(log).not.toContain('show1');
    rev.skip();
    expect(log.slice(-4)).toEqual(['show1', 'show2', '2.0', '2.1']);
    expect(rev.pending).toBe(false);
    expect(done()).toBe(1);
  });

  it('finish shows everything at once, and only finishes once', () => {
    const { log, rev, done } = playing([1, 1]);
    rev.finish();
    rev.finish();
    rev.step(1);
    expect(log).toEqual(['show0', '0.0', 'show1', '1.0']);
    expect(done()).toBe(1);
  });
});
