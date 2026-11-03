/**
 * The party card on the HUD, while you're in a party in town (leading it or joined): the job, who's
 * in (in their class colours, the leader marked), the slots, and SET OUT (the leader; greyed with the
 * reason when a story job needs more), LEAVE (the rest), CANCEL (the leader). On every town screen,
 * indoors too. A phone shows one line and opens on a tap; a laptop shows it all. Its toasts sit under it.
 */
import { KIND, STORY_PARTY } from '../shared/jobs';
import { PARTY_MAX } from '../shared/lobby';
import type { HeroClass } from '../shared/tuning';
import { CLASS_COL } from './doormarks';
import type { Game } from './game';
import type { Panel } from './panels';
import { PW } from './partywords';
import { setOutNow } from './setout';
import './partyhud.css';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export class PartyCard {
  readonly root = document.createElement('div');
  private card = document.createElement('div');
  private key = '';
  /** Opened out (a laptop starts open, a phone shut); remembered for the page. */
  open: boolean;

  constructor(private g: Game, private panel: Panel, touch: boolean, private cls: (id: string) => HeroClass | null) {
    this.open = !touch;
    this.root.id = 'partyhud';
    this.card.id = 'partycard';
    this.card.hidden = true;
    this.root.appendChild(this.card);
    document.body.appendChild(this.root);
    this.card.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button');
      if (!b || b.disabled) return;
      const pt = this.g.parties;
      if (b.dataset.toggle !== undefined) this.open = !this.open;
      else if (b.dataset.setout !== undefined) return setOutNow(this.g, this.panel);
      else if (b.dataset.quit !== undefined) pt?.quit();
      this.key = '';
    });
  }

  /** Each frame: shown in town while you're in a party (and nothing covers the whole screen). */
  frame(show: boolean): void {
    const pt = this.g.parties, q = show && this.g.mode === 'town' ? pt?.current() : null;
    document.body.classList.toggle('panel-up', this.panel.open);
    if (!q || !pt) {
      this.card.hidden = true;
      this.key = '';
      return;
    }
    const job = pt.myJob, can = !q.mine || (!!job && this.g.canTake(job, q.members.length));
    const who = q.members.map(([id, name]) => [name, this.cls(id) ?? (id === this.g.profile.id ? this.g.profile.cls : null)] as const);
    const key = JSON.stringify([q.lead, q.job.id, who, q.mine, q.in, q.asked, can, this.open, pt.hold]);
    this.card.hidden = false;
    if (key === this.key) return;
    this.key = key;
    const col = (c: HeroClass | null) => (c ? CLASS_COL[c] : '#d8d4de');
    const pips = who.map(([, c]) => `<i style="background:${col(c)}"></i>`).join('') + '<i class="free"></i>'.repeat(Math.max(0, PARTY_MAX - who.length));
    const slots = `${q.members.length}/${PARTY_MAX}`, lead = q.members[0][1];
    const line = `<button class="pc-line" data-toggle aria-expanded="${this.open}"><b class="kind k-${q.job.kind}">${KIND[q.job.kind]}</b>` +
      `<span class="pc-t">${esc(q.job.title)}</span><span class="pips">${pips}</span><span class="slots">${slots}</span><span class="chev">${this.open ? '\u25BE' : '\u25B8'}</span></button>`;
    if (!this.open) return void (this.card.innerHTML = line, this.card.className = 'shut');
    const names = who.map(([n, c], i) => `<li><i style="background:${col(c)}"></i><span style="color:${col(c)}">${esc(n)}</span>${i === 0 ? `<em>${PW.leads}</em>` : ''}</li>`).join('');
    const acts = q.mine
      ? (can ? `<button data-setout class="go" ${pt.hold ? 'disabled' : ''}>${PW.setOut}</button>` : `<button data-setout class="go" disabled>${PW.setOut}</button><div class="why">${PW.needs(STORY_PARTY)}</div>`) +
        `<button data-quit class="ghost" ${pt.hold ? 'disabled' : ''}>${PW.cancel}</button>`
      : q.in ? `<div class="why">${PW.waiting(esc(lead))}</div><button data-quit class="ghost">${PW.leave}</button>`
      : `<div class="why">${PW.asked}</div><button data-quit class="ghost">${PW.neverMind}</button>`;
    this.card.className = 'open';
    this.card.innerHTML = line + `<div class="pc-where">${q.mine ? PW.yours : PW.theirs(esc(lead))}. ${esc(q.job.place)}</div><ul>${names}</ul><div class="pc-acts">${acts}</div>`;
  }
}
