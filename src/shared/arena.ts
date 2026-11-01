/**
 * Maps: what the client draws and what the rules collide against, in one place. Tile units. The
 * floor runs from (0, 0) to (w, h); the back wall's face is drawn above y = 0. One map is in use at
 * a time (the room that's running sets it), so collision never needs it passed around.
 */
export type Circle = { x: number; y: number; r: number };
export type RoundKind = 'pillar' | 'tree' | 'pine' | 'rock' | 'hay' | 'well' | 'lantern' | 'support' | 'stump';
export type BlockKind = 'house' | 'barn' | 'hall' | 'church' | 'forge' | 'stall' | 'tent' | 'rockwall' | 'fence' | 'granary' | 'wall';
export interface Round extends Circle { kind: RoundKind }
export interface Block { x: number; y: number; w: number; h: number; kind: BlockKind; label?: string }
export interface Area { x: number; y: number; w: number; h: number }

/** How a map looks: floor, walls, light. */
export interface Theme {
  floor: 'flagstone' | 'cobble' | 'grass' | 'dirt' | 'rock' | 'wheat';
  /** The back wall's face: stone, a palisade, a treeline, or a rock face. */
  back: 'stone' | 'palisade' | 'trees' | 'rockface';
  ambient: [number, number, number];
  /** Moonlight strength over the middle (0: none). */
  moon: number;
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
}

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
  for (const b of m.blocks) {
    const nx = Math.max(b.x, Math.min(b.x + b.w, p.x)), ny = Math.max(b.y, Math.min(b.y + b.h, p.y));
    const dx = p.x - nx, dy = p.y - ny, d = Math.hypot(dx, dy);
    if (d >= r) continue;
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
}

function push(p: { x: number; y: number }, r: number, c: Circle): void {
  const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy), min = c.r + r;
  if (d < min && d > 1e-6) {
    p.x = c.x + (dx / d) * min;
    p.y = c.y + (dy / d) * min;
  }
}
