/**
 * Oil on water (Kyle's world effects: "oil on water"; numbers shared/staithetune.ts STAITHE): a slick
 * on a river drifts downstream at the current's pace (shared/waterbody.ts flowAt, the same current the
 * water is painted running with), under a jetty's boards too. Lit, it burns on as it goes (STAITHE.waterBurn)
 * and lights what it passes: wood at the water (a jetty, its nets, a rack, a punt's moorings), other oil.
 * The skimmer's pot poured on the water goes up as it lands; a lamp broken at the water's edge spills
 * its oil on the water unlit.
 *
 * Its place goes to friends in steps (STAITHE.step), not every tick: their screens ease it along.
 */
import { currentMap, inArea } from '../shared/arena';
import { flowAt } from '../shared/waterbody';
import { slickFor } from '../shared/sky';
import { STAITHE, TICK, TORCH } from '../shared/tuning';
import { ignite, nearest, wood } from './catching';
import type { World } from './elements';
import { light, slickId, type Slick } from './oil';

const exact = new WeakMap<Slick, { x: number; y: number }>();
const STEP = 0.3;

/** A slick put on the water at (x, y), lit or not. */
export function onWater(slicks: Slick[], x: number, y: number, now: number, lit: boolean): Slick {
  const v = flowAt(currentMap(), x, y, STAITHE.drift), s: Slick = { id: slickId(), x, y, r: STAITHE.slickR, until: now + 60, lit: lit ? now : -1, drift: v };
  if (lit) s.burn = STAITHE.waterBurn * slickFor(currentMap().theme);
  slicks.push(s);
  return s;
}

/** Each tick: new oil on the water, the drift, and what burning oil on the water lights. */
export function stepDrift(slicks: Slick[], w: World): void {
  const m = currentMap(), now = w.now;
  for (const e of w.ev) {
    if (e.k === 'impact' && e.kind === 'pour') onWater(slicks, e.x, e.y, now, true), w.ev.push({ k: 'oilup', x: e.x, y: e.y });
    // A lamp broken by the water: its oil out on the water, a step toward the river.
    if (e.k === 'propbreak' && e.kind === 'lamp' && m.staithe) {
      const [ax, ay] = m.staithe.across, at = { x: e.x + ax * 1.1, y: e.y + ay * 1.1 };
      onWater(slicks, at.x, at.y, now, false), w.ev.push({ k: 'slick', x: at.x, y: at.y });
    }
  }
  for (const s of slicks) {
    if (!s.drift) continue;
    const q = exact.get(s) ?? { x: s.x, y: s.y }, [fx, fy] = flowAt(m, q.x, q.y, STAITHE.drift);
    // Under the jetty's boards it goes on as it was; at the bank or a still pool it stops.
    const deck = m.blocks.some((b) => b.deck && !b.ruined && inArea(b, q.x, q.y)), [vx, vy] = fx || fy ? [fx, fy] : deck ? s.drift : [0, 0];
    (q.x += vx * TICK), (q.y += vy * TICK);
    exact.set(s, q);
    if (Math.hypot(q.x - s.x, q.y - s.y) >= STEP) (s.x = Math.round(q.x * 100) / 100), (s.y = Math.round(q.y * 100) / 100);
    if (q.x < -1 || q.y < -1 || q.x > m.w + 1 || q.y > m.h + 1) s.until = now;
    if (s.lit < 0 || now - s.lit >= (s.burn ?? TORCH.burn)) continue;
    for (const b of m.blocks) if (wood(b) && b.kind !== 'gangway' && nearest(b, q.x, q.y)[2] <= s.r * 0.75) ignite(b, w);
    for (const o of slicks) if (o !== s && o.lit < 0 && Math.hypot(o.x - q.x, o.y - q.y) <= o.r + s.r * 0.6) light(o, now, w.ev);
  }
}
