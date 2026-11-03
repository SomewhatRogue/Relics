/**
 * Telling you a knack is waiting (Kyle, 2026-11-02: "hard to know that I have a choice"): the count on
 * the PACK button (a pulsing gold dot, tree.css), and once after a job you grew on, a line over your
 * hero back in town. Called each frame from main.ts.
 */
import type { Game } from './game';
import { KNW } from './treewords';

let shown = '';

export function knackCues(game: Game, panelOpen: boolean, packBtn: HTMLElement, say: (x: number, y: number, s: string) => void): void {
  const n = String(game.mode === 'wood' ? 0 : game.profile.picks);
  if (n !== shown || packBtn.dataset.picks !== n) (shown = n), (packBtn.dataset.picks = n);
  if (!game.levelPop || panelOpen || game.result || game.mode !== 'town' || !game.hero) return;
  say(game.hero.x, game.hero.y, KNW.pop(game.levelPop, game.profile.picks));
  game.levelPop = 0;
}
