/** The movement ladder (shared/ladder.ts): taught in order at the trainer, none on an old save, and each rung firing in the room (and not without it). */
import { describe, expect, it } from 'vitest';
import { BLINK, DODGE, HERO, SNARE, TEACHES, TICK, drillLevel, drillPrice, newProfile, type WeaponId } from '../src/shared/tuning';
import { BLINK_BURST, CALTROPS, COVER, LADDER_LEVELS, LADDER_TITLE, LANDING, PARRY_MEND, RUNGS, RUNG_WORDS, SHELTER, TAUNT, TWIN_SNARE, knowsRung } from '../src/shared/ladder';
import { buyDrill, drillState, learnLesson } from '../src/shared/training';
import { trainerRows } from '../src/shared/trainrows';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { newHero } from '../src/sim/hero';
import { hitEnemy, hitHero } from '../src/sim/combat';
import { laySnare } from '../src/sim/ranger';
import { blinkCost } from '../src/sim/laddermage';
import { tauntTarget } from '../src/sim/taunt';
import { NO_INTENT, type Enemy, type EnemyAttack, type FightEvent, type Hero, type Intent, type Snare } from '../src/sim/types';

const goblin = (id: number, x: number, y: number, kind: Enemy['kind'] = 'scrapper') =>
  Object.assign(newEnemy(id, kind, x, y), { hp: 400, maxHp: 400, alert: true, fx: 0, fy: 1, respawns: false, cooldown: 99 });
/** A hero with `weapon` and `rungs` of the ladder, at (x, y) facing up. */
const hero = (weapon: WeaponId, rungs: number, id = 'me', x = 9, y = 9): Hero => Object.assign(newHero(id, x, y), { weapon, fy: -1, fx: 0, drills: { ladder: rungs } });
/** A goblin's blow at `aimed` from `e`, landing now. */
const blow = (e: Enemy, aimed: string, dy = 1): EnemyAttack => ({ kind: 'swing', aimed, t: 0.2, windup: 0.6, active: 0.1, recover: 0.3, dmg: 20, knock: 6, unblockable: false, dx: 0, dy, ox: e.x, oy: e.y, range: 2.5, arc: 120, cx: 0, cy: 0, radius: 0, done: false });

/** A room with `h` in it and goblins `es` (held where they are unless `free`); `run` steps it with an intent. */
function arena(hs: Hero[], es: Enemy[], free = false) {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  room.heroes = hs;
  room.enemies = es;
  const at = es.map((e) => [e.x, e.y]);
  const run = (s: number, i: Partial<Intent> = {}, id = hs[0].id): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent(id, { ...NO_INTENT, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      if (!free) es.forEach((e, j) => Object.assign(e, { x: at[j][0], y: at[j][1], kvx: 0, kvy: 0, cooldown: 99 }));
    }
    return out;
  };
  return { room, run };
}

describe('the ladder at the trainer', () => {
  it('three rungs a class at levels 5, 10 and 15, dearer each time, every class', () => {
    for (const cls of ['WARRIOR', 'ROGUE', 'RANGER', 'HEALER', 'MAGE'] as const) {
      expect(RUNGS[cls]).toHaveLength(3);
      expect(LADDER_TITLE[cls]).toBeTruthy();
    }
    expect(LADDER_LEVELS).toEqual([5, 10, 15]);
    expect([0, 1, 2].map((r) => drillLevel('ladder', r))).toEqual([5, 10, 15]);
    expect(drillPrice('ladder', 1)).toBeGreaterThan(drillPrice('ladder', 0));
    expect(drillPrice('ladder', 2)).toBeGreaterThan(drillPrice('ladder', 1));
    for (const w of Object.values(RUNG_WORDS)) expect(w.text + w.name).not.toMatch(/\u2014/);
  });

  it('rows say learned, next (level and price) or locked; bought one at a time; the third waits on level 15', () => {
    const p = Object.assign(newProfile('WARRIOR'), { level: 10, gold: 5000, drills: { ladder: 1 } });
    const rows = trainerRows(p).filter((r) => r.group === 'ladder');
    expect(rows.map((r) => r.rung)).toEqual(['taunt', 'standfast', 'cowing']);
    expect(rows.map((r) => r.tag)).toEqual(['LEARNED', `${drillPrice('ladder', 1)}g`, 'LEVEL 15']);
    expect(rows.map((r) => r.state)).toEqual(['max', 'buy', 'locked']);
    expect(new Set(trainerRows(p).map((r) => r.key)).size).toBe(trainerRows(p).length);
    expect(buyDrill(p, 'ladder')).toBe(true);
    expect(p.drills.ladder).toBe(2);
    expect(p.gold).toBe(5000 - drillPrice('ladder', 1));
    // Chapter 1's cap is 10: the third shows LEVEL 15 and can't be bought.
    expect(drillState(p, 'ladder')).toBe('locked');
    expect(buyDrill(p, 'ladder')).toBe(false);
  });

  it('an old save has no rungs, and starts at the first', () => {
    const old = Object.assign(newProfile('MAGE'), { level: 10, gold: 1000, drills: { power: 3, technique: 2 } });
    const rows = trainerRows(old).filter((r) => r.group === 'ladder');
    expect(rows.map((r) => r.state)).toEqual(['buy', 'needs', 'locked']);
    expect(rows[1].needs).toBe('BLINK BURST');
    for (const r of RUNGS.MAGE) expect(knowsRung({ weapon: 'wand', drills: old.drills }, r)).toBe(false);
    expect(buyDrill(old, 'ladder')).toBe(true);
    expect(knowsRung({ weapon: 'staff', drills: old.drills }, 'blinkburst')).toBe(true);
    // Another class's rung is never known.
    expect(knowsRung({ weapon: 'sword', drills: { ladder: 3 } }, 'blinkburst')).toBe(false);
  });

  it("a Ranger's TWO SNARES waits on the snare lesson", () => {
    const r = Object.assign(newProfile('RANGER'), { level: 10, gold: 2000, learned: ['skill' as const], drills: { ladder: 1 } });
    const row = trainerRows(r).find((x) => x.rung === 'twinsnare')!;
    expect(row.tag).toBe('NEEDS SNARE');
    expect(buyDrill(r, 'ladder')).toBe(false);
    expect(learnLesson(r, 'leave')).toBe(true);
    expect(TEACHES.leave.level).toBeLessThanOrEqual(10);
    expect(buyDrill(r, 'ladder')).toBe(true);
  });
});

describe('the Ranger: the jump', () => {
  it('JUMP SHOT: attack mid-jump looses an arrow at once, part drawn; nothing without it', () => {
    for (const rungs of [0, 1]) {
      const h = hero('longbow', rungs), { room, run } = arena([h], []);
      run(TICK, { rollSeq: 1 });
      expect(h.act).toBe('roll');
      const ev = run(TICK * 2, { rollSeq: 1, attackSeq: 1 });
      expect(h.act).toBe('roll');
      expect(room.bolts.filter((b) => b.kind === 'arrow')).toHaveLength(rungs);
      expect(ev.some((x) => x.k === 'airshot')).toBe(rungs === 1);
    }
    // A crossbow with no bolt on shoots nothing.
    const x = Object.assign(hero('crossbow', 1), { xbowEmpty: true }), a = arena([x], []);
    a.run(TICK, { rollSeq: 1 });
    a.run(TICK * 2, { rollSeq: 1, attackSeq: 1 });
    expect(a.room.bolts).toHaveLength(0);
  });

  it('TWO SNARES: the jump leaves a pair across it, and twice as many can be down', () => {
    for (const rungs of [1, 2]) {
      const h = Object.assign(hero('longbow', rungs), { rollX: 9, rollY: 9, rollDx: 0, rollDy: 1 }), snares: Snare[] = [], ev: FightEvent[] = [];
      laySnare(h, snares, 10, ev);
      expect(snares).toHaveLength(rungs);
      if (rungs === 2) {
        expect(Math.hypot(snares[0].x - snares[1].x, snares[0].y - snares[1].y)).toBeCloseTo(TWIN_SNARE.apart);
        expect(ev.some((x) => x.k === 'twinsnare')).toBe(true);
        // Two more jumps: four down at once, the oldest pair gone after that.
        laySnare(h, snares, 10 + SNARE.cooldown, ev);
        expect(snares).toHaveLength(4);
        laySnare(h, snares, 10 + SNARE.cooldown * 2, ev);
        expect(snares).toHaveLength(4);
      }
    }
  });

  it('HARD LANDING: small goblins beside where you land go over; a butcher and the far ones do not', () => {
    for (const rungs of [2, 3]) {
      // A backstep: you land 2.6 tiles behind where you face (down the screen).
      const h = hero('longbow', rungs), near = goblin(1, 9, 11.6 + LANDING.r * 0.6), far = goblin(2, 13, 11.6), big = goblin(3, 8.2, 11.6, 'butcher');
      const { run } = arena([h], [near, far, big]);
      const ev = run(0.5, { rollSeq: 1 });
      expect(near.act === 'stunned').toBe(rungs === 3);
      expect(far.act).not.toBe('stunned');
      expect(big.act).not.toBe('stunned');
      expect(ev.some((x) => x.k === 'landing')).toBe(rungs === 3);
    }
  });
});

describe('the Mage: the blink', () => {
  it('BLINK BURST: a burst of the element where you blinked from, drawn at the size judged', () => {
    for (const rungs of [0, 1]) {
      const h = hero('wand', rungs), e = goblin(1, 9.9, 9);
      h.augments.channel = 'fire';
      const { room, run } = arena([h], [e]);
      run(TICK, { rollSeq: 1, my: -1 });
      expect(e.hp).toBe(rungs ? 400 - BLINK_BURST.dmg : 400);
      expect(e.burnUntil > room.time).toBe(rungs === 1);
      const z = room.zones.find((q) => q.kind === 'blinkburst');
      expect(!!z).toBe(rungs === 1);
      if (z) expect(z.r).toBe(BLINK_BURST.r), expect([z.x, z.y]).toEqual([9, 9]);
    }
  });

  it('BLINK THROUGH: a blink at a goblin comes out at its back, facing it', () => {
    for (const rungs of [1, 2]) {
      const h = hero('wand', rungs), e = goblin(1, 9, 7.5);
      const { run } = arena([h], [e]);
      run(TICK, { rollSeq: 1, my: -1 });
      run(0.3, { rollSeq: 1 });
      if (rungs === 2) {
        expect(h.y).toBeCloseTo(7.5 - e.radius - HERO.radius - 0.15, 1);
        expect(h.fy).toBeGreaterThan(0.9);
      } else expect(h.y).toBeLessThan(9 - BLINK.distance + 0.01);
    }
  });

  it('PERFECT BLINK: a blink within 2 s of a PERFECT costs half', () => {
    const full = BLINK.stamina * DODGE.cost;
    for (const rungs of [2, 3]) {
      const h = Object.assign(hero('wand', rungs), { perfectAt: 10 });
      expect(blinkCost(h, 11)).toBe(rungs === 3 ? 0.5 : 1);
      expect(blinkCost(h, 12.5)).toBe(1);
      const { room, run } = arena([h], []);
      h.perfectAt = room.time + TICK;
      run(TICK, { rollSeq: 1, my: -1 });
      expect(HERO.stamina - h.stamina).toBeCloseTo(rungs === 3 ? full / 2 : full);
    }
  });
});

describe('the Rogue: the dash', () => {
  it('CALTROPS: dropped where the dash began, once every 5 s; goblins on them slow and bleed', () => {
    for (const rungs of [0, 1]) {
      const h = hero('daggers', rungs), e = goblin(1, 9, 9.3);
      const { room, run } = arena([h], [e]);
      run(0.5, { rollSeq: 1, mx: 1 });
      const z = room.zones.filter((q) => q.kind === 'caltrops');
      expect(z).toHaveLength(rungs);
      if (!rungs) continue;
      expect(z[0].r).toBe(CALTROPS.r);
      expect((e.caltropUntil ?? 0) > room.time).toBe(true);
      expect((e.bleedUntil ?? 0) > room.time).toBe(true);
      // A second dash soon after drops none.
      run(0.5, { rollSeq: 2, mx: -1 });
      expect(room.zones.filter((q) => q.kind === 'caltrops')).toHaveLength(1);
    }
  });

  it('THROUGH THE LEGS: dash through a goblin and the next hit, from the front, is a backstab', () => {
    for (const rungs of [1, 2]) {
      const h = hero('daggers', rungs, 'me', 9, 9), e = Object.assign(goblin(1, 10.5, 9), { fx: -1, fy: 0 });
      const { room, run } = arena([h], [e]);
      run(0.3, { rollSeq: 1, mx: 1 });
      expect(h.x).toBeGreaterThan(11);
      // Turned round to face it: from its front.
      Object.assign(h, { x: 9.6, y: 9, fx: 1, fy: 0, hitIds: [] });
      e.fx = -1;
      const ev: FightEvent[] = [];
      hitEnemy(h, { windup: 0, active: 0.1, recover: 0, dmg: 10, range: 1.5, arc: 90, lunge: 0, knock: 0 }, e, room.time, ev);
      expect(ev.some((x) => x.k === 'hit' && x.backstab)).toBe(rungs === 2);
    }
  });

  it('SHAKE IT OFF: a dash clears poison and fire underfoot can\'t burn a moment after', () => {
    for (const rungs of [2, 3]) {
      const h = Object.assign(hero('daggers', rungs), { poison: 2, poisonUntil: 99, poisonNext: 99 });
      const { room, run } = arena([h], []);
      const ev = run(TICK, { rollSeq: 1, mx: 1 });
      expect(h.poison).toBe(rungs === 3 ? 0 : 2);
      expect((h.fireproofUntil ?? 0) > room.time).toBe(rungs === 3);
      expect(ev.some((x) => x.k === 'shakeoff')).toBe(rungs === 3);
    }
  });
});

describe('the Healer: the guard', () => {
  /** A Healer blocking at (9, 9.6) facing up, a friend at (9, 9), a goblin above swinging at the friend. */
  const party = (rungs: number) => {
    const c = Object.assign(hero('mace', rungs, 'cleric', 9, 9.6), { blocking: true }), f = hero('sword', 0, 'friend', 9, 9), e = goblin(1, 9, 7.6);
    return { c, f, e };
  };

  it('SHELTER: a friend near a Healer holding a block takes less', () => {
    for (const rungs of [0, 1]) {
      const { c, f, e } = party(rungs), ev: FightEvent[] = [];
      c.fy = 1; // facing away, so COVER can't take it
      hitHero(e, blow(e, 'friend'), f, 10, ev, [c, f]);
      expect(HERO.hp - f.hp).toBe(Math.round(20 * (rungs ? SHELTER.taken : 1)));
    }
  });

  it('MENDING PARRY: a parry heals friends near', () => {
    for (const rungs of [1, 2]) {
      const { c, f, e } = party(rungs), ev: FightEvent[] = [];
      f.hp = 50;
      Object.assign(c, { blocking: false, parryOpenAt: 10, fy: -1 });
      hitHero(e, blow(e, 'cleric'), c, 10, ev, [c, f]);
      expect(ev.some((x) => x.k === 'parry')).toBe(true);
      expect(f.hp).toBe(rungs === 2 ? 50 + PARRY_MEND.heal : 50);
      expect(c.hp).toBe(HERO.hp);
    }
  });

  it('COVER: blocking beside a friend, facing the blow, the Healer takes it on the guard', () => {
    for (const rungs of [2, 3]) {
      const { c, f, e } = party(rungs), ev: FightEvent[] = [];
      expect(Math.hypot(c.x - f.x, c.y - f.y)).toBeLessThanOrEqual(COVER.reach);
      hitHero(e, blow(e, 'friend'), f, 10, ev, [c, f]);
      expect(f.hp === HERO.hp).toBe(rungs === 3);
      expect(c.stamina < HERO.stamina).toBe(rungs === 3);
      expect(ev.some((x) => x.k === 'coverfor')).toBe(rungs === 3);
    }
  });
});

describe('the Warrior: TAUNT', () => {
  it('the dodge press roars: goblins within 5 tiles come for you, drawn at that reach; again in 10 s; nothing without it', () => {
    for (const rungs of [0, 1]) {
      const w = hero('sword', rungs, 'me', 9, 9), friend = hero('wand', 0, 'friend', 12, 6), near = goblin(1, 12, 5.5), far = goblin(2, 9, 9 + TAUNT.reach + 1.5);
      const { room, run } = arena([w, friend], [near, far]);
      const ev = run(TICK * 2, { rollSeq: 1 });
      expect(near.tauntBy === 'me').toBe(rungs === 1);
      expect(far.tauntBy).toBeUndefined();
      // The goblin beside the friend still comes for the Warrior.
      expect(tauntTarget(near, room.heroes, room.time)?.id).toBe(rungs ? 'me' : undefined);
      const z = room.zones.find((q) => q.kind === 'taunt');
      expect(z?.r).toBe(rungs ? TAUNT.reach : undefined);
      expect(ev.some((x) => x.k === 'taunt')).toBe(rungs === 1);
      if (!rungs) continue;
      // Pressed again inside the cooldown: nothing; once it's back: again.
      const before = w.tauntReady!;
      run(1, { rollSeq: 2 });
      expect(w.tauntReady).toBe(before);
      run(TAUNT.cooldown, { rollSeq: 2 });
      run(TICK * 2, { rollSeq: 3 });
      expect(w.tauntReady!).toBeGreaterThan(before);
    }
  });

  it("a guest's press reaches the leader's room the same way (the rollSeq counter)", () => {
    const lead = hero('wand', 0, 'lead', 4, 4), guest = hero('greatsword', 1, 'guest', 9, 9), e = goblin(1, 10, 9);
    const { run } = arena([lead, guest], [e]);
    run(TICK * 2, { rollSeq: 7 }, 'guest');
    expect(e.tauntBy).toBe('guest');
  });

  it('STAND FAST: taunted goblins hit softer, and nothing shoves or staggers you while it lasts', () => {
    for (const rungs of [1, 2]) {
      const w = hero('sword', rungs, 'me', 9, 9), e = goblin(1, 9, 7.8);
      const { room, run } = arena([w], [e]);
      run(TICK * 2, { rollSeq: 1 });
      w.fy = 1; // facing away: the blow lands
      const ev: FightEvent[] = [];
      hitHero(e, blow(e, 'me'), w, room.time, ev, [w]);
      expect(HERO.hp - w.hp).toBe(rungs === 2 ? Math.round(20 * TAUNT.soft) : 20);
      expect(w.act === 'hurt').toBe(rungs === 1);
      expect(ev.some((x) => x.k === 'braced')).toBe(rungs === 2);
    }
  });

  it('COWING ROAR: the taunt staggers the small ones', () => {
    for (const rungs of [2, 3]) {
      const w = hero('sword', rungs), small = goblin(1, 10, 9), big = goblin(2, 8, 9, 'butcher');
      const { run } = arena([w], [small, big]);
      run(TICK * 2, { rollSeq: 1 });
      expect(small.act === 'flinch').toBe(rungs === 3);
      expect(big.act).not.toBe('flinch');
    }
  });
});
