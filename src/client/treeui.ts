/**
 * The knacks, from the pack's KNACKS button: knacks only (Kyle, 2026-11-13: "only show the one of two
 * choices in the knack that you get to pick for that level, and you can see all of your selected knacks";
 * the trainer's skills and the rest stay at the trainer, upgradeui.ts). A pick waiting: its two, side by side,
 * PICK on each (out of a fight; on a job it's a look). Then the ones you've taken. RESET (free, every knack
 * back as a pick) anywhere out of a fight.
 */
import { perkOffer } from '../shared/chains';
import { PERKS, perkText, type PerkId } from '../shared/perks';
import type { Game } from './game';
import type { Panel } from './panels';
import { KNW } from './treewords';
import './tree.css';

export interface TreeOpts { back?: () => void }

export function openTree(g: Game, panel: Panel, o: TreeOpts = {}): void {
  const p = g.profile, open = g.knacksOpen, offer = p.picks > 0 ? perkOffer(p) : [];
  const again = () => openTree(g, panel, o);
  const card = (id: PerkId, pick: boolean) =>
    `<div class="kn-card${pick ? ' offer' : ''}"><b>${PERKS[id].name}</b><span>${perkText(id, p.cls, 'gain')}</span>` +
    (pick && open ? `<button data-pick="${id}" class="primary">${KNW.take}</button>` : '') + `</div>`;
  const fork = offer.length
    ? `<h3 class="kn-h">${KNW.waiting(p.picks)}</h3><div class="kn-fork">${offer.map((id) => card(id, true)).join('<span class="kn-or">OR</span>')}</div>` +
      (open ? '' : `<p class="kn-note">${KNW.notHere}</p>`)
    : `<p class="kn-note">${KNW.howItWorks}</p>`;
  const have = p.perks.length
    ? `<h3 class="kn-h">${KNW.tag.have}</h3><div class="kn-have">${(p.perks as PerkId[]).map((id) => card(id, false)).join('')}</div>`
    : '';
  const buttons = [
    ...(open && p.perks.length ? [{ label: KNW.reset, act: () => confirmReset(g, panel, again) }] : []),
    // (From the pack the panel's own CLOSE is the way out; BACK only when something opened it to go back to.)
    ...(o.back ? [{ label: KNW.back, act: o.back }] : []),
  ];
  panel.show(KNW.title, `<div class="kn-only">${fork}${have}</div>`, buttons);
  document.querySelectorAll<HTMLElement>('#panel [data-pick]').forEach((b) =>
    b.addEventListener('click', () => (g.pickPerk(b.dataset.pick as PerkId), again())),
  );
}

/** Are you sure: every knack comes back as a pick, for nothing. */
export function confirmReset(g: Game, panel: Panel, back: () => void): void {
  panel.show(KNW.resetTitle, `<p>${KNW.resetLine(g.profile.perks.length)}</p>`, [
    { label: KNW.resetYes, primary: true, act: () => (g.resetPerks(), back()) },
    { label: KNW.keep, act: back },
  ]);
}
