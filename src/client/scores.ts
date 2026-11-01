/**
 * What plays where: three pieces for each kind of place, written as a mode, a chord progression and
 * the parts (bass, held chords, a picked pattern, a tune, a drum). music.ts plays them live, a bar at
 * a time, with a little chance in the tune so they never loop exactly.
 */
import type { InstrumentId } from './instruments';

export type Area = 'town' | 'inside' | 'church' | 'yard' | 'village' | 'farm' | 'field' | 'forest' | 'mine' | 'boss';

export interface Score {
  name: string;
  bpm: number;
  /** The tonic (MIDI note) and the mode's steps. */
  root: number;
  mode: number[];
  /** Chords by scale degree (0 = the tonic), a bar each. */
  prog: number[];
  beats: 3 | 4;
  bass?: InstrumentId;
  /** Chords held under everything. */
  hold?: InstrumentId;
  /** A picked pattern: chord tone per eighth (0, 1, 2; 3 = the octave), -1 a rest. */
  pick?: InstrumentId;
  pattern?: number[];
  /** The tune, and how busy it is (0..1). */
  tune?: InstrumentId;
  busy?: number;
  /** Per eighth: 0 nothing, 1 the rim, 2 the skin. */
  drums?: number[];
  /** How much reverb: a hall, a field, a cave. */
  wet: number;
  seed: number;
}

const DORIAN = [0, 2, 3, 5, 7, 9, 10], AEOLIAN = [0, 2, 3, 5, 7, 8, 10], PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const MIXO = [0, 2, 4, 5, 7, 9, 10], IONIAN = [0, 2, 4, 5, 7, 9, 11], HARMONIC = [0, 2, 3, 5, 7, 8, 11];
const UP = [0, 1, 2, 3, 2, 1, 2, 1], ROLL = [0, 2, 1, 2, 3, 2, 1, 2], SPARSE = [0, -1, 2, -1, 1, -1, -1, -1], WALTZ = [0, 1, 2, 1, 2, 1];

export const SCORES: Record<Area, Score[]> = {
  town: [
    { name: 'Lantern Square', bpm: 84, root: 50, mode: DORIAN, prog: [0, 3, 6, 4], beats: 4, bass: 'drone', hold: 'pad', pick: 'lute', pattern: UP, tune: 'flute', busy: 0.55, wet: 0.3, seed: 11 },
    { name: 'Market Morning', bpm: 96, root: 55, mode: MIXO, prog: [0, 6, 3, 0], beats: 4, bass: 'drone', pick: 'lute', pattern: ROLL, tune: 'flute', busy: 0.6, drums: [2, 0, 1, 0, 2, 1, 1, 0], wet: 0.25, seed: 23 },
    { name: 'Wickhold by Night', bpm: 66, root: 45, mode: AEOLIAN, prog: [0, 5, 2, 6], beats: 3, bass: 'drone', hold: 'pad', pick: 'harp', pattern: WALTZ, tune: 'flute', busy: 0.35, wet: 0.4, seed: 37 },
  ],
  inside: [
    { name: 'By the Hearth', bpm: 72, root: 53, mode: IONIAN, prog: [0, 5, 3, 4], beats: 3, pick: 'harp', pattern: WALTZ, tune: 'flute', busy: 0.4, wet: 0.15, seed: 41 },
    { name: 'Warm Bread', bpm: 80, root: 50, mode: MIXO, prog: [0, 3, 6, 0], beats: 4, bass: 'drone', pick: 'lute', pattern: UP, busy: 0, wet: 0.12, seed: 53 },
    { name: 'Low Candles', bpm: 60, root: 52, mode: AEOLIAN, prog: [0, 3, 5, 4], beats: 3, pick: 'harp', pattern: [0, -1, 1, -1, 2, -1], tune: 'lute', busy: 0.3, wet: 0.18, seed: 67 },
  ],
  church: [
    { name: 'The Last Lantern', bpm: 52, root: 50, mode: AEOLIAN, prog: [0, 5, 3, 4], beats: 4, bass: 'organ', hold: 'organ', tune: 'bell', busy: 0.25, wet: 0.6, seed: 71 },
    { name: 'Vigil', bpm: 48, root: 48, mode: DORIAN, prog: [0, 6, 3, 0], beats: 4, hold: 'organ', tune: 'bell', busy: 0.2, wet: 0.65, seed: 83 },
    { name: 'Coal and Candle', bpm: 56, root: 53, mode: IONIAN, prog: [0, 3, 5, 4], beats: 3, bass: 'organ', hold: 'organ', pick: 'harp', pattern: [0, -1, -1, 2, -1, -1], wet: 0.6, seed: 97 },
  ],
  yard: [
    { name: 'Drill', bpm: 104, root: 50, mode: DORIAN, prog: [0, 6, 0, 3], beats: 4, bass: 'drone', pick: 'lute', pattern: ROLL, drums: [2, 1, 1, 0, 2, 1, 1, 1], wet: 0.2, seed: 101 },
    { name: "The Squire's Lesson", bpm: 92, root: 55, mode: MIXO, prog: [0, 3, 0, 6], beats: 4, bass: 'drone', pick: 'lute', pattern: UP, tune: 'flute', busy: 0.4, drums: [2, 0, 1, 0, 2, 0, 1, 1], wet: 0.2, seed: 113 },
    { name: 'Sand and Straw', bpm: 98, root: 52, mode: AEOLIAN, prog: [0, 6, 5, 6], beats: 4, bass: 'drone', pick: 'lute', pattern: SPARSE, drums: [2, 1, 0, 1, 2, 1, 0, 1], wet: 0.22, seed: 127 },
  ],
  village: [
    { name: 'Empty Doorways', bpm: 70, root: 45, mode: AEOLIAN, prog: [0, 5, 6, 4], beats: 4, bass: 'drone', hold: 'pad', pick: 'harp', pattern: SPARSE, tune: 'flute', busy: 0.3, wet: 0.4, seed: 131 },
    { name: 'Barrowby Ash', bpm: 64, root: 48, mode: HARMONIC, prog: [0, 3, 4, 0], beats: 3, bass: 'drone', hold: 'pad', pick: 'lute', pattern: WALTZ, wet: 0.38, seed: 149 },
    { name: 'Smoke over the Thatch', bpm: 76, root: 52, mode: DORIAN, prog: [0, 3, 0, 6], beats: 4, bass: 'drone', pick: 'lute', pattern: UP, tune: 'flute', busy: 0.35, wet: 0.35, seed: 157 },
  ],
  farm: [
    { name: 'Fallow', bpm: 78, root: 55, mode: DORIAN, prog: [0, 3, 6, 0], beats: 4, bass: 'drone', pick: 'lute', pattern: ROLL, tune: 'flute', busy: 0.4, wet: 0.35, seed: 163 },
    { name: 'The Barn Door', bpm: 72, root: 50, mode: AEOLIAN, prog: [0, 6, 5, 4], beats: 3, bass: 'drone', hold: 'pad', pick: 'harp', pattern: WALTZ, wet: 0.35, seed: 173 },
    { name: 'Scarecrow', bpm: 86, root: 57, mode: MIXO, prog: [0, 6, 0, 4], beats: 4, bass: 'drone', pick: 'lute', pattern: SPARSE, tune: 'flute', busy: 0.5, wet: 0.3, seed: 181 },
  ],
  field: [
    { name: 'Wheat Wind', bpm: 60, root: 52, mode: DORIAN, prog: [0, 0, 3, 6], beats: 4, bass: 'drone', hold: 'pad', tune: 'flute', busy: 0.35, wet: 0.5, seed: 191 },
    { name: 'Open Sky', bpm: 66, root: 50, mode: MIXO, prog: [0, 6, 3, 0], beats: 4, bass: 'drone', pick: 'harp', pattern: SPARSE, tune: 'flute', busy: 0.3, wet: 0.5, seed: 199 },
    { name: 'Crows', bpm: 58, root: 47, mode: PHRYGIAN, prog: [0, 1, 0, 6], beats: 4, bass: 'drone', hold: 'pad', tune: 'bell', busy: 0.2, wet: 0.55, seed: 211 },
  ],
  forest: [
    { name: "Hangman's Wood", bpm: 58, root: 52, mode: PHRYGIAN, prog: [0, 1, 6, 0], beats: 4, bass: 'drone', hold: 'pad', tune: 'flute', busy: 0.25, wet: 0.5, seed: 223 },
    { name: 'Charcoal Hollow', bpm: 62, root: 45, mode: AEOLIAN, prog: [0, 5, 3, 4], beats: 3, bass: 'drone', pick: 'harp', pattern: [0, -1, 2, -1, -1, 1], tune: 'bell', busy: 0.2, wet: 0.5, seed: 227 },
    { name: 'Under the Pines', bpm: 54, root: 50, mode: DORIAN, prog: [0, 6, 0, 3], beats: 4, bass: 'drone', hold: 'pad', tune: 'flute', busy: 0.3, wet: 0.55, seed: 229 },
  ],
  mine: [
    { name: 'Copperdeep', bpm: 50, root: 36, mode: PHRYGIAN, prog: [0, 1, 0, 6], beats: 4, bass: 'drone', hold: 'pad', tune: 'bell', busy: 0.18, wet: 0.7, seed: 233 },
    { name: 'Pit Props', bpm: 56, root: 40, mode: HARMONIC, prog: [0, 0, 5, 4], beats: 4, bass: 'drone', tune: 'bell', busy: 0.22, drums: [2, 0, 0, 0, 0, 0, 0, 0], wet: 0.7, seed: 239 },
    { name: 'The Long Dark', bpm: 46, root: 38, mode: AEOLIAN, prog: [0, 5, 1, 0], beats: 4, bass: 'drone', hold: 'pad', tune: 'bell', busy: 0.15, wet: 0.75, seed: 241 },
  ],
  boss: [
    { name: 'The Butcher Comes', bpm: 112, root: 38, mode: HARMONIC, prog: [0, 0, 5, 4], beats: 4, bass: 'horn', hold: 'pad', pick: 'lute', pattern: [0, 0, 1, 0, 0, 0, 2, 1], drums: [2, 1, 2, 1, 2, 1, 2, 2], wet: 0.3, seed: 251 },
    { name: 'Chains', bpm: 104, root: 40, mode: PHRYGIAN, prog: [0, 1, 0, 6], beats: 4, bass: 'horn', pick: 'lute', pattern: [0, -1, 0, 1, 0, -1, 2, 1], tune: 'horn', busy: 0.3, drums: [2, 0, 2, 1, 2, 0, 2, 1], wet: 0.3, seed: 257 },
    { name: 'No Mercy at the Bell', bpm: 120, root: 43, mode: HARMONIC, prog: [0, 5, 6, 4], beats: 4, bass: 'horn', hold: 'pad', pick: 'lute', pattern: ROLL, drums: [2, 1, 1, 2, 2, 1, 1, 1], wet: 0.28, seed: 263 },
  ],
};
