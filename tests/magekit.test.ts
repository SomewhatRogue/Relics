/** The Mage's kits (shared/mage.ts, sim/spells.ts, sim/spellblade.ts): magic costs, the wand, the staff's slash and rooted hold, the spellblade's charge and parry. Each element's spells: spellbook.test.ts. */
import { describe, expect, it } from 'vitest';
import { BUTCHER, HERO, MANA_SHIELD, SPELL, STAFF_RING, TICK, WAND, WEAPONS, type WeaponId, type Element } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { renameKits } from '../src/shared/oldkits';
import { NO_INTENT, type Enemy, type EnemyAttack, type FightEvent, type Intent, type Zone } from '../src/sim/types';

/** A Mage with `weapon` at (9, 9) facing up, in `el`, goblins at each (x, y), held in place unless `free`. */
function arena(weapon: WeaponId, at: [number, number][] = [[9, 7.6]], el: Element = 'fire', free = false) {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon, x: 9, y: 9, fx: 0, fy: -1, relics: ['channel'], relic: 'channel' });
  h.augments.channel = el;
  const es = at.map(([x, y], i) => Object.assign(newEnemy(10 + i, 'scrapper', x, y), { cooldown: 99, hp: 400, maxHp: 400, alert: true, fx: 0, fy: 1, respawns: false }));
  room.enemies = es;
  let seq = 0;
  const run = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent('me', { ...NO_INTENT, ay: -1, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      if (!free) es.forEach((e, j) => Object.assign(e, { x: at[j][0], y: at[j][1], kvx: 0, kvy: 0, cooldown: 99 }));
    }
    return out;
  };
  const tap = (after = 0.8, i: Partial<Intent> = {}) => (seq++, run(after, { attackSeq: seq, ...i }));
  const loose = (hold: number, after: number) => (seq++, [...run(hold, { attackSeq: seq, attack: true }), ...run(after, { attackSeq: seq, attack: false })]);
  return { room, h, es, e: es[0], run, tap, loose };
}
const lost = (e: Enemy) => e.maxHp - e.hp;
const rings = (room: ArenaRoom) => room.zones.filter((z): z is Zone => z.kind === 'flamering' || z.kind === 'stormring');

describe('the wand', () => {
  it('casts its quick spark walking at near full pace', () => {
    const a = arena('wand', [[2, 2]]);
    const ev = a.tap(0.5, { mx: 1, ay: 0, ax: 0 });
    expect(ev.filter((x) => x.k === 'shoot').length).toBe(1);
    const full = HERO.speed * WEAPONS.wand.speed * 0.5;
    expect(a.h.x - 9).toBeGreaterThan(full * WAND.walk * 0.9);
  });

  it('a spark that lands mid wind-up breaks the blow off: a bonus, no PERFECT', () => {
    const a = arena('wand', [[9, 5]]);
    const ev0: FightEvent[] = [];
    // The goblin starts a blow; the spark is loosed into its wind-up.
    a.e.attack = { kind: 'swing', t: 0, windup: 5, active: 0.1, recover: 0.3, dmg: 10, knock: 2, unblockable: false, dx: 0, dy: 1, ox: 9, oy: 5, range: 1.3, arc: 90, cx: 0, cy: 0, radius: 0, done: false };
    a.e.act = 'attack';
    ev0.push(...a.tap(0.7));
    expect(ev0.some((x) => x.k === 'interrupt')).toBe(true);
    expect(ev0.some((x) => x.k === 'perfect')).toBe(false);
    expect(a.e.attack).toBeNull();
  });

  it('the burst let go on the white flash breaks off whatever it hits, striped blows too, PERFECT', () => {
    // Past its wind-up, mid a striped blow: a plain spark wouldn't stop it.
    const striped = (): EnemyAttack => ({ kind: 'cleave', t: 0.9, windup: 0.5, active: 5, recover: 0.3, dmg: 10, knock: 2, unblockable: true, dx: 0, dy: 1, ox: 9, oy: 5, range: 1.3, arc: 90, cx: 0, cy: 0, radius: 0, done: false });
    const a = arena('wand', [[9, 5]]);
    Object.assign(a.e, { act: 'attack', attack: striped() });
    const ev = a.loose(0.7, 0.4);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(ev.some((x) => x.k === 'interrupt')).toBe(true);
    expect(a.e.attack).toBeNull();
    // Held past the flash, the same blow carries on.
    const b = arena('wand', [[9, 5]]);
    Object.assign(b.e, { act: 'attack', attack: striped() });
    const ev2 = b.loose(1.0, 0.4);
    expect(ev2.some((x) => x.k === 'interrupt')).toBe(false);
  });
});

describe('magic costs', () => {
  it("the wand's hold spends 20 and says so", () => {
    const a = arena('wand', [[9, 4]]);
    const ev = a.loose(0.7, 0.1);
    expect(ev.find((x) => x.k === 'magic')).toMatchObject({ n: SPELL.wand });
    expect(a.h.stamina).toBeLessThan(HERO.stamina - SPELL.wand + 5);
  });

  it('a spell you cannot pay for fizzles at once, and nothing is cast or spent', () => {
    const a = arena('staff');
    a.h.stamina = SPELL.staff - 10;
    a.h.staminaAt = 99;
    const ev = a.loose(1.1, 0.2);
    expect(ev.some((x) => x.k === 'fizzle')).toBe(true);
    expect(rings(a.room).length).toBe(0);
    expect(ev.some((x) => x.k === 'magic' || x.k === 'spell')).toBe(false);
    expect(a.h.stamina).toBe(SPELL.staff - 10);
  });
});

describe('the staff', () => {
  it('its quick slash strikes close in front, not behind and not far, in the element', () => {
    const a = arena('staff', [[9, 7.6], [10.1, 8.2], [9, 10.4], [9, 5.6]]);
    a.tap(1);
    const [front, side, back, far] = a.es;
    expect(lost(front)).toBeGreaterThan(0);
    expect(lost(side)).toBeGreaterThan(0);
    expect(back.hp).toBe(400);
    expect(far.hp).toBe(400);
    expect(front.burnUntil).toBeGreaterThan(a.room.time);
  });

  it('a hold is rooted while it gathers, and its ring is centred on the Mage, bigger with the hold', () => {
    const b = arena('staff', [[2, 2]]);
    b.run(0.25, { attackSeq: 1, attack: true, mx: 1 });
    const x = b.h.x;
    b.run(0.5, { attackSeq: 1, attack: true, mx: 1 });
    expect(b.h.act).toBe('charge');
    expect(b.h.x).toBeCloseTo(x, 3);
    const a = arena('staff', [[2, 2]]);
    a.loose(0.5, 0.2);
    const z = rings(a.room)[0];
    expect([z.x, z.y]).toEqual([9, 9]);
    expect(z.r).toBeGreaterThanOrEqual(STAFF_RING.r);
    expect(z.r).toBeLessThan(STAFF_RING.rFull);
    expect(z.big).toBe(false);
  });

  it('let go on the white flash: the biggest ring', () => {
    const a = arena('staff', [[2, 2]]);
    const ev = a.loose(WEAPONS.staff.draw! + 0.05, 0.2);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    const z = rings(a.room)[0];
    expect(z.big).toBe(true);
    expect(z.r).toBeCloseTo(STAFF_RING.rBig, 5);
  });
});

describe('the spellblade', () => {
  it('a hold costs its 35 magic, every time (no free holds off a full blade)', () => {
    // (Held past the flash: let go on it, it would be free.)
    const a = arena('spellblade', [[2, 2]], 'frost');
    const ev = a.loose(0.9, 0.3);
    expect(ev.find((x) => x.k === 'magic')).toMatchObject({ n: SPELL.spellblade });
    a.run(2.5);
    const ev2 = a.loose(0.9, 0.3);
    expect(ev2.find((x) => x.k === 'magic')).toMatchObject({ n: SPELL.spellblade });
  });

  it('a hold let go on the white flash is free, PERFECT', () => {
    const a = arena('spellblade', [[2, 2]], 'frost');
    const ev = a.loose(0.6, 0.3);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(ev.find((x) => x.k === 'spell')).toMatchObject({ what: 'shatter', big: true });
    expect(ev.some((x) => x.k === 'magic')).toBe(false);
    expect(a.h.stamina).toBe(HERO.stamina);
  });

  it('block in the parry window is a real parry (stagger, counter window), and it refills magic', () => {
    const room = new ArenaRoom(3, { scrappers: false });
    const h = room.join('me');
    const b = room.enemies[0];
    for (const e of room.enemies.slice(1)) Object.assign(e, { x: 0.5, y: 15.5 });
    Object.assign(h, { weapon: 'spellblade', x: 9, y: 7.6, fx: 0, fy: -1 });
    Object.assign(b, { x: 9, y: 6, cooldown: 0 });
    h.staminaAt = 1e9;
    for (let i = 0; i < 400 && b.attack?.kind !== 'cleave'; i++) {
      room.step();
      if (b.attack && (b.attack.kind as string) !== 'cleave') Object.assign(b, { attack: null, act: 'chase', cooldown: 0 }), Object.assign(h, { hp: HERO.hp, act: 'idle' });
      Object.assign(h, { x: 9, y: 7.6, kvx: 0, kvy: 0, stamina: 40 });
    }
    expect(b.attack?.kind).toBe('cleave');
    const a = b.attack!;
    const wait = Math.round((a.windup - a.t - 0.12) / TICK);
    for (let i = 0; i < wait; i++) room.step();
    room.setIntent('me', { ...NO_INTENT, blockSeq: 1 });
    const ev: FightEvent[] = [];
    for (let i = 0; i < Math.round(0.35 / TICK); i++) room.step(), ev.push(...room.events);
    expect(h.hp).toBe(HERO.hp);
    expect(h.stamina).toBeGreaterThanOrEqual(40 + MANA_SHIELD.parry);
    expect(ev.some((x) => x.k === 'parry')).toBe(true);
    expect(ev.some((x) => x.k === 'stunned')).toBe(true);
    expect(ev.some((x) => x.k === 'manaup')).toBe(true);
    expect(h.parriedAt ?? 0).toBeGreaterThan(0);
    expect(h.counterUntil).toBeGreaterThan(h.parriedAt ?? 0);
    expect(BUTCHER.cleave.dmg).toBeGreaterThan(0);
  });
});

describe('old saves', () => {
  it('a lance rod becomes a spellblade everywhere; the Jealous Rod becomes a wand', () => {
    const rod = { slot: 'weapon' as const, kit: 'rod' as WeaponId, quality: 'fine' as const, traits: [], mods: [], level: 2 };
    const jealous = { ...rod, quality: 'hungry' as const, hungry: 'jealous' };
    const p = renameKits({ weapon: 'rod', arms: { rod } as Record<string, typeof rod>, bag: [rod, jealous], stash: [rod], buyback: [{ item: rod }] });
    expect(p.weapon).toBe('spellblade');
    expect(p.arms!.spellblade).toMatchObject({ kit: 'spellblade', level: 2 });
    expect(p.bag!.map((i) => i.kit)).toEqual(['spellblade', 'wand']);
    expect(p.stash![0].kit).toBe('spellblade');
    expect(p.buyback![0].item.kit).toBe('spellblade');
    const held = renameKits({ weapon: 'rod', arms: { rod: jealous } as Record<string, typeof jealous> });
    expect(held.weapon).toBe('wand');
    expect(held.arms!.wand).toMatchObject({ hungry: 'jealous', kit: 'wand' });
  });
});
