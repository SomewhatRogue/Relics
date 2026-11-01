import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { BUTCHER, COMBO, GUARD, HERO, ROLL, TICK } from '../src/shared/tuning';
import { NO_INTENT, type Intent } from '../src/sim/types';

/** A room with one hero standing just in front of the butcher, the dummies far away. */
function setup(kind: 'cleave' | 'slam' = 'cleave') {
  const room = new ArenaRoom(3);
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
  // Force the attack kind by stepping until the butcher starts one of the wanted kind.
  for (let i = 0; i < 400; i++) {
    room.step();
    if (b.attack?.kind === kind) break;
    if (b.attack) {
      Object.assign(b, { attack: null, act: 'chase', cooldown: 0 });
      Object.assign(h, { hp: HERO.hp, stamina: HERO.stamina, act: 'idle' });
    }
    h.x = 9;
    h.y = 7.6;
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
  it('takes the full cleave when doing nothing', () => {
    const { room, h } = setup();
    run(room, ticks(BUTCHER.cleave.windup) + 2);
    expect(h.hp).toBe(HERO.hp - BUTCHER.cleave.dmg);
    expect(h.act).toBe('hurt');
  });

  it('a block takes only chip damage and costs stamina', () => {
    const { room, h } = setup();
    room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    room.step();
    room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(room, ticks(BUTCHER.cleave.windup) + 2);
    expect(h.hp).toBe(HERO.hp - Math.round(BUTCHER.cleave.dmg * GUARD.chip));
    expect(h.stamina).toBeLessThan(HERO.stamina);
  });

  it('a tap of block just before the hit is a parry: no damage, butcher staggered, counter ready', () => {
    const { room, h, b } = setup();
    until(room, 0.1);
    room.setIntent('me', intent({ blockSeq: 1 }));
    run(room, ticks(0.2));
    expect(h.hp).toBe(HERO.hp);
    expect(b.act).toBe('stagger');
    expect(h.counterUntil).toBeGreaterThan(room.time);
  });

  it('a block pressed too early is only a block', () => {
    const { room, h } = setup();
    until(room, 0.6);
    room.setIntent('me', intent({ block: true, blockSeq: 1 }));
    run(room, ticks(0.8));
    expect(h.hp).toBe(HERO.hp - Math.round(BUTCHER.cleave.dmg * GUARD.chip));
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
    const { room, h, b } = setup();
    until(room, 0.1);
    room.setIntent('me', intent({ blockSeq: 1 }));
    run(room, ticks(0.2));
    const before = b.hp;
    room.setIntent('me', intent({ blockSeq: 1, attackSeq: 1, ay: -1 }));
    run(room, ticks(COMBO[0].windup + COMBO[0].active + 0.25));
    expect(before - b.hp).toBe(Math.round(COMBO[0].dmg * GUARD.counterMult));
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

describe('the Warrior', () => {
  it('chains a three-hit combo on a dummy', () => {
    const room = new ArenaRoom(1);
    const h = room.join('me');
    const d = room.enemies[1];
    room.enemies[0].x = 16;
    room.enemies[0].y = 15;
    h.x = d.x;
    h.y = d.y + 1;
    let seq = 0, hits = 0;
    for (let i = 0; i < ticks(2); i++) {
      if (i % 6 === 0) seq++;
      room.setIntent('me', intent({ attackSeq: seq, ay: -1 }));
      room.step();
      hits += room.events.filter((e) => e.k === 'hit' && e.on === 'enemy').length;
    }
    expect(hits).toBeGreaterThanOrEqual(3);
  });

  it('a roll moves about its distance and costs stamina', () => {
    const room = new ArenaRoom(1);
    const h = room.join('me');
    room.enemies[0].x = 16;
    room.enemies[0].y = 1;
    const x0 = h.x;
    room.setIntent('me', intent({ rollSeq: 1, mx: -1 }));
    run(room, ticks(ROLL.time) + 1);
    expect(x0 - h.x).toBeGreaterThan(ROLL.distance * 0.85);
    expect(h.stamina).toBeLessThan(HERO.stamina);
  });

  it('is deterministic for a seed', () => {
    const play = () => {
      const room = new ArenaRoom(42);
      room.join('me');
      for (let i = 0; i < 600; i++) {
        room.setIntent('me', intent({ mx: Math.sin(i / 20), my: -0.5, attackSeq: Math.floor(i / 9) }));
        room.step();
      }
      return JSON.stringify([room.heroes, room.enemies.map((e) => [e.x, e.y, e.hp])]);
    };
    expect(play()).toBe(play());
  });
});
