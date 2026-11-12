// The Doorkeepers' threat (docs/design/boss-threat.md step 3): the VAULT at the hero furthest off, the BASH
// straight after the sweep, and the ENRAGED QUAKE's crack running at you, circle by circle.
import { describe, expect, it } from 'vitest';
import { DOORKEEPERS as D, type DoorMove } from '../src/shared/tuning';
import { rotation } from '../src/sim/bosskit';
import { quakeShapes } from '../src/sim/quakeshape';
import { barn, place, run, still, wake } from './bossarena';

/** The mover (Hasp) about to begin `move` from its rotation, the wall (Latch) held out of it. */
const next = (b: ReturnType<typeof barn>, move: DoorMove, phase: 1 | 2 = 1) => {
  const e = b.hasp, bo = e.boss!;
  if (phase === 2) Object.assign(b.latch, { hp: 0, act: 'dead' }), Object.assign(bo, { phase: 2 }), (b.room.bosses!.phase = 2);
  else still(b.latch);
  Object.assign(bo, { job: 'move', rot: rotation(phase, bo.party, b.room.bosses!.swaps[phase - 1]).indexOf(move), rotAt: b.room.time, roarUntil: -9 });
  e.cooldown = 0;
  return e;
};

describe("the Doorkeepers' threat", () => {
  it('vaults to a hero keeping their distance, a striped circle where it lands, and comes down there', () => {
    const b = barn(['sword'], [[3, 12]]);
    wake(b);
    const e = next(b, 'vault'), me = b.heroes[0];
    place(e, 9, 5, -0.5, 0.8);
    me.hp = me.maxHp = 9999;
    run(b, 3, () => ({}));
    const ev = run(b, 0.01);
    void ev;
    expect(Math.hypot(e.x - 3, e.y - 12)).toBeLessThan(1.5);
    expect(me.hp).toBeLessThan(9999);
  });

  it('passes the vault over with nobody far off', () => {
    const b = barn(['sword'], [[6, 7]]);
    wake(b);
    const e = next(b, 'vault');
    place(e, 6, 5.5, 0, 1);
    run(b, 0.5);
    expect(e.attack?.boss).not.toBe('vault');
  });

  it('the bash comes straight after the sweep, quick and red, its door open after', () => {
    const b = barn(['sword'], [[6, 7]]);
    wake(b);
    const e = next(b, 'sweep'), me = b.heroes[0];
    place(e, 6, 5.2, 0, 1);
    me.hp = me.maxHp = 9999;
    let bashed = false;
    run(b, 5, () => ((bashed ||= e.attack?.boss === ('bash' as never)), {}));
    expect(bashed).toBe(true);
    expect(D.bash.windup).toBeLessThan(0.5);
    expect(D.bash.unblockable).toBe(false);
  });

  it('ENRAGED, the quake runs at you: circles in a line landing one after another, each one hurts', () => {
    const b = barn(['sword'], [[6, 9]]);
    wake(b);
    const e = next(b, 'quake', 2), me = b.heroes[0];
    place(e, 6, 5, 0, 1);
    me.hp = me.maxHp = 9999;
    let most = 0;
    const ev = run(b, 4, () => ((most = Math.max(most, quakeShapes(e).length)), {}));
    expect(most).toBe(D.quakeN);
    expect(ev.filter((x) => x.k === 'quake')).toHaveLength(D.quakeN);
    expect(me.hp).toBeLessThan(9999);
  });
});

describe('going berserk', () => {
  it('when one dies the other roars and gets some health back', () => {
    const b = barn(['sword'], [[6, 9]]);
    wake(b);
    b.hasp.hp = Math.round(b.hasp.maxHp * 0.4);
    const was = b.hasp.hp;
    Object.assign(b.latch, { hp: 0, act: 'dead' });
    const ev = run(b, 0.1);
    expect(b.hasp.boss!.phase).toBe(2);
    expect(b.hasp.hp).toBe(was + Math.round(b.hasp.maxHp * D.enrage.heal));
    expect(ev.some((x) => x.k === 'heal')).toBe(true);
  });
});
