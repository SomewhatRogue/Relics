/** Who wears plate (Kyle, 2026-11-24; docs/design/armor.md, shared/plate.ts). */
import { describe, expect, it } from 'vitest';
import { PLATE, PLATE_WEAR, plateByLevel, plateChance } from '../src/shared/plate';
import type { Foe } from '../src/shared/terrain';
import { VARIANTS } from '../src/shared/tuning';
import { field } from './foeyard';

describe('who wears plate', () => {
  it('none before level 3, then more each level, capped', () => {
    expect(plateChance(2)).toBe(0);
    expect(plateChance(3)).toBeCloseTo(PLATE_WEAR.first);
    expect(plateChance(6)).toBeGreaterThan(plateChance(4));
    expect(plateChance(40)).toBe(PLATE_WEAR.most);
  });

  it('a brute plated by level costs its pack a small one; named ones and other sorts never', () => {
    const room = (): Foe[] => [
      ...Array.from({ length: 10 }, (_, i): Foe => ({ kind: 'scrapper', variant: 'heavy', role: 'heavy', x: i, y: 1, pack: i })),
      ...Array.from({ length: 10 }, (_, i): Foe => ({ kind: 'scrapper', x: i, y: 2, pack: i })),
      { kind: 'butcher', x: 1, y: 5, name: 'MAWL' },
      { kind: 'scrapper', variant: 'shield', role: 'shield', x: 2, y: 5, pack: 0 },
    ];
    expect(plateByLevel(room(), 2, 5)).toHaveLength(22);
    const out = plateByLevel(room(), 30, 5), plated = out.filter((f) => f.elite?.includes('plated'));
    expect(plated.length).toBeGreaterThan(0);
    expect(plated.every((f) => f.variant === 'heavy')).toBe(true);
    expect(out).toHaveLength(22 - plated.length);
    expect(plateByLevel(room(), 30, 5).map((f) => f.elite)).toEqual(out.map((f) => f.elite));
  });

  it('a plated goblin is a quarter tougher; a named boss in a fury wears a third of its health in plate', () => {
    const { room } = field([{ kind: 'scrapper', variant: 'heavy', role: 'heavy', x: 15, y: 6, elite: ['plated'] }, { kind: 'scrapper', variant: 'heavy', role: 'heavy', x: 10, y: 6 }]);
    const [p, b] = room.enemies;
    expect(p.maxHp).toBe(Math.round(VARIANTS.heavy.hp * PLATE_WEAR.hp));
    expect(b.maxHp).toBe(VARIANTS.heavy.hp);
    const boss = field([{ kind: 'butcher', x: 15, y: 6, name: 'MAWL' }]).room.enemies[0];
    expect(boss.fury).toBe(true);
    expect(PLATE_WEAR.boss).toBeLessThan(PLATE.share);
  });
});

import { plateShare } from '../src/sim/ironhide';
import { damage } from '../src/sim/damage';

describe('the plate bar (drawing reads it)', () => {
  it('full before a blow, less after, gone once off; none on a bare goblin', () => {
    const { room } = field([{ kind: 'scrapper', variant: 'ironhide', x: 15, y: 6 }, { kind: 'scrapper', x: 10, y: 6 }]);
    const [e, bare] = room.enemies;
    expect(plateShare(e)).toBe(1);
    expect(e.plate).toBeUndefined();
    damage(e, 10, room.time, room.events);
    expect(plateShare(e)!).toBeLessThan(1);
    while (!e.cracked) damage(e, 10, room.time, room.events, { heavy: true });
    expect(plateShare(e)).toBeNull();
    expect(plateShare(bare)).toBeNull();
  });
});
