/** Elements put on a weapon (shared/edges.ts): the rules, the countdown, the load, and the fight reading them. */
import { describe, expect, it } from 'vitest';
import { EDGE, edgeCost, edgeRefusal, fitEdge, fitEdges, putEdge, tickEdges, type Edge } from '../src/shared/edges';
import { ELEMENT_TRAITS, type Item } from '../src/shared/loot';
import { rollGear } from '../src/shared/gear';
import { Rng } from '../src/shared/rng';
import { forgedElement, has, traitsOf } from '../src/sim/traits';
import { ArenaRoom } from '../src/sim/room';

const hero = (o: object = {}) => ({ cls: 'WARRIOR', level: 5, gold: 10000, mats: { charcoal: 3 }, edgeFree: [] as never[], ...o }) as Parameters<typeof putEdge>[0];
const sword = (o: Partial<Item> = {}): Item => ({ slot: 'weapon', kit: 'sword', quality: 'fine', traits: [], mods: [], level: 0, ilvl: 1, ...o }) as Item;

describe('putEdge', () => {
  it('refuses a Mage, a low level and a ring', () => {
    expect(putEdge(hero({ cls: 'MAGE' }), sword(), 'fire')).toBeNull();
    expect(putEdge(hero({ level: 4 }), sword(), 'fire')).toBeNull();
    expect(putEdge(hero(), sword({ slot: 'ring' }), 'fire')).toBeNull();
  });
  it('the first of each element is free and recorded', () => {
    const p = hero(), w = sword();
    for (const el of ['fire', 'frost', 'storm'] as const) expect(putEdge(p, w, el)?.free).toBe(true);
    expect(p.gold).toBe(10000);
    expect(p.edgeFree).toEqual(['fire', 'frost', 'storm']);
  });
  it('the second fire costs 5s and a charcoal; refused when short of either', () => {
    const p = hero({ edgeFree: ['fire'] }), w = sword();
    expect(putEdge(hero({ edgeFree: ['fire'], gold: 499 }), sword(), 'fire')).toBeNull();
    expect(putEdge(hero({ edgeFree: ['fire'], mats: {} }), sword(), 'fire')).toBeNull();
    expect(putEdge(p, w, 'fire')).not.toBeNull();
    expect(p.gold).toBe(10000 - EDGE.price[1]);
    expect(p.mats?.charcoal).toBe(2);
  });
  it('a new edge replaces the old', () => {
    const w = sword();
    putEdge(hero(), w, 'fire');
    putEdge(hero(), w, 'frost');
    expect(w.edge).toEqual({ el: 'frost', jobs: EDGE.jobs, grade: 1 });
  });
});

describe('grades', () => {
  it('grade 2 fire is 20s and 1 fatwood, never free; the first plain fire is free; grade 3 frost is 1 peat', () => {
    expect(edgeCost({}, 'fire', 1).free).toBe(true);
    expect(edgeCost({}, 'fire', 2)).toEqual({ gold: 1000, mats: { fatwood: 1 }, free: false });
    expect(edgeCost({ edgeFree: ['fire'] }, 'fire', 2).free).toBe(false);
    expect(edgeCost({}, 'frost', 3)).toEqual({ gold: 1500, mats: { peat: 1 }, free: false });
  });
  it('is refused for a missing material, and putEdge records the grade', () => {
    expect(edgeRefusal(hero(), sword(), 'fire', 2)).toBe('mats');
    const p = hero({ mats: { fatwood: 1 } }), w = sword();
    expect(putEdge(p, w, 'fire', 2)).not.toBeNull();
    expect(w.edge).toEqual({ el: 'fire', jobs: EDGE.jobs, grade: 2 });
    expect(p.mats?.fatwood).toBe(0);
  });
  it('fitEdge keeps grade 2 and 3 and drops junk grades', () => {
    expect(fitEdge({ el: 'fire', jobs: 3, grade: 2 })).toEqual({ el: 'fire', jobs: 3, grade: 2 });
    expect(fitEdge({ el: 'frost', jobs: 3, grade: 3 })?.grade).toBe(3);
    expect(fitEdge({ el: 'fire', jobs: 3, grade: 9 })).toEqual({ el: 'fire', jobs: 3 });
  });
});

describe('tickEdges and fitEdge', () => {
  it('counts down, removes at 0 and says which ran out', () => {
    const w = sword({ edge: { el: 'storm', jobs: 2 } }), x = sword();
    expect(tickEdges([w, x, undefined])).toEqual([]);
    expect(w.edge?.jobs).toBe(1);
    expect(tickEdges([w])).toEqual([{ el: 'storm', grade: 1 }]);
    expect(w.edge).toBeUndefined();
  });
  it('keeps a good edge and drops junk', () => {
    expect(fitEdge({ el: 'fire', jobs: 3 })).toEqual({ el: 'fire', jobs: 3 });
    expect(fitEdge({ el: 'fire', jobs: 99 })).toEqual({ el: 'fire', jobs: EDGE.jobs });
    for (const bad of [null, 'x', { el: 'acid', jobs: 3 }, { el: 'fire', jobs: 0 }, { el: 'fire', jobs: 'a' }]) expect(fitEdge(bad)).toBeUndefined();
  });
});

describe('no element on random weapons', () => {
  it('a forged weapon never rolls one', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 400; i++) {
      const it = rollGear(rng, 'WARRIOR', 'forged', 'weapon');
      expect(it.traits.some((t) => ELEMENT_TRAITS.includes(t))).toBe(false);
      expect(it.mods?.length).toBe(2);
    }
  });
});

describe('the fight reads the edge', () => {
  it('traitsOf has the old trait for a live edge, and not without', () => {
    const room = new ArenaRoom(1), h = room.join('me');
    h.arms[h.weapon] = sword({ kit: h.weapon });
    expect(has(h, 'ember')).toBe(false);
    expect(forgedElement(h)).toBe('');
    h.arms[h.weapon]!.edge = { el: 'fire', jobs: 3 } as Edge;
    expect(traitsOf(h)).toContain('ember');
    expect(forgedElement(h)).toBe('fire');
  });
});

describe('the load', () => {
  it('strips an old element, keeps a named piece\'s own, keeps a good edge, fits edgeFree', () => {
    const p = {
      arms: { sword: sword({ traits: ['ember'], edge: { el: 'frost', jobs: 2 } }) },
      bag: [sword({ traits: ['rime', 'tempo'], edge: { el: 'bad', jobs: 2 } as never }), sword({ traits: ['ember'], unique: 'spoonladle' })],
      rings: [], edgeFree: ['fire', 'fire', 'acid'] as never[],
    };
    fitEdges(p);
    expect(p.arms.sword.traits).toEqual([]);
    expect(p.arms.sword.edge).toEqual({ el: 'frost', jobs: 2 });
    expect(p.bag[0].traits).toEqual(['tempo']);
    expect(p.bag[0].edge).toBeUndefined();
    expect(p.bag[1].traits).toEqual(['ember']);
    expect(p.edgeFree).toEqual(['fire']);
    fitEdges(p);
    expect(p.arms.sword.edge).toEqual({ el: 'frost', jobs: 2 });
  });
});
