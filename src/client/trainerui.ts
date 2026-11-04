/**
 * Your trainer's screen, phone first: where you stand (level, experience to the next, gold), any
 * level-up picks waiting, then the training in sections you open and close (trainsections.ts):
 * SKILLS (the class's three, which you carry, what each does and the level it's taught at),
 * TECHNIQUE (the class's own craft), RANKS (the base stats) and KNACKS (the tree). A row shows its
 * ranks as pips, what the next rank adds, and its price, the level it waits on, or MAX; tap it for
 * the whole ladder and one buy button. The rows come from shared/trainrows.ts.
 */
import { perkOffer, perkText, PERKS } from '../shared/progress';
import { xpHead } from './xphead';
import { openTree } from './treeui';
import { RELICS, SKILL_CHOICES, CLASS_SKILL, type RelicId } from '../shared/magic';
import { trainerRows, type Pip, type TrainRow } from '../shared/trainrows';
import { knowsSkill } from '../shared/skillteach';
import type { DrillId } from '../shared/drills';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';
import { labelRows } from './card';
import { openSecs, section, wireSections } from './trainsections';
import './trainer.css';

const pips = (ps: Pip[]) => `<span class="tr-pips">${ps.map((x) => `<i class="${x}"></i>`).join('')}</span>`;

const head = (g: Game) => xpHead(g.profile);

const row = (r: TrainRow) =>
  `<button class="tr-row s-${r.state}" data-row="${r.key}"><span class="tr-n">${r.name}${pips(r.pips)}</span>` +
  `<span class="tr-g">${r.gain || r.now}</span><em class="tr-t">${r.tag}</em></button>`;

/** A skill: USE, COOLDOWN and, until it's known, COST (the level and gold it's taught for); carried,
 *  known (tap to carry), or still to learn. */
function skillRow(r: TrainRow, carried: RelicId, known: boolean): string {
  const on = known && r.skill === carried;
  const tag = on ? 'CARRYING' : known ? 'CARRY' : r.state === 'buy' ? 'LEARN' : r.tag;
  const cost = known ? '' : `${r.price} gold, level ${r.level}${r.state === 'needs' ? `, after ${r.needs}` : ''}`;
  const rows = labelRows([['USE', r.text], ['COOLDOWN', r.skill ? `${RELICS[r.skill].cooldown} s` : ''], ['COST', cost]]);
  return `<button class="tr-skill s-${known ? 'known' : r.state}${on ? ' carried' : ''}" ${known ? `data-carry="${r.skill}"` : `data-row="${r.key}"`}>` +
    `<span class="tr-n">${r.name}</span><em class="tr-t">${tag}</em><span class="tr-d">${rows}</span></button>`;
}

const ready = (rs: TrainRow[]) => rs.filter((r) => r.state === 'buy').length;
/** The lowest level something in `rs` still waits on (0: none). */
const nextLevel = (rs: TrainRow[]) => Math.min(...rs.filter((r) => r.state === 'locked').map((r) => r.level), 99) % 99;

/**
 * The trainer's screen. `title`: the panel's heading; `who`: the trainer's name for the greeting;
 * `greet`: one spoken line, or '' for none.
 */
export function openTrainer(g: Game, panel: Panel, title: string, who: string, greet: string): void {
  const p = g.profile, again = () => openTrainer(g, panel, title, who, greet), rows = trainerRows(p), open = openSecs();
  const skills = rows.filter((r) => r.group === 'skills'), craft = rows.filter((r) => r.group === 'craft'), ranks = rows.filter((r) => r.group === 'ranks');
  // Level-up picks: tap one to take it.
  const offer = p.picks > 0 ? perkOffer(p) : [];
  const picks = offer.length ? `<h3 class="tr-h">${p.picks > 1 ? `${p.picks} PICKS WAITING` : 'A PICK WAITING'}</h3>` +
    offer.map((k) => `<button class="tr-pick" data-pick="${k}"><b>${PERKS[k].name}</b><span>${perkText(k, p.cls)}</span><em>TAKE</em></button>`).join('') : '';
  // Skills: the three, the one carried changed here for nothing.
  const choices = SKILL_CHOICES[p.cls], known = choices.filter((r) => knowsSkill(p, r));
  const carried = p.skill && known.includes(p.skill) ? p.skill : known[0] ?? CLASS_SKILL[p.cls];
  const sNext = nextLevel(skills);
  const skillSum = [known.length ? `CARRYING ${RELICS[carried].name}` : '', `${known.length} OF ${choices.length}`, sNext ? `NEXT AT LEVEL ${sNext}` : ''].filter(Boolean).join(' &middot; ');
  const skillBody = skills.map((r) => skillRow(r, carried, !!r.skill && knowsSkill(p, r.skill))).join('') +
    (known.length > 1 ? '<p class="tr-note">Tap a skill you know to carry it. One at a time; changing is free.</p>' : '');
  // The class's own craft, and the base stats.
  const tech = craft.find((r) => r.id === 'technique')!, cNext = nextLevel(craft);
  const craftSum = `${tech.name} ${tech.rank}/${tech.max}` + (cNext ? ` &middot; NEXT AT LEVEL ${cNext}` : '');
  const have = ranks.reduce((n, r) => n + r.rank, 0), all = ranks.reduce((n, r) => n + r.max, 0), rNext = nextLevel(ranks);
  const rankSum = `${have} OF ${all}` + (rNext && !ready(ranks) ? ` &middot; NEXT AT LEVEL ${rNext}` : '');
  // Every knack and where each chain goes: the tree (treeui.ts), picks taken there too.
  const knackBody = `<button class="tr-row tr-tree" data-tree><span class="tr-n">SEE THE TREE</span>` +
    `<span class="tr-g">${p.perks.length ? p.perks.map((k) => PERKS[k].name).join(', ') : 'none yet'}</span><em class="tr-t">&rsaquo;</em></button>`;
  const html = head(g) + (greet ? `<p><b>${who}:</b> ${line(`"${greet}"`, who)}</p>` : '') + picks +
    section('skills', 'SKILLS', skillSum, ready(skills), skillBody, open.skills) +
    section('craft', 'TECHNIQUE', craftSum, ready(craft), craft.map(row).join(''), open.craft) +
    section('ranks', 'RANKS', rankSum, ready(ranks), ranks.map(row).join(''), open.ranks) +
    section('knacks', 'KNACKS', p.perks.length ? `${p.perks.length} TAKEN` : 'NONE YET', p.picks, knackBody, open.knacks || !!picks);
  panel.show(title, html);
  const on = (sel: string, f: (b: HTMLElement) => void) => document.querySelectorAll<HTMLElement>(`#panel ${sel}`).forEach((b) => b.addEventListener('click', () => f(b)));
  wireSections(document.getElementById('panel')!);
  on('[data-pick]', (b) => (g.pickPerk(b.dataset.pick as never), again()));
  on('[data-tree]', () => openTree(g, panel, { back: again }));
  on('[data-carry]', (b) => (g.chooseSkill(b.dataset.carry as RelicId), again()));
  on('[data-row]', (b) => openRow(g, panel, title, b.dataset.row!, again));
}

/** One row opened: what you have, what the next rank gives, every rank with its level, one buy button. */
export function openRow(g: Game, panel: Panel, title: string, key: string, back: () => void): void {
  const r = trainerRows(g.profile).find((x) => x.key === key);
  if (!r) return back();
  const stay = () => openRow(g, panel, title, key, back);
  const ladder = `<ol class="tr-ladder">${r.ladder.map((u) => {
    const cls = u.have ? 'have' : u.rank === r.rank + 1 ? 'next' : u.level > g.profile.level ? 'lock' : '';
    return `<li class="${cls}"><i></i><b>${u.gain}</b><small>LEVEL ${u.level}</small><em>${u.have ? '' : `${u.price}g`}</em></li>`;
  }).join('')}</ol>`;
  const html = head(g) + `<div class="tr-dh"><b>${r.name}</b>${pips(r.pips)}</div>` +
    (r.lesson ? '' : `<div class="tr-now"><span>NOW</span><b>${r.now || 'nothing yet'}</b></div>` + (r.next ? `<div class="tr-now"><span>NEXT</span><b>${r.next}</b></div>` : '')) + ladder;
  const label = r.state === 'max' ? '' : r.state === 'locked' ? `LEVEL ${r.level}` : r.state === 'needs' ? `LEARN ${r.needs} FIRST` :
    `${r.lesson ? 'LEARN' : `RANK ${r.rank + 1}`}: ${r.price} GOLD`;
  const buy = () => (r.skill && r.id !== 'skill' ? g.learnSkill(r.skill) : r.lesson ? g.learn(r.id as 'skill' | 'leave') : g.buyDrill(r.id as DrillId), stay());
  panel.show(title, html, [...(label ? [{ label, primary: r.state === 'buy', disabled: r.state !== 'buy', act: buy }] : []), { label: 'BACK', act: back }]);
}
