/**
 * The Deep's words (docs/design/the-deep.md): the way down at the sewer grate and who keeps it, the
 * checkpoint at each floor's end, leaving early, and the recap. Lore keeper and line editor 2026-11-11: Cobb keeps the ladder.
 */
import { shown } from '../shared/shown';
import { BLESSINGS, CURSES } from '../shared/deepmarks';
export const DEEP_WORDS = {
  /** Who sits at the way down (the lore keeper's call). */
  keeper: 'Cobb',
  title: 'THE WAY DOWN',
  /** What you see, before anyone speaks. */
  scene: 'Past the last of the sewer jobs a ladder goes down a shaft nobody in Wickhold dug, and Cobb the gravedigger sits on a crate at the top of it with a lamp and a slate.',
  /** The keeper tells you plainly what you risk. */
  speech: "Going down, are you. I say this to everyone and about half of them hear it, so I'll say it slow. What you carry past me is yours whatever happens, and you'll have it back. What you find down there *isn't* yours until you've carried it up this ladder, and if you die first, the gear and the gold stay down with you. I put your name on the slate while you're gone, and I rub it out when you come up.",
  /** The game's own voice: the rule. */
  rules: 'THE DEEP: one floor at a time, each worse than the last. What you bring down is always yours. Gear and gold found below are lost if you die. Leave at the end of any floor and you keep it all.',
  go: 'GO DOWN',
  /** A floor's job title (the HUD and the recap). */
  floor: (n: number) => `The Deep, floor ${n}`,
  checkTitle: (n: number) => `END OF FLOOR ${n}`,
  checkScene: 'Another ladder goes on down, the same grey rungs as the first, and the way up is behind you.',
  haul: (items: number, gold: number) => `Found below so far: ${items ? `${items} ${items === 1 ? 'piece' : 'pieces'} of gear` : 'no gear'} and ${gold} gold.`,
  checkRules: 'LEAVE: go up and keep everything you found. GO DEEPER: the next floor is worse, and if you die there you lose everything found below.',
  /** Over my hero, GO DEEPER chosen in a party: the rest haven't yet. */
  waiting: 'Waiting for the rest of the party to choose GO DEEPER.',
  /** At the grate, in a party I don't lead. */
  partyLead: 'Only your leader can go down, and the whole party goes with them.',
  /** The fork every fifth floor and the blessing every tenth (shared/deepmarks.ts). Lore keeper and line editor 2026-11-11. */
  forkScene: 'The ladder comes down onto a ledge with three ways on, and each one costs you something.',
  blessScene: 'Three things lie on the ledge, and you can take one.',
  marksRule: 'Curses and blessings stack, and last until you leave the Deep.',
  curses: {
    dull: { name: 'THE RUSTED WAY', does: '6% less damage.' },
    heavy: { name: 'THE WET WAY', does: 'You move 6% slower.' },
    frail: { name: 'THE COLD WAY', does: `${shown(-CURSES.frail.v)} less health.` },
    winded: { name: 'THE LOW WAY', does: 'Stamina comes back 12% slower.' },
    dim: { name: 'THE DARK WAY', does: 'Relics recharge 12% slower.' },
    seen: { name: 'THE LOUD WAY', does: 'Goblins notice you from further off.' },
  } as Record<string, { name: string; does: string }>,
  blessings: {
    keen: { name: 'A WHETSTONE', does: '8% more damage.' },
    hale: { name: 'A PADDED COAT', does: `${shown(BLESSINGS.hale.v)} more health.` },
    wind: { name: 'A WATERSKIN', does: 'Stamina comes back 15% faster.' },
    devout: { name: 'AN OILED RAG', does: 'Recharge 15% faster.' },
    relic: { name: "SOMEONE'S PACK", does: 'Your relic gets a use back at the start of every floor.' },
  } as Record<string, { name: string; does: string }>,
  marksOn: (list: string) => `On you for the rest of the Deep: ${list}.`,
  leave: 'LEAVE',
  deeper: 'GO DEEPER',
  /** The in-run LEAVE button, in the Deep. */
  leaveWarn: "Climb back up now? You keep what you had at the last floor's end. Anything found on this floor stays below.",
  outTitle: 'OUT OF THE DEEP',
  lostTitle: 'LOST IN THE DEEP',
  out: (n: number) => `You came up from floor ${n}. Everything you found below is yours now.`,
  outEarly: (n: number) => (n ? `You climbed out after floor ${n}. What you had at its end is yours.` : 'You climbed out before the first floor was done. Nothing from below came with you.'),
  lost: (n: number) => `You fell on floor ${n}. What you took down is yours again.`,
  /** The recap's row of what stayed below. */
  keptBelow: 'LEFT BELOW',
  /** The boards (shared/deepboard.ts): at the grate and on BEST IN WICKHOLD. */
  boardSolo: 'DEEPEST, ALONE',
  boardParty: 'DEEPEST, WITH A PARTY',
  boardLine: (floor: number, gold: number) => `floor ${floor}, ${gold} gold`,
  yourBest: (floor: number, gold: number) => `Your deepest: floor ${floor}, with ${gold} gold.`,
};
