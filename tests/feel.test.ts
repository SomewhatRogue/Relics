// The guest feel slice (DECISIONS 2026-11-06): your own hero on a friend's screen walks by the room's own
// rule (sim/walkspeed.ts, client/ownwalk.ts), so nothing pulls it back; and a blow on a friend with lag
// waits for their word, judged by what their screen showed (sim/latelist.ts, lagcomp.ts).
import { describe, expect, it } from 'vitest';
import { inArea, useMap } from '../src/shared/arena';
import { expedition } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import { HERO, LAGCOMP, TICK, WEAPONS } from '../src/shared/tuning';
import { begin } from '../src/sim/enemies';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { actPace } from '../src/sim/walkspeed';
import { walkStep, type Slip } from '../src/client/ownwalk';
import { loadRoom, saveRoom } from '../src/client/coop';

const MAP = expedPlan(expedition(2)).map;
const SHALLOW = (MAP.water ?? []).find((w) => !w.deep)!;

/** A room with one hero standing at (x, y) and nothing else. */
function lone(x: number, y: number, kit: Partial<Hero> = {}): { room: ArenaRoom; h: Hero } {
  const room = new ArenaRoom(5, { map: MAP, foes: [] }), h = room.join('me');
  Object.assign(h, { x, y, safeT: 0 }, kit);
  return { room, h };
}

/**
 * Lockstep: each tick the guest's walk (from the hero as it stood) against the room's. Returns the
 * biggest difference over `ticks`.
 */
function parity(kit: Partial<Hero>, inp: Intent, at = MAP.hero, ticks = 45, prep?: (r: ArenaRoom, h: Hero) => void): number {
  const { room, h } = lone(at.x, at.y, kit), slip: Slip = {};
  prep?.(room, h);
  room.setIntent('me', inp);
  let worst = 0;
  for (let i = 0; i < ticks; i++) {
    const me = { ...h } as Hero, p = { x: h.x, y: h.y, z: h.z };
    useMap(room.map);
    walkStep(me, p, inp, slip, TICK, room.time + TICK, actPace(me, inp));
    room.step();
    worst = Math.max(worst, Math.hypot(h.x - p.x, h.y - p.y));
  }
  return worst;
}

describe('one walk-speed rule', () => {
  const up = { ...NO_INTENT, my: -1 };
  it('the guest walks as the room walks it: plain, creeping, half a stick, blocking, wading, quick, brandy', () => {
    expect(parity({}, up)).toBeLessThan(1e-9);
    expect(parity({}, { ...up, my: -0.45 })).toBeLessThan(1e-9);
    expect(parity({}, { ...up, my: -0.7 })).toBeLessThan(1e-9);
    expect(parity({ weapon: 'sword' }, { ...up, block: true })).toBeLessThan(1e-9);
    expect(parity({ weapon: 'greatsword' }, { ...up, block: true, mx: 1 })).toBeLessThan(1e-9);
    // (Into the shallows and out: half pace in them, the same here.)
    expect(inArea(SHALLOW, SHALLOW.x + SHALLOW.w / 2, SHALLOW.y + SHALLOW.h / 2)).toBe(true);
    expect(parity({}, { ...NO_INTENT, mx: 1 }, { x: SHALLOW.x + SHALLOW.w / 2, y: SHALLOW.y + SHALLOW.h / 2 })).toBeLessThan(1e-9);
    expect(parity({}, { ...NO_INTENT, mx: -0.4 }, { x: SHALLOW.x + SHALLOW.w / 2, y: SHALLOW.y + SHALLOW.h / 2 })).toBeLessThan(1e-9);
    expect(parity({ quickUntil: 99 } as Partial<Hero>, up)).toBeLessThan(1e-9);
    expect(parity({ brandyUntil: 99 }, up)).toBeLessThan(1e-9);
  });

  it('on oil the stick takes hold as slowly here as in the room', () => {
    const oil = (r: ArenaRoom, h: Hero) => void r.slicks.push({ id: 1, x: h.x, y: h.y, r: 6, until: 1e9, lit: -1 });
    expect(parity({}, { ...NO_INTENT, mx: 1 }, MAP.hero, 45, oil)).toBeLessThan(1e-9);
    // Frame by frame (60 a second) it comes to about the same place as tick by tick (the slip is a rate here;
    // the few hundredths a second it differs by are eased out with the leader's word).
    const slipA: Slip = { slick: true }, slipB: Slip = { slick: true }, me = { ...lone(MAP.hero.x, MAP.hero.y).h, slick: true } as Hero;
    const a = { x: MAP.hero.x, y: MAP.hero.y }, b = { ...a };
    useMap(MAP);
    for (let i = 0; i < 30; i++) walkStep(me, a, { ...NO_INTENT, mx: 1 }, slipA, TICK, 0, 1);
    for (let i = 0; i < 60; i++) walkStep(me, b, { ...NO_INTENT, mx: 1 }, slipB, TICK / 2, 0, 1);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.1);
  });

  it('a block held walks at the kit\'s block pace, a creep at half (the old guess walked both at a full stick\'s length)', () => {
    const { h } = lone(MAP.hero.x, MAP.hero.y, { weapon: 'sword' });
    useMap(MAP);
    const full = walkStep(h, { x: h.x, y: h.y }, { ...NO_INTENT, my: -1 }, {}, 1, 0, 1)[1];
    const held = walkStep(h, { x: h.x, y: h.y }, { ...NO_INTENT, my: -1, block: true }, {}, 1, 0, actPace({ ...h, act: 'idle' } as Hero, { ...NO_INTENT, block: true }))[1];
    expect(held / full).toBeCloseTo(WEAPONS.sword.blockSpeed, 5);
    const creep = walkStep(h, { x: h.x, y: h.y }, { ...NO_INTENT, my: -0.45 }, {}, 1, 0, 1)[1];
    expect(creep / full).toBeCloseTo(0.5, 5);
  });
});

/**
 * A friend, `sam`, with `lag` seconds of lag, and a goblin's stab that lands on them. `press` (on their
 * screen, seconds before the blow lands there: negative is after) is a dodge or a block; their Intents
 * reach the room `delay` seconds after their screen showed them (the lag the room keeps is `lag`).
 */
function strike(o: { lag: number; delay?: number; press?: number; what?: 'roll' | 'block'; weapon?: Hero['weapon']; host?: boolean; comp?: boolean; dry?: number }): { room: ArenaRoom; h: Hero; e: ArenaRoom['enemies'][number]; at: number; hitAt: number; judgedAt: number; hurt: boolean; dodged: boolean; blocked: boolean } {
  const delay = o.delay ?? o.lag, id = o.host ? 'me' : 'sam';
  const room = new ArenaRoom(9, { map: MAP, foes: [{ kind: 'scrapper', x: MAP.hero.x, y: MAP.hero.y - 1.3, awake: true }] });
  const h = room.join(id), e = room.enemies[0];
  Object.assign(h, { x: MAP.hero.x, y: MAP.hero.y, weapon: o.weapon ?? 'longbow', fx: 0, fy: -1, safeT: 0, hp: 100, maxHp: 100, lag: o.host || o.comp === false ? 0 : o.lag });
  const ev: FightEvent[] = [];
  begin(e, 'stab', { windup: 0.6, active: 0.1, recover: 0.6, dmg: 20, knock: 3, range: 2.4, arc: 70, unblockable: false }, h, ev);
  e.cooldown = 99;
  // Lands when its clock reaches the wind-up: the tick that does it (found by a run with nobody pressing).
  const at = o.dry ?? strike({ lag: 0, host: true, dry: -1 }).hitAt;
  // Their Intents as sent: now and then (the stick), and the press, each with the time they were looking at.
  const sent: { vt: number; i: Intent }[] = [];
  for (let vt = 0; vt < 2; vt += 0.1) sent.push({ vt, i: { ...NO_INTENT } });
  if (o.press !== undefined) {
    const vt = at - o.press;
    sent.push({ vt, i: o.what === 'block' ? { ...NO_INTENT, block: true, blockSeq: 1 } : { ...NO_INTENT, rollSeq: 1 } });
  }
  sent.sort((a, b) => a.vt - b.vt);
  // (After the press, everything they send carries it: a held block stays held, the roll stays counted.)
  for (let k = 1; k < sent.length; k++) if (o.press !== undefined && sent[k].vt > at - o.press) sent[k].i = { ...sent[k].i, block: o.what === 'block', blockSeq: o.what === 'block' ? 1 : 0, rollSeq: o.what === 'block' ? 0 : 1 };
  const evs: FightEvent[] = [];
  let hitAt = -1, judgedAt = -1;
  for (let k = 0; k < 40; k++) {
    // The newest Intent of theirs to have got here (the leader's own: at once).
    const got = sent.filter((s) => s.vt + (o.host ? 0 : delay) <= room.time + 1e-9).pop();
    if (got) room.setIntent(id, o.host ? got.i : { ...got.i, vt: got.vt });
    const hp = h.hp;
    room.step();
    evs.push(...room.events);
    if (room.events.some((x) => x.k === 'impact')) hitAt = room.time;
    if ((h.hp < hp || room.events.some((x) => x.k === 'dodge' || x.k === 'block')) && judgedAt < 0) judgedAt = room.time;
  }
  return { room, h, e, at, hitAt, judgedAt, hurt: h.hp < 100, dodged: evs.some((x) => x.k === 'dodge'), blocked: evs.some((x) => x.k === 'block') };
}

describe('defensive lag compensation', () => {
  it('a dodge pressed on time by their own screen saves them (and did not, before)', () => {
    const r = strike({ lag: 0.12, press: 0.1 });
    expect(r.hitAt).toBeCloseTo(r.at, 5);
    expect(r.dodged).toBe(true);
    expect(r.hurt).toBe(false);
    // The goblin reels, as for a dodge through a blow anywhere.
    expect(r.e.act).toBe('stunned');
    // Without it (the same lag, judged as it lands): hit.
    expect(strike({ lag: 0.12, press: 0.1, comp: false }).hurt).toBe(true);
  });

  it('a dodge pressed too late by their own screen does not', () => {
    const r = strike({ lag: 0.12, press: -0.05 });
    expect(r.hurt).toBe(true);
    expect(r.dodged).toBe(false);
  });

  it('a block held in time by their own screen holds', () => {
    const r = strike({ lag: 0.12, press: 0.1, what: 'block', weapon: 'sword' });
    expect(r.blocked).toBe(true);
    expect(r.hurt).toBe(false);
    expect(strike({ lag: 0.12, press: 0.1, what: 'block', weapon: 'sword', comp: false }).hurt).toBe(true);
    // Raised after it landed on their screen: taken.
    expect(strike({ lag: 0.12, press: -0.03, what: 'block', weapon: 'sword' }).hurt).toBe(true);
  });

  it("the leader's own hero has no lag: judged the moment it lands", () => {
    const r = strike({ lag: 0, host: true });
    expect(r.hurt).toBe(true);
    expect(r.judgedAt).toBeCloseTo(r.at, 5);
    expect(r.room.late.length).toBe(0);
  });

  it('waits no longer than the cap, however far behind their screen is', () => {
    const r = strike({ lag: 0.5 });
    expect(r.hurt).toBe(true);
    expect(r.judgedAt - r.at).toBeGreaterThanOrEqual(LAGCOMP.cap - 1e-6);
    expect(r.judgedAt - r.at).toBeLessThan(LAGCOMP.cap + TICK + 1e-6);
    // A dodge pressed in time but arriving after the cap: too late to count.
    expect(strike({ lag: 0.5, press: 0.1 }).hurt).toBe(true);
    // Their word comes sooner (an Intent seen past the blow): judged then, not at the cap.
    const soon = strike({ lag: 0.5, delay: 0.05 });
    expect(soon.judgedAt - soon.at).toBeLessThan(LAGCOMP.cap - 1e-6);
  });

  it('is the room\'s own state: the same Intents give the same fight, and it saves and loads as plain data', () => {
    const a = strike({ lag: 0.12, press: 0.1 }), b = strike({ lag: 0.12, press: 0.1 });
    expect(JSON.stringify(saveRoom(a.room))).toBe(JSON.stringify(saveRoom(b.room)));
    // A blow waiting, handed on mid-wait (a takeover): the loaded room judges it the same.
    const room = new ArenaRoom(9, { map: MAP, foes: [{ kind: 'scrapper', x: MAP.hero.x, y: MAP.hero.y - 1.3, awake: true }] });
    const h = room.join('sam'), e = room.enemies[0];
    Object.assign(h, { x: MAP.hero.x, y: MAP.hero.y, weapon: 'longbow', fx: 0, fy: -1, safeT: 0, hp: 100, lag: 0.12 });
    begin(e, 'stab', { windup: 0.6, active: 0.1, recover: 0.6, dmg: 20, knock: 3, range: 2.4, arc: 70, unblockable: false }, h, []);
    room.setIntent('sam', { ...NO_INTENT, vt: 0 });
    for (let k = 0; k < 19; k++) room.step();
    expect(room.late.length).toBe(1);
    const copy = loadRoom(JSON.parse(JSON.stringify(saveRoom(room))));
    for (const r of [room, copy]) {
      r.setIntent('sam', { ...NO_INTENT, vt: 0 });
      for (let k = 0; k < 6; k++) r.step();
    }
    expect(copy.heroes[0].hp).toBe(room.heroes[0].hp);
    expect(room.heroes[0].hp).toBeLessThan(100);
    expect(HERO.radius).toBeGreaterThan(0);
  });
});
