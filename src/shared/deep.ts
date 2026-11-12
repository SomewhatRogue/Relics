/**
 * The Deep (docs/design/the-deep.md): an endless dungeon under Wickhold, in from the sewer grate. Each
 * floor is one room from the ordinary generator, a fresh map every time; at its end a checkpoint where
 * each hero leaves with what they found or goes deeper. It gets worse a block of five floors at a time
 * (shared/deepbands.ts): harder places, deeper rooms, named butchers to hunt, better loot, and past
 * fifteen it keeps rising.
 */
import { BOSSES, type Job, type Objective, type Place } from './jobs.js';
import { DOOR_NAMES, HAUL_NAME, LEECH_NAME, LISTEN_NAME } from './bosswords.js';
import { bandOf } from './deepbands.js';
import { layerOf } from './deeplayers.js';
import { Rng } from './rng.js';
import { rollTime } from './timeofday.js';

/** Under the town: the 'under' country, the drains' rooms (shared/countries.ts, nodes4.ts). */
export const DEEP_PLACE: Place = { name: 'The Deep', kind: 'mine', region: 'Wickhold', ruin: 2 };

/** A boss floor every `every`th floor, the bosses built taking `turn` about (docs/design/deep-bosses.md). */
export const DEEP_BOSS = { every: 5, turn: ['haulier', 'doorkeepers'] as const };

/** What a floor asks of you, turn about (a hunt's floor aside); a floor never repeats the last one's. */
const ASKS: Objective[] = ['larder', 'burn', 'rescue'];

/**
 * Floor `n` (from 1) of a run that set out with `seed`. Same seed and floor, same floor: the party's
 * screens build the same map. `title` is the floor's name on the HUD and the recap.
 */
export function deepFloor(n: number, seed: number, title: string): Job {
  const s = (seed * 7919 + n * 104729) >>> 0, b = bandOf(n), l = layerOf(n);
  // Where in the pit this floor is (shared/deeplayers.ts): its own country's look, a fresh one every five floors.
  const place: Place = { ...DEEP_PLACE, kind: l.kind, region: l.region, ruin: b.ruin };
  // Every fifth floor, a boss in its own arena (docs/design/deep-bosses.md), turn about on the run's seed.
  if (n % DEEP_BOSS.every === 0) {
    // (On a layer of old caves the boss is THE LISTENER, whatever the turn: docs/design/deep-layer-bosses.md.)
    // (On the fen layer it is THE LEECHMAN: floors 15, 35, 55 and so on.)
    const arena: 'haulier' | 'doorkeepers' | 'listener' | 'leechman' = l.id === 'rock' ? 'listener' : l.id === 'fen' ? 'leechman' : DEEP_BOSS.turn[(n / DEEP_BOSS.every + seed) % DEEP_BOSS.turn.length];
    return {
      id: `deep-${seed}-${n}`, place, objective: 'hunt', twist: 'none', time: rollTime(s, false), rooms: 1, size: 'short', layout: 4,
      reward: 0, seed: s, title, text: '', floor: n, boss: arena === 'leechman' ? LEECH_NAME : arena === 'listener' ? LISTEN_NAME : arena === 'haulier' ? HAUL_NAME : DOOR_NAMES.plate, arena, ...(b.deep ? { deep: true } : {}),
    };
  }
  // (Never the floor straight after a boss: one boss, then a breather. Kyle, 2026-11-11.)
  const hunt = !!b.hunt && n % b.hunt === 0 && (n - 1) % DEEP_BOSS.every !== 0;
  // (A hunt's floor among the others: the ones either side of it still never ask the same.)
  const objective: Objective = hunt ? 'hunt' : ASKS[(seed + n) % ASKS.length], boss = hunt ? new Rng(s).pick(BOSSES) : undefined;
  return {
    id: `deep-${seed}-${n}`, place, objective, twist: 'none', time: rollTime(s, false), rooms: 1, size: 'short', layout: 4,
    reward: 0, seed: s, title, text: '', floor: n, ...(b.deep ? { deep: true } : {}), ...(boss ? { boss } : {}),
  };
}

/** The seed a Deep floor's run set out with (from its id: `deep-<seed>-<floor>`). */
export const deepSeedOf = (j: Job): number => Number(j.id.split('-')[1]) || 0;

/** A Deep floor (not any other job). */
export const isDeep = (j: Job | undefined): boolean => !!j?.floor;
