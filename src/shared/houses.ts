/**
 * The houses out on a job, each its own. One seed (the job's, the room's, and the house's place in
 * it) says what sort of house it is, how it looks from the street and whether its fire is lit, so the
 * cottage you walk up to is the one you walk into. Paint and layout only: nothing here is a rule.
 */
import type { Job } from './jobs.js';
import { Rng } from './rng.js';

export type HouseKind = 'cottage' | 'backroom' | 'weaver' | 'smith' | 'looted' | 'store' | 'stalls' | 'haybarn';

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
