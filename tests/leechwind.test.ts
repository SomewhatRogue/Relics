/** THE LEECHMAN's slice 2: the windlass (every class turns it), phase 2's rising water and log, and its loot pool. */
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { LEECHMAN as L, TICK } from '../src/shared/tuning';
import { POOL_SPOTS } from '../src/shared/fenarena';
import { MUD_SLOW, WADE, currentMap, inArea, spanned, wadeAt } from '../src/shared/arena';
import { UNIQUES, poolOf } from '../src/shared/uniques';
import { newRun, runRoom } from '../src/sim/run';
import { leechPace, leechRotation } from '../src/sim/leechman';
import { windState } from '../src/sim/leechwind';
import { logState } from '../src/sim/leechlog';
import { leechState } from '../src/sim/leechhook';
import { poolFor } from '../src/sim/uniquedrop';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const floor = (n: number) => runRoom(newRun(deepFloor(n, 77, 'x')));
const W = POOL_SPOTS.windlass;

function setup(weapon = 'sword', phase: 1 | 2 = 1) {
  const r = floor(15), e = r.enemies.find((x) => x.boss)!;
  r.join('me');
  const me = r.heroes.find((x) => x.id === 'me')!;
  Object.assign(me, { hp: 9999, maxHp: 9999, safeT: 0, weapon, x: W.x + 0.9, y: W.y });
  // (It keeps to itself: far off, resting, unless a test lets it go.)
  Object.assign(e, { alert: true, x: 6, y: 4.4 });
  r.setIntent('me', NO_INTENT);
  r.step();
  e.cooldown = 99;
  if (phase === 2) Object.assign(e.boss!, { phase: 2, flood: true, roarUntil: -9 }), (r.bosses!.phase = 2);
  let seq = 0;
  // (The press counter only moves on a press: every other tick carries the last count.)
  const run = (secs: number, until?: () => boolean, intent: Intent | ((i: number) => Intent) = NO_INTENT) => {
    const ev: FightEvent[] = [];
    for (let i = 0; i < secs / TICK && !(until && until()); i++) {
      const it = typeof intent === 'function' ? intent(i) : intent;
      r.setIntent('me', { ...it, grabSeq: it.grabSeq || (seq ? seq + 100 : 0) });
      r.step();
      ev.push(...r.events);
    }
    return ev;
  };
  const press = () => (seq++, run(0.2));
  return { r, e, me, run, press, st: () => windState(r.bosses!) };
}

describe('THE WINDLASS: every class turns it', () => {
  it.each(['sword', 'daggers', 'longbow', 'staff'])('GRAB beside it takes hold (%s), no "nothing to grab"; GRAB again lets go', (weapon) => {
    const { me, run, press, st } = setup(weapon);
    run(0.3);
    const ev = press();
    expect(st().by).toBe('me');
    expect(ev.some((x) => x.k === 'windlass' && x.what === 'take')).toBe(true);
    expect(ev.some((x) => x.k === 'nograb')).toBe(false);
    run(0.4);
    const ev2 = press();
    expect(st().by).toBe(null);
    expect(ev2.some((x) => x.k === 'windlass' && x.what === 'let')).toBe(true);
    expect(ev2.some((x) => x.k === 'nograb')).toBe(false);
    expect(me.hp).toBeGreaterThan(0);
  });

  it('a GRAB away from the windlass is the hero\'s own (nothing taken hold of)', () => {
    const { me, run, press, st } = setup('daggers');
    Object.assign(me, { x: 6, y: 12 });
    run(0.3);
    press();
    expect(st().by).toBe(null);
  });

  it('held long enough, the shallows drain to mud; THE LINE is not used while dry and it crawls; the water comes back after `dry`', () => {
    const { r, e, me, run, press, st } = setup('sword');
    const m = currentMap();
    run(0.3);
    expect(wadeAt(4, 4)).toBe(WADE);
    expect(leechPace(4, 4)).toBe(L.walk.water);
    press();
    const ev = run(L.windlass.turn + 1, () => !!m.drained);
    expect(m.drained).toBe(true);
    expect(ev.filter((x) => x.k === 'windlass' && x.what === 'turn').length).toBeGreaterThanOrEqual(2);
    expect(ev.some((x) => x.k === 'windlass' && x.what === 'drained')).toBe(true);
    expect(st().by).toBe(null);
    // Mud to walk (not the wade), deep channels still deep, the bank unchanged; it crawls.
    expect(wadeAt(4, 4)).toBe(MUD_SLOW);
    expect(wadeAt(6, 12.5)).toBe(1);
    expect(r.map.water!.filter((w) => w.deep)).toHaveLength(POOL_SPOTS.deep.length);
    expect(leechPace(4, 4)).toBe(L.windlass.crawl);
    expect(leechPace(4, 4)).toBeLessThan(L.walk.dry + 1e-9);
    // THE LINE is passed over while it's dry (it would have been the next).
    e.boss!.rot = 0;
    Object.assign(e, { cooldown: 0, x: 6, y: 4.4 });
    Object.assign(me, { x: 6, y: 9 });
    const lines: string[] = [];
    run(L.windlass.dry - 2, () => (lines.push(String(e.attack?.boss)), !!m.drained === false));
    expect(lines.includes('line')).toBe(false);
    expect(m.drained).toBe(true);
    // The water comes back after `dry`.
    e.cooldown = 99;
    const back = run(L.windlass.dry + 1, () => !m.drained);
    expect(m.drained).toBe(false);
    expect(back.some((x) => x.k === 'windlass' && x.what === 'back')).toBe(true);
    expect(wadeAt(4, 4)).toBe(WADE);
  });

  it('a line wound up as the shallows drain is dropped', () => {
    const { r, e, run, press, st } = setup('sword');
    run(0.3);
    press();
    e.cooldown = 0;
    e.boss!.rot = leechRotation(1, e.boss!.party, r.bosses!.swaps[0]).indexOf('line');
    run(5, () => (e.attack?.boss as string | undefined) === 'line');
    expect(e.attack?.boss as string | undefined).toBe('line');
    st().p = 0.995;
    run(0.5, () => !!currentMap().drained);
    expect(currentMap().drained).toBe(true);
    expect(e.attack?.boss as string | undefined).not.toBe('line');
  });

  it('the cooldown: stuck for `again` s once the water is back, then it turns again', () => {
    const { me, run, press, st } = setup('sword');
    const m = currentMap();
    run(0.3);
    press();
    run(L.windlass.turn + 1, () => !!m.drained);
    run(L.windlass.dry + 1, () => !m.drained);
    expect(m.drained).toBe(false);
    const ev = press();
    expect(st().by).toBe(null);
    expect(ev.some((x) => x.k === 'windlass' && x.what === 'stuck')).toBe(true);
    expect(ev.some((x) => x.k === 'nograb')).toBe(false);
    run(L.windlass.again + 0.5);
    press();
    expect(st().by).toBe('me');
    expect(me.hp).toBeGreaterThan(0);
  });

  it('walking off lets go, and a half-turned windlass slips back', () => {
    const { me, run, press, st } = setup('sword');
    run(0.3);
    press();
    run(1.5);
    expect(st().p).toBeGreaterThan(0.3);
    Object.assign(me, { x: W.x + 4 });
    run(0.2);
    expect(st().by).toBe(null);
    const p = st().p;
    run(1);
    expect(st().p).toBeLessThan(p);
  });

  it('THE LEECHMAN goes for the hero turning it', () => {
    const { r, e, me, run, press } = setup('sword');
    const other = (r.join('you'), r.heroes.find((x) => x.id === 'you')!);
    Object.assign(other, { hp: 9999, maxHp: 9999, x: 6, y: 8 });
    Object.assign(e, { cooldown: 99, x: 6, y: 4.4 });
    run(0.3);
    press();
    // (The other hero is nearer, but it faces the one at the windlass.)
    const d0 = Math.hypot(e.x - me.x, e.y - me.y);
    run(1.5);
    expect(Math.hypot(e.x - me.x, e.y - me.y)).toBeLessThan(d0 - 0.5);
    expect(e.x).toBeLessThan(5.7);
  });
});

describe('THE LEECHMAN: the water rises, and the log', () => {
  const rise = () => {
    const s = setup('sword', 1);
    const before = s.r.map.water!.filter((w) => w.deep).map((w) => ({ ...w }));
    s.e.cooldown = 99;
    s.e.hp = Math.floor(s.e.maxHp * L.phase2) - 1;
    const ev = s.run(1);
    // (The small ones that wade in are not what these are about.)
    s.r.enemies.splice(0, s.r.enemies.length, s.e);
    leechState(s.r.bosses!).nextAdds = Infinity;
    return { ...s, before, ev };
  };

  it('phase 2 widens the deep channels (some shallows turn deep), and the windlass still works', () => {
    const { r, e, me, run, press, before, ev } = rise();
    expect(e.boss!.phase).toBe(2);
    const deep = r.map.water!.filter((w) => w.deep);
    deep.forEach((d, i) => {
      expect(d.w * d.h).toBeGreaterThan(before[i].w * before[i].h);
      expect(inArea(d, before[i].x - 0.3, before[i].y + 1)).toBe(true);
    });
    expect(ev.some((x) => x.k === 'flood')).toBe(true);
    Object.assign(me, { x: W.x + 0.9, y: W.y });
    run(0.3);
    press();
    run(L.windlass.turn + 1, () => !!currentMap().drained);
    expect(currentMap().drained).toBe(true);
    expect(r.map.water!.filter((w) => w.deep)).toHaveLength(deep.length);
  });

  it('with a hero across a channel it walks to the near end and lays a log across it; heroes and it cross on it', () => {
    const { r, e, me, run } = rise();
    const west = r.map.water!.find((w) => w.deep)!;
    e.boss!.roarUntil = -9;
    Object.assign(e, { cooldown: 0, alert: true, x: 6, y: 7.2, hp: e.maxHp });
    e.boss!.rot = leechRotation(2, e.boss!.party, r.bosses!.swaps[1]).indexOf('wade');
    Object.assign(me, { x: 0.8, y: 7.2, hp: 9999 });
    const lg = logState(r.bosses!);
    const ev = run(10, () => !!lg.log, { ...NO_INTENT });
    Object.assign(me, { x: 0.8, y: 7.2 });
    expect(lg.log).toBeTruthy();
    expect(ev.some((x) => x.k === 'log' && x.what === 'lay')).toBe(true);
    const log = lg.log!;
    expect(r.props.some((p) => p.kind === 'log')).toBe(true);
    expect(log.block).toMatchObject({ kind: 'gangway', deck: true });
    expect(log.block.x).toBeLessThan(west.x);
    expect(log.block.x + log.block.w).toBeGreaterThan(west.x + west.w);
    const mid = { x: west.x + west.w / 2, y: log.block.y + log.block.h / 2 };
    expect(spanned(r.map, mid.x, mid.y)).toBe(true);
    // It crosses on it (never standing in the water elsewhere).
    let across = false;
    for (let i = 0; i < 14 / TICK && !across; i++) {
      r.setIntent('me', NO_INTENT);
      r.step();
      Object.assign(me, { x: 0.8, y: 7.2, hp: 9999 });
      if (e.x < west.x) across = true;
    }
    expect(across).toBe(true);
  });

  it('a hero\'s blow knocks the log in; THE LEECHMAN on it goes in too, down, then hauled out; the cooldown', () => {
    const { r, e, me, run } = rise();
    const west = r.map.water!.find((w) => w.deep)!;
    const lg = logState(r.bosses!);
    e.boss!.roarUntil = -9;
    Object.assign(e, { cooldown: 0, alert: true, x: 6, y: 7.2, hp: e.maxHp });
    e.boss!.rot = leechRotation(2, e.boss!.party, r.bosses!.swaps[1]).indexOf('wade');
    Object.assign(me, { x: 0.8, y: 7.2 });
    run(10, () => !!lg.log);
    expect(lg.log).toBeTruthy();
    // It is on the log, and a hero is at its end.
    const cy = lg.log!.block.y + lg.log!.block.h / 2;
    Object.assign(e, { x: west.x + west.w / 2, y: cy, cooldown: 99, attack: null });
    Object.assign(me, { x: west.x - 0.3, y: cy, fx: 1, fy: 0 });
    const ev = run(1.5, () => !lg.log, (i) => ({ ...NO_INTENT, ax: 1, ay: 0, attackSeq: i < 2 ? 1 : 2 }));
    expect(lg.log).toBe(null);
    expect(ev.some((x) => x.k === 'log' && x.what === 'fall' && x.down === true)).toBe(true);
    expect(spanned(r.map, west.x + west.w / 2, cy)).toBe(false);
    expect(r.props.some((p) => p.kind === 'log')).toBe(false);
    expect(e.act).toBe('stunned');
    expect(e.boss!.downUntil).toBeGreaterThan(r.time);
    expect(e.holdUntil).toBeGreaterThan(r.time + L.log.down);
    // Floundering in the water, then hauled out at the nearest bank.
    const out = run(L.log.down + 0.5, undefined);
    expect(out.some((x) => x.k === 'log' && x.what === 'out')).toBe(true);
    expect(west.x < e.x && e.x < west.x + west.w && west.y < e.y && e.y < west.y + west.h).toBe(false);
    // A second log, knocked in right after: it shrugs (not floored again).
    e.boss!.downUntil = -9;
    Object.assign(e, { act: 'chase', cooldown: 99 });
    logState(r.bosses!).layAt = -9;
    logState(r.bosses!).want = null;
    const ch = { ch: west, spot: { x: 0, y: 0 }, near: 0, log: { x: west.x - 1, y: cy - 0.6, w: west.w + 2, h: 1.2 } };
    lg.want = ch;
    run(0.2);
    expect(lg.log).toBeTruthy();
    Object.assign(e, { x: west.x + west.w / 2, y: cy, cooldown: 99, attack: null });
    Object.assign(me, { x: west.x - 0.3, y: cy, fx: 1, fy: 0 });
    const ev2 = run(1.5, () => !lg.log, (i) => ({ ...NO_INTENT, ax: 1, ay: 0, attackSeq: 10 + (i < 2 ? 1 : 2) }));
    expect(ev2.some((x) => x.k === 'log' && x.what === 'shrug')).toBe(true);
    expect(e.boss!.downUntil).toBeLessThanOrEqual(r.time);
  });

  it('a log knocked in with THE LEECHMAN elsewhere floors nothing', () => {
    const { r, e, me, run } = rise();
    const west = r.map.water!.find((w) => w.deep)!;
    const lg = logState(r.bosses!);
    e.boss!.roarUntil = -9;
    Object.assign(e, { cooldown: 0, alert: true, x: 6, y: 7.2, hp: e.maxHp });
    e.boss!.rot = leechRotation(2, e.boss!.party, r.bosses!.swaps[1]).indexOf('wade');
    Object.assign(me, { x: 0.8, y: 7.2 });
    run(10, () => !!lg.log);
    const cy = lg.log!.block.y + lg.log!.block.h / 2;
    Object.assign(e, { x: 6, y: 3.5, cooldown: 99, attack: null });
    Object.assign(me, { x: west.x - 0.3, y: cy, fx: 1, fy: 0 });
    const ev = run(1.5, () => !lg.log, (i) => ({ ...NO_INTENT, ax: 1, ay: 0, attackSeq: i < 2 ? 1 : 2 }));
    expect(ev.some((x) => x.k === 'log' && x.what === 'fall' && !x.down)).toBe(true);
    expect(e.act).not.toBe('stunned');
  });
});

describe('THE LEECHMAN: its pool', () => {
  it('three uniques (weapon, armor, ring), dropped on its death like the Listener\'s', () => {
    const ids = poolOf('leechman');
    expect(ids.map((i) => UNIQUES[i].slot).sort()).toEqual(['armor', 'ring', 'weapon']);
    const r = floor(15), e = r.enemies.find((x) => x.boss)!;
    expect(poolFor(e, 15)).toEqual({ pool: 'leechman', chance: 1 });
  });
});
