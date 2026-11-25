/**
 * The new Wickhold as a map (docs/design/town-layout.md), behind `?street` (town.ts's LAYOUT): the plan's buildings,
 * levels and steps (layoutplan.ts), with today's town's people, things, marks and animals moved into it by district
 * (layoutmove.ts). Built from today's map for the same world, so whatever the world has done shows the same way.
 * Pure.
 */
import type { Block, GameMap, Npc, Round } from './arena.js';
import type { Life } from './townlife.js';
import type { PropKind } from './props.js';
import type { WorldState } from './story.js';
import { DUCKS, QUIET, ROUNDS, STALL, moveBox, movePoint, overrideOf } from './layoutmove.js';

import { ARRIVE, LEDGES, LH, LW, OWN_ROUNDS, POND, SOIL, planBlocks } from './layoutplan.js';

/** What a building is, rather than a thing standing in the street: the plan has its own. */
const BUILT = new Set<Block['kind']>(['house', 'hall', 'church', 'forge', 'tower', 'wall', 'tavern', 'granary', 'rack']);

/** A point of today's town, now: set by hand, moved with its district, or null (left out). */
function place(kind: string, x: number, y: number): [number, number] | null {
  const o = overrideOf(kind, x, y);
  return o ? o.to : movePoint(x, y);
}

export function layoutPoint(x: number, y: number): [number, number] {
  return movePoint(x, y) ?? [x, y];
}

export function layoutSpots<T extends { x: number; y: number }>(spots: T[]): T[] {
  return spots.flatMap((s) => {
    const p = place('spot', s.x, s.y);
    return p ? [{ ...s, x: p[0], y: p[1] }] : [];
  });
}

export function layoutProps(props: { kind: PropKind; x: number; y: number }[]): { kind: PropKind; x: number; y: number }[] {
  return props.flatMap((q) => {
    const p = place(q.kind, q.x, q.y);
    return p ? [{ ...q, x: p[0], y: p[1] }] : [];
  });
}

function moveNpc(n: Npc): Npc | null {
  const r = ROUNDS[n.name === 'OLD MERREN' && n.x < 54 ? 'OLD MERREN (RUBBLE)' : n.name];
  if (r && r.path.length === 1) return { ...n, x: r.path[0][0], y: r.path[0][1], path: undefined, stops: undefined };
  if (r) return { ...n, x: r.path[0][0], y: r.path[0][1], path: r.path, stops: r.stops ?? (n.stops ? r.path.map(() => 0) : undefined) };
  const at = movePoint(n.x, n.y);
  if (!at) return null;
  const path = n.path?.map(([x, y]) => movePoint(x, y));
  if (path?.some((p) => !p)) return null;
  return { ...n, x: at[0], y: at[1], path: path as [number, number][] | undefined };
}

function moveBlock(b: Block): Block | null {
  if (BUILT.has(b.kind) || (b.kind === 'rubble' && b.h > 5)) return null;
  const c = place(b.kind, b.x + b.w / 2, b.y + b.h / 2);
  // The market's two stalls (2 deep today) made bigger; the job and works boards keep their size.
  const [w, h] = b.kind === 'stall' && b.h > 1 ? STALL : [b.w, b.h];
  return c ? { ...b, w, h, x: c[0] - w / 2, y: c[1] - h / 2 } : null;
}

/** How many of Rescue Row's homes stand (today's map has them as doors `home:i`). */
const homesOf = (m: GameMap) => m.blocks.filter((b) => b.door?.startsWith('home:')).length;

export function layoutTown(w: WorldState, old: GameMap): GameMap {
  const rounds: Round[] = [...OWN_ROUNDS];
  for (const o of old.rounds) {
    if (QUIET.rounds.has(o.kind)) continue;
    const p = place(o.kind, o.x, o.y);
    if (p) rounds.push({ ...o, x: p[0], y: p[1] });
  }
  const blocks = [...planBlocks(w, homesOf(old)), ...old.blocks.flatMap((b) => moveBlock(b) ?? [])];
  const npcs = (old.npcs ?? []).filter((n) => !QUIET.npcs.has(n.name)).flatMap((n) => moveNpc(n) ?? []);
  // (A mark on the ground that would land on the millpond is left out: the weeds along today's east lane came with
  // the pond's district and ran right across the water. Kyle, 2026-11-16: "a weird line through the pond".)
  const wet = (k: { x: number; y: number; w: number; h: number }) => k.x < POND.x + POND.w && k.x + k.w > POND.x && k.y < POND.y + POND.h && k.y + k.h > POND.y;
  const marks = (old.marks ?? []).flatMap((k) => moveBox(k) ?? []).filter((k) => !wet(k));
  const life = (old.life ?? []).filter((l) => !QUIET.life.has(l.kind)).flatMap((l): Life[] => {
    if (l.kind === 'ducks') return [{ ...l, x: DUCKS[0][0], y: DUCKS[0][1], path: DUCKS }];
    const p = movePoint(l.x, l.y);
    return p ? [{ ...l, x: p[0], y: p[1], path: undefined }] : [];
  });
  const braziers = old.braziers.flatMap((b) => {
    const p = movePoint(b.x, b.y);
    return p ? [{ ...b, x: p[0], y: p[1] }] : [];
  });
  return {
    ...old, w: LW, h: LH, rounds, blocks, npcs, marks, life, braziers, ledges: LEDGES, settle: true,
    soil: SOIL, water: [{ ...POND, deep: true }], hero: ARRIVE,
    // (The breach in the back wall stays where it is: the back wall is still the north wall.)
  };
}
