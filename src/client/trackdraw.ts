/**
 * The Haulier's tracks on screen (sim/trackshape.ts, shared/haultune.ts `track`): the striped lane along the
 * picked track for the last second of its warning (the shape the room judges), and which track's lamps are lit
 * (sumpdraw.ts draws them). Drawing only.
 */
import type { ArenaRoom } from '../sim/room';
import { trackShapes } from '../sim/trackshape';
import type { Ctx } from './draw';
import { drawTelegraph } from './foes';
import type { TrackLit } from './sumpdraw';

/** The track whose cart is coming, if any: lit from the warning's start until it goes. */
export function trackLit(room: ArenaRoom): TrackLit {
  const w = room.enemies.find((e) => e.boss?.who === 'haulier' && e.act !== 'dead')?.boss?.track;
  return w && room.time >= w.at && room.time < w.go ? { i: w.i } : null;
}

/** Under everyone: the lane. */
export function drawTrackMarks(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  for (const e of room.enemies) if (e.boss?.who === 'haulier') for (const s of trackShapes(e, room.time)) drawTelegraph(c, s, cx, cy);
}
