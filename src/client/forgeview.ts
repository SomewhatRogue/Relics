/**
 * Halvard's forge drawn (Kyle, 2026-11-06: "It's not really clear what forge upgrades give you"): the
 * piece's plus as five pips, its own numbers NOW and AFTER the next plus side by side (the training
 * screen's pattern, upgradeview.ts and upgrades.css), the changed ones lit, and the price. The numbers come
 * from shared/plusrows.ts, worked out by gearStats, so they are what the room fights with. HTML only.
 */
import { PLUS, PLUS_CAP, plusCost, plusOf, slotOf, type HeroClass, type Item } from '../shared/tuning';
import { plusRows, plusStep, type PlusRow } from '../shared/plusrows';
import { barWords } from '../shared/barword';
import { FORGE } from './storewords';
import { CARDW } from './shopwords';
import { UPW } from './upgradewords';
import './upgrades.css';
import './forge.css';
import { shown } from '../shared/shown';

/** +3 as three of five pips lit. */
export const plusPips = (lv: number) =>
  `<span class="fp-pips" aria-label="+${lv} of ${PLUS_CAP}">${Array.from({ length: PLUS_CAP }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</span>`;

/** A row's value as shown: "10.5", "74%", "+6.6%", "+0.04 s". */
export function plusFmt(r: PlusRow): string {
  const r1 = (x: number) => Math.round(x * 10) / 10;
  if (r.id === 'hit' || r.id === 'charge') return String(r1(r.v));
  if (r.id === 'taken') return Math.round(r.v * 100) + '%';
  if (r.id === 'health') return '+' + shown(r.v);
  const sign = r.v > 0 ? '+' : '';
  return r.unit === '%' ? sign + r1(r.v * 100) + '%' : r.unit === 's' ? sign + Math.round(r.v * 100) / 100 + ' s' : sign + r1(r.v);
}

/** What the piece's plus adds, in words, for its card: "30% more damage, and each modifier on it is 30% stronger". */
export function plusLine(it: Item): string {
  const lv = plusOf(it), s = slotOf(it), pct = (x: number) => Math.round(lv * x * 100);
  const main = s === 'weapon' ? FORGE.damage(pct(PLUS.damage)) : s === 'armor' ? FORGE.tough(pct(PLUS.tough)) : FORGE.health(shown(lv * PLUS.health));
  const others = (it.mods ?? []).some((m) => m.id !== (s === 'weapon' ? 'damage' : s === 'armor' ? 'tough' : 'health'));
  return FORGE.adds(main, others ? pct(PLUS.mods) : 0);
}

const box = (rows: PlusRow[], cls: HeroClass | undefined, lit: (i: number) => boolean) =>
  `<dl class="fp-rows">${rows.map((r, i) => `<div class="${lit(i) ? 'up' : ''}"><dt>${barWords(r.label, cls)}</dt><dd>${plusFmt(r)}</dd></div>`).join('')}</dl>`;

/**
 * The forge's card body for a worn piece: its plus and pips, then NOW and AFTER (or its numbers alone at
 * +5), then the price and what striking does. Any temper is counted in the rows (gear.ts levelOf).
 */
export function forgeBody(it: Item, cls?: HeroClass): string {
  const lv = plusOf(it), step = plusStep(it), cost = plusCost(it);
  const head = `<div class="fp-head"><b>${CARDW.plus(lv)}</b>${plusPips(lv)}</div>`;
  if (!step || !cost) return head + `<div class="up-na fp"><div>${box(plusRows(it), cls, () => false)}</div></div><p class="dim">${FORGE.top}</p>`;
  const changed = (i: number) => plusFmt(step.now[i]) !== plusFmt(step.after[i]);
  return head + `<div class="up-na fp"><div><span>${UPW.now} +${lv}</span>${box(step.now, cls, () => false)}</div>` +
    `<i class="up-arrow"></i><div class="after"><span>${UPW.after} +${lv + 1}</span>${box(step.after, cls, changed)}</div></div>` +
    `<p class="fp-price">${FORGE.price(lv + 1, cost.gold, cost.steel)}</p><p class="dim">${FORGE.offer}</p>`;
}
