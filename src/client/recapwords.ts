/** The job's recap (recap.ts): its row labels and its one button. Game text, Kyle's style (prose-notes.md section 4). */
export const RECAPW = {
  rooms: 'ROOMS',
  jobs: 'JOBS',
  sides: 'SIDE JOBS',
  goblins: 'GOBLINS',
  dens: 'DENS',
  downed: 'DOWNED',
  time: 'TIME',
  found: 'FOUND',
  treasure: 'TREASURE',
  relic: 'RELICS',
  /** "2 of 3". */
  of: (a: number, b: number) => `${a} of ${b}`,
  /** The one button: a knack waiting comes next, else home. */
  next: 'NEXT: PICK A KNACK',
  home: 'BACK TO WICKHOLD',
};
