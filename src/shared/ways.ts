/**
 * The ways on at a layout-4 fork (Kyle, 2026-11-04: "choices between screens, more than just high
 * road, low road"). Each way out of a fork shows what you can tell from where you stand: a word over
 * the gap and a cue past it (smoke rising, crows wheeling, drums, water). Each leads into a different
 * room with its own scene, and each is a trade: risk against reward, a rescue against speed, loot
 * against noise. What it pays is added at the end of the job (shared/waypay.ts) and said in the recap.
 * Words in Kyle's style (prose-notes.md section 4): the word, a colon, what it means.
 */
import type { Country, RouteNode } from './nodeports.js';
import type { Piece } from './nodes.js';

export type WayKind = 'smoke' | 'cries' | 'crows' | 'drums' | 'quiet' | 'ford' | 'webs';

export interface Way {
  /** Over the gap. */
  word: string;
  /** The fork's goal line says each way's: what it is and what it pays. */
  tell: string;
  /** The room it leads into has this scene (shared/scenes4.ts). */
  piece: Piece;
  /** The kinds of room it can be (any, if none). */
  nodes?: RouteNode[];
  /** The countries it's found in. */
  countries: Country[];
  /** Goblins more (or fewer) in its room. */
  more: number;
  /** A share of the job's pay more (or less) for having come this way. */
  pay: number;
  /** A share of the job's pay more for each one brought out of its room alive. */
  perSaved?: number;
  /** Pieces of treasure more at the end. */
  treasure: number;
  /** A chest in its room, for certain. */
  chest?: boolean;
}

const ALL: Country[] = ['village', 'fields', 'wood', 'fen', 'rock', 'under'];
const OPEN: Country[] = ['village', 'fields', 'wood', 'fen', 'rock'];

export const WAYS: Record<WayKind, Way> = {
  smoke: { word: 'SMOKE', tell: 'SMOKE: a house catching, someone caged inside. +15% pay for each one saved', piece: 'burning', countries: ['village', 'fields', 'wood', 'fen'], more: 0, pay: 0, perSaved: 0.15, treasure: 0 },
  cries: { word: 'CRIES', tell: 'CRIES: captives being led off. Kill both guards before they reach the way on. +15% pay for each one saved', piece: 'prisoners', countries: ALL, more: -1, pay: 0, perSaved: 0.15, treasure: 0 },
  crows: { word: 'CROWS', tell: 'CROWS: the dead, picked over. A chest and 1 more treasure', piece: 'column', countries: OPEN, more: 0, pay: 0, treasure: 1, chest: true },
  drums: { word: 'DRUMS', tell: 'DRUMS: a war band. More goblins, a chest, +25% pay and 1 more treasure', piece: 'drums', countries: ALL, more: 3, pay: 0.25, treasure: 1, chest: true },
  quiet: { word: 'QUIET', tell: 'QUIET: fewer goblins, 20% less pay', piece: 'asleep', countries: ALL, more: -3, pay: -0.2, treasure: 0 },
  ford: { word: 'WATER', tell: 'WATER: wade across, archers on the far side. +15% pay', piece: 'wading', nodes: ['ford', 'fenford', 'flooded'], countries: ['fields', 'wood', 'fen', 'rock', 'under'], more: -1, pay: 0.15, treasure: 0 },
  webs: { word: 'WEBS', tell: 'WEBS: spider nests. A chest and 1 more treasure', piece: 'webs', countries: ['wood', 'fen', 'under'], more: -2, pay: 0, treasure: 1, chest: true },
};
export const WAY_KINDS = Object.keys(WAYS) as WayKind[];

/** The fork's goal line (sim/goal.ts): pick one, and what each of its ways is. */
export const pickWay = (ways: WayKind[]) => ['Pick a way, together', ...ways.map((w) => WAYS[w].tell)].join('. ');

/** Said while someone is still in a burning house (layout 4's burning scene): how to get them out. */
export const HELD_HINT = "Someone's inside the burning house. Stand still at its door to pull them out";
