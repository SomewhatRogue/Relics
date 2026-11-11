import { describe, expect, it } from 'vitest';
import { CLASS_DODGES, CLASS_GUARD, CLASS_KITS, TICK, VARIANTS, WEAPONS, rollGear, traitsFor, type WeaponId } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { NO_INTENT, type Enemy, type FightEvent, type Hero, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });

/** A hero with `weapon` at (9, 9) facing up, and goblins placed exactly (kept there, facing as set, every tick). */
function arena(weapon: WeaponId, foes: { kind?: Enemy['kind']; x: number; y: number; fy?: number; variant?: Enemy['variant'] }[]) {
  const room = new ArenaRoom(1, { scrappers: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: -1 });
  room.enemies = foes.map((f, i) => Object.assign(newEnemy(10 + i, f.kind ?? 'scrapper', f.x, f.y), { cooldown: 99, hp: 400, maxHp: 400, alert: true, fx: 0, fy: f.fy ?? 1, variant: f.variant, respawns: false }));
  const spots = room.enemies.map((e) => [e.x, e.y, e.fy] as const);
  const run = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent('me', intent({ ay: -1, ...i }));
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      room.enemies.forEach((e, j) => Object.assign(e, { x: spots[j][0], y: spots[j][1], fx: 0, fy: spots[j][2], kvx: 0, kvy: 0, cooldown: 99 }));
    }
    return out;
  };
  return { room, h, run };
}

const hurt = (e: Enemy) => e.maxHp - e.hp;
/** Tap attack `n` times, a press every `gap` seconds. */
function taps(run: ReturnType<typeof arena>['run'], n: number, gap: number): void {
  for (let i = 1; i <= n; i++) run(gap, { attackSeq: i });
}
/** Hold attack `hold` seconds, then let go and watch `after` seconds. */
function held(run: ReturnType<typeof arena>['run'], hold: number, after = 0.8): FightEvent[] {
  return [...run(hold, { attackSeq: 1, attack: true }), ...run(after, { attackSeq: 1, attack: false })];
}

describe('the rapier', () => {
  it('thrusts further than the daggers, at one goblin, and is fairer head on', () => {
    const r = arena('rapier', [{ x: 9, y: 7.0 }, { x: 9.3, y: 7.1 }]);
    r.run(0.3, { attackSeq: 1 });
    expect(r.room.enemies.filter((e) => e.hp < e.maxHp).length).toBe(1);
    const d = arena('daggers', [{ x: 9, y: 7.0 }]);
    d.run(0.3, { attackSeq: 1 });
    expect(hurt(d.room.enemies[0])).toBe(0);
    expect(WEAPONS.rapier.front!).toBeGreaterThan(WEAPONS.daggers.front!);
    expect(WEAPONS.rapier.backstab!).toBeLessThan(WEAPONS.daggers.backstab!);
  });

  it('held, it lunges forward through two goblins in a line, never a third', () => {
    const { room, h, run } = arena('rapier', [{ x: 9, y: 6.4 }, { x: 9, y: 5.6 }, { x: 9, y: 4.9 }]);
    const ev = held(run, 0.9);
    // (The third may be hurt by the second thrown into it: that's the knock, not the blade.)
    const blade = ev.filter((e) => e.k === 'hit' && e.on === 'enemy' && e.src === 'rapier').map((e) => (e as { y: number }).y);
    expect(blade.sort()).toEqual([5.6, 6.4]);
    expect(hurt(room.enemies[2])).toBeLessThan(hurt(room.enemies[0]));
    expect(h.y).toBeLessThan(8);
  });
});

describe("the poisoner's kit", () => {
  it('a tap is the short sword, 80% head on (Kyle, 2026-11-04), catching two; held, a dart that poisons (a little on its own)', () => {
    const tap = arena('poisoner', [{ x: 8.7, y: 8 }, { x: 9.3, y: 8 }]);
    const ev = tap.run(0.4, { attackSeq: 1 });
    expect(ev.some((e) => e.k === 'shoot')).toBe(false);
    expect(hurt(tap.room.enemies[0])).toBe(Math.round(WEAPONS.poisoner.combo[0].dmg * WEAPONS.poisoner.front!));
    expect(hurt(tap.room.enemies[1])).toBe(Math.round(WEAPONS.poisoner.combo[0].dmg * WEAPONS.poisoner.front!));
    const shot = arena('poisoner', [{ x: 9, y: 4 }]);
    const out = held(shot.run, WEAPONS.poisoner.draw! + 0.4, 0.4);
    expect(out.some((e) => e.k === 'shoot' && e.kind === 'dart')).toBe(true);
    expect(out.some((e) => e.k === 'envenom')).toBe(true);
    expect(shot.room.enemies[0].venom).toBe(1);
  });
});

describe('the sword and censer', () => {
  it('the third blow is the censer: it heals the party and sets goblins burning', () => {
    const { room, h, run } = arena('censer', [{ x: 9, y: 8 }]);
    h.hp = 50;
    taps(run, 3, 0.4);
    run(0.3);
    expect(h.hp).toBe(50 + WEAPONS.censer.combo[2].heal!);
    expect(room.enemies[0].burnUntil).toBeGreaterThan(room.time);
  });

  it('held, the censer whirls all round: a goblin behind burns too', () => {
    const { room, run } = arena('censer', [{ x: 9, y: 10.2 }]);
    held(run, 1.2);
    expect(hurt(room.enemies[0])).toBeGreaterThan(0);
    expect(room.enemies[0].burnUntil).toBeGreaterThan(room.time);
  });

  it("guards better than the mace", () => {
    const [c, m] = [WEAPONS.censer, WEAPONS.mace];
    expect(c.guardCost).toBeLessThanOrEqual(m.guardCost);
    expect(c.guardArc).toBeGreaterThan(m.guardArc);
  });
});

describe('the flail', () => {
  it("a shield-bearer's board takes its sweep, as it takes the mace's (no longer over the shield)", () => {
    const blow = (weapon: WeaponId) => {
      const { room, run } = arena(weapon, [{ x: 9, y: 7.9, variant: 'shield' }]);
      run(0.5, { attackSeq: 1 });
      return hurt(room.enemies[0]);
    };
    expect(blow('flail')).toBe(0);
    expect(blow('mace')).toBe(0);
  });

  it('the second blow heals; held, the spun release is a long sweep (sim/flail.ts; tests/cleric.test.ts)', () => {
    const { room, h, run } = arena('flail', [{ x: 9, y: 9 - 2.4 }]);
    h.hp = 50;
    taps(run, 2, 0.6);
    run(0.4);
    expect(h.hp).toBe(50 + WEAPONS.flail.combo[1].heal!);
    const before = hurt(room.enemies[0]);
    held(run, 1.2, 0.5);
    expect(hurt(room.enemies[0])).toBeGreaterThan(before);
  });

  it('what it kills bursts, like the mace', () => {
    const { room, run } = arena('flail', [{ x: 9, y: 7.9 }]);
    room.enemies[0].hp = 5;
    const ev = run(0.5, { attackSeq: 1 });
    expect(ev.find((e) => e.k === 'death')).toMatchObject({ how: 'burst' });
  });
});

describe('class rules hold for every kit', () => {
  const kitsOf = (cls: 'ROGUE' | 'HEALER') => (Object.keys(WEAPONS) as WeaponId[]).filter((k) => WEAPONS[k].cls === cls);
  it('three kits each; a Rogue never blocks and dashes; a Cleric guards and never dodges', () => {
    expect(CLASS_KITS.ROGUE).toEqual(['daggers', 'rapier', 'poisoner']);
    expect(CLASS_KITS.HEALER).toEqual(['mace', 'censer', 'flail']);
    expect(CLASS_GUARD.ROGUE).toBe('none');
    expect(CLASS_DODGES.HEALER).toBe(false);
    for (const k of kitsOf('ROGUE')) {
      expect(WEAPONS[k].dodge.kind).toBe('dash');
      const { h, run } = arena(k, [{ x: 9, y: 4 }]);
      run(0.3, { block: true, blockSeq: 1 });
      expect(h.blocking).toBe(false);
      run(0.1, { block: true, blockSeq: 1, rollSeq: 1, my: -1 });
      expect(h.act).toBe('roll');
    }
    for (const k of kitsOf('HEALER')) {
      const { h, run } = arena(k, [{ x: 9, y: 4 }]);
      run(0.1, { rollSeq: 1, my: -1 });
      expect(h.act).not.toBe('roll');
      run(0.2, { rollSeq: 1, block: true, blockSeq: 1 });
      expect(h.blocking).toBe(true);
      // Every Cleric kit heals on some blow.
      expect([...WEAPONS[k].combo, WEAPONS[k].heavy].some((s) => s.heal)).toBe(true);
    }
  });
});

describe('getting them', () => {
  it('treasure and the smith roll every kit of the class, with traits that fit it', () => {
    for (const cls of ['ROGUE', 'HEALER'] as const) {
      const rng = new Rng(7), seen = new Set<string>();
      for (let i = 0; i < 60; i++) seen.add(rollGear(rng, cls, 'fine').kit!);
      expect([...seen].sort()).toEqual([...CLASS_KITS[cls]].sort());
      for (const kit of CLASS_KITS[cls]) {
        const it = rollGear(new Rng(3), cls, 'tolmouth', 'weapon', kit);
        expect(it.kit).toBe(kit);
        expect(traitsFor(kit)).toContain(it.traits[0]);
      }
    }
  });

  it('a packed kit of your class goes in hand from the pack (and one of another class does not)', () => {
    const { h, run } = arena('daggers', [{ x: 9, y: 4 }]);
    h.bag = [rollGear(new Rng(1), 'ROGUE', 'fine', 'weapon', 'rapier'), rollGear(new Rng(1), 'HEALER', 'fine', 'weapon', 'flail')];
    run(0.1, { gearSeq: 1, gearOp: 1, gearArg: 1 });
    expect(h.weapon).toBe('daggers');
    run(0.1, { gearSeq: 2, gearOp: 1, gearArg: 0 });
    expect(h.weapon).toBe('rapier');
  });
});

describe('turning the belt', () => {
  const belt = (h: Hero, b: Hero['belt']) => Object.assign(h, { belt: b, hp: 40 });
  it('brings the next kind to the front, drinks nothing, and says its name', () => {
    const { h, run } = arena('sword', [{ x: 2, y: 2 }]);
    belt(h, ['bitter', 'bitter', 'oil']);
    const ev = run(0.1, { beltSeq: 1 });
    expect(h.belt).toEqual(['oil', 'bitter', 'bitter']);
    expect(h.hp).toBe(40);
    expect(ev.some((e) => e.k === 'drink')).toBe(false);
    expect(ev.find((e) => e.k === 'potion')).toMatchObject({ kind: 'oil' });
    run(0.1, { beltSeq: 2 });
    expect(h.belt[0]).toBe('bitter');
    // Two turns that arrive together both count.
    belt(h, ['bitter', 'brandy', 'frost']);
    run(0.1, { beltSeq: 4 });
    expect(h.belt).toEqual(['frost', 'bitter', 'brandy']);
  });

  it("a party guest's turn reaches the room the same way", () => {
    const room = new ArenaRoom(1, { scrappers: false });
    room.join('me');
    const g = room.join('you');
    g.belt = ['smoke', 'bitter'];
    room.setIntent('you', intent({ beltSeq: 1 }));
    room.step();
    expect(g.belt).toEqual(['bitter', 'smoke']);
    // An intent from before the belt could turn (no beltSeq) changes nothing.
    room.setIntent('you', { ...intent(), beltSeq: undefined });
    room.step();
    expect(g.belt).toEqual(['bitter', 'smoke']);
  });
});
