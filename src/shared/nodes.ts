/**
 * The room vocabulary (docs/terrain-nodes.md, slice 1): the kinds of room a job's approach is made of,
 * each with its sub-layouts, the skins it comes in, the landmarks a room of it can show, and the
 * palettes it's painted in. A job's last room is its place's own (the heart, shared/sites.ts), which
 * alone carries the place's signature: Barrowby's well and shrine, Hangman's gallows, and so on.
 */
import type { RoundKind, SoilMat, Theme } from './arena.js';
import type { Place, PlaceKind } from './jobs.js';
import type { SiteKind } from './sites.js';

/** What an approach room is skinned as: the country you cross to get there. */
export type Skin = 'fields' | 'wood' | 'fen' | 'rock' | 'under';
export type ApproachNode = 'track' | 'crossroads' | 'lane' | 'clearing' | 'ford' | 'strips' | 'yard' | 'woodpath';
export type NodeId = SiteKind | ApproachNode;

export const LAYOUTS: Record<ApproachNode, string[]> = {
  track: ['bend', 'sbend', 'hedged'],
  crossroads: ['four', 'tee', 'offset'],
  lane: ['onesided', 'twosided', 'villageend'],
  clearing: ['round', 'long', 'stream'],
  ford: ['twofords', 'wide', 'broken'],
  strips: ['grain', 'stubble'],
  yard: ['steading', 'courtyard'],
  woodpath: ['winding', 'deadfall'],
};

/** Which approach rooms each skin has. */
export const POOL: Record<Skin, ApproachNode[]> = {
  fields: ['track', 'crossroads', 'lane', 'clearing', 'ford', 'strips', 'yard'],
  wood: ['track', 'crossroads', 'clearing', 'ford', 'woodpath'],
  fen: ['track', 'crossroads', 'clearing', 'ford', 'lane'],
  rock: ['track', 'crossroads', 'clearing', 'ford'],
  under: ['track', 'crossroads', 'clearing'],
};

/** The country round each place, by its region (and for a marsh in the woods, both). */
export function skinsFor(p: Place): Skin[] {
  if (p.region === 'Wickhold') return ['under'];
  if (p.region === 'Greyhollow') return p.kind === 'marsh' ? ['wood', 'fen'] : ['wood'];
  if (p.region === 'Fenmere') return ['fen', 'fields'];
  if (p.region === 'Copperdeep') return p.kind === 'mine' ? ['rock'] : ['rock', 'fields'];
  return ['fields'];
}

/** One landmark a room, seen from the way in. */
export type Landmark = Extract<RoundKind, 'well' | 'shrine' | 'cross' | 'scarecrow' | 'deadtree' | 'stone' | 'statue' | 'grate'>;
export const LANDMARKS: Record<Skin, Landmark[]> = {
  fields: ['well', 'shrine', 'cross', 'scarecrow', 'stone', 'deadtree'],
  wood: ['shrine', 'deadtree', 'stone', 'cross', 'statue'],
  fen: ['deadtree', 'stone', 'shrine', 'cross', 'well'],
  rock: ['stone', 'cross', 'shrine', 'deadtree', 'well'],
  under: ['grate', 'stone', 'shrine', 'statue'],
};
/** Every round thing that counts as a landmark (an approach room keeps only its own one). */
export const LANDMARK_KINDS: RoundKind[] = ['well', 'shrine', 'cross', 'scarecrow', 'deadtree', 'stone', 'statue', 'grate', 'fountain', 'clamp'];

/**
 * What only a place's heart may show. Named places by name; anywhere else by its sort. `bridge` is
 * Brokenbridge's broken bridge (its approach never has the ford with the broken bridge).
 */
const SIGNATURE: Record<string, string[]> = {
  Barrowby: ['well', 'shrine'], "Tollan's Farm": ['well'], 'Lowfurrow Fields': ['scarecrow'], 'Fennick Ford': ['fountain', 'cross'],
  'The Charcoal Camps': ['clamp'], "Hangman's Wood": ['gallows'], 'The Copperdeep Shafts': ['support'], 'The Sheepwash': [],
  Brokenbridge: ['bridge'], 'The Peat Cuts': ['peat'], 'Sallow Carr': ['deadtree'], Ketterby: ['statue'], 'Hesketh Hall': ['hall', 'fountain', 'statue'],
};
export const signatureOf = (p: Place): string[] => SIGNATURE[p.name] ?? [];

/** A room's look: its floor, back wall, main ground and the light it's lit as (docs: a palette step every room). */
export interface Palette { floor: Theme['floor']; back: Theme['back']; soil: SoilMat; light: PlaceKind }
export const PALETTES: Record<Skin, { floor: Theme['floor'][]; back: Theme['back'][]; soil: SoilMat[]; light: PlaceKind[] }> = {
  fields: { floor: ['grass', 'wheat', 'dirt'], back: ['trees', 'palisade'], soil: ['earth', 'straw', 'grass'], light: ['field', 'farm'] },
  wood: { floor: ['grass', 'mud', 'dirt'], back: ['trees'], soil: ['earth', 'mud', 'grass'], light: ['forest'] },
  fen: { floor: ['mud', 'grass'], back: ['trees'], soil: ['earth', 'wet', 'mud'], light: ['marsh', 'river'] },
  rock: { floor: ['dirt', 'rock'], back: ['rockface', 'trees'], soil: ['earth', 'mud', 'ash'], light: ['field', 'mine'] },
  under: { floor: ['rock', 'flagstone'], back: ['rockface', 'stone'], soil: ['wet', 'mud', 'earth'], light: ['mine'] },
};
/** A heart's own ground (for the palette step into it). */
export const HEART_SOIL: Partial<Record<SiteKind, SoilMat>> = { street: 'swept', manor: 'swept', camp: 'mud', peat: 'wet', carr: 'earth' };

/** How many sub-layouts a heart has: its landmarks stay put, the rest moves. */
export const HEART_VARIANTS = 3;

/**
 * A room's set piece (docs 4, slice 1b: the ones whose goblins' part already exists). `bridge` only
 * comes with the ford's broken bridge.
 */
export type Piece = 'fire' | 'dead' | 'feast' | 'asleep' | 'cart' | 'wreck' | 'column' | 'bridge';
export const PIECES: Piece[] = ['fire', 'dead', 'feast', 'asleep', 'cart', 'wreck', 'column'];
/** Which set pieces each skin can hold (no carts underground). */
export const PIECES_IN: Record<Skin, Piece[]> = {
  fields: PIECES, wood: PIECES, fen: PIECES, rock: PIECES, under: ['fire', 'dead', 'feast', 'asleep', 'column'],
};
