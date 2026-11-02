/**
 * The knacks tree (Kyle, 2026-11-02: "its own sort of area you can see grow"): every chain of the
 * hero's class as a row of three steps, taken steps lit gold, the two on offer lit green, each chain's
 * next step bright, later steps dim. Tap a step for what it does. Opened from the pack, from the job's
 * end when you've grown, and from your trainer, the one place a pick is taken (`take`).
 */
import { CHAINS, CLASS_CHAINS, PERKS, nextStep, perkOffer, perkText, type PerkId } from '../shared/progress';
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { xpHead } from './xphead';
import './tree.css';

export interface TreeOpts { take?: boolean; back?: () => void; sel?: PerkId }
type State = 'have' | 'offer' | 'next' | 'later';

/** Each step's state for this hero. */
function stateOf(id: PerkId, i: number, next: number, perks: string[], offer: PerkId[]): State {
  if (perks.includes(id)) return 'have';
  if (offer.includes(id)) return 'offer';
  return i === next ? 'next' : 'later';
}

const TAG: Record<State, string> = { have: 'TAKEN', offer: 'ON OFFER', next: 'NEXT', later: 'LATER' };

export function openTree(g: Game, panel: Panel, o: TreeOpts = {}): void {
  const p = g.profile, offer = p.picks > 0 ? perkOffer(p) : [], sel = o.sel ?? offer[0];
  const again = (s?: PerkId) => openTree(g, panel, { ...o, sel: s });
  let picked: { id: PerkId; state: State } | null = null;
  const rows = CLASS_CHAINS[p.cls].map((c) => {
    const steps = CHAINS[c].steps, next = nextStep(c, p.perks), have = steps.filter((s) => p.perks.includes(s)).length;
    const nodes = steps.map((id, i) => {
      const st = stateOf(id, i, next, p.perks, offer);
      if (id === sel) picked = { id, state: st };
      const link = i ? `<i class="kn-link${p.perks.includes(steps[i - 1]) ? ' on' : ''}"></i>` : '';
      return link + `<button class="kn-node s-${st}${id === sel ? ' sel' : ''}" data-node="${id}"><b>${PERKS[id].name}</b><span>${perkText(id, p.cls, 'gain')}</span></button>`;
    }).join('');
    return `<div class="kn-chain"><div class="kn-h"><b>${CHAINS[c].name}</b><i>${have} / ${steps.length}</i></div><div class="kn-row">${nodes}</div></div>`;
  }).join('');
  const waiting = p.picks > 1 ? `${p.picks} PICKS WAITING` : 'A PICK WAITING';
  const note = !offer.length ? 'Each level up offers the next step on two chains.' : o.take ? `${waiting}: take one of the two in green.` : `${waiting}. Take it at your trainer.`;
  const pk = picked as { id: PerkId; state: State } | null;
  const detail = pk ? `<div class="kn-detail s-${pk.state}"><div><b>${PERKS[pk.id].name}</b><em>${TAG[pk.state]}</em></div><span>${perkText(pk.id, p.cls)}</span></div>` : '';
  const buttons: Button[] = [];
  if (pk && pk.state === 'offer' && o.take) buttons.push({ label: `TAKE ${PERKS[pk.id].name}`, primary: true, act: () => (g.pickPerk(pk.id), again(pk.id)) });
  if (o.back) buttons.push({ label: 'BACK', act: o.back });
  panel.show('KNACKS', xpHead(p) + `<p class="kn-note">${note}</p><div class="kn-tree">${rows}</div>` + detail, buttons);
  document.querySelectorAll<HTMLElement>('#panel [data-node]').forEach((b) => b.addEventListener('click', () => again(b.dataset.node as PerkId)));
}
