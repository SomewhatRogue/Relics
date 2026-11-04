/**
 * Which countries a job's route crosses, in an order that makes sense on the ground (docs/terrain-nodes.md
 * 3.1): out of Wickhold's north gate into the fields (or in at the sewer door), through the place's
 * region (the wood for Greyhollow, the rock for Copperdeep), to its own country. A long job may take a
 * third country on the way (a hamlet by the road, the wood before the fen). Every change of country
 * is a transition room (shared/nodeports.ts JOINS), so the order is the grammar's, never a jump.
 */
import type { Place } from './jobs.js';
import { JOINS, joinOf, type Country, type RouteNode } from './nodeports.js';
import type { Rng } from './rng.js';

/** The place's own country (its heart's). */
export function homeOf(p: Place): Country {
  if (p.region === 'Wickhold' || p.kind === 'mine') return 'under';
  if (p.kind === 'forest') return 'wood';
  if (p.kind === 'marsh' || p.region === 'Fenmere') return 'fen';
  if (p.region === 'Copperdeep') return 'rock';
  return p.kind === 'village' || p.kind === 'ruins' ? 'village' : 'fields';
}
const REGION: Record<string, Country> = { Barrowfields: 'fields', Greyhollow: 'wood', Fenmere: 'fen', Copperdeep: 'rock', Wickhold: 'under' };

/** The shortest walk from one country to another over the joins. */
function walk(a: Country, b: Country): Country[] {
  const prev = new Map<Country, Country | null>([[a, null]]), q: Country[] = [a];
  while (q.length) {
    const c = q.shift()!;
    if (c === b) break;
    for (const j of JOINS) for (const [x, y] of [[j.a, j.b], ...(j.oneWay ? [] : [[j.b, j.a]])] as [Country, Country][]) if (x === c && !prev.has(y)) prev.set(y, c), q.push(y);
  }
  const out: Country[] = [];
  for (let c: Country | null | undefined = b; c; c = prev.get(c)) out.unshift(c);
  return out[0] === a ? out : [a, b];
}

/** The countries in order, from where the job sets out to the place's own. */
export function countriesFor(p: Place, rooms: number, rng: Rng): Country[] {
  // Under Wickhold: in at the sewer door, or out of the gate and in at the outfall on the riverbank.
  const home = homeOf(p), start: Country = p.region === 'Wickhold' && rng.next() < 0.5 ? 'under' : 'fields', via = REGION[p.region] ?? home;
  let seq = [...walk(start, via), ...walk(via, home).slice(1)];
  // Never through a country and back out into the one you left (a farm in the wood's region stays in the fields).
  if (new Set(seq).size < seq.length) seq = walk(start, home);
  if (rooms >= 5 && seq.length < 3) {
    // A third country on a long job: a hamlet by the road out, or the wood before the fen.
    const opts: Country[][] = [];
    if (seq[0] === 'fields' && home !== 'village') opts.push(['village', ...seq]);
    if (home === 'fen' && !seq.includes('wood')) opts.push(['fields', 'wood', 'fen']);
    if (home === 'wood') opts.push(['fields', 'fen', 'wood']);
    if (opts.length) seq = rng.pick(opts);
  }
  return seq;
}

/** One approach room's place in the walk: a room in one country, or the transition between two. */
export interface Step { country: Country; from?: Country }

/**
 * The approach rooms' steps: every transition the walk needs, and the rest of the rooms spread over
 * the countries as plain rooms. If the job's too short for every country, it starts further along the
 * walk; `ok` says whether an arrangement suits the route (a fork wants rooms that can fork, its road
 * rooms two different rooms to choose between). Never fails: at worst every room is the home country's.
 */
export function stepsFor(seq: Country[], count: number, rng: Rng, ok: (s: Step[]) => boolean = () => true): Step[] {
  for (let drop = Math.max(0, seq.length - 1 - count); drop < seq.length; drop++) {
    const walkOf = seq.slice(drop), k = walkOf.length - 1;
    for (let t = 0; t < 12; t++) {
      const plains = new Array(walkOf.length).fill(0);
      for (let i = 0; i < count - k; i++) plains[rng.int(walkOf.length)]++;
      const out: Step[] = [];
      walkOf.forEach((c, i) => {
        if (i > 0) out.push({ country: c, from: walkOf[i - 1] });
        for (let n = 0; n < plains[i]; n++) out.push({ country: c });
      });
      if (ok(out)) return out;
    }
  }
  return Array.from({ length: count }, () => ({ country: seq[seq.length - 1] }));
}

/** The rooms a step can be. */
export function nodesFor(s: Step, pool: Record<Country, RouteNode[]>): RouteNode[] {
  return s.from ? joinOf(s.from, s.country)?.nodes ?? ['track'] : pool[s.country];
}
