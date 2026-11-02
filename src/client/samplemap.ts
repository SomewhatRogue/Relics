/**
 * The recorded notes in public/music, made by scripts/make-samples.py (do not edit by hand): for
 * each instrument, its files, the note each was played at, a gain that levels them with each other,
 * and for held sounds the loop (seconds). Sources and licences: public/music/CREDITS.txt.
 */
export interface SampleNote { file: string; root: number; gain: number; loop?: [number, number] }

export const SAMPLES = {
  'strings-p': [
    { file: 'strings-p-28.mp3', root: 28, gain: 0.329, loop: [0.600000, 3.555896] },
    { file: 'strings-p-34.mp3', root: 34, gain: 0.255, loop: [0.600000, 3.589796] },
    { file: 'strings-p-36.mp3', root: 36, gain: 0.314, loop: [0.750000, 3.704331] },
    { file: 'strings-p-43.mp3', root: 43, gain: 0.316, loop: [0.600000, 3.541293] },
    { file: 'strings-p-50.mp3', root: 50, gain: 0.311, loop: [0.600000, 3.597959] },
    { file: 'strings-p-57.mp3', root: 57, gain: 0.312, loop: [0.600000, 3.543243] },
    { file: 'strings-p-62.mp3', root: 62, gain: 0.356, loop: [0.600000, 3.596803] },
    { file: 'strings-p-69.mp3', root: 69, gain: 0.371, loop: [0.600000, 3.540454] },
    { file: 'strings-p-76.mp3', root: 76, gain: 0.424, loop: [0.600000, 3.598866] },
    { file: 'strings-p-83.mp3', root: 83, gain: 0.350, loop: [1.250000, 4.241633] },
  ],
  'strings-f': [
    { file: 'strings-f-36.mp3', root: 36, gain: 0.342, loop: [0.600000, 3.592721] },
    { file: 'strings-f-43.mp3', root: 43, gain: 0.330, loop: [0.600000, 3.590952] },
    { file: 'strings-f-50.mp3', root: 50, gain: 0.312, loop: [0.600000, 3.560635] },
    { file: 'strings-f-57.mp3', root: 57, gain: 0.372, loop: [0.600000, 3.555624] },
    { file: 'strings-f-62.mp3', root: 62, gain: 0.405, loop: [0.600000, 3.597324] },
    { file: 'strings-f-69.mp3', root: 69, gain: 0.362, loop: [0.600000, 3.596667] },
    { file: 'strings-f-76.mp3', root: 76, gain: 0.465, loop: [0.600000, 3.597075] },
    { file: 'strings-f-83.mp3', root: 83, gain: 0.385, loop: [0.600000, 3.583016] },
  ],
  'pizz': [
    { file: 'pizz-36.mp3', root: 36, gain: 0.284 },
    { file: 'pizz-43.mp3', root: 43, gain: 0.302 },
    { file: 'pizz-50.mp3', root: 50, gain: 0.441 },
    { file: 'pizz-57.mp3', root: 57, gain: 0.390 },
    { file: 'pizz-62.mp3', root: 62, gain: 0.526 },
    { file: 'pizz-69.mp3', root: 69, gain: 0.431 },
    { file: 'pizz-76.mp3', root: 76, gain: 0.507 },
  ],
  'spic': [
    { file: 'spic-36.mp3', root: 36, gain: 0.310 },
    { file: 'spic-43.mp3', root: 43, gain: 0.315 },
    { file: 'spic-50.mp3', root: 50, gain: 0.372 },
    { file: 'spic-57.mp3', root: 57, gain: 0.367 },
  ],
  'horn': [
    { file: 'horn-39.mp3', root: 39, gain: 0.354, loop: [0.600000, 3.542721] },
    { file: 'horn-46.mp3', root: 46, gain: 0.374, loop: [0.600000, 3.593560] },
    { file: 'horn-53.mp3', root: 53, gain: 0.340, loop: [0.600000, 3.594512] },
    { file: 'horn-60.mp3', root: 60, gain: 0.254, loop: [0.600000, 3.594558] },
  ],
  'tuba': [
    { file: 'tuba-29.mp3', root: 29, gain: 0.486, loop: [0.600000, 3.089297] },
    { file: 'tuba-34.mp3', root: 34, gain: 0.334, loop: [0.600000, 3.588367] },
    { file: 'tuba-39.mp3', root: 39, gain: 0.318, loop: [0.600000, 3.569524] },
  ],
  'harp': [
    { file: 'harp-38.mp3', root: 38, gain: 0.311 },
    { file: 'harp-45.mp3', root: 45, gain: 0.295 },
    { file: 'harp-52.mp3', root: 52, gain: 0.361 },
    { file: 'harp-59.mp3', root: 59, gain: 0.277 },
    { file: 'harp-65.mp3', root: 65, gain: 0.240 },
    { file: 'harp-72.mp3', root: 72, gain: 0.521 },
    { file: 'harp-79.mp3', root: 79, gain: 0.499 },
    { file: 'harp-86.mp3', root: 86, gain: 0.517 },
  ],
  'flute': [
    { file: 'flute-60.mp3', root: 60, gain: 0.364, loop: [0.600000, 3.566553] },
    { file: 'flute-64.mp3', root: 64, gain: 0.326, loop: [0.600000, 3.564898] },
    { file: 'flute-69.mp3', root: 69, gain: 0.361, loop: [0.600000, 3.584082] },
    { file: 'flute-72.mp3', root: 72, gain: 0.311, loop: [0.600000, 3.572154] },
    { file: 'flute-76.mp3', root: 76, gain: 0.248, loop: [0.600000, 3.588458] },
    { file: 'flute-81.mp3', root: 81, gain: 0.247, loop: [0.600000, 3.553673] },
  ],
  'organ': [
    { file: 'organ-36.mp3', root: 36, gain: 0.234, loop: [0.600000, 3.595397] },
    { file: 'organ-42.mp3', root: 42, gain: 0.221, loop: [0.600000, 3.543900] },
    { file: 'organ-48.mp3', root: 48, gain: 0.194, loop: [0.600000, 3.567846] },
    { file: 'organ-54.mp3', root: 54, gain: 0.165, loop: [0.600000, 3.574921] },
    { file: 'organ-60.mp3', root: 60, gain: 0.294, loop: [0.600000, 3.550544] },
    { file: 'organ-66.mp3', root: 66, gain: 0.205, loop: [0.600000, 3.582993] },
    { file: 'organ-72.mp3', root: 72, gain: 0.314, loop: [0.600000, 3.543537] },
    { file: 'organ-78.mp3', root: 78, gain: 0.260, loop: [0.600000, 3.565692] },
  ],
  'choir': [
    { file: 'choir-45.mp3', root: 45, gain: 0.424, loop: [0.600000, 2.640113] },
    { file: 'choir-48.mp3', root: 48, gain: 0.407, loop: [0.600000, 2.746259] },
    { file: 'choir-53.mp3', root: 53, gain: 0.403, loop: [0.600000, 2.723651] },
    { file: 'choir-58.mp3', root: 58, gain: 0.348, loop: [0.600000, 2.690272] },
    { file: 'choir-63.mp3', root: 63, gain: 0.369, loop: [0.600000, 2.590431] },
    { file: 'choir-68.mp3', root: 68, gain: 0.371, loop: [0.600000, 2.673175] },
    { file: 'choir-73.mp3', root: 73, gain: 0.367, loop: [0.600000, 2.699728] },
    { file: 'choir-77.mp3', root: 77, gain: 0.336, loop: [0.600000, 2.696871] },
  ],
  'oohs': [
    { file: 'oohs-48.mp3', root: 48, gain: 0.219, loop: [0.600000, 2.794943] },
    { file: 'oohs-53.mp3', root: 53, gain: 0.219, loop: [0.600000, 2.794490] },
    { file: 'oohs-58.mp3', root: 58, gain: 0.220, loop: [0.600000, 2.789206] },
    { file: 'oohs-63.mp3', root: 63, gain: 0.298, loop: [0.600000, 2.741338] },
    { file: 'oohs-68.mp3', root: 68, gain: 0.339, loop: [0.600000, 2.740907] },
  ],
  'timp': [
    { file: 'timp-41_4.mp3', root: 41.4, gain: 0.286 },
    { file: 'timp-49_5.mp3', root: 49.5, gain: 0.449 },
    { file: 'timp-54_6.mp3', root: 54.6, gain: 0.665 },
  ],
  'bassdrum': [
    { file: 'bassdrum-36.mp3', root: 36, gain: 0.515 },
  ],
  'frame': [
    { file: 'frame-40.mp3', root: 40, gain: 0.526 },
    { file: 'frame-50.mp3', root: 50, gain: 0.526 },
    { file: 'frame-60.mp3', root: 60, gain: 0.526 },
  ],
  'chimes': [
    { file: 'chimes-62.mp3', root: 62, gain: 0.428 },
    { file: 'chimes-70.mp3', root: 70, gain: 0.654 },
    { file: 'chimes-76.mp3', root: 76, gain: 0.380 },
  ],
  'glock': [
    { file: 'glock-79.mp3', root: 79, gain: 0.590 },
    { file: 'glock-84.mp3', root: 84, gain: 0.553 },
    { file: 'glock-91.mp3', root: 91, gain: 0.707 },
    { file: 'glock-96.mp3', root: 96, gain: 0.793 },
  ],
  'gong': [
    { file: 'gong-50.mp3', root: 50, gain: 0.526 },
  ],
} satisfies Record<string, SampleNote[]>;

export type SampleId = keyof typeof SAMPLES;
