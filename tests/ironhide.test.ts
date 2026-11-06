/** The ironhide (sim/ironhide.ts): plated until its guard breaks, then full damage for a few seconds. */
import { describe, expect, it } from 'vitest';
import { board } from '../src/shared/jobs';
import { planRoom } from '../src/shared/terrain';
import { BURN, IRONHIDE, TICK, WEAPONS, type Swing } from '../src/shared/tuning';
import { damage } from '../src/sim/damage';
import { hitEnemy } from '../src/sim/combat';
import { afflict } from '../src/sim/elements';
import { NO_INTENT } from '../src/sim/types';
import { field, run } from './foeyard';

const iron = (x = 15, y = 4) => {
  const f = field([{ kind: 'scrapper', variant: 'ironhide', x, y }]);
  return { ...f, e: f.room.enemies[0] };
};

describe('the ironhide', () => {
  it('takes a fifth until its guard is broken, then full damage for the window, then a fifth again', () => {
    const { room, e } = iron(15, 2);
    expect(e.hp).toBe(IRONHIDE.hp);
    damage(e, 50, room.time, room.events);
    expect(e.hp).toBe(IRONHIDE.hp - 50 * IRONHIDE.armour);
    // A heavy hit breaks it and lands in full; so does the next while it's broken.
    damage(e, 20, room.time, room.events, { heavy: true });
    expect(e.cracked).toBe(true);
    expect(room.events).toContainEqual(expect.objectContaining({ k: 'cracked' }));
    expect(e.hp).toBe(IRONHIDE.hp - 10 - 20);
    damage(e, 20, room.time, room.events);
    expect(e.hp).toBe(IRONHIDE.hp - 50);
    run(room, IRONHIDE.broken + 0.1);
    expect(e.cracked).toBe(false);
    const hp = e.hp;
    damage(e, 20, room.time, room.events);
    expect(e.hp).toBe(hp - 20 * IRONHIDE.armour);
  });

  it('a quick blow barely marks it; a charged blow or a perfect breaks it', () => {
    const { room, h, e } = iron(15, 13);
    const swing: Swing = { ...WEAPONS.sword.combo[0], range: 9, arc: 360 };
    const n = hitEnemy(h, swing, e, room.time, room.events);
    expect(n).toBe(Math.max(1, Math.round(swing.dmg * IRONHIDE.armour)));
    expect(room.events).toContainEqual(expect.objectContaining({ k: 'hit', plated: true }));
    expect(e.cracked).toBeFalsy();
    h.hitIds = [];
    h.perfect = true;
    hitEnemy(h, swing, e, room.time, room.events);
    expect(e.cracked).toBe(true);
  });

  it('a block of its blow holds, but does not break its guard (no parry: only a charged blow or a perfect does)', () => {
    const { room, h, e } = iron(15, 11);
    room.setIntent(h.id, { ...NO_INTENT, ay: -1 });
    run(room, 6, () => e.attack?.kind === 'cleave');
    const a = e.attack!;
    expect(a.unblockable).toBe(false);
    run(room, a.windup - a.t - 0.12);
    room.setIntent(h.id, { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
    const ev = run(room, 0.3);
    expect(ev.some((x) => x.k === 'block')).toBe(true);
    expect(e.cracked).toBeFalsy();
    expect(h.hp).toBe(100);
  });

  it('burns half as long, as a brute does', () => {
    const { room, e } = iron(15, 2);
    afflict({ heroes: room.heroes, enemies: room.enemies, javelins: [], props: [], survivors: [], now: room.time, ev: room.events, rng: undefined as never }, e, 'fire', 5);
    expect(e.burnUntil).toBeCloseTo(room.time + BURN.time * BURN.tough, 5);
  });

  it('comes in packs from a job\'s second room on, and not in every room', () => {
    const jobs = Array.from({ length: 60 }, (_, d) => board(d + 1)).flat();
    let first = 0, later = 0, rooms = 0;
    for (const j of jobs) for (let i = 0; i < j.rooms; i++) {
      const n = planRoom(j, i).foes.filter((f) => f.variant === 'ironhide').length;
      if (i === 0) first += n;
      else (rooms++, (later += n ? 1 : 0));
    }
    expect(first).toBe(0);
    expect(later).toBeGreaterThan(0);
    expect(later / rooms).toBeLessThan(0.5);
    void TICK;
  });
});
