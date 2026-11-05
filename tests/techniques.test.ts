/** The class techniques (shared/techniques.ts): taught in order, kept from old saves, and each one firing in the room. */
import { describe, expect, it } from 'vitest';
import { CHARGE, PARTY, TICK, WEAPONS, drillLevel, drillPrice, newProfile, type WeaponId } from '../src/shared/tuning';
import { AIM_DRIFT, CUTPURSE, JUDGEMENT, MENDING, QUICK_NOCK, SANCT_STEP, SHOULDER, TECHS, TECH_WORDS, knowsTech } from '../src/shared/techniques';
import { buyDrill, drillState, learnLesson } from '../src/shared/training';
import { trainerRows } from '../src/shared/trainrows';
import { Rng } from '../src/shared/rng';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { newHero, chargeFull } from '../src/sim/hero';
import { hitEnemy, hitHero } from '../src/sim/combat';
import { stepParty, startRaise } from '../src/sim/party';
import { stepSnare } from '../src/sim/ranger';
import { slamBurst, stride, primeShoulder } from '../src/sim/techwarrior';
import { backstabbed, rogueStruck } from '../src/sim/techrogue';
import { aimed, drift, nockHead, quickNock, catches } from '../src/sim/techranger';
import { followGround, stepGround } from '../src/sim/techcleric';
import type { World } from '../src/sim/elements';
import type { Pickup } from '../src/sim/pickups';
import { NO_INTENT, type Enemy, type EnemyAttack, type FightEvent, type Hero, type Zone } from '../src/sim/types';

/** A hero with `weapon` and technique rank `rank`, at (9, 9) facing up. */
const hero = (weapon: WeaponId, rank: number, id = 'me'): Hero => Object.assign(newHero(id, 9, 9), { weapon, fy: -1, fx: 0, drills: { technique: rank } });
const goblin = (id: number, x: number, y: number, kind: Enemy['kind'] = 'scrapper') =>
  Object.assign(newEnemy(id, kind, x, y), { hp: 400, maxHp: 400, alert: true, fx: 0, fy: 1, respawns: false, cooldown: 99 });
const world = (heroes: Hero[], enemies: Enemy[], now = 10, pickups: Pickup[] = [], seed = 3): World =>
  ({ heroes, enemies, javelins: [], props: [], now, ev: [], floor: { pickups, rng: new Rng(seed) } });
/** A goblin's blow at `aimed`, wound up and landing now. */
const blow = (e: Enemy, aimed: string, dy = 1): EnemyAttack => ({ kind: 'swing', aimed, t: 0.2, windup: 0.6, active: 0.1, recover: 0.3, dmg: 10, knock: 6, unblockable: false, dx: 0, dy, ox: e.x, oy: e.y, range: 2, arc: 90, cx: 0, cy: 0, radius: 0, done: false });

describe('techniques at the trainer', () => {
  it('three a class, the Mage too, taught at levels 4, 7 and 10 for rising gold', () => {
    for (const cls of ['WARRIOR', 'ROGUE', 'RANGER', 'HEALER', 'MAGE'] as const) {
      expect(TECHS[cls]).toHaveLength(3);
      expect([0, 1, 2].map((r) => drillLevel('technique', r, cls))).toEqual([4, 7, 10]);
    }
    expect(TECHS.MAGE).toEqual(['primed', 'attuned', 'spellthief']);
    expect(drillPrice('technique', 1)).toBeGreaterThan(drillPrice('technique', 0));
    expect(drillPrice('technique', 2)).toBeGreaterThan(drillPrice('technique', 1));
    for (const t of Object.values(TECH_WORDS)) expect(t.text).not.toMatch(/\u2014/);
  });

  it('a save with technique rank n knows the first n of its class, with any of the class weapons', () => {
    for (const [weapon, rank] of [['sword', 1], ['greatsword', 2], ['spear', 3]] as const) {
      const h = hero(weapon, rank);
      expect(TECHS.WARRIOR.map((t) => knowsTech(h, t))).toEqual([0, 1, 2].map((i) => i < rank));
    }
    expect(knowsTech(hero('rapier', 2), 'slip')).toBe(true);
    expect(knowsTech(hero('rapier', 2), 'cutpurse')).toBe(false);
    expect(knowsTech(hero('crossbow', 3), 'steady')).toBe(true);
    expect(knowsTech(hero('flail', 1), 'mending')).toBe(true);
    // Another class's technique is never known, and no drills is nothing.
    expect(knowsTech(hero('sword', 3), 'knifework')).toBe(false);
    expect(knowsTech(Object.assign(newHero('x', 0, 0), { weapon: 'sword' as WeaponId }), 'slam')).toBe(false);
    // A Mage with ranks keeps PRIMED SPELLS first (its old bump), then the new two.
    expect(TECHS.MAGE.map((t) => knowsTech(hero('wand', 1), t))).toEqual([true, false, false]);
    expect(knowsTech(hero('staff', 2), 'attuned')).toBe(true);
  });

  it('rows say learned, next (level and price) or locked; one bought at a time, in order', () => {
    const p = Object.assign(newProfile('WARRIOR'), { level: 7, gold: 5000, drills: { technique: 1 } });
    const rows = trainerRows(p).filter((r) => r.group === 'craft');
    expect(rows.map((r) => r.tech)).toEqual(['slam', 'shoulder', 'ironfeet']);
    expect(rows.map((r) => r.tag)).toEqual(['LEARNED', `${drillPrice('technique', 1)}g`, 'LEVEL 10']);
    expect(rows.map((r) => r.state)).toEqual(['max', 'buy', 'locked']);
    expect(rows[1].level).toBe(7);
    expect(buyDrill(p, 'technique')).toBe(true);
    expect(p.drills.technique).toBe(2);
    expect(drillState(p, 'technique')).toBe('locked');
    p.level = 10;
    const next = trainerRows(p).find((r) => r.tech === 'ironfeet')!;
    expect(next.state).toBe('buy');
    // At level 10 with none learned: the first is next, the rest wait on the one before.
    const fresh = trainerRows(Object.assign(newProfile('HEALER'), { level: 10, gold: 0 })).filter((r) => r.tech);
    expect(fresh.map((r) => r.state)).toEqual(['poor', 'needs', 'needs']);
    expect(fresh[2].needs).toBe('WALKING SANCTUARY');
    // The Mage's are three rows too, PRIMED SPELLS first.
    const mage = trainerRows(Object.assign(newProfile('MAGE'), { level: 10 })).filter((r) => r.group === 'craft');
    expect(mage.map((r) => r.id)).toEqual(['leave', 'primed', 'attuned', 'spellthief']);
    expect(mage.map((r) => r.name)).toEqual(['IMAGE ON THE BLINK', 'PRIMED SPELLS', 'ATTUNED', 'MAGIC BACK']);
  });

  it("a Ranger's first technique waits on the snare lesson", () => {
    const r = Object.assign(newProfile('RANGER'), { level: 5, gold: 1000 });
    expect(trainerRows(r).find((x) => x.tech === 'trapper')!.tag).toBe('NEEDS SNARE');
    expect(learnLesson(r, 'leave')).toBe(true);
    expect(buyDrill(r, 'technique')).toBe(true);
  });
});

describe('the Warrior', () => {
  it('SLAM bursts the small goblins right beside the one slammed, and nothing without it', () => {
    for (const rank of [0, 1]) {
      const e = goblin(1, 9, 8), near = goblin(2, 9.8, 8), far = goblin(3, 12, 8), big = goblin(4, 8.2, 8, 'butcher'), ev: FightEvent[] = [];
      slamBurst(hero('sword', rank), e, [e, near, far, big], 5, ev);
      expect(near.act === 'dead').toBe(rank === 1);
      expect(far.act).not.toBe('dead');
      expect(big.act).not.toBe('dead');
      expect(e.act).not.toBe('dead');
      if (rank) expect(near.death).toBe('burst'), expect(ev.some((x) => x.k === 'slamburst')).toBe(true);
    }
  });

  it('SHOULDER CHARGE: a second walking straight, then the next blow knocks the first goblin hit down', () => {
    for (const rank of [1, 2]) {
      const h = hero('sword', rank), e = goblin(1, 9, 8.1), ev: FightEvent[] = [];
      let t = 1;
      for (let i = 0; i < Math.ceil(SHOULDER.walk / TICK) + 2; i++) stride(h, 0, -1, 1, TICK, (t += TICK), ev);
      expect(ev.some((x) => x.k === 'shoulderready')).toBe(rank === 2);
      primeShoulder(h, t + 0.1);
      hitEnemy(h, WEAPONS.sword.combo[0], e, t + 0.1, ev);
      expect(e.act === 'stunned').toBe(rank === 2);
      // Spent on that goblin: the next one hit isn't.
      const o = goblin(2, 9.3, 8.1);
      hitEnemy(h, WEAPONS.sword.combo[0], o, t + 0.1, ev);
      expect(o.act).not.toBe('stunned');
    }
  });

  it('SHOULDER CHARGE lapses if you turn or stop', () => {
    const h = hero('spear', 2), ev: FightEvent[] = [];
    let t = 1;
    for (let i = 0; i < 20; i++) stride(h, 0, -1, 1, TICK, (t += TICK), ev);
    for (let i = 0; i < 20; i++) stride(h, 1, 0, 1, TICK, (t += TICK), ev);
    primeShoulder(h, t);
    expect(h.shoulder).toBe(false);
    for (let i = 0; i < 40; i++) stride(h, 1, 0, 1, TICK, (t += TICK), ev);
    primeShoulder(h, t + SHOULDER.grace + 0.1);
    expect(h.shoulder).toBe(false);
  });

  it('IRON FEET: holding an attack, a blow hurts but neither shoves nor staggers; without it, it does both', () => {
    for (const rank of [2, 3]) {
      const h = Object.assign(hero('greatsword', rank), { act: 'charge' as const, actT: 0.5, fx: 0, fy: 1 }), e = goblin(1, 9, 10), ev: FightEvent[] = [];
      hitHero(e, blow(e, 'me', -1), h, 5, ev);
      expect(h.hp).toBeLessThan(h.maxHp);
      expect(h.act).toBe(rank === 3 ? 'charge' : 'hurt');
      expect(Math.hypot(h.kvx, h.kvy) > 0).toBe(rank === 2);
      expect(ev.some((x) => x.k === 'ironfeet')).toBe(rank === 3);
    }
  });
});

describe('the Rogue', () => {
  it('KNIFEWORK: a backstab makes it bleed', () => {
    const h = hero('daggers', 1), e = goblin(1, 9, 8), w = world([h], [e]);
    backstabbed(h, e, w);
    expect(e.bleedUntil).toBeGreaterThan(w.now);
    expect(w.ev.some((x) => x.k === 'cutbleed')).toBe(true);
    const plain = goblin(2, 9, 8);
    backstabbed(hero('daggers', 0), plain, w);
    expect(plain.bleedUntil ?? 0).toBe(0);
  });

  it('a blade from behind is a backstab; from the front it is not', () => {
    const h = hero('daggers', 1), behind = goblin(1, 9, 8), w = world([h], [behind]);
    // The goblin at (9, 8) faces up, away from the hero at (9, 9).
    behind.fy = -1;
    rogueStruck(h, behind, w);
    expect(behind.bleedUntil).toBeGreaterThan(w.now);
    const front = goblin(2, 9, 8);
    rogueStruck(h, front, w);
    expect(front.bleedUntil ?? 0).toBe(0);
  });

  it('SLIP AWAY: a backstab kill hides you and drops a blow wound up at you', () => {
    const h = hero('rapier', 2), dead = Object.assign(goblin(1, 9, 8), { act: 'dead' as const, hp: 0 }), other = goblin(2, 10, 9), w = world([h], [dead, other]);
    other.attack = blow(other, 'me');
    backstabbed(h, dead, w);
    expect(h.vanishUntil).toBeCloseTo(w.now + 2);
    expect(other.attack).toBeNull();
    expect(w.ev.some((x) => x.k === 'slipaway')).toBe(true);
    // A backstab that doesn't kill hides nobody.
    const h2 = hero('rapier', 2);
    backstabbed(h2, goblin(3, 9, 8), w);
    expect(h2.vanishUntil ?? 0).toBe(0);
  });

  it('CUTPURSE: now and then a little gold, once a goblin, the same with the same seed', () => {
    const drop = (seed: number) => {
      const h = hero('poisoner', 3), pickups: Pickup[] = [], es = Array.from({ length: 200 }, (_, i) => goblin(i + 1, 9, 8)), w = world([h], es, 10, pickups, seed);
      for (const e of es) (backstabbed(h, e, w), backstabbed(h, e, w));
      return pickups.map((p) => p.gold!);
    };
    const golds = drop(7);
    expect(golds.length).toBeGreaterThan(200 * CUTPURSE.chance * 0.6);
    expect(golds.length).toBeLessThan(200 * CUTPURSE.chance * 1.4);
    expect(golds.every((g) => g >= CUTPURSE.min && g <= CUTPURSE.max)).toBe(true);
    expect(drop(7)).toEqual(golds);
    // Never off a training goblin, nor without the technique.
    const pickups: Pickup[] = [], w = world([], [], 10, pickups, 1);
    for (let i = 0; i < 50; i++) backstabbed(hero('daggers', 3), Object.assign(goblin(i, 9, 8), { respawns: true }), w);
    for (let i = 0; i < 50; i++) backstabbed(hero('daggers', 2), goblin(i, 9, 8), w);
    expect(pickups).toHaveLength(0);
  });
});

describe('the Ranger', () => {
  it('TRAPPER: a snare catches two goblins; without it, one', () => {
    for (const rank of [0, 1]) {
      const h = hero('shortbow', rank), a = goblin(1, 5, 5), b = goblin(2, 5.1, 5), ev: FightEvent[] = [];
      const s = { owner: h.id, x: 5, y: 5, until: 99, hold: 2, left: catches(h) };
      const set = stepSnare(s, [a, b], 1, ev);
      expect(set).toBe(rank === 1);
      if (set) stepSnare(s, [a, b], 1.1, ev);
      expect(ev.filter((x) => x.k === 'snared')).toHaveLength(rank ? 2 : 1);
      expect(b.snareUntil > 1).toBe(rank === 1);
    }
  });

  it('QUICK NOCK: a perfect shot ends at once and the next draw starts part drawn; a crossbow loads again', () => {
    const h = Object.assign(hero('longbow', 2), { perfect: true }), ev: FightEvent[] = [];
    quickNock(h, 5, ev);
    expect(h.nocked).toBe(true);
    const full = chargeFull(WEAPONS.longbow, h);
    expect(nockHead(h, full, 5.5)).toBeCloseTo((full - CHARGE.start) * QUICK_NOCK.head);
    expect(nockHead(h, full, 5.6)).toBe(0);
    const plain = Object.assign(hero('longbow', 1), { perfect: true });
    quickNock(plain, 5, ev);
    expect(plain.nocked).toBe(false);
    const xbow = Object.assign(hero('crossbow', 2), { perfect: true, xbowEmpty: true });
    quickNock(xbow, 5, ev);
    expect(xbow.xbowEmpty).toBe(false);
    expect(xbow.xbowGlint).toBe(false);
  });

  it('QUICK NOCK in the room: free right after a perfect longbow shot, not without it', () => {
    const freeAt = (rank: number) => {
      const room = new ArenaRoom(1, { scrappers: false, props: false });
      const h = Object.assign(room.join('me'), { weapon: 'longbow' as WeaponId, x: 9, y: 9, fx: 0, fy: -1, drills: { technique: rank } });
      room.enemies = [];
      const hold = chargeFull(WEAPONS.longbow, h) + 0.1;
      room.setIntent('me', { ...NO_INTENT, ay: -1, attackSeq: 1, attack: true });
      for (let i = 0; i < Math.round(hold / TICK); i++) room.step();
      room.setIntent('me', { ...NO_INTENT, ay: -1, attackSeq: 1, attack: false });
      let perfect = false;
      for (let i = 1; i < 60; i++) {
        room.step();
        perfect ||= room.events.some((x) => x.k === 'perfect');
        if (h.act === 'idle') return expect(perfect).toBe(true), i;
      }
      return 99;
    };
    expect(freeAt(2)).toBeLessThan(freeAt(1));
  });

  it('STEADY: a shot loosed on the move drifts off the aim, unless the Ranger is steady', () => {
    const t = Math.PI / 2 / AIM_DRIFT.sway, moving = { ...NO_INTENT, my: -1 };
    expect(Math.abs(drift(hero('longbow', 2), true, t))).toBeCloseTo(AIM_DRIFT.most);
    expect(drift(hero('longbow', 2), false, t)).toBe(0);
    expect(drift(hero('longbow', 3), true, t)).toBe(0);
    // The hook for the weather: wind pushes either way.
    expect(drift(hero('longbow', 3), true, t, 0.02)).toBeCloseTo(0.02);
    const ev: FightEvent[] = [], off = aimed(hero('shortbow', 2), 'arrow', moving, t, ev), on = aimed(hero('shortbow', 3), 'arrow', moving, t, ev);
    expect(off.fx).not.toBeCloseTo(0);
    expect(on.fx).toBe(0);
    expect(ev.filter((x) => x.k === 'steady')).toHaveLength(1);
    // Never a Ranger's sword, nor anyone else's shot.
    expect(aimed(hero('daggers', 3), 'knife', moving, t, ev).fx).toBe(0);
  });
});

describe('the Cleric', () => {
  const party = (rank: number) => {
    const c = Object.assign(hero('mace', rank, 'c'), { x: 5, y: 5 }), d = Object.assign(hero('sword', 0, 'd'), { x: 5.5, y: 5, act: 'down' as const, hp: 0, bleeding: true, actDur: Infinity });
    return { c, d, heroes: [c, d] };
  };

  it('MENDING HANDS: a friend comes up faster', () => {
    const ticks = (rank: number) => {
      const { c, d, heroes } = party(rank), ev: FightEvent[] = [];
      expect(startRaise(c, heroes, ev)).toBe(true);
      expect(ev.some((x) => x.k === 'mending')).toBe(rank > 0);
      for (let i = 1; i < 300; i++) {
        stepParty(heroes, TICK, ev);
        if (d.act !== 'down') return i;
      }
      return 999;
    };
    const plain = ticks(0), mended = ticks(1);
    expect(plain).toBeCloseTo(PARTY.pickUp / 2 / TICK, -1);
    expect(mended).toBeLessThanOrEqual(Math.ceil(plain / MENDING.rate) + 1);
  });

  it('SANCTUARY STEP: blessed ground moves with its Cleric a while, then stays', () => {
    for (const rank of [1, 2]) {
      const c = hero('censer', rank, 'c'), ev: FightEvent[] = [];
      const z: Zone = stepGround({ x: 10, y: 9, r: 2, until: 20, next: 0, owner: 'c', el: '' }, c, 1, ev);
      expect(ev.some((x) => x.k === 'sanctstep')).toBe(rank === 2);
      c.x = 12;
      followGround([z], [c], 2);
      expect(z.x).toBe(rank === 2 ? 13 : 10);
      c.x = 15;
      followGround([z], [c], 1 + SANCT_STEP.follow + 0.1);
      expect(z.x).toBe(rank === 2 ? 13 : 10);
    }
  });

  it("JUDGEMENT: a Cleric's blow on a goblin attacking a friend stuns it, once in the stun cap", () => {
    for (const rank of [2, 3]) {
      const c = hero('flail', rank, 'c'), e = goblin(1, 9, 8.2, 'butcher'), ev: FightEvent[] = [];
      e.attack = blow(e, 'friend');
      hitEnemy(c, WEAPONS.flail.combo[0], e, 5, ev);
      expect(e.act === 'stunned').toBe(rank === 3);
      if (rank === 3) expect(e.actDur).toBeCloseTo(JUDGEMENT.stun * JUDGEMENT.big), expect(ev.some((x) => x.k === 'judged')).toBe(true);
    }
    // At the Cleric themself: not a friend.
    const c = hero('mace', 3, 'c'), e = goblin(1, 9, 8.2, 'butcher'), ev: FightEvent[] = [];
    e.attack = blow(e, 'c');
    hitEnemy(c, WEAPONS.mace.combo[0], e, 5, ev);
    expect(e.act).not.toBe('stunned');
    // Stunned once: within 6 s the same Cleric's judgement is shrugged off.
    const f = goblin(2, 9, 8.2, 'butcher');
    f.attack = blow(f, 'friend');
    hitEnemy(c, WEAPONS.mace.combo[0], f, 5, ev);
    Object.assign(f, { act: 'chase', attack: blow(f, 'friend') });
    c.hitIds = [];
    hitEnemy(c, WEAPONS.mace.combo[0], f, 7, ev);
    expect(f.act).toBe('chase');
    expect(ev.some((x) => x.k === 'shrug')).toBe(true);
  });
});
