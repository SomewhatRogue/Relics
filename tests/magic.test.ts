import { describe, expect, it } from 'vitest';
import { BURN, SHATTER, TICK, WEAPONS } from '../src/shared/tuning';
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

const world = (room: ArenaRoom, ev: FightEvent[] = []): World => ({ heroes: room.heroes, enemies: room.enemies, javelins: room.javelins, props: room.props, now: room.time, ev });

const charged = (room: ArenaRoom, hold: number, aim: Partial<Intent> = { ay: -1 }) => {
  room.setIntent('me', intent({ attackSeq: 1, attack: true, ...aim }));
  run(room, hold);
  room.setIntent('me', intent({ attackSeq: 1, attack: false, ...aim }));
  return run(room, 0.7);
};

describe('class weapons', () => {
  it('a longbow tap looses one arrow (no combo)', () => {
    const { room, h, t } = onTarget(3);
    h.weapon = 'longbow';
    Object.assign(t, { x: 9, y: 3 });
    let seq = 0, shots = 0;
    for (let i = 0; i < ticks(1); i++) {
      if (i % 4 === 0) room.setIntent('me', intent({ attackSeq: ++seq, ay: -1 }));
      room.step();
      shots += room.events.filter((e) => e.k === 'shoot').length;
    }
    expect(shots).toBeLessThanOrEqual(2);
    expect(t.hp).toBeLessThan(t.maxHp);
  });

  it('a full longbow draw pierces two goblins; a half draw does not', () => {
    const line = (hold: number) => {
      const { room, h } = onTarget(3);
      const [a, b] = [room.enemies[3], room.enemies[4]];
      h.weapon = 'longbow';
      Object.assign(a, { x: 9, y: 6, hp: 200, maxHp: 200 });
      Object.assign(b, { x: 9, y: 3.5, cooldown: 99, act: 'stunned', actDur: 99, hp: 200, maxHp: 200 });
      Object.assign(h, { x: 9, y: 10 });
      charged(room, hold);
      return [a.hp < 200, b.hp < 200];
    };
    expect(line(1.5)).toEqual([true, true]);
    expect(line(0.6)).toEqual([true, false]);
  });

  it('draw times differ: the shortbow is full in half the time of the longbow', () => {
    expect(WEAPONS.shortbow.draw!).toBeLessThan(WEAPONS.longbow.draw! / 2);
    expect(WEAPONS.longbow.heavy.dmgFull).toBeGreaterThan(WEAPONS.shortbow.heavy.dmgFull * 2);
  });

  it('the crossbow looses on the press, then reloads', () => {
    const { room, h } = onTarget(3);
    h.weapon = 'crossbow';
    room.setIntent('me', intent({ attackSeq: 1, attack: true, ay: -1 }));
    const ev = run(room, 0.15);
    expect(ev.some((e) => e.k === 'shoot' && e.kind === 'bolt')).toBe(true);
    room.setIntent('me', intent({ attackSeq: 2, attack: false, ay: -1 }));
    expect(run(room, 0.6).some((e) => e.k === 'shoot')).toBe(false);
  });

  it("the staff's long cast bursts and throws a goblin back", () => {
    const { room, h, t } = onTarget(3);
    h.weapon = 'staff';
    Object.assign(t, { x: 9, y: 6, hp: 500, maxHp: 500 });
    const ev = charged(room, 1.7);
    expect(ev.some((e) => e.k === 'burst')).toBe(true);
    expect(t.y).toBeLessThan(5.5);
  });

  it("the rod's lance runs through a line", () => {
    const { room, h } = onTarget(3);
    const [a, b] = [room.enemies[3], room.enemies[4]];
    h.weapon = 'rod';
    Object.assign(a, { x: 9, y: 6, hp: 200, maxHp: 200 });
    Object.assign(b, { x: 9, y: 3.5, cooldown: 99, act: 'stunned', actDur: 99, hp: 200, maxHp: 200 });
    charged(room, 1.1);
    expect(a.hp).toBeLessThan(200);
    expect(b.hp).toBeLessThan(200);
  });

  it("the mace's third blow heals; the held smite falls on the goblin and stuns it", () => {
    const { room, h, t } = onTarget(3);
    h.weapon = 'mace';
    h.hp = 50;
    Object.assign(t, { x: 9, y: 8, act: 'chase', hp: 500, maxHp: 500 });
    let seq = 0;
    for (let i = 0; i < ticks(1.6); i++) {
      if (i % 9 === 0) room.setIntent('me', intent({ attackSeq: ++seq, ay: -1 }));
      room.step();
    }
    expect(h.hp).toBe(50 + (WEAPONS.mace.combo[2].heal ?? 0));
    run(room, 0.6);
    Object.assign(t, { x: 9, y: 5, act: 'chase', hp: 500 });
    Object.assign(room.enemies[4], { x: 17, y: 13, act: 'stunned', actDur: 99 });
    Object.assign(h, { x: 9, y: 9.5 });
    const ev = charged(room, 1.3);
    expect(ev.some((e) => e.k === 'smite')).toBe(true);
    expect(500 - t.hp).toBeGreaterThanOrEqual(WEAPONS.mace.heavy.dmgFull);
    expect(t.act).toBe('stunned');
  });

  it('only the rogue is quick: every other class walks slower', () => {
    for (const k of Object.keys(WEAPONS) as (keyof typeof WEAPONS)[]) if (k !== 'daggers') expect(WEAPONS[k].speed).toBeLessThan(1);
    expect(WEAPONS.daggers.speed).toBeGreaterThan(1);
    expect(WEAPONS.staff.dodge.cooldown).toBeGreaterThan(WEAPONS.daggers.dodge.cooldown * 4);
  });
});

describe('class relics', () => {
  /** Press the class button n times (Warrior, then Ranger, Rogue, Mage, Healer). */
  const asClass = (room: ArenaRoom, n: number) => {
    for (let i = 1; i <= n; i++) room.setIntent('me', intent({ classSeq: i })), room.step();
  };

  it('each class starts with its one skill and no relics', () => {
    const { room, h } = onTarget(1);
    const seen: string[] = [];
    for (let i = 1; i <= 5; i++) room.setIntent('me', intent({ classSeq: i })), room.step(), seen.push(h.relics.join(' '));
    expect(seen).toEqual(['net', 'shadow', 'lodestone', 'sanctuary', 'horn']);
  });

  it("the ranger's net snares a scrapper flat", () => {
    const { room, h, t } = onTarget(3);
    asClass(room, 1);
    Object.assign(t, { x: 9, y: 5, act: 'chase' });
    room.setIntent('me', intent({ classSeq: 1, relicSeq: 1, ay: -1 }));
    run(room, 0.6);
    expect(t.snareUntil).toBeGreaterThan(room.time);
    const x = t.x, y = t.y;
    t.cooldown = 0;
    run(room, 1);
    expect(Math.hypot(t.x - x, t.y - y)).toBeLessThan(0.05);
    expect(t.attack).toBeNull();
  });

  it("the rogue's shadowstep lands behind the goblin, facing its back", () => {
    const { room, h, t } = onTarget(0);
    asClass(room, 2);
    Object.assign(t, { x: 9, y: 5, fx: 0, fy: 1 });
    Object.assign(h, { x: 9, y: 9 });
    room.setIntent('me', intent({ classSeq: 2, relicSeq: 1, ay: -1 }));
    run(room, 0.2);
    expect(h.y).toBeLessThan(t.y);
    expect(h.fy).toBeGreaterThan(0.9);
  });

  it("the mage's lodestone drags goblins together, then bursts", () => {
    const { room, h } = onTarget(3);
    asClass(room, 3);
    const [a, b] = [room.enemies[3], room.enemies[4]];
    Object.assign(a, { x: 7, y: 5, act: 'stunned', actDur: 99, hp: 300, maxHp: 300 });
    Object.assign(b, { x: 11, y: 5, cooldown: 99, act: 'stunned', actDur: 99, hp: 300, maxHp: 300 });
    room.setIntent('me', intent({ classSeq: 3, relicSeq: 1, ax: 0, ay: -4 }));
    const before = Math.abs(b.x - a.x);
    const ev = run(room, 1.4);
    expect(ev.some((e) => e.k === 'well')).toBe(true);
    expect(Math.abs(b.x - a.x)).toBeLessThan(before - 1.5);
    expect(run(room, 1.4).some((e) => e.k === 'burst')).toBe(true);
  });

  it("the healer's sanctuary: blessed ground mends and blesses allies in it, slowly, and burns goblins in it", () => {
    const room = new ArenaRoom(1, { squire: true });
    const h = room.join('me');
    const q = room.heroes.find((x) => x.id === 'squire')!;
    for (let i = 1; i <= 4; i++) room.setIntent('me', intent({ classSeq: i })), room.step();
    expect(h.relic).toBe('sanctuary');
    Object.assign(h, { x: q.x - 1, y: q.y, hp: 60 });
    q.hp = 40;
    const g = room.enemies.find((e) => e.kind === 'scrapper')!;
    Object.assign(g, { x: h.x + 0.5, y: h.y - 1.2, cooldown: 99, act: 'stunned', actDur: 99 });
    room.setIntent('me', intent({ classSeq: 4, relicSeq: 1 }));
    const ev = run(room, 1);
    expect(ev.some((e) => e.k === 'hallow')).toBe(true);
    expect(q.hp).toBeGreaterThan(40);
    expect(q.hp).toBeLessThan(60);
    expect(q.blessedUntil).toBeGreaterThan(room.time);
    expect(g.hp).toBeLessThan(g.maxHp);
    run(room, 6);
    expect(room.zones.length).toBe(0);
  });

  it("the ward soaks blows meant for you, solo, and throws an archer's arrow back", () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const h = room.join('me');
    for (let i = 1; i <= 4; i++) room.setIntent('me', intent({ classSeq: i })), room.step();
    expect(h.relic).toBe('sanctuary');
    room.setIntent('me', intent({ classSeq: 4, relicSeq: 1 }));
    run(room, 0.5);
    expect(h.wardUntil).toBeGreaterThan(room.time);
    const a = room.enemies.find((e) => e.kind === 'butcher')!;
    Object.assign(a, { bow: true, kind: 'scrapper', x: h.x, y: h.y - 5, fx: 0, fy: 1, cooldown: 0, hp: 36, maxHp: 36 });
    const hp = h.hp;
    const ev = run(room, 2);
    expect(ev.some((e) => e.k === 'reflect')).toBe(true);
    expect(h.hp).toBe(hp);
    expect(a.hp).toBeLessThan(36);
  });

  it("the war horn rallies allies: stamina back, and blocking costs half", () => {
    const room = new ArenaRoom(1, { squire: true });
    const h = room.join('me');
    const q = room.heroes.find((x) => x.id === 'squire')!;
    Object.assign(h, { x: q.x - 3, y: q.y, stamina: 10 });
    q.stamina = 5;
    expect(h.relic).toBe('horn');
    room.setIntent('me', intent({ relicSeq: 1 }));
    const ev = run(room, 0.5);
    expect(ev.some((e) => e.k === 'rally')).toBe(true);
    expect(q.stamina).toBeGreaterThan(90);
    expect(q.rallyUntil).toBeGreaterThan(room.time);
  });

  it('cycles the readied skill through its elements', () => {
    const { room, h } = onTarget(1);
    const seen: string[] = [];
    for (let i = 1; i <= 4; i++) {
      room.setIntent('me', intent({ augmentSeq: i }));
      room.step();
      seen.push(h.augments.horn);
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
