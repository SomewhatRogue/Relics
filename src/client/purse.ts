/**
 * Coins heard whenever gold changes hands off a job (Kyle): every stall and shop, Tobin's pawn stall, the
 * vault when gold moves, the church's recharge, the job's pay counted out. It listens to the purse, not
 * to each counter, so nothing that moves gold is missed. (Halvard's anvil rings from his own buttons.)
 */
import { sfxTown } from './sfxtown';
import type { Game } from './game';

export class Purse {
  private who = '';
  private gold = -1;

  update(game: Game): void {
    const pr = game.profile;
    // Another hero, or the first look: nothing was bought.
    if (pr.id !== this.who) return void ((this.who = pr.id), (this.gold = pr.gold));
    if (pr.gold !== this.gold && game.mode !== 'run') sfxTown.coins();
    this.gold = pr.gold;
  }
}
