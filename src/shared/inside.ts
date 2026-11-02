/**
 * Inside a cottage or barn on a job. The house's seed picks its layout (shared/houses.ts says which
 * sort it is), lights it (the hearth lit or cold, moonlight through a stove-in roof, the goblins' own
 * fire, a lantern in a barn) and says who's in: nobody, a goblin or two asleep, some at a body, a band
 * of them turning the place over, rarely a butcher in a barn, and now and then someone caged.
 */
import type { GameMap, Npc, Theme } from './arena.js';
import { backroom, cottage, looted, smith, store, weaver } from './layouts.js';
import { stalls, haybarn } from './barns.js';
import { house, houseSeed, type HouseKind } from './houses.js';
import { isFree, mirror, type Layout, type P } from './housekit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { Foe, RoomPlan } from './terrain.js';

const LAYOUTS: Record<HouseKind, (rng: Rng) => Layout> = { cottage, backroom, weaver, smith, looted, store, stalls, haybarn };
/** Who the dead were, by the place. */
const DEAD: Record<string, string> = { farm: 'farmer', field: 'farmer' };

/** A cottage or barn on a job: same seed, same room. */
export function runInterior(job: Job, roomIndex: number, blockIndex: number, door: string): RoomPlan {
  const seed = houseSeed(job, roomIndex, blockIndex), home = house(seed, door), rng = new Rng(seed);
  const ruin = job.place.ruin, barn = door === 'barn';
  let l = LAYOUTS[home.kind](rng);
  if (rng.next() < 0.5) l = mirror(l);
  const { w, h } = l, props = [...l.props], foes: Foe[] = [], npcs: Npc[] = [], sleepers: P[] = [];
  const open = (q: P) => isFree(l, q.x, q.y, 0.35, 0.1);
  // Someone caged, tucked away: always on a rescue, sometimes otherwise.
  if (job.objective === 'rescue' || rng.next() < (barn ? 0.4 : 0.3)) props.push({ kind: 'cage', ...l.hide });
  // Who's in. A looted house often has its dead still in it, and goblins at them.
  const roll = rng.next(), body = home.kind === 'looted' ? rng.next() < 0.7 : rng.next() < 0.2;
  if (body) npcs.push({ ...l.body, name: '', talk: 'dead', look: DEAD[job.place.kind] ?? 'villager', pose: 'corpse' });
  if (body && roll < 0.75) {
    const k = 1 + rng.int(2);
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2 + rng.range(-0.4, 0.4);
      foes.push({ kind: 'scrapper', x: l.body.x + Math.cos(a) * 0.9, y: l.body.y + Math.sin(a) * 0.55, feeding: true });
    }
  } else if (roll < 0.22) {
    // Nobody home.
  } else if (roll < 0.5) {
    for (const s of rng.shuffle(l.sleep.filter(open)).slice(0, 1 + rng.int(2))) foes.push({ kind: 'scrapper', ...s, feeding: true }), sleepers.push(s);
  } else {
    const n = Math.min(4, 1 + rng.int(2) + (ruin >= 2 ? 1 : 0) + (barn ? 1 : 0));
    for (const s of rng.shuffle(l.stand.filter(open)).slice(0, n)) foes.push({ kind: 'scrapper', ...s });
  }
  if (barn && ruin >= 2 && rng.next() < 0.2) foes.push({ kind: 'butcher', x: w / 2, y: 3 });
  // The light: the hearth's fire, moonlight through the roof, the goblins' fire, a lantern in the barn.
  const torches = home.lit && l.hearth ? [{ x: l.hearth.x + l.hearth.w / 2, y: l.hearth.y + l.hearth.h - 0.35 }] : [];
  if (l.hearth && home.lit) l.hearth.look = 2;
  const rounds = [...l.rounds], awake = foes.some((f) => !f.feeding);
  if (l.lamp && rng.next() < 0.6) rounds.push({ ...l.lamp, r: 0.2, kind: 'post' });
  const fire = !torches.length && awake && rng.next() < 0.6 ? l.stand.find((s) => open(s) && !foes.some((f) => Math.hypot(f.x - s.x, f.y - s.y) < 1.2)) : undefined;
  const theme: Theme = {
    floor: l.floor, back: 'plaster', moon: home.broken ? 0.32 : 0,
    ambient: torches.length ? [0.19, 0.16, 0.17] : [0.15, 0.15, 0.2],
  };
  const map: GameMap = {
    name: l.name, w, h, wallFace: 3, rounds, blocks: l.blocks, braziers: fire ? [{ ...fire, r: 0.35 }] : [], torches,
    hero: { x: w / 2, y: h - 1.3 }, exit: { x: w / 2 - 1, y: h - 0.7, w: 2, h: 0.7 }, theme,
    npcs: npcs.length ? npcs : undefined, sleepers: sleepers.length ? sleepers : undefined,
  };
  return { map, foes, props, chests: [] };
}
