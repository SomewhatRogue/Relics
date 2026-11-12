/** THE LEECHMAN, the fen's boss of floor 15 (docs/design/deep-layer-bosses.md section 2): its floor, its wading, its line, its leeches, its peat. */
import { describe, expect, it } from 'vitest';
import { deepFloor, DEEP_BOSS } from '../src/shared/deep';
import { LEECHMAN as L, BOSS, HERO, TICK } from '../src/shared/tuning';
import { POOL_SPOTS } from '../src/shared/fenarena';
import { LEECH_NAME } from '../src/shared/bosswords';
import { MUD_SLOW, WADE, currentMap, wadeAt } from '../src/shared/arena';
import { newRun, runRoom } from '../src/sim/run';
import { plateOf } from '../src/sim/bossplate';
import { leechPace, leechRotation } from '../src/sim/leechman';
import { leechState } from '../src/sim/leechhook';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const floor = (n: number) => runRoom(newRun(deepFloor(n, 77, 'x')));
const inBox = (p: { x: number; y: number }, d: { x: number; y: number; w: number; h: number }) => p.x > d.x && p.x < d.x + d.w && p.y > d.y && p.y < d.y + d.h;

describe('THE LEECHMAN: the floor', () => {
  it('floor 15 (and 35) is its pool on every seed; floors 10 and 5 are unchanged', () => {
    for (let seed = 0; seed < 40; seed++) {
      for (const n of [15, 35, 55]) expect(deepFloor(n, seed, 'x'), `${seed}/${n}`).toMatchObject({ arena: 'leechman', boss: LEECH_NAME, objective: 'hunt' });
      expect(deepFloor(10, seed, 'x').arena).toBe('listener');
      expect(deepFloor(5, seed, 'x').arena).toBe(DEEP_BOSS.turn[(1 + seed) % 2]);
      for (const n of [14, 16, 20, 25]) expect(deepFloor(n, seed, 'x').arena).not.toBe('leechman');
    }
  });

  it('builds the pool: shallows, deep channels, reeds, banks, the windlass, a chest, a lone boss on the plate', () => {
    const r = floor(15), m = r.map;
    expect(m.water!.some((w) => !w.deep)).toBe(true);
    expect(m.water!.filter((w) => w.deep)).toHaveLength(POOL_SPOTS.deep.length);
    expect(m.blocks.filter((b) => b.kind === 'reeds' && b.soft).length).toBeGreaterThanOrEqual(3);
    expect(m.windlass).toEqual(POOL_SPOTS.windlass);
    expect(r.chests.some((c) => c.chained)).toBe(true);
    // The way in and the banks are dry.
    expect(wadeAt(m.hero.x, m.hero.y)).toBe(1);
    const e = r.enemies.find((x) => x.boss)!;
    expect(e.boss!.who).toBe('leechman');
    expect(e).toMatchObject({ radius: L.radius, name: LEECH_NAME });
    expect(plateOf(r.enemies, 0)).toMatchObject({ name: LEECH_NAME, pips: 2 });
    expect(floor(35).enemies.find((x) => x.boss)!.maxHp).toBeGreaterThan(e.maxHp);
  });

  it('keeps every move of the rotation under the seeded swap', () => {
    for (const phase of [1, 2] as const) {
      for (let swap = 0; swap < 12; swap++) {
        const r = leechRotation(phase, 1, swap);
        expect([...r].sort()).toEqual([...L.rotation[phase]].sort());
      }
    }
    expect(leechRotation(1, 4, 0)).toHaveLength(L.rotation[1].length + 1);
  });
});

describe('THE LEECHMAN: its moves', () => {
  const setup = (move: string, phase: 1 | 2 = 1, weapon = 'sword') => {
    const r = floor(15), e = r.enemies.find((x) => x.boss)!;
    r.join('me');
    const me = r.heroes.find((x) => x.id === 'me')!;
    Object.assign(me, { hp: 9999, maxHp: 9999, safeT: 0, weapon });
    Object.assign(e, { alert: true, cooldown: 0 });
    e.boss!.phase = phase;
    e.boss!.rot = leechRotation(phase, e.boss!.party, r.bosses!.swaps[phase - 1]).indexOf(move as never);
    return { r, e, me };
  };
  const run = (r: ReturnType<typeof floor>, secs: number, until?: () => boolean, intent: Intent | ((i: number) => Intent) = NO_INTENT) => {
    const ev: FightEvent[] = [];
    for (let i = 0; i < secs / TICK && !(until && until()); i++) (r.setIntent('me', typeof intent === 'function' ? intent(i) : intent), r.step(), ev.push(...r.events));
    return ev;
  };
  const move = (e: { attack: { boss?: unknown } | null }) => e.attack?.boss as string | undefined;

  it('WADE: quick in the shallows, slow on dry peat', () => {
    // The ground it walks, step by step over half a second, facing its hero (so the turn is not in it).
    const walked = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const { r, e, me } = setup('wade');
      Object.assign(e, from, { fx: 1, fy: 0 });
      Object.assign(me, to);
      let len = 0, px = e.x, py = e.y;
      for (let i = 0; i < 0.5 / TICK; i++) (r.setIntent('me', NO_INTENT), r.step(), (len += Math.hypot(e.x - px, e.y - py)), (px = e.x), (py = e.y));
      return len / 0.5;
    };
    // Shallows (y 2.8 to 11.2) against the dry foot bank, the same five tiles from its hero.
    const wet = walked({ x: 3, y: 4 }, { x: 8.2, y: 4 }), dry = walked({ x: 3, y: 12.5 }, { x: 8.7, y: 12.5 });
    expect(wadeAt(3, 4)).toBe(WADE);
    expect(wadeAt(3, 12.5)).toBe(1);
    expect(leechPace(3, 4)).toBe(L.walk.water);
    expect(leechPace(3, 12.5)).toBe(L.walk.dry);
    expect(wet).toBeGreaterThan(dry * 2);
    expect(wet).toBeGreaterThan(L.walk.water * 0.8);
    expect(wet).toBeGreaterThan(HERO.speed * WADE);
    expect(dry).toBeLessThan(L.walk.dry * 1.4);
  });

  it('WADE: it never stands in deep water, going round the channel to a hero across it', () => {
    const { r, e, me } = setup('wade');
    Object.assign(e, { x: 5.6, y: 7 });
    Object.assign(me, { x: 2, y: 7 });
    const deep = r.map.water!.filter((w) => w.deep);
    let closer = 99;
    for (let i = 0; i < 14 / TICK; i++) {
      r.setIntent('me', NO_INTENT);
      r.step();
      for (const d of deep) expect(inBox(e, d), `t${i}`).toBe(false);
      closer = Math.min(closer, Math.hypot(e.x - me.x, e.y - me.y));
      Object.assign(me, { x: 2, y: 7, hp: 9999 });
    }
    // (It does get round to its hero in the end.)
    expect(closer).toBeLessThan(4);
  });

  it('THE LINE: a thin red lane, hauls a hero who stands in it to its feet and the punish follows', () => {
    const { r, e, me } = setup('line');
    Object.assign(e, { x: 6, y: 4.4 });
    Object.assign(me, { x: 6, y: 9 });
    run(r, 4, () => move(e) === 'line');
    expect(e.attack).toMatchObject({ kind: 'hook', unblockable: false, arc: L.line.arc });
    expect(e.attack!.windup).toBeCloseTo(L.line.windup + BOSS.tell, 1);
    const d0 = Math.hypot(e.x - me.x, e.y - me.y);
    const seen: string[] = [];
    const ev = run(r, 4, () => move(e) === 'punish' && seen.push('x') > 0);
    expect(ev.some((x) => x.k === 'hooked')).toBe(true);
    expect(Math.hypot(e.x - me.x, e.y - me.y)).toBeLessThan(d0 - 2);
    expect(move(e)).toBe('punish');
    expect(e.attack).toMatchObject({ kind: 'cleave', unblockable: false });
    expect(e.attack!.windup).toBeLessThan(L.line.windup + BOSS.tell);
  });

  it('THE LINE: a hero who blocks is not hauled', () => {
    const { r, e, me } = setup('line');
    Object.assign(e, { x: 6, y: 4.4 });
    Object.assign(me, { x: 6, y: 9 });
    run(r, 4, () => move(e) === 'line');
    const y0 = me.y;
    const ev = run(r, 2, undefined, { ...NO_INTENT, block: true, blockSeq: 1, ax: 0, ay: -1 });
    expect(ev.some((x) => x.k === 'hooked')).toBe(false);
    expect(ev.some((x) => x.k === 'block')).toBe(true);
    expect(me.y).toBeGreaterThan(y0 - 0.6);
  });

  it('THE LINE: a hero who rolls out of the lane is not hauled', () => {
    const { r, e, me } = setup('line', 1, 'daggers');
    Object.assign(e, { x: 6, y: 4.4 });
    Object.assign(me, { x: 6, y: 9 });
    run(r, 4, () => move(e) === 'line');
    run(r, 2, () => e.attack!.t >= e.attack!.windup - 0.2);
    const ev = run(r, 2, undefined, { ...NO_INTENT, mx: 1, my: 0, ax: 0, ay: -1, rollSeq: 1 });
    expect(ev.some((x) => x.k === 'impact')).toBe(true);
    expect(ev.some((x) => x.k === 'hooked')).toBe(false);
    expect(me.act).not.toBe('stun');
  });

  it('LEECHES: a red circle where they land; a hero caught is drained until they roll, and a roll shakes them off', () => {
    const { r, e, me } = setup('leeches', 1, 'daggers');
    Object.assign(e, { x: 6, y: 4.4 });
    Object.assign(me, { x: 6, y: 9 });
    run(r, 4, () => move(e) === 'leeches');
    expect(e.attack).toMatchObject({ kind: 'slam', unblockable: false, radius: L.leeches.radius });
    expect(Math.hypot(e.attack!.cx - me.x, e.attack!.cy - me.y)).toBeLessThan(0.3);
    expect(e.attack!.windup).toBeCloseTo(L.leeches.windup + BOSS.tell, 1);
    const st = leechState(r.bosses!);
    const ev = run(r, 3, () => st.leeched.has('me'));
    expect(st.leeched.has('me')).toBe(true);
    expect(ev.some((x) => x.k === 'leech' && x.what === 'latch')).toBe(true);
    // They drain on the beat while the hero holds still...
    const hp = me.hp;
    const drain = run(r, 3.2, undefined, { ...NO_INTENT });
    expect(me.hp).toBeLessThan(hp);
    expect(drain.some((x) => x.k === 'leech' && x.what === 'drain')).toBe(true);
    expect(st.leeched.has('me')).toBe(true);
    // ...until they roll.
    const shake = run(r, 1, () => !st.leeched.has('me'), { ...NO_INTENT, mx: 1, ax: 0, ay: -1, rollSeq: 1 });
    expect(st.leeched.has('me')).toBe(false);
    expect(shake.some((x) => x.k === 'leech' && x.what === 'shake')).toBe(true);
    // (Shaken off for good: nothing more drains them while it rests.)
    e.cooldown = 99;
    const later = run(r, 2.5, undefined, { ...NO_INTENT, rollSeq: 1 });
    expect(later.some((x) => x.k === 'leech')).toBe(false);
    expect(st.leeched.has('me')).toBe(false);
  });

  it('LEECHES: the drain never takes the last point', () => {
    const { r, e, me } = setup('leeches');
    Object.assign(e, { x: 6, y: 4.4, cooldown: 99 });
    leechState(r.bosses!).leeched.set('me', 0);
    Object.assign(me, { hp: 3, maxHp: 100 });
    run(r, 1.2);
    expect(me.hp).toBe(1);
  });

  it('PEAT: a striped lane, mud left along it that slows a body, worn away in time', () => {
    const { r, e, me } = setup('peat');
    Object.assign(e, { x: 6, y: 4.4 });
    Object.assign(me, { x: 6, y: 10 });
    run(r, 4, () => move(e) === 'peat');
    expect(e.attack).toMatchObject({ kind: 'cleave', unblockable: true, range: L.peat.range });
    expect(e.attack!.dy).toBeGreaterThan(0.9);
    expect(e.attack!.windup).toBeCloseTo(L.peat.windup + BOSS.tell, 1);
    expect(currentMap().mud ?? []).toHaveLength(0);
    const ev = run(r, 3, () => e.attack!.t >= e.attack!.windup + TICK * 2);
    const mud = currentMap().mud!;
    expect(mud.length).toBeGreaterThanOrEqual(4);
    expect(ev.filter((x) => x.k === 'mud').length).toBe(mud.length);
    // Down the lane, on the banks' side too: a body there is slowed to the mud's pace (and the shallows' too).
    const p = mud[Math.floor(mud.length / 2)];
    expect(wadeAt(p.x, p.y)).toBeLessThanOrEqual(WADE * MUD_SLOW + 1e-9);
    const dry = mud.find((c) => wadeAt(c.x + 0.0001, c.y) === MUD_SLOW);
    if (dry) expect(wadeAt(dry.x, dry.y)).toBe(MUD_SLOW);
    run(r, L.mud.time + 1);
    expect((currentMap().mud ?? []).every((c) => c.until > r.time)).toBe(true);
    expect(currentMap().mud!.length).toBeLessThan(mud.length);
  });

  it('phase 2 at half health: a roar, flood set, quicker, and small ones wading in from the reeds', () => {
    const { r, e, me } = setup('line');
    Object.assign(e, { x: 6, y: 4.4 });
    Object.assign(me, { x: 6, y: 9 });
    run(r, 4, () => move(e) === 'line');
    const slow = e.attack!.windup;
    expect(e.boss!.flood).toBeFalsy();
    e.attack = null;
    e.act = 'chase';
    e.hp = Math.floor(e.maxHp * L.phase2) - 1;
    const before = r.enemies.length;
    run(r, 1);
    expect(e.boss!.phase).toBe(2);
    expect(e.boss!.flood).toBe(true);
    expect(r.enemies.length).toBeGreaterThan(before);
    e.boss!.roarUntil = -9;
    e.boss!.rot = leechRotation(2, e.boss!.party, r.bosses!.swaps[1]).indexOf('line');
    Object.assign(e, { cooldown: 0, alert: true, x: 6, y: 4.4 });
    Object.assign(me, { x: 6, y: 9 });
    run(r, 6, () => move(e) === 'line');
    expect(e.attack).toBeTruthy();
    expect(e.attack!.windup).toBeLessThan(slow);
    expect(L.adds.every[2]).toBeLessThan(L.adds.every[1]);
  });
});
