/**
 * The new look's houses on a job (docs/design/new-look-interiors.md, slice 4): a house's layout grown (`growth`)
 * across and deep under `?street`, before anyone is put in it. Inner walls stretch with the room (their doorways
 * wider); furniture keeps its size, and keeps to a wall it stood against; everything else spreads with the room.
 */
import type { Block } from './arena.js';
import type { Layout, P } from './housekit.js';

/** How much a house grows: a cottage or barn 1.6 times, the big ones (longhouse, hall house, tithe barn) less, so
 *  none comes out bigger than the church. */
export const growth = (l: Pick<Layout, 'w'>) => (l.w > 15 ? 1.35 : 1.6);
/** How tall a grown house's walls rise in 2.5D (three/insidekit.ts), tiles. */
export const houseWallH = (l: Pick<Layout, 'w'>) => (l.w > 22 ? 5.5 : 4.5);
const NEAR = 0.7;

/** One axis of a block: stretched (an inner wall along it), kept to a wall it touches, or moved with the room. */
function axis(K: number, a: number, len: number, room: number, stretch: boolean): [number, number] {
  if (stretch) return [a * K, len * K];
  if (a < NEAR) return [a, len];
  if (a + len > room - NEAR) return [room * K - (room - a), len];
  return [(a + len / 2) * K - len / 2, len];
}


export function growHouse(l: Layout): Layout {
  const K = growth(l), grow = (q: P): P => ({ x: q.x * K, y: q.y * K });
  const blocks = l.blocks.map((b): Block => {
    const wall = b.kind === 'partition', long = b.w >= b.h;
    const [x, w] = axis(K, b.x, b.w, l.w, wall && long), [y, h] = axis(K, b.y, b.h, l.h, wall && !long);
    // An inner wall's thickness stays put, at its grown place.
    return wall ? { ...b, ...(long ? { x, w, y: b.y * K } : { y, h, x: b.x * K }) } : { ...b, x, w, y, h };
  });
  const at = l.hearth ? l.blocks.indexOf(l.hearth) : -1;
  return {
    ...l, w: l.w * K, h: l.h * K, blocks, hearth: at >= 0 ? blocks[at] : l.hearth,
    rounds: l.rounds.map((c) => ({ ...c, ...grow(c) })), props: l.props.map((q) => ({ ...q, ...grow(q) })),
    stand: l.stand.map(grow), sleep: l.sleep.map(grow), hide: grow(l.hide), body: grow(l.body), lamp: l.lamp && grow(l.lamp),
  };
}
