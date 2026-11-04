/**
 * The room vocabulary for layout 3 (docs/terrain-nodes.md slices 2 to 4), beside shared/nodes.ts:
 * the countries a job crosses and the transitions that join them, the rooms that mix two of them, the
 * dead ends a side way leads to, and which ports each kind of room can take. The big map reuses these.
 *
 * Countries join only where the valley does: the village gives onto its fields; the fields onto the
 * wood (its edge, or a coppice), the fen (a causeway, or a ford spreading into it), the ore road and
 * Wickhold's outfall; the wood onto the fen through the carr; the rock outside onto the mine by its head.
 */
import type { Theme, SoilMat } from './arena.js';
import type { PlaceKind } from './jobs.js';
import type { ApproachNode, Skin } from './nodes.js';
import { OPP, type Side } from './ports.js';

export type Country = 'village' | 'fields' | 'wood' | 'fen' | 'rock' | 'under';
export const SKIN_OF: Record<Country, Skin> = { village: 'fields', fields: 'fields', wood: 'wood', fen: 'fen', rock: 'rock', under: 'under' };

export type Transition = 'woodedge' | 'coppice' | 'causeway' | 'fenford' | 'carredge' | 'villageend' | 'oreroad' | 'minehead' | 'outfall';
export type Mixed = 'burntfarm' | 'chapelfields' | 'campvillage' | 'hamletmine';
export type DeadEnd = 'glade' | 'pens' | 'orechamber' | 'cave';
export type RouteNode = ApproachNode | Transition | Mixed;

export const LAYOUTS3: Record<Transition | Mixed | DeadEnd, string[]> = {
  woodedge: ['stile', 'ride', 'slope'], coppice: ['rows', 'ride'], causeway: ['straight', 'dogleg', 'broken'], fenford: ['spread', 'islands'],
  carredge: ['willows', 'pools'], villageend: ['row', 'green'], oreroad: ['spoil', 'cutting'], minehead: ['left', 'right'], outfall: ['grate', 'broken'],
  burntfarm: ['steading', 'byre'], chapelfields: ['nave', 'yard'], campvillage: ['street', 'square'], hamletmine: ['shelf', 'row'],
  glade: ['spring', 'ring'], pens: ['fold', 'cages'], orechamber: ['pillars', 'heaps'], cave: ['pool', 'winding'],
};

/** The transitions between two countries (either way, but for the ones that only go in: the adit, the outfall). */
export const JOINS: { a: Country; b: Country; nodes: (Transition | Mixed)[]; oneWay?: boolean }[] = [
  { a: 'village', b: 'fields', nodes: ['villageend'] },
  { a: 'fields', b: 'wood', nodes: ['woodedge', 'coppice'] },
  { a: 'fields', b: 'fen', nodes: ['causeway', 'fenford'] },
  { a: 'wood', b: 'fen', nodes: ['carredge'] },
  { a: 'fields', b: 'rock', nodes: ['oreroad'] },
  { a: 'rock', b: 'under', nodes: ['minehead', 'hamletmine'], oneWay: true },
  { a: 'fields', b: 'under', nodes: ['outfall'], oneWay: true },
];
export const joinOf = (a: Country, b: Country) => JOINS.find((j) => (j.a === a && j.b === b) || (!j.oneWay && j.a === b && j.b === a));

/** The rooms of each country (mixed ones included). */
export const POOL3: Record<Country, RouteNode[]> = {
  village: ['lane', 'yard', 'crossroads', 'track', 'campvillage', 'clearing', 'burntfarm'],
  fields: ['track', 'crossroads', 'clearing', 'ford', 'strips', 'yard', 'chapelfields', 'burntfarm'],
  wood: ['track', 'crossroads', 'clearing', 'woodpath', 'ford', 'burntfarm'],
  fen: ['track', 'crossroads', 'clearing', 'ford', 'lane'],
  rock: ['track', 'crossroads', 'clearing', 'ford'],
  under: ['track', 'crossroads', 'clearing'],
};

/**
 * Which ports a room takes: `any` (in by any side, out by any other but the bottom), `straight`
 * (across: bottom to top or side to side), `north` (built up: bottom to top only), `outnorth` (in by
 * any, out at the top: the adit and the culvert are in the back wall).
 */
export type PortRule = 'any' | 'straight' | 'north' | 'outnorth';
export const PORTS: Record<RouteNode, PortRule> = {
  track: 'any', crossroads: 'any', clearing: 'any', woodpath: 'any', ford: 'straight', strips: 'north', lane: 'north', yard: 'north',
  woodedge: 'any', coppice: 'any', causeway: 'straight', fenford: 'straight', carredge: 'any', villageend: 'north', oreroad: 'any', minehead: 'outnorth', outfall: 'outnorth',
  burntfarm: 'any', chapelfields: 'any', campvillage: 'north', hamletmine: 'outnorth',
};
/** Rooms that can be a fork (two ways on, on different sides). */
export const FORKS: RouteNode[] = ['track', 'crossroads', 'clearing', 'woodpath', 'woodedge', 'oreroad', 'burntfarm', 'chapelfields', 'carredge'];

export function portsOk(node: RouteNode, inSide: Side, outs: Side[]): boolean {
  const rule = PORTS[node];
  if (outs.some((o) => o === inSide || o === 'S') || new Set(outs).size !== outs.length) return false;
  if (rule === 'north') return inSide === 'S' && outs.every((o) => o === 'N');
  if (rule === 'outnorth') return outs.every((o) => o === 'N');
  if (rule === 'straight') return outs.length === 1 && outs[0] === OPP[inSide];
  return true;
}

/** Where a side way can lead, by the country it's in. */
export const SIDE_ROOMS: Record<Country, DeadEnd[]> = {
  village: ['pens', 'glade'], fields: ['glade', 'pens'], wood: ['glade'], fen: ['glade', 'pens'], rock: ['orechamber', 'pens'], under: ['cave', 'orechamber'],
};
/** What a side room holds beside its chest. */
export type Cache = 'captive' | 'nest' | 'oil' | 'shrine';
/** The name over a side way (ENTER THE GLADE). Placeholder words for the lore keeper and line editor. */
export const SIDE_WORD: Record<DeadEnd, string> = { glade: 'THE GLADE', pens: 'THE PENS', orechamber: 'THE OLD WORKINGS', cave: 'THE CAVE' };

/** A village's look (the fields' palettes do the rest of Barrowfields). */
export const VILLAGE_PALETTE: { floor: Theme['floor'][]; back: Theme['back'][]; soil: SoilMat[]; light: PlaceKind[] } = {
  floor: ['dirt', 'cobble', 'grass'], back: ['palisade', 'trees'], soil: ['earth', 'swept', 'straw'], light: ['village', 'farm'],
};
/** Layout 3's extra ground for a country (charcoal ash in the wood, spoil in the rock), for more ways to step from room to room. */
export const MORE_SOIL: Partial<Record<Country, SoilMat[]>> = { wood: ['ash'], rock: ['wet'], fen: ['grass'] };
/** How each country is lit (an approach room in it, when its palette doesn't say). */
export const COUNTRY_LIGHT: Record<Country, PlaceKind> = { village: 'village', fields: 'field', wood: 'forest', fen: 'marsh', rock: 'field', under: 'mine' };
