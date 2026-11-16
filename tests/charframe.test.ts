import { describe, expect, it } from 'vitest';
import { blowCol, facingFor, goblinShows, knightShows, rowOf, walkCol, type KitMeta, type Shown } from '../src/client/charframe';

const o = { facing: 'side' as const, flip: false } as { facing: 'side' | 'back' | 'front'; flip: boolean };
const s: Shown = { row: '', col: 0 };
const meta: KitMeta = { w: 10, h: 10, fx: 5, fy: 9, tall: 8, facings: ['side', 'back', 'front'], rows: [['walk', 8], ['slash1', 5], ['misc', 6]] };
const K = { act: 'idle', heavy: false, combo: 0, blocking: false, phase: 'rest', k: 0, moving: false, walk: 3 };

describe('new look characters: the frame', () => {
  it('reads the facing as the camera sees it', () => {
    expect(facingFor(0, 1, 0, o)).toEqual({ facing: 'front', flip: false });
    expect(facingFor(0, -1, 0, o)).toEqual({ facing: 'back', flip: false });
    expect(facingFor(1, 0, 0, o)).toEqual({ facing: 'side', flip: false });
    expect(facingFor(-1, 0, 0, o)).toEqual({ facing: 'side', flip: true });
    // The camera swung to look east: walking east is walking away from it.
    expect(facingFor(1, 0, Math.PI / 2, o).facing).toBe('back');
  });

  it('finds a facing\'s row in the kit', () => {
    expect(rowOf(meta, 'side', 'walk')).toBe(0);
    expect(rowOf(meta, 'back', 'misc')).toBe(5);
    expect(rowOf(meta, 'front', 'slash1')).toBe(7);
  });

  it('plays a blow by its phase, held through on the hit', () => {
    expect(blowCol('windup', 0.5)).toBe(0);
    expect(blowCol('release', 0.1)).toBe(1);
    expect(blowCol('release', 0.8)).toBe(2);
    expect(blowCol('contact', 0)).toBe(2);
    expect([0.1, 0.5, 0.9].map((k) => blowCol('recover', k))).toEqual([2, 3, 4]);
  });

  it('pulls a seven-frame blow back in two, and carries it through after', () => {
    expect([0.2, 0.7].map((k) => blowCol('windup', k, 7))).toEqual([0, 1]);
    expect(blowCol('release', 0.1, 7)).toBe(2);
    expect(blowCol('contact', 0, 7)).toBe(3);
    expect([0.1, 0.4, 0.9].map((k) => blowCol('recover', k, 7))).toEqual([4, 5, 6]);
    expect(knightShows({ ...K }, s, 7)).toEqual({ row: 'slash1', col: 6 });
  });

  it('walks by the ground covered', () => {
    expect([0, 0.25, 0.5, 1.0, 1.9].map((d) => walkCol(d, 2))).toEqual([0, 1, 2, 4, 7]);
  });

  it('gives each of the knight\'s blows its own frames', () => {
    expect(knightShows({ ...K, act: 'attack', combo: 1, phase: 'release', k: 0.8 }, s)).toEqual({ row: 'slash2', col: 2 });
    expect(knightShows({ ...K, act: 'attack', combo: 2, phase: 'windup' }, s)).toEqual({ row: 'slash3', col: 0 });
    expect(knightShows({ ...K, act: 'attack', heavy: true, phase: 'contact' }, s)).toEqual({ row: 'misc', col: 1 });
    expect(knightShows({ ...K, blocking: true }, s)).toEqual({ row: 'misc', col: 3 });
    expect(knightShows({ ...K, moving: true }, s)).toEqual({ row: 'walk', col: 3 });
    expect(knightShows(K, s)).toEqual({ row: 'slash1', col: 4 });
  });

  it('gives the goblin its blows, its hurts and its fall', () => {
    const G = { attack: '', phase: 'rest', k: 0, moving: false, walk: 2, dead: -1 };
    expect(goblinShows({ ...G, attack: 'pounce', phase: 'release', k: 0.9 }, s)).toEqual({ row: 'lunge', col: 2 });
    expect(goblinShows({ ...G, phase: 'stagger', k: 0.7 }, s)).toEqual({ row: 'misc', col: 1 });
    expect([0, 0.2, 3].map((d) => goblinShows({ ...G, dead: d }, s).col)).toEqual([3, 4, 5]);
  });
});
