// Strings of blows and the held swing (sim/foechain.ts; docs/design/foe-patterns.md slice 1).
import { describe, expect, it } from 'vitest';
import { CHAINS, HOLD } from '../src/shared/foepatterns';
import { Rng } from '../src/shared/rng';
import { SCRAPPER, TICK, VARIANTS } from '../src/shared/tuning';
import { chainUp, nextInChain } from '../src/sim/foechain';
import { begin, newEnemy } from '../src/sim/enemies';
import { ArenaRoom } from '../src/sim/room';
import type { FightEvent } from '../src/sim/types';

/** An Rng whose every draw is `v`. */
const fixed = (v: number) => Object.assign(new Rng(1), { next: () => v });

function scene(kind: 'scrapper' | 'butcher', variant?: 'heavy') {
  const room = new ArenaRoom(3, { scrappers: false, props: false }), h = room.join('me');
  Object.assign(h, { x: 9, y: 12 });
  const e = newEnemy(1, kind, 9, 11);
  if (variant) e.variant = variant;
  return { room, h, e, ev: [] as FightEvent[] };
}

describe('a string of blows', () => {
  it("a scrapper's stab runs on into a stab and a late lunge, each with its own telegraph", () => {
    const { h, e, ev } = scene('scrapper');
    begin(e, 'stab', SCRAPPER.stab, h, ev), chainUp(e, fixed(0));
    expect(e.strung?.length).toBe(2);
    expect(e.attack!.recover).toBeCloseTo(SCRAPPER.stab.recover * CHAINS.quick);
    expect(nextInChain(e, [h], ev)).toBe(true);
    expect(e.attack!.windup).toBeCloseTo(SCRAPPER.stab.windup);
    expect(nextInChain(e, [h], ev)).toBe(true);
    // The last, a beat late, reaching further.
    expect(e.attack!.windup).toBeCloseTo(SCRAPPER.stab.windup * CHAINS.late);
    expect(e.attack!.range).toBeGreaterThan(SCRAPPER.stab.range!);
    expect(nextInChain(e, [h], ev)).toBe(false);
    expect(ev.filter((x) => x.k === 'windup').length).toBe(3);
  });

  it('stops when its hero is down or away, and a lone blow when the roll says so', () => {
    const { h, e, ev } = scene('scrapper');
    begin(e, 'stab', SCRAPPER.stab, h, ev), chainUp(e, fixed(0.99));
    expect(e.strung).toBeUndefined();
    begin(e, 'stab', SCRAPPER.stab, h, ev), chainUp(e, fixed(0));
    h.x = 20;
    expect(nextInChain(e, [h], ev)).toBe(false);
    expect(e.strung).toBeUndefined();
  });

  it("a heavy's cleave can hold full before it lands; its telegraph fills early", () => {
    const { h, e, ev } = scene('scrapper', 'heavy');
    begin(e, 'cleave', VARIANTS.heavy.swing, h, ev), chainUp(e, fixed(0));
    expect(e.attack!.hold).toBeCloseTo(HOLD.least);
    expect(e.attack!.windup).toBeCloseTo(VARIANTS.heavy.swing.windup + HOLD.least);
  });

  it('in a room, a scrapper in reach of a standing hero throws strings over time', () => {
    const room = new ArenaRoom(7, { scrappers: false, props: false }), h = room.join('me');
    Object.assign(h, { x: 9, y: 12, hp: 99999, maxHp: 99999 });
    room.enemies.length = 0;
    const e = Object.assign(newEnemy(1, 'scrapper', 9, 11), { respawns: false, alert: true });
    room.enemies.push(e);
    let strings = 0;
    for (let i = 0; i < Math.round(30 / TICK); i++) {
      room.step();
      if (e.strung?.length === 2) strings++, (e.strung = [...e.strung]);
    }
    expect(strings).toBeGreaterThan(0);
  });
});
