/**
 * The yard's straw men (shared/practice.ts, sim/practice.ts): every sort comes out of the board as a job
 * makes it, CLEAR and GO AGAIN, the drills' counts, a fall starts the fight over, nothing pays, and the
 * board only offers what the hero has met.
 */
import { describe, expect, it } from 'vitest';
import { Game, ME } from '../src/client/game';
import { DRILLS, PACKS, PRACTICE, SINGLES, metOf, sortKey } from '../src/shared/practice';
import { VARIANTS } from '../src/shared/tuning';
import { kill } from '../src/sim/damage';
import { offers, practiceOf, stepPractice } from '../src/sim/practice';
import { NO_INTENT, type Intent } from '../src/sim/types';

function yard() {
  const g = new Game();
  g.create('WARRIOR', 'KYLE');
  if (g.mode === 'wood') g.skipWood();
  g.enterYard();
  return g;
}
const swing = (k: number): Intent => ({ ...NO_INTENT, attack: k % 4 < 2, attackSeq: Math.floor(k / 4) });
const practised = (g: Game) => g.room.enemies.filter((e) => practiceOf(g.room)!.ids.includes(e.id));

describe('the practice board', () => {
  it('lets out every sort as a job makes it, and the yard fights on with it', () => {
    for (const s of SINGLES) {
      const g = yard();
      expect(g.practice({ k: 'single', key: s.key })).toBe(true);
      const [e] = practised(g);
      expect(e.kind).toBe(s.sort.kind);
      expect(e.variant).toBe(s.sort.variant);
      expect(!!e.bow).toBe(!!s.sort.bow);
      if (s.sort.variant) expect(e.maxHp).toBe(VARIANTS[s.sort.variant].hp);
      expect(sortKey(e)).toBe(s.key);
      // The yard's own sacking butcher and goblins went back in; the straw men stay.
      expect(g.room.enemies.filter((x) => x.kind === 'dummy' || x.kind === 'swingDummy')).toHaveLength(2);
      expect(g.room.enemies).toHaveLength(3);
      // (It fights: it moves or swings, and nothing in the room throws.)
      const x0 = e.x, y0 = e.y;
      let acted = false;
      for (let k = 0; k < 100 && g.mode === 'yard'; k++) g.step(0.1, swing(k)), (acted ||= e.act === 'attack' || e.act === 'dead' || Math.hypot(e.x - x0, e.y - y0) > 1);
      expect(acted).toBe(true);
    }
  });

  it('packs come out whole; CLEAR puts everything back; GO AGAIN starts it over', () => {
    const g = yard();
    for (const q of PACKS) {
      expect(g.practice({ k: 'pack', key: q.key })).toBe(true);
      expect(practised(g).map((e) => sortKey(e))).toEqual(q.of);
    }
    const before = practised(g);
    kill(practised(g)[0], []);
    expect(g.practiceAgain()).toBe(true);
    const now = practised(g);
    expect(now.every((e) => e.act !== 'dead')).toBe(true);
    expect(now.some((e) => before.includes(e))).toBe(false);
    g.clearPractice();
    expect(g.drill).toBeNull();
    expect(g.room.enemies.map((e) => e.kind).sort()).toEqual(['butcher', 'dummy', 'scrapper', 'scrapper', 'swingDummy']);
    expect(g.practice({ k: 'single', key: 'nothing' })).toBe(false);
  });

  it('offers only the sorts met, the packs of them, and the Mage the burn', () => {
    const fresh = metOf({ prologue: true, runs: 0 });
    expect([...fresh].sort()).toEqual(['heavy', 'looter', 'lunger', 'scrapper']);
    const o = offers(fresh, 'WARRIOR');
    expect(o.singles.map((s) => s.key)).toEqual(['scrapper', 'looter', 'lunger', 'heavy']);
    expect(o.packs).toHaveLength(0);
    expect(o.drills.map((d) => d.key)).toEqual(['parry', 'shields', 'hold']);
    expect(offers(fresh, 'MAGE').drills.map((d) => d.key)).toContain('burn');
    const all = offers(new Set(SINGLES.map((s) => s.key)), 'MAGE');
    expect(all.singles).toHaveLength(SINGLES.length);
    expect(all.packs).toHaveLength(PACKS.length);
    expect(all.drills).toHaveLength(DRILLS.length);
  });

  it('keeps the sorts met on a job, for the board', () => {
    const g = new Game();
    g.create('RANGER', 'SAM');
    if (g.mode === 'wood') g.skipWood();
    g.startJob(g.jobs().find((j) => !j.exped && j.objective !== 'story')!);
    const h = g.hero, e = g.room.enemies.find((x) => x.kind === 'scrapper')!;
    Object.assign(e, { x: h.x + 2, y: h.y, bow: true });
    for (let k = 0; k < 20; k++) g.step(0.1, NO_INTENT);
    expect(g.profile.met).toContain('archer');
  });
});

describe('the drills count', () => {
  it('parries against the heavy: PARRIED n OF 10, then done', () => {
    const g = yard();
    g.practice({ k: 'drill', key: 'parry' });
    const room = g.room, heavy = practised(g)[0], p = practiceOf(room)!;
    expect(heavy.variant).toBe('heavy');
    for (let i = 0; i < PRACTICE.swings; i++) {
      heavy.attack = { kind: 'swing', t: 0 } as never;
      stepPractice(room, i % 5 === 4 ? [] : [{ k: 'parry', x: 0, y: 0 }], ME);
      heavy.attack = null;
      stepPractice(room, [], ME);
    }
    expect(p.done).toBe(true);
    expect(p.line).toBe('PARRIED 8 OF 10');
  });

  it('a shield line broken, a pack burned, a minute held', () => {
    let g = yard();
    g.practice({ k: 'drill', key: 'shields' });
    expect(practised(g).map((e) => e.variant)).toEqual(['shield', 'shield', 'shield']);
    kill(practised(g)[0], []);
    stepPractice(g.room, [], ME);
    expect(g.drill!.line).toBe('SHIELDS DOWN 1 OF 3');
    for (const e of practised(g)) kill(e, []);
    stepPractice(g.room, [], ME);
    expect(g.drill!.line).toMatch(/^BROKE THE LINE IN \d+ S$/);

    g = yard();
    g.practice({ k: 'drill', key: 'burn' });
    expect(practised(g)).toHaveLength(5);
    practised(g).slice(0, 3).forEach((e) => (e.burnUntil = g.room.time + 2));
    stepPractice(g.room, [], ME);
    expect(g.drill!.line).toBe('BURNED 3 OF 5');

    g = yard();
    g.practice({ k: 'drill', key: 'hold' });
    expect(practised(g)).toHaveLength(PRACTICE.firstWave);
    // Out of reach of harm for the minute (the count, not the fight, is under test here).
    for (let k = 0; g.drill && !g.drill.done && k < 700; k++) (g.hero.safeT = 9), g.step(0.1, NO_INTENT);
    expect(g.drill!.done).toBe(true);
    expect(g.drill!.line).toBe('HELD 60 S');
    // Waves came out of the gate till PRACTICE.most were up, and what still stood went back in at the end.
    expect(g.drill!.ids.length).toBe(PRACTICE.most);
    expect(practised(g).filter((e) => e.act !== 'dead')).toHaveLength(0);
  });

  it("a fall doesn't count: the same fight starts over once you're up, and says how far you got", () => {
    const g = yard();
    g.practice({ k: 'drill', key: 'hold' });
    for (let k = 0; k < 120; k++) (g.hero.safeT = 9), g.step(0.1, NO_INTENT);
    const first = practised(g);
    Object.assign(g.hero, { act: 'down', actT: 0, actDur: 0.5 });
    stepPractice(g.room, [{ k: 'down', id: ME, x: g.hero.x, y: g.hero.y } as never], ME);
    expect(g.drill!.line).toMatch(/^HELD 1[12] S$/);
    for (let k = 0; k < 10; k++) g.step(0.1, NO_INTENT);
    expect(g.hero.act).not.toBe('down');
    expect(g.drill!.downed).toBe(false);
    expect(practised(g)).toHaveLength(PRACTICE.firstWave);
    expect(practised(g).some((e) => first.includes(e))).toBe(false);
    expect(g.drill!.line).toMatch(/^HELD 1[12] S$/);
  });
});

describe('nothing pays in the yard', () => {
  it('no gold, no XP, nothing dropped to take, whatever is put down', () => {
    const g = yard(), p = g.profile, was = { gold: p.gold, xp: p.xp, bag: p.bag.length, runs: p.runs };
    g.practice({ k: 'pack', key: 'butcherpack' });
    for (let round = 0; round < 6; round++) {
      for (const e of practised(g)) kill(e, []);
      for (let k = 0; k < 30; k++) {
        g.step(0.1, swing(k));
        expect(g.room.drops).toHaveLength(0);
        expect(g.room.pickups).toHaveLength(0);
      }
      g.practiceAgain();
    }
    expect({ gold: p.gold, xp: p.xp, bag: p.bag.length, runs: p.runs }).toEqual(was);
  });
});
