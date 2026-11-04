/** The Mage's quick channel and each element's job: the primed spell, weaknesses and resistances, storm round a shield. */
import { describe, expect, it } from 'vitest';
import { BURN, CHANNEL, TICK, VARIANTS, WEAK, WEAK_POP, WEAPONS, type Hurt } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { damage } from '../src/sim/damage';
import { newEnemy } from '../src/sim/enemies';
import { hitEnemy } from '../src/sim/combat';
import { shoot, stepBolt } from '../src/sim/bolts';
import { stepElements, type World } from '../src/sim/elements';
import { newHero } from '../src/sim/hero';
import { NO_INTENT, type Enemy, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
function run(room: ArenaRoom, s: number): FightEvent[] {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
}

/** A Mage alone in the arena, every goblin parked far off and idle. */
function mage() {
  const room = new ArenaRoom(1);
  const h = room.join('me');
  for (let i = 1; i <= 3; i++) room.setIntent('me', intent({ classSeq: i })), room.step();
  for (const e of room.enemies) Object.assign(e, { x: 1, y: 15, cooldown: 99, act: 'stunned', actDur: 99 });
  Object.assign(h, { x: 9, y: 9 });
  return { room, h };
}

/** A foe that reads `key`'s row of the table, with health to spare. */
function foe(key: string, id = 1, x = 9, y = 7): Enemy {
  const kinds = ['butcher', 'scrapper', 'spider', 'brood', 'nest'];
  const e = newEnemy(id, (kinds.includes(key) ? key : key === 'boss' || key === 'stoker' ? 'butcher' : 'scrapper') as Enemy['kind'], x, y);
  if (key === 'archer') e.bow = true;
  else if (key === 'boss') e.name = 'Gristle';
  else if (!kinds.includes(key)) e.variant = key as Enemy['variant'];
  return Object.assign(e, { hp: 999, maxHp: 999, alert: true });
}

describe('the quick channel', () => {
  it('turns to the next element at once, comes back in about a second, and goes round', () => {
    const { room, h } = mage();
    expect(h.relic).toBe('channel');
    room.setIntent('me', intent({ classSeq: 3, relicSeq: 1 }));
    const ev = run(room, 0.3);
    expect(ev.find((e) => e.k === 'channeled')).toMatchObject({ el: 'frost' });
    expect(h.act).toBe('idle');
    expect(h.relicReady.channel - room.time).toBeGreaterThan(CHANNEL.cooldown - 0.35);
    expect(h.relicReady.channel - room.time).toBeLessThanOrEqual(CHANNEL.cooldown);
    // Too soon: nothing.
    room.setIntent('me', intent({ classSeq: 3, relicSeq: 2 }));
    run(room, 0.2);
    expect(h.augments.channel).toBe('frost');
    run(room, CHANNEL.cooldown);
    room.setIntent('me', intent({ classSeq: 3, relicSeq: 3 }));
    run(room, 0.2);
    expect(h.augments.channel).toBe('storm');
    run(room, CHANNEL.cooldown);
    room.setIntent('me', intent({ classSeq: 3, relicSeq: 4 }));
    run(room, 0.2);
    expect(h.augments.channel).toBe('fire');
  });

  it('primes the first spell after a turn (and only the first)', () => {
    const { room, h } = mage();
    h.augments.channel = 'storm';
    room.setIntent('me', intent({ classSeq: 3, relicSeq: 1, ay: -1 }));
    run(room, 0.2);
    expect(h.augments.channel).toBe('fire');
    const cast = (seq: number) => {
      room.setIntent('me', intent({ classSeq: 3, relicSeq: 1, attackSeq: seq, ay: -1 }));
      const seen = new Set(room.bolts.map((b) => b.id));
      let dmg = 0, primed = false;
      for (let i = 0; i < Math.round(0.8 / TICK); i++) {
        room.step();
        for (const b of room.bolts) if (!seen.has(b.id)) seen.add(b.id), (dmg = b.dmg);
        for (const e of room.events) if (e.k === 'shoot' && e.primed) primed = true;
      }
      return { dmg, primed };
    };
    const first = cast(1), second = cast(2);
    expect(first.primed).toBe(true);
    expect(second.primed).toBe(false);
    expect(first.dmg).toBe(Math.round(WEAPONS[h.weapon].combo[0].dmg * CHANNEL.primed));
    expect(second.dmg).toBe(WEAPONS[h.weapon].combo[0].dmg);
    expect(h.primed).toBe(false);
  });
});

describe('weaknesses and resistances', () => {
  it('every entry in the table lands through the damage path, and says WEAK or RESIST', () => {
    for (const [key, row] of Object.entries(WEAK)) {
      for (const [by, m] of Object.entries(row) as [Hurt, number][]) {
        const e = foe(key), ev: FightEvent[] = [];
        damage(e, 20, 0, ev, { el: by === 'physical' ? '' : by });
        expect(e.hp, `${key} ${by}`).toBe(999 - Math.max(1, Math.round(20 * m)));
        expect(ev.some((x) => x.k === (m > 1 ? 'weak' : 'resist')), `${key} ${by}`).toBe(m !== 1);
      }
    }
  });

  it('the jobs: fire on swarms, frost on the big, storm on casters and shields', () => {
    expect(WEAK.spider.fire!).toBeGreaterThan(1);
    expect(WEAK.drummer.fire!).toBeGreaterThan(1);
    expect(WEAK.butcher.fire!).toBeLessThan(1);
    expect(WEAK.butcher.frost!).toBeGreaterThan(1);
    expect(WEAK.stoker.fire!).toBeLessThan(1);
    expect(WEAK.stoker.frost!).toBeGreaterThan(1);
    expect(WEAK.heavy.frost!).toBeLessThan(1);
    expect(WEAK.hexer.storm!).toBeGreaterThan(1);
    expect(WEAK.shield.storm!).toBeGreaterThan(1);
  });

  it('a blade on a brute is resisted (the melee path reads the table too)', () => {
    const h = newHero('me', 9, 9), s = WEAPONS.sword.combo[0];
    Object.assign(h, { weapon: 'sword', fx: 0, fy: -1 });
    const plain = foe('scrapper', 1, 9, 8.2), brute = foe('heavy', 2, 9, 8.2), ev: FightEvent[] = [];
    plain.fy = brute.fy = 1;
    expect(hitEnemy(h, s, plain, 0, ev)).toBe(s.dmg);
    h.hitIds = [];
    expect(hitEnemy(h, s, brute, 0, ev)).toBe(Math.round(s.dmg * WEAK.heavy.physical!));
    expect(ev.filter((x) => x.k === 'resist').length).toBe(1);
  });

  it('pops at most once a half second over the same foe', () => {
    const e = foe('stoker'), ev: FightEvent[] = [];
    damage(e, 5, 0, ev, { el: 'frost' });
    damage(e, 5, 0.2, ev, { el: 'frost' });
    damage(e, 5, 0.3, ev, { el: 'fire' });
    expect(ev.filter((x) => x.k === 'weak' || x.k === 'resist').length).toBe(1);
    damage(e, 5, WEAK_POP + 0.01, ev, { el: 'fire' });
    expect(ev.filter((x) => x.k === 'resist').length).toBe(1);
    // A burn's tick never pops.
    damage(e, 5, 5, ev, { el: 'fire', tick: true });
    expect(ev.filter((x) => x.k === 'weak' || x.k === 'resist').length).toBe(2);
  });
});

describe("each element's job", () => {
  /** A spark from a hero at (9, 10) straight up at a shield-bearer facing it; what the shot took off. */
  const sparkAt = (el: '' | 'storm') => {
    const room = new ArenaRoom(1), h = newHero('me', 9, 10);
    Object.assign(h, { fx: 0, fy: -1 });
    const e = foe('shield', 1, 9, 7);
    e.fy = 1;
    const w: World = { heroes: [h], enemies: [e], javelins: [], props: [], now: room.time, ev: [] };
    const b = shoot(h, WEAPONS.wand.combo[0], el);
    for (let i = 0; i < 60 && stepBolt(b, w, TICK); i++);
    return 999 - e.hp;
  };

  it('storm goes round a shield from the front; anything else meets the board', () => {
    const s = WEAPONS.wand.combo[0];
    expect(sparkAt('')).toBe(Math.round(s.dmg * VARIANTS.shield.shot));
    expect(sparkAt('storm')).toBe(Math.round(s.dmg * WEAK.shield.storm!));
  });

  it('fire jumps between goblins standing close (not only touching)', () => {
    const a = foe('scrapper', 1, 5, 5), b = foe('scrapper', 2, 5 + a.radius * 2 + BURN.spread - 0.05, 5);
    const ev: FightEvent[] = [], w: World = { heroes: [], enemies: [a, b], javelins: [], props: [], now: 0, ev };
    Object.assign(a, { burnUntil: BURN.time, burnNext: 0.01 });
    for (let t = 0; t < 0.2; t += TICK) (w.now = t), stepElements(w);
    expect(b.burnUntil).toBeGreaterThan(0);
  });
});
