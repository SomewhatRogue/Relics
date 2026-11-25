/** The ironhide (sim/ironhide.ts): plate that wears down and comes off for good (shared/plate.ts). */
import { describe, expect, it } from 'vitest';
import { board } from '../src/shared/jobs';
import { planRoom } from '../src/shared/terrain';
import { BURN, IRONHIDE, TICK, WEAPONS, type Swing } from '../src/shared/tuning';
import { damage } from '../src/sim/damage';
import { hitEnemy } from '../src/sim/combat';
import { afflict } from '../src/sim/elements';
import { NO_INTENT } from '../src/sim/types';
import { field, run } from './foeyard';
import { PLATE, PLATE_WEAR } from '../src/shared/plate';

const iron = (x = 15, y = 4) => {
  const f = field([{ kind: 'scrapper', variant: 'ironhide', x, y }]);
  return { ...f, e: f.room.enemies[0] };
};

describe('the ironhide', () => {
  it('plate wears down and comes off for good (Kyle, 2026-11-24): a fifth to health, a heavy blow in full and stripping double', () => {
    const { room, e } = iron(15, 2);
    expect(e.hp).toBe(Math.round(IRONHIDE.hp * PLATE_WEAR.hp));
    const top = e.maxHp;
    damage(e, 20, room.time, room.events);
    expect(e.hp).toBe(top - 20 * PLATE.through);
    expect(e.plate).toBe(Math.round(e.maxHp * PLATE.share) - 20);
    const p = e.plate!;
    damage(e, 10, room.time, room.events, { heavy: true });
    expect(e.hp).toBe(top - 4 - 10);
    expect(e.plate).toBe(p - 20);
    expect(e.cracked).toBeFalsy();
    // Worn to nothing: off, and it stays off.
    while (!e.cracked) damage(e, 5, room.time, room.events);
    expect(room.events).toContainEqual(expect.objectContaining({ k: 'cracked' }));
    run(room, 10);
    expect(e.cracked).toBe(true);
    const hp = e.hp;
    damage(e, 20, room.time, room.events);
    expect(e.hp).toBe(hp - 20);
  });

  it('crits, bleed, poison, crossbow bolts, anything holy and lightning go straight through; lightning strips it', () => {
    for (const o of [{ crit: true }, { src: 'bleed', tick: true }, { src: 'poison', tick: true }, { src: 'bolt' }, { src: 'smite' }, { el: 'storm' as const }]) {
      const { room, e } = iron(15, 2);
      const top = e.maxHp;
      damage(e, 20, room.time, room.events, o);
      expect(e.hp, JSON.stringify(o)).toBe(top - 20);
      expect(e.plate, JSON.stringify(o)).toBe(Math.round(e.maxHp * PLATE.share) - ('el' in o ? 20 * PLATE.storm : 0));
    }
    // A burn doesn't: a fifth, wearing the plate.
    const { room, e } = iron(15, 2), top = e.maxHp;
    damage(e, 10, room.time, room.events, { tick: true, el: 'fire' });
    expect(e.hp).toBe(top - 2);
  });

  it('a quick blow barely marks it; a charged blow or a perfect lands in full and strips double', () => {
    const { room, h, e } = iron(15, 13);
    const swing: Swing = { ...WEAPONS.sword.combo[0], range: 9, arc: 360 };
    const n = hitEnemy(h, swing, e, room.time, room.events);
    expect(n).toBe(Math.max(1, Math.round(swing.dmg * PLATE.through)));
    expect(room.events).toContainEqual(expect.objectContaining({ k: 'hit', plated: true }));
    h.hitIds = [];
    h.perfect = true;
    const p = e.plate!, n2 = hitEnemy(h, swing, e, room.time, room.events);
    expect(n2).toBeGreaterThan(n);
    expect(p - e.plate!).toBe(Math.min(p, 2 * n2));
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
