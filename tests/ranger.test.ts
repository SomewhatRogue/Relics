import { describe, expect, it } from 'vitest';
import { newEnemy } from '../src/sim/enemies';
import { newHero } from '../src/sim/hero';
import { laySnare, stepHound, stepSnare } from '../src/sim/ranger';
import { HOUND, SNARE } from '../src/shared/tuning';
import type { FightEvent, Snare } from '../src/sim/types';

describe('the Ranger', () => {
  it('jumping back leaves a snare (one per cooldown) that holds the first small goblin in it', () => {
    const h = Object.assign(newHero('me', 5, 5), { weapon: 'longbow', rollX: 5, rollY: 5 }), snares: Snare[] = [], ev: FightEvent[] = [];
    laySnare(h, snares, 1, ev);
    laySnare(h, snares, 2, ev);
    expect(snares.length).toBe(1);
    laySnare(h, snares, 1 + SNARE.cooldown, ev);
    expect(snares.length).toBe(2);
    const g = newEnemy(1, 'scrapper', 5.2, 5);
    expect(stepSnare(snares[0], [g], 3, ev)).toBe(false);
    expect(g.act).toBe('stunned');
    // A Warrior leaves nothing.
    const w = Object.assign(newHero('w', 5, 5), { weapon: 'sword' });
    laySnare(w, snares, 1, ev);
    expect(snares.filter((s) => s.owner === 'w').length).toBe(0);
  });

  it("the hound joins in now and then, can't be hurt, and a butcher winding up scares it off for a while", () => {
    const h = Object.assign(newHero('me', 5, 5), { weapon: 'longbow' }), g = Object.assign(newEnemy(1, 'scrapper', 8, 5), { alert: true, cooldown: 99 }), ev: FightEvent[] = [];
    let t = 0;
    for (; t < 12 && g.hp === g.maxHp; t += 0.05) stepHound(h, [g], t, 0.05, ev);
    expect(g.hp).toBeLessThan(g.maxHp);
    const b = Object.assign(newEnemy(2, 'butcher', h.hound!.x + 1, h.hound!.y), { alert: true });
    b.attack = { kind: 'cleave', t: 0.1, windup: 1, active: 0.1, recover: 0.5, dmg: 20, knock: 5, unblockable: false, dx: 1, dy: 0, ox: b.x, oy: b.y, range: 2, arc: 90, cx: 0, cy: 0, radius: 0, done: false };
    stepHound(h, [g, b], t, 0.05, ev);
    expect(h.hound!.state).toBe('fled');
    expect(ev.some((e) => e.k === 'yelp')).toBe(true);
    stepHound(h, [g], t + HOUND.away + 0.1, 0.05, ev);
    expect(h.hound!.state).toBe('heel');
  });
});
