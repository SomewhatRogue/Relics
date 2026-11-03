/**
 * A relic's card, the same in the pack, at the church and at Ivo's bench: its picture, name, a LOUD or
 * element tag, SPARES FRIENDS, the charge as a bar and a count, and what it does. Also the small charge
 * bar the RELIC button carries.
 */
import { isDark, relicFill, relicMax, relicName, type RelicItem } from '../shared/relicitems';
import { relicCol, relicItemIcon } from './relicicons';
import { RELICW, RELIC_LINES } from './relicwords';
import './relics.css';

/** The bar: gold while bright, amber past half, red-brown near the end, grey when dark. */
export const fillCol = (r: RelicItem) => (isDark(r) ? '#4a4852' : relicFill(r) > 0.5 ? relicCol(r) : relicFill(r) > 0.2 ? '#d9a13a' : '#b0583a');

export function chargeBar(r: RelicItem): string {
  return `<span class="rbar"><i style="width:${Math.round(relicFill(r) * 100)}%;background:${fillCol(r)}"></i></span>`;
}

/** `pick`: a data attribute for a tap (the church's picker), `on`: shown chosen. */
export function relicCard(r: RelicItem, opts: { pick?: string; on?: boolean; tag?: string; brief?: boolean } = {}): string {
  const dark = isDark(r), tags = [r.tier === 3 ? RELICW.loud : '', dark ? RELICW.dark : '', RELICW.spares, opts.tag ?? ''].filter(Boolean);
  const line = opts.brief ? '' : `<div class="rline">${RELIC_LINES[r.kind] ?? ''} ${dark ? (r.el ? RELICW.darkElLine : RELICW.darkLine) : r.el ? RELICW.noRecharge : RELICW.fades}</div>`;
  return `<div class="rcard${dark ? ' dark' : ''}${opts.on ? ' on' : ''}"${opts.pick ? ` data-rpick="${opts.pick}"` : ''}>` +
    `<img class="ricon" src="${relicItemIcon(r)}" alt="">` +
    `<div class="rbody"><b style="color:${relicCol(r)}">${relicName(r)}</b>` +
    `<div class="rtags">${tags.map((t) => `<i class="${t === RELICW.spares ? 'safe' : ''}">${t}</i>`).join('')}</div>` +
    `<div class="rchg">${chargeBar(r)}<span>${RELICW.charge(r.charge, relicMax(r))}</span></div>${line}</div></div>`;
}
