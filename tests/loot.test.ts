import { describe, expect, it } from 'vitest';
import { CLASS_KITS, KNOCK, RELEASE, TICK, WEAPONS, rollItem, type Item } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const ticks = (s: number) => Math.round(s / TICK);
const run = (room: ArenaRoom, s: number) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < ticks(s); i++) room.step(), out.push(...room.events);
  return out;
};

function onTarget(index: number) {
  const room = new ArenaRoom(1);
  const h = room.join('me');
  const t = room.enemies[index];
  const corners = [[1, 15], [17, 15], [1, 9], [17, 9], [17, 13]];
  room.enemies.forEach((e, i) => i !== index && Object.assign(e, { x: corners[i % 5][0], y: corners[i % 5][1], cooldown: 99 }));
  Object.assign(t, { x: 9, y: 8, cooldown: 99, act: 'stunned', actDur: 99 });
  Object.assign(h, { x: 9, y: 9.1 });
  return { room, h, t };
}
const arm = (traits: Item['traits'], kit: Item['kit'] = 'sword'): Item => ({ kit, quality: traits.length > 1 ? 'forged' : 'fine', traits });

/** One sword tap at the target; the damage it did. */
function tap(room: ArenaRoom, t: { hp: number }, seq = 1): number {
  const hp = t.hp;
  room.setIntent('me', intent({ attackSeq: seq, ay: -1 }));
  run(room, 0.35);
  return hp - t.hp;
}

describe('loot', () => {
  it('rolls a weapon for the class: one skill trait, plus an element when forged', () => {
    const rng = new Rng(5);
    for (let i = 0; i < 40; i++) {
      const it = rollItem(rng, 'RANGER', 0.5);
      expect(CLASS_KITS.RANGER).toContain(it.kit);
      expect(it.traits.length).toBe(it.quality === 'forged' ? 2 : 1);
    }
  });

  it('the butcher always drops a weapon for the nearest player', () => {
    const { room, t } = onTarget(0);
    t.hp = 1;
    const ev = (tap(room, t), room.events);
    run(room, 0.2);
    expect(room.drops.length).toBe(1);
    expect(CLASS_KITS.WARRIOR).toContain(room.drops[0].item.kit);
    expect(ev).toBeDefined();
  });

  it('taking a drop equips it and leaves the old one behind; another class cannot take it', () => {
    const { room, h } = onTarget(1);
    h.arms.sword = arm(['tempo']);
    room.drops.push({ id: 900, x: h.x, y: h.y, item: arm(['riposte', 'ember']), life: 30 });
    room.drops.push({ id: 901, x: h.x, y: h.y, item: arm(['deadeye'], 'longbow'), life: 30 });
    room.setIntent('me', intent({ takeSeq: 1, take: 900 }));
    const ev = run(room, 0.1);
    expect(h.arms.sword?.traits).toEqual(['riposte', 'ember']);
    expect(room.drops.some((d) => d.item.traits[0] === 'tempo')).toBe(true);
    expect(ev.some((e) => e.k === 'loot')).toBe(true);
    room.setIntent('me', intent({ takeSeq: 2, take: 901 }));
    run(room, 0.1);
    expect(h.arms.longbow).toBeUndefined();
  });
});

describe('traits pay off on execution', () => {
  it('BRUTAL hits a held-fast goblin harder', () => {
    const a = onTarget(3), b = onTarget(3);
    a.t.hp = b.t.hp = 500;
    b.h.arms.sword = arm(['brutal']);
    expect(tap(b.room, b.t)).toBeGreaterThan(tap(a.room, a.t) * 1.4);
  });

  it('TEMPO: after a dodge through a blow the next hit lands double, once', () => {
    const { room, h, t } = onTarget(3);
    t.hp = 500;
    h.arms.sword = arm(['tempo']);
    const plain = tap(room, t, 1);
    run(room, 0.4);
    h.tempoUntil = room.time + 1;
    expect(tap(room, t, 2)).toBe(plain * 2);
    run(room, 0.4);
    expect(tap(room, t, 3)).toBe(plain);
  });

  it('a draw released on the flash is perfect; held too long it weakens', () => {
    const draw = (hold: number) => {
      const { room, h } = onTarget(1);
      h.weapon = 'longbow';
      room.setIntent('me', intent({ attackSeq: 1, attack: true, ay: -1 }));
      run(room, hold);
      room.setIntent('me', intent({ attackSeq: 1, attack: false, ay: -1 }));
      const ev = run(room, 0.1);
      return { perfect: ev.some((e) => e.k === 'perfect'), power: h.power };
    };
    expect(draw(WEAPONS.longbow.draw! + 0.1).perfect).toBe(true);
    const over = draw(WEAPONS.longbow.draw! + RELEASE.overdraw + 0.3);
    expect(over.perfect).toBe(false);
    expect(over.power).toBe(RELEASE.overdrawn);
  });

  it('CRUSHING: a goblin you threw into a wall takes triple', () => {
    const { room, h, t } = onTarget(3);
    h.arms.sword = arm(['crushing']);
    Object.assign(t, { x: 9, y: 1.2, hp: 500, maxHp: 500, lastBy: 'me', kvy: -20 });
    const ev = run(room, 0.3);
    expect(ev.some((e) => e.k === 'hit' && e.n === KNOCK.wallDmg * 3)).toBe(true);
  });

  it('EMBERFORGED: a charged blow sets the goblin burning; a tap does not', () => {
    const { room, h, t } = onTarget(3);
    t.hp = 500;
    h.arms.sword = arm(['tempo', 'ember']);
    tap(room, t);
    expect(t.burnUntil).toBeLessThan(room.time);
    run(room, 0.5);
    room.setIntent('me', intent({ attackSeq: 2, attack: true, ay: -1 }));
    run(room, 0.9);
    room.setIntent('me', intent({ attackSeq: 2, attack: false, ay: -1 }));
    run(room, 0.3);
    expect(t.burnUntil).toBeGreaterThan(room.time);
  });

  it('REAPER: a backstab that kills heals you', () => {
    const { room, h, t } = onTarget(3);
    h.arms.sword = arm(['reaper']);
    h.hp = 50;
    Object.assign(t, { hp: 5, fx: 0, fy: -1 });
    tap(room, t);
    expect(t.act).toBe('dead');
    expect(h.hp).toBe(60);
  });
});
