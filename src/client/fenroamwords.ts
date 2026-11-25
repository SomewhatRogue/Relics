/**
 * Every player-facing line of THE FEN (docs/design/the-fen.md): going between it and the north fields, its shelter's
 * keeper, its bounties. Place names in capitals, as the north fields' are (shared/fenroam.ts has the zones' and the
 * shelter's). The bounties' and the keeper's lines join BOUNTYW and SHELTERW (bountywords.ts, shelterwords.ts).
 */
export const FENW = {
  /** Standing in the north fields' far end: the leader is asked. */
  onAsk: 'ON INTO THE FEN?',
  onGo: 'GO ON',
  /** Back at the fen's way in. */
  backAsk: 'BACK TO THE NORTH FIELDS?',
  backGo: 'GO BACK',
  stay: 'STAY',
  /** The staithe's keeper, at her fire. */
  keeper: "The catchers pulled their boards up one night and never put them down again, and I've kept the fire going since, for all the thanks it gets me. Stay off the end of the jetty, mind, it's *deep* right under it. Anything you want off me costs what it costs in town.",
  title: { larder: 'THE LARDER', lurkers: 'THE LURKERS', causeway: 'THE CAUSEWAY' } as Record<string, string>,
  line: {
    larder: 'Kill the band at the larder on THE PEAT CUTS.',
    lurkers: 'Kill the hidden ones in THE WIDE REEDS.',
    causeway: 'Kill the shield line, the skimmer and the two waiting past the ford on THE CAUSEWAYS.',
  } as Record<string, string>,
};
