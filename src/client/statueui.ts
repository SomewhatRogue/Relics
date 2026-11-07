/**
 * Commissioning the statue, at the public works (Foreman Judd's board, worksui.ts): who's on the plinth now
 * and what they paid, and your bid. The first statue is 1000 gold; after that, from 1 to 1000 more than the
 * last, picked with +1, +100 and +1000 or typed. Paying goes through statuebuy.ts.
 */
import { bidRange, giveMore, statuePrice } from '../shared/statue';
import { STATUE_GIVEN } from '../shared/tuning';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';
import { bidBlocked, bidOut, commission } from './statuebuy';
import { statueArt } from './statuedraw';
import { STATUE_WORDS as S } from './statuewords';
import './statue.css';

const p = (s: string) => `<p>${s}</p>`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const QUICK = [1, 100, 1000];
/** The bid picked, and the price it was picked against (a new price starts it over). */
let pick = 0, against = -1;

export function openStatue(g: Game, panel: Panel, back: () => void): void {
  const w = g.world, s = w.statue, price = statuePrice(w), [lo, hi] = bidRange(w), again = () => openStatue(g, panel, back);
  if (against !== price) (pick = lo), (against = price);
  pick = Math.max(lo, Math.min(hi, pick));
  const mine = s?.by.id === g.profile.id, wait = bidOut(g), blocked = bidBlocked(g), more = giveMore(g.profile.stats.given);
  // Not given the town enough yet: what it is and what it costs, and how much more to give; nothing to bid with.
  const judd = more ? S.judd.notYet(more) : !s ? S.judd.empty : mine ? S.judd.yours : S.judd.taken(esc(s.by.name));
  const fig = s ? `<img class="st-fig" alt="" src="${statueArt(s.by)}">` : '<span class="st-fig st-none"></span>';
  const html = p(`<b>Foreman Judd:</b> ${line(`"${judd}"`, 'Foreman Judd')}`) +
    `<div class="st-who">${fig}<div>${p(s ? S.who(esc(s.by.name), s.price) : S.nobody)}${p(s ? S.range(lo, hi) : S.first(lo))}</div></div>` +
    (s && !more && !wait && !blocked ? `<div class="st-quick">${QUICK.map((x) => `<button type="button" data-add="${x}" class="${pick === price + x ? 'on' : ''}">+${x}</button>`).join('')}</div>` +
      `<label class="code st-custom">${S.custom} <input id="st-pay" type="number" inputmode="numeric" min="${lo}" max="${hi}" step="1" value="${pick}"></label>` : '') +
    (more ? p(`<b class="st-short">${S.short(Math.floor(g.profile.stats.given || 0), STATUE_GIVEN)}</b>`) : '') +
    (wait ? p(`<span class="dim">${S.out}</span>`) : blocked ? p(`<span class="dim">${S.blocked}</span>`) : '') +
    p(`<span class="st-gold">${S.gold(g.profile.gold)}</span>`);
  const can = (n: number) => !wait && !blocked && Number.isInteger(n) && n >= lo && n <= hi && g.profile.gold >= n;
  panel.show(S.title, html, [
    // Short of what it takes: the way to give it (back to the works list), in place of paying.
    ...(more ? [{ label: S.giveFirst(more), primary: true, act: back }] : [{ label: S.pay(pick), primary: true, disabled: !can(pick), act: () => can(pick) && commission(g, pick) && again() }]),
    // (Giving first goes back to the works already.)
    ...(more ? [] : [{ label: S.back, act: back }]),
  ]);
  const payBtn = document.querySelector<HTMLButtonElement>('#panel .buttons button.primary');
  for (const b of document.querySelectorAll<HTMLButtonElement>('#panel .st-quick button')) b.onclick = () => ((pick = price + Number(b.dataset.add)), again());
  const input = document.getElementById('st-pay') as HTMLInputElement | null;
  input?.addEventListener('input', () => {
    const n = Number(input.value);
    if (Number.isInteger(n)) pick = n;
    if (payBtn) (payBtn.textContent = S.pay(Number.isInteger(n) ? n : 0)), (payBtn.disabled = !can(n));
    for (const b of document.querySelectorAll<HTMLButtonElement>('#panel .st-quick button')) b.classList.toggle('on', n === price + Number(b.dataset.add));
  });
}
