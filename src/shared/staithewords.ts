/**
 * Every word the Staithe puts on screen (Kyle approved the biomes proposal, 2026-11-05). New names and
 * lines for the lore keeper, then the line editor (CLAUDE.md): the Staithe, the eel-catchers' calls, the
 * goal lines, the recap's. Kyle's style (docs/lore/prose-notes.md): plain, said the way someone would say it.
 */
import { STAITHE } from './staithetune.js';

export const STAITHE_WORDS = {
  /** The banner while the log's being laid, once it's across, and the folk netted on the bank. */
  log: "The hungry are laying a log across to the jetty. Kill the carriers, or shove the log in the river once it's across",
  laid: "The log's across. GRAB at its end to shove it in the river before they take everyone on the jetty",
  netted: (n: number) => `${n} netted on the bank: GRAB by them to cut them free`,
  /** The hold: stand in the ring at the jetty, how long is left; away from it. */
  ring: 'Stand in the ring by the jetty so the punt can take them over',
  hold: (s: number) => `Hold the ring by the jetty while the punt takes them over: ${s} s`,
  /** Done with: who was brought over, and who wasn't. */
  over: (saved: number, lost: number) => (lost ? `The punt's done. ${saved} got over, ${lost} lost` : `The punt's done. ${saved} got over`),
  /** The smokehouse alight with someone still in it. */
  smoke: "Someone's shut in the burning smokehouse. Stand still at its door to pull them out",
  /** GRAB's word by the laid log's end (by one of the netted it's CUT FREE, as for a friend in a net). */
  shove: 'SHOVE',
  /** Said over the place as it happens. */
  says: {
    across: "The log's across!",
    shoved: 'IN THE RIVER',
    snagged: 'HOOKED',
    thrown: 'THE BOARDS GAVE',
    trip: 'PUNT ACROSS',
    lost: 'TAKEN',
    pinned: 'FROZEN',
  },
  /** The recap's LOST row. */
  lost: (n: number) => `${n} taken from the jetty`,
};

/** What the eel-catchers call out (from the jetty, the nets and the smokehouse). */
export const EELFOLK_CALLS = {
  jetty: ['Pull the boards up, pull them up!', "Don't let them over!", 'Get back from the edge, Maud!', 'Where are the punts?'],
  netted: ["I can't get my arms free!", "Cut it, it's round my neck!", 'Get a knife to it, please!'],
  smoke: ["It's barred from outside!", "I can't see, I can't breathe!", 'Get the door, somebody, the door!', "The racks have caught, it's on my arm!"],
  punt: ['Come on, in you get', 'Mind your feet, sit down', "That's the last of them, push off"],
};

/** NETS's way word and tell are in shared/ways.ts; its pay (for the record). */
export const NETS_PAY = STAITHE.perSaved;
