// A far friend's relic or skill shows at once on their own screen (client/ownhero.ts startThrow, 2026-11-27):
// the windup begins the frame it's pressed, the leader's room does it too, and one on cooldown isn't shown.
import { describe, expect, it } from 'vitest';
import { useMap } from '../src/shared/arena';
import { expedition } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import { TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { OwnHero } from '../src/client/ownhero';

const MAP = expedPlan(expedition(2)).map;

function press(cooling: boolean) {
  const host = new ArenaRoom(5, { map: MAP, foes: [] }), sam = host.join('sam');
  Object.assign(sam, { x: MAP.hero.x, y: MAP.hero.y, stamina: 100, safeT: 0, fx: 0, fy: -1, relic: 'javelin' });
  if (cooling) sam.relicReady.javelin = 99;
  const guest = new ArenaRoom(5, { map: MAP, foes: [] }), me = guest.join('me'), own = new OwnHero();
  const lag = 0.08, toHost: [number, Intent, number][] = [], toGuest: [number, Hero, number, number][] = [];
  let intent: Intent = { ...NO_INTENT }, said = '', clock = 0, lastAt = 0, curT = 0, gap = 0.05, ack = -1, sentT = -9, pressAt = -1;
  const ev: FightEvent[] = [], acts: string[] = [], hostActs = new Set<string>();
  while (clock < 2) {
    const dt = 1 / 60;
    clock += dt;
    while (host.time + TICK <= clock) {
      while (toHost.length && toHost[0][0] <= host.time + TICK) {
        const [, i, at] = toHost.shift()!;
        host.setIntent('sam', i), (ack = at);
      }
      host.step(), hostActs.add(sam.act);
      if (host.time - sentT >= 0.05 - 1e-9) (sentT = host.time), toGuest.push([host.time + lag, structuredClone(sam), host.time, ack]);
    }
    while (toGuest.length && toGuest[0][0] <= clock) {
      const [, h, t, a] = toGuest.shift()!;
      Object.assign(me, structuredClone(h), { id: 'me' });
      own.patch(undefined, me, true, t, a, clock);
      gap = Math.min(0.3, Math.max(0.05, clock - lastAt));
      (lastAt = clock), (curT = t);
    }
    if (clock > 0.6 && pressAt < 0) (pressAt = clock), (intent = { ...intent, relicSeq: 1 });
    const s = JSON.stringify(intent);
    if (s !== said) (said = s), toHost.push([clock + lag, { ...intent }, clock]);
    useMap(guest.map);
    own.frame(guest, intent, clock, dt, Math.min(1, (clock - lastAt) / gap), clock, curT + (clock - lastAt), ev, 0);
    if (pressAt >= 0) acts.push(me.act);
  }
  return { first: acts[0], acts, hostThrew: hostActs.has('throw') };
}

describe("a friend's relic, drawn ahead", () => {
  it('starts its windup the frame it is pressed, and the room throws it too', () => {
    const r = press(false);
    expect(r.first).toBe('throw');
    expect(r.hostThrew).toBe(true);
  });
  it('on cooldown, nothing is shown', () => {
    const r = press(true);
    expect(r.acts.includes('throw')).toBe(false);
    expect(r.hostThrew).toBe(false);
  });
});
