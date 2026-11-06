/** The job's recap (recap.ts, recapparty.ts): its row labels and its one button. Game text, Kyle's style (prose-notes.md section 4). */
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
  /** The way taken at a fork, and what it paid (shared/waypay.ts wayLine). */
  way: 'WAY',
  /** Prisoners who were led off before you got to them. */
  ledoff: (n: number) => `${n} led off`,
  /** "2 of 3". */
  of: (a: number, b: number) => `${a} of ${b}`,
  /** The one button: home. A knack waiting is picked from the pack, never here (Kyle, 2026-11-05). */
  home: 'BACK TO WICKHOLD',
  /** Under the card when a knack waits: where to pick it. */
  knack: (n: number) => (n > 1 ? `<b>${n} knacks to pick:</b> open your PACK.` : '<b>A knack to pick:</b> open your PACK.'),
  /** Each hero's numbers, side by side (sim/score.ts): the rows shown, then the rest behind MORE. */
  stat: {
    kills: 'GOBLINS',
    dealt: 'DAMAGE',
    taken: 'DAMAGE TAKEN',
    dodges: 'DODGES',
    downs: 'DOWNED',
    blocks: 'BLOCKS',
    raised: 'HELPED UP',
    healed: 'HEALING GIVEN',
    best: 'BIGGEST HIT',
    /** RAISE (sim/raise.ts): friends a Cleric raised when they were out; the most health lost to being raised, in %. */
    rose: 'FRIENDS RAISED',
    cut: 'MAX HEALTH LOST',
  } as Record<string, string>,
  more: 'MORE',
  less: 'LESS',
  /** One for each hero who led the party at something (recapcalls.ts), only a real lead. */
  call: {
    kills: 'MOST GOBLINS',
    dealt: 'MOST DAMAGE',
    healed: 'MOST HEALING',
    raised: 'HELPED FRIENDS UP',
    dodges: 'MOST DODGES',
    blocks: 'MOST BLOCKS',
    best: 'BIGGEST HIT',
    standing: 'NEVER WENT DOWN',
  } as Record<string, string>,
};
