/**
 * The Staithe (Kyle approved the biomes proposal, 2026-11-05): the NETS way leads to it; the log, the
 * netted and the hold each complete; nets catch a foot and burn; oil drifts downstream and lights; the
 * gaffer's hook is blocked, snapped by a parry, or hauls you to its brute; frost pins the skimmer; the
 * smokehouse and a jetty burnt through; the Barrowfields' Staithe placed by the seed and played out at
 * ALARM 3 and 5; a friend's screen has the same.
 */
import { describe, expect, it } from 'vitest';
import { inArea } from '../src/shared/arena';
import { PLACES, SEWERS, board, type Job } from '../src/shared/jobs';
import { routeOf } from '../src/shared/route';
import { expedition } from '../src/shared/expedjob';
import { build, expedPlan } from '../src/shared/expedmap';
import { staitheRoll } from '../src/shared/expedstaithe';
import { GAFFER, SKIMMER, STAITHE, TICK } from '../src/shared/tuning';
import { planRoom, type RoadId } from '../src/shared/terrain';
import { WAYS } from '../src/shared/ways';
import { wayGot } from '../src/shared/waypay';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { isDead } from '../src/sim/damage';
import { afflict, type World } from '../src/sim/elements';
import { OWN_KIT, begin } from '../src/sim/enemies';
import { hitHero } from '../src/sim/combat';
import { ArenaRoom } from '../src/sim/room';
import { goal, newRun, runRoom, tally, type Run } from '../src/sim/run';
import { heldK, isNetted, jettyOf, logOf, onJetty, smokehouseOf } from '../src/sim/staithe';
import { logEnd } from '../src/sim/staithebits';
import { stepDrift } from '../src/sim/drift';
import { NO_INTENT, type Enemy, type FightEvent } from '../src/sim/types';

const ALL = [...PLACES, SEWERS];
const job = (place: (typeof ALL)[number], seed: number): Job => ({ ...board(1)[1], place, rooms: 5, seed, objective: 'hunt', layout: 4, deep: false });

/** A job whose fork has the NETS way, which road it is, and the room it leads into. */
function netsFork(): { j: Job; took: 'h' | 'l'; i: number } {
  for (let s = 1; s < 200; s++) for (const place of ALL) for (const took of ['h', 'l'] as const) {
    const j = job(place, s), r = routeOf(j, took), f = r.findIndex((x) => x.outs!.length === 2);
    if (f < 0) continue;
    const road = took === 'h' ? 'high' : 'low', out = r[f].outs!.find((o) => o.road === road);
    if (out?.way === 'nets') return { j, took, i: f + 1 };
  }
  throw new Error('no NETS fork');
}

/** A Staithe room with one hero who can't be hurt, standing at the way in; the room's other goblins gone if `only`. */
function staithe(only = true): { run: Run; room: ArenaRoom } {
  const { j, took, i } = netsFork(), run = newRun(j);
  Object.assign(run, { index: i, roads: { [i]: took === 'h' ? 'high' : 'low' } });
  const room = runRoom(run), h = room.join('me');
  Object.assign(h, { hp: 9999, maxHp: 9999 });
  room.setIntent('me', NO_INTENT);
  if (only) room.enemies = room.enemies.filter((e) => e.task || e.variant === 'gaffer' || e.variant === 'skimmer' || e.variant === 'heavy');
  return { run, room };
}
const step = (room: ArenaRoom, s: number, run?: Run, each?: () => boolean | void) => {
  const out: FightEvent[] = [];
  for (let n = 0; n < Math.round(s / TICK); n++) {
    room.step(), out.push(...room.events);
    if (run) tally(run, room, room.events, 'me');
    if (each?.()) break;
  }
  return out;
};
const at = (room: ArenaRoom, x: number, y: number) => Object.assign(room.heroes[0], { x, y });
const far = (room: ArenaRoom) => at(room, room.map.hero.x, room.map.hero.y);
const press = (room: ArenaRoom, k: 'grabSeq' | 'blockSeq') => room.setIntent('me', { ...(room.intents.get('me') ?? NO_INTENT), [k]: (room.intents.get('me')?.[k] ?? 0) + 1 });
const world = (room: ArenaRoom): World => ({ heroes: room.heroes, enemies: room.enemies, javelins: [], props: room.props, survivors: room.survivors, now: room.time, ev: room.events, fx: room });
const of = (room: ArenaRoom, v: string) => room.enemies.find((e) => e.variant === v && !isDead(e))!;
const quiet = (room: ArenaRoom, keep: (e: Enemy) => boolean) => (room.enemies = room.enemies.filter(keep));

describe('the Staithe: the NETS way', () => {
  it('turns up at a fork and leads into the Staithe, paying 10% for each one saved', () => {
    const { j, took, i } = netsFork(), r = routeOf(j, took);
    expect(r[i].piece).toBe('staithe');
    expect(r[i].way).toBe('nets');
    const p = planRoom(j, i, took === 'h' ? 'high' : 'low', { [i]: took === 'h' ? 'high' : 'low' }), m = p.map;
    expect(m.staithe).toBeTruthy();
    for (const k of ['jetty', 'gangway', 'smokehouse', 'hungnet'] as const) expect(m.blocks.some((b) => b.kind === k), k).toBe(true);
    expect(m.water!.some((w) => w.span && w.deep)).toBe(true);
    // The jetty stands out of the water; the gap to it is deep.
    const jet = m.blocks.find((b) => b.kind === 'jetty')!;
    expect(m.water!.some((w) => inArea(w, jet.x + jet.w / 2, jet.y + jet.h / 2))).toBe(false);
    for (const v of ['log', 'gaffer', 'skimmer', 'heavy', 'torch']) expect(p.foes.some((f) => f.variant === v), v).toBe(true);
    expect(p.props.filter((q) => q.kind === 'lamp' || q.kind === 'punt').length).toBeGreaterThanOrEqual(1);
    expect(WAYS.nets.word).toBe('NETS');
    const run = { ...newRun(j), roads: { [i]: took === 'h' ? 'high' : 'low' } } as Run;
    expect(wayGot(j, run.roads, { [i]: 3 })!.pay).toBeCloseTo(0.3);
  });

  it('the room begins with the folk on the jetty and one in a net', () => {
    const { room } = staithe();
    expect(room.survivors.filter(onJetty)).toHaveLength(STAITHE.folk);
    expect(room.survivors.filter(isNetted)).toHaveLength(STAITHE.netted);
    expect(goal(newRun(netsFork().j), room).done).toBe(false);
  });
});

describe('the Staithe: its three jobs', () => {
  it('the carriers lay the log unless killed; across, goblins go over and take folk off the jetty', () => {
    const { run, room } = staithe(), g = logOf(room.map)!;
    far(room);
    quiet(room, (e) => e.variant === 'log');
    const ev = step(room, STAITHE.lay, run, () => !!g.deck);
    expect(g.deck).toBe(true);
    expect(ev.some((e) => e.k === 'logacross')).toBe(true);
    // Two goblins come over it and take folk off.
    expect(room.enemies.filter((e) => e.task?.k === 'board' && !isDead(e))).toHaveLength(2);
    step(room, 25, run);
    expect(room.survivors.filter((s) => s.taken).length).toBeGreaterThan(0);
    expect(run.netlost).toBeGreaterThan(0);
  });

  it('killed before it is across: the log is never laid, and that part is done', () => {
    const { room } = staithe(), g = logOf(room.map)!;
    far(room);
    step(room, 3);
    expect(g.layAt).toBeGreaterThan(0);
    of(room, 'log').hp = 0, (of(room, 'log').act = 'dead');
    step(room, STAITHE.lay);
    expect(g.deck).toBeFalsy();
    expect(g.layLeft).toBeGreaterThan(0);
  });

  it('across: GRAB at its bank end shoves it into the river, goblins on it with it', () => {
    const { room } = staithe(), g = logOf(room.map)!;
    far(room);
    quiet(room, (e) => e.variant === 'log');
    step(room, STAITHE.lay, undefined, () => !!g.deck);
    const end = logEnd(room.map)!;
    at(room, end.x, end.y);
    press(room, 'grabSeq');
    const ev = step(room, 0.3);
    expect(g.ruined).toBe(true);
    expect(g.deck).toBe(false);
    expect(ev.some((e) => e.k === 'logshoved')).toBe(true);
  });

  it('GRAB by one of the netted cuts them free; they stand and follow', () => {
    const { room } = staithe(), s = room.survivors.find(isNetted)!;
    quiet(room, () => false);
    at(room, s.x + 0.6, s.y);
    press(room, 'grabSeq');
    const ev = step(room, 0.2);
    expect(s.netted).toBeFalsy();
    expect(ev.some((e) => e.k === 'cutfree')).toBe(true);
    at(room, s.x + 4, s.y);
    const x0 = s.x;
    step(room, 3);
    expect(Math.abs(s.x - x0)).toBeGreaterThan(0.5);
  });

  it('with the log dealt with, the ring held 45 s: the punt takes them over in trips, each counted saved, the room done', () => {
    const { run, room } = staithe(false), st = room.map.staithe!, j = jettyOf(room.map)!;
    // A goblin left standing far off, so the punt keeps its pace.
    const keep = room.enemies.find((e) => !e.task && !e.variant && e.kind === 'scrapper')!;
    quiet(room, (e) => e === keep);
    Object.assign(keep, { x: room.map.hero.x, y: room.map.hero.y, alert: false, feeding: true });
    const h = smokehouseOf(room.map);
    if (h) Object.assign(h, { held: 0, cry: false }), delete h.torched;
    at(room, st.ring.x, st.ring.y);
    // (Held where they stand: the hero's not to be dragged off by anything.)
    step(room, 1);
    expect(j.holdAt).toBeGreaterThan(0);
    let trips = 0;
    const ev = step(room, STAITHE.hold + 1, run, () => {
      at(room, st.ring.x, st.ring.y);
      Object.assign(keep, { x: room.map.hero.x, y: room.map.hero.y });
      return !!j.over;
    });
    trips = ev.filter((e) => e.k === 'trip').length;
    expect(trips).toBe(STAITHE.trips);
    expect(j.over).toBe(true);
    expect(room.survivors.filter(onJetty)).toHaveLength(0);
    expect(run.saved?.[run.index]).toBe(STAITHE.folk);
    expect(j.saved).toBe(STAITHE.folk);
    // Hold waves came along the bank at each turn but the last.
    expect(room.enemies.filter((e) => e.alert && e !== keep).length).toBeGreaterThanOrEqual(STAITHE.holdWave * (STAITHE.trips - 1));
    expect(wayGot(run.job, run.roads, run.saved)!.pay).toBeCloseTo(STAITHE.perSaved * STAITHE.folk);
  });

  it('stepping out of the ring pauses the punt after a moment of grace', () => {
    const { room } = staithe(false), st = room.map.staithe!, j = jettyOf(room.map)!;
    const keep = room.enemies.find((e) => !e.task && !e.variant && e.kind === 'scrapper')!;
    quiet(room, (e) => e === keep);
    Object.assign(keep, { x: room.map.hero.x, y: room.map.hero.y, feeding: true, alert: false });
    at(room, st.ring.x, st.ring.y);
    step(room, 10);
    far(room);
    step(room, STAITHE.grace + 1);
    expect(j.holdAt).toBe(-1);
    const k = heldK(j, room.time);
    step(room, 5);
    expect(heldK(j, room.time)).toBeCloseTo(k);
  });
});

describe('the Staithe: its pieces', () => {
  it('a hung net catches a foot for about a second, and burns', () => {
    const { room } = staithe(), n = room.map.blocks.find((b) => b.kind === 'hungnet' && !inArea(jettyOf(room.map)!, b.x + 0.1, b.y + 0.1)) ?? room.map.blocks.find((b) => b.kind === 'hungnet')!;
    quiet(room, () => false);
    at(room, n.x + n.w / 2, n.y + n.h / 2);
    const ev = step(room, 0.1);
    expect(ev.some((e) => e.k === 'snagged')).toBe(true);
    expect(room.heroes[0].act).toBe('stun');
    expect(room.heroes[0].netUntil! - room.time).toBeLessThanOrEqual(STAITHE.snag);
    step(room, STAITHE.snag + 0.2);
    expect(room.heroes[0].act).not.toBe('stun');
    // Fire takes it.
    n.burning = room.time;
    step(room, 2);
    expect(n.ruined).toBe(true);
  });

  it('oil on the water drifts downstream, and lit, it lights the jetty it passes under', () => {
    const { room } = staithe(), st = room.map.staithe!, j = jettyOf(room.map)!;
    quiet(room, () => false);
    far(room);
    // A lamp broken at the water's edge: its oil out on the water, drifting.
    const lamp = room.props.find((p) => p.kind === 'lamp')!;
    const w = world(room);
    w.ev.push({ k: 'propbreak', x: lamp.x, y: lamp.y, kind: 'lamp', dx: 0, dy: 0 });
    // The skimmer's pour: lit on the water where it pours.
    w.ev.push({ k: 'impact', x: st.pour[0], y: st.pour[1], kind: 'pour' });
    stepDrift(room.slicks, w);
    const lit = room.slicks.find((s) => s.drift && s.lit >= 0)!, oil = room.slicks.find((s) => s.drift && s.lit < 0)!;
    expect(lit).toBeTruthy();
    expect(oil).toBeTruthy();
    const a = { x: lit.x, y: lit.y };
    step(room, 4);
    const moved = (lit.x - a.x) * st.down[0] + (lit.y - a.y) * st.down[1];
    expect(moved).toBeGreaterThan(1);
    expect(Math.abs((lit.x - a.x) * st.across[0] + (lit.y - a.y) * st.across[1])).toBeLessThan(0.4);
    // Downstream of the pour is the jetty: it catches as the burning oil reaches it.
    step(room, 20, undefined, () => (j.burning ?? -1) >= 0);
    expect(j.burning).toBeGreaterThanOrEqual(0);
  });

  it('a jetty burnt through throws whoever is on it to the bank, the folk too', () => {
    const { room } = staithe(), j = jettyOf(room.map)!, st = room.map.staithe!;
    quiet(room, () => false);
    at(room, j.x + j.w / 2, j.y + j.h / 2);
    Object.assign(j, { burning: room.time, hp: 1 });
    const ev = step(room, 0.5);
    expect(j.ruined).toBe(true);
    expect(ev.filter((e) => e.k === 'thrown').length).toBeGreaterThanOrEqual(1 + STAITHE.folk);
    expect(Math.hypot(room.heroes[0].x - st.ring.x, room.heroes[0].y - st.ring.y)).toBeLessThan(2);
    expect(room.survivors.filter(onJetty)).toHaveLength(0);
  });

  it('the smokehouse alight smokes for 40 s, cries while someone is in it, and falls in on them', () => {
    const { run, room } = staithe(), h = smokehouseOf(room.map)!;
    quiet(room, (e) => e.task?.k === 'kindle');
    far(room);
    expect(h.cry).toBe(true);
    step(room, 20, run, () => (h.burning ?? -1) >= 0);
    expect(h.burning).toBeGreaterThanOrEqual(0);
    step(room, 0.2, run);
    const smoke = room.smokes.find((s) => Math.abs(s.x - (h.x + h.w / 2)) < 0.01)!;
    expect(smoke.until - h.burning!).toBeCloseTo(STAITHE.smoke);
    step(room, STAITHE.smoke + 2, run, () => !!h.ruined);
    expect(h.ruined).toBe(true);
    step(room, 0.1, run);
    expect(run.lost).toBe(1);
    expect(h.cry).toBe(false);
  });
});

describe('the Staithe: the gaffer and the skimmer', () => {
  const hookRoom = () => {
    const { room } = staithe(), g = of(room, 'gaffer'), h = room.heroes[0];
    quiet(room, (e) => e === g || e.variant === 'heavy');
    const [ux, uy] = room.map.staithe!.down, inside = (k: number) => g.x + ux * 3 * k > 1 && g.x + ux * 3 * k < room.map.w - 1 && g.y + uy * 3 * k > 1 && g.y + uy * 3 * k < room.map.h - 1;
    const k = inside(1) ? 1 : -1, dx = ux * k, dy = uy * k;
    Object.assign(h, { x: g.x + dx * 3, y: g.y + dy * 3, fx: -dx, fy: -dy, act: 'idle' });
    Object.assign(g, { alert: true, fx: dx, fy: dy, task: undefined });
    begin(g, 'hook', GAFFER.hook, h, room.events);
    g.attack!.t = g.attack!.windup;
    // (The room's goblins, as a tick sets them: the brute it hauls you to is one of them.)
    OWN_KIT.foes = room.enemies;
    return { room, g, h };
  };
  it('its hook is a thin red lane four tiles long that can be blocked', () => {
    const { room, g, h } = hookRoom(), a = g.attack!;
    expect(a.range).toBe(4);
    expect(a.unblockable).toBe(false);
    h.blocking = true;
    const x0 = h.x;
    hitHero(g, a, h, room.time, room.events, room.heroes);
    expect(room.events.some((e) => e.k === 'block')).toBe(true);
    expect(h.x).toBeCloseTo(x0, 0);
  });
  it('dodged (a Ranger jumping through it), nothing comes of it either; nothing snaps the hook now (no parry)', () => {
    const { room, g, h } = hookRoom();
    Object.assign(h, { weapon: 'longbow', act: 'roll', actT: 0.1 });
    const x0 = h.x;
    hitHero(g, g.attack ?? { ...GAFFER.hook, kind: 'hook', aimed: h.id, t: 0.9, dx: 1, dy: 0, ox: g.x, oy: g.y, cx: g.x, cy: g.y, radius: 0, done: false, range: 4, arc: 6 } as never, h, room.time, room.events, room.heroes);
    expect(room.events.some((e) => e.k === 'dodge')).toBe(true);
    expect(room.events.some((e) => e.k === 'hooked')).toBe(false);
    expect(h.x).toBeCloseTo(x0, 0);
    expect('snapped' in GAFFER).toBe(false);
  });
  it('landed, it hauls you across to its brute', () => {
    const { room, g, h } = hookRoom(), brute = room.enemies.find((e) => e.variant === 'heavy')!, st = room.map.staithe!;
    Object.assign(brute, { x: g.x - (h.x - g.x) / 2 - st.across[0] * 1.2, y: g.y - (h.y - g.y) / 2 - st.across[1] * 1.2 });
    const d0 = Math.hypot(h.x - brute.x, h.y - brute.y);
    hitHero(g, g.attack!, h, room.time, room.events, room.heroes);
    expect(room.events.some((e) => e.k === 'hooked')).toBe(true);
    expect(Math.hypot(h.x - brute.x, h.y - brute.y)).toBeLessThan(Math.min(d0, 1.6));
    expect(h.act).toBe('stun');
  });
  it('the skimmer pours lit oil on the water; frost pins it and spills its pot', () => {
    const { room } = staithe(), s = of(room, 'skimmer');
    quiet(room, (e) => e === s);
    at(room, s.x + 7 * room.map.staithe!.down[0], s.y + 7 * room.map.staithe!.down[1]);
    Object.assign(s, { alert: true, cooldown: 0 });
    const ev = step(room, SKIMMER.pour.windup + 0.5);
    expect(ev.some((e) => e.k === 'windup' && e.kind === 'pour')).toBe(true);
    expect(room.slicks.some((q) => q.drift && q.lit >= 0)).toBe(true);
    // Frost as it winds up for the next: pinned, nothing poured.
    Object.assign(s, { pourAt: -99, cooldown: 0 });
    step(room, 0.2);
    expect(s.attack?.kind).toBe('pour');
    afflict(world(room), s, 'frost', 5);
    expect(s.attack).toBeNull();
    expect((s.pinUntil ?? 0) - room.time).toBeCloseTo(SKIMMER.pin);
    const n = room.slicks.length;
    step(room, SKIMMER.pin - 0.5);
    expect(room.slicks.length).toBeLessThanOrEqual(n);
  });
});

describe('the Staithe on the Barrowfields', () => {
  it('is on about one map in three, in the middle row between the fords, the same from the same seed', { timeout: 120000 }, () => {
    let n = 0, laid = 0;
    for (let d = 1; d <= 90; d++) if (expedPlan(expedition(d)).map.staithe) n++;
    expect(n).toBeGreaterThan(20);
    expect(n).toBeLessThan(40);
    for (let d = 1; d <= 30; d++) {
      const p = expedPlan(expedition(d)), q = expedPlan(expedition(d));
      expect(JSON.stringify(p.map.staithe)).toBe(JSON.stringify(q.map.staithe));
      // (Rolled but with no clear ground between the fords, a map goes without.)
      if (p.map.staithe) expect(staitheRoll(expedition(d).seed)).toBeTruthy(), laid++;
      expect(p.foes.length).toBeLessThanOrEqual(150);
      if (!p.map.staithe) continue;
      const i = p.nodes.indexOf('staithe');
      expect(Math.floor(i / 4)).toBe(1);
      const job = [...p.goals, ...p.sides].find((g) => g.kind === 'staithe')!;
      expect(job).toBeTruthy();
      expect(p.goals.length).toBeGreaterThanOrEqual(2);
      expect(p.goals.length).toBeLessThanOrEqual(3);
      const [a, b] = [p.land.fords[0].x, p.land.fords[1].x];
      expect(job.x).toBeGreaterThan(Math.min(a, b));
      expect(job.x).toBeLessThan(Math.max(a, b));
    }
    expect(laid).toBeGreaterThanOrEqual(5);
  });

  it('a map with the Staithe is otherwise the map it would have been', () => {
    for (let d = 1, seen = 0; d <= 40 && seen < 4; d++) {
      const p = build(expedition(d)), q = build(expedition(d), false), st = p.map.staithe;
      if (!st) {
        expect(JSON.stringify(p)).toBe(JSON.stringify(q));
        continue;
      }
      seen++;
      const near = (o: { x: number; y: number }) => Math.abs(o.x - st.ring.x) < 10 && o.y > st.ring.y - 9 && o.y < st.ring.y + 14;
      const outside = (l: { x: number; y: number }[]) => JSON.stringify(l.filter((o) => !near(o)));
      expect(outside(p.map.rounds)).toBe(outside(q.map.rounds));
      expect(JSON.stringify(p.map.blocks.slice(0, q.map.blocks.length))).toBe(JSON.stringify(q.map.blocks));
      expect(JSON.stringify(p.camps)).toBe(JSON.stringify(q.camps));
      expect(JSON.stringify(p.patrols)).toBe(JSON.stringify(q.patrols));
      expect(p.goals.filter((g) => g.kind !== 'staithe').every((g) => q.goals.some((o) => JSON.stringify(o) === JSON.stringify(g)))).toBe(true);
    }
  });

  it('left alone it plays out: at ALARM 3 the smokehouse catches, at ALARM 5 they are lost', { timeout: 60000 }, () => {
    let d = 1;
    while (!expedPlan(expedition(d)).map.staithe) d++;
    const run = newRun(expedition(d)), r = runRoom(run), h = r.join('a');
    Object.assign(h, { safeT: 1e9 });
    r.setIntent('a', NO_INTENT);
    const x = r.exped!, house = smokehouseOf(r.map)!, j = jettyOf(r.map)!;
    step(r, 1, run);
    expect((house.burning ?? -1) < 0).toBe(true);
    x.level = STAITHE.catchAt;
    r.time = Math.max(r.time, 1);
    step(r, 0.1, run);
    expect(house.burning).toBeGreaterThanOrEqual(0);
    x.level = STAITHE.lostAt;
    step(r, 0.1, run);
    expect(j.over).toBe(true);
    expect(r.survivors.filter((s) => onJetty(s) || isNetted(s))).toHaveLength(0);
    expect(run.netlost).toBeGreaterThanOrEqual(STAITHE.folk + STAITHE.netted);
    const g = [...x.goals, ...x.sides].find((q) => q.kind === 'staithe')!;
    step(r, 0.1, run);
    expect(g.done).toBe(true);
  });
});

describe('the Staithe online', () => {
  it("a friend's screen has the same: the log, the hold, the folk and the oil from the patches; two runs agree", () => {
    const a = staithe(false).room, b = staithe(false).room, enc = new Encoder(), dec = new Decoder();
    for (const r of [a, b]) at(r, r.map.staithe!.ring.x + 3, r.map.staithe!.ring.y);
    let seen = dec.apply(enc.encode(stateOf(a), true), true);
    for (let s = 0; s < 12; s++) {
      step(a, 1), step(b, 1);
      seen = dec.apply(enc.encode(stateOf(a)));
    }
    expect(JSON.stringify(a.survivors)).toBe(JSON.stringify(b.survivors));
    expect(JSON.stringify(a.map.blocks)).toBe(JSON.stringify(b.map.blocks));
    const ga = logOf(a.map)!, gb = seen.blocks.find((q) => q.kind === 'gangway') as unknown as typeof ga;
    expect(gb.layAt).toBe(Math.round((ga.layAt ?? 0) * 100) / 100);
    expect(gb.layLeft).toBe(Math.round((ga.layLeft ?? 0) * 100) / 100);
    expect(seen.survivors.filter((s) => s.stay).length).toBe(a.survivors.filter(onJetty).length);
    expect(seen.survivors.filter((s) => s.netted).length).toBe(a.survivors.filter(isNetted).length);
  });

  it('the log clock is a time, not a count: nothing about it is sent while it ticks', () => {
    const { room } = staithe(), enc = new Encoder();
    far(room);
    step(room, 1);
    enc.encode(stateOf(room), true);
    step(room, 2);
    const p = enc.encode(stateOf(room));
    const g = room.map.blocks.indexOf(logOf(room.map)!);
    expect(p.blocks?.u.some(([k]) => k === '#' + g) ?? false).toBe(false);
  });
});
