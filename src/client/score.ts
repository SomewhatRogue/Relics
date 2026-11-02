/**
 * How a piece is written down. A piece has a key (a tonic and a mode), a chord for each bar (usually
 * held two bars, so the harmony moves slowly), a theme that fits those chords, and parts: who holds
 * the chords, who plays the bass, who picks a pattern, who sings the theme. The form says which
 * sections follow which; each part says which sections it plays in.
 *
 * Melodies are written as scale steps from the tonic with a length in eighths, `step:len`
 * (`r:len` a rest; length 2 if left out), bars split by `|`. Step 7 is the tonic an octave up.
 */
import type { Ins } from './orchestra';

export type Area = 'town' | 'inside' | 'church' | 'yard' | 'village' | 'farm' | 'field' | 'forest' | 'mine' | 'boss';

/**
 * Sections: `i` an opening (chords and bass), `A` the theme, `a` the theme passed to other voices,
 * `B` the answer (or a tune made up as it goes), `Q` a quiet stretch.
 */
export type Section = 'i' | 'A' | 'a' | 'B' | 'Q';

export interface Part {
  ins: Ins;
  /**
   * bass: the chord's root, held. chord: the chord, held, voiced close and moved smoothly. arp: a
   * pattern of chord tones per eighth (0 root, 1 third, 2 fifth, 3 octave; -1 rest). theme, answer:
   * the score's melodies. line: a tune made up bar by bar. perc: a drum per eighth (1 soft, 2 hard;
   * a timpani takes the chord's root). bells: now and then a chord tone, high.
   */
  role: 'bass' | 'chord' | 'arp' | 'theme' | 'answer' | 'line' | 'perc' | 'bells';
  /** The sections it plays in (default: all but the quiet ones for tunes, all for the rest). */
  in?: string;
  /** Semitones from the written pitch (theme, line, arp) or from the default register (bass, chord). */
  oct?: number;
  vel?: number;
  pattern?: number[];
  /** How busy a line is, or how often bells ring (0..1). */
  busy?: number;
}

export interface Score {
  name: string;
  bpm: number;
  beats: 3 | 4;
  /** The tonic (MIDI note, around where the theme sits) and the mode's steps. */
  root: number;
  mode: number[];
  /** Chords by scale step, one per bar (repeat one to hold it). */
  prog: number[];
  theme: string;
  answer?: string;
  parts: Part[];
  form: string;
  /** Its loudness against the others (default 1). */
  level?: number;
  /** How much reverb: a room, a field, a cave. */
  wet: number;
  seed: number;
}

export const DORIAN = [0, 2, 3, 5, 7, 9, 10], AEOLIAN = [0, 2, 3, 5, 7, 8, 10], PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
export const MIXO = [0, 2, 4, 5, 7, 9, 10], IONIAN = [0, 2, 4, 5, 7, 9, 11], HARMONIC = [0, 2, 3, 5, 7, 8, 11];

/** A note of the score's mode, `k` steps up from the tonic (any octave). */
export const step = (s: Score, k: number) => s.root + 12 * Math.floor(k / 7) + s.mode[((k % 7) + 7) % 7];

/** A melody note: when (eighths into its bar), how long (eighths), what step (null for a rest). */
export interface Note { at: number; len: number; k: number | null }

/** A melody, bar by bar. */
export function parseTune(text: string): Note[][] {
  return text.split('|').map((bar) => {
    let at = 0;
    return bar.trim().split(/\s+/).filter(Boolean).map((tok) => {
      const [k, len] = tok.split(':'), n = { at, len: len ? Number(len) : 2, k: k === 'r' ? null : Number(k) };
      at += n.len;
      return n;
    });
  });
}
