/**
 * The parties gathering, as the job board lists them (townui.ts) and as a panel of their own (a
 * toast's tap: you can join from anywhere in town, not only at the board).
 */
import { STORY_PARTY } from '../shared/jobs';
import { PARTY_MAX, type Party } from './parties';
import type { Game } from './game';
import type { Panel } from './panels';
import { PW } from './partywords';
import { setOutNow } from './setout';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** One party as a board entry, with what you can do about it. */
function entry(g: Game, q: Party, i: number): string {
  const lead = q.members[0][1], job = g.parties?.myJob;
  const act = q.mine
    ? `${job && g.canTake(job, q.members.length) ? `<button data-setout>${PW.setOut}</button>` : `<div class="d">${PW.needs(STORY_PARTY)}</div>`} <button data-quit class="ghost">${PW.cancel}</button>`
    : q.in ? `<div class="d">${PW.waiting(esc(lead))}</div><button data-quit class="ghost">${PW.leave}</button>`
    : q.asked ? `<div class="d">${PW.asked}</div><button data-quit class="ghost">${PW.neverMind}</button>`
    : q.members.length < PARTY_MAX ? `<button data-joinparty="${i}">${PW.join}</button>` : `<div class="d">${PW.full}</div>`;
  return `<div class="job party"><div class="t">${q.mine ? PW.yours : PW.theirs(esc(lead))}: ${esc(q.job.title)}</div>` +
    `<div class="m">${esc(q.job.place)}. ${q.members.map((m) => esc(m[1])).join(', ')} (${q.members.length} of ${PARTY_MAX})</div>${act}</div>`;
}

/** The parties, for the board (empty when there are none). */
export function partyList(g: Game): { html: string; parties: Party[] } {
  const parties = g.parties?.list() ?? [];
  return { parties, html: parties.length ? `<h3>${PW.parties}</h3>` + parties.map((q, i) => entry(g, q, i)).join('') : '' };
}

/** The party buttons in the open panel; `again` redraws it. */
export function wireParties(g: Game, panel: Panel, parties: Party[], again: () => void): void {
  const pt = g.parties;
  const on = (sel: string, f: (b: HTMLButtonElement) => void) => document.querySelectorAll<HTMLButtonElement>(`#panel ${sel}`).forEach((b) => b.addEventListener('click', () => f(b)));
  on('[data-joinparty]', (b) => (pt?.join(parties[Number(b.dataset.joinparty)].lead), again()));
  on('[data-quit]', () => (pt?.quit(), again()));
  on('[data-setout]', () => setOutNow(g, panel));
}

/** Just the parties, from anywhere in town. */
export function openParties(g: Game, panel: Panel): void {
  const again = () => panel.open && document.querySelector('#panel h2')?.textContent?.toUpperCase() === PW.gathering && openParties(g, panel);
  const { html, parties } = partyList(g);
  panel.show(PW.gathering, html || `<p>${PW.none}</p>`);
  wireParties(g, panel, parties, again);
  if (g.parties) g.parties.onChange = again;
}
