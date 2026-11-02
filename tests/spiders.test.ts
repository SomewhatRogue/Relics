/** Spiders: nests that hatch waves until they're destroyed, poison, the brood mother's glob, fire, and where they turn up. */
import { describe, expect, it } from 'vitest';
import { board, PLACES, SEWERS, type Job } from '../src/shared/jobs';
import { planRoom, type Foe } from '../src/shared/terrain';
import { spiderChance, SPIDERS } from '../src/shared/nests';
import { BROOD, BURN, NEST, POISON, PUDDLE, SPIDER, TICK, weakness } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { damage, kill } from '../src/sim/damage';
import { newEnemy } from '../src/sim/enemies';
import { stepElements } from '../src/sim/elements';
import { cure, poison, stepPoison } from '../src/sim/poison';
import { scaleFoes } from '../src/sim/party';
import { waveFor } from '../src/sim/spiders';
import { NO_INTENT, type FightEvent } from '../src/sim/types';

const job = (kind: Job['place']['kind'], o: Partial<Job> = {}): Job => ({ ...board(3)[1], rooms: 3, place: { name: 'Test', kind, region: 'Greyhollow', ruin: 2 }, objective: 'hunt', seed: 77, ...o });
/** A clear field to fight in, with these foes and a hero at (x, y). */
function arena(foes: Foe[], x = 14, y = 18): ArenaRoom {
  const map = { ...planRoom(job('field'), 0).map, blocks: [], rounds: [], ledges: undefined, water: undefined, npcs: undefined };
  const room = new ArenaRoom(5, { map, foes });
  const h = room.join('me');
  Object.assign(h, { x, y, hp: 100, maxHp: 100 });
  room.setIntent('me', NO_INTENT);
  return room;
}
const run = (room: ArenaRoom, s: number, each?: () => void) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events), each?.();
  return out;
};
const spiders = (room: ArenaRoom) => room.enemies.filter((e) => e.kind === 'spider' && e.act !== 'dead');

describe('nests', () => {
  it('sleep until a hero comes near, then hatch a wave every few seconds until destroyed', () => {
    const room = arena([{ kind: 'nest', x: 14, y: 6, wave: NEST.wave }], 14, 21);
    const h = room.heroes[0];
    // Hold the hero still and unhurt (the spiders are coming for them).
    const keep = () => Object.assign(h, { hp: 100, x: h.x, act: 'idle' });
    run(room, 3, keep);
    expect(spiders(room)).toHaveLength(0);
    Object.assign(h, { y: 6 + NEST.wake - 1 });
    run(room, NEST.first + 0.1, keep);
    expect(spiders(room)).toHaveLength(NEST.wave);
    run(room, NEST.every, keep);
    expect(spiders(room)).toHaveLength(NEST.wave * 2);
    const nest = room.enemies.find((e) => e.kind === 'nest')!;
    kill(nest, room.events);
    for (const s of spiders(room)) kill(s, room.events);
    run(room, NEST.every * 2, keep);
    expect(spiders(room)).toHaveLength(0);
  });

  it('stops hatching while its cap of spiders is alive', () => {
    const room = arena([{ kind: 'nest', x: 14, y: 6, wave: NEST.wave }], 14, 8);
    const h = room.heroes[0];
    run(room, NEST.first + NEST.every * 5, () => Object.assign(h, { hp: 100, act: 'idle', x: 14, y: 8 }));
    expect(spiders(room).length).toBeLessThanOrEqual(NEST.cap);
  });

  it('in a party the nest is not copied; its waves grow instead', () => {
    const foes = scaleFoes([{ kind: 'nest', x: 5, y: 5, wave: NEST.wave }, { kind: 'spider', x: 6, y: 5 }, { kind: 'scrapper', x: 9, y: 9 }], 3, 2);
    expect(foes.filter((f) => f.kind === 'nest')).toHaveLength(1);
    expect(foes.find((f) => f.kind === 'nest')!.wave).toBe(waveFor(3));
    expect(waveFor(3)).toBeGreaterThan(NEST.wave);
    expect(foes.filter((f) => f.kind === 'spider').length).toBeGreaterThan(1);
  });
});

describe('poison', () => {
  it('a bite poisons; it ticks, stacks a little, wears off a stack at a time, never takes the last point', () => {
    const room = arena([]), h = room.heroes[0], ev: FightEvent[] = [];
    for (let i = 0; i < 5; i++) poison(h, 0, ev);
    expect(h.poison).toBe(POISON.most);
    let t = 0;
    const tick = (s: number) => { for (let i = 0; i < Math.round(s / TICK); i++) (t += TICK), stepPoison([h], t, ev); };
    tick(POISON.every + 0.05);
    expect(h.hp).toBe(100 - POISON.dmg * POISON.most);
    tick(POISON.time - POISON.every);
    expect(h.poison).toBe(POISON.most - 1);
    tick(POISON.fade * (POISON.most - 1) + 0.1);
    expect(h.poison).toBe(0);
    const left = h.hp;
    tick(3);
    expect(h.hp).toBe(left);
    h.hp = 2;
    poison(h, t, ev), poison(h, t, ev);
    tick(4);
    expect(h.hp).toBe(1);
  });

  it('a Bitter cures it; a heal takes a stack off', () => {
    const room = arena([]), h = room.heroes[0], ev: FightEvent[] = [];
    poison(h, 0, ev), poison(h, 0, ev);
    expect(cure(h, false, ev)).toBe(true);
    expect(h.poison).toBe(1);
    h.belt = ['bitter'];
    room.setIntent('me', { ...NO_INTENT, potionSeq: 1 });
    run(room, 0.2);
    expect(h.poison).toBe(0);
  });

  it("a spider's pounce that lands poisons; one blocked doesn't", () => {
    const bitten = (block: boolean) => {
      const room = arena([{ kind: 'spider', x: 14, y: 16.2, awake: true }], 14, 18);
      const h = room.heroes[0];
      // Straight in from the front (no circling first).
      Object.assign(h, { fx: 0, fy: -1 }), (room.enemies[0].cooldown = 0);
      room.setIntent('me', { ...NO_INTENT, block, ay: -1 });
      let hit = false;
      run(room, 0.9, () => (hit ||= (h.poison ?? 0) > 0));
      return hit;
    };
    expect(bitten(false)).toBe(true);
    expect(bitten(true)).toBe(false);
  });
});

describe('the brood mother', () => {
  it("spits a glob that lands where its circle is drawn, and leaves a puddle there that poisons", () => {
    const room = arena([{ kind: 'brood', x: 14, y: 10, awake: true }], 14, 16.5);
    const h = room.heroes[0], b = room.enemies[0];
    let at: { x: number; y: number } | null = null;
    const ev = run(room, 6, () => {
      if (!at && b.attack?.kind === 'spit') at = { x: b.attack.cx, y: b.attack.cy };
      Object.assign(h, { hp: 100, act: 'idle' });
    });
    expect(at).not.toBeNull();
    expect(at!.x).toBeCloseTo(14, 5), expect(at!.y).toBeCloseTo(16.5, 5);
    const land = ev.find((e) => e.k === 'impact' && e.kind === 'spit')!;
    expect([land.x, land.y]).toEqual([at!.x, at!.y]);
    const pool = room.puddles.find((p) => p.x === at!.x && p.y === at!.y);
    expect(pool?.r).toBe(PUDDLE.radius);
    expect(h.poison).toBeGreaterThan(0);
    // The puddle dries.
    run(room, PUDDLE.life + 0.1, () => Object.assign(h, { x: 2, y: 20, hp: 100 }));
    expect(room.puddles.some((p) => p.x === at!.x)).toBe(false);
    expect(BROOD.spit.unblockable).toBe(true);
  });
});

describe('fire', () => {
  it('multiplies on spiders (and shows WEAK); a goblin takes it as it comes', () => {
    const ev: FightEvent[] = [], s = newEnemy(1, 'spider', 5, 5), g = newEnemy(2, 'scrapper', 5, 5), n = newEnemy(3, 'nest', 9, 9);
    damage(s, 4, 0, ev, { el: 'fire' });
    expect(s.hp).toBe(SPIDER.hp - Math.round(4 * weakness('spider', 'fire')));
    expect(ev.some((e) => e.k === 'weak')).toBe(true);
    damage(g, 4, 0, ev, { el: 'fire' });
    expect(g.hp).toBe(g.maxHp - 4);
    const nest = n.hp;
    damage(n, 10, 0, ev);
    expect(n.hp).toBe(nest - Math.round(10 * weakness('nest', 'physical')));
    expect(weakness('nest', 'fire')).toBeGreaterThan(weakness('spider', 'fire'));
  });

  it('a burn kills a spider in a tick, and spreads through a pack of them', () => {
    const pack = [0, 1, 2, 3].map((i) => newEnemy(i + 1, 'spider', 5 + i * 0.75, 5));
    const ev: FightEvent[] = [], w = { heroes: [], enemies: pack, javelins: [], props: [], now: 0, ev };
    Object.assign(pack[0], { burnUntil: BURN.time, burnNext: 0.01 });
    for (let t = 0; t < 3; t += TICK) (w.now = t), stepElements(w);
    expect(pack.every((e) => e.act === 'dead')).toBe(true);
  });
});

describe('where spiders turn up', () => {
  it('only in forests, marshes, mines and ruins, never under Wickhold; more often deeper in', () => {
    for (const p of PLACES) {
      const j = job(p.kind, { place: p });
      const any = [0, 1, 2, 3, 4].some((i) => spiderChance(j, i) > 0);
      expect(any).toBe(SPIDERS.places.includes(p.kind));
    }
    expect(spiderChance(job('mine', { place: SEWERS }), 2)).toBe(0);
    expect(spiderChance(job('forest'), 2)).toBeGreaterThan(spiderChance(job('forest'), 0));
  });

  it('the rooms that roll them have nests (and a brood mother only from the third room, or the second on a deep job)', () => {
    const kinds = new Map<string, number>();
    let brood = 0;
    for (let seed = 1; seed <= 120; seed++) for (const kind of ['forest', 'marsh', 'mine', 'ruins', 'village', 'farm', 'field', 'river'] as const) {
      const j = job(kind, { seed, rooms: 5 });
      for (let i = 0; i < 5; i++) {
        const foes = planRoom(j, i).foes, n = foes.filter((f) => f.kind === 'nest').length;
        if (!n) {
          expect(foes.some((f) => f.kind === 'spider' || f.kind === 'brood')).toBe(false);
          continue;
        }
        kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
        if (foes.some((f) => f.kind === 'brood')) (brood++, expect(i).toBeGreaterThanOrEqual(SPIDERS.brood.from));
      }
    }
    expect([...kinds.keys()].sort()).toEqual(['forest', 'marsh', 'mine', 'ruins']);
    expect(brood).toBeGreaterThan(0);
    // Same seed, same room.
    expect(planRoom(job('forest', { seed: 9 }), 2).foes).toEqual(planRoom(job('forest', { seed: 9 }), 2).foes);
  });
});
