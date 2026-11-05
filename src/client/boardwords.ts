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
};
