/**
 * The houses out on a job, each its own. One seed (the job's, the room's, and the house's place in
 * it) says what sort of house it is, how it looks from the street and whether its fire is lit, so the
 * cottage you walk up to is the one you walk into. Paint and layout only: nothing here is a rule.
 */
import type { Block, Mark } from './arena.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';

export type HouseKind = 'cottage' | 'backroom' | 'weaver' | 'smith' | 'looted' | 'store' | 'stalls' | 'haybarn'
  // The big ones, on long and deep jobs.
  | 'longhouse' | 'manor' | 'tithebarn';
/** What's become of it: standing, half fallen in, fallen in across its door (no way in), or on fire. */
export type Fate = 'standing' | 'wrecked' | 'blocked' | 'burning';

export interface House {
  kind: HouseKind;
  /** A fire in the hearth: lit inside, smoke from the chimney and light in the windows outside. */
  lit: boolean;
  /** Outside: which roof colour, thatch or shingle, a lean-to on one side (-1 left, 1 right, 0 none), a roof stove in. */
  roof: number;
  thatch: boolean;
  leanTo: -1 | 0 | 1;
  broken: boolean;
}

/** The seed of the house at `blockIndex` in a run's room (the same one the inside has always used). */
export const houseSeed = (job: Job, roomIndex: number, blockIndex: number) => job.seed * 53 + roomIndex * 17 + blockIndex * 5 + 3;

/** How likely each sort of cottage and barn is. */
const COTTAGES: [HouseKind, number][] = [['cottage', 3], ['backroom', 3], ['weaver', 1.5], ['smith', 1.5], ['looted', 3], ['store', 2]];
const BARNS: [HouseKind, number][] = [['stalls', 1], ['haybarn', 1]];
/** How often each sort has its fire going (a store and a barn have no hearth). */
const LIT: Partial<Record<HouseKind, number>> = { cottage: 0.5, backroom: 0.5, weaver: 0.55, smith: 0.7, looted: 0.12 };

/** The house a seed makes, behind a cottage's door or a barn's. */
export function house(seed: number, door: string): House {
  const rng = new Rng(seed * 7 + 101), list = door === 'barn' ? BARNS : COTTAGES;
  let r = rng.next() * list.reduce((s, [, w]) => s + w, 0), kind = list[0][0];
  for (const [k, w] of list) if ((r -= w) < 0) {
    kind = k;
    break;
  }
  const lit = rng.next() < (LIT[kind] ?? 0), roof = rng.int(4), thatch = rng.next() < 0.5;
  const side = rng.next(), leanTo = kind === 'store' || side < 0.3 ? (rng.next() < 0.5 ? -1 : 1) : 0;
  const broken = rng.next() < (kind === 'looted' ? 0.65 : 0.08);
  return { kind, lit, roof, thatch, leanTo, broken };
}

/** How bad a job is, for what's left of its houses and what's in them: ruin, depth, length, how far in. */
export const grimness = (job: Job, roomIndex: number) => job.place.ruin + (job.deep ? 1 : 0) + (job.size === 'long' ? 0.5 : 0) + roomIndex * 0.25;

/** What's become of a house: more of them wrecked and burning the worse the place. */
export function fate(job: Job, roomIndex: number, seed: number): Fate {
  const r = new Rng(seed * 13 + 29).next(), g = Math.min(4, grimness(job, roomIndex)) / 4;
  const burn = 0.04 + g * 0.12, block = 0.03 + g * 0.1, wreck = 0.08 + g * 0.16;
  return r < burn ? 'burning' : r < burn + block ? 'blocked' : r < burn + block + wreck ? 'wrecked' : 'standing';
}

/** A big house: a longhouse, a manor or a tithe barn, on a long or deep job (now and then deep into a medium one). */
export function big(job: Job, roomIndex: number, seed: number): boolean {
  const chance = job.deep || job.size === 'long' ? 0.45 : job.rooms >= 3 && roomIndex >= 1 ? 0.12 : 0;
  return new Rng(seed * 11 + 47).next() < chance;
}

/** The big sort a house becomes, by its door. */
export const bigKind = (seed: number, door: string): HouseKind => (door === 'barn' ? 'tithebarn' : new Rng(seed * 5 + 9).next() < 0.5 ? 'longhouse' : 'manor');

/**
 * Tag a run room's houses: each its seed (`look`), its fate and whether it's big. A blocked house loses
 * its door (no way in, no prompt); a burning one smoulders (drawn on fire, never spreading). Returns the
 * rubble spilled in the street in front of the wrecked ones.
 */
export function settle(job: Job, roomIndex: number, blocks: Block[]): Mark[] {
  const spill: Mark[] = [];
  blocks.forEach((b, i) => {
    if (!b.door) return;
    const seed = (b.look = houseSeed(job, roomIndex, i)), end = fate(job, roomIndex, seed);
    Object.assign(b, { fate: end, big: big(job, roomIndex, seed) });
    if (end === 'burning') b.smoulder = true;
    if (end === 'blocked') delete b.door;
    if (end === 'wrecked' || end === 'blocked') spill.push({ kind: 'debris', x: b.x + (seed % 2 ? -0.6 : b.w - 1.6), y: b.y + b.h - 0.2, w: 2.2, h: 1.2 });
  });
  return spill;
}
