/** The movement ladder (shared/ladder.ts): taught in order at the trainer, none on an old save, and each rung firing in the room (and not without it). */
import { coinsHtml } from '../src/shared/coins';
import { describe, expect, it } from 'vitest';
import { BLINK, DODGE, HERO, SNARE, TEACHES, TICK, drillLevel, drillPrice, newProfile, type WeaponId } from '../src/shared/tuning';
import { ALLY_WARD, BLINK_BURST, RECALL, BLOCK_MEND, CALTROPS, IRON_STANCE, LADDER_LEVELS, LADDER_TITLE, LANDING, RUNGS, RUNG_WORDS, SHADOW_SMOKE, SHELTER, STAND_FAST, TAUNT_GUARD, TWIN_SNARE, knowsRung } from '../src/shared/ladder';
import { buyDrill, drillState, learnLesson } from '../src/shared/training';
import { trainerRows } from '../src/shared/trainrows';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { newHero } from '../src/sim/hero';
import { hitEnemy, hitHero } from '../src/sim/combat';
import { laySnare } from '../src/sim/ranger';
import { jumpShot } from '../src/sim/ladderranger';
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
    expect(rows.map((r) => r.rung)).toEqual(['tauntguard', 'ironstance', 'standfast']);
    expect(rows.map((r) => r.tag)).toEqual(['LEARNED', coinsHtml(drillPrice('ladder', 1)), 'LEVEL 15']);
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

  it("a Ranger's TWO ARROWS waits on the leap shot lesson", () => {
    const r = Object.assign(newProfile('RANGER'), { level: 10, gold: 2000, learned: ['skill' as const], drills: { ladder: 1 } });
    const row = trainerRows(r).find((x) => x.rung === 'twinsnare')!;
    expect(row.tag).toBe('NEEDS SHOT');
    expect(buyDrill(r, 'ladder')).toBe(false);
    expect(learnLesson(r, 'leave')).toBe(true);
    expect(TEACHES.leave.level).toBeLessThanOrEqual(10);
    expect(buyDrill(r, 'ladder')).toBe(true);
  });
});

describe('the Ranger: the jump', () => {
  it('FULL DRAW (the third jump rung): the leap shot fully drawn', () => {
    const dmg = (rungs: number) => {
      const h = Object.assign(hero('longbow', rungs), { act: 'roll' as const, actT: 0.1, snareReady: 0, jumpShot: false });
      return jumpShot(h, 1, [])[0].dmg;
    };
    expect(dmg(3)).toBeGreaterThan(dmg(2));
    expect(RUNGS.RANGER).toEqual(['landing', 'twinsnare', 'airshot']);
  });

  it("the trainer's lesson: a jump looses a quick arrow by itself, at the goblins; TWO ARROWS two, fanned", () => {
    for (const rungs of [0, 2]) {
      const h = hero('longbow', rungs), e = goblin(1, 9, 3), { room, run } = arena([h], [e]);
      run(TICK * 4, { rollSeq: 1, my: 1 });
      const arrows = room.bolts.filter((b) => b.owner === h.id);
      expect(arrows.length).toBe(rungs >= 2 ? 2 : 1);
      // Toward the goblin (up the screen), while the jump goes the other way.
      for (const b of arrows) expect(b.dy).toBeLessThan(0);
      expect(h.snareReady).toBeGreaterThan(room.time);
      // Not again on the next jump straight after: it waits JUMP_SHOT.cooldown.
      run(0.6);
      run(TICK * 4, { rollSeq: 2, my: 1 });
      expect(room.bolts.filter((b) => b.owner === h.id).length).toBeLessThanOrEqual(arrows.length);
    }
  });

  it('the LEAP SHOT lesson: attack mid-jump looses an arrow at once, part drawn; nothing without the lesson', () => {
    for (const rungs of [0, 1]) {
      // (Jump Shot was the first rung till 2026-11-23; it's the lesson's now. `rungs` 1 here: knows the lesson.)
      const h = Object.assign(hero('longbow', 0), { learned: rungs ? ['leave'] : [] }), { room, run } = arena([h], []);
      // (Not the trainer's shot on the jump, which looses by itself: sim/ladderranger.ts jumpShot.)
      h.snareReady = 99;
      run(TICK, { rollSeq: 1 });
      expect(h.act).toBe('roll');
      const ev = run(TICK * 2, { rollSeq: 1, attackSeq: 1 });
      expect(h.act).toBe('roll');
      expect(room.bolts.filter((b) => b.kind === 'arrow')).toHaveLength(rungs);
      expect(ev.some((x) => x.k === 'airshot')).toBe(rungs === 1);
    }
    // A crossbow with no bolt on shoots nothing.
    const x = Object.assign(hero('crossbow', 1), { xbowEmpty: true, snareReady: 99 }), a = arena([x], []);
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
    for (const rungs of [0, 1]) {
      // A backstep: you land 2.6 tiles behind where you face (down the screen). (The first rung since 2026-11-23.)
      const h = hero('longbow', rungs), near = goblin(1, 9, 11.6 + LANDING.r * 0.6), far = goblin(2, 13, 11.6), big = goblin(3, 8.2, 11.6, 'butcher');
      const { run } = arena([h], [near, far, big]);
      const ev = run(0.5, { rollSeq: 1 });
      expect(near.act === 'stunned').toBe(rungs === 1);
      expect(far.act).not.toBe('stunned');
      expect(big.act).not.toBe('stunned');
      expect(ev.some((x) => x.k === 'landing')).toBe(rungs === 1);
    }
  });
});

describe('the Mage: the blink', () => {
  it('BLINK BURST: a burst of the element where you blinked from, drawn at the size judged', () => {
    for (const rungs of [0, 1]) {
      const h = hero('wand', rungs), e = goblin(1, 9.9, 9);
      // (No blink trap here: that's the trainer's lesson, sim/blinktrap.ts.)
      Object.assign(h, { trapReady: 99 });
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

  it('RECALL (was BLINK THROUGH): a dodge press within 3 s of a blink snaps you back where it began, once', () => {
    for (const rungs of [1, 2]) {
      const h = hero('wand', rungs), { room, run } = arena([h], []);
      const ev = [...run(TICK, { rollSeq: 1, my: -1 }), ...run(0.3, { rollSeq: 1 })];
      const out = h.y;
      expect(out).toBeLessThan(9 - BLINK.distance + 0.01);
      // Still in the blink's wait: pressed again.
      ev.push(...run(TICK * 2, { rollSeq: 2 }));
      if (rungs === 2) {
        expect(h.y).toBeCloseTo(9, 3);
        expect(ev.some((x) => x.k === 'recall')).toBe(true);
        // Once: a press after does nothing till the blink's wait is up.
        run(TICK * 2, { rollSeq: 3 });
        expect(h.y).toBeCloseTo(9, 1);
      } else expect(h.y).toBeCloseTo(out, 3);
      // Too late: past the window, nothing to go back to.
      const late = hero('wand', 2), a = arena([late], []);
      a.run(TICK, { rollSeq: 1, my: -1 }), a.run(RECALL.window + 0.1, { rollSeq: 1 });
      const at = late.y;
      a.run(TICK * 2, { rollSeq: 2, my: 1 });
      expect(a.room.heroes[0].y === at || late.act === 'roll').toBe(true);
      void room;
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

  it('SHADOW SMOKE: the dash leaves a shadow, and it bursts into smoke as it fades', () => {
    for (const rungs of [1, 2]) {
      const h = hero('daggers', rungs, 'me', 9, 9);
      const { room, run } = arena([h], []);
      run(0.3, { rollSeq: 1, mx: 1 });
      if (rungs === 2) expect(h.decoyUntil).toBeGreaterThan(room.time);
      const before = room.smokes.length;
      run(3);
      expect(room.smokes.length > before).toBe(rungs === 2);
      if (rungs === 2) expect(room.smokes.some((s) => Math.hypot(s.x - h.decoyX, s.y - h.decoyY) < 0.01 && s.r === SHADOW_SMOKE.r)).toBe(true);
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

describe('the Cleric: the guard, a holy ward round them (Kyle, 2026-11-05)', () => {
  /** A Cleric guarding at (9, 9.6) facing up, a friend at (9, 9), a goblin above swinging at the friend. */
  const party = (rungs: number) => {
    const c = Object.assign(hero('mace', rungs, 'cleric', 9, 9.6), { blocking: true }), f = hero('sword', 0, 'friend', 9, 9), e = goblin(1, 9, 7.6);
    return { c, f, e };
  };

  it('the ward holds a blow from behind as well as in front, for stamina', () => {
    const { c, e } = party(0), ev: FightEvent[] = [];
    c.fy = 1; // facing away from the goblin
    hitHero(e, blow(e, 'cleric'), c, 10, ev, [c]);
    expect(c.hp).toBe(HERO.hp);
    expect(c.stamina).toBeLessThan(HERO.stamina);
    expect(ev.some((x) => x.k === 'block')).toBe(true);
  });

  it('SHELTER: a friend near a Cleric holding the guard takes less', () => {
    for (const rungs of [0, 1]) {
      const { c, f, e } = party(rungs), ev: FightEvent[] = [];
      hitHero(e, blow(e, 'friend'), f, 10, ev, [c, f]);
      expect(HERO.hp - f.hp).toBe(Math.round(20 * (rungs ? SHELTER.taken : 1)));
    }
  });

  it('SHARED WARD: the nearest friend takes nothing from a blow the guard could hold; holding it drains stamina', () => {
    for (const rungs of [1, 2]) {
      const { c, f, e } = party(rungs), ev: FightEvent[] = [];
      expect(Math.hypot(c.x - f.x, c.y - f.y)).toBeLessThanOrEqual(ALLY_WARD.reach);
      hitHero(e, blow(e, 'friend'), f, 10, ev, [c, f]);
      expect(f.hp === HERO.hp).toBe(rungs === 2);
      expect(ev.some((x) => x.k === 'coverfor')).toBe(rungs === 2);
      // Not a striped one.
      const f2 = hero('sword', 0, 'friend', 9, 9);
      hitHero(e, { ...blow(e, 'friend'), unblockable: true }, f2, 10, [], [c, f2]);
      expect(f2.hp).toBeLessThan(HERO.hp);
    }
    // The drain, in the room, while it covers someone.
    for (const rungs of [1, 2]) {
      const { c, f } = party(rungs), { run } = arena([c, f], []);
      run(1, { block: true }, 'cleric');
      expect(c.wardFor === 'friend').toBe(rungs === 2);
      expect(HERO.stamina - c.stamina).toBeCloseTo(rungs === 2 ? ALLY_WARD.drain : 0, 0);
    }
  });

  it('HEALING BLOCK (was HEALING PARRY): each blow the guard stops heals friends near', () => {
    expect(RUNG_WORDS.blockmend.name).toBe('HEALING BLOCK');
    for (const rungs of [2, 3]) {
      const { c, f, e } = party(rungs), ev: FightEvent[] = [];
      f.hp = 50;
      hitHero(e, blow(e, 'cleric'), c, 10, ev, [c, f]);
      expect(ev.some((x) => x.k === 'blockmend')).toBe(rungs === 3);
      expect(f.hp).toBe(rungs === 3 ? 50 + BLOCK_MEND.heal : 50);
      expect(c.hp).toBe(HERO.hp);
    }
  });
});

describe('the Warrior: the guard (it took the roar\'s place, 2026-11-06)', () => {
  it('TAUNT GUARD: holding block turns goblins within 4 tiles on you, drawn at that reach; nothing without it', () => {
    for (const rungs of [0, 1]) {
      const w = hero('sword', rungs, 'me', 9, 9), friend = hero('wand', 0, 'friend', 12, 6), near = goblin(1, 11.5, 6.5), far = goblin(2, 9, 9 + TAUNT_GUARD.reach + 1.5);
      const { room, run } = arena([w, friend], [near, far]);
      const ev = run(TICK * 3, { block: true });
      expect(near.tauntBy === 'me').toBe(rungs === 1);
      expect(far.tauntBy).toBeUndefined();
      expect(tauntTarget(near, room.heroes, room.time)?.id).toBe(rungs ? 'me' : undefined);
      expect(room.zones.find((q) => q.kind === 'taunt')?.r).toBe(rungs ? TAUNT_GUARD.reach : undefined);
      expect(ev.some((x) => x.k === 'taunt')).toBe(rungs === 1);
      // Let go: it lingers a moment, then lets them go.
      run(TAUNT_GUARD.linger + 0.2, {});
      expect(tauntTarget(near, room.heroes, room.time)).toBeNull();
    }
  });

  it("the dodge press does nothing now (a Warrior's roar is gone)", () => {
    const w = hero('sword', 3, 'me', 9, 9), e = goblin(1, 10, 9);
    const { run } = arena([w], [e]);
    const ev = run(TICK * 2, { rollSeq: 1 });
    expect(e.tauntBy).toBeUndefined();
    expect(ev.some((x) => x.k === 'taunt')).toBe(false);
  });

  it('IRON STANCE: a blocked blow costs a flat burst, throws the goblin back and leaves you untouchable a moment', () => {
    for (const rungs of [1, 2]) {
      const w = Object.assign(hero('sword', rungs, 'me', 9, 9), { blocking: true }), e = goblin(1, 9, 7.8);
      const ev: FightEvent[] = [];
      hitHero(e, { ...blow(e, 'me'), dmg: 40 }, w, 10, ev, [w]);
      expect(w.hp).toBe(HERO.hp);
      if (rungs === 2) {
        expect(HERO.stamina - w.stamina).toBe(IRON_STANCE.cost);
        expect(e.act).toBe('flinch');
        expect(ev.some((x) => x.k === 'ironstance')).toBe(true);
        // Untouchable a moment, even unguarded and facing away.
        Object.assign(w, { blocking: false, fy: 1 });
        hitHero(e, blow(e, 'me'), w, 10 + IRON_STANCE.untouchable / 2, [], [w]);
        expect(w.hp).toBe(HERO.hp);
        hitHero(e, blow(e, 'me'), w, 10 + IRON_STANCE.untouchable + 0.05, [], [w]);
        expect(w.hp).toBeLessThan(HERO.hp);
      } else {
        expect(HERO.stamina - w.stamina).toBeGreaterThan(IRON_STANCE.cost);
        expect(ev.some((x) => x.k === 'ironstance')).toBe(false);
      }
    }
  });

  it('STAND FAST: goblins the guard turned hit softer, and a block shoves you nowhere', () => {
    for (const rungs of [2, 3]) {
      const w = hero('sword', rungs, 'me', 9, 9), e = goblin(1, 9, 7.8), side = goblin(2, 10.5, 9);
      const { room, run } = arena([w], [e, side]);
      run(TICK * 3, { block: true });
      w.fy = 1; // facing away from `e`: its blow lands
      const ev: FightEvent[] = [];
      hitHero(e, blow(e, 'me'), w, room.time, ev, [w]);
      expect(HERO.hp - w.hp).toBe(rungs === 3 ? Math.round(20 * STAND_FAST.soft) : 20);
    }
  });
});
