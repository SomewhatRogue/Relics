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
  /** The long trips, at the barracks' map table with Corporal Brisk (Kyle, 2026-11-12): its title, the board's pointer to it, Brisk's word there. */
  mapTitle: 'THE MAP TABLE',
  toMap: "Corporal Brisk in the barracks sends you to the Barrowfields, Hangman's Wood, Fenmere or the Open Cut.",
  clerk: "These are a fair way past anything on the board, so mind your boots. Say which one and I'll mark it on the map, just you or the lot of you, I don't mind.",
};
