/**
 * The upgrade screens drawn (upgrades.ts has what's on them): the head (level, experience, gold, knack
 * picks) and the tabs, held at the top while the rest scrolls; each track with its steps joined by a
 * line, gold where you've come; a fork as tiles side by side under the words that say you choose one;
 * each tile its picture, name, one line, ranks as pips and its cost or state; and a tile opened in full.
 * HTML strings only, phone first: every tile and tab is a button at least 44 px tall.
 */
import { LEVEL_CAP, xpFor, type Profile } from '../shared/progress';
import type { Pip } from '../shared/trainrows';
import { labelRows } from './card';
import type { TabId, UpDetail, UpStep, UpTab, UpTile, UpTrack } from './upgrades';
import { upIcon } from './upicons';
import { UPW } from './upgradewords';
import './upgrades.css';

const pips = (ps?: Pip[]) => (ps ? `<span class="tr-pips">${ps.map((x) => `<i class="${x}"></i>`).join('')}</span>` : '');
const lit = (t: UpTile) => t.state === 'owned' || t.state === 'max' || !!t.current;

/** Level, a bar to the next, gold and knack picks, then the tabs with a count of what's ready in each. */
export function upHead(p: Profile, tabs: UpTab[], on: TabId): string {
  const top = p.level >= LEVEL_CAP, from = xpFor(p.level), to = xpFor(p.level + 1);
  const fill = top ? 100 : Math.max(0, Math.min(100, Math.round(((p.xp - from) / (to - from)) * 100)));
  return `<div class="up-top"><div class="up-stats"><b>LEVEL ${p.level}</b><em class="up-gold">${UPW.gold(p.gold)}</em>` +
    `<button class="up-picks${p.picks ? ' on' : ''}" data-tab="knacks">${p.picks ? UPW.picks(p.picks) : UPW.noPicks}</button></div>` +
    `<div class="tr-bar"><i style="width:${fill}%"></i></div><div class="tr-xp">${top ? 'FULL' : `${p.xp} / ${to} XP`}</div>` +
    `<div class="up-tabs" role="tablist">${tabs.map((t) => `<button role="tab" data-tab="${t.id}" class="${t.id === on ? 'on' : ''}" aria-selected="${t.id === on}">${t.title}${t.ready ? `<em>${t.ready}</em>` : ''}</button>`).join('')}</div></div>`;
}

/** One tile. */
export function upTile(t: UpTile): string {
  return `<button class="up-tile s-${t.state}${t.current ? ' cur' : ''}" data-tile="${t.key}">` +
    `<img class="up-ic" src="${upIcon(t.icon)}" alt=""><span class="up-n">${t.name}</span><span class="up-l">${t.line}</span>` +
    `<span class="up-f">${pips(t.pips)}<em class="up-b">${t.badge}</em></span></button>`;
}

/** A step: one tile, a grid's tiles side by side (each its own buy), or a fork (the words over it,
 *  none when the track's title already says choose; the tiles side by side under a bracket). */
function upStep(s: UpStep, kind: UpTrack['kind']): string {
  if (s.tiles.length < 2 || kind === 'grid') return s.tiles.map(upTile).join('');
  const words = s.fork ?? UPW.chooseOne;
  return `<div class="up-fork n${s.tiles.length}">${words ? `<i class="up-fl">${words}</i>` : ''}<div class="up-ft">${s.tiles.map(upTile).join('')}</div></div>`;
}

/** A track: its title and where you stand, then its steps joined (gold once the step before is yours). */
export function upTrack(k: UpTrack): string {
  const steps = k.steps.map((s, i) => (i && k.kind !== 'grid' ? `<i class="up-link${k.steps[i - 1].tiles.some(lit) ? ' on' : ''}"></i>` : '') + upStep(s, k.kind)).join('');
  return `<section class="up-track k-${k.kind}" data-track="${k.id}"><div class="up-th"><b>${k.title}</b><span>${k.sum}</span></div>` +
    `<div class="up-steps">${steps}</div>${k.note ? `<p class="up-note">${k.note}</p>` : ''}</section>`;
}

export const upTabBody = (t: UpTab) => t.tracks.map(upTrack).join('');

/** A tile opened: its picture and state, the whole effect, now and after, every rank, and a note. */
export function upDetail(d: UpDetail): string {
  const t = d.tile;
  const na = d.now || d.after ? `<div class="up-na">${d.now ? `<div><span>${UPW.now}</span><b>${d.now}</b></div>` : ''}` +
    (d.after ? `${d.now ? '<i class="up-arrow"></i>' : ''}<div class="after"><span>${UPW.after}</span><b>${d.after}</b></div>` : '') + '</div>' : '';
  const ladder = d.ladder ? `<h3 class="tr-h">${UPW.ranks}</h3><ol class="tr-ladder">${d.ladder.map((u, i) => {
    const next = !u.have && (i === 0 || d.ladder![i - 1].have);
    return `<li class="${u.have ? 'have' : next ? 'next' : ''}"><i></i><b>${u.gain}</b><small>LEVEL ${u.level}</small><em>${u.have ? '' : `${u.price}g`}</em></li>`;
  }).join('')}</ol>` : '';
  return `<div class="up-det s-${t.state}${t.current ? ' cur' : ''}"><div class="up-dh"><img class="up-ic" src="${upIcon(t.icon)}" alt="">` +
    `<div><b>${t.name}</b><span class="up-f">${pips(t.pips)}<em class="up-b">${t.badge}</em></span></div></div>` +
    `<p class="up-dt">${d.text}</p>${d.rows?.length ? labelRows(d.rows) : ''}${na}${ladder}${d.note ? `<p class="up-note">${d.note}</p>` : ''}</div>`;
}
