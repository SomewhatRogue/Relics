/**
 * Old Merren's panel (docs/design/element-augments.md; Kyle, 2026-11-24): he puts fire, frost or storm on the weapon in
 * the hero's hand for five jobs. The rules are shared/edges.ts (`edgeCost`, `edgeRefusal`, `putEdge`); this only asks and
 * shows. Opening it ticks off the errand that sent the hero here (shared/errands.ts). His words: merrenwords.ts.
 */
import { coins, coinsHtml } from '../shared/coins';
import type { Item } from '../shared/loot';
import { EDGE, EDGE_ELS, EDGE_MATS, edgeCost, edgeOf, edgeRefusal, gradeOf, putEdge, type EdgeEl, type Grade } from '../shared/edges';
import type { MatId, Mats } from '../shared/materials';
import { MAT_NAME } from './matwords';
import { merrenSeen } from '../shared/errands';
import type { Game } from './game';
import { MERRENW } from './merrenwords';
import type { Panel } from './panels';
import { toast } from './partytoast';
import { says } from './shopui';

const NAME = 'OLD MERREN', WHO = 'Merren';
const dim = (s: string) => `<p class="dim">${s}</p>`;

const GRADES: Grade[] = [1, 2, 3];
const PRE: Record<Grade, string> = { 1: '', 2: `${MERRENW.strong} `, 3: `${MERRENW.fierce} ` };
const matText = (mats: Mats) => Object.entries(mats).map(([k, n]) => `${n} ${MAT_NAME[k as MatId]}`);

/** What an element at a grade costs this hero, as a button label (names: MERRENW.strong and fierce). */
function priceLabel(g: Game, el: EdgeEl, grade: Grade): string {
  const c = edgeCost(g.profile, el, grade), pre = PRE[grade];
  return c.free ? `${pre}${MERRENW.el[el]} (${MERRENW.free})` : `${pre}${MERRENW.el[el]} (${[coinsHtml(c.gold), ...matText(c.mats)].join(', ')})`;
}

/** Open his panel. `footer` is his old line about the chapel, kept under the buttons, dim. */
export function openMerren(g: Game, panel: Panel, footer = ''): void {
  const pr = g.profile, foot = footer ? dim(footer) : '';
  if (merrenSeen(pr)) g.keep();
  if (pr.cls === 'MAGE') return panel.show(NAME, says(WHO, MERRENW.mage) + foot);
  if (pr.level < EDGE.level) return panel.show(NAME, says(WHO, MERRENW.young) + dim(MERRENW.youngGame) + foot);
  // (A hero still on the weapon they started with holds no item for it: he dresses a plain one, kept in hand once done.)
  const again = () => openMerren(g, panel, footer), it: Item = pr.arms[pr.weapon] ?? { slot: 'weapon', kit: pr.weapon, quality: 'plain', traits: [], mods: [], level: 0 };
  const put = (el: EdgeEl, grade: Grade) => {
    const cost = putEdge(pr, it, el, grade);
    if (!cost) return again();
    pr.arms[pr.weapon] ??= it;
    // (Dressed again, so the hero in the street holds it: the street copies the hero's kit back each frame.)
    g.refit();
    if (!cost.free) toast(`${PRE[grade]}${MERRENW.el[el]}: ${[coins(cost.gold), ...matText(cost.mats)].join(', ')}`, { kind: 'quest' });
    panel.show(NAME, says(WHO, grade === 3 ? MERRENW.fierceDone : MERRENW.done) + foot, [{ label: MERRENW.close, primary: true, act: () => panel.hide() }], true);
  };
  const ask = (el: EdgeEl, grade: Grade) => {
    const old = edgeOf(it);
    // (Renewing the very same element and grade asks nothing.)
    if (!old || (old === el && gradeOf(it) === grade)) return put(el, grade);
    panel.show(NAME, says(WHO, MERRENW.replace(old)) + foot, [
      { label: MERRENW.yes, primary: true, act: () => put(el, grade) },
      { label: MERRENW.no, act: () => again() },
    ], true);
  };
  // The second step: the three grades of one element, each off if the hero lacks its coin or material.
  const grades = (el: EdgeEl) => {
    const why = GRADES.map((n) => edgeRefusal(pr, it, el, n));
    // Coin first (his line), then his charcoal line for plain fire, else the plain game line for the first material missing.
    const miss = GRADES.find((n, i) => why[i] === 'mats'), mat = miss ? EDGE_MATS[el][miss] : undefined;
    const short = why.includes('gold') ? MERRENW.shortCoin : mat === 'charcoal' ? MERRENW.shortCoal : mat ? MERRENW.need(MAT_NAME[mat]) : '';
    panel.show(NAME, says(WHO, MERRENW.greeting) + dim(MERRENW.greetingGame) + (short ? says(WHO, short) : '') + foot, [
      ...GRADES.map((n, i) => ({ label: priceLabel(g, el, n), disabled: !!why[i], act: () => ask(el, n) })),
      { label: MERRENW.back, act: () => again() },
    ]);
  };
  panel.show(NAME, says(WHO, MERRENW.greeting) + dim(MERRENW.greetingGame) + foot,
    EDGE_ELS.map((el) => ({ label: MERRENW.el[el], disabled: !it, act: () => grades(el) })));
}
