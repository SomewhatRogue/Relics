/**
 * The Deep's boards on screen (shared/deepboard.ts): the deepest floor each hero has reached, the gold they
 * brought up as the tiebreak, alone and with a party apart. Shown on BEST IN WICKHOLD (bestui.ts) and at the
 * sewer grate beside the way down (squareui.ts), as the board of bests shows its others.
 */
import type { DeepLine } from '../shared/deepboard';
import type { RangeLine } from '../shared/rangeboard';
import type { WorldState } from '../shared/story';
import { block } from './bestui';
import { DEEP_WORDS } from './deepwords';

const line = (l: RangeLine) => DEEP_WORDS.boardLine(l.n, (l as DeepLine).gold);
/** Your own best on a board, if you're on it. */
const mine = (b: DeepLine[] | undefined, me: string) => {
  const l = b?.find((x) => x.id === me);
  return l ? DEEP_WORDS.yourBest(l.n, l.gold) : '';
};

export function deepBlocks(w: WorldState, me: string): string {
  return block(DEEP_WORDS.boardSolo, w.deepSolo, me, mine(w.deepSolo, me), line) + block(DEEP_WORDS.boardParty, w.deepParty, me, mine(w.deepParty, me), line);
}
