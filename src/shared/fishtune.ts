/**
 * Fishing at the millpond (docs/plans/town-activities.md, Kyle 2026-11-05: "just for fun, no pay"): the
 * fish in it and every number the rules use (shared/fishing.ts). Weights are in ounces; a pound is 16.
 */

export type FishId = 'roach' | 'rudd' | 'perch' | 'bream' | 'tench' | 'eel' | 'carp' | 'pike';

/**
 * One kind of fish. `min`, `max`: its weight (oz); `deep`: where it bites, 0 by the bank to 1 far out;
 * `often`: how common it is; `pull`: how hard it pulls when it runs (0 to 1); `fight`: how much of the
 * time it spends running.
 */
export interface Species { id: FishId; name: string; min: number; max: number; deep: number; often: number; pull: number; fight: number }

export const SPECIES: readonly Species[] = [
  { id: 'roach', name: 'ROACH', min: 2, max: 28, deep: 0.1, often: 5, pull: 0.15, fight: 0.3 },
  { id: 'rudd', name: 'RUDD', min: 2, max: 36, deep: 0.25, often: 4, pull: 0.2, fight: 0.3 },
  { id: 'perch', name: 'PERCH', min: 3, max: 56, deep: 0.35, often: 4, pull: 0.3, fight: 0.4 },
  { id: 'eel', name: 'EEL', min: 8, max: 112, deep: 0.45, often: 2, pull: 0.55, fight: 0.6 },
  { id: 'tench', name: 'TENCH', min: 16, max: 144, deep: 0.55, often: 2.5, pull: 0.5, fight: 0.5 },
  { id: 'bream', name: 'BREAM', min: 16, max: 176, deep: 0.65, often: 3, pull: 0.35, fight: 0.35 },
  { id: 'carp', name: 'CARP', min: 40, max: 448, deep: 0.85, often: 1.4, pull: 0.7, fight: 0.55 },
  { id: 'pike', name: 'PIKE', min: 64, max: 560, deep: 0.95, often: 0.8, pull: 0.85, fight: 0.6 },
];
export const speciesOf = (id: FishId): Species => SPECIES.find((s) => s.id === id) ?? SPECIES[0];

/**
 * The rules' numbers (seconds, metres, tension from 0 slack to 1 snapped).
 * - `swing`: the cast meter goes empty to full and back in this long, while the button is held.
 * - `fly`: the float in the air. `wait`: before the bite, plus `waitFar` for a full-length cast.
 * - `nibbles`: up to this many twitches before the bite, each `nibble` long (tap on one: too soon).
 * - `window`: the float under, to strike. `dist`: the fish this far out at a short cast, `distFar` more at a long one.
 * - `reel`: metres a second reeling while it rests; `reelRun`: the share of that while it runs.
 * - `rate`: how fast tension moves to where it's going; `hold`/`slack`: where it goes reeling or not;
 *   `run`: added while it runs (times its pull); `snap`: the line goes; `loose`: below this, slack;
 *   `throw`: slack this long and it throws the hook; `take`: metres a second it takes while you let it run.
 * - `rest`, `runFor`: how long between runs and how long a run lasts; `tell`: the warning before a run.
 */
export const FISH = {
  swing: 1.4, fly: 0.6, wait: [2.5, 7] as const, waitFar: 4, nibbles: 3, nibble: 0.35, window: 1.0,
  dist: 4, distFar: 14, reel: 2.2, reelRun: 0.3,
  rate: 1.1, hold: 0.5, slack: 0.08, run: 0.65, snap: 1, loose: 0.2, throw: 2.2, take: 1.2,
  rest: [1.2, 3] as const, runFor: [0.6, 1.6] as const, tell: 0.45,
} as const;

/** A weight in ounces as it's said: "11 oz", "3 lb", "2 lb 5 oz". */
export function weighs(oz: number): string {
  const lb = Math.floor(oz / 16), o = Math.round(oz % 16);
  return lb ? (o ? `${lb} lb ${o} oz` : `${lb} lb`) : `${o} oz`;
}
