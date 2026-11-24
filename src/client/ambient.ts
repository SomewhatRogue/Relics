/**
 * The living world, L2 (docs/design/living-world.md): what moves in the air and what reacts to you, as one list of
 * small cosmetic figures a frame, drawn in both views as the town's animals are (cards in 2.5D: three/cards3d.ts;
 * sorted in by depth in the flat view: scene.ts). Paint only: driven by the clock and the map, seen the same by every
 * hero in a party, never blocking a step. Silent, and kept light (Kyle, 2026-11-22: "not too too busy"): at most
 * `CAP` a frame, the nearest to a hero first.
 * The town's (ambienttown.ts: moths round lit lamps, bats at dusk, the forge's sparks) and the wild's (ambientwild.ts:
 * leaves drifting under trees, small birds flushing from cover, crows lifting as you pass, drips in the mines) and,
 * after dark, fireflies and a fen's wisps where the pattern book put a place for them (ambientglow.ts). Each
 * kind is drawn the tile way (CLAUDE.md): a few shades, lit from the upper left, whole pixels.
 */
import type { GameMap } from '../shared/arena';
import type { Beast } from './townbeasts';
import { townAmbient } from './ambienttown';
import { wildAmbient } from './ambientwild';
import { glowAmbient } from './ambientglow';

export type At = { x: number; y: number };
/** At most this many a frame. */
export const CAP = 24;

export function ambientFigs(m: GameMap, now: number, heroes: At[]): Beast[] {
  const all = [...townAmbient(m, now, heroes), ...wildAmbient(m, now, heroes), ...glowAmbient(m, now, heroes)];
  if (all.length <= CAP || !heroes.length) return all.slice(0, CAP);
  const d = (b: Beast) => Math.min(...heroes.map((h) => Math.hypot(h.x - b.x, h.y - b.y)));
  return all.sort((a, b) => d(a) - d(b)).slice(0, CAP);
}
