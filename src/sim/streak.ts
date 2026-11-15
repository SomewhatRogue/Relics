/**
 * The streak in the fight (shared/streak.ts). What a hero does is counted where it happens (sim/score.ts
 * count); those counts feed this as they come, and once a step the room settles each hero's streak: adds,
 * a break if anything got through, a halving after a quiet spell, and the step it's on (sim/gearstats.ts
 * reads that for the bonus). Only on a job: nothing counts outside one.
 */
import { STREAK, streakStep } from '../shared/streak';
import type { Count } from './score';
import type { FightEvent, Hero } from './types';

const pending = new Map<string, { add: number; broke: boolean }>();

/** From score.ts's count: what this hero just did. */
export function noteStreak(id: string, k: Count, n: number): void {
  const p = pending.get(id) ?? { add: 0, broke: false };
  if (k === 'best') p.add += n >= STREAK.heavyAt ? STREAK.heavy : STREAK.hit;
  else if (k === 'kills') p.add += STREAK.kill;
  else if (k === 'blocks') p.add += STREAK.block;
  else if (k === 'dodges') p.add += STREAK.dodge;
  else if (k === 'taken') p.broke = true;
  else return;
  pending.set(id, p);
}

/** Once a room step: each hero's streak settled; `streak` events at a step up, `streakbreak` at a loud break. */
export function stepStreaks(heroes: Hero[], now: number, ev: FightEvent[]): void {
  for (const h of heroes) {
    const p = pending.get(h.id), was = h.streak ?? 0;
    let n = was;
    if (p?.broke) {
      if (was >= STREAK.loud) ev.push({ k: 'streakbreak', x: h.x, y: h.y, id: h.id, n: was });
      n = 0;
      h.streakAt = now;
    } else if (p?.add) {
      n = was + p.add;
      h.streakAt = now;
    } else if (n > 0 && now - (h.streakAt ?? now) >= STREAK.window) {
      n = Math.floor(n / 2);
      h.streakAt = now;
    }
    const step = streakStep(n);
    if (step > (h.streakStep ?? 0)) ev.push({ k: 'streak', x: h.x, y: h.y, id: h.id, n, step });
    Object.assign(h, { streak: n, streakStep: step, streakBest: Math.max(h.streakBest ?? 0, n) });
  }
  pending.clear();
}
