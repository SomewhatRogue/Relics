/**
 * THE DROVER (docs/design/instances.md, Rakehead's square; docs/decisions/instances.md): it drives the roped
 * diggers up the street and stands behind them. While any of them is still roped it's `screened`: a blow lands
 * at DROVER.screen (sim/damage.ts says BLOCKED). A hero standing still beside a roped digger (DROVER.reach) for
 * DROVER.cut seconds cuts the rope: the whole line is free (they stand a moment, then follow whoever's near:
 * sim/survivors.ts), and the Drover and its guards leave the line and come for the party. One holds it while
 * another cuts; alone, you cut first. The clock is on the digger being cut (`cutT`), so a friend's screen draws it.
 */
import { DROVER } from '../shared/tuning';
import { isDead } from './damage';
import type { World } from './elements';
import { players } from './party';

export function stepDrover(w: World, dt: number): void {
  const roped = (w.survivors ?? []).filter((s) => s.led && !s.gone);
  for (const e of w.enemies) if (e.drives) e.screened = roped.length > 0 && !isDead(e);
  if (!roped.length) return;
  const near = (q: { x: number; y: number }) => roped.reduce((a, s) => (Math.hypot(s.x - q.x, s.y - q.y) < Math.hypot(a.x - q.x, a.y - q.y) ? s : a));
  const h = players(w.heroes).find((q) => q.act === 'idle' && !q.moving && (q.z ?? 0) === 0 && Math.hypot(near(q).x - q.x, near(q).y - q.y) <= DROVER.reach);
  const at = h ? near(h) : null;
  for (const s of roped) if (s !== at && s.cutT) s.cutT = 0;
  if (!at) return;
  at.cutT = (at.cutT ?? 0) + dt;
  if (at.cutT < DROVER.cut) return;
  for (const s of roped) (delete s.led), (s.cutT = 0), (s.at = w.now), (s.moving = false);
  for (const e of w.enemies) if (e.task?.k === 'escort' && !isDead(e)) (e.task.quit = true), (e.alert = true);
  for (const e of w.enemies) if (e.drives) e.screened = false;
  w.ev.push({ k: 'cutloose', x: at.x, y: at.y, by: h!.id });
}
