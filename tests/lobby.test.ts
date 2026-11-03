/** Parties gathering in town: who's taken in, who's let go, who came and went, and where a member stands. */
import { describe, expect, it } from 'vitest';
import { board } from '../src/shared/jobs';
import { PARTY_GRACE, PARTY_MAX, admit, changes, cleanName, drop, isOffer, post, quiet, standing, tagOf } from '../src/shared/lobby';

const job = board(3)[0];
const party = () => post(job, 'kyle', 'Kyle', 7);

describe('posting and joining', () => {
  it('a party goes up with its leader, and only a small tag of the job', () => {
    const o = party();
    expect(o.m).toEqual([['kyle', 'KYLE']]);
    expect(o.j).toEqual(tagOf(job));
    expect(JSON.stringify(o).length).toBeLessThan(220);
    expect(isOffer(o)).toBe(true);
  });
  it('takes people in up to the most, once each', () => {
    const o = party();
    expect(admit(o, 'sam', 'sam')).toBe(true);
    expect(admit(o, 'sam', 'sam')).toBe(false);
    for (let i = 0; o.m.length < PARTY_MAX; i++) admit(o, 'p' + i, 'p' + i);
    expect(admit(o, 'late', 'late')).toBe(false);
    expect(o.m.length).toBe(PARTY_MAX);
  });
  it('names from another browser are made safe', () => {
    expect(cleanName('<b>sam</b>')).toBe('BSAMB');
    expect(cleanName('')).toBe('STRANGER');
    expect(cleanName('x'.repeat(40)).length).toBe(14);
  });
  it('lets a member go, never the leader', () => {
    const o = party();
    admit(o, 'sam', 'SAM');
    expect(drop(o, 'kyle')).toBe(false);
    expect(drop(o, 'sam')).toBe(true);
    expect(drop(o, 'sam')).toBe(false);
    expect(o.m).toEqual([['kyle', 'KYLE']]);
  });
  it('turns away a party that is not one', () => {
    expect(isOffer(null)).toBe(false);
    expect(isOffer({ j: { id: 'x' }, m: [] })).toBe(false);
    expect(isOffer({ ...party(), m: [] })).toBe(false);
    expect(isOffer({ ...party(), m: Array(PARTY_MAX + 1).fill(['a', 'A']) })).toBe(false);
  });
});

describe('who came and went', () => {
  it('names each once, and never yourself', () => {
    const d = changes([['kyle', 'KYLE'], ['sam', 'SAM']], [['kyle', 'KYLE'], ['ana', 'ANA'], ['me', 'ME']], 'me');
    expect(d).toEqual({ joined: ['ANA'], left: ['SAM'] });
  });
});

describe('the grace', () => {
  it('a member quiet past it is let go; one heard from lately stays', () => {
    const o = party();
    admit(o, 'sam', 'SAM');
    admit(o, 'ana', 'ANA');
    const heard = new Map([['kyle', 0], ['sam', 100], ['ana', 100 - PARTY_GRACE - 1]]);
    expect(quiet(o, heard, 100, 'kyle')).toEqual(['ana']);
  });
  it('a member reloading inside it stays in', () => {
    const o = party();
    admit(o, 'sam', 'SAM');
    expect(quiet(o, new Map([['sam', 100]]), 100 + PARTY_GRACE - 1, 'kyle')).toEqual([]);
  });
});

describe("a member's standing", () => {
  it('in, asked, full, called off, or broken up', () => {
    const o = party();
    expect(standing(o, 'sam', 100, 101)).toBe('asked');
    admit(o, 'sam', 'SAM');
    expect(standing(o, 'sam', 100, 101)).toBe('in');
    expect(standing(undefined, 'sam', 100, 101)).toBe('off');
    expect(standing(o, 'sam', 100, 101 + PARTY_GRACE)).toBe('quiet');
    while (o.m.length < PARTY_MAX) admit(o, 'p' + o.m.length, 'P');
    expect(standing(o, 'late', 100, 101)).toBe('full');
  });
});
