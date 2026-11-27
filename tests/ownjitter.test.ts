// A far friend's own hero walking steadily while the leader's patches come late and bunched (2026-11-27: an
// east-coast friend on a phone, "lagging and rebounding like crazy"). client/ownhero.ts keeps its catch-up
// edge to the leader's clock, so a late patch no longer pushes the hero on and pulls it back.
import { describe, expect, it } from 'vitest';
import { useMap } from '../src/shared/arena';
import { expedition } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import { Rng } from '../src/shared/rng';
import { TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { OwnHero } from '../src/client/ownhero';

const MAP = expedPlan(expedition(2)).map;

/** Walk up for 2.5 s, `lag` each way and up to `jit` more on the way back, in order: jerks back and the widest gap from the room. */
function walk(lag: number, jit: number, seed = 3) {
  const rng = new Rng(seed);
  const host = new ArenaRoom(5, { map: MAP, foes: [] }), sam = host.join('sam');
  Object.assign(sam, { x: MAP.hero.x, y: MAP.hero.y, weapon: 'sword', stamina: 100, safeT: 0, fx: 0, fy: -1 });
  const guest = new ArenaRoom(5, { map: MAP, foes: [] }), me = guest.join('me'), own = new OwnHero();
  const toHost: [number, Intent, number][] = [], toGuest: [number, Hero, number, number][] = [];
  const intent: Intent = { ...NO_INTENT, my: -1 };
  let clock = 0, lastAt = 0, curT = 0, gap = 0.05, ack = -1, sentT = -9, lastArrive = 0, said = false;
  const ev: FightEvent[] = [], ys: number[] = [], off: number[] = [];
  while (clock < 3) {
    const dt = 1 / 60;
    clock += dt;
    while (host.time + TICK <= clock) {
      while (toHost.length && toHost[0][0] <= host.time + TICK) {
        const [, i, at] = toHost.shift()!;
        host.setIntent('sam', i), (ack = at);
      }
      host.step();
      if (host.time - sentT >= 0.05 - 1e-9) {
        sentT = host.time;
        lastArrive = Math.max(lastArrive, host.time + lag + rng.next() * jit);
        toGuest.push([lastArrive, structuredClone(sam), host.time, ack]);
      }
    }
    while (toGuest.length && toGuest[0][0] <= clock) {
      const [, h, t, a] = toGuest.shift()!;
      Object.assign(me, structuredClone(h), { id: 'me' });
      own.patch(undefined, me, true, t, a, clock);
      gap = Math.min(0.3, Math.max(0.05, clock - lastAt));
      (lastAt = clock), (curT = t);
    }
    // (The stick held from the start: said once, as coop.ts does when nothing changes.)
    if (!said) (said = true), toHost.push([clock + lag, { ...intent }, clock]);
    useMap(guest.map);
    own.frame(guest, intent, clock, dt, Math.min(1, (clock - lastAt) / gap), 0, curT + (clock - lastAt), ev, 0);
    if (clock > 0.5 && clock < 2.5) ys.push(me.y), off.push(Math.abs(me.y - sam.y));
  }
  const back = ys.slice(1).filter((y, i) => y > ys[i] + 0.02).length;
  return { back, off: Math.max(...off) };
}

describe('a far friend walking, the patches late and bunched', () => {
  it('walks up steadily on their screen, never pulled back', () => {
    const steady = walk(0.06, 0), jumpy = walk(0.06, 0.2);
    expect(steady.back).toBe(0);
    expect(jumpy.back).toBe(0);
    // (Ahead of the room by about the trip's walking, no more.)
    expect(jumpy.off).toBeLessThan(2);
  });
});
