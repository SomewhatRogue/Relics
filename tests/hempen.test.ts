// Hempen in the boss format (docs/plans/bosses.md "Hempen, brought into the format", rollout item 5;
// numbers shared/hangtune.ts HEMPEN_BOSS): each move lands, is blocked or dodged as its colour says (red
// blocked or dodged, striped walked out of or dodged); the haul and its answers; the trunks; the rope on a
// second hero; POISE and the stagger; the phases and the plate; the sure chest and the relic beside the
// wood's own; party scaling; fair on a phone; its ground; determinism and no traffic a tick; clear times.
import { afterEach, describe, expect, it } from 'vitest';
import { hangmansWood } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import { SPINE } from '../src/shared/hangwood';
import { FOUND_RELICS } from '../src/shared/magic';
import { BOSS, HEMPEN, HEMPEN_BOSS, HERO, POISE_KIT, TICK, WEAPONS, type HempenMove, type WeaponId } from '../src/shared/tuning';
import { wonRelics } from '../src/shared/relicaward';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { clocked, useBook } from '../src/sim/bosskit';
import { bossRoll } from '../src/sim/bosschest';
import { plateOf } from '../src/sim/bossplate';
import { hitEnemy } from '../src/sim/combat';
import { isDead } from '../src/sim/damage';
import { expedRoom } from '../src/sim/expedroom';
import { hempenBegin as begin0, hempenRotation, ropeReach } from '../src/sim/hempenboss';
import { hoist } from '../src/sim/snares';
import { stun, mayStun, relicStun } from '../src/sim/stuns';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type Enemy, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { hempenClear } from './bossbot';

const HM = SPINE.hempen;
/** Hempen begins `move` at `t` as its own turn would, with the room's notes on it in use (the split). */
const hempenBegin = (e: Enemy, move: HempenMove, t: Hero, heroes: Hero[], now: number, ev: FightEvent[], room = rooms.get(e)) => {
  useBook(room?.bosses ?? null);
  try {
    return begin0(e, move, t, heroes, now, ev);
  } finally {
    useBook(null);
  }
};
const rooms = new WeakMap<Enemy, ArenaRoom>();
interface Ground { room: ArenaRoom; hm: Enemy; heroes: Hero[] }

/** Hempen's ground on `day` for `kits` players at (dx, dy) from its middle; Hempen alone at the middle, awake. */
function ground(kits: WeaponId[] = ['sword'], at: [number, number][] = [[0, 2]], day = 3, keep: (e: Enemy) => boolean = (e) => !!e.boss): Ground {
  const room = expedRoom(hangmansWood(day), kits.length);
  room.dread = null;
  room.enemies = room.enemies.filter(keep);
  const hm = room.enemies.find((e) => e.boss)!;
  rooms.set(hm, room);
  const heroes = kits.map((k, i) => {
    const h = room.join('p' + i), [dx, dy] = at[i] ?? [i, 2];
    return Object.assign(h, { weapon: k, safeT: 0, x: HM.x + dx, y: HM.y + dy, fx: 0, fy: -1 });
  });
  Object.assign(hm, { x: HM.x, y: HM.y, alert: true, fx: 0, fy: 1, snareAt: 0 });
  room.step();
  return { room, hm, heroes };
}

/** Step `secs`, each hero's Intent from `say`. */
function run(g: Ground, secs: number, say: (h: Hero, t: number) => Partial<Intent> = () => ({})): FightEvent[] {
  const out: FightEvent[] = [], t0 = g.room.time;
  while (g.room.time < t0 + secs - 1e-9) {
    for (const h of g.heroes) g.room.setIntent(h.id, { ...NO_INTENT, ...say(h, g.room.time - t0) });
    g.room.step();
    out.push(...g.room.events);
  }
  return out;
}

const SPECS: Record<HempenMove, typeof HEMPEN_BOSS.cleave> = { noose: HEMPEN_BOSS.noose, haul: HEMPEN_BOSS.haul, cleave: HEMPEN_BOSS.cleave, slam: HEMPEN_BOSS.slam, rain: HEMPEN_BOSS.rain };
const wind = (m: HempenMove) => SPECS[m].windup + BOSS.tell;
const hurt = (h: Hero) => h.hp < h.maxHp;
const has = (ev: FightEvent[], k: string) => ev.some((e) => e.k === k);

describe("each of Hempen's moves: lands, blocked or dodged as its colour says", () => {
  /** Hempen begins `move` at the one hero, `dy` south of it; the hero does `say`. */
  function one(move: HempenMove, kit: WeaponId, dy: number, say: (h: Hero, t: number) => Partial<Intent> = () => ({})) {
    const g = ground([kit], [[0, dy]]);
    hempenBegin(g.hm, move, g.heroes[0], g.heroes, g.room.time, []);
    const ev = run(g, wind(move) + 0.3, say);
    return { g, h: g.heroes[0], ev };
  }
  const near = (m: HempenMove) => (m === 'noose' ? 4 : m === 'slam' ? 1.8 : 2);
  const land = (m: HempenMove) => one(m, 'sword', near(m));
  const block = (m: HempenMove) => one(m, 'sword', near(m), () => ({ block: true, ax: 0, ay: -1 }));
  const dodge = (m: HempenMove) => one(m, 'daggers', near(m), (_h, t) => (t >= wind(m) - 0.08 ? { mx: 1, my: 0, rollSeq: 1 } : {}));
  const walkOut = (m: HempenMove) => one(m, 'sword', near(m), () => (m === 'slam' ? { mx: 1, my: 0.6 } : { mx: 1, my: 0 }));

  it('the cleave (red): lands; a held block takes it, BRACED (it rebounds, POISE fills); a dodge goes through', () => {
    expect(hurt(land('cleave').h)).toBe(true);
    const b = block('cleave');
    expect(hurt(b.h)).toBe(false);
    expect([has(b.ev, 'block'), has(b.ev, 'rebound')]).toEqual([true, true]);
    expect(b.g.hm.boss!.poise).toBe(POISE_KIT.fill.braced);
    const d = dodge('cleave');
    expect([hurt(d.h), has(d.ev, 'dodge')]).toEqual([false, true]);
  });

  it('the noose (red, a thin lane): lands and hoists; a block takes it; a dodge out of the lane does too', () => {
    expect(land('noose').h.hoisted).toBe(true);
    const b = block('noose');
    expect([b.h.hoisted ?? false, has(b.ev, 'block')]).toEqual([false, true]);
    const d = dodge('noose');
    expect([d.h.hoisted ?? false, has(d.ev, 'dodge')]).toEqual([false, true]);
    expect(walkOut('noose').h.hoisted ?? false).toBe(false);
  });

  for (const m of ['slam', 'rain'] as HempenMove[]) {
    it(`the ${m} (striped): lands; a block doesn't save you; walked out of, or a dodger dodges`, () => {
      expect(hurt(land(m).h)).toBe(true);
      expect(hurt(block(m).h)).toBe(true);
      expect(hurt(walkOut(m).h)).toBe(false);
      expect(hurt(dodge(m).h)).toBe(false);
    });
  }

  it('Rope Rain falls where its hero stood as it began, and stays there', () => {
    const g = ground(['sword'], [[-1, 3]]), h = g.heroes[0];
    hempenBegin(g.hm, 'rain', h, g.heroes, g.room.time, []);
    const a = g.hm.attack!;
    expect([a.cx, a.cy]).toEqual([h.x, h.y]);
    run(g, 0.8, () => ({ mx: 1, my: 0 }));
    expect([g.hm.attack!.cx, g.hm.attack!.cy]).toEqual([a.cx, a.cy]);
    expect(Math.hypot(a.cx - HM.x + 1, a.cy - HM.y - 3)).toBeLessThan(0.05);
  });
});

describe('the haul: at a hoisted hero, down its rope', () => {
  /** A hero hoisted 4 south of Hempen; a friend (if any) does `say`. */
  function haul(friend: [number, number] | null, say: (h: Hero, t: number) => Partial<Intent> = () => ({})) {
    const g = ground(friend ? ['daggers', 'sword'] : ['daggers'], friend ? [[0, 4], friend] : [[0, 4]]), [h] = g.heroes;
    hoist(h, g.room.time, []);
    g.room.bosses!.split = null;
    // (Its first blow 0.6 s after it's seen you, then the haul's wind-up.)
    const ev = run(g, 0.6 + wind('haul') + 0.4, (o, t) => (o === h ? {} : say(o, t)));
    return { g, h, ev };
  }

  it("left alone, Hempen hauls the hoisted hero in to its feet, out of the snare, held a moment", () => {
    const { g, h, ev } = haul(null);
    expect(ev.some((e) => e.k === 'windup' && (e as { kind?: string }).kind === 'hook')).toBe(true);
    expect(Math.hypot(h.x - g.hm.x, h.y - g.hm.y)).toBeLessThan(HEMPEN_BOSS.pull.to + 0.6);
    expect(h.hoisted ?? false).toBe(false);
    expect(hurt(h)).toBe(true);
  });

  it('CUT FREE first: the rope comes back empty and Hempen stands open', () => {
    const { g, h, ev } = haul([0.6, 4], (_o, t) => (t > 1.1 ? { grabSeq: 1 } : {}));
    expect(has(ev, 'cutdown')).toBe(true);
    expect(Math.hypot(h.x - HM.x, h.y - HM.y)).toBeGreaterThan(3);
    expect(ev.some((e) => e.k === 'stunned')).toBe(true);
    expect(hurt(h)).toBe(false);
    void g;
  });

  it('a friend standing in front: the rope ends at them, and their block takes it (BRACED)', () => {
    const { g, h, ev } = haul([0, 2], () => ({ block: true, ax: 0, ay: -1 }));
    expect(has(ev, 'block')).toBe(true);
    expect(h.hoisted).toBe(true);
    expect(Math.hypot(h.x - HM.x, h.y - HM.y)).toBeGreaterThan(3);
    expect(hurt(g.heroes[1])).toBe(false);
  });
});

describe('the trunks stop a rope', () => {
  it('a hero behind a trunk is out of the noose: its lane ends at the trunk, and it does not throw at them', () => {
    const [tx, ty] = HEMPEN_BOSS.trunks[0], g = ground(['sword'], [[tx + 1.6, ty]]), h = g.heroes[0];
    Object.assign(g.hm, { x: HM.x + tx - 3, y: HM.y + ty, fx: 1, fy: 0 });
    const reach = ropeReach({ ox: g.hm.x, oy: g.hm.y, dx: 1, dy: 0, arc: 2, aimed: h.id }, g.heroes, 6);
    expect(reach).toBeCloseTo(3 - HEMPEN_BOSS.trunk, 1);
    g.hm.snareAt = -99;
    const ev = run(g, TICK * 3);
    expect(ev.some((e) => e.k === 'noosed')).toBe(false);
    hempenBegin(g.hm, 'noose', h, g.heroes, g.room.time, []);
    run(g, wind('noose') + 0.2);
    expect(h.hoisted ?? false).toBe(false);
  });

  it('the four trunks stand on its ground (and are left out with the switch off)', () => {
    const p = expedPlan(hangmansWood(3));
    for (const [dx, dy] of HEMPEN_BOSS.trunks) expect(p.map.rounds.some((o) => o.kind === 'tree' && Math.hypot(o.x - HM.x - dx, o.y - HM.y - dy) < 0.01)).toBe(true);
  });
});

describe('a party: the rope out of the branches on a second hero', () => {
  function two(say: (h: Hero, t: number) => Partial<Intent>, kit: WeaponId = 'sword') {
    const g = ground(['sword', kit], [[0, 2], [3, 1]]), [a, b] = g.heroes;
    hempenBegin(g.hm, 'cleave', a, g.heroes, g.room.time, []);
    const ev = run(g, HEMPEN_BOSS.split + BOSS.tell + HEMPEN_BOSS.rope.fall + 0.3, (h, t) => (h === b ? say(h, t) : { block: true, ax: 0, ay: -1 }));
    return { g, a, b, ev };
  }
  it('0.6 s after a blow begins, a striped circle comes down on the other hero: it lands, a block does not save you, walking out or a dodge does', () => {
    const { g, b } = two(() => ({}));
    expect(hurt(b)).toBe(true);
    void g;
    expect(hurt(two(() => ({ block: true, ax: -1, ay: 0 })).b)).toBe(true);
    expect(hurt(two((_h, t) => (t > HEMPEN_BOSS.split + 0.3 ? { mx: 1, my: 0 } : {})).b)).toBe(false);
    const fall = HEMPEN_BOSS.split + BOSS.tell + HEMPEN_BOSS.rope.fall;
    expect(hurt(two((_h, t) => (t >= fall - 0.1 ? { mx: 1, my: 0, rollSeq: 1 } : {}), 'daggers').b)).toBe(false);
  });

  it('one clock a hero: while the rope comes down on them, it counts as a boss blow aimed at them; solo there is none', () => {
    const g = ground(['sword', 'sword'], [[0, 2], [3, 1]]), [a, b] = g.heroes;
    hempenBegin(g.hm, 'cleave', a, g.heroes, g.room.time, []);
    run(g, HEMPEN_BOSS.split + TICK * 2, () => ({ block: true, ax: 0, ay: -1 }));
    expect(g.hm.boss!.ropes!.map((r) => r.on)).toEqual([b.id]);
    expect(clocked(b.id, g.room.enemies)).toBe(true);
    const solo = ground(['sword']);
    hempenBegin(solo.hm, 'cleave', solo.heroes[0], solo.heroes, solo.room.time, []);
    run(solo, 1);
    expect(solo.hm.boss!.ropes ?? []).toEqual([]);
  });
});

describe('POISE and the stagger', () => {
  it('a hero`s stun lands once, then none for a while; charged blows fill the bar, and full it is STAGGERED 2.5 s; a relic stun lands and fills half', () => {
    const g = ground(['sword'], [[0, 1.2]]), h = g.heroes[0], hm = g.hm, ev: FightEvent[] = [];
    // (Kyle, 2026-11-11: a hero's own stun lands on a boss, then none for a while: sim/bosshold.ts.)
    expect(stun(hm, h.id, g.room.time, 1, ev)).toBe(true);
    expect(mayStun(hm, 'other', g.room.time + 2, ev)).toBe(false);
    Object.assign(hm, { act: 'chase', actT: 0, holdUntil: 0, thawUntil: 0 });
    Object.assign(hm, { cooldown: 99 });
    const n = Math.ceil(POISE_KIT.bar / POISE_KIT.fill.charged);
    for (let i = 0; i < n; i++) {
      Object.assign(h, { x: HM.x, y: HM.y + 1.2, fx: 0, fy: -1, hitIds: [], heavy: true, power: 1 });
      hitEnemy(h, WEAPONS.sword.combo[0], hm, g.room.time, ev);
    }
    expect(ev.some((e) => e.k === 'staggered')).toBe(true);
    expect([hm.act, hm.boss!.stagUntil - g.room.time]).toEqual(['stunned', POISE_KIT.stagger]);
    expect(hm.boss!.poise).toBe(0);
    const g2 = ground(['sword']);
    relicStun(g2.hm, g2.room.time, 1.2, []);
    expect([g2.hm.act, g2.hm.boss!.poise]).toEqual(['stunned', POISE_KIT.bar * POISE_KIT.relic]);
  });
});

describe('phases, the roar and the plate', () => {
  it('below half: a 2 s roar with nothing landing either way, phase 2 with Rope Rain, a pip gone from the plate', () => {
    const g = ground(['sword'], [[0, 2]]), hm = g.hm;
    expect(plateOf(g.room.enemies, g.room.time)).toMatchObject({ name: 'HEMPEN', pips: 2, lit: 2, bars: [{ name: '', poiseMax: POISE_KIT.bar }] });
    hm.hp = Math.floor(hm.maxHp * HEMPEN_BOSS.phase2);
    const ev = run(g, TICK * 2);
    expect(has(ev, 'roar')).toBe(true);
    expect([hm.boss!.phase, hm.boss!.roarUntil - g.room.time > 1.8]).toEqual([2, true]);
    const hp = hm.hp, h = g.heroes[0];
    Object.assign(h, { x: HM.x, y: HM.y + 1.2, fx: 0, fy: -1, hitIds: [] });
    hitEnemy(h, WEAPONS.sword.combo[0], hm, g.room.time, []);
    expect(hm.hp).toBe(hp);
    expect(plateOf(g.room.enemies, g.room.time)!.lit).toBe(1);
    expect(hempenRotation(2, 1, 0)).toContain('rain');
    expect(hempenRotation(1, 1, 0)).not.toContain('rain');
    // Out of reach of the plate (an expedition's), it isn't shown.
    expect(plateOf(g.room.enemies, g.room.time, () => false)).toBeNull();
  });
});

describe('the sure chest and the relic', () => {
  it("its hoard is chained under the hanging tree, the sure chest, and won't open while it lives", () => {
    const g = ground(['sword']), c = g.room.chests.find((x) => x.chained)!;
    expect([c.sure, typeof c.boss]).toEqual(['hempen', 'number']);
    expect(Math.hypot(c.x - HM.x - HEMPEN_BOSS.hoard[0], c.y - HM.y - HEMPEN_BOSS.hoard[1])).toBeLessThan(0.01);
    Object.assign(g.heroes[0], { x: c.x, y: c.y + 0.8 });
    const ev = run(g, 0.3, () => ({ open: c.id, openSeq: 1 }));
    expect(has(ev, 'chained')).toBe(true);
    // Dead: it opens, every hero their own piece; no gold; no relic on the floor (the wood's relic is the zone's).
    const k = ground(['sword', 'daggers'], [[-2, -0.5], [-1.4, -0.9]]), ch = k.room.chests.find((x) => x.chained)!;
    Object.assign(k.hm, { hp: 0, act: 'dead', actT: 0, attack: null, death: 'fall' });
    for (const h of k.heroes) Object.assign(h, { x: ch.x + (h.id === 'p0' ? -0.5 : 0.5), y: ch.y + 0.8 });
    run(k, 2, (h) => (h.id === 'p0' ? { open: ch.id, openSeq: 1 } : {}));
    expect(ch.state).toBe('open');
    expect(Object.keys(ch.rolls).sort()).toEqual(['p0', 'p1']);
    expect(k.room.drops.filter((d) => d.owner).length).toBe(2);
    expect(k.room.pickups.some((p) => p.gold)).toBe(false);
    expect(k.room.pickups.some((p) => p.relic)).toBe(false);
  });

  it("each hero's own roll: a named butcher's odds (Forged or better, PRE-WAR about 20%, its hungry piece about 5%), a relic about 20% and never the hook", () => {
    const n = 4000, tiers: Record<string, number> = {};
    let relics = 0, hooks = 0;
    for (let s = 1; s <= n; s++) {
      const r = bossRoll(s, { id: 'p0', weapon: 'sword', found: [] }, 3, 'hempen');
      tiers[r.item.quality] = (tiers[r.item.quality] ?? 0) + 1;
      if (r.relic) relics++, (hooks += r.relic.kind === 'hook' ? 1 : 0);
    }
    expect(Object.keys(tiers).every((t) => ['forged', 'tolmouth', 'touched', 'turning', 'hungry'].includes(t))).toBe(true);
    expect(tiers.tolmouth / n).toBeGreaterThan(0.16), expect(tiers.tolmouth / n).toBeLessThan(0.24);
    expect(tiers.hungry / n).toBeGreaterThan(0.03), expect(tiers.hungry / n).toBeLessThan(0.07);
    expect(relics / n).toBeGreaterThan(0.17), expect(relics / n).toBeLessThan(0.23);
    expect(hooks).toBe(0);
    // Two heroes, the same chest: their own rolls.
    expect(JSON.stringify(bossRoll(9, { id: 'p0', weapon: 'sword', found: [] }, 3, 'hempen'))).not.toBe(JSON.stringify(bossRoll(9, { id: 'p1', weapon: 'sword', found: [] }, 3, 'hempen')));
  });

  it("the chest's relic comes beside the wood's own: the grappling hook is still the wood's at the job's end", () => {
    const seed = [...Array(400).keys()].find((s) => bossRoll(s + 1, { id: 'p0', weapon: 'sword', found: [] }, 3, 'hempen').relic)! + 1;
    const r = bossRoll(seed, { id: 'p0', weapon: 'sword', found: [] }, 3, 'hempen');
    expect(FOUND_RELICS).toContain(r.relic!.kind);
    const won = wonRelics({ job: hangmansWood(3) }, 77, [r.relic!]);
    expect(won.map((x) => x.kind)).toEqual(['hook']);
  });
});

describe('party scaling, as the Doorkeepers do it', () => {
  it('health 1, 1.4, 1.8, 2.2 times; POISE 1, 1.3, 1.6, 1.9 times; from three, small ones each phase; four, one more in the rotation; wind-ups never shorter', () => {
    for (const [n, hp, poise, adds] of [[1, 1, 1, 0], [2, 1.4, 1.3, 0], [3, 1.8, 1.6, 3], [4, 2.2, 1.9, 4]] as const) {
      const kits = Array.from({ length: n }, () => 'sword' as WeaponId);
      const g = ground(kits, kits.map((_, i) => [i - 1, 2] as [number, number]));
      expect(g.hm.maxHp).toBe(Math.round(HEMPEN.hp * hp));
      expect(g.hm.boss!.poiseMax).toBe(Math.round(POISE_KIT.bar * poise));
      expect(g.room.enemies.filter((e) => !e.boss).length).toBe(adds);
      expect(hempenRotation(1, n, 0).length).toBe(n >= 4 ? 6 : 5);
      hempenBegin(g.hm, 'cleave', g.heroes[0], g.heroes, g.room.time, []);
      expect(g.hm.attack!.windup).toBeCloseTo(HEMPEN_BOSS.cleave.windup + BOSS.tell, 5);
    }
  });
});

describe('fair on a phone', () => {
  const slowest = Math.min(...Object.values(WEAPONS).map((w) => HERO.speed * (w.speed ?? 1)));
  it('red at least 0.9 s, striped at least 1.1 s and walked out of from the middle in 60%; lanes at least 0.6 wide', () => {
    for (const s of [...Object.values(SPECS), { ...HEMPEN_BOSS.rain, windup: HEMPEN_BOSS.rope.fall, radius: HEMPEN_BOSS.rope.r }]) {
      if (!s.unblockable) expect(s.windup).toBeGreaterThanOrEqual(0.9);
      else {
        expect(s.windup).toBeGreaterThanOrEqual(1.1);
        expect((s.radius! + HERO.radius) / slowest).toBeLessThanOrEqual(s.windup * 0.6);
      }
    }
    expect(HERO.radius * 2).toBeGreaterThanOrEqual(0.6);
  });

  it('the pose first, the floor after; a lane turns with its hero until 70% of the wind-up, then holds', () => {
    const g = ground(['sword'], [[0, 4]]), h = g.heroes[0];
    hempenBegin(g.hm, 'noose', h, g.heroes, g.room.time, []);
    expect(g.hm.attack!.tell).toBe(BOSS.tell);
    run(g, wind('noose') * 0.5, () => ({ mx: 1, my: 0 }));
    const mid = g.hm.attack!.dx;
    expect(mid).toBeGreaterThan(0.02);
    run(g, wind('noose') * 0.25 + TICK, () => ({ mx: 1, my: 0 }));
    const locked = g.hm.attack!.dx;
    run(g, wind('noose') * 0.2, () => ({ mx: 1, my: 0 }));
    expect(g.hm.attack!.dx).toBe(locked);
  });

  it('nothing begun from off an upright phone: no rope or rain at a hero further across than it allows', () => {
    const g = ground(['sword'], [[HEMPEN_BOSS.across + 0.4, 0]]);
    const ev = run(g, 6);
    expect(ev.some((e) => e.k === 'noosed')).toBe(false);
    expect(g.hm.attack?.boss === 'rain' && Math.abs(g.hm.attack.cx - g.hm.x) > HEMPEN_BOSS.across).toBe(false);
  });
});

describe('its ground', () => {
  it('a hero off its ground who has not hurt it is not chased: it goes back to where it stands', () => {
    const g = ground(['sword'], [[0, HEMPEN_BOSS.ground + 3]]), home = { ...g.hm.home };
    Object.assign(g.hm, { x: home.x, y: home.y + 2 });
    run(g, 3);
    expect(Math.hypot(g.hm.x - home.x, g.hm.y - home.y)).toBeLessThan(1);
    expect(g.heroes[0].hp).toBe(g.heroes[0].maxHp);
  });
});

describe('the switch', () => {
  afterEach(() => void (HEMPEN_BOSS.on = true));
  it('off: Hempen is the plain named butcher it was, its band back, no trunks, no hoard', () => {
    HEMPEN_BOSS.on = false;
    // (A day no other test here builds: the plan is kept once made.)
    const p = expedPlan(hangmansWood(17)), room = expedRoom(hangmansWood(17), 1);
    expect(room.enemies.find((e) => e.name === 'HEMPEN')!.boss).toBeUndefined();
    expect(room.bosses).toBeNull();
    expect(p.chests.some((c) => c.chained)).toBe(false);
    const hp = p.foes.find((f) => f.name === 'HEMPEN')!;
    expect(p.foes.filter((f) => f.pack === hp.pack && f.role === 'fodder').length).toBeGreaterThanOrEqual(3);
  });
});

describe('the same fight twice, and a friend gets it with nothing new a tick', () => {
  it('determinism', () => {
    const go = () => {
      const g = ground(['sword', 'daggers'], [[0, 2], [2.5, 1.5]]);
      run(g, 8, (h, t) => (h.id === 'p0' ? { block: t % 2 < 1, ax: 0, ay: -1, attackSeq: Math.floor(t * 3) } : { mx: Math.sin(t), my: 0.4, attackSeq: Math.floor(t * 4) }));
      return JSON.stringify({ e: g.room.enemies, h: g.room.heroes.map((h) => [h.x, h.y, h.hp]), b: g.room.bosses });
    };
    expect(go()).toBe(go());
  });

  it('no traffic a tick: standing at its post nothing of its boss state goes; its ropes come across as they are', () => {
    const room = expedRoom(hangmansWood(3), 2), enc = new Encoder(), dec = new Decoder();
    room.join('p0'), room.join('p1');
    let got = dec.apply(enc.encode(stateOf(room), true), true);
    for (let i = 0; i < 6; i++) {
      room.step();
      const p = enc.encode(stateOf(room));
      expect((p.enemies?.u ?? []).filter(([, e]) => 'boss' in e)).toHaveLength(0);
    }
    const hm = room.enemies.find((e) => e.boss)!;
    hm.boss!.ropes = [{ x: 60, y: 10, at: room.time + 1, on: 'p1' }];
    room.step();
    got = dec.apply(enc.encode(stateOf(room)));
    expect((got.enemies.find((e) => e.id === hm.id) as unknown as Enemy).boss!.ropes).toEqual(hm.boss!.ropes);
  });
});

describe('clear times on its ground (tests/bossbot.ts)', () => {
  it('a daggers Rogue, a staff Mage and a sword Warrior each win alone, and a party of three', { timeout: 120000 }, () => {
    const out: Record<string, unknown> = {};
    for (const k of ['daggers', 'staff', 'sword'] as WeaponId[]) {
      for (const d of [3, 4]) {
        const r = hempenClear(d, [k]);
        out[`${k} d${d}`] = r;
        expect(r.won, `${k} d${d}`).toBe(true);
      }
    }
    const three = hempenClear(3, ['sword', 'staff', 'daggers']);
    out.three = three;
    expect(three.won).toBe(true);
    console.log(JSON.stringify(out));
    expect(isDead).toBeDefined();
  });
});
