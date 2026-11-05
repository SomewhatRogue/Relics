/**
 * Layout 3's room plans by node (the open rooms that take any ports, the built-up ones that still run
 * bottom to top, the transitions and the mixed rooms), and its landmark: one a room, beside the track
 * where you see it coming in, whichever way the track runs.
 */
import { LANDMARK_KINDS } from './nodes.js';
import type { RouteNode } from './nodeports.js';
import { offset } from './portkit.js';
import type { Rng } from './rng.js';
import { clearing3, crossroads3, ford3, track3, woodpath3 } from './siteopen.js';
import { lane, strips, yard } from './sitelane.js';
import { burntfarm, campvillage, chapelfields, hamletmine } from './sitemix.js';
import { coppice, carredge, oreroad, villageend, woodedge } from './sitetrans.js';
import { causeway, fenford, minehead, outfall } from './sitewet.js';
import { fits, type Keep, type Site } from './sitekit.js';
import { deepwood, glade, reedbed } from './sitewood4.js';
import { cave, collapse, flooded, orechamber } from './siteunder4.js';
import { mill, orchard, stackyard } from './sitefarm4.js';
import { barrows, churchyard } from './sitechurch.js';
import type { Ground, Routed } from './sites.js';

export const PLANS3: Record<RouteNode, (rng: Rng, g: Ground) => Site> = {
  track: track3, crossroads: crossroads3, clearing: clearing3, woodpath: woodpath3, ford: ford3, lane, strips, yard,
  woodedge, coppice, carredge, oreroad, villageend, causeway, fenford, outfall, minehead, burntfarm, chapelfields, campvillage, hamletmine,
  deepwood, glade, reedbed, flooded, collapse, cave, orechamber, stackyard, mill, orchard, churchyard, barrows,
};

/** The room's one landmark, a few steps off the track a third to two thirds of the way along (any other one goes). */
export function landmark3(site: Site, keep: Keep, r: Routed, rng: Rng): void {
  site.rounds = site.rounds.filter((q) => !LANDMARK_KINDS.includes(q.kind));
  const kind = r.spec.landmark;
  if (!kind) return;
  const rad = kind === 'well' ? 0.5 : kind === 'stone' || kind === 'statue' || kind === 'deadtree' ? 0.45 : 0.3;
  for (let t = 0; t < 60; t++) {
    const pts = offset(r.spine[0], (rng.next() < 0.5 ? -1 : 1) * rng.range(2.4, 3.6 + t / 12), 0.5).filter((p) => p.t > 0.3 && p.t < 0.7);
    const p = pts[rng.int(Math.max(1, pts.length))];
    if (!p) return;
    const { x, y } = p;
    if (!fits(keep, x, y, rad + 0.3) || site.rounds.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + rad + 0.6) || site.blocks.some((b) => x > b.x - rad - 0.6 && x < b.x + b.w + rad + 0.6 && y > b.y - rad - 0.6 && y < b.y + b.h + rad + 0.6)) continue;
    site.rounds.push({ kind, x, y, r: rad });
    return;
  }
}
