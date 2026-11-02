/**
 * The pieces for the town and its rooms: the square warm and gentle (harp, strings, a little flute),
 * the houses small and close, the church hushed (organ and voices), the yard martial but light.
 */
import { AEOLIAN, DORIAN, IONIAN, MIXO, type Score } from './score';

const WALTZ = [0, 1, 2, 1, 2, 1], UP = [0, 1, 2, 3, 2, 1, 2, 1], ROLL = [0, 2, 1, 2, 3, 2, 1, 2];
const WALK = [0, -1, 2, -1, 0, -1, 2, -1];

export const TOWN: Score[] = [
  { name: 'Lantern Square', bpm: 76, beats: 3, root: 62, mode: IONIAN, prog: [0, 0, 5, 5, 3, 3, 4, 4], form: 'iAaBQ', wet: 0.3, seed: 11,
    theme: '2:4 4:2 | 4:3 3:1 2:2 | 0:4 2:2 | 5:6 | 5:2 4:2 3:2 | 2:4 1:2 | 1:2 2:2 4:2 | 1:6',
    answer: '7:4 6:2 | 5:4 4:2 | 5:2 7:2 5:2 | 2:6 | 3:2 4:2 5:2 | 4:4 2:2 | 1:4 2:2 | 4:6',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.45 }, { ins: 'strings', role: 'chord', vel: 0.32 }, { ins: 'harp', role: 'arp', pattern: WALTZ, vel: 0.5, in: 'AaB' },
      { ins: 'flute', role: 'theme', vel: 0.6 }, { ins: 'strings', role: 'theme', vel: 0.55, in: 'a' }, { ins: 'flute', role: 'answer', vel: 0.55 }] },
  { name: 'Market Morning', bpm: 92, beats: 4, root: 67, mode: MIXO, prog: [0, 0, 6, 6, 3, 3, 0, 0], form: 'iAaBQ', wet: 0.25, seed: 23,
    theme: '0:2 2:2 4:3 2:1 | 4:2 5:2 4:4 | 6:2 5:2 4:2 3:2 | 1:6 r:2 | 3:2 4:2 5:3 4:1 | 3:2 2:2 3:4 | 4:2 2:2 1:2 2:2 | 0:6 r:2',
    parts: [{ ins: 'pizz', role: 'arp', oct: -12, pattern: WALK, vel: 0.6 }, { ins: 'strings', role: 'chord', vel: 0.3 }, { ins: 'harp', role: 'arp', pattern: ROLL, vel: 0.4, in: 'aB' },
      { ins: 'frame', role: 'perc', pattern: [2, 0, 1, 0, 2, 1, 1, 0], vel: 0.5, in: 'AaB' }, { ins: 'flute', role: 'theme', vel: 0.6 },
      { ins: 'horn', role: 'theme', oct: -12, vel: 0.5, in: 'a' }, { ins: 'flute', role: 'line', vel: 0.5, busy: 0.4 }] },
  { name: 'Wickhold by Night', bpm: 66, beats: 3, root: 57, mode: AEOLIAN, prog: [0, 0, 5, 5, 3, 3, 4, 4], form: 'iAaQB', wet: 0.4, seed: 37,
    theme: '4:4 2:2 | 0:2 1:2 2:2 | 2:4 0:2 | -2:6 | 3:3 2:1 3:2 | 5:4 3:2 | 4:2 3:2 1:2 | 4:6',
    parts: [{ ins: 'strings', role: 'bass', vel: 0.4 }, { ins: 'oohs', role: 'chord', vel: 0.35 }, { ins: 'harp', role: 'arp', pattern: WALTZ, vel: 0.45, in: 'AaBQ' },
      { ins: 'strings', role: 'theme', vel: 0.6 }, { ins: 'flute', role: 'theme', oct: 12, vel: 0.5, in: 'a' }, { ins: 'harp', role: 'line', oct: 12, vel: 0.45, busy: 0.3 },
      { ins: 'glock', role: 'bells', busy: 0.12, in: 'Q' }] },
];

export const INSIDE: Score[] = [
  { name: 'By the Hearth', bpm: 72, beats: 3, root: 65, mode: IONIAN, prog: [0, 0, 3, 3, 5, 5, 4, 4], form: 'iAaBQ', wet: 0.15, seed: 41,
    theme: '4:2 2:2 0:2 | 2:4 4:2 | 5:2 3:2 5:2 | 7:4 5:2 | 5:2 4:2 2:2 | 0:4 2:2 | 1:2 2:2 3:2 | 4:4 r:2',
    parts: [{ ins: 'pizz', role: 'arp', oct: -12, pattern: [0, -1, -1, 2, -1, -1], vel: 0.55 }, { ins: 'harp', role: 'arp', pattern: WALTZ, vel: 0.4, in: 'iAB' },
      { ins: 'flute', role: 'theme', vel: 0.55 }, { ins: 'harp', role: 'theme', oct: 12, vel: 0.5, in: 'a' }, { ins: 'oohs', role: 'chord', vel: 0.25, in: 'aQ' },
      { ins: 'flute', role: 'line', vel: 0.45 }] },
  { name: 'Warm Bread', bpm: 80, beats: 4, root: 62, mode: MIXO, prog: [0, 0, 6, 6, 3, 3, 0, 0], form: 'AaBQ', wet: 0.12, seed: 53,
    theme: '0:2 4:2 4:2 5:1 4:1 | 2:4 0:4 | 6:2 5:2 4:2 3:2 | 1:4 -1:4 | 3:2 4:2 5:2 7:2 | 5:4 3:4 | 4:2 2:2 1:2 2:2 | 0:6 r:2',
    parts: [{ ins: 'pizz', role: 'arp', oct: -12, pattern: WALK, vel: 0.5 }, { ins: 'harp', role: 'theme', vel: 0.55 }, { ins: 'harp', role: 'arp', pattern: UP, vel: 0.35, in: 'a' },
      { ins: 'flute', role: 'theme', vel: 0.5, in: 'a' }, { ins: 'harp', role: 'line', oct: 12, vel: 0.45 }, { ins: 'oohs', role: 'chord', vel: 0.22, in: 'BQ' }] },
  { name: 'Low Candles', bpm: 60, beats: 3, root: 64, mode: AEOLIAN, prog: [0, 0, 3, 3, 5, 5, 4, 4], form: 'iAaBQ', wet: 0.18, seed: 67,
    theme: '0:2 2:2 4:2 | 3:4 2:2 | 3:2 5:2 3:2 | 0:6 | 2:2 0:2 2:2 | 4:4 5:2 | 4:2 3:2 1:2 | -1:6',
    parts: [{ ins: 'harp', role: 'arp', pattern: [0, -1, 1, -1, 2, -1], vel: 0.4, in: 'iAaBQ' }, { ins: 'pizz', role: 'arp', oct: -12, pattern: [0, -1, -1, -1, -1, -1], vel: 0.5 },
      { ins: 'oohs', role: 'chord', vel: 0.25, in: 'aBQ' }, { ins: 'flute', role: 'theme', vel: 0.5 }, { ins: 'strings', role: 'theme', oct: -12, vel: 0.45, in: 'a' },
      { ins: 'harp', role: 'line', oct: 12, vel: 0.4 }] },
];

export const CHURCH: Score[] = [
  { name: 'The Last Lantern', bpm: 52, beats: 4, root: 62, mode: AEOLIAN, prog: [0, 0, 6, 6, 5, 5, 4, 4], form: 'iAaBA', level: 1.5, wet: 0.6, seed: 71,
    theme: '0:4 2:4 | 4:6 3:2 | 1:4 3:4 | 2:6 1:2 | 0:4 2:4 | 5:4 4:2 2:2 | 1:4 0:4 | 1:8',
    answer: '4:4 5:4 | 4:4 2:4 | 3:4 1:4 | -1:8 | 0:4 2:2 0:2 | -2:8 | 1:2 0:2 -1:2 0:2 | 1:8',
    parts: [{ ins: 'organ', role: 'bass', vel: 0.45 }, { ins: 'organ', role: 'chord', vel: 0.35 }, { ins: 'choir', role: 'theme', vel: 0.6 },
      { ins: 'strings', role: 'theme', oct: -12, vel: 0.5, in: 'a' }, { ins: 'oohs', role: 'chord', vel: 0.3, in: 'a' }, { ins: 'oohs', role: 'answer', vel: 0.55 },
      { ins: 'chimes', role: 'bells', oct: -12, busy: 0.2 }] },
  { name: 'Vigil', bpm: 48, beats: 4, root: 60, mode: DORIAN, prog: [0, 0, 3, 3, 6, 6, 0, 0], form: 'iAaBQ', level: 1.5, wet: 0.65, seed: 83,
    theme: '4:4 3:2 2:2 | 0:8 | 3:2 4:2 5:4 | 5:6 r:2 | 6:4 5:2 6:2 | 3:8 | 2:4 1:4 | 0:8',
    parts: [{ ins: 'organ', role: 'bass', vel: 0.4 }, { ins: 'organ', role: 'chord', vel: 0.3 }, { ins: 'oohs', role: 'theme', vel: 0.6 },
      { ins: 'choir', role: 'theme', vel: 0.5, in: 'a' }, { ins: 'organ', role: 'line', vel: 0.35, busy: 0.25 }, { ins: 'chimes', role: 'bells', oct: -12, busy: 0.15 }] },
  { name: 'Coal and Candle', bpm: 56, beats: 3, root: 65, mode: IONIAN, prog: [0, 0, 3, 3, 5, 5, 4, 4], form: 'iAaBQ', level: 1.5, wet: 0.6, seed: 97,
    theme: '2:4 4:2 | 4:2 5:2 4:2 | 3:4 5:2 | 5:6 | 4:2 2:2 0:2 | 0:4 2:2 | 1:2 2:2 4:2 | 4:6',
    parts: [{ ins: 'organ', role: 'bass', vel: 0.4 }, { ins: 'organ', role: 'chord', vel: 0.3 }, { ins: 'harp', role: 'arp', pattern: [0, -1, -1, 2, -1, -1], vel: 0.4 },
      { ins: 'choir', role: 'theme', vel: 0.55 }, { ins: 'harp', role: 'theme', oct: 12, vel: 0.45, in: 'a' }, { ins: 'oohs', role: 'chord', vel: 0.3, in: 'a' },
      { ins: 'oohs', role: 'line', vel: 0.5 }] },
];

export const YARD: Score[] = [
  { name: 'Drill', bpm: 104, beats: 4, root: 62, mode: DORIAN, prog: [0, 0, 6, 6, 3, 3, 4, 4], form: 'iAaBA', wet: 0.2, seed: 101,
    theme: '0:2 0:1 0:1 4:4 | 4:2 3:2 2:2 1:2 | 1:2 1:1 1:1 6:4 | 3:2 1:2 -1:4 | 3:2 3:1 3:1 5:4 | 6:3 5:1 3:4 | 4:2 6:2 4:2 1:2 | 4:6 r:2',
    parts: [{ ins: 'frame', role: 'perc', pattern: [2, 0, 1, 0, 2, 1, 1, 0], vel: 0.55 }, { ins: 'spic', role: 'arp', oct: -12, pattern: [0, -1, 0, -1, 2, -1, 0, -1], vel: 0.45 },
      { ins: 'strings', role: 'chord', vel: 0.3 }, { ins: 'strings', role: 'bass', vel: 0.4 }, { ins: 'horn', role: 'theme', oct: -12, vel: 0.6 },
      { ins: 'flute', role: 'theme', vel: 0.5, in: 'a' }, { ins: 'horn', role: 'line', oct: -12, vel: 0.45, busy: 0.3 }] },
  { name: "The Squire's Lesson", bpm: 92, beats: 4, root: 67, mode: IONIAN, prog: [0, 0, 3, 3, 4, 4, 0, 0], form: 'AaBQ', wet: 0.2, seed: 113,
    theme: '0:2 2:2 4:2 7:2 | 6:3 4:1 4:4 | 5:2 3:2 5:2 7:2 | 7:3 6:1 5:4 | 4:2 6:2 8:2 6:2 | 4:4 1:4 | 2:2 4:2 2:2 1:2 | 0:6 r:2',
    parts: [{ ins: 'frame', role: 'perc', pattern: [2, 0, 1, 1, 2, 0, 1, 0], vel: 0.5 }, { ins: 'pizz', role: 'arp', oct: -12, pattern: WALK, vel: 0.5 },
      { ins: 'harp', role: 'arp', pattern: UP, vel: 0.35, in: 'aB' }, { ins: 'strings', role: 'chord', vel: 0.28 }, { ins: 'flute', role: 'theme', vel: 0.6 },
      { ins: 'horn', role: 'theme', oct: -12, vel: 0.55, in: 'a' }, { ins: 'flute', role: 'line', vel: 0.5 }] },
  { name: 'Sand and Straw', bpm: 98, beats: 4, root: 64, mode: AEOLIAN, prog: [0, 0, 5, 5, 6, 6, 4, 4], form: 'iAaBQ', wet: 0.22, seed: 127,
    theme: '0:3 0:1 2:2 4:2 | 4:4 3:2 2:2 | 0:3 -1:1 -2:4 | 0:2 2:2 0:4 | -1:3 1:1 3:2 1:2 | -1:4 r:4 | 1:2 3:2 4:2 3:2 | 4:6 r:2',
    parts: [{ ins: 'timp', role: 'perc', pattern: [2, 0, 0, 0, 1, 0, 0, 0], vel: 0.5, in: 'AaB' }, { ins: 'frame', role: 'perc', pattern: [0, 0, 1, 0, 0, 0, 1, 1], vel: 0.4 },
      { ins: 'spic', role: 'arp', oct: -12, pattern: [0, -1, 0, 0, 0, -1, 0, 0], vel: 0.4 }, { ins: 'strings', role: 'chord', vel: 0.3 }, { ins: 'strings', role: 'bass', vel: 0.4 },
      { ins: 'horn', role: 'theme', oct: -12, vel: 0.6 }, { ins: 'strings', role: 'theme', vel: 0.55, in: 'a' }, { ins: 'flute', role: 'line', vel: 0.5 }] },
];
