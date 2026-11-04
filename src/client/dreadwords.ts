/**
 * The words for being out of bounds (sim/dread.ts), over your own hero. For the lore keeper and the
 * line editor. Plain and in the world's voice, never comic: something has seen you, and it's coming.
 * `wild` is the thing nobody names (woods, the mine, the bogs); `settled` is the hungry, out of the
 * dark (villages, farms, camps, and inside any house); `town` is Wickhold and the yard, where nothing
 * comes and you're only put back.
 */
export const DREADW = {
  wild: {
    warn: 'Something out there has noticed you.',
    worse: "It's closer now. Go back the way you came.",
  },
  settled: {
    warn: "There are eyes out there, and they've seen you.",
    worse: 'More of them now. Go back the way you came.',
  },
  town: {
    back: "There's no way through there.",
  },
};
