/**
 * The second three affixes (shared/elites.ts, sim/blast.ts, sim/hornblow.ts): Oil-soaked (set alight, it
 * stands and bursts: burn it inside its own pack), Hornblower (at half health it blows, a channel you see,
 * and three small ones run in from the room's edge on your screen: burst it down or interrupt it) and
 * Smouldering (a striped circle round its body after it dies: walk out after the kill). Each is on the
 * body, each has its counter for a class that blocks and a class that dodges, what each costs, the
 * switch, that each goes out once, and the same fight twice.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { board } from '../src/shared/jobs';
import { planRoom, type Foe } from '../src/shared/terrain';
import { AFFIX2_ON, ELITE, HERO, THREAT, WEAPONS, affixPool, type WeaponId } from '../src/shared/tuning';
import { foeThreat } from '../src/shared/roombudget';
import { damage, kill } from '../src/sim/damage';
import { stun } from '../src/sim/stuns';
import { hitEnemy } from '../src/sim/combat';
import { blastShape } from '../src/sim/blastshape';
import { calling } from '../src/sim/hornstate';
import { NO_INTENT, type FightEvent } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { field, run } from './foeyard';

afterEach(() => void (AFFIX2_ON.on = true));

/** One brute at (15, 10) with `affixes`, a pack held at its spot about it, and the hero `gap` below it. */
const brute = (affixes: Foe['elite'], gap = 1.2, pack = true, weapon: WeaponId = 'sword') => {
  const more: Foe[] = pack ? [{ kind: 'scrapper', x: 14, y: 9.6, pack: 2, awake: false }, { kind: 'scrapper', x: 16, y: 9.6, pack: 2, awake: false }, { kind: 'scrapper', x: 15, y: 8.9, pack: 2, awake: false }] : [];
  const f = field([{ kind: 'scrapper', variant: 'heavy', role: 'heavy', x: 15, y: 10, elite: affixes, pack: 1 }, ...more], [['me', 15, 10 + gap]]);
  Object.assign(f.h, { weapon });
  const e = f.room.enemies[0];
  Object.assign(e, { fx: 0, fy: 1, cooldown: 99 });
  // (Held at their spot, jeering, as a pack over the screen's cap is: sim/pacing.ts. Goblins that chase you
  // walk out of a burst with you; a pack standing its ground, at rest, or in the wind-ups of its blows doesn't.)
  for (const o of f.room.enemies.slice(1)) (o.cooldown = 99), (o.held = 1);
  return { ...f, e };
};
const BLOCKERS: WeaponId[] = ['sword', 'mace'], DODGERS: WeaponId[] = ['daggers', 'longbow', 'wand'];
const SLOWEST = HERO.speed * Math.min(...Object.values(WEAPONS).map((w) => w.speed ?? 1));

describe('what an elite of the second three costs, and what each can be', () => {
  it('its sort times 1.5, plus 1 an affix; a Hornblower the small ones it may call too', () => {
    expect(foeThreat({ role: 'heavy', elite: ['oiled'] })).toBe(THREAT.meaty * 1.5 + 1);
    expect(foeThreat({ role: 'heavy', elite: ['ember', 'quick'] })).toBe(THREAT.meaty * 1.5 + 2);
    expect(foeThreat({ role: 'heavy', elite: ['horn'] })).toBe(THREAT.meaty * 1.5 + 1 + ELITE.horn.call * THREAT.chaff);
  });

  it('a Kegman is never Oil-soaked or Smouldering, a Gorger never Gorging, an ironhide never Plated; off, only the first three', () => {
    expect(affixPool('kegman')).not.toContain('oiled');
    expect(affixPool('kegman')).not.toContain('ember');
    expect(affixPool('gorger')).not.toContain('gorging');
    expect(affixPool('ironhide')).not.toContain('plated');
    expect(affixPool('heavy')).toEqual(['plated', 'quick', 'gorging', 'oiled', 'horn', 'ember']);
    AFFIX2_ON.on = false;
    expect(affixPool('heavy')).toEqual(['plated', 'quick', 'gorging']);
  });

  it('they turn up in the rooms, and switched off none does and the rooms are otherwise the same', () => {
    const seen = new Set<string>();
    let rooms = 0;
    for (let d = 1; d <= 40; d++) for (const j of board(d)) for (let i = 1; i < j.rooms; i++) {
      const on = planRoom(j, i);
      for (const f of on.foes) for (const a of f.elite ?? []) seen.add(a);
      if (d > 12) continue;
      AFFIX2_ON.on = false;
      const off = planRoom(j, i);
      AFFIX2_ON.on = true;
      rooms++;
      expect(off.foes.some((f) => f.elite?.some((a) => a === 'oiled' || a === 'horn' || a === 'ember'))).toBe(false);
      expect(JSON.stringify(on.map)).toBe(JSON.stringify(off.map));
    }
    expect([...seen].sort()).toEqual(expect.arrayContaining(['ember', 'horn', 'oiled']));
    expect(rooms).toBeGreaterThan(100);
  });
});

describe('Oil-soaked', () => {
  it('set alight, it stands where it is and bursts a second later, its own pack and itself in it', () => {
    const { room, e } = brute(['oiled'], 6);
    e.lastBy = 'me';
    e.burnUntil = room.time + 4;
    run(room, 1 / 30);
    expect(e.blast?.k).toBe('oiled');
    expect(e.act).toBe('stunned');
    const a = blastShape(e, room.time)!;
    expect(a.unblockable).toBe(true);
    expect(a.windup).toBe(ELITE.oiled.fuse);
    const hp = e.hp, packHp = room.enemies.slice(1).map((o) => o.hp);
    run(room, ELITE.oiled.fuse + 0.1);
    expect(e.blast!.done).toBe(true);
    expect(e.hp).toBeLessThan(hp);
    room.enemies.slice(1).forEach((o, i) => expect(o.hp < packHp[i] || o.act === 'dead').toBe(true));
    expect((ELITE.oiled.r + HERO.radius) / SLOWEST).toBeLessThan(ELITE.oiled.fuse * 0.6);
  });

  it('a blocker holding block beside it is still hurt; walked out of, nothing; a dodger dodges out', () => {
    const go = (w: WeaponId, how: 'block' | 'walk' | 'dodge') => {
      const { room, h, e } = brute(['oiled'], 1.1, false, w);
      e.burnUntil = room.time + 4;
      if (how === 'block') room.setIntent('me', { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
      if (how === 'walk') room.setIntent('me', { ...NO_INTENT, my: 1 });
      if (how === 'dodge') run(room, ELITE.oiled.fuse - 0.2), room.setIntent('me', { ...NO_INTENT, my: 1, rollSeq: 1 });
      run(room, ELITE.oiled.fuse + 0.3);
      return HERO.hp - h.hp;
    };
    for (const w of BLOCKERS) expect(go(w, 'block'), w).toBeGreaterThan(0), expect(go(w, 'walk'), w).toBe(0);
    for (const w of DODGERS) expect(go(w, 'dodge'), w).toBe(0);
  });

  it('never alight, it never bursts', () => {
    const { room, e } = brute(['oiled'], 1.1, false);
    damage(e, 30, room.time, room.events);
    run(room, 2);
    expect(e.blast).toBeUndefined();
  });
});

describe('Hornblower', () => {
  const toHalf = (affixes: Foe['elite'], gap = 3) => {
    const r = brute(affixes, gap, false);
    r.e.hp = Math.floor(r.e.maxHp * ELITE.horn.at);
    r.e.alert = true;
    run(r.room, 1 / 30);
    return r;
  };

  it('at half health with you near, it stands and blows: a channel, its call coming from the room\'s edge on your screen, never beside you', () => {
    const { room, h, e } = toHalf(['horn']);
    expect(calling(e, room.time)).toBe(true);
    const c = e.call!;
    expect(c.until - c.at).toBeCloseTo(ELITE.horn.time, 5);
    // On the hero's screen, and at least ELITE.horn.clear from them.
    expect(Math.abs(c.x - h.x)).toBeLessThanOrEqual(ELITE.horn.screen[0] + 1e-6);
    expect(Math.abs(c.y - h.y)).toBeLessThanOrEqual(ELITE.horn.screen[1] + 1e-6);
    expect(Math.hypot(c.x - h.x, c.y - h.y)).toBeGreaterThanOrEqual(ELITE.horn.clear);
    // At the room's edge (the field is 30 wide: the hero at 15 sees no side wall, so the screen's edge).
    const W = room.map.w, H = room.map.h, edge = Math.min(c.x - Math.max(1, h.x - ELITE.horn.screen[0]), Math.min(W - 1, h.x + ELITE.horn.screen[0]) - c.x, c.y - Math.max(1.6, h.y - ELITE.horn.screen[1]), Math.min(H - 1, h.y + ELITE.horn.screen[1]) - c.y);
    expect(edge).toBeLessThan(0.01);
    const at = [e.x, e.y];
    run(room, ELITE.horn.time - 0.1);
    expect(Math.hypot(e.x - at[0], e.y - at[1]), 'it stood').toBeLessThan(0.05);
    const before = room.enemies.length, ev = run(room, 0.2);
    expect(ev.some((x) => x.k === 'called')).toBe(true);
    const come = room.enemies.slice(before);
    expect(come).toHaveLength(ELITE.horn.call);
    for (const g of come) expect(Math.hypot(g.x - c.x, g.y - c.y)).toBeLessThan(1.2), expect(g.alert).toBe(true), expect(g.role).toBe('fodder');
    // It blows once.
    e.hp = 1;
    run(room, 3);
    expect(room.enemies.length).toBe(before + ELITE.horn.call);
  });

  it('near a side wall, its call comes from that wall', () => {
    const f = field([{ kind: 'scrapper', variant: 'heavy', role: 'heavy', x: 4, y: 10, elite: ['horn'] }], [['me', 6, 12]]);
    const e = f.room.enemies[0];
    Object.assign(e, { cooldown: 99, alert: true, hp: Math.floor(e.maxHp / 2) });
    run(f.room, 1 / 30);
    expect(e.call).toBeTruthy();
    expect(e.call!.x).toBeLessThanOrEqual(1.5);
  });

  it('interrupted, no one comes and it never blows again: a charged blow (a blocker), a stun, a heavy shot (a dodger), or burst down', () => {
    const cuts: [string, (r: ReturnType<typeof toHalf>) => void][] = [
      ['charged blow', (r) => (Object.assign(r.h, { heavy: true, hitIds: [], x: r.e.x, y: r.e.y + 1 }), hitEnemy(r.h, { ...WEAPONS.sword.combo[0], dmg: 12, range: 9, arc: 360, knock: 0 }, r.e, r.room.time, r.room.events))],
      ['stun', (r) => stun(r.e, 'me', r.room.time, 1, r.room.events)],
      ['heavy shot', (r) => damage(r.e, 12, r.room.time, r.room.events, { heavy: true, src: 'arrow' })],
      ['burst down', (r) => kill(r.e, r.room.events, 'fall')],
    ];
    for (const [how, cut] of cuts) {
      const r = toHalf(['horn']);
      run(r.room, 0.5);
      const before = r.room.enemies.length;
      cut(r);
      const ev: FightEvent[] = run(r.room, ELITE.horn.time + 4);
      expect(r.e.call!.cut, how).toBe(true);
      expect(ev.some((x) => x.k === 'called'), how).toBe(false);
      expect(r.room.enemies.length, how).toBe(before);
    }
  });

  it('a quick blow that knocks nothing off balance does not stop it (a meaty sort of the six never flinches from one)', () => {
    const f = field([{ kind: 'scrapper', variant: 'forker', role: 'forker', x: 15, y: 10, elite: ['horn'] }], [['me', 15, 13]]);
    const r = { ...f, e: f.room.enemies[0] };
    Object.assign(r.e, { cooldown: 99, alert: true, hp: Math.floor(r.e.maxHp * ELITE.horn.at) });
    run(r.room, 1 / 30);
    expect(calling(r.e, r.room.time)).toBe(true);
    Object.assign(r.h, { heavy: false, perfect: false, counter: false, hitIds: [], x: r.e.x, y: r.e.y + 1 });
    hitEnemy(r.h, { ...WEAPONS.sword.combo[0], dmg: 5, range: 9, arc: 360, knock: 0 }, r.e, r.room.time, r.room.events);
    run(r.room, ELITE.horn.time + 0.1);
    expect(r.e.call!.blown).toBe(true);
  });

  it('far from every hero it waits: it begins only with you on screen', () => {
    const r = toHalf(['horn'], ELITE.horn.near + 2);
    expect(r.e.call).toBeUndefined();
  });
});

describe('Smouldering', () => {
  const killed = (w: WeaponId, how: 'stay' | 'block' | 'walk' | 'dodge') => {
    const { room, h, e } = brute(['ember'], 1.1, false, w);
    kill(e, room.events, 'fall');
    run(room, 1 / 30);
    expect(e.blast?.k).toBe('ember');
    expect(blastShape(e, room.time)!.windup).toBe(ELITE.ember.fuse);
    if (how === 'block') room.setIntent('me', { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
    if (how === 'walk') room.setIntent('me', { ...NO_INTENT, my: 1 });
    if (how === 'dodge') run(room, ELITE.ember.fuse - 0.2), room.setIntent('me', { ...NO_INTENT, my: 1, rollSeq: 1 });
    run(room, ELITE.ember.fuse + 0.3);
    return HERO.hp - h.hp;
  };

  it('1.2 s after it dies, a striped circle round its body: no block holds it; walk out after the kill (or dodge out)', () => {
    expect(killed('sword', 'stay')).toBeGreaterThan(0);
    for (const w of BLOCKERS) expect(killed(w, 'block'), w).toBeGreaterThan(0), expect(killed(w, 'walk'), w).toBe(0);
    for (const w of DODGERS) expect(killed(w, 'dodge'), w).toBe(0);
    expect((ELITE.ember.r + HERO.radius) / SLOWEST).toBeLessThan(ELITE.ember.fuse * 0.6);
  });

  it('alive, nothing', () => {
    const { room, e } = brute(['ember'], 1.1, false);
    run(room, 2);
    expect(e.blast).toBeUndefined();
  });
});

describe('online and determinism', () => {
  it('a burst and a call go out once each (and once more when they go off), never a tick', () => {
    const { room, e } = brute(['horn', 'ember'], 3, false);
    const enc = new Encoder(), dec = new Decoder();
    dec.apply(enc.encode(stateOf(room), true), true);
    e.hp = Math.floor(e.maxHp * ELITE.horn.at);
    e.alert = true;
    let sent = 0;
    for (let i = 0; i < 150; i++) {
      if (i === 30) kill(e, room.events, 'fall');
      room.step();
      const p = enc.encode(stateOf(room));
      for (const [k, u] of (p.enemies?.u ?? []) as [string, Record<string, unknown>][]) if (k === String(e.id) && ('blast' in u || 'call' in u)) sent++;
      dec.apply(JSON.parse(JSON.stringify(p)));
    }
    // The call (begun, cut by the kill) and the burst (lit, gone off): four changes in five seconds.
    expect(sent).toBeLessThanOrEqual(4);
  });

  it('the same fight with all three twice', () => {
    const play = () => {
      const { room } = brute(['oiled', 'horn']);
      room.enemies.push(...field([{ kind: 'scrapper', variant: 'heavy', role: 'heavy', x: 18, y: 8, elite: ['ember'] }]).room.enemies.map((o) => Object.assign(o, { id: 50 })));
      const log: string[] = [];
      for (let i = 0; i < 300; i++) {
        if (i === 40) room.enemies[0].burnUntil = room.time + 3;
        room.setIntent('me', { ...NO_INTENT, mx: Math.sin(i / 17), my: -0.3, attack: i % 8 < 2, attackSeq: Math.floor(i / 8) });
        room.step();
        for (const ev of room.events) if (ev.k === 'hit' || ev.k === 'windup' || ev.k === 'fuse' || ev.k === 'horn' || ev.k === 'called') log.push(`${i}:${ev.k}:${ev.x.toFixed(3)}`);
      }
      return log.join('|');
    };
    expect(play()).toBe(play());
  });
});
