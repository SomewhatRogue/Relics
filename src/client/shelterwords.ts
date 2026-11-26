import { FENW } from './fenroamwords';
import { HIGHW } from './highwoodwords';

/** The keeper at a way station's fire (client/shelterui.ts). */
export const SHELTERW = {
  /** What each keeper says, by the station's name (the barn's is the fallback). */
  lines: {
    'THE FIELD BARN': 'Sit by the fire a while, if you like. Anything off the shelf *costs*, mind, same as in town.',
    'THE CHARCOAL HUT': "Stand upwind of the clamp, unless you want your eyes running the whole time. Anything off me is town price, and I'm not one for haggling.",
    'THE EEL STAITHE': FENW.keeper,
    "THE WOODWARD'S LODGE": HIGHW.keeper,
  } as Record<string, string>,
  /** Who says it, where the keeper has a name (else Keeper). */
  who: { "THE WOODWARD'S LODGE": HIGHW.who } as Record<string, string>,
  home: 'HOME TO WICKHOLD',
  /** A sack of charcoal, at the Charcoal Hut only: the price comes after, as a coin string. */
  coal: 'BUY CHARCOAL',
  /** The road to another found shelter, from a keeper; and out to one from the North Gate. */
  to: (name: string) => 'TO ' + name,
  outTo: (name: string) => 'OUT TO ' + name,
};
/** The keeper's line at a station. */
export const lineAt = (name: string): string => SHELTERW.lines[name] ?? SHELTERW.lines['THE FIELD BARN'];
/** Who the keeper at a station is. */
export const keeperAt = (name: string): string => SHELTERW.who[name] ?? 'Keeper';
