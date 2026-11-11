/** No stun-lock (Kyle, 2026-11-11): small goblins can't chain-stagger a hero. */
import { describe, expect, it } from 'vitest';
import { hitHero } from '../src/sim/combat';
import { STAGGER, TICK } from '../src/shared/tuning';
import { field } from './foeyard';

describe('no stun-lock', () => {
  it('a second small blow inside STAGGER.guard hurts but does not stagger; after it, it does', () => {
    const f = field([{ kind: 'scrapper', x: 15, y: 10 }], [['me', 15, 11]]);
    const e = f.room.enemies[0], h = f.h;
    h.weapon = 'wand'; // (A Warrior's heavy armour never staggers to a small goblin at all.)
    h.safeT = 0;
    const a = { kind: 'stab', t: 0.5, windup: 0.5, active: 0.1, recover: 0.5, dmg: 5, knock: 2, unblockable: false, aimed: h.id, ox: 15, oy: 10, dx: 0, dy: 1, range: 2, arc: 120 } as never;
    const blow = () => hitHero(e, a, h, f.room.time, [], f.room.heroes);
    blow();
    expect(h.act).toBe('hurt');
    h.act = 'idle';
    const hp = h.hp;
    blow();
    expect(h.hp).toBeLessThan(hp);
    expect(h.act).toBe('idle');
    f.room.time += STAGGER.guard + TICK;
    blow();
    expect(h.act).toBe('hurt');
  });
});
