/**
 * The church step's relic panel (shared/church.ts decides; this shows it): each relic you own as a
 * card with RECHARGE (plain ones, for gold) and GIVE IT UP (gone for good, worth the church's light for
 * your next jobs; a second tap says so and confirms). TWO FOR ONE is gone (2026-11-15, the relics chat:
 * relics are earned, never rolled, docs/design/relics.md).
 */
import { coinsHtml } from '../shared/coins';
import { LIT, canRecharge, leaveRelic, litFor, recharge, rechargeCost } from '../shared/church';
import type { Game } from './game';
import type { Panel } from './panels';
import { relicCard } from './reliccard';
import { RELICW } from './relicwords';
import { line } from './speech';
import { relicDone } from '../shared/errands';
import { relicMax } from '../shared/relicitems';
import { ERRANDW } from './errandwords';
import { ROLL_RELICS } from '../shared/relicroll';
import { RELICS } from '../shared/magic';
import { relicItemIcon } from './relicicons';
import type { RelicItem } from '../shared/relicitems';

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const b = (op: string, id: string, label: string, opts: { go?: boolean; off?: boolean } = {}) =>
  `<button data-rop="${op}" data-rid="${id}" class="${opts.go ? 'go' : ''}"${opts.off ? ' disabled' : ''}>${label}</button>`;

/** Asked once already: the relic id about to be given up. */
let sure = '';

export function openStep(g: Game, panel: Panel, back: () => void, said = ''): void {
  const pr = g.profile, again = (s = '') => ((sure = ''), openStep(g, panel, back, s));
  // A new hero's first recharge is Isolde's to give (the relic's errand, shared/errands.ts); with nothing
  // to fill (it's been given up, or it's full), the errand's done all the same.
  const free = !!pr.errands?.told && !pr.errands.relic;
  if (free && !pr.relics.some((r) => canRecharge(r))) relicDone(pr), g.keep();
  const lit = pr.lit ?? 0;
  const head = (said.startsWith('~') ? p(said.slice(1)) : said ? say('Father Odric', said) : say('Father Odric', RELICW.churchIntro)) + (lit ? p(`<b>${RELICW.litLeft(lit)}</b>`) : '') + p(`You have ${coinsHtml(pr.gold)}.`) + p(RELICW.stepHow);
  const rows = pr.relics.map((r) => {
    const cost = rechargeCost(r), n = litFor(r);
    const re = r.el ? '' : free && canRecharge(r) ? b('free', r.id, ERRANDW.free, { go: true }) : b('recharge', r.id, canRecharge(r) ? RELICW.recharge(cost) : RELICW.full, { off: !canRecharge(r) || pr.gold < cost });
    const get = n ? Math.min(n, LIT.max - lit) : 0;
    const leave = sure === r.id
      ? `</div><p class="rwarn">${RELICW.leaveWarn(get)}</p><div class="rbtns">` + b('leave', r.id, RELICW.leaveSure, { go: true }) + b('keep', r.id, RELICW.keep)
      : b('ask', r.id, n ? RELICW.leave(get) : RELICW.leaveDark);
    // The reliquary (docs/design/relics.md section 3): where it was won, and CARRY (the one relic for the next job).
    const carried = r.id === pr.relic, from = r.from && RELICW.wonFrom[r.from] ? `<p class="rfrom">${RELICW.wonFrom[r.from]}</p>` : '';
    const carry = carried ? '' : b('carry', r.id, RELICW.carryThis, { go: true });
    return relicCard(r, { tag: carried ? RELICW.carrying : '' }) + from + `<div class="rbtns">${carry}${re}${leave}</div>`;
  }).join('');
  panel.show(RELICW.churchTitle, head + (pr.relics.length ? rows : p(RELICW.none)) + stillToWin(pr.relics), [{ label: RELICW.back, act: back }]);
  const root = document.getElementById('panel');
  for (const el of root?.querySelectorAll<HTMLButtonElement>('[data-rop]') ?? []) el.onclick = (e) => {
    e.stopPropagation();
    const id = el.dataset.rid!, op = el.dataset.rop;
    if (op === 'ask') return (sure = id), openStep(g, panel, back, said);
    if (op === 'keep') return again(said);
    if (op === 'carry') return g.carry(id), again('~' + RELICW.carryNow);
    if (op === 'recharge') return recharge(pr, id) ? (g.relicsChanged(), again('~' + RELICW.recharged)) : undefined;
    if (op === 'free') {
      const r = pr.relics.find((x) => x.id === id);
      if (!r || !canRecharge(r) || !relicDone(pr)) return;
      r.charge = relicMax(r);
      g.relicsChanged();
      return again('~' + ERRANDW.freeDone);
    }
    if (op === 'leave') {
      const r = pr.relics.find((x) => x.id === id), was = pr.lit ?? 0;
      if (!r || leaveRelic(pr, id) < 0) return;
      g.relicsChanged();
      const added = (pr.lit ?? 0) - was;
      return again(added ? RELICW.odricLeave : RELICW.odricLeaveDark);
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
