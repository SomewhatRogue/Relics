/**
 * A river across a room and the ways over it: fords (shallows you wade, slowly) and, at Brokenbridge
 * and the ford rooms that have one, a bridge broken in the middle. The bridge's two ends still stand
 * out over the water (you can walk out on them and look at the gap) but the middle is gone, deep
 * water under it: the shallows are the only way across. Water is a rule (deep stops a body), so the
 * room decides by these boxes; the boards, posts and rope are drawn from the `bridge` mark.
 */
import type { Mark, Water } from './arena.js';

export interface River { y: number; h: number; water: Water[]; fords: { x: number; w: number }[]; bridge?: { x: number; w: number }; down?: boolean }

/** How far each of the bridge's broken ends still reaches out over the water (tiles). */
export const BRIDGE_END = 0.8;
export const BRIDGE_W = 3;

/**
 * Deep water from wall to wall at height `y`, `h` deep, but for the fords (x, width) and a broken
 * bridge centred on `bridgeX` if given.
 */
export function river(w: number, y: number, h: number, fords: { x: number; w: number }[], bridgeX?: number): River {
  const water: Water[] = [], cuts: { x: number; w: number; kind: 'ford' | 'bridge' }[] = fords.map((f) => ({ ...f, kind: 'ford' as const }));
  const bridge = bridgeX === undefined ? undefined : { x: bridgeX - BRIDGE_W / 2, w: BRIDGE_W };
  if (bridge) cuts.push({ ...bridge, kind: 'bridge' });
  cuts.sort((a, b) => a.x - b.x);
  let at = 0;
  for (const c of cuts) {
    if (c.x - at > 0.01) water.push({ x: at, y, w: c.x - at, h, deep: true });
    if (c.kind === 'ford') water.push({ x: c.x, y, w: c.w, h });
    // Under the bridge: deep only where the deck is gone; its two ends are standing timber.
    else water.push({ x: c.x, y: y + BRIDGE_END, w: c.w, h: h - BRIDGE_END * 2, deep: true });
    at = c.x + c.w;
  }
  if (w - at > 0.01) water.push({ x: at, y, w: w - at, h, deep: true });
  return { y, h, water, fords, bridge };
}

/** What a broken bridge shows: the deck's ends with their posts (the mark), and its wreck in the water below. */
export function bridgeBits(r: River): { marks: Mark[] } {
  const b = r.bridge;
  if (!b) return { marks: [] };
  // Below the gap, carried a little downstream (east): boards and a snapped beam caught on the stones.
  return {
    marks: [
      { kind: 'bridge', x: b.x, y: r.y - 0.5, w: b.w, h: r.h + 1 },
      { kind: 'planks', x: b.x + b.w * 0.55, y: r.y + r.h * 0.42, w: 2.2, h: 0.5 },
      { kind: 'debris', x: b.x + b.w - 0.4, y: r.y + r.h * 0.3, w: 1.8, h: 1 },
    ],
  };
}

/**
 * The same river running down the room (a leg that goes left to right crosses it): deep water from the
 * top wall to the bottom at x `x`, `w` wide, but for the fords (each a y and a length down it). Its
 * `y` and `h` are its x and width, and `down` says so.
 */
export function riverDown(h: number, x: number, w: number, fords: { x: number; w: number }[]): River {
  const across = river(h, x, w, fords);
  return { ...across, down: true, water: across.water.map((q) => ({ x: q.y, y: q.x, w: q.h, h: q.w, deep: q.deep })) };
}
