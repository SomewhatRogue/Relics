/**
 * The tools for laying out a house's inside: what a layout gives back, a free-spot finder that keeps
 * the way in clear, and a mirror (any layout can be flipped left to right). Tile units, the back wall
 * at y = 0, the door at the bottom middle.
 */
import type { Block, Round, Theme } from './arena.js';
import type { PropKind } from './props.js';
import type { Rng } from './rng.js';

export type P = { x: number; y: number };
export type Prop = { kind: PropKind; x: number; y: number };

export interface Layout {
  name: string;
  w: number;
  h: number;
  floor: Theme['floor'];
  blocks: Block[];
  rounds: Round[];
  props: Prop[];
  /** The hearth or forge, if there is one: its fire burns in its mouth when it's lit. */
  hearth?: Block;
  /** Where goblins stand about, where they sleep, a tucked-away spot for a cage, a spot for a body. */
  stand: P[];
  sleep: P[];
  hide: P;
  body: P;
  /** Where a lantern post would stand (a barn). */
  lamp?: P;
}

export const b = (kind: Block['kind'], x: number, y: number, w: number, h: number): Block => ({ kind, x, y, w, h });
export const p = (x: number, y: number): P => ({ x, y });

/** The way in: nothing stands between the door and the middle of the room. */
export const inDoorway = (w: number, h: number, x: number, y: number, r: number) => Math.abs(x - w / 2) < 1.5 + r && y > h - 3.2 - r;

/** Distance from a point to a box (0 inside it). */
const toBox = (q: Block, x: number, y: number) => Math.hypot(x - Math.max(q.x, Math.min(q.x + q.w, x)), y - Math.max(q.y, Math.min(q.y + q.h, y)));

/** A spot of radius `r` clear of everything in the layout so far, with room to walk round it. */
export function freeSpot(l: Pick<Layout, 'w' | 'h' | 'blocks' | 'rounds' | 'props'>, rng: Rng, r: number, y0 = 1, y1 = l.h - 1): P | null {
  for (let t = 0; t < 60; t++) {
    const x = rng.range(0.6 + r, l.w - 0.6 - r), y = rng.range(y0 + r, y1 - r);
    if (isFree(l, x, y, r)) return { x, y };
  }
  return null;
}

export function isFree(l: Pick<Layout, 'w' | 'h' | 'blocks' | 'rounds' | 'props'>, x: number, y: number, r: number, gap = 0.75): boolean {
  if (inDoorway(l.w, l.h, x, y, r)) return false;
  return l.blocks.every((q) => toBox(q, x, y) >= r + gap) && l.rounds.every((c) => Math.hypot(c.x - x, c.y - y) >= c.r + r + gap) &&
    l.props.every((q) => Math.hypot(q.x - x, q.y - y) >= r + 0.5 + gap);
}

/** Flip a layout left to right. */
export function mirror(l: Layout): Layout {
  const fx = <T extends P>(q: T): T => ({ ...q, x: l.w - q.x });
  const blocks = l.blocks.map((q) => ({ ...q, x: l.w - q.x - q.w }));
  const hearth = l.hearth ? blocks[l.blocks.indexOf(l.hearth)] : undefined;
  return {
    ...l, blocks, hearth, rounds: l.rounds.map(fx), props: l.props.map(fx), stand: l.stand.map(fx), sleep: l.sleep.map(fx),
    hide: fx(l.hide), body: fx(l.body), lamp: l.lamp && fx(l.lamp),
  };
}
