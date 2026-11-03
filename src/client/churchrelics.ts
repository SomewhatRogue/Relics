/**
 * The church step's relic panel (shared/church.ts decides; this shows it): each relic you own as a
 * card with RECHARGE (plain ones, for gold) and LEAVE IT (worth the church's light for your next jobs);
 * then TWO FOR ONE: tap two, see the odds, leave them, and watch what comes back (forgeanim.ts). The
 * roll is made and kept before the light starts, so nothing on screen can change it.
 */
import { LIT, canRecharge, forge, forgeOdds, leaveRelic, litFor, recharge, rechargeCost } from '../shared/church';
import { relicName, type RelicItem } from '../shared/relicitems';
import type { Game } from './game';
import type { Panel } from './panels';
import { relicCard } from './reliccard';
import { RELICW } from './relicwords';
import { forgeAnim } from './forgeanim';
import { line } from './speech';

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const b = (op: string, id: string, label: string, opts: { go?: boolean; off?: boolean } = {}) =>
  `<button data-rop="${op}" data-rid="${id}" class="${opts.go ? 'go' : ''}"${opts.off ? ' disabled' : ''}>${label}</button>`;

/** The two picked for TWO FOR ONE (by id), kept while the panel is open. */
let picked: string[] = [];

export function openStep(g: Game, panel: Panel, back: () => void, said = ''): void {
  const pr = g.profile, again = (s = '') => openStep(g, panel, back, s);
  picked = picked.filter((id) => pr.relics.some((r) => r.id === id));
  const lit = pr.lit ?? 0;
  const head = (said.startsWith('~') ? p(said.slice(1)) : said ? say('Father Odric', said) : say('Father Odric', RELICW.churchIntro)) + (lit ? p(`<b>${RELICW.litLeft(lit)}</b>`) : '') + p(`You have ${pr.gold} gold.`);
  const rows = pr.relics.map((r) => {
    const cost = rechargeCost(r), n = litFor(r);
    const re = r.el ? '' : b('recharge', r.id, canRecharge(r) ? RELICW.recharge(cost) : RELICW.full, { off: !canRecharge(r) || pr.gold < cost });
    const leave = b('leave', r.id, n ? RELICW.leave(Math.min(n, LIT.max - lit)) : RELICW.leaveDark);
    return relicCard(r, { tag: r.id === pr.relic ? RELICW.carrying : '' }) + `<div class="rbtns">${re}${leave}</div>`;
  }).join('');
  const two = pr.relics.length >= 2 ? twoForOne(pr.relics) : '';
  panel.show(RELICW.churchTitle, head + (pr.relics.length ? rows : p(RELICW.none)) + two, [{ label: RELICW.back, act: back }]);
  const root = document.getElementById('panel');
  for (const el of root?.querySelectorAll<HTMLButtonElement>('[data-rop]') ?? []) el.onclick = (e) => {
    e.stopPropagation();
    const id = el.dataset.rid!, op = el.dataset.rop;
    if (op === 'recharge') return recharge(pr, id) ? (g.relicsChanged(), again('~' + RELICW.recharged)) : undefined;
    if (op === 'leave') {
      const r = pr.relics.find((x) => x.id === id), was = pr.lit ?? 0;
      if (!r || leaveRelic(pr, id) < 0) return;
      g.relicsChanged();
      const added = (pr.lit ?? 0) - was;
      return again(added ? RELICW.odricLeave : RELICW.odricLeaveDark);
    }
    if (op === 'give' && picked.length === 2) {
      const [a, c] = picked.map((x) => pr.relics.find((r) => r.id === x)!) as [RelicItem, RelicItem];
      const got = forge(pr, a.id, c.id);
      picked = [];
      if (!got) return again();
      g.relicsChanged();
      forgeAnim(panel, a, c, got, () => gotOne(g, panel, back, got));
    }
  };
  for (const el of root?.querySelectorAll<HTMLElement>('[data-rpick]') ?? []) el.onclick = (e) => {
    e.stopPropagation();
    const id = el.dataset.rpick!;
    picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id].slice(-2);
    again(said);
  };
}

/** The picker: every relic small, tap two, the odds, and the button. */
function twoForOne(relics: RelicItem[]): string {
  const pair = picked.map((id) => relics.find((r) => r.id === id)).filter((r): r is RelicItem => !!r);
  const odds = pair.length === 2 ? `<p class="rodds">${RELICW.odds(forgeOdds(pair[0], pair[1]).elemental)}</p>` : '';
  return `<div class="rsec">${RELICW.twoTitle}</div>` + p(RELICW.twoLine) + p(RELICW.picked(pair.length)) +
    relics.map((r) => relicCard(r, { pick: r.id, on: picked.includes(r.id), brief: true })).join('') + odds +
    `<div class="rbtns" style="margin-left:0">${b('give', '', RELICW.give, { go: true, off: pair.length < 2 })}</div>`;
}

/** What came back, with CARRY IT. */
function gotOne(g: Game, panel: Panel, back: () => void, got: RelicItem): void {
  const pr = g.profile, img = document.querySelector<HTMLImageElement>('#panel img.forge')?.outerHTML ?? '';
  panel.show(RELICW.twoTitle, img + p(RELICW.got(relicName(got))) + relicCard(got), [
    ...(pr.relic === got.id ? [] : [{ label: RELICW.carry, primary: true, act: () => (g.carry(got.id), openStep(g, panel, back)) }]),
    { label: RELICW.back, act: () => openStep(g, panel, back) },
  ], true);
}
