import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { BUTCHER, CHARGE, CLASS_DODGES, GUARD, HERO, ROLL, TICK, WEAPONS } from '../src/shared/tuning';
import { NO_INTENT, type Hero, type Intent } from '../src/sim/types';
import type { RelicId } from '../src/shared/magic';

/** Hand a hero a found relic and ready it (nobody starts with one). */
const arm = (h: Hero, r: RelicId) => ((h.relics = [h.relics[0], r]), (h.relic = r));

const SWORD = WEAPONS.sword;

// A Warrior has no dodge in play; these tests lend the sword one so the roll itself stays tested.
beforeEach(() => void (CLASS_DODGES.WARRIOR = true));
afterEach(() => void (CLASS_DODGES.WARRIOR = false));

describe('no dodge', () => {
  it('a Warrior or a Healer presses dodge and nothing happens', () => {
    CLASS_DODGES.WARRIOR = false;
    for (const weapon of ['sword', 'mace'] as const) {
      const room = new ArenaRoom(1);
      const h = room.join('me');
      h.weapon = weapon;
      const y0 = h.y;
      room.setIntent('me', intent({ rollSeq: 1, my: -1 }));
      room.step();
      expect(h.act).not.toBe('roll');
      expect(Math.abs(h.y - y0)).toBeLessThan(0.5);
    }
  });
});

/** A room with one hero standing just in front of the butcher, the dummies far away. */
function setup(kind: 'cleave' | 'slam' = 'cleave') {
  const room = new ArenaRoom(3, { scrappers: false });
  const h = room.join('me');
  const b = room.enemies[0];
  for (const e of room.enemies.slice(1)) (e.x = 0.5), (e.y = 15.5);
  b.x = 9;
  b.y = 6;
  h.x = 9;
  h.y = 7.6;
  h.fx = 0;
  h.fy = -1;
  b.cooldown = 0;
  for (let i = 0; i < 400; i++) {
    room.step();
    if (b.attack?.kind === kind) break;
    if (b.attack) {
      Object.assign(b, { attack: null, act: 'chase', cooldown: 0 });
      Object.assign(h, { hp: HERO.hp, stamina: HERO.stamina, act: 'idle' });
    }
    Object.assign(h, { x: 9, y: 7.6, kvx: 0, kvy: 0 });
  }
  expect(b.attack?.kind).toBe(kind);
  return { room, h, b };
}

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const ticks = (s: number) => Math.round(s / TICK);
const run = (room: ArenaRoom, n: number) => {
  for (let i = 0; i < n; i++) room.step();
};
/** Step until the attack's wind-up has this much left. */
const until = (room: ArenaRoom, left: number) => {
  const a = room.enemies[0].attack!;
  run(room, ticks(a.windup - a.t - left));
};

describe('guarding against the butcher', () => {
  it('takes the full cleave when doing nothing, and is knocked back', () => {
    const { room, h } = setup();
    const y0 = h.y;
    run(room, ticks(BUTCHER.cleave.windup) + 20);
    expect(h.hp).toBe(HERO.hp - BUTCHER.cleave.dmg);
    expect(h.y - y0).toBeGreaterThan(0.3);
  });

  it('a block costs no health, and a good deal of stamina', () => {
    const { room, h } = setup();
    room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(room, ticks(BUTCHER.cleave.windup) + 2);
    expect(h.hp).toBe(HERO.hp);
    expect(h.stamina).toBeLessThan(HERO.stamina * 0.5);
  });

  it('a tap of block in the window is a parry: no damage, butcher stunned, counter ready', () => {
    const { room, h, b } = setup();
    until(room, 0.25);
    room.setIntent('me', intent({ blockSeq: 1 }));
    run(room, ticks(0.35));
    expect(h.hp).toBe(HERO.hp);
    expect(b.act).toBe('stunned');
    expect(b.actDur).toBe(BUTCHER.stun);
    expect(h.counterUntil).toBeGreaterThan(room.time);
  });

  it('each class guards its own way: a Ranger parries but never holds a block; a Mage does neither', () => {
    const ranger = setup();
    ranger.h.weapon = 'longbow';
    until(ranger.room, 0.18);
    ranger.room.setIntent('me', intent({ blockSeq: 1 }));
    run(ranger.room, ticks(0.35));
    expect(ranger.b.act).toBe('stunned');
    const held = setup();
    held.h.weapon = 'longbow';
    held.room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(held.room, ticks(BUTCHER.cleave.windup) + 2);
    expect(held.h.hp).toBe(HERO.hp - BUTCHER.cleave.dmg);
    const mage = setup();
    mage.h.weapon = 'wand';
    until(mage.room, 0.18);
    mage.room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(mage.room, ticks(0.35));
    expect(mage.b.act).not.toBe('stunned');
    expect(mage.h.hp).toBeLessThan(HERO.hp);
  });

  it("a Mage's blink leaves an image behind, and the butcher goes for it", () => {
    const { room, h, b } = setup();
    h.weapon = 'wand';
    Object.assign(b, { attack: null, act: 'chase', cooldown: 5 });
    room.setIntent('me', intent({ rollSeq: 1, mx: 1 }));
    run(room, ticks(0.3));
    expect(h.decoyUntil).toBeGreaterThan(room.time);
    const at = { x: h.decoyX, y: h.decoyY };
    // Walk further off; the butcher still turns toward where you were.
    h.x += 3;
    b.cooldown = 0;
    run(room, ticks(0.2));
    expect(Math.hypot(b.fx * 1 - (at.x - b.x) / Math.hypot(at.x - b.x, at.y - b.y), b.fy - (at.y - b.y) / Math.hypot(at.x - b.x, at.y - b.y))).toBeLessThan(0.3);
  });

  it('a block pressed too early is only a block', () => {
    const { room, h } = setup();
    until(room, 0.6);
    room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(room, ticks(0.8));
    expect(h.hp).toBe(HERO.hp);
  });

  it('mashing block does not keep the parry window open', () => {
    const { room, h } = setup();
    let seq = 0;
    for (let i = 0; i < ticks(BUTCHER.cleave.windup) + 4; i++) {
      room.setIntent('me', intent({ blockSeq: ++seq }));
      room.step();
    }
    expect(h.hp).toBeLessThan(HERO.hp);
  });

  it('a counter after a parry hits for the counter multiplier (a greatsword: no riposte)', () => {
    const { room, h, b } = setup();
    h.weapon = 'greatsword';
    until(room, 0.1);
    room.setIntent('me', intent({ blockSeq: 1 }));
    run(room, ticks(0.2));
    const before = b.hp;
    room.setIntent('me', intent({ blockSeq: 1, attackSeq: 1, ay: -1 }));
    run(room, ticks(0.8));
    expect(before - b.hp).toBe(Math.round(WEAPONS.greatsword.combo[0].dmg * GUARD.counterMult));
  });

  it('running out of stamina while blocking is a guard break', () => {
    const { room, h } = setup();
    h.stamina = 5;
    room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(room, ticks(BUTCHER.cleave.windup) + 2);
    expect(h.act).toBe('stun');
  });
});

describe('the slam', () => {
  it('cannot be blocked', () => {
    const { room, h } = setup('slam');
    room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(room, ticks(BUTCHER.slam.windup) + 2);
    expect(h.hp).toBe(HERO.hp - BUTCHER.slam.dmg);
  });

  it('can be rolled through', () => {
    const { room, h } = setup('slam');
    until(room, 0.1);
    room.setIntent('me', intent({ rollSeq: 1, mx: 1 }));
    run(room, ticks(0.3));
    expect(h.hp).toBe(HERO.hp);
  });

  it('rolled through at the last moment staggers the butcher; rolled clear early is still a dodge', () => {
    const late = setup('slam');
    until(late.room, 0.1);
    late.room.setIntent('me', intent({ rollSeq: 1, mx: 1 }));
    const seen: string[] = [];
    for (let i = 0; i < ticks(0.3); i++) (late.room.step(), seen.push(...late.room.events.map((e) => e.k)));
    expect(seen).toContain('slip');
    expect(late.b.act).toBe('stunned');

    const early = setup('slam');
    early.room.setIntent('me', intent({ rollSeq: 1, mx: 1 }));
    const got: string[] = [];
    for (let i = 0; i < ticks(BUTCHER.slam.windup) + 4; i++) (early.room.step(), got.push(...early.room.events.map((e) => e.k)));
    expect(early.h.hp).toBe(HERO.hp);
    expect(got).toContain('dodge');
    expect(got).not.toContain('slip');
  });

  it("a Ranger's jump back, late, clears the blow and staggers the butcher all the same", () => {
    const { room, h, b } = setup('cleave');
    h.weapon = 'longbow';
    until(room, 0.15);
    room.setIntent('me', intent({ rollSeq: 1 }));
    const seen: string[] = [];
    for (let i = 0; i < ticks(0.4); i++) (room.step(), seen.push(...room.events.map((e) => e.k)));
    expect(h.hp).toBe(HERO.hp);
    expect(seen).toContain('slip');
    expect(b.act).toBe('stunned');
  });
});

/** A hero next to a target enemy (index), everything else parked far away. */
function onTarget(index: number) {
  const room = new ArenaRoom(1);
  const h = room.join('me');
  const t = room.enemies[index];
  room.enemies.forEach((e, i) => i !== index && Object.assign(e, { x: 1 + i * 0.9, y: 15.4, cooldown: 99 }));
  t.cooldown = 99;
  Object.assign(t, { x: 9, y: 8 });
  Object.assign(h, { x: 9, y: 9.1 });
  return { room, h, t };
}

describe('weapons and heavies', () => {
  it('the sword chains a three-hit combo on a dummy', () => {
    const { room } = onTarget(1);
    let seq = 0, hits = 0;
    for (let i = 0; i < ticks(2); i++) {
      if (i % 6 === 0) seq++;
      room.setIntent('me', intent({ attackSeq: seq, ay: -1 }));
      room.step();
      hits += room.events.filter((e) => e.k === 'hit' && e.on === 'enemy').length;
    }
    expect(hits).toBeGreaterThanOrEqual(3);
  });

  it('holding attack charges a heavy that hits harder than a tap (the greatsword, held past its flash)', () => {
    const GS = WEAPONS.greatsword;
    const tap = onTarget(1);
    tap.h.weapon = 'greatsword';
    tap.room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    run(tap.room, ticks(0.8));
    const tapDmg = tap.t.maxHp - tap.t.hp;
    const hold = onTarget(1);
    hold.h.weapon = 'greatsword';
    hold.room.setIntent('me', intent({ attackSeq: 1, attack: true, ay: -1 }));
    run(hold.room, ticks(CHARGE.full + 0.4));
    expect(hold.h.act).toBe('charge');
    hold.room.setIntent('me', intent({ attackSeq: 1, attack: false, ay: -1 }));
    run(hold.room, ticks(0.6));
    expect(hold.t.maxHp - hold.t.hp).toBe(GS.heavy.dmgFull);
    expect(hold.t.maxHp - hold.t.hp).toBeGreaterThan(tapDmg * 2);
  });

  it('switching weapon changes the combo', () => {
    const { room, h } = onTarget(1);
    room.setIntent('me', intent({ weaponSeq: 1 }));
    room.step();
    expect(h.weapon).toBe('greatsword');
    room.setIntent('me', intent({ weaponSeq: 2 }));
    room.step();
    expect(h.weapon).toBe('spear');
    room.setIntent('me', intent({ weaponSeq: 2, classSeq: 1 }));
    room.step();
    expect(h.weapon).toBe('longbow');
    room.setIntent('me', intent({ weaponSeq: 3, classSeq: 1 }));
    room.step();
    expect(h.weapon).toBe('shortbow');
  });

  it('the same blow throws a scrapper much further than the butcher', () => {
    const push = (index: number) => {
      const { room, t } = onTarget(index);
      const y0 = t.y;
      room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
      run(room, ticks(0.4));
      return y0 - t.y;
    };
    expect(push(3)).toBeGreaterThan(push(0) * 3);
  });
});

describe('bodies', () => {
  it('a hero cannot walk through the butcher', () => {
    const { room, h, t } = onTarget(0);
    t.cooldown = 99;
    room.setIntent('me', intent({ my: -1 }));
    run(room, ticks(1.5));
    expect(Math.hypot(h.x - t.x, h.y - t.y)).toBeGreaterThan(BUTCHER.radius + HERO.radius - 0.05);
  });

  it('a roll passes through and costs stamina', () => {
    const { room, h, t } = onTarget(0);
    const y0 = h.y;
    room.setIntent('me', intent({ rollSeq: 1, my: -1 }));
    run(room, ticks(ROLL.time) + 1);
    expect(h.y).toBeLessThan(t.y);
    expect(y0 - h.y).toBeGreaterThan(ROLL.distance * 0.8);
    expect(h.stamina).toBeLessThan(HERO.stamina);
  });

  it('is deterministic for a seed', () => {
    const play = () => {
      const room = new ArenaRoom(42);
      room.join('me');
      for (let i = 0; i < 900; i++) {
        room.setIntent('me', intent({ mx: Math.sin(i / 20), my: -0.5, attackSeq: Math.floor(i / 9), attack: i % 40 > 20, blockSeq: Math.floor(i / 50) }));
        room.step();
      }
      return JSON.stringify([room.heroes, room.enemies.map((e) => [e.x, e.y, e.hp])]);
    };
    expect(play()).toBe(play());
  });
});

describe('relics', () => {
  it('the javelin carries a scrapper and pins it to the wall', () => {
    const { room, h, t } = onTarget(3);
    Object.assign(t, { x: 9, y: 4 });
    Object.assign(h, { x: 9, y: 9 });
    arm(h, 'javelin');
    room.setIntent('me', intent({ relicSeq: 1, ay: -1 }));
    let pinned = false;
    for (let i = 0; i < ticks(1.2); i++) {
      room.step();
      if (room.events.some((e) => e.k === 'pinned')) pinned = true;
    }
    expect(pinned).toBe(true);
    expect(t.act === 'pinned' || t.act === 'dead').toBe(true);
    expect(t.y).toBeLessThan(1);
    expect(h.relicReady.javelin).toBeGreaterThan(room.time);
  });

  it('the javelin sticks in the butcher instead', () => {
    const { room, h, t } = onTarget(0);
    Object.assign(t, { x: 9, y: 5 });
    Object.assign(h, { x: 9, y: 9 });
    arm(h, 'javelin');
    room.setIntent('me', intent({ relicSeq: 1, ay: -1 }));
    run(room, ticks(0.8));
    expect(room.javelins[0]?.state).toBe('body');
    expect(t.hp).toBeLessThan(t.maxHp);
  });

  it('the hook yanks a scrapper to you', () => {
    const { room, h, t } = onTarget(3);
    Object.assign(t, { x: 9, y: 4 });
    Object.assign(h, { x: 9, y: 10 });
    arm(h, 'hook');
    room.setIntent('me', intent({ relicSeq: 1, ay: -1 }));
    run(room, ticks(1));
    expect(Math.hypot(t.x - h.x, t.y - h.y)).toBeLessThan(1.3);
    expect(t.act === 'stunned' || t.act === 'chase' || t.act === 'attack').toBe(true);
  });

  it('the hook pulls you to the butcher and to walls', () => {
    const { room, h, t } = onTarget(0);
    Object.assign(t, { x: 9, y: 4 });
    Object.assign(h, { x: 9, y: 10 });
    arm(h, 'hook');
    room.setIntent('me', intent({ relicSeq: 1, ay: -1 }));
    run(room, ticks(1.2));
    expect(Math.hypot(t.x - h.x, t.y - h.y)).toBeLessThan(1.4);
  });
});

describe('corpses and backstabs', () => {
  it('a javelin that kills a scrapper still carries the body to the wall', () => {
    const { room, h, t } = onTarget(3);
    Object.assign(t, { x: 9, y: 4, hp: 5 });
    Object.assign(h, { x: 9, y: 9 });
    arm(h, 'javelin');
    room.setIntent('me', intent({ relicSeq: 1, ay: -1 }));
    run(room, ticks(1.2));
    expect(t.act).toBe('dead');
    expect(t.corpse).toBe('pinned');
    expect(t.y).toBeLessThan(1);
  });

  it("a Rogue's dagger blow finds two goblins (Kyle, 2026-11-04), and only knocks them off balance from behind", () => {
    const { room, h, t } = onTarget(3);
    const other = room.enemies[4];
    Object.assign(other, { x: t.x + 0.5, y: t.y, cooldown: 99, fx: 0, fy: 1 });
    Object.assign(t, { fx: 0, fy: 1, cooldown: 99, hp: 300, maxHp: 300 });
    Object.assign(other, { hp: 300, maxHp: 300 });
    h.weapon = 'daggers';
    room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    run(room, ticks(0.25));
    expect([t, other].filter((e) => e.hp < e.maxHp).length).toBe(2);
    expect(t.act === 'flinch' || other.act === 'flinch').toBe(false);
    // From behind, it reels.
    const back = onTarget(3);
    Object.assign(back.t, { fx: 0, fy: -1, cooldown: 99, hp: 300, maxHp: 300 });
    back.h.weapon = 'daggers';
    back.room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    run(back.room, ticks(0.25));
    expect(back.t.act).toBe('flinch');
  });

  it('a blow from behind does more, and twin daggers far more; head on, the daggers do half', () => {
    const hitFrom = (weapon: 'sword' | 'daggers', behind: boolean) => {
      const { room, h, t } = onTarget(0);
      Object.assign(t, { fx: 0, fy: behind ? -1 : 1, cooldown: 99 });
      h.weapon = weapon;
      room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
      run(room, 3);
      t.fx = 0;
      t.fy = behind ? -1 : 1;
      run(room, ticks(0.4));
      return t.maxHp - t.hp;
    };
    expect(hitFrom('sword', true)).toBe(Math.round(WEAPONS.sword.combo[0].dmg * GUARD.rearMult));
    expect(hitFrom('daggers', true)).toBe(Math.round(WEAPONS.daggers.combo[0].dmg * WEAPONS.daggers.backstab!));
    expect(hitFrom('daggers', false)).toBe(Math.round(WEAPONS.daggers.combo[0].dmg * WEAPONS.daggers.front!));
  });

  it('the butcher turns slowly, so a roll past him leaves his back open', () => {
    const { room, h, t } = onTarget(0);
    Object.assign(t, { x: 9, y: 7, fx: 0, fy: 1, cooldown: 99 });
    Object.assign(h, { x: 9, y: 8.2 });
    room.setIntent('me', intent({ rollSeq: 1, my: -1 }));
    run(room, ticks(ROLL.time) + 1);
    const tx = h.x - t.x, ty = h.y - t.y, tl = Math.hypot(tx, ty);
    expect((t.fx * tx + t.fy * ty) / tl).toBeLessThan(GUARD.rearCos);
  });
});

describe('kits block and dodge differently', () => {
  it('a parry 0.3 s early works with sword and shield but only blocks with a greatsword', () => {
    const parryWith = (weapon: 'sword' | 'greatsword') => {
      const { room, h, b } = setup();
      h.weapon = weapon;
      until(room, 0.3);
      room.setIntent('me', intent({ blockSeq: 1, block: true }));
      run(room, ticks(0.4));
      return b.act === 'stunned';
    };
    expect(parryWith('sword')).toBe(true);
    expect(parryWith('greatsword')).toBe(false);
  });

  it("a shield guards a blow from the side that a greatsword's guard misses", () => {
    const blockFromSide = (weapon: 'sword' | 'greatsword') => {
      const { room, h } = setup();
      h.weapon = weapon;
      room.setIntent('me', intent({ block: true, blockSeq: 1, ax: 1, ay: -0.5 }));
      run(room, ticks(BUTCHER.cleave.windup) + 2);
      return HERO.hp - h.hp;
    };
    expect(blockFromSide('sword')).toBeLessThan(BUTCHER.cleave.dmg);
    expect(blockFromSide('greatsword')).toBe(BUTCHER.cleave.dmg);
  });

  it('the spear backsteps away from where you face and keeps facing', () => {
    const { room, h } = onTarget(1);
    h.weapon = 'spear';
    Object.assign(h, { x: 9, y: 9, fx: 0, fy: -1 });
    room.setIntent('me', intent({ rollSeq: 1, mx: 1 }));
    run(room, ticks(WEAPONS.spear.dodge.time) + 1);
    expect(h.y).toBeGreaterThan(9 + WEAPONS.spear.dodge.distance * 0.8);
    expect(h.fy).toBeLessThan(-0.9);
  });

  it('the dagger dash goes further than the greatsword roll and recharges sooner', () => {
    const dodge = (weapon: 'daggers' | 'greatsword') => {
      const { room, h } = onTarget(1);
      h.weapon = weapon;
      Object.assign(h, { x: 14, y: 9 });
      room.setIntent('me', intent({ rollSeq: 1, mx: -1 }));
      run(room, ticks(0.45));
      return 14 - h.x;
    };
    expect(dodge('daggers')).toBeGreaterThan(dodge('greatsword') + 1);
    expect(WEAPONS.daggers.dodge.cooldown).toBeLessThan(WEAPONS.greatsword.dodge.cooldown);
  });
});

describe('relic loadout', () => {
  it('starts with only the class skill; a found relic takes the second slot; an empty slot does nothing', () => {
    const { room, h } = onTarget(1);
    expect(h.relics).toEqual(['bash']);
    room.setIntent('me', intent({ relicPickSeq: 1, relicPick: 1 }));
    room.step();
    expect(h.relic).toBe('bash');
    h.relics = ['bash', 'hook'];
    room.setIntent('me', intent({ relicPickSeq: 2, relicPick: 1 }));
    room.step();
    expect(h.relic).toBe('hook');
    room.setIntent('me', intent({ relicPickSeq: 3, relicPick: 0 }));
    room.step();
    expect(h.relic).toBe('bash');
  });
});

describe('netted', () => {
  it("a netted Stoker can't run at you or throw its hook: the wind-up is lost", () => {
    for (const kind of ['charge', 'draw'] as const) {
      const { room, b } = setup('cleave');
      Object.assign(b.attack!, { kind, t: 0 });
      b.snareUntil = 99;
      room.step();
      expect(b.attack).toBeNull();
    }
  });
});

describe('winded', () => {
  it('run out of breath and there is no dodge or block until the bar is full again', () => {
    const { room, h } = onTarget(1);
    h.stamina = 1;
    room.setIntent('me', intent({ rollSeq: 1, mx: 1 }));
    run(room, ticks(0.5));
    expect(h.winded).toBe(true);
    // Nothing comes back for a second.
    const s = h.stamina;
    run(room, ticks(0.3));
    expect(h.stamina).toBe(s);
    room.setIntent('me', intent({ rollSeq: 2, mx: 1, block: true, blockSeq: 1 }));
    run(room, ticks(1.2));
    expect(h.act).not.toBe('roll');
    expect(h.blocking).toBe(false);
    run(room, ticks(4));
    expect(h.stamina).toBe(HERO.stamina);
    expect(h.winded).toBe(false);
  });
});

describe('the thrown dagger', () => {
  it("a Rogue's held attack throws a dagger that flies and sticks", () => {
    const { room, h, t } = onTarget(1);
    h.weapon = 'daggers';
    Object.assign(t, { x: 2, y: 2 });
    room.setIntent('me', intent({ attack: true, attackSeq: 1, ax: 0, ay: 1 }));
    run(room, ticks(1));
    room.setIntent('me', intent({ attack: false, attackSeq: 1 }));
    let seen = false;
    for (let i = 0; i < ticks(0.4); i++) (room.step(), (seen ||= room.bolts.some((b) => b.kind === 'knife')));
    expect(seen).toBe(true);
  });
});
