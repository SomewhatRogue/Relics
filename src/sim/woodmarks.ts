/**
 * Who to follow in the wood, marked (Kyle, 2026-11-27: since the trees came in "things are crowded and people got
 * lost, especially when following the guard to the town"): a gold mark over Hew while the goal says follow him,
 * over Orla once she leads you west, and on the road out when there's no one to follow. client/questmarks.ts draws
 * them, and points to the edge when they're out of sight.
 */
import { ROAD_OUT } from '../shared/wood';
import type { ArenaRoom } from './room';
import type { Target } from './targets';
import type { WoodState } from './wood';
import { orla } from './woodguard';
import { hew } from './woodkit';

export function woodTargets(w: WoodState | null, room: ArenaRoom): Target[] {
  if (!w) return [];
  const road: Target = { kind: 'out', x: ROAD_OUT.x + 1, y: ROAD_OUT.y + ROAD_OUT.h / 2 };
  if (w.stage === 5) {
    if (!w.relic) return [road];
    const n = orla(room), lead = w.guard?.phase === 'stick' || w.guard?.phase === 'lead';
    return n && lead ? [{ kind: 'folk', x: n.x, y: n.y }] : [];
  }
  // (On the way to the next lesson, and on the way to the hut: Hew walks ahead.)
  const n = hew(room);
  return n && !w.entered && w.stage > 0 ? [{ kind: 'folk', x: n.x, y: n.y }] : [];
}
