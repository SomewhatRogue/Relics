/** The LIT badge on the HUD: a hover or a tap says plainly what the church's light does and for how long. */
import { RELICW } from './relicwords';
import { toast } from './partytoast';

export function hookLitBadge(jobsLeft: () => number): void {
  const el = document.querySelector<HTMLElement>('.litbadge');
  if (!el) return;
  const line = () => RELICW.litNow(Math.max(1, jobsLeft()));
  el.addEventListener('pointerenter', () => (el.title = line()));
  el.addEventListener('click', (e) => (e.stopPropagation(), toast(line())));
}
