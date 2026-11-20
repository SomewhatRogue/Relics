/**
 * The crossroads in town (shared/crossroads.ts): on a return with a ripe vowed piece, before anything else, the
 * choice opens by itself and can't be closed without one. One ripe piece at a time (client/main.ts asks each frame).
 */
import type { Game } from './game';
import type { Panel } from './panels';
import { firstRipe } from '../shared/crossroads';
import { VOWED, vowedOf } from '../shared/vowed';
import { itemName, type Item } from '../shared/tuning';
import { RIPEW } from './ripewords';
import { VOWEDW } from './vowedwords';
import { says } from './shopui';

const dim = (s: string) => `<p class="dim">${s}</p>`;
const nameOf = (it: Item) => { const id = vowedOf(it); return id ? VOWED[id].name : itemName(it); };

/** Open the crossroads for the hero's first ripe piece. True if one was opened. */
export function openCrossroads(game: Game, panel: Panel): boolean {
  const it = firstRipe(game.profile);
  if (!it) return false;
  const name = nameOf(it), done = () => panel.hide();
  panel.show(name, dim(RIPEW.ripe(name)) + dim(`${RIPEW.give}: ${RIPEW.giveLine}`) + dim(`${RIPEW.fall}: ${RIPEW.fallLine}`), [
    { label: RIPEW.give, primary: true, act: () => {
      const r = game.crossroads(it, true);
      panel.show('FATHER ODRIC', says('Father Odric', RIPEW.thanks) + (r.step >= 0 ? says('Father Odric', VOWEDW.steps[r.step]) : ''), [{ label: 'BACK', primary: true, act: done }], true);
    } },
    { label: RIPEW.fall, act: () => {
      game.crossroads(it, false);
      panel.show(name, dim(RIPEW.fell(name)), [{ label: 'BACK', primary: true, act: done }], true);
    } },
  ], true);
  return true;
}
