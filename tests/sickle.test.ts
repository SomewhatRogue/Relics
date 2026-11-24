/** The chain sickle (docs/design/chain-sickle.md): the spin, the throw and its snags. */
import { describe, expect, it } from 'vitest';
import { TICK, WEAPONS, type WeaponId } from '../src/shared/tuning';
import { SICKLE_SPIN, SICKLE_THROW } from '../src/shared/sickle';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { NO_INTENT, type Enemy, type FightEvent, type Intent } from '../src/sim/types';

function arena(ys: number[], free = false, weapon: WeaponId = 'rapier') {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: -1 });
  const es = ys.map((y, i) => Object.assign(newEnemy(10 + i, 'scrapper', 9, y), { cooldown: 99, hp: 400, maxHp: 400, alert: true, fx: 0, fy: 1, respawns: false }));
  room.enemies = es;
  let seq = 0;
  const run = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent('me', { ...NO_INTENT, ay: -1, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      if (!free) es.forEach((e, j) => Object.assign(e, { x: 9, y: ys[j], kvx: 0, kvy: 0, cooldown: 99 }));
    }
    return out;
  };
  const loose = (hold: number, after: number) => (seq++, [...run(hold, { attackSeq: seq, attack: true }), ...run(after, { attackSeq: seq, attack: false })]);
  const hold = (s: number) => (seq++, run(s, { attackSeq: seq, attack: true }));
  return { room, h, es, e: es[0], run, loose, hold };
}
const lost = (e: Enemy) => e.maxHp - e.hp;

describe('the chain sickle', () => {
  it('is the Rogue\'s, in the rapier\'s place', () => {
    expect(WEAPONS.rapier.name).toBe('CHAIN SICKLE');
    expect(WEAPONS.rapier.heavy.sickle).toBe(true);
  });

  it('held, the spin cuts and bleeds everything round you a little, and nothing out of reach', () => {
    const { es, hold } = arena([9 - 2, 9 + 2.2, 9 - SICKLE_SPIN.r - 1.5]);
    hold(WEAPONS.rapier.draw! + 0.6);
    expect(lost(es[0])).toBeGreaterThan(0);
    expect(lost(es[1])).toBeGreaterThan(0);
    expect(es[0].bleedUntil).toBeGreaterThan(0);
    expect(lost(es[2])).toBe(0);
    // Not a TON: two seconds of spin is under one full throw.
    expect(lost(es[0])).toBeLessThan(WEAPONS.rapier.heavy.dmgFull!);
  });

  it('one on one it falls short of daggers from behind, taps and spin alike (Kyle, 2026-11-23)', () => {
    const per = (w: 'rapier' | 'daggers', mult: number) => {
      const c = WEAPONS[w].combo, t = c.reduce((a, s) => a + s.windup + s.active + s.recover, 0);
      return (c.reduce((a, s) => a + s.dmg, 0) * mult) / t;
    };
    const daggersBehind = per('daggers', WEAPONS.daggers.backstab!);
    expect(per('rapier', WEAPONS.rapier.backstab!)).toBeLessThan(daggersBehind * 0.5);
    expect(per('rapier', WEAPONS.rapier.front!)).toBeLessThan(per('daggers', WEAPONS.daggers.front!));
    const spin = SICKLE_SPIN.top / SICKLE_SPIN.every + 3 / 0.5;
    expect(spin).toBeLessThan(daggersBehind * 0.25);
  });

  it('you walk slow while it spins', () => {
    expect(WEAPONS.rapier.chargeSpeed).toBeLessThan(0.6);
  });

  it('up against a wall the chain catches and the spin cuts nothing', () => {
    const { h, e, hold, room } = arena([1.6]);
    Object.assign(h, { x: 9, y: 0.9 });
    void room;
    const ev = hold(1);
    expect(ev.some((x) => x.k === 'chainsnag')).toBe(true);
    expect(lost(e)).toBe(0);
  });

  it('let go before a full spin, it cuts the first goblin and comes back: no pull', () => {
    const { h, e, loose } = arena([5]);
    const ev = loose(0.5, 1);
    expect(lost(e)).toBeGreaterThan(0);
    expect(ev.some((x) => x.k === 'yank')).toBe(false);
    expect(h.y).toBeGreaterThan(8);
  });

  it('fully spun, a small goblin is yanked to your feet', () => {
    const { e, loose } = arena([5], true);
    const ev = loose(WEAPONS.rapier.draw! + 0.3, 1.2);
    expect(ev.some((x) => x.k === 'yank')).toBe(true);
    expect(e.y).toBeGreaterThan(7.5);
  });

  it('fully spun, a big goblin pulls you round behind it', () => {
    const { h, e, loose } = arena([5]);
    e.weight = 3;
    loose(WEAPONS.rapier.draw! + 0.3, 1.2);
    expect(h.y).toBeLessThan(5);
  });

  it('on the white flash, what it snags bleeds', () => {
    const { e, loose } = arena([5], true);
    const ev = loose(WEAPONS.rapier.draw! + 0.02, 1.2);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(e.bleedUntil ?? 0).toBeGreaterThan(0);
    expect(SICKLE_THROW.bleed).toBeGreaterThan(0);
  });
});
