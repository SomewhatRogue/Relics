// The boss kit (docs/plans/bosses.md section 1; shared/bosstune.ts): POISE and the stagger, the plate,
// BRACED (behind BOSS_FLAGS.braced), the late-press grace with and without a friend's lag (behind
// BOSS_FLAGS.grace, never stacking past LAGCOMP.cap), the sure chest and the relic it can give, and no
// new traffic a tick.
import { afterEach, describe, expect, it } from 'vitest';
import { BOSS, BOSS_FLAGS, BRACED_KIT, GRACE, LAGCOMP, POISE_KIT, TICK, WEAPONS, newProfile } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { begin } from '../src/sim/enemies';
import { hitEnemy } from '../src/sim/combat';
import { relicStun, stun } from '../src/sim/stuns';
import { doorShut } from '../src/sim/doorwall';
import { plateOf } from '../src/sim/bossplate';
import { bossRoll, bossGold, heroSeed } from '../src/sim/bosschest';
import { startChest } from '../src/sim/chests';
import { NO_INTENT, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { Encoder, stateOf } from '../src/client/snap';
import { keepKitNoting } from '../src/client/relicnews';
import { barn, blow, place, run, still, wake } from './bossarena';

const flags = { ...BOSS_FLAGS };
afterEach(() => Object.assign(BOSS_FLAGS, flags));
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };

/** The sword's blow from (x, y) at Hasp (stood at 6, 5 facing down), charged or not. */
function swing(b: ReturnType<typeof barn>, x: number, y: number, more: Partial<Hero> = {}): FightEvent[] {
  const h = b.heroes[0], ev: FightEvent[] = [];
  const l = Math.hypot(b.hasp.x - x, b.hasp.y - y);
  Object.assign(h, { x, y, fx: (b.hasp.x - x) / l, fy: (b.hasp.y - y) / l, hitIds: [], heavy: false, power: 0, perfect: false, ...more });
  hitEnemy(h, WEAPONS.sword.combo[0], b.hasp, b.room.time, ev);
  return ev;
}

describe('POISE', () => {
  it('a bar by party size: 1, 1.3, 1.6, 1.9 times', () => {
    expect([1, 2, 3, 4].map((n) => barn(Array(n).fill('sword')).hasp.boss!.poiseMax)).toEqual(POISE_KIT.party.map((k) => Math.round(POISE_KIT.bar * k)));
  });

  it('charged blows, backstabs and ambushes fill it (a plain tap does not); full, STAGGERED 2.5 s, door aside, the bar empty', () => {
    const b = barn(['sword']);
    wake(b);
    still(b.latch);
    place(b.hasp, 6, 5, 0, 1);
    swing(b, 6, 6.3);
    expect(b.hasp.boss!.poise).toBe(0);
    swing(b, 6, 6.3, { heavy: true, power: 1 });
    expect(b.hasp.boss!.poise).toBe(POISE_KIT.fill.charged);
    swing(b, 6, 3.7);
    expect(b.hasp.boss!.poise).toBe(POISE_KIT.fill.charged + POISE_KIT.fill.backstab);
    const ev: FightEvent[] = [];
    while (b.hasp.boss!.poise > 0 && !ev.some((e) => e.k === 'staggered')) ev.push(...swing(b, 6, 6.3, { heavy: true, power: 1 }));
    expect(ev.some((e) => e.k === 'staggered')).toBe(true);
    expect(b.hasp.boss!.poise).toBe(0);
    expect(b.hasp.act).toBe('stunned');
    expect(b.hasp.actDur).toBe(POISE_KIT.stagger);
    expect(doorShut(b.hasp, b.room.time)).toBe(false);
  });

  it('a hero\'s stun lands, then none for a while; a relic\'s still fills half the bar', () => {
    const b = barn(['sword']);
    wake(b);
    const ev: FightEvent[] = [];
    // (Kyle, 2026-11-11: a hero's own stun lands on a boss, then none for a while: sim/bosshold.ts.)
    expect(stun(b.hasp, 'p0', b.room.time, 1.5, ev)).toBe(true);
    expect(b.hasp.act).toBe('stunned');
    expect(stun(b.hasp, 'p1', b.room.time + 2, 1.5, ev)).toBe(false);
    relicStun(b.hasp, b.room.time, 1.3, ev);
    expect(b.hasp.boss!.poise).toBe(Math.round(b.hasp.boss!.poiseMax * POISE_KIT.relic));
  });
});

describe('the boss plate', () => {
  it('the pair: one name, a bar each with its name, POISE under each, two phase pips going to one', () => {
    const b = barn(['sword']);
    let p = plateOf(b.room.enemies, b.room.time)!;
    expect(p).toMatchObject({ name: 'THE DOORKEEPERS', pips: 2, lit: 2 });
    expect(p.bars.map((x) => x.name)).toEqual(['LATCH', 'HASP']);
    expect(p.bars.every((x) => x.poiseMax > 0 && x.hp === x.max)).toBe(true);
    Object.assign(b.latch, { hp: 0, act: 'dead' });
    wake(b);
    p = plateOf(b.room.enemies, b.room.time)!;
    expect(p.lit).toBe(1);
    expect(p.bars[0].dead).toBe(true);
    Object.assign(b.hasp, { hp: 0, act: 'dead' });
    expect(plateOf(b.room.enemies, b.room.time)).toBe(null);
  });

  it('any other named goblin: its name and one bar, as before', () => {
    const b = barn(['sword']);
    const e = { ...b.hasp, boss: undefined, name: 'SKARN', hp: 100, maxHp: 200 };
    expect(plateOf([e], 0)).toEqual({ name: 'SKARN', bars: [{ name: '', hp: 100, max: 200, poise: 0, poiseMax: 0, dead: false, staggered: false }], pips: 0, lit: 0 });
  });
});

describe('BRACED (BOSS_FLAGS.braced)', () => {
  /** A Warrior holding block under Hasp's sweep: where they end up, and what Hasp does. */
  function blocked() {
    const b = barn(['sword'], [[6, 6.7]]);
    wake(b);
    still(b.latch);
    place(b.hasp, 6, 5, 0, 1);
    blow(b.hasp, 'sweep', b.heroes[0]);
    const h = b.heroes[0], y0 = h.y, ev = run(b, 1.45, () => ({ block: true, ax: 0, ay: -1 }));
    return { b, h, ev, moved: Math.hypot(h.x - 6, h.y - y0) };
  }

  it("on by default for a boss's blows: the blocker isn't shoved, the boss rebounds 0.8 s and its POISE fills", () => {
    expect(BOSS_FLAGS.braced).toBe('boss');
    const r = blocked();
    expect(r.h.hp).toBe(r.h.maxHp);
    expect(r.ev.some((e) => e.k === 'rebound')).toBe(true);
    expect(r.moved).toBeLessThan(0.02);
    expect(r.b.hasp.boss!.poise).toBe(POISE_KIT.fill.braced);
    expect(r.b.hasp.act).toBe('stunned');
    expect(r.b.hasp.actDur).toBe(BRACED_KIT.rebound);
  });

  it("off: shoved back a little as ever, and no rebound", () => {
    BOSS_FLAGS.braced = 'off';
    const r = blocked();
    expect(r.h.hp).toBe(r.h.maxHp);
    expect(r.ev.some((e) => e.k === 'rebound')).toBe(false);
    expect(r.moved).toBeGreaterThan(0.05);
  });

  it("'all': nobody's blocked blow shoves the blocker, a plain goblin's too", () => {
    const shoved = () => {
      const b = barn(['sword'], [[6, 9]]);
      wake(b);
      still(b.latch), still(b.hasp);
      const g = b.room.addFoe('scrapper', 6, 8);
      Object.assign(g, { alert: true });
      begin(g, 'stab', { windup: 0.5, active: 0.1, recover: 0.5, dmg: 10, knock: 6, range: 1.6, arc: 70, unblockable: false }, b.heroes[0], []);
      g.cooldown = 99;
      run(b, 0.7, () => ({ block: true, ax: 0, ay: -1 }));
      return Math.hypot(b.heroes[0].x - 6, b.heroes[0].y - 9);
    };
    expect(shoved()).toBeGreaterThan(0.05);
    BOSS_FLAGS.braced = 'all';
    expect(shoved()).toBeLessThan(0.02);
  });
});

/**
 * Hasp's sweep on `who` (the leader's own hero, or a friend with `lag`), and a press `late` seconds after it
 * lands by their own screen (negative: before). A friend's Intents get here `lag` after their screen showed them.
 */
function graced(o: { lag?: number; late?: number; what: 'block' | 'roll'; flag?: boolean }) {
  BOSS_FLAGS.grace = o.flag ?? true;
  const kit = o.what === 'block' ? 'sword' : 'daggers', lag = o.lag ?? 0;
  const b = barn([kit], [[6, 6.9]]);
  wake(b);
  still(b.latch);
  place(b.hasp, 6, 5, 0, 1);
  const h = b.heroes[0];
  h.lag = lag;
  blow(b.hasp, 'sweep', h);
  const at = b.room.time + b.hasp.attack!.windup - TICK / 2, press = o.late === undefined ? Infinity : at + o.late;
  const say = (vt: number): Intent => {
    const on = vt >= press - 1e-9;
    return o.what === 'block' ? { ...NO_INTENT, block: on, blockSeq: on ? 1 : 0, ax: 0, ay: -1 } : { ...NO_INTENT, rollSeq: on ? 1 : 0, mx: on ? 1 : 0 };
  };
  let landedAt = -1, judged = -1;
  for (let k = 0; k < 70; k++) {
    // Their screen shows the room `lag` behind: what they send now carries that time.
    const vt = b.room.time - lag;
    b.room.setIntent(h.id, lag ? { ...say(vt), vt } : say(b.room.time));
    const hp = h.hp;
    b.room.step();
    if (b.room.events.some((e) => e.k === 'impact')) landedAt = b.room.time;
    if (judged < 0 && (h.hp < hp || b.room.events.some((e) => e.k === 'dodge' || e.k === 'block'))) judged = b.room.time;
  }
  return { hurt: h.hp < h.maxHp, landedAt, held: judged - landedAt };
}

describe('the late-press grace (BOSS_FLAGS.grace) and lag compensation', () => {
  it(`the leader's own hero: a block or a dodge up to ${GRACE.window} s late counts; later doesn't; nor with the flag off`, () => {
    expect(BOSS_FLAGS.grace).toBe(true);
    expect(graced({ what: 'block', late: 0.1 }).hurt).toBe(false);
    expect(graced({ what: 'roll', late: 0.1 }).hurt).toBe(false);
    expect(graced({ what: 'block', late: 0.25 }).hurt).toBe(true);
    expect(graced({ what: 'roll', late: 0.25 }).hurt).toBe(true);
    expect(graced({ what: 'block', late: 0.1, flag: false }).hurt).toBe(true);
    // On time it's judged the moment it lands, as ever; a blow nobody answers waits out the grace, no more.
    expect(graced({ what: 'block', late: -0.3 }).held).toBeLessThanOrEqual(TICK + 1e-6);
    expect(graced({ what: 'block' }).held).toBeLessThanOrEqual(GRACE.window + TICK + 1e-6);
  });

  it('a lagged friend (0.15 s): on time by their screen saves them, and so does a press up to the grace late', () => {
    expect(graced({ what: 'block', lag: 0.15, late: -0.05 }).hurt).toBe(false);
    expect(graced({ what: 'block', lag: 0.15, late: 0.1 }).hurt).toBe(false);
    expect(graced({ what: 'roll', lag: 0.15, late: 0.1 }).hurt).toBe(false);
    expect(graced({ what: 'block', lag: 0.15, late: 0.25 }).hurt).toBe(true);
  });

  it(`they never stack: the room holds a boss blow min(lag + ${GRACE.window}, ${Math.max(LAGCOMP.cap, GRACE.window)}) s at most`, () => {
    // 0.3 s of lag: only 0.05 s of grace is left under the cap; 0.1 s late no longer counts, on time still does.
    expect(graced({ what: 'block', lag: 0.3, late: 0.03 }).hurt).toBe(false);
    expect(graced({ what: 'block', lag: 0.3, late: 0.12 }).hurt).toBe(true);
    expect(graced({ what: 'block', lag: 0.3, late: -0.05 }).hurt).toBe(false);
    for (const lag of [0, 0.1, 0.2, 0.3, 0.5, 0.9]) expect(graced({ what: 'block', lag }).held).toBeLessThanOrEqual(Math.min(lag + GRACE.window, Math.max(LAGCOMP.cap, GRACE.window)) + TICK + 1e-6);
  });
});

describe('the sure chest', () => {
  it('chained till both are down; then each hero their own: one Forged or PRE-WAR piece, the gold in the pot, now and then a relic', () => {
    const b = barn(['sword', 'daggers'], [[6, 2.6], [6.8, 2.6]]);
    const c = b.room.chests[0], ev: FightEvent[] = [];
    expect(c.chained && c.boss !== undefined).toBe(true);
    startChest(c, b.heroes[0], b.room.heroes, b.room.enemies, new Rng(1), 0, ev);
    expect(ev.some((e) => e.k === 'chained')).toBe(true);
    for (const e of [b.latch, b.hasp]) Object.assign(e, { hp: 0, act: 'dead' });
    startChest(c, b.heroes[0], b.room.heroes, b.room.enemies, new Rng(1), 0, ev);
    expect(c.state).toBe('opening');
    for (const h of b.heroes) {
      expect(c.rolls[h.id]).toHaveLength(1);
      expect(['forged', 'tolmouth']).toContain(c.rolls[h.id][0].quality);
      expect(c.rolls[h.id][0]).toEqual(bossRoll(c.boss!, h).item);
    }
    const out = run(b, 1.4, () => ({}));
    expect(c.state).toBe('open');
    // (The pile is picked up at once by whoever's stood there: the party's pot.)
    const gold = bossGold(c.boss!);
    expect(out.reduce((n, e) => n + (e.k === 'gold' ? e.n : 0), 0) || b.room.pickups.find((p) => p.gold)?.gold).toBe(gold);
    expect(gold).toBeGreaterThanOrEqual(BOSS.chest.gold[0]);
    expect(gold).toBeLessThanOrEqual(BOSS.chest.gold[1]);
    expect(b.room.drops.filter((d) => d.owner).length).toBe(2);
  });

  it('rolled on each hero\'s own seed: PRE-WAR about 15%, a relic about 15%', () => {
    let pre = 0, relic = 0;
    const n = 600;
    for (let i = 0; i < n; i++) {
      const r = bossRoll(77, { id: 'h' + i, weapon: 'sword', found: [] });
      if (r.item.quality === 'tolmouth') pre++;
      if (r.relic) relic++;
    }
    expect(pre / n).toBeGreaterThan(0.1);
    expect(pre / n).toBeLessThan(0.2);
    expect(relic / n).toBeGreaterThan(0.1);
    expect(relic / n).toBeLessThan(0.2);
    expect(heroSeed(77, 'a')).not.toBe(heroSeed(77, 'b'));
  });

  it('a relic in it is the hero\'s the moment it opens: found, and the relic moment on their game', () => {
    // A hero id whose roll in this chest gives a relic.
    const b = barn(['sword'], [[6, 2.6]]), c = b.room.chests[0];
    let id = '';
    for (let i = 0; i < 200 && !id; i++) if (bossRoll(c.boss!, { id: 'p' + i, weapon: 'sword', found: [] }).relic) id = 'p' + i;
    expect(id).not.toBe('');
    const h = b.heroes[0];
    h.id = id;
    for (const e of [b.latch, b.hasp]) Object.assign(e, { hp: 0, act: 'dead' });
    startChest(c, h, b.room.heroes, b.room.enemies, new Rng(1), 0, []);
    const ev: FightEvent[] = [];
    for (let k = 0; k < 45; k++) b.room.setIntent(id, { ...NO_INTENT }), b.room.step(), ev.push(...b.room.events);
    expect(ev.some((e) => e.k === 'relicfound')).toBe(true);
    const relic = c.relics![id];
    expect(h.found!.map((r) => r.id)).toContain(relic.id);
    const k = keepKitNoting(newProfile('WARRIOR'), h, true);
    expect(k.news.map((x) => x.item.id)).toEqual([relic.id]);
  });
});

describe('online', () => {
  it('no new traffic a tick: the boss field goes out only when it changes', () => {
    const b = barn(['sword'], [[6, 12.6]]);
    const enc = new Encoder();
    enc.encode(stateOf(b.room), true);
    let carried = 0;
    // At their post, unaware: nothing about them changes.
    for (let k = 0; k < 60; k++) {
      b.room.step();
      const p = enc.encode(stateOf(b.room));
      if ((p.enemies?.u ?? []).some(([, d]) => 'boss' in d)) carried++;
    }
    expect(carried).toBe(0);
    // In a fight it goes out with a hit, a stagger, a swap: far fewer than the ticks.
    wake(b);
    let ticks = 0;
    for (let k = 0; k < 300; k++, ticks++) {
      b.heroes[0].hp = b.heroes[0].maxHp;
      b.room.step();
      const p = enc.encode(stateOf(b.room));
      if ((p.enemies?.u ?? []).some(([, d]) => 'boss' in d)) carried++;
    }
    expect(carried).toBeLessThan(ticks / 10);
  });
});
