/**
 * The church step's relic panel (shared/church.ts decides; this shows it): each relic you own as a
 * card with CARRY and RECHARGE (plain ones, for gold). Gone 2026-11-15 (the relics chat, Kyle): TWO FOR
 * ONE (relics are earned, never rolled, docs/design/relics.md) and GIVE IT UP (a relic won stays yours).
 */
import { coinsHtml } from '../shared/coins';
import { canRecharge, recharge, rechargeCost } from '../shared/church';
import type { Game } from './game';
import type { Panel } from './panels';
import { relicCard } from './reliccard';
import { RELICW } from './relicwords';
import { line } from './speech';
import { relicDone } from '../shared/errands';
import { relicMax } from '../shared/relicitems';
import { ERRANDW } from './errandwords';
import { ERRAND_PAY } from '../shared/errandpay';
import { paidToast } from './errandpaid';
import { ROLL_RELICS } from '../shared/relicroll';
import { questOffered, takeQuest } from '../shared/relicquests';
import { RELICS } from '../shared/magic';
import { relicItemIcon } from './relicicons';
import type { RelicItem } from '../shared/relicitems';

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const b = (op: string, id: string, label: string, opts: { go?: boolean; off?: boolean } = {}) =>
  `<button data-rop="${op}" data-rid="${id}" class="${opts.go ? 'go' : ''}"${opts.off ? ' disabled' : ''}>${label}</button>`;

export function openStep(g: Game, panel: Panel, back: () => void, said = ''): void {
  const pr = g.profile, again = (s = '') => openStep(g, panel, back, s);
  // A new hero's first recharge is Isolde's to give (the relic's errand, shared/errands.ts); with nothing
  // to fill (it's full, or there's none), the errand's done all the same.
  const free = !!pr.errands?.told && !pr.errands.relic;
  if (free && !pr.relics.some((r) => canRecharge(r)) && relicDone(pr)) g.keep(), paidToast(ERRAND_PAY.relic);
  const lit = pr.lit ?? 0;
  const head = (said.startsWith('~') ? p(said.slice(1)) : said ? say('Father Odric', said) : say('Father Odric', RELICW.churchIntro)) + (lit ? p(`<b>${RELICW.litLeft(lit)}</b>`) : '') + p(`You have ${coinsHtml(pr.gold)}.`);
  const rows = pr.relics.map((r) => {
    const cost = rechargeCost(r);
    const re = r.el ? '' : free && canRecharge(r) ? b('free', r.id, ERRANDW.free, { go: true }) : b('recharge', r.id, canRecharge(r) ? RELICW.recharge(cost) : RELICW.full, { off: !canRecharge(r) || pr.gold < cost });
    // The reliquary (docs/design/relics.md section 3): where it was won, and CARRY (the one relic for the next job).
    const carried = r.id === pr.relic, from = r.from && RELICW.wonFrom[r.from] ? `<p class="rfrom">${RELICW.wonFrom[r.from]}</p>` : '';
    const carry = carried ? '' : b('carry', r.id, RELICW.carryThis, { go: true });
    return relicCard(r, { tag: carried ? RELICW.carrying : '' }) + from + `<div class="rbtns">${carry}${re}</div>`;
  }).join('');
  // Mother Isolde's relic quest (shared/relicquests.ts): offered now and then; open, a word on where to go.
  const offer = questOffered(pr, g.world.day), open = pr.rq?.open;
  const quest = offer ? say('Father Odric', RELICW.questNudge) + `<div class="rbtns" style="margin-left:0">${b('hear', '', RELICW.questHear, { go: true })}</div>`
    : open ? `<div class="rsec">${RELICW.questTitle}</div>` + p(RELICW.questOpen(RELICS[open].name, RELICW.saidToBe[open] ?? '')) : '';
  panel.show(RELICW.churchTitle, quest + head + (pr.relics.length ? rows : p(RELICW.none)) + stillToWin(pr.relics), [{ label: RELICW.back, act: back }]);
  const root = document.getElementById('panel');
  for (const el of root?.querySelectorAll<HTMLButtonElement>('[data-rop]') ?? []) el.onclick = (e) => {
    e.stopPropagation();
    const id = el.dataset.rid!, op = el.dataset.rop;
    if (op === 'hear') return hearIsolde(g, panel, () => openStep(g, panel, back));
    if (op === 'carry') return g.carry(id), again('~' + RELICW.carryNow);
    if (op === 'recharge') return recharge(pr, id) ? (g.relicsChanged(), again('~' + RELICW.recharged)) : undefined;
    if (op === 'free') {
      const r = pr.relics.find((x) => x.id === id);
      if (!r || !canRecharge(r) || !relicDone(pr)) return;
      r.charge = relicMax(r);
      g.relicsChanged();
      paidToast(ERRAND_PAY.relic);
      return again('~' + ERRANDW.freeDone);
    }
  };
}

/** The relics still to win, dark, each with a word on where it's said to be (docs/design/relics.md section 3). */
function stillToWin(held: readonly RelicItem[]): string {
  const left = ROLL_RELICS.filter((k) => !held.some((r) => r.kind === k));
  if (!left.length) return '';
  return `<div class="rsec">${RELICW.stillTitle}</div>` + left.map((k) =>
    `<div class="rdark"><img src="${relicItemIcon({ kind: k, el: '', charge: 0 })}" alt=""><div><b>${RELICS[k].name}</b><p>${RELICW.saidToBe[k] ?? RELICW.saidChurch}</p></div></div>`).join('');
}

/** Mother Isolde sends you for a relic: where it was last seen and what holds it, and I'LL GO or NOT NOW. */
function hearIsolde(g: Game, panel: Panel, back: () => void): void {
  const kind = questOffered(g.profile, g.world.day);
  if (!kind) return back();
  panel.show('MOTHER ISOLDE', say('Mother Isolde', RELICW.questWord[kind] ?? '') + p(RELICW.questHow), [
    { label: RELICW.questGo, primary: true, act: () => (takeQuest(g.profile, g.world.day), g.keep(), back()) },
    { label: RELICW.questLater, act: back },
  ]);
}
