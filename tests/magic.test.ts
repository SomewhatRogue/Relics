import { describe, expect, it } from 'vitest';
import { BURN, HERO, SHATTER, TICK, WEAPONS } from '../src/shared/tuning';
import { afflict, type World } from '../src/sim/elements';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type Enemy, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const ticks = (s: number) => Math.round(s / TICK);

/** One hero and the enemy at `index`; everyone else parked far apart in the corners. */
function onTarget(index: number) {
  const room = new ArenaRoom(1);
  const h = room.join('me');
  const t = room.enemies[index];
  const corners = [[1, 15], [17, 15], [1, 9], [17, 9], [17, 13]];
  room.enemies.forEach((e, i) => i !== index && Object.assign(e, { x: corners[i % 5][0], y: corners[i % 5][1], cooldown: 99 }));
  // Held still (stunned a long while) so it stays where the test puts it.
  Object.assign(t, { x: 9, y: 8, cooldown: 99, act: t.kind === 'butcher' || t.kind === 'scrapper' ? 'stunned' : t.act, actDur: 99 });
  Object.assign(h, { x: 9, y: 9.1 });
  return { room, h, t };
}

/** Step, collecting every event. */
function run(room: ArenaRoom, s: number): FightEvent[] {
  const out: FightEvent[] = [];
  for (let i = 0; i < ticks(s); i++) room.step(), out.push(...room.events);
  return out;
}

const world = (room: ArenaRoom, ev: FightEvent[] = []): World => ({ heroes: room.heroes, enemies: room.enemies, javelins: room.javelins, now: room.time, ev });

describe('class weapons', () => {
  it('the bow shoots a goblin six tiles away', () => {
    const { room, h, t } = onTarget(3);
    h.weapon = 'bow';
    Object.assign(t, { x: 9, y: 3 });
    room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    const ev = run(room, 0.8);
    expect(ev.some((e) => e.k === 'shoot')).toBe(true);
    expect(t.hp).toBeLessThan(t.maxHp);
  });

  it('a fully drawn arrow pierces two goblins in a line', () => {
    const { room, h } = onTarget(3);
    const [a, b] = [room.enemies[3], room.enemies[4]];
    h.weapon = 'bow';
    Object.assign(a, { x: 9, y: 6 });
    Object.assign(b, { x: 9, y: 3.5, cooldown: 99, act: 'stunned', actDur: 99 });
    Object.assign(h, { x: 9, y: 10 });
    room.setIntent('me', intent({ attackSeq: 1, attack: true, ay: -1 }));
    run(room, 1);
    room.setIntent('me', intent({ attackSeq: 1, attack: false, ay: -1 }));
    run(room, 0.6);
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(b.hp).toBeLessThan(b.maxHp);
  });

  it("the staff's charged orb bursts and throws a goblin back", () => {
    const { room, h, t } = onTarget(3);
    h.weapon = 'staff';
    Object.assign(t, { x: 9, y: 6, hp: 500, maxHp: 500 });
    room.setIntent('me', intent({ attackSeq: 1, attack: true, ay: -1 }));
    run(room, 1);
    room.setIntent('me', intent({ attackSeq: 1, attack: false, ay: -1 }));
    const ev = run(room, 0.6);
    expect(ev.some((e) => e.k === 'burst')).toBe(true);
    expect(t.y).toBeLessThan(5.5);
  });

  it("the mace's third blow heals the healer, and the held blessing heals more", () => {
    const { room, h } = onTarget(1);
    h.weapon = 'mace';
    h.hp = 50;
    let seq = 0;
    for (let i = 0; i < ticks(1.6); i++) {
      if (i % 9 === 0) room.setIntent('me', intent({ attackSeq: ++seq }));
      room.step();
    }
    expect(h.hp).toBe(50 + (WEAPONS.mace.combo[2].heal ?? 0));
    run(room, 0.6);
    h.hp = 40;
    room.setIntent('me', intent({ attackSeq: ++seq, attack: true }));
    run(room, 1);
    room.setIntent('me', intent({ attackSeq: seq, attack: false }));
    run(room, 0.4);
    expect(h.hp).toBe(Math.min(HERO.hp, 40 + (WEAPONS.mace.heavy.healFull ?? 0)));
  });

  it("the mage's blink jumps far in a blink", () => {
    const { room, h } = onTarget(1);
    h.weapon = 'staff';
    Object.assign(h, { x: 6, y: 12 });
    room.setIntent('me', intent({ rollSeq: 1, mx: 1 }));
    const ev = run(room, 0.2);
    expect(ev.some((e) => e.k === 'blink')).toBe(true);
    expect(h.x - 6).toBeGreaterThan(3);
  });
});

describe('new relics', () => {
  it('the gale horn throws a scrapper into the wall', () => {
    const { room, h, t } = onTarget(3);
    Object.assign(t, { x: 9, y: 3 });
    Object.assign(h, { x: 9, y: 5.5 });
    room.setIntent('me', intent({ relicPickSeq: 1, relicPick: 2 }));
    room.step();
    expect(h.relic).toBe('horn');
    room.setIntent('me', intent({ relicPickSeq: 1, relicPick: 2, relicSeq: 1, ay: -1 }));
    const ev = run(room, 0.8);
    expect(ev.some((e) => e.k === 'gust')).toBe(true);
    expect(ev.some((e) => e.k === 'wallhit')).toBe(true);
  });

  it('the blast flask flies to where you aim and bursts there', () => {
    const { room, h, t } = onTarget(3);
    Object.assign(t, { x: 9, y: 5 });
    room.setIntent('me', intent({ loadoutSeq: 1 }));
    room.step();
    expect(h.relics).toContain('flask');
    room.setIntent('me', intent({ loadoutSeq: 1, relicPickSeq: 1, relicPick: 2 }));
    room.step();
    expect(h.relic).toBe('flask');
    Object.assign(h, { x: 9, y: 9 });
    room.setIntent('me', intent({ loadoutSeq: 1, relicPickSeq: 1, relicPick: 2, relicSeq: 1, ax: 0, ay: -4 }));
    const ev = run(room, 1.2);
    const burst = ev.find((e) => e.k === 'burst');
    expect(burst && Math.abs(burst.y - 5)).toBeLessThan(0.3);
    expect(t.hp).toBeLessThan(t.maxHp);
  });

  it('cycles the equipped relic through its augments', () => {
    const { room, h } = onTarget(1);
    const seen: string[] = [];
    for (let i = 1; i <= 4; i++) {
      room.setIntent('me', intent({ augmentSeq: i }));
      room.step();
      seen.push(h.augments.javelin);
    }
    expect(seen).toEqual(['fire', 'frost', 'storm', '']);
  });
});

describe('elements', () => {
  const pair = () => {
    const { room, t } = onTarget(3);
    const o = room.enemies[4];
    Object.assign(o, { x: 10, y: 8, cooldown: 99 });
    return { room, t, o };
  };

  it('fire burns over time and spreads to a goblin it touches', () => {
    const { room, t, o } = pair();
    Object.assign(o, { x: 9.65, y: 8 });
    afflict(world(room), t, 'fire', 10);
    const hp = t.hp;
    run(room, 1.1);
    expect(t.hp).toBeLessThanOrEqual(hp - 2 * BURN.dmg);
    expect(o.burnUntil).toBeGreaterThan(room.time);
  });

  it('frost twice freezes solid; storm shatters the frozen', () => {
    const { room, t } = pair();
    t.act = 'chase';
    afflict(world(room), t, 'frost', 5);
    expect(t.chillUntil).toBeGreaterThan(room.time);
    afflict(world(room), t, 'frost', 5);
    expect(t.frozenUntil).toBeGreaterThan(room.time);
    const x = t.x;
    t.cooldown = 0;
    run(room, 0.5);
    expect(t.x).toBe(x);
    expect(t.attack).toBeNull();
    const ev: FightEvent[] = [];
    const hp = t.hp;
    afflict(world(room, ev), t, 'storm', 10);
    expect(ev.some((e) => e.k === 'shatter')).toBe(true);
    expect(hp - t.hp).toBeGreaterThanOrEqual(SHATTER.dmg);
  });

  it('fire on a chilled goblin bursts into steam and stuns what is near', () => {
    const { room, t, o } = pair();
    afflict(world(room), t, 'frost', 5);
    const ev: FightEvent[] = [];
    afflict(world(room, ev), t, 'fire', 5);
    expect(ev.some((e) => e.k === 'steam')).toBe(true);
    expect(t.chillUntil).toBe(0);
    expect(o.act).toBe('stunned');
  });

  it('storm on the burning flares and throws its neighbour', () => {
    const { room, t, o } = pair();
    afflict(world(room), t, 'fire', 5);
    const ev: FightEvent[] = [];
    afflict(world(room, ev), t, 'storm', 10);
    expect(ev.some((e) => e.k === 'flare')).toBe(true);
    expect(o.kvx).toBeGreaterThan(0);
  });

  it('storm arcs to nearby goblins and to a javelin stuck in a far one', () => {
    const { room, t, o } = pair();
    const far: Enemy = room.enemies[0];
    Object.assign(far, { x: 9, y: 3 });
    room.javelins.push({ id: 99, owner: 'me', x: 9, y: 3, dx: 0, dy: -1, state: 'body', travelled: 0, enemy: far.id, ox: 0, oy: 0, hit: [], life: 9, el: '' });
    const ev: FightEvent[] = [];
    afflict(world(room, ev), t, 'storm', 10);
    const shocks = ev.filter((e) => e.k === 'shock');
    expect(shocks.some((e) => e.k === 'shock' && e.x2 === o.x)).toBe(true);
    expect(shocks.some((e) => e.k === 'shock' && e.y2 === far.y)).toBe(true);
    expect(far.hp).toBeLessThan(far.maxHp);
  });
});
