/** The job board's own words (boardui.ts): the card's row labels, the weather, and its buttons. Kyle's style (prose-notes.md section 4). */
export const BOARDW = {
  where: 'WHERE',
  rooms: 'ROOMS',
  map: 'MAP',
  time: 'TIME',
  weather: 'WEATHER',
  danger: 'DANGER',
  boss: 'BOSS',
  pays: 'PAYS',
  needs: 'NEEDS',
  deep: 'DEEP',
  /** A story mission online: who it needs. */
  party: (n: number) => `A party of ${n}`,
  /** A job's weather on the board (clear says nothing). */
  rain: 'RAIN',
  storm: 'STORM',
  fog: 'FOG',
  alone: 'GO ALONE',
  take: 'TAKE THE JOB',
  gather: 'GATHER A PARTY',
  back: 'BACK',
  jobs: 'JOBS',
  done: 'DONE LATELY',
  /** The long trips moved to the town hall (Kyle, 2026-11-12): the map table's title, the board's pointer to it, the clerk there. */
  mapTitle: 'THE MAP TABLE',
  toMap: "Pick the Barrowfields, Hangman's Wood, Fenmere or the Open Cut at the map table in the town hall.",
  clerk: "These go a fair bit further out than the jobs on the board, so pick the one you want and I'll mark it on the map.",
};
