/** The Haulier's threat (docs/design/boss-threat.md step 3): the leap, the crank's sparks, the wrench, the chain. */
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { HAULIER as H, TICK } from '../src/shared/tuning';
import { newRun, runRoom } from '../src/sim/run';
import { haulRotation } from '../src/sim/haulier';
import { sparkShapes } from '../src/sim/sparkshape';
import type { FightEvent } from '../src/sim/types';
import type { HaulMove } from '../src/shared/haultune';

const setup = (phase: 1 | 2, move: HaulMove) => {
  const r = runRoom(newRun(deepFloor(5, 77, 'x'))), h = r.enemies.find((e) => e.boss)!;
  r.join('me');
  const me = r.heroes.find((x) => x.id === 'me')!;
  Object.assign(me, { hp: 9999, maxHp: 9999, safeT: 0 });
  Object.assign(h, { alert: true, cooldown: 0 });
  h.boss!.phase = phase;
  h.boss!.rot = haulRotation(phase, h.boss!.party, r.bosses!.swaps[phase - 1]).indexOf(move);
  return { r, h, me };
};
const run = (r: ReturnType<typeof runRoom>, secs: number, until?: () => boolean) => {
  const ev: FightEvent[] = [];
  for (let i = 0; i < secs / TICK && !(until && until()); i++) (r.step(), ev.push(...r.events));
  return ev;
};

describe("the Haulier's threat", () => {
  it('leaps at a hero keeping their distance and comes down where the circle was', () => {
    const { r, h, me } = setup(1, 'leap');
    Object.assign(me, { x: h.x + 6, y: h.y });
    run(r, 4, () => h.boss!.move === 'leap' && !!h.attack);
    expect(h.attack).toMatchObject({ kind: 'slam', unblockable: true, radius: H.leap.radius });
    const spot = { x: h.attack!.cx, y: h.attack!.cy };
    expect(Math.hypot(spot.x - me.x, spot.y - me.y)).toBeLessThan(0.2);
    const hp = me.hp, ev = run(r, 3, () => Math.hypot(h.x - spot.x, h.y - spot.y) < 0.1 && h.attack!.t > h.attack!.windup + 0.2);
    expect(ev.some((x) => x.k === 'haulleap')).toBe(true);
    expect(me.hp).toBeLessThan(hp);
  });

  it('passes the leap over when nobody is far enough off', () => {
    const { r, h, me } = setup(1, 'leap');
    Object.assign(me, { x: h.x + 1.5, y: h.y });
    run(r, 2, () => !!h.attack);
    expect(h.boss!.move).not.toBe('leap');
  });

  it('cranks: a striped circle under the hero and two either side, then they burn', () => {
    const { r, h, me } = setup(1, 'crank');
    Object.assign(me, { x: h.x + 4, y: h.y });
    run(r, 4, () => h.boss!.move === 'crank' && !!h.attack);
    const shapes = sparkShapes(h);
    expect(shapes).toHaveLength(1 + H.sparks.extra);
    expect(shapes.every((s) => s.unblockable)).toBe(true);
    expect(Math.hypot(shapes[0].cx - me.x, shapes[0].cy - me.y)).toBeLessThan(0.1);
    const hp = me.hp, ev = run(r, 3, () => !h.boss!.sparks);
    ev.push(...run(r, 0.5));
    expect(ev.filter((x) => x.k === 'sparks')).toHaveLength(shapes.length);
    expect(me.hp).toBeLessThan(hp);
    expect(r.slicks.filter((s) => s.lit >= 0).length).toBeGreaterThanOrEqual(shapes.length);
  });

  it('phase 2: the overhead is followed straight away by the wrench at a hero still close', () => {
    const { r, h, me } = setup(2, 'overhead');
    Object.assign(me, { x: h.x, y: h.y + 2 });
    run(r, 4, () => h.boss!.move === 'overhead' && !!h.attack);
    expect(h.attack!.recover).toBe(H.chainRecover);
    run(r, 6, () => h.boss!.move === 'wrench' && !!h.attack);
    expect(h.boss!.move).toBe('wrench');
    expect(h.attack).toMatchObject({ kind: 'cleave', unblockable: false });
    expect(h.attack!.windup).toBeLessThan(0.8);
  });
});
