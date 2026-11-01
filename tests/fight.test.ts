import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { BUTCHER, CHARGE, GUARD, HERO, ROLL, TICK, WEAPONS } from '../src/shared/tuning';
import { NO_INTENT, type Intent } from '../src/sim/types';

const SWORD = WEAPONS.sword;

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

  it('a block takes only chip damage and costs stamina', () => {
    const { room, h } = setup();
    room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(room, ticks(BUTCHER.cleave.windup) + 2);
    expect(h.hp).toBe(HERO.hp - Math.round(BUTCHER.cleave.dmg * SWORD.chip));
    expect(h.stamina).toBeLessThan(HERO.stamina);
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

  it('a block pressed too early is only a block', () => {
    const { room, h } = setup();
    until(room, 0.6);
    room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(room, ticks(0.8));
    expect(h.hp).toBe(HERO.hp - Math.round(BUTCHER.cleave.dmg * SWORD.chip));
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

  it('a counter after a parry hits for the counter multiplier', () => {
    const { room, b } = setup();
    until(room, 0.1);
    room.setIntent('me', intent({ blockSeq: 1 }));
    run(room, ticks(0.2));
    const before = b.hp;
    room.setIntent('me', intent({ blockSeq: 1, attackSeq: 1, ay: -1 }));
    run(room, ticks(0.6));
    expect(before - b.hp).toBe(Math.round(SWORD.combo[0].dmg * GUARD.counterMult));
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

  it('holding attack charges a heavy that hits harder than a tap', () => {
    const tap = onTarget(1);
    tap.room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    run(tap.room, ticks(0.6));
    const tapDmg = tap.t.maxHp - tap.t.hp;
    const hold = onTarget(1);
    hold.room.setIntent('me', intent({ attackSeq: 1, attack: true, ay: -1 }));
    run(hold.room, ticks(CHARGE.full + 0.1));
    expect(hold.h.act).toBe('charge');
    hold.room.setIntent('me', intent({ attackSeq: 1, attack: false, ay: -1 }));
    run(hold.room, ticks(0.6));
    expect(hold.t.maxHp - hold.t.hp).toBe(SWORD.heavy.dmgFull);
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
    room.setIntent('me', intent({ relicSeq: 1, ay: -1 }));
    run(room, ticks(0.8));
    expect(room.javelins[0]?.state).toBe('body');
    expect(t.hp).toBeLessThan(t.maxHp);
  });

  it('the hook yanks a scrapper to you', () => {
    const { room, h, t } = onTarget(3);
    Object.assign(t, { x: 9, y: 4 });
    Object.assign(h, { x: 9, y: 10 });
    room.setIntent('me', intent({ relicSwapSeq: 1 }));
    room.step();
    expect(h.relic).toBe('hook');
    room.setIntent('me', intent({ relicSwapSeq: 1, relicSeq: 1, ay: -1 }));
    run(room, ticks(1));
    expect(Math.hypot(t.x - h.x, t.y - h.y)).toBeLessThan(1.3);
    expect(t.act === 'stunned' || t.act === 'chase' || t.act === 'attack').toBe(true);
  });

  it('the hook pulls you to the butcher and to walls', () => {
    const { room, h, t } = onTarget(0);
    Object.assign(t, { x: 9, y: 4 });
    Object.assign(h, { x: 9, y: 10 });
    room.setIntent('me', intent({ relicSwapSeq: 1, relicSeq: 1, ay: -1 }));
    run(room, ticks(1.2));
    expect(Math.hypot(t.x - h.x, t.y - h.y)).toBeLessThan(1.4);
  });
});

describe('corpses and backstabs', () => {
  it('a javelin that kills a scrapper still carries the body to the wall', () => {
    const { room, h, t } = onTarget(3);
    Object.assign(t, { x: 9, y: 4, hp: 5 });
    Object.assign(h, { x: 9, y: 9 });
    room.setIntent('me', intent({ relicSeq: 1, ay: -1 }));
    run(room, ticks(1.2));
    expect(t.act).toBe('dead');
    expect(t.corpse).toBe('pinned');
    expect(t.y).toBeLessThan(1);
  });

  it('a blow from behind does more, and twin daggers far more', () => {
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
    expect(hitFrom('daggers', false)).toBe(WEAPONS.daggers.combo[0].dmg);
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
