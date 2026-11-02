/**
 * Your trainer's screen, phone first: where you stand (level, experience to the next, gold), any
 * level-up picks waiting, then one row for everything the trainer offers (skills first). A row shows
 * its ranks as pips, what the next rank adds, and its price, the level it waits on, or MAX; tap it
 * for the whole ladder and one buy button. The rows come from shared/trainrows.ts.
 */
import { LEVEL_CAP, PERKS, perkOffer, xpFor } from '../shared/progress';
import { RELICS, SKILL_CHOICES, CLASS_SKILL, type RelicId } from '../shared/magic';
import { trainerRows, type Pip, type TrainRow } from '../shared/trainrows';
import { knowsLesson } from '../shared/training';
import type { DrillId } from '../shared/drills';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';
import './trainer.css';

const pips = (ps: Pip[]) => `<span class="tr-pips">${ps.map((x) => `<i class="${x}"></i>`).join('')}</span>`;

/** Level, a bar to the next, and gold. */
function head(g: Game): string {
  const p = g.profile, top = p.level >= LEVEL_CAP, from = xpFor(p.level), to = xpFor(p.level + 1);
  const fill = top ? 100 : Math.max(0, Math.min(100, Math.round(((p.xp - from) / (to - from)) * 100)));
  return `<div class="tr-head"><div class="tr-top"><b>LEVEL ${p.level}</b><em>${p.gold} GOLD</em></div>` +
    `<div class="tr-bar"><i style="width:${fill}%"></i></div><div class="tr-xp">${top ? 'MAX' : `${p.xp} / ${to} XP`}</div></div>`;
}

const row = (r: TrainRow) =>
  `<button class="tr-row s-${r.state}" data-row="${r.id}"><span class="tr-n">${r.name}${pips(r.pips)}</span>` +
  `<span class="tr-g">${r.gain || r.now}</span><em class="tr-t">${r.tag}</em></button>`;

/**
 * The trainer's screen. `title`: the panel's heading; `who`: the trainer's name for the greeting;
 * `greet`: one spoken line, or '' for none.
 */
export function openTrainer(g: Game, panel: Panel, title: string, who: string, greet: string): void {
  const p = g.profile, again = () => openTrainer(g, panel, title, who, greet), rows = trainerRows(p);
  const lessons = rows.filter((r) => r.lesson), drills = rows.filter((r) => !r.lesson);
  // Level-up picks: tap one to take it.
  const offer = p.picks > 0 ? perkOffer(p) : [];
  const picks = offer.length ? `<h3 class="tr-h">${p.picks > 1 ? `${p.picks} PICKS WAITING` : 'A PICK WAITING'}</h3>` +
    offer.map((k) => `<button class="tr-pick" data-pick="${k}"><b>${PERKS[k].name}</b><span>${PERKS[k].text}</span><em>TAKE</em></button>`).join('') : '';
  // A class with a choice of skills carries one; change it here for nothing.
  const choices = SKILL_CHOICES[p.cls], carried = p.skill && choices.includes(p.skill) ? p.skill : CLASS_SKILL[p.cls];
  const carry = choices.length > 1 && knowsLesson(p, 'skill') ? `<div class="tr-carry"><span>CARRY</span>` +
    choices.map((r) => `<button data-carry="${r}" class="${r === carried ? 'on' : ''}">${RELICS[r].name}</button>`).join('') + '</div>' : '';
  const perks = p.perks.length ? `<h3 class="tr-h">PERKS</h3><div class="tr-chips">${p.perks.map((k) => `<span>${PERKS[k].name}</span>`).join('')}</div>` : '';
  const html = head(g) + (greet ? `<p><b>${who}:</b> ${line(`"${greet}"`, who)}</p>` : '') + picks +
    `<h3 class="tr-h">SKILLS</h3>${lessons.map(row).join('')}${carry}<h3 class="tr-h">TRAINING</h3>${drills.map(row).join('')}` + perks;
  panel.show(title, html);
  const on = (sel: string, f: (b: HTMLElement) => void) => document.querySelectorAll<HTMLElement>(`#panel ${sel}`).forEach((b) => b.addEventListener('click', () => f(b)));
  on('[data-pick]', (b) => (g.pickPerk(b.dataset.pick as never), again()));
  on('[data-carry]', (b) => (g.chooseSkill(b.dataset.carry as RelicId), again()));
  on('[data-row]', (b) => openRow(g, panel, title, b.dataset.row!, again));
}

/** One row opened: what you have, what the next rank gives, every rank with its level, one buy button. */
export function openRow(g: Game, panel: Panel, title: string, id: string, back: () => void): void {
  const r = trainerRows(g.profile).find((x) => x.id === id);
  if (!r) return back();
  const stay = () => openRow(g, panel, title, id, back);
  const ladder = `<ol class="tr-ladder">${r.ladder.map((u) => {
    const cls = u.have ? 'have' : u.rank === r.rank + 1 ? 'next' : u.level > g.profile.level ? 'lock' : '';
    return `<li class="${cls}"><i></i><b>${u.gain}</b><small>LEVEL ${u.level}</small><em>${u.have ? '' : `${u.price}g`}</em></li>`;
  }).join('')}</ol>`;
  const html = head(g) + `<div class="tr-dh"><b>${r.name}</b>${pips(r.pips)}</div>` +
    (r.lesson ? '' : `<div class="tr-now"><span>NOW</span><b>${r.now || 'nothing yet'}</b></div>` + (r.next ? `<div class="tr-now"><span>NEXT</span><b>${r.next}</b></div>` : '')) + ladder;
  const label = r.state === 'max' ? '' : r.state === 'locked' ? `LEVEL ${r.level}` : r.state === 'needs' ? `LEARN ${r.needs} FIRST` :
    `${r.lesson ? 'LEARN' : `RANK ${r.rank + 1}`}: ${r.price} GOLD`;
  const buy = () => (r.lesson ? g.learn(r.id as 'skill' | 'leave') : g.buyDrill(r.id as DrillId), stay());
  panel.show(title, html, [...(label ? [{ label, primary: r.state === 'buy', disabled: r.state !== 'buy', act: buy }] : []), { label: 'BACK', act: back }]);
}
