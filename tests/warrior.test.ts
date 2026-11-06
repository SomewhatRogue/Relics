/** The Warrior's rework (shared/warrior.ts, sim/warrior.ts): no dodge, the shield bash, the counter after a block, the greatsword, the spear. */
import { describe, expect, it } from 'vitest';
import { GUARD, PIN, QUAKE, SHAFT, SHIELD_BASH, TICK, WEAPONS, type WeaponId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { hitHero } from '../src/sim/combat';
import { NO_INTENT, type Enemy, type EnemyAttack, type FightEvent, type Intent } from '../src/sim/types';

/** A Warrior with `weapon` at (9, 9) facing up, goblins at (9, y) for each y, kept in place unless `free`. */
function arena(weapon: WeaponId, ys: number[] = [7.6], kind: Enemy['kind'] = 'scrapper', free = false) {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: -1 });
  const es = ys.map((y, i) => Object.assign(newEnemy(10 + i, kind, 9, y), { cooldown: 99, hp: 400, maxHp: 400, alert: true, fx: 0, fy: 1, respawns: false }));
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
  const tap = (after = 0.7) => (seq++, run(after, { attackSeq: seq }));
  const loose = (hold: number, after: number) => (seq++, [...run(hold, { attackSeq: seq, attack: true }), ...run(after, { attackSeq: seq, attack: false })]);
  return { room, h, es, e: es[0], run, tap, loose };
}
const lost = (e: Enemy) => e.maxHp - e.hp;
/** A blow from straight above, landing on the hero now. */
const blow = (x: number, y: number): EnemyAttack => ({ kind: 'swing', t: 1, windup: 1, active: 0.1, recover: 0.3, dmg: 10, knock: 2, unblockable: false, dx: 0, dy: 1, ox: x, oy: y - 1.2, range: 2, arc: 90, cx: 0, cy: 0, radius: 0, done: false });

describe('the Warrior has no dodge (Kyle, 2026-11-04)', () => {
  it('pressing dodge does nothing, with any of the three kits', () => {
    for (const weapon of ['sword', 'greatsword', 'spear'] as const) {
      const { h, run } = arena(weapon, [2]);
      const ev = run(0.4, { rollSeq: 1, mx: 0, ay: 0 });
      expect(ev.some((x) => x.k === 'roll')).toBe(false);
      expect(h.act).not.toBe('roll');
      expect(h.x).toBe(9);
    }
  });
});

describe('GRAB with nothing to take hold of (Kyle, 2026-11-04)', () => {
  it('says so to that hero, at most once a second', () => {
    const { run } = arena('sword', [2]);
    const a = run(0.4, { grabSeq: 1 });
    expect(a.filter((x) => x.k === 'nograb' && x.id === 'me').length).toBe(1);
    const b = run(0.4, { grabSeq: 2 });
    expect(b.some((x) => x.k === 'nograb')).toBe(false);
    run(0.4, { grabSeq: 2 });
    const c = run(0.5, { grabSeq: 3 });
    expect(c.some((x) => x.k === 'nograb')).toBe(true);
  });
  it('says nothing when the press took hold of something', () => {
    const { e, run } = arena('sword', [8.2]);
    Object.assign(e, { act: 'stunned', actT: 0, actDur: 9, fx: 0, fy: -1 });
    const ev = run(0.4, { grabSeq: 1 });
    expect(ev.some((x) => x.k === 'nograb')).toBe(false);
  });
});

describe('the sword and shield', () => {
  it('held past the flash, the shield bash stuns only the goblin in front, for less', () => {
    const { es, loose } = arena('sword', [7.9, 7.9]);
    Object.assign(es[1], { x: 10 });
    const ev = loose(1.4, 0.15);
    expect(ev.some((x) => x.k === 'perfect')).toBe(false);
    expect(ev.filter((x) => x.k === 'shieldbash').length).toBe(1);
    expect(es[0].act).toBe('stunned');
    expect(es[0].actDur).toBeCloseTo(SHIELD_BASH.stunFull, 1);
    expect(es[1].act).not.toBe('stunned');
    expect(lost(es[0])).toBeLessThanOrEqual(WEAPONS.sword.heavy.dmgFull);
  });
  it('let go on the white flash, the bash stuns every goblin in its arc for a full second, PERFECT', () => {
    const { es, loose } = arena('sword', [7.9, 7.9, 7.9]);
    Object.assign(es[1], { x: 10 }), Object.assign(es[2], { x: 8 });
    const ev = loose(1, 0.15);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    for (const e of es) expect(e.act).toBe('stunned'), expect(e.actDur).toBe(SHIELD_BASH.perfect);
  });
  it('a blow after a held block is a plain counter, however soon (no riposte: it went with parry)', () => {
    const counterHit = (wait: number) => {
      const { room, h, e, tap, run } = arena('sword');
      run(TICK, { block: true });
      hitHero(e, blow(h.x, h.y), h, room.time, []);
      expect(h.hp).toBe(h.maxHp);
      expect(e.act).not.toBe('stunned');
      run(wait);
      const before = e.hp;
      const ev = tap();
      return { n: before - e.hp, ev };
    };
    const quick = counterHit(0.1), late = counterHit(GUARD.counterWindow - 0.4);
    const base = Math.round(WEAPONS.sword.combo[0].dmg * GUARD.counterMult);
    expect([quick.n, late.n]).toEqual([base, base]);
    expect(quick.ev.some((x) => x.k === 'perfect')).toBe(false);
  });
});

describe('the greatsword', () => {
  it('holding block is a plain block now (slow and dear); a tap guards nothing', () => {
    const held = arena('greatsword', [2]);
    held.run(0.2, { block: true, blockSeq: 0 });
    expect(held.h.blocking).toBe(true);
    hitHero(held.e, blow(held.h.x, held.h.y), held.h, held.room.time, []);
    expect(held.h.hp).toBe(held.h.maxHp);
    expect(held.h.stamina).toBeLessThan(100);
    expect(WEAPONS.greatsword.guardCost).toBeGreaterThan(WEAPONS.sword.guardCost);
    expect(WEAPONS.greatsword.blockSpeed).toBeLessThan(WEAPONS.sword.blockSpeed);
    expect(WEAPONS.greatsword.ponderous).toBe(true);

    const tapped = arena('greatsword', [7.6]);
    tapped.run(TICK, { blockSeq: 1 });
    hitHero(tapped.e, blow(tapped.h.x, tapped.h.y), tapped.h, tapped.room.time, []);
    expect(tapped.h.hp).toBeLessThan(tapped.h.maxHp);
    expect(tapped.e.act).not.toBe('stunned');
  });
  it('the overhead loosed on the white flash sends out a shockwave that knocks nearby goblins down', () => {
    // One in front of the blade, one off to the side the overhead doesn't reach.
    const { es, loose } = arena('greatsword', [7.6, 7.6], 'scrapper', true);
    Object.assign(es[1], { x: 10.6 });
    const ev = loose(0.9 + 0.08, 0.3);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(ev.some((x) => x.k === 'quake')).toBe(true);
    expect(es[1].act).toBe('stunned');
    expect(es[1].actDur).toBe(QUAKE.down);
    expect(lost(es[1])).toBe(QUAKE.dmg);
  });
  it('held past the flash, no shockwave', () => {
    const { loose } = arena('greatsword');
    expect(loose(0.9 + 0.5, 0.4).some((x) => x.k === 'quake')).toBe(false);
  });
});

describe('the spear', () => {
  it('the held lunge runs through three goblins in a line', () => {
    const { es, loose } = arena('spear', [7.4, 6.8, 6.2, 5.6]);
    const ev = loose(0.9 + 0.5, 0.4);
    // (The fourth may still be bowled over by the others: a body blow, not the point.)
    expect(ev.filter((x) => x.k === 'hit' && x.src === 'spear').length).toBe(3);
    expect(lost(es[0])).toBe(WEAPONS.spear.heavy.dmgFull);
  });
  it('a goblin caught mid-charge is stopped dead and pinned, longer: a bonus, no PERFECT', () => {
    const { e, tap } = arena('spear', [7.4]);
    Object.assign(e, { act: 'attack', attack: { ...blow(9, 9), kind: 'charge', t: 0.1, windup: 0.5, unblockable: true } });
    const ev = tap(0.25);
    expect(ev.some((x) => x.k === 'pin')).toBe(true);
    expect(ev.some((x) => x.k === 'perfect')).toBe(false);
    expect(e.act).toBe('pinned');
    expect(e.actDur).toBe(PIN.caught);
    expect(e.attack).toBe(null);
    expect(PIN.caught).toBeGreaterThan(PIN.flash);
  });
  it('the lunge let go on the white flash pins whatever it runs through, PERFECT; past the flash, nothing', () => {
    const flash = arena('spear', [7.4, 6.8]);
    const ev = flash.loose(1, 0.2);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    for (const e of flash.es) expect(e.act).toBe('pinned'), expect(e.actDur).toBe(PIN.flash);
    const late = arena('spear', [7.4]);
    late.loose(1.4, 0.2);
    expect(late.e.act).not.toBe('pinned');
  });
  it('too close, the shaft does less than the point', () => {
    const near = arena('spear', [8.3]), far = arena('spear', [7.2]);
    near.tap(0.3);
    far.tap(0.3);
    expect(lost(near.e)).toBe(Math.round(WEAPONS.spear.combo[0].dmg * SHAFT.mult));
    expect(lost(far.e)).toBe(WEAPONS.spear.combo[0].dmg);
  });
});
