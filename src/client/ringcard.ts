/**
 * The card that rises when you tap a hero round the fire (docs/design/hero-select.md): the class's name
 * and tag line, its three looks, its ratings, the name box and CHOOSE; WATCH IT FIGHT opens the old
 * class page's fight (preview.ts) and the rest of its sheet. A class you have already shows YOURS in
 * place of the name box. Markup only; title.ts handles the buttons.
 */
import { CLASS_KITS, type HeroClass } from '../shared/tuning';
import { CLASSES, CLASS_NAME, CLASS_TAG, SKILL_NOTE, STATS } from '../shared/classes';
import { areas } from './guardarea';
import { heroPortrait } from './sprites';
import { HOMEW } from './homewords';

export const face = (cls: HeroClass, look = 0) => `<img class="face" alt="" src="${heroPortrait(cls, look).toDataURL()}">`;

export interface CardOpts { cls: HeroClass; look: number; watching: boolean; yours: boolean; name: string; tryIt: boolean; skipWood: boolean }

export function ringCard(o: CardOpts): string {
  const c = o.cls, s = CLASSES[c];
  const row = (label: string, text: string) => `<div class="crow"><b>${label}</b><span>${text}</span></div>`;
  const looks = `<div class="looks">${[0, 1, 2].map((i) => `<button data-look="${i}" class="${i === o.look ? 'on' : ''}" aria-label="LOOK ${i + 1}">${face(c, i)}</button>`).join('')}</div>`;
  const bars = `<div class="bars">${STATS.map((k) => `<span>${k}</span><i>${'<em class="on"></em>'.repeat(s.stats[k])}${'<em></em>'.repeat(5 - s.stats[k])}</i>`).join('')}</div>`;
  const watch = o.watching
    ? `<div class="stage"></div><p class="cline">${s.line}</p><div class="csheet">${areas(CLASS_KITS[c][0])}<p class="cguard">${s.guard}</p>` +
      (s.perk ? row(s.perkLabel ?? '', s.perk) : '') + (s.note ? row(s.noteLabel ?? '', s.note) : '') +
      (s.sign ? row(s.signLabel ?? '', s.sign) : '') + row('SKILL', s.skill) + `<p class="cnote">${SKILL_NOTE}</p></div>`
    : '';
  const choose = o.yours
    ? `<p class="dim ryours">${HOMEW.have}</p>`
    : `<div class="rname"><label class="name">NAME <input maxlength="12" value="${o.name}" autocomplete="off" spellcheck="false"></label>` +
      `<button data-newname class="ghost">NEW NAME</button></div><p class="nameerr" role="status"></p>` +
      `<button data-begin class="primary wide">CHOOSE</button>`;
  return `<div class="rhead"><h2 class="cname">${CLASS_NAME[c]}</h2><p class="ctag">${CLASS_TAG[c]}</p></div>${looks}${bars}${choose}` +
    `<div class="rmore"><button data-watch class="ghost${o.watching ? ' on' : ''}">WATCH IT FIGHT</button>` +
    `${o.tryIt ? `<button data-try class="ghost">TRY THE ${CLASS_NAME[c]}</button>` : ''}</div>${watch}` +
    (o.skipWood && !o.yours ? '<button data-skipwood class="ghost wide">SKIP THE WOOD</button>' : '');
}
