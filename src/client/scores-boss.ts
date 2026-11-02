/**
 * The boss pieces: epic and old, like something out of scripture. A choir, low brass, timpani and
 * strings driving underneath; each opens straight on the theme.
 */
import { HARMONIC, PHRYGIAN, type Score } from './score';

export const BOSS: Score[] = [
  { name: 'The Butcher Comes', bpm: 112, beats: 4, root: 62, mode: HARMONIC, prog: [0, 0, 5, 5, 3, 3, 4, 4], form: 'AaBAQ', level: 0.6, wet: 0.3, seed: 251,
    theme: '0:3 0:1 4:4 | 2:4 0:4 | 5:4 4:2 2:2 | 0:8 | 3:3 5:1 7:4 | 7:2 5:2 3:4 | 4:3 6:1 8:4 | 6:4 4:4',
    parts: [{ ins: 'spic', role: 'arp', oct: -12, pattern: [0, 0, 0, 0, 0, 0, 2, 0], vel: 0.6, in: 'AaB' }, { ins: 'timp', role: 'perc', pattern: [2, 0, 0, 1, 2, 0, 1, 0], vel: 0.6, in: 'AaB' },
      { ins: 'bassdrum', role: 'perc', pattern: [2, 0, 0, 0, 2, 0, 0, 0], vel: 0.5, in: 'AaB' }, { ins: 'tuba', role: 'bass', vel: 0.55 }, { ins: 'strings', role: 'bass', vel: 0.8 },
      { ins: 'strings', role: 'chord', vel: 0.8, in: 'AaB' }, { ins: 'choir', role: 'chord', vel: 0.5 }, { ins: 'horn', role: 'theme', oct: -12, vel: 0.85 },
      { ins: 'choir', role: 'theme', vel: 0.7, in: 'a' }, { ins: 'strings', role: 'theme', oct: 12, vel: 0.8, in: 'a' }, { ins: 'horn', role: 'line', oct: -12, vel: 0.7, busy: 0.4 }] },
  { name: 'Chains', bpm: 104, beats: 4, root: 64, mode: PHRYGIAN, prog: [0, 0, 1, 1, 0, 0, 6, 6], form: 'AaBAQ', level: 0.6, wet: 0.3, seed: 257,
    theme: '0:4 1:4 | 0:2 -1:2 0:4 | 1:4 3:4 | 5:4 3:4 | 4:4 3:2 1:2 | 0:8 | -1:4 1:4 | 3:8',
    parts: [{ ins: 'spic', role: 'arp', oct: -12, pattern: [0, 0, 1, 0, 0, 0, 1, 0], vel: 0.6, in: 'AaB' }, { ins: 'timp', role: 'perc', pattern: [2, 0, 1, 0, 2, 0, 1, 1], vel: 0.55, in: 'AaB' },
      { ins: 'bassdrum', role: 'perc', pattern: [2, 0, 0, 0, 0, 0, 2, 0], vel: 0.5, in: 'AaB' }, { ins: 'tuba', role: 'bass', vel: 0.55 }, { ins: 'strings', role: 'chord', vel: 0.8, in: 'AaB' },
      { ins: 'choir', role: 'theme', vel: 0.75 }, { ins: 'horn', role: 'theme', oct: -12, vel: 0.8, in: 'a' }, { ins: 'strings', role: 'theme', vel: 0.8, in: 'a' },
      { ins: 'choir', role: 'chord', vel: 0.5, in: 'aBQ' }, { ins: 'horn', role: 'line', oct: -12, vel: 0.7, busy: 0.4 }] },
  { name: 'No Mercy at the Bell', bpm: 120, beats: 4, root: 55, mode: HARMONIC, prog: [0, 0, 5, 5, 3, 3, 4, 4], form: 'AaBAQ', level: 0.6, wet: 0.28, seed: 263,
    theme: '0:2 2:2 4:4 | 4:2 5:2 4:4 | 5:4 4:2 2:2 | 0:6 r:2 | 3:2 5:2 7:4 | 7:4 5:4 | 4:2 6:2 8:4 | 6:4 4:4',
    parts: [{ ins: 'chimes', role: 'perc', pattern: [2, 0, 0, 0, 0, 0, 0, 0], vel: 0.5, in: 'AaB' }, { ins: 'spic', role: 'arp', pattern: [0, 0, 2, 0, 0, 0, 2, 0], vel: 0.6, in: 'AaB' },
      { ins: 'timp', role: 'perc', pattern: [2, 0, 0, 0, 2, 0, 1, 1], vel: 0.6, in: 'AaB' }, { ins: 'bassdrum', role: 'perc', pattern: [2, 0, 0, 0, 2, 0, 0, 0], vel: 0.5, in: 'AaB' },
      { ins: 'tuba', role: 'bass', vel: 0.55 }, { ins: 'strings', role: 'chord', oct: 12, vel: 0.8, in: 'AaB' }, { ins: 'choir', role: 'theme', vel: 0.75 },
      { ins: 'horn', role: 'theme', vel: 0.8, in: 'a' }, { ins: 'strings', role: 'theme', oct: 12, vel: 0.8, in: 'a' }, { ins: 'choir', role: 'chord', oct: 12, vel: 0.5, in: 'aBQ' },
      { ins: 'horn', role: 'line', vel: 0.7, busy: 0.4 }] },
];
