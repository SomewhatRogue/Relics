/**
 * THE DROVER (docs/design/instances.md, Rakehead's square; docs/decisions/instances.md): it drives the roped
 * diggers up the street and stands behind them. By a roped digger (DROVER.reach) the context button reads CUT FREE
 * (GRAB): pressed, a ring fills on the digger for DROVER.cut s while you stay by them, and the rope's cut: the whole line is free (they stand a moment, then follow whoever's near:
 * sim/survivors.ts), the Drover and its guards leave the line and come for the party, and the Drover is OPEN
 * (blows land at INSTANCE.open.mult for INSTANCE.open.time s). One holds it while
 * another cuts; alone, you cut first. The clock is on the digger being cut (`cutT`), so a friend's screen draws it.
 */
import { DROVER, INSTANCE } from '../shared/tuning';
import { isDead } from './damage';
import type { World } from './elements';
import type { Hero, Survivor } from './types';
import { players } from './party';

/** A roped digger within reach of `h`: the context button reads CUT FREE (client/cluster.ts). */
export const ropedNear = (h: Hero, survivors: Survivor[]) =>
  h.act !== 'down' && !h.out && survivors.some((s) => s.led && !s.gone && Math.hypot(s.x - h.x, s.y - h.y) <= DROVER.reach);

/** Who pressed CUT FREE (GRAB) by a roped digger, and the press counts seen (not saved: a cut starts over). */
const cutting = new WeakMap<object, { seen: Map<string, number>; by?: string }>();

export function stepDrover(w: World, dt: number): void {
  // Anyone near and it leaves its line to come for them.
  for (const e of w.enemies) if (e.drives && e.task?.k === 'escort' && !e.task.quit && !isDead(e) && players(w.heroes).some((h) => h.act !== 'down' && !h.out && Math.hypot(h.x - e.x, h.y - e.y) < DROVER.notice)) (e.task.quit = true), (e.alert = true);
  const roped = (w.survivors ?? []).filter((s) => s.led && !s.gone);
  if (!roped.length) return;
  let st = cutting.get(roped[0]);
  if (!st) for (const s of roped) cutting.set(s, (st ??= { seen: new Map() }));
  const near = (q: { x: number; y: number }) => roped.reduce((a, s) => (Math.hypot(s.x - q.x, s.y - q.y) < Math.hypot(a.x - q.x, a.y - q.y) ? s : a));
  // CUT FREE (GRAB) pressed by a roped digger starts the cut; it goes on while you stay by them.
  for (const h of players(w.heroes)) {
    const prev = st!.seen.get(h.id);
    st!.seen.set(h.id, h.seen.grab);
    if (prev !== undefined && prev !== h.seen.grab && ropedNear(h, roped)) st!.by = h.id;
  }
  const h = players(w.heroes).find((q) => q.id === st!.by), at = h && ropedNear(h, roped) ? near(h) : null;
  if (!at) st!.by = undefined;
  for (const s of roped) if (s !== at && s.cutT) s.cutT = 0;
  if (!at) return;
  at.cutT = (at.cutT ?? 0) + dt;
  if (at.cutT < DROVER.cut) return;
  st!.by = undefined;
  for (const s of roped) (delete s.led), (s.cutT = 0), (s.at = w.now), (s.moving = false);
  for (const e of w.enemies) if (e.task?.k === 'escort' && !isDead(e)) (e.task.quit = true), (e.alert = true);
  // Cut off its line, the Drover is OPEN (INSTANCE.open).
  for (const e of w.enemies) if (e.drives && !isDead(e)) (e.takes = INSTANCE.open.mult), (e.openUntil = w.now + INSTANCE.open.time), w.ev.push({ k: 'opened', x: e.x, y: e.y });
  w.ev.push({ k: 'cutloose', x: at.x, y: at.y, by: h!.id });
}
