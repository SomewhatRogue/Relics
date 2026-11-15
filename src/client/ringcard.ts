/**
 * The card that rises when you tap a hero round the fire (docs/design/hero-select.md): the class's name
 * and tag line, its three looks, its ratings, the name box and CHOOSE, and TRY THE class. (A class you
 * have already is greyed by the fire and never picked; no fight preview: Kyle, 2026-11-15, it confused.)
 * Markup only; title.ts handles the buttons.
 */
import type { HeroClass } from '../shared/tuning';
import { CLASSES, CLASS_NAME, CLASS_TAG, STATS } from '../shared/classes';
import { heroPortrait } from './sprites';

export const face = (cls: HeroClass, look = 0) => `<img class="face" alt="" src="${heroPortrait(cls, look).toDataURL()}">`;

export interface CardOpts { cls: HeroClass; look: number; name: string; tryIt: boolean; skipWood: boolean }

export function ringCard(o: CardOpts): string {
  const c = o.cls, s = CLASSES[c];
  const looks = `<div class="looks">${[0, 1, 2].map((i) => `<button data-look="${i}" class="${i === o.look ? 'on' : ''}" aria-label="LOOK ${i + 1}">${face(c, i)}</button>`).join('')}</div>`;
  const bars = `<div class="bars">${STATS.map((k) => `<span>${k}</span><i>${'<em class="on"></em>'.repeat(s.stats[k])}${'<em></em>'.repeat(5 - s.stats[k])}</i>`).join('')}</div>`;
  const choose = `<div class="rname"><label class="name">NAME <input maxlength="12" value="${o.name}" autocomplete="off" spellcheck="false"></label>` +
      `<button data-newname class="ghost">NEW NAME</button></div><p class="nameerr" role="status"></p>` +
      `<button data-begin class="primary wide">CHOOSE</button>`;
  return `<div class="rhead"><h2 class="cname">${CLASS_NAME[c]}</h2><p class="ctag">${CLASS_TAG[c]}</p></div>${looks}${bars}${choose}` +
    (o.tryIt ? `<button data-try class="ghost wide">TRY THE ${CLASS_NAME[c]}</button>` : '') +
    (o.skipWood ? '<button data-skipwood class="ghost wide">SKIP THE WOOD</button>' : '');
}
