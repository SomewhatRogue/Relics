/**
 * An expedition's map (Kyle, 2026-11-04: "the much more robust big map raid sort of mode, similar to
 * Helldivers"): the Barrowfields as one open map of 96 by 72 tiles, 4 by 3 nodes of 24 (each 2 by 2 of
 * the load test's chunks), built from the job's seed alone on every screen (the map is never sent).
 *
 * The river and its fords, the roads, the way in and the way out (shared/expedland.ts); then the jobs:
 * two or three of the six main ones (expedcamps.ts GoalKind), each in its own camp or at the barrows,
 * and a side job or two (a cache, a wayside shrine to pray at); the ruined hamlet with houses to go into;
 * the wood's edge, fields and banks, each with a set piece (expedfill.ts); patrols on the roads; and the
 * rest of the goblins in small knots, none near the way in.
 */
import type { GameMap } from './arena.js';
import { barrows, cache, camp, type Camp, type GoalKind, type GoalSpot } from './expedcamps.js';
import { bank, fields, grove, hamlet, scene, woodedge } from './expedfill.js';
import { claim, COLS, free, MH, MW, newKit, NODE, ROWS, spotIn, type Kit, type P } from './expedkit.js';
import { layLand, yOn, type Land } from './expedland.js';
import { flocksOn, packAll, PACK0, type Band } from './expedpacks.js';
import { settle } from './houses.js';
import type { Job } from './jobs.js';
import { PIECES, type Piece } from './nodes.js';
import { Rng } from './rng.js';
import { THEMES, type Foe, type RoomPlan } from './terrain.js';
import { lightFor, timeOf } from './timeofday.js';
import { EXPED, EXPED_PACKS } from './tuning.js';
import { expedSky, themeUnder } from './expedsky.js';
import { layExpedStaithe, staitheRoll } from './expedstaithe.js';
import { inArea } from './arena.js';
import { woodPlan } from './hangwood.js';

export type NodeKind = 'in' | 'out' | 'hamlet' | 'camp' | 'barrows' | 'woodedge' | 'fields' | 'bank' | 'staithe';
export const GOALS: GoalKind[] = ['larder', 'engine', 'prisoners', 'dens', 'shrine', 'butcher'];
export interface Patrol { foes: number[]; path: P[] }
export interface ExpedPlan extends RoomPlan {
  nodes: NodeKind[]; land: Land; camps: Camp[]; goals: GoalSpot[]; sides: GoalSpot[]; patrols: Patrol[];
  /** The way out's ring (the beacon), and open ground for whatever comes later (patrols, waves). */
  zone: P; open: P[];
}

const dist = (a: number, b: number) => Math.abs((a % COLS) - (b % COLS)) + Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS));
const mid = (i: number): P => ({ x: (i % COLS) * NODE + NODE / 2, y: Math.floor(i / COLS) * NODE + NODE / 2 });

/** The map and all on it, from the job's seed. Kept by seed: every screen and the sim ask for it. */
const kept = new Map<string, ExpedPlan>();
export function expedPlan(job: Job): ExpedPlan {
  const key = `${job.exped}:${job.seed}`;
  let p = kept.get(key);
  // (Hangman's Wood is a curated zone on the same kit: shared/hangwood.ts.)
  if (!p) (kept.size > 4 && kept.clear()), kept.set(key, (p = job.exped === 'hangmans' ? woodPlan(job) : build(job)));
  // (A fresh copy each time: a room changes its map as it's played.)
  return JSON.parse(JSON.stringify(p)) as ExpedPlan;
}

/** Built from scratch (`staithe` false: as if the seed never rolled it; tests compare the two). */
export function build(job: Job, staithe = true): ExpedPlan {
  const rng = new Rng(job.seed * 7919 + 33), k = newKit(rng), land = layLand(k);
  const inI = land.ins.r * COLS + land.ins.c, outI = land.ext.c;
  // (Far enough down the drove road that the whole of the beacon's ring is on the map.)
  const zone = { x: land.ext.x, y: Math.max(6.5, EXPED.extractR + 1.5) };
  // Room to land at the way in, and to hold the way out.
  claim(k, land.ins.x, land.ins.y, 6), claim(k, zone.x, zone.y, EXPED.extractR + 1.2);
  const nodes: NodeKind[] = Array.from({ length: COLS * ROWS }, (_, i) => (Math.floor(i / COLS) === 0 ? 'woodedge' : Math.floor(i / COLS) === 1 ? 'bank' : 'fields'));
  nodes[inI] = 'in', (nodes[outI] = 'out');
  const left = () => nodes.map((n, i) => i).filter((i) => !['in', 'out', 'hamlet', 'camp', 'barrows'].includes(nodes[i]));
  // The jobs: two or three of the six, never the same twice.
  const want = rng.shuffle([...GOALS]).slice(0, rng.next() < 0.25 ? 2 : 3);
  // The hamlet on a road (top or bottom row), not next to the way in.
  const hamI = rng.pick(left().filter((i) => Math.floor(i / COLS) !== 1 && dist(i, inI) >= 2).concat(left().filter((i) => Math.floor(i / COLS) !== 1)).slice(0, 3));
  nodes[hamI] = 'hamlet';
  // Camps spread far from the way in and from each other: one for each camp job and one or two more.
  const campJobs = want.filter((g) => g !== 'shrine'), campIs: number[] = [];
  for (let n = campJobs.length + 1 + (rng.next() < 0.5 ? 1 : 0); n > 0; n--) {
    const best = left().sort((a, b) => score(b) - score(a))[0];
    if (best === undefined) break;
    campIs.push(best), (nodes[best] = 'camp');
  }
  function score(i: number): number {
    return dist(i, inI) * 2 + Math.min(9, ...campIs.map((j) => dist(i, j))) * 1.5 + rng.next();
  }
  const barI = want.includes('shrine') || rng.next() < 0.6 ? left().sort((a, b) => dist(b, inI) - dist(a, inI))[0] : undefined;
  if (barI !== undefined) nodes[barI] = 'barrows';
  // The jobs' places, the big ones first (they want the room).
  const goals: GoalSpot[] = [], camps: Camp[] = [], bands: Band[] = [], open: number[] = [];
  campIs.forEach((i, j) => {
    const g = campJobs[j] ?? null, c = centre(k, i);
    const made = camp(k, c, g, job.boss ?? 'MAWL', camps.length);
    camps.push(made.camp);
    // A named butcher's camp has its centrepiece: the band at its fire backs it, no second big one.
    bands.push(g === 'butcher' ? { idx: made.band, ground: 'camp', cap: 1, not: ['butcher'], keep: true } : { idx: made.band, ground: 'camp', cap: EXPED_PACKS.specials.camp, keep: true });
    if (made.spot) goals.push(made.spot);
  });
  if (barI !== undefined) {
    const at = centre(k, barI, 6);
    const sh = barrows(k, at);
    if (want.includes('shrine')) goals.push(sh);
    else goals.push({ ...sh, kind: 'pray' } as GoalSpot);
  }
  const sides = goals.filter((g) => g.kind === 'pray');
  const mains = goals.filter((g) => g.kind !== 'pray');
  const ham = hamlet(k, hamI % COLS, Math.floor(hamI / COLS), Math.floor(hamI / COLS) === 0 ? land.north : land.south);
  // A cache: somewhere quiet in the wood or a far field.
  const far = left().concat([outI]).sort((a, b) => dist(b, inI) - dist(a, inI));
  const cI = far[0] ?? outI, cm = mid(cI), cs = cache(k, cm.x - 10, cm.y - 10, cm.x + 10, cm.y + 10);
  // (The dead soldier by the chained chest draws the crows too.)
  if (cs) open.push(k.dead.length - 1);
  if (cs) sides.push(cs);
  // Wayside shrine to pray at, when the barrows don't have one: on the road near the hamlet.
  if (!sides.some((s) => s.kind === 'pray')) {
    const s = spotIn(k, ham.x - 9, ham.y - 7, ham.x + 9, ham.y + 7, 0.6, 1.3);
    if (s) k.rounds.push({ kind: 'shrine', x: s.x, y: s.y, r: 0.35 }), sides.push({ kind: 'pray', x: s.x, y: s.y + 0.8 });
  }
  // The rest of the ground, each stretch with a set piece (no two the same until all are used).
  const pieces: Piece[] = rng.shuffle([...PIECES]);
  nodes.forEach((n, i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    // The wood's edge all along the top, thick where the node is the wood itself.
    if (r === 0) woodedge(k, c, n === 'woodedge' || n === 'out' ? 80 : 26, n === 'woodedge' || n === 'out' ? 18 : 7);
    if (r === 1) bank(k, c, land.riverAt);
    if (n === 'fields' || n === 'in') fields(k, c, r);
    if (n === 'woodedge' || n === 'fields' || n === 'bank' || n === 'hamlet') {
      const dead = k.dead.length, idx = scene(k, c, r, pieces[i % pieces.length], 4 + rng.int(3));
      bands.push({ idx, ground: n === 'hamlet' ? 'hamlet' : 'open', cap: EXPED_PACKS.specials.scene });
      // The dead out in the open, where the carrion crows come down.
      if (n !== 'hamlet') open.push(...k.dead.slice(dead).map((_, q) => dead + q));
    }
  });
  for (let i = 0; i < 9; i++) {
    const at = spotIn(k, 3, 3, MW - 3, MH - 3, 2.4, 1.2, false);
    if (at && Math.hypot(at.x - land.ins.x, at.y - land.ins.y) > 8) grove(k, at);
  }
  if (nodes[inI] === 'in' && land.ins.how === 'road') scene(k, land.ins.c, land.ins.r, 'wreck', 0);
  const patrols = roadPatrols(k, land, inI);
  // Each camp, set piece and patrol made one pack (shared/expedpacks.ts); the log-carriers on the north road.
  patrols.forEach((p, j) => bands.push({ idx: p.foes, ground: j === 1 ? 'road' : 'patrol', cap: EXPED_PACKS.specials.patrol, road: -9 }));
  const gone = new Set<Foe>(), packs = packAll(k, bands, job, land.ins, gone);
  camps.forEach((c, j) => {
    // The job's own guards (and a named butcher) belong to the camp's pack too.
    const rest = c.foes.filter((f) => !bands[j].idx.includes(f));
    // (A named one is the job's, not the pack's centrepiece: scaleBosses toughens it, not scalePacks.)
    for (const f of rest) if (k.foes[f].pack === undefined) Object.assign(k.foes[f], { pack: PACK0 + j }, k.foes[f].name ? {} : { role: 'fodder' });
    c.foes = [...packs[j], ...rest];
  });
  patrols.forEach((p, j) => (p.foes = packs[bands.length - patrols.length + j]));
  // The rest in small knots about the map, never within 18 tiles of the way in.
  for (let t = 0; t < 400 && k.foes.length < EXPED.goblins; t++) {
    const at = spotIn(k, 2, 2, MW - 2, MH - 2, 0.9, 1);
    if (!at || Math.hypot(at.x - land.ins.x, at.y - land.ins.y) < 18) continue;
    const n = 1 + rng.int(3), asleep = rng.next() < 0.25;
    for (let j = 0; j < n && k.foes.length < EXPED.goblins; j++) {
      const f: Foe = { kind: 'scrapper', x: at.x + rng.range(-0.8, 0.8), y: at.y + rng.range(-0.8, 0.8), ...(asleep ? { feeding: true } : {}) };
      if (asleep) k.sleepers.push({ x: f.x, y: f.y });
      k.foes.push(f);
    }
  }
  // None too near the way in, whatever laid them.
  // (And those a pack didn't keep.)
  const near = new Set(k.foes.map((f, i) => (Math.hypot(f.x - land.ins.x, f.y - land.ins.y) < 14 || gone.has(f) ? i : -1)).filter((i) => i >= 0));
  const keep = k.foes.map((_, i) => i).filter((i) => !near.has(i)), remap = new Map(keep.map((o, n) => [o, n]));
  k.foes = keep.map((i) => k.foes[i]);
  const re = (l: number[]) => l.flatMap((i) => (remap.has(i) ? [remap.get(i)!] : []));
  for (const c of camps) c.foes = re(c.foes);
  for (const p of patrols) p.foes = re(p.foes);
  for (const g of goals) if (g.foe !== undefined) g.foe = remap.get(g.foe);
  // (The hamlet keeps two houses to go into: shared/doors.ts.)
  const spill = settle(job, 0, k.blocks, 2);
  const ground: P[] = [];
  for (let y = 3; y < MH - 2; y += 4) for (let x = 3; x < MW - 2; x += 4) if (free(k, x, y, 0.8, 0)) ground.push({ x, y });
  // The Staithe on one map in three, laid last over a bank node between the fords, so the rest of the map
  // is exactly as it would be without it (shared/expedstaithe.ts). Pinned, it takes the last job's place.
  const sr = staithe ? staitheRoll(job.seed) : null, st = sr ? layExpedStaithe(k, land, nodes, [...mains, ...sides], camps) : null;
  if (st) {
    nodes[st.node] = 'staithe';
    for (let n = ground.length - 1; n >= 0; n--) if (inArea(st.area, ground[n].x, ground[n].y)) ground.splice(n, 1);
    if (sr?.pinned) mains.pop(), mains.push({ kind: 'staithe', x: st.x, y: st.y });
    else sides.push({ kind: 'staithe', x: st.x, y: st.y });
  }
  const flocks = flocksOn(open.map((i) => k.dead[i]), job);
  // Under the posting's sky (shared/expedsky.ts): it may turn partway (sim/exped.ts).
  const theme = themeUnder({ ...lightFor(THEMES.field, 'field', timeOf(job)), floor: 'grass' as const, back: 'trees' as const }, { from: expedSky(job).from }, 0);
  const map: GameMap = {
    name: 'THE BARROWFIELDS', w: MW, h: MH, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { x: land.ins.x, y: land.ins.y }, exit: { x: land.ext.x - 1.5, y: 0, w: 3, h: 0.9 }, theme, water: k.water, soil: k.soil,
    marks: [...k.marks, ...spill], npcs: k.dead.length ? k.dead : undefined, grim: k.grim.length ? k.grim : undefined, sleepers: k.sleepers.length ? k.sleepers : undefined,
    flocks: flocks.length ? flocks : undefined, ...(st ? { staithe: st.map } : {}),
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, nodes, land, camps, goals: mains, sides, patrols, zone, open: ground };
}

/** A free middle for a camp or the barrows in node `i` (searching a little past its edges). */
function centre(k: Kit, i: number, r = 5): P {
  const m = mid(i);
  return spotIn(k, m.x - 16, m.y - 16, m.x + 16, m.y + 16, r, 1.6, false) ?? spotIn(k, m.x - 16, m.y - 16, m.x + 16, m.y + 16, r * 0.7, 1, false) ?? m;
}

/** Three patrols walking the roads: a stretch of the south road, the north road, a ford road. */
function roadPatrols(k: Kit, land: Land, inI: number): Patrol[] {
  const out: Patrol[] = [], rng = k.rng;
  const legs: P[][] = [];
  for (const road of [land.south, land.north]) {
    const a = rng.range(8, MW / 2 - 8), b = a + rng.range(22, 34), pts: P[] = [];
    for (let x = a; x <= b; x += 5) pts.push({ x, y: yOn(road, x) });
    legs.push(pts);
  }
  legs.push(land.links[rng.int(land.links.length)]);
  for (const path of legs) {
    const at = path[0];
    if (Math.hypot(at.x - land.ins.x, at.y - land.ins.y) < 20) path.reverse();
    const s = path[0], foes: number[] = [];
    for (let i = 0; i < 3; i++) foes.push(k.foes.push({ kind: 'scrapper', x: s.x + (i - 1) * 0.9, y: s.y + 0.4 * i }) - 1);
    out.push({ foes, path: path.map((p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })) });
  }
  void inI;
  return out;
}
