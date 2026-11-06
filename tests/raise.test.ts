/** RAISE (sim/raise.ts): a Cleric raising a friend who is out for the job, in the room, on a guest's screen, across a takeover. */
import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { RAISE, TICK, cutMax, HERO } from '../src/shared/tuning';
import { NO_INTENT, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { risable, riseWait } from '../src/sim/raise';
import { refreshHealth } from '../src/sim/gearstats';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { jobJson, loadRoom, saveRoom } from '../src/client/coop';
import { partyTable } from '../src/client/recapparty';
import { blankScore } from '../src/sim/score';
import { newEnemy } from '../src/sim/enemies';

const ticks = (s: number) => Math.round(s / TICK);
const out = (h: Hero) => Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: Infinity, bleeding: true, out: true, selfUp: true });

/** A Cleric (`kyle`, a mace) by a friend who is out (`sam`), and `more` heroes besides, in an empty room. */
function party(more: string[] = [], seed = 3) {
  // (No props: their ids come from a counter shared by every room, so two rooms would differ by them alone.)
  const room = new ArenaRoom(seed, { scrappers: false, props: false });
  room.enemies.length = 0;
  const c = room.join('kyle-0001'), f = room.join('sam-00001');
  Object.assign(c, { x: 9, y: 8, weapon: 'mace' });
  Object.assign(f, { x: 9.8, y: 8 });
  out(f);
  const rest = more.map((id, i) => Object.assign(room.join(id), { x: 9 + i * 0.3, y: 8.6 }));
  return { room, c, f, rest };
}
/** Step `s` seconds with these Intents, gathering the events. */
function run(room: ArenaRoom, s: number, intents: Record<string, Intent> = {}): FightEvent[] {
  const ev: FightEvent[] = [];
  for (const [id, i] of Object.entries(intents)) room.setIntent(id, i);
  for (let k = 0; k < ticks(s); k++) room.step(), ev.push(...room.events);
  return ev;
}
const grab = (n: number): Intent => ({ ...NO_INTENT, grabSeq: n });
const full = (h: Hero) => h.baseHp;

describe('RAISE: a Cleric raising a friend who is out', () => {
  it('a held channel of RAISE.time s: up with part of their health and a lower most for the job', () => {
    const { room, c, f } = party();
    expect(risable(c, room.heroes, room.time)).toBe('ready');
    const ev = run(room, 0.2, { [c.id]: grab(1) });
    expect(ev.some((e) => e.k === 'rising' && e.id === f.id && e.by === c.id)).toBe(true);
    expect(f.riseBy).toBe(c.id);
    run(room, RAISE.time - 0.4);
    expect(f.out).toBe(true);
    const done = run(room, 0.4);
    expect(done.find((e) => e.k === 'risen')).toMatchObject({ id: f.id, by: c.id, n: 25 });
    expect(f.out).toBe(false);
    expect(f.act).toBe('idle');
    expect(f.hpCut).toBe(RAISE.cut);
    expect(f.maxHp).toBe(cutMax(full(f), RAISE.cut));
    expect(f.maxHp).toBe(Math.round(HERO.hp * 0.75));
    expect(f.hp).toBe(Math.round(f.maxHp * RAISE.hp));
    expect(f.risenBy).toEqual([c.id]);
    expect(riseWait(c, room.time)).toBeGreaterThan(RAISE.cooldown - 1);
    // Their own get-up stays spent: next time nobody comes, they're out again.
    expect(f.selfUp).toBe(true);
    // A heal never fills the cut part, and new gear keeps it cut.
    f.hp = 999;
    refreshHealth(f);
    expect(f.maxHp).toBe(cutMax(full(f), RAISE.cut));
    expect(f.hp).toBeLessThanOrEqual(f.maxHp);
  });

  it('broken off by walking off, a swing, a block or a hit; it starts again from nothing', () => {
    for (const [how, broke] of [
      ['walking off', { ...grab(1), mx: 1 }],
      ['a swing', { ...grab(1), attackSeq: 1 }],
      ['a block', { ...grab(1), block: true }],
      ['a hit', null],
    ] as const) {
      const { room, c, f } = party();
      run(room, 2, { [c.id]: grab(1) });
      expect(f.riseBy).toBe(c.id);
      if (broke) room.setIntent(c.id, broke);
      else Object.assign(c, { act: 'hurt', actT: 0, actDur: 0.25 });
      const ev = run(room, 0.6);
      expect(ev.some((e) => e.k === 'risebroke' && e.id === f.id), how).toBe(true);
      expect(f.riseBy).toBe('');
      expect(f.out).toBe(true);
      // Back by them and pressed again: the whole time again, not what was left.
      Object.assign(c, { x: 9, y: 8, act: 'idle', actT: 0 });
      run(room, 1, { [c.id]: { ...(broke ?? grab(1)), mx: 0, block: false, grabSeq: 2 } });
      run(room, RAISE.time - 1.3);
      expect(f.out, how).toBe(true);
      run(room, 0.6);
      expect(f.out, how).toBe(false);
    }
  });

  it('once per friend per Cleric, a cooldown after, and stacking cuts that stop at the floor', () => {
    const { room, c, f, rest } = party(['amy-00001', 'bea-00001', 'cy-000001']);
    const [amy, bea, cy] = rest;
    run(room, RAISE.time + 0.2, { [c.id]: grab(1) });
    expect(f.out).toBe(false);
    // Amy is out too: the cooldown first.
    out(amy);
    Object.assign(amy, { x: 9.4, y: 7.4 });
    expect(risable(c, room.heroes, room.time)).toBe('wait');
    run(room, 0.3, { [c.id]: grab(2) });
    expect(amy.riseBy).toBeFalsy();
    // Cooldown over: Amy, yes; Sam out again, never by the same Cleric.
    run(room, RAISE.cooldown);
    out(f);
    run(room, RAISE.time + 0.2, { [c.id]: grab(3) });
    expect(amy.out).toBe(false);
    run(room, RAISE.cooldown + 0.1);
    expect(risable(c, room.heroes, room.time)).toBe(null);
    run(room, 0.3, { [c.id]: grab(4) });
    expect(f.riseBy).toBeFalsy();
    // A second Cleric (Bea) can: the cut stacks. A third (Cy) at the floor: no more off.
    for (const [cl, cut] of [[bea, 0.5], [cy, 0.5]] as const) {
      Object.assign(cl, { weapon: 'mace', x: 10.4, y: 8 });
      out(f);
      run(room, RAISE.time + 0.2, { [cl.id]: grab(1) });
      expect(f.out).toBe(false);
      expect(f.hpCut).toBe(cut);
      expect(f.maxHp).toBe(cutMax(full(f), RAISE.floor));
      Object.assign(cl, { x: 3, y: 3 });
    }
    expect(f.risenBy).toEqual([c.id, bea.id, cy.id]);
  });

  it('a Cleric only, in a party only: a Warrior can\'t, and a lone Cleric is never out to raise', () => {
    const { room, c, f } = party();
    c.weapon = 'sword';
    expect(risable(c, room.heroes, room.time)).toBe(null);
    run(room, RAISE.time + 0.3, { [c.id]: grab(1) });
    expect(f.out).toBe(true);
    // Alone: a Cleric that goes down gets up in a moment (no out, nobody to raise it).
    const solo = new ArenaRoom(3, { scrappers: false });
    solo.enemies.length = 0;
    const me = Object.assign(solo.join('kyle-0001'), { weapon: 'mace', hp: 0, act: 'down', actT: 0, actDur: HERO.respawn });
    run(solo, HERO.respawn + 0.2, { [me.id]: grab(1) });
    expect(me.out).toBeFalsy();
    expect(me.act).toBe('idle');
    expect(risable(me, solo.heroes, solo.time)).toBe(null);
  });

  it('draws the goblins near to the Cleric while it lasts (not off a Warrior who has them)', () => {
    const { room, c } = party();
    const e = Object.assign(newEnemy(1, 'scrapper', 12, 8), { alert: false });
    const far = newEnemy(2, 'scrapper', 9, 8 + RAISE.draw + 2);
    room.enemies.push(e, far);
    const ev = run(room, 0.2, { [c.id]: grab(1) });
    expect(e.tauntBy).toBe(c.id);
    expect(far.tauntBy).toBeUndefined();
    expect(ev.some((x) => x.k === 'taunt')).toBe(true);
    expect(room.zones.some((z) => z.kind === 'taunt' && z.r === RAISE.draw && z.owner === c.id)).toBe(true);
  });

  it('nothing new goes out a tick: the raise is two fields once, then the cut once', () => {
    const { room, c, f } = party();
    const enc = new Encoder();
    enc.encode(stateOf(room), true);
    const sent: string[][] = [];
    room.setIntent(c.id, grab(1));
    for (let k = 0; k < ticks(RAISE.time + 0.5); k++) {
      room.step();
      const p = enc.encode(stateOf(room));
      sent.push((p.heroes?.u ?? []).flatMap(([, d]) => Object.keys(d).filter((x) => /rise|hpCut|risenBy/.test(x))));
    }
    const all = sent.flat();
    expect(all.filter((x) => x === 'riseBy')).toHaveLength(2);
    expect(all.filter((x) => x === 'riseAt')).toHaveLength(2);
    expect(all.filter((x) => x === 'hpCut')).toHaveLength(1);
    expect(all.filter((x) => x === 'risenBy')).toHaveLength(1);
    expect(all.filter((x) => x === 'riseReadyAt')).toHaveLength(1);
    expect(sent.filter((x) => x.length).length).toBeLessThanOrEqual(2);
    expect(f.out).toBe(false);
  });

  it('is deterministic: the same Intents, the same fight, tick for tick', () => {
    const play = () => {
      const { room, c } = party(['amy-00001']);
      room.enemies.push(newEnemy(1, 'scrapper', 13, 8), newEnemy(2, 'scrapper', 6, 9));
      const seen: string[] = [];
      for (let k = 0; k < ticks(8); k++) {
        room.setIntent(c.id, { ...grab(k > 10 ? 1 : 0), block: k > ticks(5) && k < ticks(5.5) });
        room.step();
        seen.push(jobJson(saveRoom(room)));
      }
      return seen;
    };
    expect(play()).toEqual(play());
  });
});

/** The leader's room as a friend's page reads it: ids swapped (the leader's `me` is `@lead`, theirs is `me`). */
const swapIds = (s: string, mine: string) => s.split('"me"').join('"@lead"').split(`"${mine}"`).join('"me"');

describe('RAISE with a guest Cleric', () => {
  it("the guest's own screen offers RAISE, sees the raise go on from the room's two fields, and the cut", () => {
    const room = new ArenaRoom(3, { scrappers: false });
    room.enemies.length = 0;
    // The leader (`me` in their room) is out; Sam, a guest, is the Cleric.
    const lead = Object.assign(room.join('me'), { x: 9.8, y: 8 }), sam = Object.assign(room.join('sam-00001'), { x: 9, y: 8, weapon: 'mace' });
    out(lead);
    const enc = new Encoder(), dec = new Decoder();
    let view: Hero[] = [];
    const send = (fullP = false) => (view = dec.apply(JSON.parse(swapIds(JSON.stringify(enc.encode(stateOf(room), fullP)), sam.id)), fullP).heroes as unknown as Hero[]);
    send(true);
    const me = () => view.find((h) => h.id === 'me')!, them = () => view.find((h) => h.id === '@lead')!;
    expect(risable(me(), view, room.time)).toBe('ready');
    room.setIntent(sam.id, grab(1));
    for (let k = 0; k < ticks(2); k++) room.step(), send();
    expect(them().riseBy).toBe('me');
    expect((room.time - them().riseAt!) / RAISE.time).toBeCloseTo(2 / RAISE.time, 1);
    expect(risable(me(), view, room.time)).toBe(null);
    for (let k = 0; k < ticks(RAISE.time - 1.8); k++) room.step(), send();
    expect(them().out).toBe(false);
    expect(them().riseBy).toBe('');
    expect(them().hpCut).toBe(RAISE.cut);
    expect(them().maxHp).toBe(cutMax(lead.baseHp, RAISE.cut));
    expect(them().risenBy).toEqual(['me']);
    expect(riseWait(me(), room.time)).toBeGreaterThan(RAISE.cooldown - 1);
  });
});

describe('RAISE across a takeover', () => {
  it('a raise under way handed on mid-channel finishes the same, tick for tick, ids swapped', () => {
    const { room, c, f } = party(['amy-00001']);
    run(room, 1.5, { [c.id]: grab(1) });
    expect(f.riseBy).toBe(c.id);
    // Sam's page takes the job on: the old host (kyle) keeps his id, Sam is `me` now.
    const swap = (s: string, a: string, b: string) => s.split(`"${a}"`).join('"\u0000"').split(`"${b}"`).join(`"${a}"`).split('"\u0000"').join(`"${b}"`);
    const copy = loadRoom(JSON.parse(swap(jobJson(saveRoom(room)), f.id, 'me')));
    for (const r of [room, copy]) r.setIntent(c.id, grab(1));
    for (let k = 0; k < ticks(RAISE.time); k++) room.step(), copy.step();
    expect(swap(jobJson(saveRoom(copy)), 'me', f.id)).toBe(jobJson(saveRoom(room)));
    const fc = copy.heroes.find((h) => h.id === 'me')!;
    expect(fc.out).toBe(false);
    expect(fc.hpCut).toBe(RAISE.cut);
    expect(fc.risenBy).toEqual([c.id]);
    // And after, the cut and who raised them are kept by a save of the copy.
    const again = loadRoom(JSON.parse(jobJson(saveRoom(copy))));
    expect(again.heroes.find((h) => h.id === 'me')!.maxHp).toBe(cutMax(fc.baseHp, RAISE.cut));
  });
});

describe('RAISE in the recap', () => {
  it('shows RAISED and MAX HEALTH LOST only on a job where someone was raised', () => {
    const line = (id: string, s: Partial<ReturnType<typeof blankScore>>) => ({ id, me: id === 'a', name: id, s: { ...blankScore(), ...s } });
    const plain = partyTable([line('a', {}), line('b', {})]);
    expect(plain).not.toContain('MAX HEALTH LOST');
    const raised = partyTable([line('a', { rose: 1 }), line('b', { cut: 25 })]);
    expect(raised).toContain('RAISED');
    expect(raised).toContain('MAX HEALTH LOST');
    expect(raised).toContain('25%');
    // An old board without the counts reads 0, not NaN.
    const old = partyTable([{ id: 'a', me: true, name: 'a', s: { ...blankScore(), rose: undefined, cut: undefined } }]);
    expect(old).not.toContain('NaN');
  });
});
