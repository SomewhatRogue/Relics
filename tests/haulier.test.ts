/** The Haulier, the Deep's boss of every fifth floor (docs/design/deep-bosses.md). */
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { HAULIER, TICK } from '../src/shared/tuning';
import { goal, newRun, runRoom } from '../src/sim/run';
import { plateOf } from '../src/sim/bossplate';
import { NO_INTENT } from '../src/sim/types';

const floor = (n: number) => runRoom(newRun(deepFloor(n, 77, 'x')));

describe('the Haulier', () => {
  it('every fifth floor is its working: the rail, two carts, the gear, the sump, the adit, the chained chest', () => {
    for (const n of [5, 10, 15, 20]) expect(deepFloor(n, 77, 'x')).toMatchObject({ arena: 'haulier', objective: 'hunt' });
    for (const n of [4, 6, 9, 11]) expect(deepFloor(n, 77, 'x').arena).toBeUndefined();
    const r = floor(5), m = r.map;
    expect(m.rail && m.gear && m.adits?.length && m.water?.length).toBeTruthy();
    expect(r.props.filter((p) => p.kind === 'cart')).toHaveLength(2);
    expect(r.chests.some((c) => c.chained)).toBe(true);
    const h = r.enemies.find((e) => e.boss?.who === 'haulier')!;
    expect(h).toMatchObject({ variant: 'ironhide', radius: HAULIER.radius });
    expect(plateOf(r.enemies, 0)).toMatchObject({ name: h.name, pips: 2 });
  });

  it('is tougher deeper, and the floor is done when it is dead', () => {
    const a = floor(5).enemies.find((e) => e.boss)!, b = floor(20).enemies.find((e) => e.boss)!;
    expect(b.maxHp).toBeGreaterThan(a.maxHp);
    const run = newRun(deepFloor(5, 77, 'x')), r = runRoom(run), h = r.enemies.find((e) => e.boss)!;
    expect(goal(run, r).done).toBe(false);
    Object.assign(h, { hp: 0, act: 'dead' });
    expect(goal(run, r).done).toBe(true);
  });

  it('wakes to a hero walking up, swings, and roars into phase 2 at half', () => {
    const r = floor(5), h = r.enemies.find((e) => e.boss)!;
    r.join('me');
    const me = r.heroes.find((x) => x.id === 'me')!;
    Object.assign(me, { x: h.x, y: h.y + 2, hp: 9999, maxHp: 9999 });
    let swung = false;
    for (let i = 0; i < 6 / TICK && !swung; i++) (r.setIntent('me', NO_INTENT), r.step(), (swung ||= !!h.attack));
    expect(swung).toBe(true);
    h.hp = Math.floor(h.maxHp * HAULIER.phase2) - 1;
    for (let i = 0; i < 3; i++) r.step();
    expect(h.boss!.phase).toBe(2);
  });
});
