/**
 * Coin bets at the Drowned Rat's arm-wrestling table and knife board, the way Dicer Moll takes them
 * (client/game.ts `dice`): 10, 25 or 50 gold, never more than you have, even money (win and you're up
 * your bet, lose and you're down it). A bout takes longer than a throw of the bones, so the stake goes on
 * the table as the bout starts (`takeStake`, saved then) and comes back doubled only if you win
 * (`settleStake`, once, and only for the bout it was put down on). A refresh mid-bout can't roll it
 * again: the stake is gone and nothing pays; a stake left lying from a bout that never finished is lost
 * when the next one goes down. One stake at a time, so the same gold can't be paid out twice.
 */

/** The bets on offer (the dice's own). */
export const BETS = [10, 25, 50] as const;

export type StakeGame = 'arm' | 'knives';
/** Gold on the table: which game, which of the hero's bouts or rounds (its seed), how much. */
export interface Stake { game: StakeGame; n: number; bet: number }
interface Purse { gold: number; stake?: Stake }

/** Can this much go on the table (one of the bets, no more than `cap`, no more than you have)? */
export function stakeOk(p: Purse, bet: number, cap: number = BETS[BETS.length - 1]): boolean {
  return (BETS as readonly number[]).includes(bet) && bet <= cap && p.gold >= bet;
}

/** Put a bet down for bout `n` of `game`: the gold leaves your purse now. False (nothing taken) if it can't. */
export function takeStake(p: Purse, game: StakeGame, n: number, bet: number, cap?: number): boolean {
  if (!stakeOk(p, bet, cap)) return false;
  // (Any stake still down is from a bout that never finished: it's lost, not handed back.)
  p.gold -= bet;
  p.stake = { game, n, bet };
  return true;
}

/** The bout's over: twice the bet back if you won, nothing if you lost. Once only: returns what was paid. */
export function settleStake(p: Purse, game: StakeGame, n: number, won: boolean): number {
  const s = p.stake;
  if (!s || s.game !== game || s.n !== n) return 0;
  delete p.stake;
  const pay = won ? s.bet * 2 : 0;
  p.gold += pay;
  return pay;
}
