/**
 * Where a storm's lightning goes (sim/storm.ts): something tall or metal out in the open near the
 * party, a lone tree, a banner pole, a siege engine, or a goblin standing well clear of any wall (a hero
 * now and then, rarely); with nothing like that about, bare open ground near someone. Weighted by
 * LIGHTNING.weights, chosen on the room's own sky stream, so every screen sees the same.
 */
import type { Block, GameMap, Round } from '../shared/arena';
import { ENGINE } from '../shared/expedcamps';
import type { Rng } from '../shared/rng';
import { LIGHTNING } from '../shared/tuning';
import { isDead } from './damage';
import type { Enemy, Hero, Strike } from './types';

type Pick = { x: number; y: number; on: Strike['on'] };
const TALL = new Set(['tree', 'pine', 'deadtree']);
const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

/** How far (x, y) is from block `b` (0 inside it). */
const off = (b: Block, x: number, y: number) => Math.hypot(Math.max(b.x - x, 0, x - b.x - b.w), Math.max(b.y - y, 0, y - b.y - b.h));

/** Out in the open: clear of the map's edges and of every wall, house and fence by LIGHTNING.open. */
export function inOpen(map: GameMap, x: number, y: number): boolean {
  if (x < LIGHTNING.edge || y < LIGHTNING.edge || x > map.w - LIGHTNING.edge || y > map.h - LIGHTNING.edge) return false;
  return !map.blocks.some((b) => !b.ruined && off(b, x, y) < LIGHTNING.open);
}

/** A map's lone trees (no other within LIGHTNING.lone), found once a map. */
const lone = new WeakMap<GameMap, Round[]>();
function loneTrees(map: GameMap): Round[] {
  let l = lone.get(map);
  if (!l) {
    const trees = map.rounds.filter((r) => TALL.has(r.kind));
    l = trees.filter((t) => !trees.some((o) => o !== t && Math.hypot(o.x - t.x, o.y - t.y) < LIGHTNING.lone) && t.x > LIGHTNING.edge && t.y > LIGHTNING.edge && t.x < map.w - LIGHTNING.edge && t.y < map.h - LIGHTNING.edge);
    lone.set(map, l);
  }
  return l;
}

/** What this strike goes for, or null (nobody about, nowhere open). */
export function pickStrike(map: GameMap, heroes: Hero[], enemies: Enemy[], rng: Rng): Pick | null {
  const party = heroes.filter(up);
  if (!party.length) return null;
  const near = (x: number, y: number) => party.some((h) => Math.hypot(h.x - x, h.y - y) <= LIGHTNING.near);
  const W = LIGHTNING.weights, all: (Pick & { w: number })[] = [];
  for (const t of loneTrees(map)) if (near(t.x, t.y)) all.push({ x: t.x, y: t.y, on: 'tree', w: W.tree });
  for (const b of map.blocks) {
    const x = b.x + b.w / 2, y = b.y + b.h / 2;
    if (b.kind === 'cart' && b.look === ENGINE.look && !b.ruined && near(x, y)) all.push({ x, y, on: 'engine', w: W.engine });
  }
  for (const e of enemies) {
    if (isDead(e) || e.under || (e.z ?? 0) !== 0 || e.dozing || !near(e.x, e.y)) continue;
    if (e.variant === 'banner') all.push({ x: e.x, y: e.y, on: 'banner', w: W.banner });
    else if (inOpen(map, e.x, e.y)) all.push({ x: e.x, y: e.y, on: 'goblin', w: W.goblin });
  }
  for (const h of party) if ((h.z ?? 0) === 0 && inOpen(map, h.x, h.y)) all.push({ x: h.x, y: h.y, on: 'hero', w: W.hero });
  const total = all.reduce((n, p) => n + p.w, 0);
  if (total > 0) {
    let r = rng.next() * total;
    for (const p of all) if ((r -= p.w) < 0) return { x: p.x, y: p.y, on: p.on };
    return all[all.length - 1];
  }
  // Nothing tall about: open ground a few steps from someone.
  for (let i = 0; i < 6; i++) {
    const h = party[rng.int(party.length)], a = rng.next() * Math.PI * 2, d = rng.range(3, 7), x = h.x + Math.cos(a) * d, y = h.y + Math.sin(a) * d;
    if (inOpen(map, x, y)) return { x, y, on: 'ground' };
  }
  return null;
}
