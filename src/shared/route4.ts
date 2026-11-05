/**
 * A layout-4 fork's two ways (shared/ways.ts): each road out of the fork is a different kind of room,
 * told apart from where you stand (SMOKE, CRIES, CROWS, DRUMS, QUIET, THE FORD, WEBS). Picked from the
 * ways that suit the country the roads run into and whose scene the job hasn't had yet; each road's room
 * is then rolled as one of the way's rooms with the way's scene. Rolled on the route's own stream.
 */
import { nodesFor, type Step } from './countries.js';
import { board, type Job } from './jobs.js';
import type { Country, RouteNode } from './nodeports.js';
import type { Piece } from './nodes.js';
import type { Rng } from './rng.js';
import type { RoomSpec } from './route.js';
import type { Used } from './routeports.js';
import { WAYS, WAY_KINDS, type WayKind } from './ways.js';

/** The ways that could lead into a room of this step (none twice in a job, so not one whose scene has been). */
export function waysFor(step: Step, pool: Record<Country, RouteNode[]>, used: Used): WayKind[] {
  const nodes = nodesFor(step, pool);
  return WAY_KINDS.filter((k) => {
    const w = WAYS[k];
    return w.countries.includes(step.country) && !used.pieces.has(w.piece) && (!w.nodes || nodes.some((n) => w.nodes!.includes(n)));
  });
}

/**
 * Two different ways and their rooms, or null (the route rolls again). `make` rolls a road's room as
 * one of the way's rooms with its scene: the first road's, then the second's (`other`: the first road).
 */
export function forkWays(rng: Rng, pool: Record<Country, RouteNode[]>, used: Used, step: Step,
  make: (way: WayKind, only: RouteNode[] | undefined, piece: Piece, other?: RoomSpec) => RoomSpec | null): { rooms: [RoomSpec, RoomSpec]; ways: [WayKind, WayKind] } | null {
  const ways = rng.shuffle(waysFor(step, pool, used));
  for (let i = 0; i < ways.length; i++) {
    const a = ways[i], hr = make(a, WAYS[a].nodes, WAYS[a].piece);
    if (!hr) continue;
    for (const b of ways) {
      if (b === a || WAYS[b].piece === WAYS[a].piece || used.pieces.has(WAYS[b].piece)) continue;
      const lr = make(b, WAYS[b].nodes, WAYS[b].piece, hr);
      if (lr) return { rooms: [hr, lr], ways: [a, b] };
    }
    return null;
  }
  return null;
}

/** The day before's jobs to the same place, layout 4 (a job's id says its day: d12-3). */
export function yesterday(job: Job): Job[] {
  const day = Number(/^d(\d+)-/.exec(job.id)?.[1] ?? NaN);
  if (!(day > 1)) return [];
  const same = (j: Job) => j.place.name === job.place.name && j.layout === 4 && !j.exped && j.id !== job.id;
  const out: Job[] = [];
  for (const j of [...board(day - 1), ...board(day - 1, true)]) if (same(j) && !out.some((o) => o.seed === j.seed && o.rooms === j.rooms)) out.push(j);
  return out;
}

/** The same approach, room for room (kind and layout), down either road. */
export function sameWay(a: { high: RoomSpec[]; low: RoomSpec[] }, b: { high: RoomSpec[]; low: RoomSpec[] }): boolean {
  const look = (r: RoomSpec[]) => r.filter((x) => !x.heart).map((x) => `${String(x.node)}/${x.layout}`).join(' ');
  return look(a.high) === look(b.high) || look(a.low) === look(b.low);
}
