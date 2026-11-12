/** Bosses and BIG ONEs can't be locked down (shared/holdtune.ts, sim/bosshold.ts; docs/design/boss-threat.md step 2). */
import { describe, expect, it } from 'vitest';
import { BOSS_HOLD } from '../src/shared/tuning';
import { newEnemy } from '../src/sim/enemies';
import { freezeFor, stunFor, unheld } from '../src/sim/bosshold';
import { relicStun, stun } from '../src/sim/stuns';
import type { Enemy, FightEvent } from '../src/sim/types';

const big = () => Object.assign(newEnemy(1, 'butcher', 5, 5), { big: true }) as Enemy;
const boss = () => Object.assign(newEnemy(2, 'butcher', 5, 5), { boss: { who: 'haulier' } }) as unknown as Enemy;

describe('holding a boss', () => {
  it('freezes a boss briefly, then not again until a while after it thaws; a plain goblin as ever', () => {
    const b = boss();
    expect(freezeFor(b, 0, 2.2)).toBe(BOSS_HOLD.freeze);
    expect(unheld(b, 0.5)).toBe(true);
    expect(freezeFor(b, BOSS_HOLD.freeze + BOSS_HOLD.freezeAgain - 0.1, 2.2)).toBe(0);
    expect(freezeFor(b, BOSS_HOLD.freeze + BOSS_HOLD.freezeAgain + 0.1, 2.2)).toBe(BOSS_HOLD.freeze);
    const g = newEnemy(3, 'scrapper', 1, 1);
    expect(freezeFor(g, 0, 2.2)).toBe(2.2);
    expect(freezeFor(g, 0.1, 2.2)).toBe(2.2);
    expect(unheld(g, 0.1)).toBe(false);
  });

  it("a relic's stun on a BIG ONE is half as long, then nobody's lands for a while; a forced knockdown still does", () => {
    const e = big(), ev: FightEvent[] = [];
    relicStun(e, 0, 2, ev);
    expect(e.act).toBe('stunned');
    expect(e.actDur).toBe(2 * BOSS_HOLD.stunShare);
    Object.assign(e, { act: 'chase' });
    relicStun(e, 3, 2, ev);
    expect(e.act).toBe('chase');
    expect(ev.some((x) => x.k === 'shrug')).toBe(true);
    // A friend's ordinary stun is held back too: no chaining it in place.
    expect(stun(e, 'b', 4, 1, ev)).toBe(false);
    // A fight's own knockdown (forced) is not.
    expect(stun(e, 'c', 4, 1, ev, 'stunned', false, true)).toBe(true);
    // And after the wait, it can be stunned again.
    Object.assign(e, { act: 'chase' });
    expect(stun(e, 'b', 2 * BOSS_HOLD.stunShare + BOSS_HOLD.stunAgain + 0.1, 1, ev)).toBe(true);
    expect(e.actDur).toBe(BOSS_HOLD.stunShare);
  });

  it("a boss's stun timer is its own, and a plain goblin's stuns are untouched", () => {
    const b = boss();
    expect(stunFor(b, 0, 2)).toBe(2 * BOSS_HOLD.stunShare);
    expect(stunFor(b, 5, 2)).toBe(0);
    const g = newEnemy(4, 'scrapper', 1, 1);
    expect(stunFor(g, 0, 2)).toBe(2);
    expect(stunFor(g, 0.1, 2)).toBe(2);
  });

  it("a hero's own stun (a Rogue's) lands on a boss, then no stun or freeze for a while (Kyle, 2026-11-11)", () => {
    const b = boss(), ev: FightEvent[] = [];
    expect(stun(b, 'rogue', 0, 1, ev)).toBe(true);
    expect(b.act).toBe('stunned');
    Object.assign(b, { act: 'chase' });
    expect(stun(b, 'other', 5, 1, ev)).toBe(false);
    expect(freezeFor(b, 5, 2)).toBe(0);
    expect(stun(b, 'other', 1 * BOSS_HOLD.stunShare + BOSS_HOLD.stunAgain + 0.1, 1, ev)).toBe(true);
  });
});
