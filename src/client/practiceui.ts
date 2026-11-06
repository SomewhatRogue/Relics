/**
 * The board by the yard's straw men (shared/practice.ts, sim/practice.ts): Squire Pell has Brisk's watch
 * set going a straw man of any sort the hero has met, a small pack, or a drill; CLEAR puts them all back,
 * GO AGAIN starts the last one over. One line, once, says nothing here pays. All of it in this browser alone.
 */
import { SINGLES, metOf } from '../shared/practice';
import { offers, type Pick } from '../sim/practice';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';
import { PRACTICEW } from './practicewords';

const say = (s: string) => `<p><b>Squire Pell:</b> ${line(`"${s}"`, 'Squire Pell')}</p>`;

export function openPractice(g: Game, panel: Panel): void {
  const o = offers(metOf(g.profile), g.profile.cls), cur = g.drill;
  const row = (k: Pick['k'], key: string, name: string, how = '') =>
    `<button class="jrow" data-pk="${k}:${key}"><span class="jt">${name}</span>${how ? `<span class="jtags">${how}</span>` : ''}</button>`;
  const html = say(PRACTICEW.pell) + `<p class="dim">${PRACTICEW.nothing}</p>` +
    (cur ? `<p><b>${cur.line}</b></p>` : '') +
    `<h3>${PRACTICEW.one}</h3>` + o.singles.map((s) => row('single', s.key, s.name)).join('') +
    (o.packs.length ? `<h3>${PRACTICEW.packs}</h3>` + o.packs.map((q) => row('pack', q.key, q.name)).join('') : '') +
    `<h3>${PRACTICEW.drills}</h3>` + o.drills.map((d) => row('drill', d.key, d.name, d.how)).join('') +
    (o.singles.length < SINGLES.length ? `<p class="dim">${PRACTICEW.more}</p>` : '');
  const go = (pk: string) => {
    const [k, key] = pk.split(':') as [Pick['k'], string];
    if (g.practice({ k, key } as Pick)) panel.hide();
  };
  panel.show(PRACTICEW.title, html, [
    { label: PRACTICEW.again, primary: !!cur, disabled: !cur, act: () => (g.practiceAgain(), panel.hide()) },
    { label: PRACTICEW.clear, disabled: !cur, act: () => (g.clearPractice(), panel.hide()) },
  ]);
  document.querySelectorAll<HTMLElement>('#panel [data-pk]').forEach((b) => b.addEventListener('click', () => go(b.dataset.pk!)));
}
