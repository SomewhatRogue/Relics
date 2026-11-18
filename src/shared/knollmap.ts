/**
 * The knoll (docs/design/elevation.md, "Raised areas"): a small test map (`?land=knoll`) for the one kind of height
 * the game keeps. The land is flat. One raised area stands on it: flat on top, two levels high, its tall face toward
 * the camera (south) and along its open side (east), its back grown over so nothing ever drops away out of sight.
 * Two narrow ways up, each drawn as log steps between two posts: up the south face, and up the east end. It has a job in the fight: two
 * archers on its lip cover the field below, and the cage and a chest are up there with a brute.
 *
 * One map of 40 by 46, in from the bottom and out at the top by the road round the knoll's east end, always by day.
 * The seed shuffles the cover and the trees, never the knoll, its ways up, the cage or the goblins.
 */
import { levelAt, type GameMap, type Ledge, type Stretch } from './arena.js';
import { block, claim, mark, newKit, patch, prop, round, scatter, type Kit } from './expedkit.js';
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { THEMES, type Foe } from './terrain.js';
import { layRoad, road, wall } from './terrkit.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';

export const KNOLL = { w: 40, h: 46 };
/** The raised area: its box, how high, and its two ways up (each a ramp across the edge it climbs). */
export const RISE = { x: 3, y: 4, w: 21, h: 16, lv: 2 };
export const STEPS = { x: 9, y: RISE.y + RISE.h - 1.5, w: 2, h: 3 };
export const TRACK = { x: RISE.x + RISE.w - 1.5, y: 12, w: 3, h: 2 };
/** How far up its back is grown over (trees and bushes on top, nowhere to stand or to drop from). */
const BACK = 9.5;
export const KNOLL_CAGE = { x: 13.5, y: 12.6 };
export const KNOLL_ZONES: TerrZone[] = [{ name: 'THE KNOLL', kind: 'zone', x: 3, y: 4, w: 34, h: 38, stretch: 0 }];

function knoll(): Ledge {
  return { x: RISE.x, y: RISE.y, w: RISE.w, h: RISE.h, lv: RISE.lv, ramps: [{ ...STEPS }, { ...TRACK }], kind: 'earth' };
}

export function knollPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 7919 + 61));
  Object.assign(k, { mw: KNOLL.w, mh: KNOLL.h });
  const { w, h } = KNOLL, ledges = [knoll()], lv = (x: number, y: number) => levelAt({ ledges } as unknown as GameMap, x, y);
  const line = road(k, [{ x: 20, y: 44 }, { x: 20, y: 34 }, { x: 29, y: 24 }, { x: 30, y: 11 }, { x: 22, y: 1 }], [0.4, 0.6, 0.5, 0.3]);
  for (const [x, y, r] of [[20, 43, 2.2], [22, 1.8, 2], [STEPS.x + 1, STEPS.y + STEPS.h + 0.8, 1.6], [STEPS.x + 1, STEPS.y - 0.8, 1.4], [TRACK.x + TRACK.w + 0.8, TRACK.y + 1, 1.6], [TRACK.x - 0.8, TRACK.y + 1, 1.4]]) claim(k, x, y, r);
  // Walled both sides and along the top; grass, a cut field below the face, straw under the cage.
  wall(k, { x: 2.4, y: 0.4 }, { x: 2.4, y: h - 0.4 }), wall(k, { x: w - 2.4, y: 0.4 }, { x: w - 2.4, y: h - 0.4 });
  wall(k, { x: 2.4, y: 0.8 }, { x: 19.5, y: 0.8 }), wall(k, { x: 24.5, y: 0.8 }, { x: w - 2.4, y: 0.8 });
  wall(k, { x: 2.4, y: h - 0.8 }, { x: 17.5, y: h - 0.8 }), wall(k, { x: 22.5, y: h - 0.8 }, { x: w - 2.4, y: h - 0.8 });
  patch(k, 'grass', 0, 0, w, h, false), patch(k, 'furrow', 5, 23, 22, 14, true), patch(k, 'straw', 11, 10.6, 6, 4.4, true);
  // Its back, grown over: a hedge of bushes across the top of the knoll, a copse behind it.
  wall(k, { x: RISE.x + 0.4, y: BACK }, { x: RISE.x + RISE.w - 0.5, y: BACK }, 0.42);
  for (let i = 0; i < 16; i++) k.rounds.push({ kind: k.rng.pick(['tree', 'tree', 'pine']), x: k.rng.range(RISE.x + 1, RISE.x + RISE.w - 1), y: k.rng.range(RISE.y + 0.8, BACK - 1), r: k.rng.range(0.5, 0.75) });
  // On top: the cage, a chest at the back, the brute by them, the two archers on the lip over the field.
  prop(k, 'cage', KNOLL_CAGE.x, KNOLL_CAGE.y);
  k.chests.push({ x: 19.4, y: 11.2 });
  const put = (x: number, y: number, role: Role, more: Partial<Foe> = {}) => {
    const f = Object.assign(cast({ kind: 'scrapper', x, y, pack: 301 }, role), more), z = lv(x, y);
    if (z) f.z = z;
    k.foes.push(f), claim(k, x, y, 0.6);
  };
  put(15.6, 13.8, 'heavy'), put(13, 18.6, 'archer'), put(18.4, 18.8, 'archer');
  // Below: three at a cart in the cut field, and cover from the bows: stooks, the cart, a few stones.
  block(k, 'cart', 14.6, 27.6, 2.4, 1.2);
  put(13.2, 29.4, 'fodder', { feeding: true }), put(17.8, 28.8, 'fodder', { feeding: true }), put(22, 26.4, 'fodder');
  for (const [x, y] of [[8, 25.4], [11.4, 32.6], [19.6, 31.8], [24.4, 29.6], [16.4, 24]]) round(k, 'hay', x + k.rng.range(-0.3, 0.3), y + k.rng.range(-0.3, 0.3), 0.5);
  scatter(k, 5, ['rock'], 5, 22.5, 34, 40, [0.35, 0.55]);
  scatter(k, 8, ['bush', 'tree'], 26, 3, 36, 42, [0.45, 0.7]);
  mark(k, 'debris', 12, 22.2, 1.2, 0.6), mark(k, 'debris', 26.4, 13.6, 1, 0.5);
  layRoad(k, line, 0.9);
  const s0: Stretch = { name: 'THE KNOLL', keep: [], packs: [301] };
  const map: GameMap = {
    name: 'THE KNOLL', w, h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: [], torches: [],
    hero: { x: 20, y: 43 }, exit: { x: 20.5, y: 0, w: 3, h: 0.9 }, theme: lightFor(THEMES.field, 'field', 'day'),
    water: k.water, soil: k.soil, marks: k.marks, ledges, stretches: [s0],
    // The top is raised: the cage, whoever is freed from it and a hero got up there stand on it.
    settle: true,
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: KNOLL_ZONES.map((z) => ({ ...z })) };
}
