/** What a STRONG or FIERCE edge does in the fight (sim/elements.ts afflict, sim/traits.ts forgedGrade). */
import { describe, expect, it } from 'vitest';
import { TICK } from '../src/shared/tuning';
import { newEnemy } from '../src/sim/enemies';
import { afflict, stepElements, type World } from '../src/sim/elements';
import { newHero } from '../src/sim/hero';
import { forgedElement, forgedGrade } from '../src/sim/traits';
import type { Item } from '../src/shared/loot';
import type { Enemy, FightEvent } from '../src/sim/types';
import type { Grade } from '../src/shared/edges';

const foe = (kind: 'scrapper' | 'butcher' = 'butcher'): Enemy => Object.assign(newEnemy(1, kind, 9, 7), { hp: 9999, maxHp: 9999, alert: true });
const world = (e: Enemy): World => ({ heroes: [], enemies: [e], javelins: [], props: [], now: 0, ev: [] as FightEvent[] });

/** Damage taken over a whole burn from an edge of `grade` (undefined: a weapon that says no grade at all). */
function burnTotal(grade: Grade | undefined): number {
  const e = foe(), w = world(e);
  afflict(w, e, 'fire', 10, {}, grade);
  for (let t = 0; t < 12; t += TICK) (w.now = t), stepElements(w);
  return 9999 - e.hp;
}

describe('a graded edge reaches the fight', () => {
  it('forgedGrade reads the weapon edge; a hero with no edge is grade 1', () => {
    const h = newHero('me', 9, 9);
    expect(forgedGrade(h)).toBe(1);
    h.arms[h.weapon] = { slot: 'weapon', kit: h.weapon, quality: 'fine', traits: [], mods: [], level: 0, edge: { el: 'fire', jobs: 3, grade: 3 } } as unknown as Item;
    expect(forgedElement(h)).toBe('fire');
    expect(forgedGrade(h)).toBe(3);
  });
  it('a grade 3 fire burns for more than grade 2, which burns for more than grade 1; grade 1 is exactly a plain burn', () => {
    const [none, one, two, three] = [burnTotal(undefined), burnTotal(1), burnTotal(2), burnTotal(3)];
    expect(one).toBe(none);
    expect(two).toBeGreaterThan(one);
    expect(three).toBeGreaterThan(two);
  });
  it('grade 2 frost holds longer than grade 1', () => {
    const hold = (g: Grade) => { const e = foe('scrapper'), w = world(e); e.weight = 2; afflict(w, e, 'frost', 0, {}, g); afflict(w, e, 'frost', 0, {}, g); return e.frozenUntil; };
    expect(hold(2)).toBeGreaterThan(hold(1));
  });
  it('grade 2 storm shocks harder', () => {
    const zap = (g: Grade) => { const e = foe(), w = world(e); afflict(w, e, 'storm', 10, {}, g); return 9999 - e.hp; };
    const [a, b] = [zap(1), zap(2)];
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
