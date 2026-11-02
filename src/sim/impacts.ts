/**
 * Bodies hitting bodies: a goblin flying fast (thrown, blasted, knocked) into another hurts both and
 * passes its momentum on, by weight. A thrown scrapper bowls over another scrapper; it barely moves
 * the butcher. Frozen bodies shatter.
 */
import { KNOCK } from '../shared/tuning';
import { damage, frozen, isDead } from './damage';
import { shatter } from './elements';
import type { Enemy, FightEvent } from './types';

export function impacts(enemies: Enemy[], now: number, ev: FightEvent[]): void {
  for (const a of enemies) {
    const speed = Math.hypot(a.kvx, a.kvy);
    // (A spider's pounce is its own legs, not a blow: it doesn't bowl anything over.)
    if (speed < KNOCK.bodySpeed || isDead(a) || a.act === 'carried' || a.attack?.kind === 'pounce') continue;
    for (const b of enemies) {
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (b === a || isDead(b) || b.act === 'carried' || d > a.radius + b.radius + 0.05) continue;
      // Only a body actually driving into the other counts (not two already flying apart).
      const nx = (b.x - a.x) / (d || 1), ny = (b.y - a.y) / (d || 1), rel = (a.kvx - b.kvx) * nx + (a.kvy - b.kvy) * ny;
      if (rel < KNOCK.bodySpeed) continue;
      const n = Math.min(KNOCK.bodyMax, Math.round(rel * KNOCK.bodyDmg)), dx = a.kvx / speed, dy = a.kvy / speed;
      ev.push({ k: 'bodyhit', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      if (isFinite(b.weight) && b.act !== 'pinned') {
        const k = Math.min(1.2, a.weight / b.weight) * 0.8;
        b.kvx += a.kvx * k;
        b.kvy += a.kvy * k;
        b.lastBy = a.lastBy;
      }
      a.kvx *= 0.25;
      a.kvy *= 0.25;
      a.air = 0;
      for (const [o, other] of [[b, a], [a, b]] as const) {
        const ice = frozen(o, now);
        if (damage(o, n, now, ev, { heavy: true, flinch: 0.6, how: 'burst', dx, dy })) continue;
        if (ice) shatter(o, now, ev);
        else if (o.weight <= 1 && o.act !== 'pinned' && other) Object.assign(o, { attack: null, act: 'flinch', actT: 0, actDur: 0.6 });
      }
      break;
    }
  }
}
