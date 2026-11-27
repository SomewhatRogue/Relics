// Foe patterns, slice 3 (sim/foethrow.ts): stones, fire pots, the drag, the whirl and volleys.
import { describe, expect, it } from 'vitest';
import { POT, STONE, WHIRL } from '../src/shared/foepatterns';
import { Rng } from '../src/shared/rng';
import { ARCHER, TICK } from '../src/shared/tuning';
import { begin, newEnemy } from '../src/sim/enemies';
import { throwAt, volleyWith, whirlAt } from '../src/sim/foethrow';
import { ArenaRoom } from '../src/sim/room';
import type { FightEvent } from '../src/sim/types';

const fixed = (...v: number[]) => { let i = 0; return Object.assign(new Rng(1), { next: () => v[Math.min(i++, v.length - 1)] }); };

function yard() {
  const room = new ArenaRoom(4, { scrappers: false, props: false }), h = room.join('me');
  Object.assign(h, { x: 10, y: 12, hp: 9999, maxHp: 9999 });
  room.enemies.length = 0;
  return { room, h, ev: [] as FightEvent[] };
}

describe('goblins out of reach', () => {
  it('a scrapper throws a stone: a short red line at you', () => {
    const { h, ev } = yard(), e = Object.assign(newEnemy(1, 'scrapper', 10, 7), { fx: 0, fy: 1, cooldown: 0 });
    expect(throwAt(e, h, 5, 1, fixed(0.99, 0), 0, ev)).toBe(true);
    expect(e.attack).toMatchObject({ kind: 'shot', stone: true, dmg: STONE.spec.dmg });
  });
  it('now and then a fire pot: it lands where you stand and goes up after its fuse', () => {
    const { room, h } = yard(), e = Object.assign(newEnemy(1, 'scrapper', 10, 8), { fx: 0, fy: 1, cooldown: 0, respawns: false, alert: true });
    room.enemies.push(e);
    expect(throwAt(e, h, 4, 1, fixed(0), 0, [])).toBe(true);
    expect(e.attack).toMatchObject({ kind: 'lob', pot: true, cx: 10, cy: 12 });
    let lit = -1;
    for (let i = 0; i < Math.round(4 / TICK); i++) {
      room.step();
      const s = room.slicks[0];
      if (s && s.lit >= 0 && lit < 0) lit = room.time;
    }
    expect(room.slicks.length).toBeGreaterThan(0);
    expect(lit).toBeGreaterThan(POT.fuse);
  });
  it("a heavy drags its cleaver along a long thin line", () => {
    const { h, ev } = yard(), e = Object.assign(newEnemy(1, 'scrapper', 10, 8), { variant: 'heavy' as const, fx: 0, fy: 1, cooldown: 0 });
    expect(throwAt(e, h, 4, 1, fixed(0), 0, ev)).toBe(true);
    expect(e.attack!.range).toBeGreaterThan(5);
    expect(e.attack!.arc).toBeLessThan(15);
  });
});

describe('the whirl', () => {
  it('a ring round it, three hits, turning as it goes, then dizzy', () => {
    const { room, h } = yard(), e = Object.assign(newEnemy(1, 'butcher', 10, 11), { respawns: false, alert: true, cooldown: 0 });
    room.enemies.push(e);
    expect(whirlAt(e, h, fixed(0), [])).toBe(true);
    expect(e.attack).toMatchObject({ kind: 'slam', spin: true, radius: WHIRL.first.radius });
    let hits = 0, turned = false;
    const f0 = Math.atan2(e.fy, e.fx);
    for (let i = 0; i < Math.round(3 / TICK); i++) {
      room.step();
      hits += room.events.filter((x) => x.k === 'impact' && x.kind === 'slam').length;
      if (Math.abs(Math.atan2(e.fy, e.fx) - f0) > 0.5) turned = true;
    }
    expect(hits).toBe(3);
    expect(turned).toBe(true);
  });
});

describe('volleys', () => {
  it('when one archer shoots, the others near it that are ready shoot at the same hero', () => {
    const { h, ev } = yard();
    const a = Object.assign(newEnemy(1, 'scrapper', 10, 5), { bow: true, cooldown: 0 }), b = Object.assign(newEnemy(2, 'scrapper', 12, 5), { bow: true, cooldown: 0 });
    begin(a, 'shot', ARCHER.shot, h, ev);
    volleyWith(a, h, [a, b], fixed(0), ev);
    expect(b.attack).toMatchObject({ kind: 'shot', aimed: h.id });
  });
});
