/**
 * Inside a cottage or barn on a job. The house's seed picks its layout (shared/houses.ts says which
 * sort it is, whether it's one of the big ones, and what's become of it), lights it (the hearth lit or
 * cold, moonlight through a stove-in roof, the goblins' own fire, a lantern in a barn, or the house
 * itself burning), says who's in (nobody, a goblin or two asleep, some at a body, a band of them, rarely
 * a butcher in a barn, now and then someone caged) and lays out what the goblins did (shared/grim.ts).
 */
import type { GameMap, Mark, Npc, Theme } from './arena.js';
import { backroom, cottage, looted, smith, store, weaver } from './layouts.js';
import { stalls, haybarn } from './barns.js';
import { longhouse, manor, tithebarn } from './halls.js';
import { planBlaze } from './blaze.js';
import { dress } from './grim.js';
import { big, bigKind, fate, grimness, house, houseSeed, type HouseKind } from './houses.js';
import { freeSpot, isFree, mirror, type Layout, type P } from './housekit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { Foe, RoomPlan } from './terrain.js';

const LAYOUTS: Record<HouseKind, (rng: Rng) => Layout> = { cottage, backroom, weaver, smith, looted, store, stalls, haybarn, longhouse, manor, tithebarn };
/** Who the dead were, by the place. */
const DEAD: Record<string, string> = { farm: 'farmer', field: 'farmer' };

/** A cottage or barn on a job: same seed, same room. */
export function runInterior(job: Job, roomIndex: number, blockIndex: number, door: string): RoomPlan {
  const seed = houseSeed(job, roomIndex, blockIndex), home = house(seed, door), rng = new Rng(seed);
  const ruin = job.place.ruin, barn = door === 'barn', end = fate(job, roomIndex, seed), g = grimness(job, roomIndex);
  let l = LAYOUTS[big(job, roomIndex, seed) ? bigKind(seed, door) : home.kind](rng);
  if (rng.next() < 0.5) l = mirror(l);
  const { w, h } = l, props = [...l.props], foes: Foe[] = [], npcs: Npc[] = [], sleepers: P[] = [], marks: Mark[] = [];
  const open = (q: P) => isFree(l, q.x, q.y, 0.35, 0.1), fire = end === 'burning';
  // Half fallen in: heaps of what came down, the sky through the roof.
  if (end === 'wrecked') for (let i = 0; i < 2; i++) {
    const s = freeSpot(l, rng, 1, 1, h - 3);
    if (s) l.blocks.push({ kind: 'rubble', x: s.x - 0.9, y: s.y - 0.5, w: 1.8, h: 1 }), marks.push({ kind: 'debris', x: s.x - 1.6, y: s.y + 0.4, w: 3.2, h: 1.4 });
  }
  // Someone caged, tucked away: always on a rescue, sometimes otherwise.
  const cage = job.objective === 'rescue' || rng.next() < (barn ? 0.4 : 0.3) ? l.hide : undefined;
  if (cage) props.push({ kind: 'cage', ...cage });
  // Who's in (nobody, in a house on fire). A looted house often has its dead still in it, and goblins at them.
  const roll = fire ? 0.3 : rng.next(), body = !fire && (home.kind === 'looted' ? rng.next() < 0.7 : rng.next() < 0.2 + g * 0.05);
  if (body) npcs.push({ ...l.body, name: '', talk: 'dead', look: DEAD[job.place.kind] ?? 'villager', pose: 'corpse' });
  if (body && roll < 0.75) {
    const k = 1 + rng.int(2);
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2 + rng.range(-0.4, 0.4);
      foes.push({ kind: 'scrapper', x: l.body.x + Math.cos(a) * 0.9, y: l.body.y + Math.sin(a) * 0.55, feeding: true });
    }
  } else if (roll < 0.22 || fire) {
    // Nobody home.
  } else if (roll < 0.5) {
    for (const s of rng.shuffle(l.sleep.filter(open)).slice(0, 1 + rng.int(2))) foes.push({ kind: 'scrapper', ...s, feeding: true }), sleepers.push(s);
  } else {
    const n = Math.min(l.w > 15 ? 5 : 4, 1 + rng.int(2) + (ruin >= 2 ? 1 : 0) + (barn ? 1 : 0) + (l.w > 15 ? 1 : 0));
    for (const s of rng.shuffle(l.stand.filter(open)).slice(0, n)) foes.push({ kind: 'scrapper', ...s });
  }
  if (barn && !fire && ruin >= 2 && rng.next() < 0.2) foes.push({ kind: 'butcher', x: w / 2, y: 3 });
  // The light: the hearth's fire, moonlight through the roof, the goblins' fire, a lantern in the barn.
  const lit = home.lit && !fire && !!l.hearth, torches = lit ? [{ x: l.hearth!.x + l.hearth!.w / 2, y: l.hearth!.y + l.hearth!.h - 0.35 }] : [];
  if (lit) l.hearth!.look = 2;
  const rounds = [...l.rounds], awake = foes.some((f) => !f.feeding), dark = new Rng(seed * 31 + 7);
  if (l.lamp && !fire && rng.next() < 0.6) rounds.push({ ...l.lamp, r: 0.2, kind: 'post' });
  const cook = !lit && !fire && (awake ? rng.next() < 0.6 : dark.next() < 0.12 * g);
  const camp = cook ? l.stand.find((s) => open(s) && !foes.some((f) => Math.hypot(f.x - s.x, f.y - s.y) < 1.2)) : undefined;
  const grim = dress(l, dark, fire ? g * 0.5 : g, { body: body ? l.body : undefined, cage, fire: camp, light: camp ?? torches[0], barn });
  const theme: Theme = {
    floor: l.floor, back: 'plaster', moon: end === 'wrecked' ? 0.42 : home.broken ? 0.32 : 0,
    ambient: fire ? [0.24, 0.15, 0.12] : torches.length ? [0.19, 0.16, 0.17] : [0.15, 0.15, 0.2],
  };
  const map: GameMap = {
    name: l.name, w, h, wallFace: 3, rounds, blocks: l.blocks, braziers: camp ? [{ ...camp, r: 0.35, wild: true }] : [], torches,
    hero: { x: w / 2, y: h - 1.3 }, exit: { x: w / 2 - 1, y: h - 0.7, w: 2, h: 0.7 }, theme,
    npcs: npcs.length ? npcs : undefined, sleepers: sleepers.length ? sleepers : undefined,
    grim: grim.length ? grim : undefined, marks: marks.length ? marks : undefined,
    blaze: fire ? planBlaze({ ...l, props }, new Rng(seed * 19 + 5), cage) : undefined,
  };
  // Now and then a chest worth the trip in (on a stream of its own, so nothing else about the house moves).
  const cr = new Rng(seed * 43 + 19), want = big(job, roomIndex, seed) ? 0.4 : barn ? 0.15 : home.kind === 'looted' ? 0.06 : 0.2;
  const spot = !fire && cr.next() < want ? freeSpot({ ...l, props }, cr, 0.45, 1, h - 2.6) : null;
  return { map, foes, props, chests: spot ? [spot] : [] };
}
