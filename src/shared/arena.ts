/**
 * Maps: what the client draws and what the rules collide against, in one place. Tile units. The
 * floor runs from (0, 0) to (w, h); the back wall's face is drawn above y = 0. One map is in use at
 * a time (the room that's running sets it), so collision never needs it passed around.
 */
import { nearby } from './mapgrid.js';
import { stopsAt, type PathAt } from './npcstops.js';

export type Circle = { x: number; y: number; r: number };
export type RoundKind = 'pillar' | 'tree' | 'pine' | 'rock' | 'hay' | 'well' | 'lantern' | 'support' | 'stump' | 'target' | 'stone' | 'post' | 'grate' | 'statue' | 'bush' | 'reed' | 'deadtree'
  // Paint only, a speck to bump: crows at the blood, moths round a garden lamp.
  | 'crows' | 'moths'
  // A place's things (shared/sites.ts): a wayside shrine, a fountain, a market cross, a washing line, a scarecrow,
  // a cookfire's ring of stones, a charcoal clamp, a stack of cut peat.
  | 'shrine' | 'fountain' | 'cross' | 'washline' | 'scarecrow' | 'cookfire' | 'clamp' | 'peat'
  // Paint only: a dog nosing about, smoke rising past the wall.
  | 'dog' | 'smoke'
  // Inside the halls: a stand of candles, a brazier of coloured fire (the mage's tower).
  | 'candles' | 'witchfire'
  // Layout 4's pieces (client/pieces.ts draws both views from one list): the hungry's hanging tree, a
  // headstone, an orchard's apple tree.
  | 'hangtree' | 'headstone' | 'apple';
export type BlockKind = 'house' | 'barn' | 'hall' | 'church' | 'forge' | 'stall' | 'tent' | 'rockwall' | 'fence' | 'granary' | 'wall' | 'den'
  // Furniture, inside buildings.
  | 'counter' | 'bed' | 'shelf' | 'anvil' | 'altar' | 'pew' | 'bench' | 'hearth' | 'sacks'
  // A cottage's inner wall, a weaver's loom, a stall in a barn.
  | 'partition' | 'loom' | 'pen'
  // Wickhold's other buildings and things in the street.
  | 'tower' | 'tavern' | 'monument' | 'rubble' | 'cart' | 'rack'
  // Under siege: the gallows on the square, wicker hurdles barricading the gate.
  | 'gallows' | 'hurdle'
  // A shack of scrap boards and sailcloth (a shanty, a camp).
  | 'shack'
  // A side way out of a job's room to a dead end (shared/sideway.ts): a gap at the edge, drawn as one.
  | 'sideway'
  // Inside the halls, each its own (client/hallsdraw.ts).
  | 'books' | 'stair' | 'dummy' | 'maptable' | 'dicetable' | 'skinbench' | 'desk' | 'tub' | 'bellows' | 'booth' | 'bunk' | 'casks'
  // Layout 4's pieces (client/pieces.ts): a mine's headframe, a fallen trunk, a watermill and its wheel, a fence of sharpened stakes.
  | 'headframe' | 'log' | 'mill' | 'stakes';
export interface Round extends Circle { kind: RoundKind }
export interface Block {
  x: number; y: number; w: number; h: number; kind: BlockKind; label?: string;
  /** Walk up into the door (bottom middle) to go in: the interior's id. */
  door?: string;
  /** A side way: the side of the room it's in (you walk into it that way; its door spot is on the room's side of it). */
  face?: 'N' | 'E' | 'S' | 'W';
  /** Wooden buildings in a run can be smashed and burned: health, when it caught fire (-1 not), burned down. */
  hp?: number; maxHp?: number; burning?: number; ruined?: boolean;
  /** Burning for show, never spreading or burning down (the wagons on the battlefield). */
  smoulder?: boolean;
  /** A door that won't open yet (the story or the town works open it). */
  locked?: boolean;
  /**
   * Paint only, never collided against or decided on. A house on a job: the seed its outside and its
   * inside both come from (shared/houses.ts). Furniture: 1 smashed, 2 a fire lit in it (a hearth).
   */
  look?: number;
  /** Paint only: a town building still showing the breach (scorched, shutters boarded, roof holed). */
  worn?: boolean;
  /**
   * A job's house (shared/houses.ts): what's become of it, and whether it's one of the big ones. A
   * blocked one has no door (fallen in across it); a burning one smoulders (drawn on fire, never spreading).
   */
  fate?: 'standing' | 'wrecked' | 'blocked' | 'burning';
  big?: boolean;
  /** Paint only: a house of stone with a slate roof (a better-off street). */
  style?: 'stone';
  /** Someone crouched at its kindling spot setting it alight (sim/kindle.ts): who, and how long so far. */
  lighter?: string;
  lightT?: number;
  /** Someone caged inside (the leader's game says so, from the house's plan or its room): a muffled cry at the kindling spot. */
  cry?: boolean;
  /**
   * Burning a house (layout 4, sim/scenes.ts): torch-bearers at it, how far it has caught (0 to 1; it
   * goes up at 1, the ring at its kindling spot shows the same). `held`: someone caged inside it from
   * the start (the cry is real); `pulled`: how many have been dragged out of the door once it's alight,
   * and how far along the one being dragged out now is (seconds).
   */
  torched?: number;
  held?: number;
  pulled?: number;
  pullT?: number;
}
/** Paint only, on the floor: never collided against or decided on. */
export type MarkKind = 'blood' | 'drag' | 'debris' | 'scorch' | 'trample' | 'planks' | 'beds' | 'flowers' | 'mound' | 'fallenpost' | 'green'
  // A bridge broken in the middle (shared/river.ts): its two ends over the water, the gap between.
  | 'bridge'
  // The ground itself (shared/ground.ts): flagstones, packed earth, mud, wheel ruts, a trodden path,
  // missing cobbles, puddles, straw, weeds, a drain, spent arrows.
  | 'flags' | 'earth' | 'mud' | 'ruts' | 'path' | 'holes' | 'puddle' | 'straw' | 'weeds' | 'gutter' | 'arrows'
  // Inside the halls: a chalked circle, a rug, strewn rushes, sawdust, a pelt, soot, the hounds' bowls.
  | 'chalk' | 'rug' | 'rushes' | 'sawdust' | 'pelt' | 'soot' | 'bowls';
/**
 * What the ground is made of, in big soft-edged shapes painted over the floor (later ones win; where
 * the winner is `cobble`, the floor's own cobbles show). A box, an ellipse in the box (`round`), or a
 * line from (x, y) to (x + w, y + h) `line` tiles either side. Paint only.
 */
/** What hangs on a hall's back wall. */
export type HangKind = 'vote' | 'stars' | 'shields' | 'banner' | 'map' | 'antlers' | 'pelts' | 'bows' | 'window' | 'tools' | 'herbs' | 'notices' | 'sign' | 'shelves';
export type SoilMat = 'cobble' | 'earth' | 'mud' | 'swept' | 'straw' | 'ash' | 'wet'
  // Out on a job: grass over another floor, a ploughed field in rows, grain standing.
  | 'grass' | 'furrow' | 'crop';
export interface Soil { mat: SoilMat; x: number; y: number; w: number; h: number; round?: boolean; line?: number }
/** A floor mark's area (tiles). A `path` runs as a line from (x, y) to (x + w, y + h). */
export interface Mark { kind: MarkKind; x: number; y: number; w: number; h: number }
/**
 * Raised ground: a ledge, a rock shelf, a wall walk. Up on it you stand on level 1. From the ground
 * its edge is a wall; from on top you can step off it (a drop). Ramps (stairs, a slope) overlap its
 * edge: inside a ramp you go freely between the levels.
 */
export interface Ledge { x: number; y: number; w: number; h: number; ramps: Area[]; kind?: 'rock' | 'wood' }
/** A way out of a run room, when there's more than one: the road it leads to. */
export interface Road {
  area: Area; road: 'high' | 'low'; label: string; /** Layout 3: the side of the room it leaves by (else the top). */ side?: 'N' | 'E' | 'S' | 'W';
  /** Layout 4: what you can tell from here about the way (shared/ways.ts): its word is the label, its cue drawn past the gap. */
  way?: import('./ways.js').WayKind;
}
/** Someone to talk to: `talk` says what they offer (a town spot's panel), `look` how they're drawn. */
export interface Npc {
  x: number; y: number; name: string; talk: string; look: string; arg?: number;
  /** Talked to from this much further off than anyone else (the reeve across his table), in tiles. */
  reach?: number;
  /** A round they walk (a guard's patrol), at `speed` tiles a second; they don't block anyone. */
  path?: [number, number][];
  speed?: number;
  /** Cutscene puppetry: lifted off the ground (pixels), walking, or dead (`headless` standing, `body` on the ground). */
  lift?: number;
  walking?: boolean;
  /** Cutscene puppetry: red up the wall behind them, this many pixels high (Hew, thrown into his hut's wall). */
  smear?: number;
  /** Keeping low: crouched and creeping (Hew coming in past the goblins at the dead). */
  sneak?: boolean;
  /** Cutscene puppetry: which way someone without a round faces (Orla walking up the road). */
  fx?: number;
  fy?: number;
  /** Paint only, what they're busy at: carrying the dead and digging, at the whetstone, at the well;
   *  the public works' crew sweeping, hauling planks, shovelling rubble into a barrow. */
  work?: 'bury' | 'dig' | 'whet' | 'well' | 'sweep' | 'haul' | 'shovel';
  /** Seconds they stand at each point of their round, working, before walking on (npcstops.ts). */
  stops?: number[];
  /** Walks on Wickhold's wall clock, not the room's, so every screen has them in the same spot. */
  clock?: boolean;
  /** Somebody in the background: no mark over them, nobody to talk to. */
  mute?: boolean;
  pose?: 'headless' | 'body' | 'corpse';
  /** Stopped to talk to you (on their round): since when, and how long they've stood about in all. */
  heldAt?: number;
  lag?: number;
}

/** Where someone is at time `t` (walking their round, or standing where they stand), and which way they face. */
export function npcAt(n: Npc, t: number): PathAt {
  const p = n.path;
  if (!p || p.length < 2) return { x: n.x, y: n.y, fx: n.fx ?? 0, fy: n.fy ?? 1 };
  if (n.stops) return stopsAt(p, n.stops, n.speed ?? 1.1, (n.heldAt ?? t) - (n.lag ?? 0));
  const seg = p.map((a, i) => {
    const b = p[(i + 1) % p.length];
    return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
  });
  const total = seg.reduce((s, q) => s + q.len, 0);
  // Stopped to talk: they stand where they were, and pick their round up again from there.
  const tt = (n.heldAt ?? t) - (n.lag ?? 0);
  let d = (tt * (n.speed ?? 1.1)) % total;
  for (const q of seg) {
    if (d <= q.len) {
      const k = d / (q.len || 1), fx = (q.b[0] - q.a[0]) / (q.len || 1), fy = (q.b[1] - q.a[1]) / (q.len || 1);
      return { x: q.a[0] + (q.b[0] - q.a[0]) * k, y: q.a[1] + (q.b[1] - q.a[1]) * k, fx, fy };
    }
    d -= q.len;
  }
  return { x: p[0][0], y: p[0][1], fx: 0, fy: 1 };
}
export interface Area { x: number; y: number; w: number; h: number }

/** How a map looks: floor, walls, light. */
export interface Theme {
  floor: 'flagstone' | 'cobble' | 'grass' | 'dirt' | 'rock' | 'wheat' | 'planks' | 'mud';
  /** The back wall's face: stone, a palisade, a treeline, a rock face, or a room's plastered wall. */
  back: 'stone' | 'palisade' | 'trees' | 'rockface' | 'plaster';
  ambient: [number, number, number];
  /** Moonlight strength over the middle (0: none). */
  moon: number;
  /** Daylight: no moon pool, no lanterns, the ambient does it all. */
  day?: boolean;
  /** A job's hour (shared/timeofday.ts), and what it does: how much fires and lanterns count, dawn's
   *  mist, the low sun's shadows (+ east, - west), how far a resting goblin sees, and a censer's glow. */
  time?: import('./timeofday.js').Time;
  torch?: number;
  mist?: number;
  sun?: number;
  sight?: number;
  glow?: number;
  /** The tended lamps (shared/lamps.ts): Wickhold's hour on the shared clock (lamps lit one by one at
   *  dusk), or a job's lamps at its hour (0 out, 1 lit). Neither: lit (indoors, the yard, the wood). */
  dayAt?: number;
  lamps?: number;
  /** A job's weather (shared/weather.ts) for drawing: how hard it rains (0 to 1), how stormy (0 to 1). */
  rain?: number;
  storm?: number;
  /** How thick the fog lies (0 to 1), drawn thickening away from your hero. */
  fog?: number;
  /** The weather as a rule (shared/sky.ts): what it changes in the fight. None: clear, indoors or underground. */
  sky?: import('./sky.js').Sky;
}

export interface GameMap {
  name: string;
  w: number;
  h: number;
  /** Height of the back wall's face, in tiles (three-quarter view). */
  wallFace: number;
  rounds: Round[];
  blocks: Block[];
  /** `wild`: a camp's fire, burning whatever the hour (shared/lamps.ts); the rest are tended lamps. */
  braziers: (Circle & { wild?: boolean })[];
  torches: { x: number; y: number }[];
  hero: { x: number; y: number };
  /** Walk into this to leave (opens when the room says so). */
  exit: Area | null;
  theme: Theme;
  /** People standing about (towns and interiors). */
  npcs?: Npc[];
  /** Raised ground. */
  ledges?: Ledge[];
  /** A fork: two ways out, each leading to its own next room (the party picks). */
  roads?: Road[];
  /** Water: deep (nobody wades it; shots fly over) or shallow (everyone in it slows to WADE). */
  water?: Water[];
  /** Where goblins lie asleep (drawn curled up; they lie as still as ones at the dead till they wake). */
  sleepers?: { x: number; y: number }[];
  /** Carrion crows on the dead (sim/crows.ts): where each flock sits when the room begins. */
  flocks?: { x: number; y: number }[];
  /** Paint only: what the ground is made of (shapes, in order), before the marks. */
  soil?: Soil[];
  /** Paint only: things hung on the back wall's face, from tile x for w tiles (client/hangs.ts). */
  hangs?: { kind: HangKind; x: number; w: number }[];
  /** Paint only: marks on the floor (blood, scorch, dug beds, flowers). */
  marks?: Mark[];
  /** Paint only: little scenes past the trees, never reached (the prologue wood's: shared/woodscenes.ts). */
  vignettes?: import('./woodscenes.js').Vignette[];
  /** Paint only: what the goblins left in a house (shared/grim.ts). */
  grim?: Grim[];
  /** A house on fire inside (shared/blaze.ts): where it burns and when, the beams that come down, when it falls in. */
  blaze?: Blaze;
  /** Paint only: a stretch of the back wall that came down (tiles), and how far it's mended (0 to 3). */
  breach?: { x: number; w: number; stage: number };
  /** Prisoners led off (layout 4, sim/scenes.ts): roped captives walking these points to the far way out, and how many. */
  led?: { pts: [number, number][]; n: number };
  /** Lamp oil spilled where the room begins (a wrecked cart's: a fire trap), as sim/oil.ts slicks. */
  oil?: { x: number; y: number; r: number }[];
}
export interface Water { x: number; y: number; w: number; h: number; deep?: boolean }
/**
 * Paint only, what the goblins did: a body torn apart (`torn`), the pieces strewn about one they're at
 * (`strewn`), one tied up on the back wall and opened (`pinned`, x along the wall), one hung from a
 * rafter hook (`hung`), a cook-pot on their fire (`pot`), a heap of bones and clothes (`bones`), what's
 * left of the last one by a cage (`remains`), bloody hands on the back wall (`smear`), a count scratched
 * there in fives (`tally`), a body dragged from (x, y) to (x2, y2) (`trail`). `k` varies the look.
 */
export interface Grim { kind: 'torn' | 'strewn' | 'pinned' | 'hung' | 'pot' | 'bones' | 'remains' | 'smear' | 'tally' | 'trail'; x: number; y: number; x2?: number; y2?: number; k: number }
/** Fire in a house: patches that catch at `at` seconds (and burn on), beams that come down at `at`, the roof falling in at `fall`. */
/** `smoke`: from then on the smoke hurts everyone inside (a house set alight from outside with someone in it). */
export interface Blaze { patches: (Area & { at: number })[]; beams: { x: number; y: number; at: number }[]; fall: number; smoke?: number }
/** How fast anyone moves knee-deep in a ford or a bog: a little slower than dry ground (was 0.55, a crawl). */
export const WADE = 0.7;
/** How fast you can move where you stand (slowed in shallow water). */
export const wadeAt = (x: number, y: number) => (MAP.water?.some((w) => !w.deep && inArea(w, x, y)) ? WADE : 1);

export const onLedge = (m: GameMap, x: number, y: number) => !!m.ledges?.some((l) => x > l.x && x < l.x + l.w && y > l.y && y < l.y + l.h);
export const inRamp = (m: GameMap, x: number, y: number) => !!m.ledges?.some((l) => l.ramps.some((r) => inArea(r, x, y)));
/** The level a point is at (for things placed there). */
export const levelAt = (m: GameMap, x: number, y: number) => (onLedge(m, x, y) ? 1 : 0);

/** Which way you push to go in at a block's door (up the screen, or into a side way's side). */
export const pushDir = (b: Block): [number, number] => (b.face === 'W' ? [-1, 0] : b.face === 'E' ? [1, 0] : b.face === 'S' ? [0, 1] : [0, -1]);
/** A block's door: the spot in front of it you stand on to go in. */
export const doorAt = (b: Block) => {
  const [dx, dy] = pushDir(b);
  return dx ? { x: dx < 0 ? b.x + b.w + 0.45 : b.x - 0.45, y: b.y + b.h / 2 } : dy > 0 ? { x: b.x + b.w / 2, y: b.y - 0.45 } : { x: b.x + b.w / 2, y: b.y + b.h + 0.45 };
};
/** Walking into a door: pushing its way, lined up with it. */
export const pushingInto = (b: Block, h: { x: number; y: number }, i: { mx: number; my: number }) => {
  const [dx, dy] = pushDir(b), d = doorAt(b);
  return i.mx * dx + i.my * dy > 0.5 && (dx ? Math.abs(h.y - d.y) < 0.7 : Math.abs(h.x - d.x) < 0.7);
};
/** Where you come back out of a door: `k` tiles out from it into the room. */
export const doorOut = (b: Block, k: number) => {
  const [dx, dy] = pushDir(b), d = doorAt(b);
  return { x: d.x - dx * k, y: d.y - dy * k };
};
/** A block that still stands in the way (burned-down ones are rubble you walk over). */
export const solid = (b: Block) => !b.ruined;

/** The training room (the Training Yard in town). */
export const ARENA = {
  name: 'TRAINING YARD',
  w: 18,
  h: 16,
  wallFace: 3,
  rounds: [
    { x: 4, y: 4.5, r: 0.55, kind: 'pillar' },
    { x: 14, y: 4.5, r: 0.55, kind: 'pillar' },
  ] as Round[],
  blocks: [] as Block[],
  torches: [
    { x: 4.5, y: -1.6 },
    { x: 13.5, y: -1.6 },
  ],
  braziers: [
    { x: 1.4, y: 14.6, r: 0.35 },
    { x: 16.6, y: 14.6, r: 0.35 },
  ],
  hero: { x: 9, y: 12 },
  exit: { x: 8, y: 15.3, w: 2, h: 0.7 } as Area | null,
  theme: { floor: 'flagstone', back: 'stone', ambient: [0.2, 0.19, 0.27], moon: 0.42 } as Theme,
  spawn: {
    hero: { x: 9, y: 12 },
    butcher: { x: 9, y: 5 },
    dummy: { x: 3.5, y: 11 },
    swingDummy: { x: 14.5, y: 11 },
    scrappers: [
      { x: 2.2, y: 2.4 },
      { x: 13.2, y: 2.4 },
    ],
  },
  cage: { x: 15.5, y: 0.9 },
  /** Kept for older code: the pillars are the round obstacles of kind 'pillar'. */
  get pillars(): Circle[] {
    return this.rounds.filter((r) => r.kind === 'pillar');
  },
};

let MAP: GameMap = ARENA;
/** Set the map rules collide against (the running room does this). */
export function useMap(m: GameMap): void {
  MAP = m;
}
export const currentMap = () => MAP;

export const inArea = (a: Area | null, x: number, y: number) => !!a && x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;

/** Keep a circle inside the map and out of round things and blocks. */
export function collide(p: { x: number; y: number }, r: number): void {
  const m = MAP;
  p.x = Math.max(r, Math.min(m.w - r, p.x));
  p.y = Math.max(r * 0.6, Math.min(m.h - r, p.y));
  // A big map: only what's near (shared/mapgrid.ts).
  const near = nearby(m, p.x, p.y) ?? m;
  for (const c of near.rounds) push(p, r, c);
  for (const c of near.braziers) push(p, r, c);
  for (const n of m.npcs ?? []) if (!n.path && !n.pose) push(p, r, { x: n.x, y: n.y, r: 0.32 });
  for (const b of near.blocks) {
    if (!b.ruined) box(p, r, b);
  }
  if (m.ledges) levels(m, p as { x: number; y: number; z?: number; dropped?: number; kvx?: number; kvy?: number }, r);
  // Deep water stops bodies (things with a footing), never a shot over it.
  if (m.water && 'z' in p) for (const w of m.water) if (w.deep) box(p, r, w);
  // Pushed out of something standing near the edge (a bed against a wall): never out past the edge.
  p.x = Math.max(r, Math.min(m.w - r, p.x));
  p.y = Math.max(r * 0.6, Math.min(m.h - r, p.y));
}

/**
 * Heights: on a ramp you take the level of where you stand; on the ground a ledge is a wall; walk off
 * a ledge's edge and you drop to the ground. Things without a level (shots in the air, a point being
 * tested) aren't stopped by ledges at all.
 */
function levels(m: GameMap, p: { x: number; y: number; z?: number; dropped?: number; kvx?: number; kvy?: number }, r: number): void {
  // Things with no footing (a shot, a thrown javelin, a point being tested) pass over ledges.
  if (!('z' in p)) return;
  const up = onLedge(m, p.x, p.y);
  if (inRamp(m, p.x, p.y)) {
    if ('z' in p) p.z = up ? 1 : 0;
    return;
  }
  if ((p.z ?? 0) >= 1) {
    if (!up) (p.z = 0), (p.dropped = Math.hypot(p.kvx ?? 0, p.kvy ?? 0));
    return;
  }
  for (const l of m.ledges!) box(p, r, l);
}

/** Push a circle out of a box. */
function box(p: { x: number; y: number }, r: number, b: { x: number; y: number; w: number; h: number }): void {
  const nx = Math.max(b.x, Math.min(b.x + b.w, p.x)), ny = Math.max(b.y, Math.min(b.y + b.h, p.y));
  const dx = p.x - nx, dy = p.y - ny, d = Math.hypot(dx, dy);
  if (d >= r) return;
  if (d > 1e-6) {
    p.x = nx + (dx / d) * r;
    p.y = ny + (dy / d) * r;
  } else {
    // Inside: out by the nearest side.
    const left = p.x - b.x, right = b.x + b.w - p.x, top = p.y - b.y, bottom = b.y + b.h - p.y, k = Math.min(left, right, top, bottom);
    if (k === left) p.x = b.x - r;
    else if (k === right) p.x = b.x + b.w + r;
    else if (k === top) p.y = b.y - r;
    else p.y = b.y + b.h + r;
  }
}

function push(p: { x: number; y: number }, r: number, c: Circle): void {
  const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy), min = c.r + r;
  if (d < min && d > 1e-6) {
    p.x = c.x + (dx / d) * min;
    p.y = c.y + (dy / d) * min;
  }
}
