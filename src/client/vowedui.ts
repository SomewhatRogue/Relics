/** After a hungry piece is left on the step (client/game.ts giveUp): Odric hands back a vowed piece, or says why not. */
import { itemName } from '../shared/tuning';
import type { Button, Panel } from './panels';
import { says } from './shopui';
import { VOWEDW, spoken } from './vowedwords';
import { VOWED, vowedOf } from '../shared/vowed';
import type { Item } from '../shared/tuning';

const dim = (s: string) => `<p class="dim">${s}</p>`;

/** A vowed piece's own name (the Gear chat's itemName learns it when asked). */
const nameOf = (it: Item) => { const id = vowedOf(it); return id ? VOWED[id].name : itemName(it); };

export function givenUp(panel: Panel, r: { vowed: Item | null; step: number }, back: () => void): void {
  const lines = (r.vowed ? says('Father Odric', VOWEDW.handed(spoken(nameOf(r.vowed)))) : dim(VOWEDW.notClean)) +
    (r.step >= 0 ? says('Father Odric', VOWEDW.steps[r.step]) : '');
  const buttons: Button[] = [{ label: 'BACK', primary: true, act: back }];
  panel.show('FATHER ODRIC', lines, buttons);
}
