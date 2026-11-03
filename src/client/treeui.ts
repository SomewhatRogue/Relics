/**
 * The knacks screen (Kyle, 2026-11-02: "its own sort of area you can see grow"; "hard to know that I
 * have a choice"). With a pick waiting, the two on offer sit at the top in full, each with TAKE. Below,
 * every chain of the hero's class as a row of three: taken steps lit gold, the two on offer green, each
 * chain's next step bright, later steps dim; tap one for what it does. Opened from the pack, the job's
 * end and the trainer; picks are taken and RESET (free, every knack back as a pick) anywhere out of a
 * fight (Game.knacksOpen). On a job it's a look only.
 */
import { CHAINS, CLASS_CHAINS, PERKS, chainOf, nextStep, perkOffer, perkText, type PerkId } from '../shared/progress';
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { xpHead } from './xphead';
import { KNW } from './treewords';
import './tree.css';

export interface TreeOpts { back?: () => void; sel?: PerkId }
type State = 'have' | 'offer' | 'next' | 'later';

function stateOf(id: PerkId, i: number, next: number, perks: string[], offer: PerkId[]): State {
  if (perks.includes(id)) return 'have';
  if (offer.includes(id)) return 'offer';
  return i === next ? 'next' : 'later';
}

/** The two on offer, in full, at the top. */
function offers(offer: PerkId[], picks: number, take: boolean): string {
  if (!offer.length) return `<p class="kn-note">${KNW.howItWorks}</p>`;
  const cards = offer.map((id) => `<div class="kn-card"><i>${CHAINS[chainOf(id)!].name}</i><b>${PERKS[id].name}</b><span>${perkText(id)}</span>` +
    (take ? `<button data-take="${id}">${KNW.take}</button>` : '') + '</div>').join('');
  return `<div class="kn-offer"><h3>${KNW.waiting(picks)}</h3><div class="kn-cards">${cards}</div>${take ? '' : `<p class="kn-note">${KNW.notHere}</p>`}</div>`;
}

export function openTree(g: Game, panel: Panel, o: TreeOpts = {}): void {
  const p = g.profile, take = g.knacksOpen, offer = p.picks > 0 ? perkOffer(p) : [], sel = o.sel;
  const again = (s?: PerkId) => openTree(g, panel, { ...o, sel: s });
  let picked: { id: PerkId; state: State } | null = null;
  const rows = CLASS_CHAINS[p.cls].map((c) => {
    const steps = CHAINS[c].steps as PerkId[], next = nextStep(c, p.perks), have = steps.filter((s) => p.perks.includes(s)).length;
    const nodes = steps.map((id, i) => {
      const st = stateOf(id, i, next, p.perks, offer);
      if (id === sel) picked = { id, state: st };
      const link = i ? `<i class="kn-link${p.perks.includes(steps[i - 1]) ? ' on' : ''}"></i>` : '';
      return link + `<button class="kn-node s-${st}${id === sel ? ' sel' : ''}" data-node="${id}"><b>${PERKS[id].name}</b><span>${perkText(id, p.cls, 'gain')}</span></button>`;
    }).join('');
    return `<div class="kn-chain"><div class="kn-h"><b>${CHAINS[c].name}</b><i>${have} / ${steps.length}</i></div><div class="kn-row">${nodes}</div></div>`;
  }).join('');
  const pk = picked as { id: PerkId; state: State } | null;
  const detail = pk ? `<div class="kn-detail s-${pk.state}"><div><b>${PERKS[pk.id].name}</b><em>${KNW.tag[pk.state]}</em></div><span>${perkText(pk.id)}</span></div>` : '';
  const buttons: Button[] = [];
  const takeIt = (id: PerkId) => (g.pickPerk(id), again());
  if (pk && pk.state === 'offer' && take) buttons.push({ label: `${KNW.take} ${PERKS[pk.id].name}`, primary: true, act: () => takeIt(pk.id) });
  if (take && p.perks.length) buttons.push({ label: KNW.reset, act: () => confirmReset(g, panel, () => again()) });
  if (o.back) buttons.push({ label: KNW.back, act: o.back });
  panel.show(KNW.title, xpHead(p) + offers(offer, p.picks, take) + `<div class="kn-tree">${rows}</div>` + detail, buttons);
  document.querySelectorAll<HTMLElement>('#panel [data-node]').forEach((b) => b.addEventListener('click', () => again(b.dataset.node as PerkId)));
  document.querySelectorAll<HTMLElement>('#panel [data-take]').forEach((b) => b.addEventListener('click', () => takeIt(b.dataset.take as PerkId)));
}

/** Are you sure: every knack comes back as a pick, for nothing. */
function confirmReset(g: Game, panel: Panel, back: () => void): void {
  panel.show(KNW.resetTitle, `<p>${KNW.resetLine(g.profile.perks.length)}</p>`, [
    { label: KNW.resetYes, primary: true, act: () => (g.resetPerks(), back()) },
    { label: KNW.keep, act: back },
  ]);
}
