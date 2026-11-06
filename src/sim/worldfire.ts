/**
 * Fire on the world (Kyle, 2026-11-05: "burn the dead"; numbers: shared/worldfx.ts). Each tick the room
 * gathers where fire is (a goblin set alight or burning, a fireball's burst, a flame sweep, the fire ring,
 * the wall of fire, a lit oil slick, a flare) and:
 *  - a body there (a small goblin's or one of the freed) burns to ash, so a butcher can't eat it (sim/meal.ts)
 *    (a small goblin that dies alight leaves ash too: sim/elements.ts);
 *  - ice there melts to steam (sim/ice.ts, steam.ts);
 *  - a burning goblin that wades in is put out, steaming.
 * One pure pass over the room's own state, so a guest's screen has the same ash and steam.
 */
import { FLARE, STEAM_CLOUD } from '../shared/tuning';
import { isDead } from './damage';
import type { World } from './elements';
import { inWall } from './firewall';
import { edible, edibleFreed, toAsh } from './meal';
import { slickBurn, type Slick } from './oil';
import { waterOf } from './pools';
import { onOil, steamAt } from './steam';
import type { Survivor, Zone } from './types';

type Spot = { x: number; y: number; r: number; by?: string };

/** What the pass needs of its room. */
export interface FireRoom { zones: Zone[]; slicks: Slick[]; survivors: Survivor[] }

/** Where fire is this tick (circles; the wall of fire is judged by its own shape). */
function spots(w: World, r: FireRoom): Spot[] {
  const out: Spot[] = [];
  for (const v of w.ev) {
    if (v.k === 'ignite') out.push({ x: v.x, y: v.y, r: 0.6 });
    else if (v.k === 'burst' && v.el === 'fire') out.push({ x: v.x, y: v.y, r: v.r });
    else if (v.k === 'slash' && v.el === 'fire') out.push({ x: v.x + v.dx * 0.9, y: v.y + v.dy * 0.9, r: 1 });
    else if (v.k === 'flare') out.push({ x: v.x, y: v.y, r: FLARE.radius });
    else if (v.k === 'oilfire') out.push({ x: v.x, y: v.y, r: 1 });
  }
  for (const z of r.zones) if (z.kind === 'fire' && w.now < z.until) out.push({ x: z.x, y: z.y, r: z.r, by: z.owner });
  for (const s of r.slicks) if (s.lit >= 0 && w.now - s.lit < slickBurn(s)) out.push({ x: s.x, y: s.y, r: s.r });
  for (const e of w.enemies) if (!isDead(e) && e.burnUntil > w.now) out.push({ x: e.x, y: e.y, r: e.radius + 0.2, by: e.lastBy });
  return out;
}

/** In fire: one of the spots, or a wall of fire standing or rolling. */
function inFire(list: Spot[], walls: Zone[], b: { x: number; y: number }, pad: number): Spot | Zone | undefined {
  return list.find((s) => Math.hypot(b.x - s.x, b.y - s.y) <= s.r + pad) ?? walls.find((z) => inWall(z, b, pad));
}

/** The pass, once a tick after the elements have had their turn. */
export function stepWorldFire(w: World, r: FireRoom): void {
  const fx = w.fx, list = spots(w, r), walls = r.zones.filter((z) => z.kind === 'firewall' && w.now < z.until);
  // A burning goblin wading in is put out, steaming.
  for (const e of w.enemies) if (fx && !isDead(e) && e.burnUntil > w.now && waterOf(e) >= 0 && !onOil(e, w.now)) (e.burnUntil = 0), steamAt(fx, e.x, e.y, STEAM_CLOUD.r, e.lastBy, w.now, w.ev);
  if (!list.length && !walls.length) return;
  for (const e of w.enemies) if (edible(e) && inFire(list, walls, e, 0.3)) toAsh(e, w.ev);
  for (const v of r.survivors) if (edibleFreed(v) && inFire(list, walls, v, 0.3)) toAsh(v, w.ev);
  if (!fx?.ices.length) return;
  // Ice under fire melts, in a cloud of steam.
  for (const i of [...fx.ices]) {
    if (w.now >= i.until) continue;
    const f = list.find((s) => Math.hypot(i.x - s.x, i.y - s.y) <= i.r + s.r * 0.8) ?? walls.find((z) => inWall(z, i, i.r * 0.8));
    if (!f) continue;
    i.until = w.now;
    fx.ices.splice(fx.ices.indexOf(i), 1);
    w.ev.push({ k: 'thaw', x: i.x, y: i.y });
    steamAt(fx, i.x, i.y, Math.max(STEAM_CLOUD.r, i.r), ('owner' in f ? f.owner : f.by) ?? '', w.now, w.ev);
  }
}
