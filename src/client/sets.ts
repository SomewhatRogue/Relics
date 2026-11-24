/**
 * Biome sets (docs/design/biome-sets.md; Kyle, 2026-11-24: "a big landmark and then mutations on that theme so you
 * know that you're in x or y biome"). A map's country (looks.ts) gives it a set: the wood's is the gallows, the
 * fen's the drowned chapel, the fields' the broken mill. A set is one landmark a map and echoes of it through the
 * rest. Slice 1 draws the wood's: one of the map's own oaks, the northmost in the middle of the map, stands as the
 * great hanging oak (its mutation from the map's name), and old ropes hang in some of the others. Drawing only: the
 * oak blocks as it did. The fen's and the fields' landmarks need ground of their own and come with slice 2.
 */
import type { GameMap, Round } from '../shared/arena';
import { countryOf } from './looks';
import type { Cut } from './three/propcards';
import { OAK_KINDS, greatOakCut, ropeCut, type OakKind } from './tilelandmarks';
import { hash } from './tiletrees';

export type SetId = 'gallows' | 'chapel' | 'mill';
export function setOf(m: GameMap): SetId | null {
  const c = countryOf(m);
  return c === 'wood' ? 'gallows' : c === 'fen' ? 'chapel' : c === 'fields' || c === 'crop' ? 'mill' : null;
}

const seedOf = (m: GameMap) => [...m.name].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 1000003, m.w * 7 + m.h);
export interface Landmark { round: Round; kind: OakKind; v: number }
const LAND = new WeakMap<GameMap, Landmark | null>();
const CUTS = new Map<string, Cut>();

/** The map's landmark: which of its rounds stands as it, and which mutation. Null where the set has none yet. */
export function landmarkOf(m: GameMap): Landmark | null {
  if (LAND.has(m)) return LAND.get(m)!;
  let out: Landmark | null = null;
  if (setOf(m) === 'gallows') {
    // (Northmost, so its crown rises over the back of the map and hides the least of the fight; in the middle
    // half across, clear of the hero's way in.)
    const oaks = m.rounds.filter((r) => r.kind === 'tree' && r.y > 3 && r.y < m.h * 0.5 && Math.hypot(r.x - m.hero.x, r.y - m.hero.y) > 6);
    const mid = oaks.filter((r) => r.x > m.w * 0.25 && r.x < m.w * 0.75);
    const round = (mid.length ? mid : oaks).sort((a, b) => a.y - b.y)[0];
    if (round) {
      // (A place's name says what hangs there, where it says anything; elsewhere the name's own roll.)
      const s = seedOf(m), named: OakKind | null = /HANG|GALLOW/.test(m.name) ? 'hanged' : /GIBBET|CAGE/.test(m.name) ? 'cage' : /CROW|ROOK|RAVEN/.test(m.name) ? 'ropes' : null;
      out = { round, kind: named ?? OAK_KINDS[s % OAK_KINDS.length], v: s % 4 };
    }
  }
  LAND.set(m, out);
  return out;
}

/** A landmark's picture (made once a mutation and variant; a browser's work, not the room's). */
export function landmarkCut(l: Landmark): Cut {
  const key = l.kind + l.v;
  let cut = CUTS.get(key);
  if (!cut) CUTS.set(key, (cut = greatOakCut(l.v, l.kind)));
  return cut;
}

const ROPES = new Map<number, Cut>();
/** The set's echoes on one of the map's rounds: cards to stand by it (tiles from it: dx across, dz toward the camera). */
export function echoesOf(m: GameMap, r: Round): { cut: Cut; dx: number; dz: number }[] {
  if (setOf(m) !== 'gallows' || r.kind !== 'tree' || landmarkOf(m)?.round === r) return [];
  const h = hash(Math.round(r.x * 16), Math.round(r.y * 16), 83);
  if (h > 0.3) return [];
  const v = Math.floor(h * 1000) % 15;
  let cut = ROPES.get(v);
  if (!cut) ROPES.set(v, (cut = ropeCut(v)));
  return [{ cut, dx: (v & 1 ? -1 : 1) * (0.5 + (v % 4) * 0.12), dz: 0.08 }];
}

// A test hook (scripts and screenshots find a map's landmark): window.__landmarkOf(map).
if (typeof window !== 'undefined') (window as unknown as { __landmarkOf: typeof landmarkOf }).__landmarkOf = landmarkOf;
