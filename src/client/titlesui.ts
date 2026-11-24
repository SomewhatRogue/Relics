/** The TITLES panel (shared/titles.ts): a road's four at Father Odric's (the church's) or Dorcas's (the Keeping Room's). */
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { says } from './shopui';
import { coinsHtml } from '../shared/coins';
import { STEPS, TITLES, deedsOn, earned, own, owns, roadTitles, shownTitle, titlePrice, titled, wear, type Road } from '../shared/titles';
import { TITLEW } from './titlewords';

const dim = (s: string) => `<p class="dim">${s}</p>`;

export function openTitles(g: Game, panel: Panel, road: Road, back: () => void): void {
  const p = g.profile, again = () => openTitles(g, panel, road, back), worn = p.titles?.worn;
  const now = shownTitle(p);
  const body = says(road === 'church' ? 'Father Odric' : 'Dorcas', road === 'church' ? TITLEW.odric : TITLEW.dorcas) +
    dim(TITLEW.deeds(road === 'church', deedsOn(p, road))) + dim(now ? TITLEW.wornAs(titled(p.name, now)) : TITLEW.noneWorn) +
    dim(TITLEW.rule(road === 'church')) + (road === 'church' ? dim(TITLEW.churchPay) : '');
  const buttons: Button[] = roadTitles(road).map((t) => {
    const T = TITLES[t], price = titlePrice(p, t);
    if (owns(p, t)) return worn === t
      ? { label: TITLEW.off(T.word), act: () => (wear(p, undefined), g.keep(), again()) }
      : { label: TITLEW.wear(T.word), act: () => (wear(p, t), g.keep(), again()) };
    if (!earned(p, t)) return { label: TITLEW.needs(T.word, STEPS.deeds[T.step]), disabled: true, act: again };
    return { label: TITLEW.buy(T.word, coinsHtml(price)), disabled: p.gold < price, act: () => {
      // The church's: a gift at the Lantern (it counts as a deed too). Dorcas's: coin.
      const paid = road === 'church' ? g.donate(price) : p.gold >= price && ((p.gold -= price), true);
      if (paid && own(p, t)) wear(p, t);
      g.keep();
      again();
    } };
  });
  panel.show(TITLEW.head, body, [...buttons, { label: 'BACK', act: back }]);
}
