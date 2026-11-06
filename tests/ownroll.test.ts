// A guest's own dodge, drawn ahead of the leader's word (client/ownhero.ts), against the leader's room a
// trip away: it must end where the room ends it, and never run past and ease back (party-online's dodge
// step, 2026-11-06). Frames at an uneven headless pace, patches at the leader's 20 a second, lag each way.
import { describe, expect, it } from 'vitest';
import { useMap } from '../src/shared/arena';
import { expedition } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import { TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Hero, type Intent } from '../src/sim/types';
import { OwnHero } from '../src/client/ownhero';

const MAP = expedPlan(expedition(2)).map;

/** The guest's screen, `lag` s each way, frames from `frames` (cycled): the drawn path from the press. */
function dodge(weapon: string, lag: number, frames: number[], phase = 0, hold?: [number, number]) {
  const host = new ArenaRoom(5, { map: MAP, foes: [] }), sam = host.join('sam');
  Object.assign(sam, { x: MAP.hero.x, y: MAP.hero.y, weapon, stamina: 100, safeT: 0, fx: 0, fy: -1 });
  const guest = new ArenaRoom(5, { map: MAP, foes: [] }), me = guest.join('me'), own = new OwnHero();
  // Wire: [arrives at, what] each way.
  const toHost: [number, Intent, number][] = [], toGuest: [number, Hero, number, number][] = [];
  let intent: Intent = { ...NO_INTENT, mx: hold?.[0] ?? 0, my: hold?.[1] ?? 0 }, said = '', saidAt = -9, ack = -1, sentT = -9;
  let clock = 0, fi = 0, lastAt = 0, curT = 0, gap = 0.05, pressAt = -1, stickAt = 0;
  const path: [number, number][] = [];
  const ev: FightEvent[] = [];
  host.setIntent('sam', intent);
  for (let n = 0; clock < 4; n++) {
    const dt = frames[fi++ % frames.length];
    clock += dt;
    // The leader: whatever's arrived, then its ticks up to now, a patch every SEND_EVERY.
    while (host.time + TICK <= clock + phase) {
      while (toHost.length && toHost[0][0] <= host.time + TICK - phase) {
        const [, i, at] = toHost.shift()!;
        host.setIntent('sam', i);
        ack = at;
      }
      host.step();
      if (host.time - sentT >= 0.05 - 1e-9) (sentT = host.time), toGuest.push([host.time - phase + lag, structuredClone(sam), host.time, ack]);
    }
    // The guest: patches arrived, input, then the frame.
    while (toGuest.length && toGuest[0][0] <= clock) {
      const [, h, t, a] = toGuest.shift()!;
      Object.assign(me, structuredClone(h), { id: 'me' });
      own.patch(undefined, me, true, t, a, clock);
      gap = Math.min(0.3, Math.max(0.05, clock - lastAt));
      (lastAt = clock), (curT = t);
    }
    if (clock > 1 && pressAt < 0) (pressAt = clock), (intent = { ...intent, rollSeq: 1 });
    const s = JSON.stringify(intent);
    if (s !== said) (said = s), (saidAt = clock), toHost.push([clock + lag, { ...intent }, clock]);
    useMap(guest.map);
    own.frame(guest, intent, clock, dt, Math.min(1, (clock - lastAt) / gap), saidAt, curT + (clock - lastAt), ev, stickAt);
    if (pressAt >= 0 && clock - pressAt <= 1.6) path.push([me.x, me.y]);
  }
  // Jerks back against the dodge's way, the farthest it ran past the room's end, and where it ended.
  const dx = sam.rollDx, dy = sam.rollDy, end = [sam.x, sam.y];
  let back = 0, worst = 0, past = 0;
  for (let i = 1; i < path.length; i++) {
    const d = (path[i][0] - path[i - 1][0]) * dx + (path[i][1] - path[i - 1][1]) * dy;
    if (d < -0.04) back++;
    worst = Math.min(worst, d);
    past = Math.max(past, (path[i][0] - end[0]) * dx + (path[i][1] - end[1]) * dy);
  }
  const last = path[path.length - 1];
  return { back, worst, past, off: Math.hypot(last[0] - end[0], last[1] - end[1]) };
}

describe("a guest's own dodge", () => {
  const paces = [[0.025, 0.045, 0.03, 0.04, 0.035], [1 / 60], [0.033, 0.028, 0.041], [0.045]];
  it('never runs past where the room ends it, at any frame pace, lag or tick phase', () => {
    for (const w of ['longbow', 'daggers', 'wand', 'rapier'])
      for (const f of paces)
        for (const lag of [0.08, 0.15, 0.22])
          for (const phase of [0, 0.011, 0.023]) {
            const r = dodge(w, lag, f, phase);
            expect(r.past, `${w} ${f} ${lag} ${phase}`).toBeLessThan(0.02);
            expect(r.back, `${w} ${f} ${lag} ${phase}`).toBe(0);
            expect(r.off).toBeLessThan(0.01);
          }
  });
  it('walking on through it, the stick held, never jerks back', () => {
    for (const w of ['daggers', 'rapier', 'wand'])
      for (const f of paces)
        for (const lag of [0.08, 0.15, 0.22]) expect(dodge(w, lag, f, 0.011, [0, -1]).back, `${w} ${f} ${lag}`).toBe(0);
  });
});
