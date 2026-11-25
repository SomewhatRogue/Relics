/**
 * Old Merren's panel (docs/design/element-augments.md; Kyle, 2026-11-24): he puts fire, frost or storm on the weapon in
 * the hero's hand for five jobs. The rules are shared/edges.ts (`edgeCost`, `edgeRefusal`, `putEdge`); this only asks and
 * shows. Opening it ticks off the errand that sent the hero here (shared/errands.ts). His words: merrenwords.ts.
 */
import { coins, coinsHtml } from '../shared/coins';
import type { Item } from '../shared/loot';
import { EDGE, EDGE_ELS, edgeCost, edgeOf, edgeRefusal, putEdge, type EdgeEl } from '../shared/edges';
import { merrenSeen } from '../shared/errands';
import type { Game } from './game';
import { MERRENW } from './merrenwords';
import type { Panel } from './panels';
import { toast } from './partytoast';
import { says } from './shopui';

const NAME = 'OLD MERREN', WHO = 'Merren';
const dim = (s: string) => `<p class="dim">${s}</p>`;

/** What an element costs this hero, as a button label. */
function priceLabel(g: Game, el: EdgeEl): string {
  const c = edgeCost(g.profile, el), mats = Object.entries(c.mats).map(([k, n]) => `${n} ${k.toUpperCase()}`);
  return c.free ? `${MERRENW.el[el]} (${MERRENW.free})` : `${MERRENW.el[el]} (${[coinsHtml(c.gold), ...mats].join(', ')})`;
}

/** Open his panel. `footer` is his old line about the chapel, kept under the buttons, dim. */
export function openMerren(g: Game, panel: Panel, footer = ''): void {
  const pr = g.profile, foot = footer ? dim(footer) : '';
  if (merrenSeen(pr)) g.keep();
  if (pr.cls === 'MAGE') return panel.show(NAME, says(WHO, MERRENW.mage) + foot);
  if (pr.level < EDGE.level) return panel.show(NAME, says(WHO, MERRENW.young) + dim(MERRENW.youngGame) + foot);
  // (A hero still on the weapon they started with holds no item for it: he dresses a plain one, kept in hand once done.)
  const again = () => openMerren(g, panel, footer), it: Item = pr.arms[pr.weapon] ?? { slot: 'weapon', kit: pr.weapon, quality: 'plain', traits: [], mods: [], level: 0 };
  const put = (el: EdgeEl) => {
    const cost = putEdge(pr, it, el);
    if (!cost) return again();
    pr.arms[pr.weapon] ??= it;
    // (Dressed again, so the hero in the street holds it: the street copies the hero's kit back each frame.)
    g.refit();
    if (!cost.free) toast(`${MERRENW.el[el]}: ${[coins(cost.gold), ...Object.entries(cost.mats).map(([k, n]) => `${n} ${k.toUpperCase()}`)].join(', ')}`, { kind: 'quest' });
    panel.show(NAME, says(WHO, MERRENW.done) + foot, [{ label: MERRENW.close, primary: true, act: () => panel.hide() }], true);
  };
  const ask = (el: EdgeEl) => {
    const old = edgeOf(it);
    if (!old || old === el) return put(el);
    panel.show(NAME, says(WHO, MERRENW.replace(old)) + foot, [
      { label: MERRENW.yes, primary: true, act: () => put(el) },
      { label: MERRENW.no, act: () => again() },
    ], true);
  };
  // Short of coin first, then of charcoal (only fire asks for it for now).
  const why = EDGE_ELS.map((el) => edgeRefusal(pr, it, el)), short = why.includes('gold') ? MERRENW.shortCoin : why.includes('mats') ? MERRENW.shortCoal : '';
  panel.show(NAME, says(WHO, MERRENW.greeting) + dim(MERRENW.greetingGame) + (short ? says(WHO, short) : '') + foot,
    EDGE_ELS.map((el) => ({ label: priceLabel(g, el), disabled: !it || !!edgeRefusal(pr, it, el), act: () => ask(el) })));
}
