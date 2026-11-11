/**
 * Run rooms. An old job's rooms are each its place's plan (shared/sites.ts), the same every time you
 * went there. A routed job's (`layout: 2`, shared/route.ts) are a walk through different rooms to the
 * place's heart: its way in and out move, its spine bends, it has one landmark and one set piece
 * (shared/vignettes.ts). Either way the job's seed puts the objective, the goblins and the chests in.
 * Ruin and the room's place in the run set how many goblins. The last room holds the objective: cages,
 * a named butcher, or the larder racks. Same seed, same room.
 */
import type { Block, GameMap, Grim, Ledge, Npc, Road, Round, Theme } from './arena.js';
import { settle } from './houses.js';
import type { Job, PlaceKind } from './jobs.js';
import type { PropKind } from './props.js';
import { frameFor } from './roomframe.js';
import { oldBands } from './roomfoes.js';
import { heartMarks, layOut } from './sites.js';
import { siteClear, type Site, type Spot } from './sitekit.js';
import { approachTo, offAll } from './spine.js';
import { rollBackline } from './roster.js';
import { rollSpiders } from './nests.js';
import { lightFor, timeOf } from './timeofday.js';
import { setPiece, type Lay } from './vignettes.js';
import { weatherAt } from './weather.js';
import { objectives } from './roomgoal.js';
import { raise3, sideWayIn } from './roomledge.js';
import { keepReachable } from './roomreach.js';
import { sideBlock } from './sideway.js';
import { doorAt } from './arena.js';
import type { Role } from './encounters.js';
import { composeRoom, crowsOn } from './encounter.js';
import { clearGrowth, ensure4, finish4, light4, name4, plotter, torches4, wayMore } from './room4.js';
import { edgePt } from './ports.js';
import { stageDebuts } from './debut.js';
import { roomAt } from './deepbands.js';

/** `wave`: a nest's spiders a wave (more in a party; shared/nests.ts). */
export type FoeVariant = 'looter' | 'lunger' | 'heavy' | 'stoker' | 'shield' | 'hexer' | 'drummer'
  | 'banner' | 'netter' | 'thief' | 'log' | 'roofer' | 'keeper' | 'wolf' | 'oiler' | 'torch' | 'sapper' | 'blind' | 'ironhide' | 'chalker'
  /** The Staithe's (shared/staithetune.ts): the gaffer and its hook, the skimmer and its oil. */
  | 'gaffer' | 'skimmer'
  /** Hangman's Wood's (shared/hangtune.ts): the snarer and its ankle snares. */
  | 'snarer'
  /** The new meaty sorts (shared/meaty.ts): the barn door, the flail, the pitchfork. */
  | 'planker' | 'swingle' | 'forker'
  /** The second three (shared/meaty2.ts): the oil keg, the leap, the eater of the dead. */
  | 'kegman' | 'pouncer' | 'gorger'
  /** The wood's element lesson only (shared/wood.ts ELEMENT_FOES): wet through, in a bark apron, hot off the kiln. */
  | 'soaked' | 'aproned' | 'kilnhot';
/**
 * `pack`: the fight it belongs to (shared/encounter.ts; a pack's shout wakes only its own), `role` what
 * it's for in it, `more` (a pack's centrepiece) the special a party of three or more adds.
 */
export interface Foe {
  kind: 'scrapper' | 'butcher' | 'spider' | 'brood' | 'nest'; wave?: number; x: number; y: number; hp?: number; name?: string; bow?: boolean; z?: number; awake?: boolean; feeding?: boolean; variant?: FoeVariant; pack?: number; role?: Role; more?: Role;
  /** Layout 4: what it's busy at when you come in (sim/tasks.ts), and a body it's hauling. */
  task?: import('./scenes4.js').FoeTask; haul?: { x: number; y: number; sack?: boolean };
  /** Hangman's Wood: Hempen throws its noose (sim/hempen.ts); its relic is the zone's, awarded at the job's end (shared/relicaward.ts), never a drop. */
  noose?: boolean; zoned?: boolean;
  /** Pacing (shared/threat.ts): its pack's beat, a BIG ONE, and how much harder it hits (a bigger party). */
  beat?: import('./encounters.js').Beat; big?: boolean; harm?: number;
  /** An elite's affixes (shared/elites.ts). */
  elite?: import('./elites.js').Affix[];
  /** A boss of the kit (sim/bosskit.ts): which one (the Doorkeepers' Latch or Hasp, the Deep's Haulier). */
  boss?: 'latch' | 'hasp' | 'haulier';
  /** THE DROVER: drives the roped line and stands behind it (sim/drover.ts). */
  drives?: boolean;
  /** THE BRAKESMAN: works the brake at the top of the map's rail (sim/brake.ts). */
  brakes?: boolean;
}
/** Which way the party went at a fork. */
export type RoadId = Road['road'];
export interface RoomPlan { map: GameMap; foes: Foe[]; props: { kind: PropKind; x: number; y: number }[]; chests: { x: number; y: number; chained?: boolean }[] }

/** A run room: big enough to explore before the way on (layout 3's are their route's size: shared/ports.ts). */
export const ROOM = { w: 28, h: 24 };

export const THEMES: Record<PlaceKind, Theme> = {
  village: { floor: 'cobble', back: 'palisade', ambient: [0.24, 0.23, 0.32], moon: 0.55 },
  farm: { floor: 'dirt', back: 'palisade', ambient: [0.25, 0.24, 0.31], moon: 0.6 },
  field: { floor: 'wheat', back: 'trees', ambient: [0.26, 0.25, 0.33], moon: 0.7 },
  forest: { floor: 'grass', back: 'trees', ambient: [0.17, 0.19, 0.23], moon: 0.35 },
  mine: { floor: 'rock', back: 'rockface', ambient: [0.14, 0.13, 0.18], moon: 0 },
  river: { floor: 'grass', back: 'trees', ambient: [0.2, 0.22, 0.28], moon: 0.6 },
  marsh: { floor: 'mud', back: 'trees', ambient: [0.18, 0.2, 0.22], moon: 0.45 },
  ruins: { floor: 'flagstone', back: 'stone', ambient: [0.2, 0.19, 0.26], moon: 0.5 },
};

/** Which places have torches on their back wall. */
const TORCHES: Record<PlaceKind, boolean> = { village: true, farm: true, field: false, forest: false, mine: true, river: false, marsh: false, ruins: true };

/** A run's fork: the middle room of a three-room job has two ways out. */
export const isFork = (job: Job, index: number) => job.rooms >= 3 && index === job.rooms - 2;
export const ROADS: Record<RoadId, { label: string; text: string }> = {
  high: { label: 'THE HIGH ROAD', text: 'archers on the heights, fewer below' },
  low: { label: 'THE LOW ROAD', text: 'more goblins, someone caged' },
};

/**
 * `taken`: the roads the party took at each fork so far (a layout-3 room after a fork is come into by the
 * side its road leads in by); `road`, the one that led into this room, gives it the road's fight.
 */
export function planRoom(job: Job, index: number, road?: RoadId, taken?: Record<number, RoadId>): RoomPlan {
  const kind = job.place.kind, final = index === job.rooms - 1, obj = final ? job.objective : 'clear';
  const took = Object.entries(taken ?? (road ? { [index]: road } : {})).filter(([i]) => +i <= index).map(([, r]) => r[0]).join('');
  const fr = frameFor(job, index, road, isFork(job, index), ROOM.w, ROOM.h, took), rng = fr.rng, spec = fr.spec, SPAWN = fr.spawn, EXIT = fr.exit, ex = EXIT.x + EXIT.w / 2;
  // A layout-3 room is its route's size (wider for a leg that runs left to right); the rest are the old 28 by 24.
  const W = fr.w ?? ROOM.w, H = fr.h ?? ROOM.h, MID = W / 2, v3 = !!fr.ways, fork = v3 ? fr.ways!.length > 1 : isFork(job, index);
  // Layout 4: a fork's roads are only its two branches; the way taken (spec.way) gives the room its fight.
  const v4 = job.layout === 4, fight = v4 ? undefined : road;
  const ways = (fr.ways ?? []).map((q) => ({ x: q.area.x + q.area.w / 2, y: q.area.y + q.area.h / 2 }));
  const clearOfWays = (x: number, y: number, r: number) => (v3 ? ways.every((p) => Math.hypot(x - p.x, y - p.y) > r + 2.4) : Math.hypot(x - ex, y - 0.5) > r + 2.4);
  const rounds: Round[] = [], blocks: Block[] = [], spots: Spot[] = [], guard: Spot[] = [];
  let site: Site | null = null;
  // Kept off the line from the way in to the way out (the middle column, or the spine), and off a heart's landmarks.
  const line = (x: number, y: number) => (fr.spine ? offAll(fr.spine, x, y) : Math.abs(x - MID));
  const free = (x: number, y: number, r: number, skip?: object) =>
    Math.hypot(x - SPAWN.x, y - SPAWN.y) > r + 2.4 && clearOfWays(x, y, r) && line(x, y) > r + 1.3 &&
    spots.every((s) => s === skip || Math.hypot(s.x - x, s.y - y) > s.r + r + 0.9) && guard.every((s) => Math.hypot(s.x - x, s.y - y) > s.r + r + 1.1) && (!site || siteClear(site, x, y, r));
  const spot = (r: number, y0 = 2.2, y1 = H - 3): { x: number; y: number } | null => {
    for (let t = 0; t < 50; t++) {
      const x = rng.range(1.4 + r, W - 1.4 - r), y = rng.range(y0 + r, y1 - r);
      if (free(x, y, r)) return spots.push({ x, y, r }), { x, y };
    }
    return null;
  };
  // A fork's two ways out, kept clear; the room's water and what it keeps clear.
  const roads: Road[] | undefined = !fork ? undefined : v3 ? fr.ways!.map((q) => name4({ road: q.road!, label: ROADS[q.road!].label, area: q.area, side: q.port.side, ...(q.port.way ? { way: q.port.way } : {}) })) : (['high', 'low'] as RoadId[]).map((r, i) => ({ road: r, label: ROADS[r].label, area: { x: i ? W - 5 : 3, y: 0, w: 2, h: 0.9 } }));
  for (const r of roads ?? []) spots.push(v3 ? { x: r.area.x + r.area.w / 2, y: r.area.y + r.area.h / 2, r: 1.4 } : { x: r.area.x + 1, y: 0.8, r: 1.4 });
  // A side way (layout 3): its gap kept clear, nothing put down in front of it.
  const side = spec && v3 ? sideBlock(spec, W, H) : null;
  if (side) spots.push({ ...doorAt(side), r: 1.4 });
  spots.push(...fr.wet);
  const water = fr.water, ground = { w: W, h: H, fork, water }, routed = spec && fr.spine ? { spec, spine: fr.spine, river: fr.river, seed: fr.seed } : undefined;
  if (routed && spec?.heart) {
    guard.push(...heartMarks(job, ground, routed));
    // Come into a heart where its landmarks leave room (nearer the middle if a clamp or a pit prop is in the way).
    const crowd = (x: number) => guard.some((g) => Math.hypot(g.x - x, g.y - SPAWN.y) < g.r + 3.2 || offAll([approachTo(x, MID, H)], g.x, g.y) < g.r + 1.7);
    if (!spec.in || spec.in.side === 'S') {
      while (crowd(SPAWN.x) && Math.abs(SPAWN.x - MID) > 0.5) SPAWN.x += Math.sign(MID - SPAWN.x);
      routed.spine[0] = approachTo(SPAWN.x, MID, H);
    } else Object.assign(SPAWN, { y: (routed.spine[0] = sideWayIn(spec.in.side, W, H, guard))[0][1] });
  }
  const hits = (a: { x: number; y: number; w: number; h: number }) => guard.some((g) => g.x > a.x - g.r - 0.6 && g.x < a.x + a.w + g.r + 0.6 && g.y > a.y - g.r - 0.6 && g.y < a.y + a.h + g.r + 0.6);
  // Raised ground: always on the high road, sometimes elsewhere; archers up on it. Never over the way out, nor a heart's landmarks.
  const foes: Foe[] = [], ledges: Ledge[] = [], onLedge = new Set<Spot>();
  if (v3 && spec && !spec.heart) raise3({ rng, spec, road: fight, obj, fork, index, W, H, spine: fr.spine!, water: fr.water, keepOff: [SPAWN, ...ways, ...(side ? [doorAt(side)] : [])], spots, onLedge, foes, ledges });
  else if (!fork && obj !== 'burn' && (road === 'high' || (road !== 'low' && index >= 1 && rng.next() < 0.4))) {
    const big = road === 'high', lh = big ? 4.2 : 3.4;
    let lw = big ? 7.5 : 6.5, left = rng.next() < 0.5;
    if (spec) {
      if (ex < MID - 2) left = false;
      else if (ex > MID + 2) left = true;
      const at = (l: boolean, w: number) => ({ x: l ? 0 : W - w, y: 0, w, h: lh + 1.5 });
      if (hits(at(left, lw)) && !hits(at(!left, lw)) && Math.abs(ex - MID) <= 2) left = !left;
      else if (hits(at(left, lw))) lw = hits(at(left, 5)) ? 0 : 5;
    }
    if (lw) {
      const lx = left ? 0 : W - lw, ramp = { x: left ? lx + lw - 1.8 : lx, y: lh - 1.3, w: 1.8, h: 2.8 };
      ledges.push({ x: lx, y: 0, w: lw, h: lh, ramps: [ramp], kind: kind === 'mine' || kind === 'forest' ? 'rock' : 'wood' });
      for (let x = lx + 1; x < lx + lw; x += 1.5) spots.push({ x, y: lh / 2, r: lh / 2 + 0.3 });
      spots.push({ x: ramp.x + 0.9, y: ramp.y + ramp.h / 2, r: 1.5 });
      // A routed room's ledge clears what's on it by its own ground (below); its spots only keep goblins and cages off it.
      if (spec) for (const q of spots.slice(-Math.ceil((lw - 1) / 1.5) - 1)) onLedge.add(q);
      for (let i = 0; i < (big ? 3 : 2); i++) foes.push({ kind: 'scrapper', bow: true, z: 1, x: lx + 1.3 + i * (lw - 2.6) / Math.max(1, big ? 2 : 1), y: 1.3 + (i % 2) * 0.8 });
    }
  }
  // The objective first (it must fit), then the place itself, round the ways in and out, the raised ground, the water and the job's spots.
  const props = objectives({ obj, road: fight, ledges: ledges.length > 0, spot, free, spots, blocks, props: [], W, H, MID, guarded: (x, y, r) => !hits({ x: x - r, y: y - r, w: r * 2, h: r * 2 }) });
  site = layOut(job, index, ground, [...(roads ? roads.map((r) => r.area) : [EXIT]), ...(side ? [side] : [])], ledges.flatMap((l) => [l, ...l.ramps]), spots.filter((q) => !onLedge.has(q)), SPAWN, routed);
  blocks.push(...site.blocks), rounds.push(...site.rounds), props.push(...site.props);
  // Goblins: a routed room's set piece, or an old room's fires and its heap of the dead. The first room
  // is all small ones; butchers come deeper in.
  const ruin = job.place.ruin, dead: Npc[] = [], braziers: GameMap['braziers'] = [], grim: Grim[] = [], sleepers: { x: number; y: number }[] = [], marks: GameMap['marks'] = [];
  const n = Math.max(v4 ? 1 : 2, Math.min(v4 ? 13 : 10, 4 + ruin + index + (fight === 'low' ? 2 : fight === 'high' ? -2 : 0) + wayMore(spec)));
  const lay: Lay = { rng, W, H, kind, n, spot, free, claim: (x, y, r) => void spots.push({ x, y, r }), foes, dead, braziers, props, blocks, rounds, marks, grim, sleepers, spine: fr.spine, river: fr.river };
  if (v4 && spec) Object.assign(lay, { out: spec.heart ? undefined : edgePt(spec.outs![0], W, H), chests: [], flocks: [], oil: [], plot: fr.spine && plotter({ rng, W, H, spine: fr.spine, keepOff: [SPAWN, ...ways], blocks, rounds: [rounds, site.rounds], water: fr.water, spots }), clear: (a: { x: number; y: number; w: number; h: number }) => clearGrowth([rounds, site!.rounds], a) });
  if (v4 && spec && !spec.heart) ensure4(spec, blocks, lay.plot);
  const fires = spec ? setPiece(lay, spec.piece) : oldBands(lay);
  // Not every small goblin is the same: spear-lungers (roll out of the line), brutes (big, slow blows
  // to block or dodge) and shield-bearers (hit them from behind, or hard). More of them deeper in.
  // (A layout-3 room's goblins are laid out as fights instead: composeRoom, below.)
  for (const f of v3 ? [] : foes) {
    if (f.kind !== 'scrapper' || f.bow || f.feeding || f.name) continue;
    const r = rng.next(), deep = index * 0.05 + ruin * 0.04;
    if (r < 0.14 + deep) f.variant = 'lunger';
    else if (r < 0.26 + deep * 2 && ruin >= 1) f.variant = 'shield';
    else if (r < 0.33 + deep * 2.5 && index >= 1) f.variant = 'heavy';
  }
  if (final && (obj === 'hunt' || obj === 'story')) foes.push({ kind: 'butcher', x: MID, y: 4.5, hp: obj === 'story' ? 560 : 420, name: job.boss, ...(v3 ? { pack: 99 } : {}) });
  if (!v3 && index >= 1 && ruin >= 2) foes.push({ kind: 'butcher', x: fires[0]?.x ?? MID, y: (fires[0]?.y ?? 6) - 1.2 });
  if (!v3 && final && ruin >= 2 && obj !== 'hunt' && obj !== 'story') foes.push({ kind: 'butcher', x: fires[1]?.x ?? MID, y: (fires[1]?.y ?? 5) - 1.2 });
  // The back of the pack: now and then a hexer or a drummer among them (shared/roster.ts). A routed
  // room rolls it last, after the spiders have thinned the band, so blades are always left to fight.
  if (!spec) rollBackline(foes, job, index);
  // Chests: sometimes one in a room, always one in the last; on a deep job, a chained one by the named butcher.
  const chests: RoomPlan['chests'] = [];
  if ((final || rng.next() < 0.4) && spec?.way !== 'quiet') {
    const c = spot(0.6, 2.5, H - 5);
    if (c) chests.push(c);
  }
  if (final && job.deep) chests.push({ x: MID + 2.2, y: 3.2, chained: true });
  // In the wilder places, sometimes spiders: nests that hatch waves, and deep in, a brood mother (shared/nests.ts).
  rollSpiders(foes, job, index, spot, H, W);
  // A routed room's goblins as fights: packs, each one template, a cap on specials (shared/encounter.ts).
  if (spec && !v3) rollBackline(foes, job, index);
  // A new sort staged in its fork way's room first (shared/debut.ts), once the chests are down: the chalker at the CRIES captives' tally.
  if (v4 && spec?.way) stageDebuts(lay, job, spec.way);
  if (v3) composeRoom({ foes, job, index: roomAt(job, index), W, H, spawn: SPAWN, blocks, spot, free, claim: (x, y, r) => void spots.push({ x, y, r }) });
  // Each house's look and fate outside come from the same seed as its inside.
  const spill = settle(job, index, blocks);
  if (side) blocks.push(side);
  // Lit for the job's hour (shared/timeofday.ts), as the place it is (an approach room, as its country):
  // broad day, a misty dawn, a long dusk, or night; a routed job's weather over it (shared/weather.ts).
  const lit: PlaceKind = spec && !spec.heart ? spec.palette.light : kind;
  const theme: Theme = light4(lightFor(THEMES[lit], lit, timeOf(job)), v4 ? spec : null);
  const gaps = [EXIT, ...(roads ?? []).map((r) => r.area)].filter((a) => !v3 || a.y < 1);
  const torchAt = [{ x: 4.5, y: -1.6 }, { x: MID - 4, y: -1.6 }, { x: MID + 4, y: -1.6 }, { x: W - 4.5, y: -1.6 }];
  const map: GameMap = {
    name: job.place.name.toUpperCase(), w: W, h: H, wallFace: 3, rounds, blocks, braziers,
    torches: torches4(v4 ? spec : null, TORCHES[lit]) ? (spec ? torchAt.filter((t) => gaps.every((a) => Math.abs(t.x - (a.x + a.w / 2)) > 2.2)) : torchAt) : [], hero: { ...SPAWN }, exit: roads ? null : { ...EXIT }, theme,
    ledges: ledges.length ? ledges : undefined, roads, npcs: dead.length ? dead : undefined, water: water.length ? water : undefined,
    marks: spill.length ? spill : undefined,
  };
  // The place's own ground, floor and back wall, and what the set piece left about.
  Object.assign(map, { theme: { ...map.theme, floor: site.floor, back: site.back ?? map.theme.back }, soil: site.soil, marks: [...site.marks, ...marks, ...spill] });
  if (grim.length) map.grim = grim;
  // Crows on the dead (sim/crows.ts): a layout-3 room's own roll.
  if (v3 && crowsOn(job, index, dead).length) map.flocks = crowsOn(job, index, dead);
  if (v4 && spec && !spec.heart) finish4(lay, spec, map, chests, dead, spot), lay.flocks?.length && (map.flocks = [...(map.flocks ?? []), ...lay.flocks]);
  if (sleepers.length) map.sleepers = sleepers;
  if (spec) map.theme = weatherAt(job, index, map.theme);
  if (v3) keepReachable(map, foes, chests, props, (r) => spot(r, 1.5, H - 2));
  return { map, foes, props, chests };
}
