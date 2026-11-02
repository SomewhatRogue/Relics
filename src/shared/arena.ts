/**
 * Maps: what the client draws and what the rules collide against, in one place. Tile units. The
 * floor runs from (0, 0) to (w, h); the back wall's face is drawn above y = 0. One map is in use at
 * a time (the room that's running sets it), so collision never needs it passed around.
 */
export type Circle = { x: number; y: number; r: number };
export type RoundKind = 'pillar' | 'tree' | 'pine' | 'rock' | 'hay' | 'well' | 'lantern' | 'support' | 'stump' | 'target' | 'stone' | 'post' | 'grate' | 'statue' | 'bush';
export type BlockKind = 'house' | 'barn' | 'hall' | 'church' | 'forge' | 'stall' | 'tent' | 'rockwall' | 'fence' | 'granary' | 'wall' | 'den'
  // Furniture, inside buildings.
  | 'counter' | 'bed' | 'shelf' | 'anvil' | 'altar' | 'pew' | 'bench' | 'hearth' | 'sacks'
  // Wickhold's other buildings and things in the street.
  | 'tower' | 'tavern' | 'monument' | 'rubble' | 'cart' | 'rack';
export interface Round extends Circle { kind: RoundKind }
export interface Block {
  x: number; y: number; w: number; h: number; kind: BlockKind; label?: string;
  /** Walk up into the door (bottom middle) to go in: the interior's id. */
  door?: string;
  /** Wooden buildings in a run can be smashed and burned: health, when it caught fire (-1 not), burned down. */
  hp?: number; maxHp?: number; burning?: number; ruined?: boolean;
  /** Burning for show, never spreading or burning down (the wagons on the battlefield). */
  smoulder?: boolean;
  /** A door that won't open yet (the story or the town works open it). */
  locked?: boolean;
}
/**
 * Raised ground: a ledge, a rock shelf, a wall walk. Up on it you stand on level 1. From the ground
 * its edge is a wall; from on top you can step off it (a drop). Ramps (stairs, a slope) overlap its
 * edge: inside a ramp you go freely between the levels.
 */
export interface Ledge { x: number; y: number; w: number; h: number; ramps: Area[]; kind?: 'rock' | 'wood' }
/** A way out of a run room, when there's more than one: the road it leads to. */
export interface Road { area: Area; road: 'high' | 'low'; label: string }
/** Someone to talk to: `talk` says what they offer (a town spot's panel), `look` how they're drawn. */
export interface Npc {
  x: number; y: number; name: string; talk: string; look: string; arg?: number;
  /** A round they walk (a guard's patrol), at `speed` tiles a second; they don't block anyone. */
  path?: [number, number][];
  speed?: number;
  /** Cutscene puppetry: lifted off the ground (pixels), walking, or dead (`headless` standing, `body` on the ground). */
  lift?: number;
  walking?: boolean;
  pose?: 'headless' | 'body' | 'corpse';
  /** Stopped to talk to you (on their round): since when, and how long they've stood about in all. */
  heldAt?: number;
  lag?: number;
}

/** Where someone is at time `t` (walking their round, or standing where they stand), and which way they face. */
export function npcAt(n: Npc, t: number): { x: number; y: number; fx: number; fy: number } {
  const p = n.path;
  if (!p || p.length < 2) return { x: n.x, y: n.y, fx: 0, fy: 1 };
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
  floor: 'flagstone' | 'cobble' | 'grass' | 'dirt' | 'rock' | 'wheat' | 'planks';
  /** The back wall's face: stone, a palisade, a treeline, a rock face, or a room's plastered wall. */
  back: 'stone' | 'palisade' | 'trees' | 'rockface' | 'plaster';
  ambient: [number, number, number];
  /** Moonlight strength over the middle (0: none). */
  moon: number;
  /** Daylight: no moon pool, no lanterns, the ambient does it all. */
  day?: boolean;
}

export interface GameMap {
  name: string;
  w: number;
  h: number;
  /** Height of the back wall's face, in tiles (three-quarter view). */
  wallFace: number;
  rounds: Round[];
  blocks: Block[];
  braziers: Circle[];
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
}

export const onLedge = (m: GameMap, x: number, y: number) => !!m.ledges?.some((l) => x > l.x && x < l.x + l.w && y > l.y && y < l.y + l.h);
export const inRamp = (m: GameMap, x: number, y: number) => !!m.ledges?.some((l) => l.ramps.some((r) => inArea(r, x, y)));
/** The level a point is at (for things placed there). */
export const levelAt = (m: GameMap, x: number, y: number) => (onLedge(m, x, y) ? 1 : 0);

/** A block's door: the spot in front of it you stand on to go in. */
export const doorAt = (b: Block) => ({ x: b.x + b.w / 2, y: b.y + b.h + 0.45 });
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
  for (const c of m.rounds) push(p, r, c);
  for (const c of m.braziers) push(p, r, c);
  for (const n of m.npcs ?? []) if (!n.path && !n.pose) push(p, r, { x: n.x, y: n.y, r: 0.32 });
  for (const b of m.blocks) {
    if (!b.ruined) box(p, r, b);
  }
  if (m.ledges) levels(m, p as { x: number; y: number; z?: number; dropped?: number; kvx?: number; kvy?: number }, r);
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
