/**
 * Hangman's Wood, the atlas's pilot zone (docs/plans/atlas.md sections 2 and 5): its fixed spine and its
 * seeded details, the scenes on the way said in order, the mid-point's fire (saves the run, gets the downed
 * up), the gibbet's winch, the Gospel Oak burning, snares and droppers, Hempen and the relic it leaves,
 * the same fight twice, and a friend's screen getting it from the usual patches with nothing new each tick.
 */
import { describe, expect, it } from 'vitest';
import { hangmansWood } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import { SPINE, ON_THE_WAY } from '../src/shared/hangwood';
import { CHECK, DROPPER, HEMPEN, HOIST, OAK, SNARER, TICK, WINCH } from '../src/shared/tuning';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { isDead } from '../src/sim/damage';
import { begin } from '../src/sim/enemies';
import { expedRoom } from '../src/sim/expedroom';
import { newRun, tally } from '../src/sim/run';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';
import { walkable } from './walk';
import { ZONE_RELICS, jobRelic, wonRelics } from '../src/shared/relicaward';

const job = (d = 3) => hangmansWood(d);
/** A wood with its heroes (who can't be hurt unless `soft`), every goblin but the ones `keep` says gone. */
function wood(d = 3, ids = ['me'], keep: (e: ArenaRoom['enemies'][number]) => boolean = () => false, soft = false): ArenaRoom {
  const room = expedRoom(job(d), ids.length);
  for (const id of ids) {
    const h = room.join(id);
    if (!soft) Object.assign(h, { hp: 9999, maxHp: 9999 });
    room.setIntent(id, NO_INTENT);
  }
  room.enemies = room.enemies.filter(keep);
  return room;
}
const step = (room: ArenaRoom, s: number, each?: () => void): FightEvent[] => {
  const out: FightEvent[] = [];
  for (let n = 0; n < Math.round(s / TICK); n++) room.step(), out.push(...room.events), each?.();
  return out;
};
const put = (h: Hero, x: number, y: number) => Object.assign(h, { x, y, kvx: 0, kvy: 0 });

describe("Hangman's Wood", () => {
  it('has a fixed spine, while the seed moves the trees, the goblins and the chests', () => {
    const a = expedPlan(job(3)), b = expedPlan(job(4));
    expect([a.map.w, a.map.h]).toEqual([72, 48]);
    expect(b.map.hang!.beats).toEqual(a.map.hang!.beats);
    for (const k of ['winch', 'cage', 'check', 'oak', 'out', 'snares'] as const) expect(b.map.hang![k]).toEqual(a.map.hang![k]);
    expect(b.goals.map((g) => [g.kind, g.x, g.y])).toEqual(a.goals.map((g) => [g.kind, g.x, g.y]));
    expect(b.sides.map((g) => [g.kind, g.x, g.y])).toEqual(a.sides.map((g) => [g.kind, g.x, g.y]));
    expect(JSON.stringify(b.map.rounds)).not.toBe(JSON.stringify(a.map.rounds));
    expect(JSON.stringify(b.foes)).not.toBe(JSON.stringify(a.foes));
    expect(JSON.stringify(expedPlan(job(3)))).toBe(JSON.stringify(a));
    expect(a.foes[a.goals[1].foe!]).toMatchObject({ kind: 'butcher', name: 'HEMPEN', noose: true, zoned: true });
    expect(a.foes[a.sides[0].foe!].kind).toBe('brood');
    expect(a.foes.filter((f) => f.variant === 'snarer').length).toBe(3);
    expect(a.foes.filter((f) => f.task?.k === 'perch').length).toBe(3);
  });

  it('can be walked from the way in to every scene, job, the fire and the way out', { timeout: 60000 }, () => {
    for (const d of [1, 3, 6]) {
      const p = expedPlan(job(d)), w = walkable(p);
      for (const b of p.map.hang!.beats) expect(w.reach(b.x, b.y, 2.6), `${d} ${b.kind}`).toBe(true);
      for (const g of [...p.goals, ...p.sides]) expect(w.reach(g.x, g.y, 2.4), `${d} ${g.kind}`).toBe(true);
      expect(w.reach(p.map.hang!.check.x, p.map.hang!.check.y, 1.6)).toBe(true);
      expect(w.reach(p.map.exit!.x + 1.5, 1.2, 1.2)).toBe(true);
    }
  });

  it('says the scenes on the way, one at a time, in the order you come to them', () => {
    const room = wood(), h = room.heroes[0], said: string[] = [];
    // Walk the spine from the way in to Hempen's ground.
    for (const k of ['in', ...ON_THE_WAY] as const) {
      put(h, SPINE[k].x, SPINE[k].y + 1);
      for (const e of step(room, 0.4)) if (e.k === 'exped' && e.what === 'beat') said.push(room.map.hang!.beats[e.i!].kind);
    }
    expect(said).toEqual([...ON_THE_WAY]);
    // Each said once.
    put(h, SPINE.snares.x, SPINE.snares.y);
    expect(step(room, 0.4).some((e) => e.k === 'exped' && e.what === 'beat')).toBe(false);
    expect(ON_THE_WAY.map((k) => Math.hypot(SPINE[k].x - SPINE.in.x, SPINE[k].y - SPINE.in.y))).toEqual([...ON_THE_WAY].map((k) => Math.hypot(SPINE[k].x - SPINE.in.x, SPINE[k].y - SPINE.in.y)).sort((p, q) => p - q));
  });

  it('the fire saves the run: alone, the downs start over and you get up by it', () => {
    const room = wood(3, ['me'], () => false, true), h = room.heroes[0], run = newRun(job());
    run.downs = 2;
    put(h, SPINE.check.x, SPINE.check.y + 1);
    const lit = step(room, CHECK.call + 0.3, () => tally(run, room, room.events, 'me'));
    expect(room.exped!.wood!.check.lit).toBe(true);
    expect(lit.some((e) => e.k === 'exped' && e.what === 'check')).toBe(true);
    expect(run.downs).toBe(0);
    put(h, SPINE.hempen.x - 6, SPINE.hempen.y + 4);
    Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: 3 });
    step(room, 3.2);
    expect(h.act).not.toBe('down');
    expect(Math.hypot(h.x - SPINE.check.x, h.y - SPINE.check.y)).toBeLessThan(2.5);
  });

  it('the fire saves the run: a party all out gets up by it, and the job is not lost', () => {
    const room = wood(3, ['me', 'ana'], () => false, true), [a, b] = room.heroes, run = newRun(job());
    put(a, SPINE.check.x, SPINE.check.y);
    step(room, CHECK.call + 0.3);
    for (const h of [a, b]) Object.assign(put(h, 60, 12), { hp: 0, act: 'down', actT: 0, actDur: Infinity, bleeding: true, out: true });
    step(room, TICK * 2, () => tally(run, room, room.events, 'me'));
    expect(run.failed).toBe(false);
    for (const h of [a, b]) expect([h.act, h.out, Math.hypot(h.x - SPINE.check.x, h.y - SPINE.check.y) < 2.5]).toEqual(['idle', false, true]);
  });

  it('holding the winch winds the cage down; breaking it frees the one inside', () => {
    const room = wood(), h = room.heroes[0], g = room.exped!.goals.find((q) => q.kind === 'winch')!;
    put(h, g.x, g.y + 0.5);
    step(room, WINCH.hold * 0.5);
    expect(g.p).toBeGreaterThan(0.4);
    expect(g.done).toBe(false);
    // Stepping out: a moment's grace, then it stops.
    put(h, g.x + 6, g.y + 4);
    const p = g.p;
    step(room, 3);
    expect(g.p).toBeLessThan(p + 0.1);
    put(h, g.x, g.y + 0.5);
    step(room, WINCH.hold * 0.6);
    expect(g.done).toBe(true);
    const cage = room.props.find((q) => q.kind === 'cage')!;
    expect(Math.hypot(cage.x - room.map.hang!.cage.x, cage.y - room.map.hang!.cage.y)).toBeLessThan(0.5);
  });

  it('the Gospel Oak alight drops burning wood in a striped ring and burns the brood mother out', () => {
    const room = wood(3, ['me'], (e) => e.kind === 'brood'), oak = room.map.blocks[room.map.hang!.oak], brood = room.enemies[0];
    put(room.heroes[0], SPINE.oak.x + 2.5, SPINE.oak.y + 3.2);
    oak.burning = room.time;
    let falls = 0, landed = 0;
    for (const e of step(room, 6, () => (falls = Math.max(falls, oak.falls?.length ?? 0)))) if (e.k === 'oakfall') landed++;
    expect(falls).toBeGreaterThan(0);
    expect(landed).toBeGreaterThanOrEqual(3);
    for (const [x, y] of oak.falls!) {
      const d = Math.hypot(x - (oak.x + oak.w / 2), y - (oak.y + oak.h / 2));
      expect(d).toBeGreaterThan(OAK.r0 - 0.2), expect(d).toBeLessThan(OAK.r1 + 1);
    }
    step(room, 30);
    expect(isDead(brood)).toBe(true);
    expect(room.exped!.sides[0].done).toBe(true);
  });

  it('a snare hoists whoever steps in it until a friend cuts them down; alone, you drop after a while', () => {
    const room = wood(3, ['me', 'ana']), [a, b] = room.heroes, s = room.nooses[0];
    put(a, s.x, s.y), put(b, s.x + 1, s.y);
    const ev = step(room, TICK * 2);
    expect(ev.some((e) => e.k === 'hoisted')).toBe(true);
    expect(a.hoisted).toBe(true);
    expect(room.nooses).toHaveLength(2);
    // Pressing attack does nothing for it.
    room.setIntent('me', { ...NO_INTENT, attackSeq: 1 });
    step(room, 0.5);
    expect(a.hoisted).toBe(true);
    room.setIntent('ana', { ...NO_INTENT, grabSeq: 1 });
    const cut = step(room, TICK * 2);
    expect(cut.some((e) => e.k === 'cutdown')).toBe(true);
    expect(a.hoisted).toBeFalsy();
    // Alone: hoisted the full time, then dropped, hurt.
    const lone = wood(3, ['me']), h = lone.heroes[0], n = lone.nooses[1], hp = h.hp;
    put(h, n.x, n.y);
    step(lone, HOIST.hold - 0.3);
    expect(h.hoisted).toBe(true);
    step(lone, 0.6);
    expect(h.hoisted).toBeFalsy();
    expect(h.hp).toBe(hp - HOIST.drop);
  });

  it('the snarer lays snares in front of whoever it is after', () => {
    const room = wood(3, ['me'], (e) => e.variant === 'snarer' && !!e.task), sn = room.enemies[0], h = room.heroes[0];
    put(h, sn.x - 6, sn.y + 1);
    sn.alert = true;
    if (sn.task?.k === 'busy') sn.task.quit = true;
    const before = room.nooses.length;
    step(room, SNARER.every + 1);
    const mine = room.nooses.filter((n) => n.by === sn.id);
    expect(room.nooses.length).toBeGreaterThan(before);
    expect(mine.length).toBeGreaterThan(0);
    expect(Math.hypot(mine[0].x - h.x, mine[0].y - h.y)).toBeLessThan(SNARER.ahead + 3);
  });

  it('a dropper comes down on the shadow circle where you stood, and hurts whoever stays in it', () => {
    const room = wood(3, ['me', 'ana'], (e) => e.task?.k === 'perch', true), d = room.enemies[0], [a, b] = room.heroes;
    expect(d.z).toBe(1);
    put(a, d.x + 1, d.y + 1.5), put(b, 5, 44);
    step(room, TICK * 2);
    const t = d.task as { at: number; tx: number; ty: number };
    expect(t.at).toBeGreaterThan(room.time);
    expect([t.tx, t.ty]).toEqual([Math.round(a.x * 100) / 100, Math.round(a.y * 100) / 100]);
    const hp = a.hp;
    step(room, DROPPER.fall + 0.1);
    expect(d.z).toBe(0);
    expect(Math.hypot(d.x - t.tx, d.y - t.ty)).toBeLessThan(0.8);
    expect(a.hp).toBe(hp - DROPPER.dmg);
    // One who walked out of the circle is fine.
    const r2 = wood(3, ['me'], (e) => e.task?.k === 'perch', true), d2 = r2.enemies[0], c = r2.heroes[0];
    put(c, d2.x + 1, d2.y + 1.5);
    step(r2, TICK * 2);
    put(c, c.x + DROPPER.r + 1.5, c.y);
    const hp2 = c.hp;
    step(r2, DROPPER.fall + 0.1);
    expect(c.hp).toBe(hp2);
  });

  it('Hempen throws its noose down a lane and hoists whoever it lands on; dead, it leaves a relic every time', () => {
    for (const d of [2, 3, 5]) {
      const room = wood(d, ['me'], (e) => e.name === 'HEMPEN'), hm = room.enemies[0], h = room.heroes[0];
      expect(hm.hp).toBeGreaterThanOrEqual(HEMPEN.hp);
      put(h, hm.x + 4, hm.y);
      Object.assign(hm, { alert: true, fx: 1, fy: 0, cooldown: 0 });
      begin(hm, 'hook', HEMPEN.noose, h, room.events);
      const ev = step(room, 1.4);
      expect(ev.some((e) => e.k === 'hoisted')).toBe(true);
      expect(h.hoisted).toBe(true);
      // Brought down (one blow off it at the last): no relic dropped on the floor; it's the zone's, at the job's end.
      const r2 = wood(d, ['me'], (e) => e.name === 'HEMPEN'), b = r2.enemies[0], me = r2.heroes[0];
      Object.assign(b, { hp: 1, alert: false, feeding: true });
      Object.assign(put(me, b.x + 0.9, b.y), { fx: -1, fy: 0 });
      r2.setIntent('me', { ...NO_INTENT, ax: -1, ay: 0, attackSeq: 1 });
      step(r2, 1.2);
      expect(isDead(b)).toBe(true);
      expect(r2.pickups.some((p) => p.relic)).toBe(false);
    }
  });

  it("the wood won gives its relic once, at the job's end: the grappling hook first, then the wood's pool", () => {
    const run = newRun(job(3));
    expect(run.job.zone).toBe('hangman');
    const first = wonRelics(run, 77, []);
    expect(first.map((r) => r.kind)).toEqual(['hook']);
    expect(run.relicsWon).toHaveLength(1);
    // Asked again for the same run: nothing more.
    expect(jobRelic(run, 78, first)).toBeUndefined();
    // Another run, the hook already owned: one from the wood's pool instead, still just the one.
    const again = wonRelics(newRun(job(4)), 79, first);
    expect(again).toHaveLength(1);
    expect(ZONE_RELICS.hangman.pool).toContain(again[0].kind);
    expect(again[0].kind).not.toBe('hook');
  });

  it('the same fight twice is the same, and a friend sees it from the patches with nothing new each tick', () => {
    const go = () => {
      const r = wood(5, ['me'], () => true, true);
      put(r.heroes[0], SPINE.snares.x - 3, SPINE.snares.y + 2);
      r.setIntent('me', { ...NO_INTENT, mx: 1, my: -0.6 });
      step(r, 8);
      return r;
    };
    // (Chests' and props' ids count up across rooms in one process; the rest is the fight.)
    const same = (r: ArenaRoom) => JSON.stringify({ ...stateOf(r), chests: r.chests.map(({ id: _i, ...c }) => c), props: r.props.map(({ id: _i, ...p }) => p) });
    const a = go(), b = go();
    expect(same(b)).toBe(same(a));
    expect(JSON.stringify(b.exped)).toBe(JSON.stringify(a.exped));
    // A friend: the whole room, then patches; the snares, the perches and the oak's falls come across as they are.
    const room = wood(3, ['me'], () => true), enc = new Encoder(), dec = new Decoder();
    let got = dec.apply(enc.encode(stateOf(room), true), true);
    for (let i = 0; i < 40; i++) room.step(), (got = dec.apply(enc.encode(stateOf(room))));
    expect(JSON.stringify(got.nooses)).toBe(JSON.stringify(room.nooses));
    const perch = (l: Record<string, unknown>[]) => JSON.stringify(l.filter((e) => (e.task as { k?: string })?.k === 'perch').map((e) => [e.id, e.z, e.task]));
    expect(perch(got.enemies)).toBe(perch(room.enemies as unknown as Record<string, unknown>[]));
    // Snares lying still and droppers waiting up their trees: nothing about them goes, tick after tick.
    for (let i = 0; i < 5; i++) {
      room.step();
      const p = enc.encode(stateOf(room));
      expect(p.nooses).toBeUndefined();
      expect(p.blocks).toBeUndefined();
      expect((p.enemies?.u ?? []).filter(([, e]) => 'task' in e)).toHaveLength(0);
    }
    // The oak alight: where its wood will come down reaches the friend as it is.
    room.map.blocks[room.map.hang!.oak].burning = room.time;
    for (let i = 0; i < 50; i++) room.step(), (got = dec.apply(enc.encode(stateOf(room))));
    const oak = room.map.blocks[room.map.hang!.oak], seen = got.blocks[room.map.hang!.oak] as unknown as typeof oak;
    expect(oak.falls!.length).toBeGreaterThan(0);
    expect([seen.falls, seen.nextFall, seen.burning]).toEqual([oak.falls, oak.nextFall, Math.round(oak.burning! * 100) / 100]);
  });
});
