/**
 * A relic's card, the same in the pack, at the church and at Ivo's bench: its picture, name (LOUD and the
 * element are in it), SPARES FRIENDS and how faded it is, its uses as pips and a count, then USE and USES
 * rows. The whole card dims a stage with each use (relicStage), and goes grey when dark. Also the pips'
 * colour the RELIC button and the pack slot share.
 */
import { isDark, relicFill, relicMax, relicName, relicStage, type RelicItem } from '../shared/relicitems';
import { relicCol, relicItemIcon } from './relicicons';
import { RELICW, RELIC_LINES } from './relicwords';
import { labelRows } from './card';
import './relics.css';

/** The pips' colour: gold (or its element's) while bright, amber past half, red-brown at the last, grey when dark. */
export const fillCol = (r: RelicItem) => (isDark(r) ? '#4a4852' : relicFill(r) > 0.5 ? relicCol(r) : r.charge > 1 ? '#d9a13a' : '#b0583a');

/** One pip a use: lit for each left, hollow for each spent. */
export function chargePips(r: RelicItem): string {
  const max = relicMax(r), col = fillCol(r);
  return `<span class="rpips">${Array.from({ length: max }, (_, i) => (i < r.charge ? `<i style="background:${col}"></i>` : '<i class="off"></i>')).join('')}</span>`;
}

/** The fading tag: none while full, FADING once used, LAST USE at one, DARK at none. */
const stageTag = (r: RelicItem) => ['', RELICW.fading, RELICW.fading, RELICW.lastUse, RELICW.dark][relicStage(r)];

/** `pick`: a data attribute for a tap (the church's picker), `on`: shown chosen. */
export function relicCard(r: RelicItem, opts: { pick?: string; on?: boolean; tag?: string; brief?: boolean } = {}): string {
  const dark = isDark(r), stage = relicStage(r), tags = [stageTag(r), RELICW.spares, opts.tag ?? ''].filter(Boolean), max = relicMax(r);
  const line = opts.brief ? '' : labelRows([['USE', RELIC_LINES[r.kind] ?? ''], [RELICW.usesRow, dark ? (r.el ? RELICW.darkElLine : RELICW.darkLine) : r.el ? RELICW.noRecharge(max) : RELICW.fades(max)]], 'rline');
  return `<div class="rcard fade${stage}${dark ? ' dark' : ''}${opts.on ? ' on' : ''}"${opts.pick ? ` data-rpick="${opts.pick}"` : ''}>` +
    `<img class="ricon" src="${relicItemIcon(r)}" alt="">` +
    `<div class="rbody"><b style="color:${relicCol(r)}">${relicName(r)}</b>` +
    `<div class="rtags">${tags.map((t) => `<i class="${t === RELICW.spares ? 'safe' : t === RELICW.lastUse ? 'last' : ''}">${t}</i>`).join('')}</div>` +
    `<div class="rchg">${chargePips(r)}<span>${dark ? RELICW.dark : RELICW.uses(r.charge)}</span></div>${line}</div></div>`;
}
