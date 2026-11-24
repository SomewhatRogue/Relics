/**
 * The Keeping Room's words (shared/keeping.ts; docs/design/holy-and-hungry.md section 7). Dorcas: warm, chatty,
 * calls you "duck", tells you exactly what a thing costs and does and never why. Never: altar, prayer, rite, god,
 * sun, holy, the Lantern's truth. Through the lore keeper and the line editor, 2026-11-20.
 */
export const KEEPW = {
  /** The sewer grate's button, for a corrupt hero only. */
  arch: 'THE BRICKED ARCH',
  title: 'THE KEEPING ROOM',
  /** The door line's button: in, through the arch. */
  goIn: 'GO IN',
  /** Finding it: plain. */
  door: 'Scratches at hand height on the bricked arch, bright where your eyes fall. Behind an iron slot someone looks you over, and a bolt goes back.',
  scene: 'A drained cistern, shelved all round with pewter, rings and plate, a tallow stub on every shelf. A cot, a brazier with a kettle on it, and a cradle in among it all. Under a drip, a stone trough.',
  greet: "Come in, duck, mind the step, it's wet. Kettle's on. You've the look of someone who's been carrying something a long way.",
  feedButton: 'FEED A RELIC',
  feedRule: 'Lay vowed pieces from your pack in the trough with a relic on top. The relic eats them and fills. Each piece it eats grows your hunger.',
  /** A relic's button: how many pieces it would eat. */
  feedPick: (name: string, n: number) => `${name}: ${n} ${n === 1 ? 'PIECE' : 'PIECES'}`,
  fed: (n: number, full: boolean) => `There, duck, that's ${n} ${n === 1 ? 'piece' : 'pieces'} in${full ? ", and it's full" : ''}. Sit down and have a cup before you go up, you're the colour of the wall.`,
  noPieces: 'You have no vowed pieces in your pack.',
  noRelic: 'None of your relics can be filled here. Elemental relics never can.',
  giveButton: 'GIVE TO DORCAS',
  giveLine: "I'll take any of those vowed pieces off you, duck, and pay a fair price. It sits heavier on you after, mind.",
  giveRule: 'Each piece you give her grows your hunger.',
  give: (name: string, coins: string) => `${name}: ${coins}`,
  given: "Ta, duck. That'll go on the shelf with the rest.",
};
