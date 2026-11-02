/**
 * The pieces for out in the world: the villages and farms sad after the burning, the fields and woods
 * quiet and dark (a low string drone and one lonely voice), the mines deep and cold.
 */
import { AEOLIAN, DORIAN, HARMONIC, MIXO, PHRYGIAN, type Score } from './score';

const WALTZ = [0, 1, 2, 1, 2, 1], UP = [0, 1, 2, 3, 2, 1, 2, 1], ROLL = [0, 2, 1, 2, 3, 2, 1, 2], SPARSE = [0, -1, 2, -1, 1, -1, -1, -1];

export const VILLAGE: Score[] = [
  { name: 'Empty Doorways', bpm: 66, beats: 4, root: 57, mode: AEOLIAN, prog: [0, 0, 5, 5, 3, 3, 4, 4], form: 'iAaBQ', level: 1.15, wet: 0.4, seed: 131,
    theme: '4:6 3:1 2:1 | 2:4 0:4 | 0:4 -1:2 0:2 | 2:8 | 3:4 5:2 3:2 | 2:6 r:2 | 1:4 2:2 1:2 | 1:8',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.4 }, { ins: 'oohs', role: 'chord', vel: 0.3 }, { ins: 'harp', role: 'arp', pattern: SPARSE, vel: 0.4, in: 'AaB' },
      { ins: 'strings', role: 'theme', vel: 0.6 }, { ins: 'flute', role: 'theme', oct: 12, vel: 0.5, in: 'a' }, { ins: 'flute', role: 'line', oct: 12, vel: 0.45, busy: 0.3 }] },
  { name: 'Barrowby Ash', bpm: 64, beats: 3, root: 60, mode: HARMONIC, prog: [0, 0, 3, 3, 4, 4, 0, 0], form: 'iAaBQ', level: 1.15, wet: 0.38, seed: 149,
    theme: '0:2 2:2 4:2 | 5:4 4:2 | 3:2 5:2 7:2 | 7:4 5:2 | 6:4 4:2 | 1:4 -1:2 | 2:2 1:2 0:2 | 0:6',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.4 }, { ins: 'strings', role: 'chord', vel: 0.3 }, { ins: 'harp', role: 'arp', pattern: WALTZ, vel: 0.38 },
      { ins: 'strings', role: 'theme', vel: 0.55 }, { ins: 'flute', role: 'theme', vel: 0.5, in: 'a' }, { ins: 'flute', role: 'line', vel: 0.45 }] },
  { name: 'Smoke over the Thatch', bpm: 76, beats: 4, root: 64, mode: DORIAN, prog: [0, 0, 3, 3, 0, 0, 6, 6], form: 'iAaBQ', level: 1.15, wet: 0.35, seed: 157,
    theme: '0:2 1:2 2:4 | 4:2 3:2 2:4 | 3:4 5:2 3:2 | 0:6 r:2 | 4:3 2:1 4:2 7:2 | 6:4 4:4 | 6:2 3:2 1:2 3:2 | 1:6 r:2',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.4 }, { ins: 'oohs', role: 'chord', vel: 0.3 }, { ins: 'harp', role: 'arp', pattern: UP, vel: 0.38, in: 'AaB' },
      { ins: 'flute', role: 'theme', vel: 0.55 }, { ins: 'strings', role: 'theme', vel: 0.5, in: 'a' }, { ins: 'harp', role: 'line', oct: 12, vel: 0.45 }] },
];

export const FARM: Score[] = [
  { name: 'Fallow', bpm: 72, beats: 4, root: 67, mode: DORIAN, prog: [0, 0, 6, 6, 3, 3, 0, 0], form: 'iAaBQ', wet: 0.35, seed: 163,
    theme: '4:4 2:2 0:2 | 1:4 2:4 | 5:2 6:2 3:4 | 1:8 | 3:2 4:2 5:2 7:2 | 5:6 r:2 | 4:2 2:2 1:2 2:2 | 0:8',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.4 }, { ins: 'strings', role: 'chord', vel: 0.28 }, { ins: 'harp', role: 'arp', pattern: ROLL, vel: 0.35, in: 'AaB' },
      { ins: 'flute', role: 'theme', vel: 0.55 }, { ins: 'strings', role: 'theme', oct: -12, vel: 0.55, in: 'a' }, { ins: 'flute', role: 'line', vel: 0.45 }] },
  { name: 'The Barn Door', bpm: 72, beats: 3, root: 62, mode: AEOLIAN, prog: [0, 0, 6, 6, 5, 5, 4, 4], form: 'iAaBQ', wet: 0.35, seed: 173,
    theme: '0:2 2:2 4:2 | 4:4 3:2 | 3:4 1:2 | -1:6 | 2:2 0:2 -2:2 | 0:6 | 1:2 2:2 4:2 | 1:6',
    parts: [{ ins: 'pizz', role: 'arp', oct: -12, pattern: [0, -1, -1, 2, -1, -1], vel: 0.5 }, { ins: 'harp', role: 'arp', pattern: WALTZ, vel: 0.38, in: 'AaB' },
      { ins: 'oohs', role: 'chord', vel: 0.3 }, { ins: 'strings', role: 'theme', vel: 0.55 }, { ins: 'flute', role: 'theme', vel: 0.5, in: 'a' },
      { ins: 'harp', role: 'line', oct: 12, vel: 0.45 }] },
  { name: 'Scarecrow', bpm: 84, beats: 4, root: 64, mode: PHRYGIAN, prog: [0, 0, 1, 1, 0, 0, 6, 6], form: 'iAaBQ', wet: 0.3, seed: 181,
    theme: '0:2 1:2 0:2 -1:2 | 0:6 r:2 | 1:2 3:2 5:2 3:2 | 1:6 r:2 | 4:2 3:2 2:2 1:2 | 0:4 2:4 | -1:2 1:2 3:2 1:2 | -1:6 r:2',
    parts: [{ ins: 'pizz', role: 'arp', oct: -12, pattern: [0, -1, 0, -1, 2, -1, 0, -1], vel: 0.5 }, { ins: 'strings', role: 'chord', vel: 0.25 },
      { ins: 'flute', role: 'theme', vel: 0.55 }, { ins: 'harp', role: 'theme', oct: 12, vel: 0.45, in: 'a' }, { ins: 'glock', role: 'bells', oct: 12, busy: 0.15 },
      { ins: 'flute', role: 'line', vel: 0.45 }] },
];

export const FIELD: Score[] = [
  { name: 'Wheat Wind', bpm: 60, beats: 4, root: 64, mode: DORIAN, prog: [0, 0, 0, 0, 3, 3, 6, 6], form: 'iAQaB', level: 1.3, wet: 0.5, seed: 191,
    theme: '4:6 2:2 | 0:8 | 2:2 4:2 7:4 | 6:6 r:2 | 5:4 3:4 | 2:2 3:6 | 3:4 1:4 | -1:8',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.45 }, { ins: 'oohs', role: 'chord', vel: 0.22, in: 'aBQ' }, { ins: 'flute', role: 'theme', vel: 0.5 },
      { ins: 'strings', role: 'theme', vel: 0.45, in: 'a' }, { ins: 'harp', role: 'arp', pattern: SPARSE, vel: 0.3, in: 'B' }, { ins: 'flute', role: 'line', vel: 0.42, busy: 0.25 }] },
  { name: 'Open Sky', bpm: 66, beats: 4, root: 62, mode: MIXO, prog: [0, 0, 6, 6, 3, 3, 0, 0], form: 'iAaBQ', level: 1.3, wet: 0.5, seed: 199,
    theme: '0:4 4:4 | 5:3 4:1 2:4 | 1:4 -1:4 | 3:2 1:2 -1:4 | 3:4 5:4 | 7:6 r:2 | 4:2 3:2 2:2 1:2 | 0:8',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.42 }, { ins: 'strings', role: 'chord', vel: 0.25 }, { ins: 'harp', role: 'arp', pattern: SPARSE, vel: 0.35, in: 'AaB' },
      { ins: 'horn', role: 'theme', oct: -12, vel: 0.5 }, { ins: 'flute', role: 'theme', vel: 0.5, in: 'a' }, { ins: 'flute', role: 'line', vel: 0.45, busy: 0.3 }] },
  { name: 'Crows', bpm: 56, beats: 4, root: 59, mode: PHRYGIAN, prog: [0, 0, 1, 1, 0, 0, 6, 6], form: 'iAaBQ', level: 1.3, wet: 0.55, seed: 211,
    theme: '0:4 1:4 | 0:8 | 1:4 3:2 5:2 | 3:6 r:2 | 2:2 1:2 0:4 | -1:4 0:4 | 1:4 -1:4 | -1:8',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.45 }, { ins: 'oohs', role: 'theme', vel: 0.55 }, { ins: 'strings', role: 'theme', vel: 0.45, in: 'a' },
      { ins: 'glock', role: 'bells', busy: 0.12 }, { ins: 'pizz', role: 'arp', oct: -12, pattern: SPARSE, vel: 0.35, in: 'B' }, { ins: 'oohs', role: 'chord', vel: 0.2, in: 'BQ' }] },
];

export const FOREST: Score[] = [
  { name: "Hangman's Wood", bpm: 54, beats: 4, root: 64, mode: PHRYGIAN, prog: [0, 0, 0, 0, 1, 1, 0, 0], form: 'iAQaB', level: 1.4, wet: 0.5, seed: 223,
    theme: 'r:4 4:4 | 3:2 2:2 1:4 | 0:6 r:2 | r:4 -1:2 0:2 | 1:6 3:2 | 2:4 1:4 | 0:8 | r:8',
    parts: [{ ins: 'strings', role: 'bass', oct: -12, vel: 0.4 }, { ins: 'oohs', role: 'chord', vel: 0.18, in: 'aQ' }, { ins: 'flute', role: 'theme', vel: 0.5 },
      { ins: 'oohs', role: 'theme', oct: -12, vel: 0.45, in: 'a' }, { ins: 'harp', role: 'arp', pattern: SPARSE, vel: 0.3, in: 'B' }, { ins: 'flute', role: 'line', vel: 0.4, busy: 0.2 }] },
  { name: 'Charcoal Hollow', bpm: 60, beats: 3, root: 57, mode: AEOLIAN, prog: [0, 0, 6, 6, 5, 5, 4, 4], form: 'iAaBQ', level: 1.4, wet: 0.5, seed: 227,
    theme: '0:4 2:2 | 4:6 | 3:2 1:2 -1:2 | 1:6 | 0:4 -2:2 | 2:6 | 1:2 0:2 -1:2 | -3:6',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.45 }, { ins: 'harp', role: 'arp', pattern: [0, -1, 2, -1, -1, 1], vel: 0.35, in: 'AaB' }, { ins: 'oohs', role: 'theme', vel: 0.55 },
      { ins: 'strings', role: 'theme', vel: 0.45, in: 'a' }, { ins: 'oohs', role: 'chord', vel: 0.2, in: 'Q' }, { ins: 'flute', role: 'line', oct: 12, vel: 0.4, busy: 0.25 }] },
  { name: 'Under the Pines', bpm: 52, beats: 4, root: 62, mode: DORIAN, prog: [0, 0, 3, 3, 0, 0, 6, 6], form: 'iAaBQ', level: 1.4, wet: 0.55, seed: 229,
    theme: '0:3 1:1 2:4 | 4:8 | 3:3 5:1 3:4 | 2:2 1:2 0:4 | 2:2 4:2 7:4 | 6:4 4:4 | 6:2 5:2 3:2 1:2 | 1:8',
    parts: [{ ins: 'strings', role: 'bass', oct: -12, vel: 0.5 }, { ins: 'strings', role: 'chord', vel: 0.2, in: 'aBQ' }, { ins: 'strings', role: 'theme', oct: -12, vel: 0.5 },
      { ins: 'flute', role: 'theme', vel: 0.5, in: 'a' }, { ins: 'flute', role: 'line', vel: 0.4, busy: 0.2 }] },
];

export const MINE: Score[] = [
  { name: 'Copperdeep', bpm: 50, beats: 4, root: 60, mode: PHRYGIAN, prog: [0, 0, 0, 0, 1, 1, 0, 0], form: 'iAQaB', level: 1.6, wet: 0.7, seed: 233,
    theme: '0:4 1:4 | 0:8 | 3:2 2:2 1:4 | 0:8 | 1:4 3:4 | 5:6 4:2 | 3:4 1:4 | 0:8',
    parts: [{ ins: 'tuba', role: 'bass', vel: 0.35 }, { ins: 'oohs', role: 'theme', oct: -12, vel: 0.5 }, { ins: 'strings', role: 'theme', oct: -12, vel: 0.4, in: 'a' },
      { ins: 'glock', role: 'bells', busy: 0.2 }, { ins: 'timp', role: 'perc', pattern: [1, 0, 0, 0, 0, 0, 0, 0], vel: 0.35, in: 'AaB' },
      { ins: 'oohs', role: 'chord', oct: -12, vel: 0.2, in: 'Q' }, { ins: 'strings', role: 'line', oct: -12, vel: 0.35, busy: 0.2 }] },
  { name: 'Pit Props', bpm: 56, beats: 4, root: 64, mode: HARMONIC, prog: [0, 0, 5, 5, 3, 3, 4, 4], form: 'iAaBQ', level: 1.6, wet: 0.7, seed: 239,
    theme: '0:4 2:2 4:2 | 3:6 2:2 | 0:4 -2:4 | 2:8 | 3:4 5:4 | 4:6 3:2 | 4:2 6:2 4:2 1:2 | 4:8',
    parts: [{ ins: 'strings', role: 'bass', oct: -12, vel: 0.45 }, { ins: 'strings', role: 'theme', oct: -12, vel: 0.5 }, { ins: 'oohs', role: 'theme', oct: -12, vel: 0.4, in: 'a' },
      { ins: 'bassdrum', role: 'perc', pattern: [2, 0, 0, 0, 1, 0, 0, 0], vel: 0.45, in: 'AaB' }, { ins: 'chimes', role: 'bells', oct: -12, busy: 0.15 },
      { ins: 'oohs', role: 'chord', oct: -12, vel: 0.2, in: 'aQ' }, { ins: 'strings', role: 'line', oct: -12, vel: 0.4, busy: 0.25 }] },
  { name: 'The Long Dark', bpm: 46, beats: 4, root: 62, mode: AEOLIAN, prog: [0, 0, 5, 5, 1, 1, 0, 0], form: 'iAQaB', level: 1.6, wet: 0.75, seed: 241,
    theme: '4:8 | 3:4 2:4 | 2:4 0:4 | -2:8 | 1:4 3:4 | 5:8 | 4:4 2:4 | 0:8',
    parts: [{ ins: 'organ', role: 'bass', vel: 0.4 }, { ins: 'strings', role: 'bass', oct: -12, vel: 0.3 }, { ins: 'oohs', role: 'theme', oct: -12, vel: 0.5 },
      { ins: 'flute', role: 'theme', vel: 0.4, in: 'a' }, { ins: 'glock', role: 'bells', busy: 0.15 }, { ins: 'oohs', role: 'line', oct: -12, vel: 0.4, busy: 0.15 }] },
];
