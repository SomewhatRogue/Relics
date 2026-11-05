/** The knacks screen's words, the job end's line about a pick, and the pop over the hero (game's own plain voice). */
export const KNW = {
  title: 'KNACKS',
  take: 'TAKE',
  back: 'BACK',
  reset: 'RESET',
  keep: 'KEEP THEM',
  resetYes: 'RESET THEM',
  resetTitle: 'RESET KNACKS?',
  resetLine: (n: number) => `${n === 1 ? 'Your knack comes' : n === 2 ? 'Both your knacks come' : `All ${n} of your knacks come`} back as picks. Free, any time you're in Wickhold.`,
  howItWorks: 'Each level up offers two knacks. Take one.',
  waiting: (n: number) => (n > 1 ? `${n} KNACKS TO PICK: TAKE ONE OF THESE FIRST` : 'A KNACK TO PICK: TAKE ONE'),
  notHere: "Take it back in Wickhold.",
  tag: { have: 'TAKEN', offer: 'ON OFFER', next: 'NEXT', later: 'LATER' } as Record<string, string>,
  /** The job's end. */
  jobLine: (n: number) => (n > 1 ? `<b>${n} knacks to pick.</b>` : '<b>A knack to pick.</b>'),
  pick: 'PICK A KNACK',
  see: 'SEE KNACKS',
  /** Over the hero, once, back in town. */
  pop: (level: number, picks: number) => `LEVEL ${level}${picks ? ': A KNACK TO PICK' : ''}`,
  /** On the pack's KNACKS button while picks wait (Kyle: "highlighted if you click your inventory"). */
  packPick: (n: number) => `${n} TO PICK`,
  /** The HUD's line in town. */
  hud: 'KNACK TO PICK',
};
