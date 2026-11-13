/**
 * The job board (Kyle, 2026-11-04: "Hard-to-read white text and complex. Maybe it pops out when you
 * select one, and you can read it in more detail, more clearly, and decide to go alone, or group, or
 * pass"): a list of short rows (the job, its kind, length, hour, weather, danger and pay), and a tap
 * pops one out as a framed card with the posting in full, its rows, and GO ALONE, GATHER A PARTY and
 * BACK. The parties gathering and the jobs done lately sit over the list as before.
 */
import { QUESTW } from './questwords';
import { KIND, SIZES, STORY_PARTY, danger, type Job } from '../shared/jobs';
import { EXPED_BOARD } from '../shared/expedjob';
import { WOOD_POST } from '../shared/hangwords';
import { FEN_POST } from '../shared/fenwords';
import { CUT_POST } from '../shared/opencutwords';

/** An expedition's or an instance's board words: the Barrowfields', Hangman's Wood's (shared/hangwords.ts), the Open Cut's. */
const boardWords = (j: Job) => (j.instance ? CUT_POST : j.exped === 'hangmans' ? WOOD_POST : j.exped === 'fen' ? { ...FEN_POST, pays: (n: number) => FEN_POST.pays(n, j.boss) } : EXPED_BOARD);
import { TIME_WORD, timeOf } from '../shared/timeofday';
import { treasureWord } from '../shared/treasure';
import { skyOfJob } from '../shared/weather';
import { SKY_ROW, SKY_WORD } from '../shared/sky';
import { rewardMult } from '../shared/story';
import { lossText } from '../shared/raids';
import { MEND_UI } from '../shared/mendlines';
import { labelRows } from './card';
import { titleCase } from './tracker';
import { partyList, wireParties } from './partyboard';
import { postedToast } from './partytoast';
import { BOARDW } from './boardwords';
import type { Game } from './game';
import type { Panel } from './panels';
import './board.css';
import { coinsHtml } from '../shared/coins';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const RUIN = ['Held', 'Raided', 'Occupied', 'Razed', 'Blighted'];
const pips = (n: number) => '<span class="pips">' + '<i class="on"></i>'.repeat(n) + '<i></i>'.repeat(5 - n) + '</span>';

/** The job open on the card (by id), if any. */
let open = '';

/** The job's weather (shared/sky.ts), rolled from its seed: the board's word, and the card's row. None on the expedition's own map. */
const skyOf = (j: Job) => (j.exped ? 'clear' : skyOfJob(j));
const weatherWord = (j: Job) => (skyOf(j) === 'clear' ? '' : SKY_WORD[skyOf(j)]);
const weatherRow = (j: Job) => (j.exped ? '' : SKY_ROW[skyOf(j)]);

const kindOf = (j: Job) => (j.exped || j.instance ? 'exped' : j.objective);
const kindWord = (j: Job) => (j.exped || j.instance ? boardWords(j).kind : KIND[j.objective]);
/** The kind as a coloured chip, and DEEP; your own quest's posting first, gold (shared/heroquests.ts). */
const chips = (j: Job) => (j.quest ? `<b class="kind k-quest">${QUESTW.tag}</b>` : '') + `<b class="kind k-${kindOf(j)}">${kindWord(j)}</b>` + (j.deep ? `<b class="kind k-deep">${BOARDW.deep}</b>` : '');
/** The row's tags: the chips, then the length, the hour and the weather. */
function tags(j: Job): string {
  const t = timeOf(j), wx = weatherWord(j);
  return chips(j) + (j.exped ? '' : `<span>${SIZES[j.size ?? 'medium'].label}</span>`) + `<span class="t-${t}">${TIME_WORD[t]}</span>` + (wx ? `<span class="wx">${wx}</span>` : '');
}
/** A name in capitals as Title Case, for the blackletter (its capitals can't be read): "Hunt OLD KNUCKLES" as "Hunt Old Knuckles". */
const display = (s: string) => titleCase(s).replace(/\b[A-Z][A-Z']+\b/g, (w) => w[0] + w.slice(1).toLowerCase());

/** One row of the list: the job, its tags, how hard, what it pays. */
const row = (j: Job, i: number, pay: number) =>
  `<button class="jrow k-${kindOf(j)}${j.deep ? ' deep' : ''}${j.quest ? ' quest' : ''}" data-open="${i}"><span class="jt">${esc(j.title)}</span><span class="jtags">${tags(j)}</span><span class="jr">${pips(danger(j))}<em>${pay}g</em></span></button>`;

/** The card for one job: the posting in full, its rows, and what you can do. */
function card(g: Game, j: Job, i: number, pay: number): string {
  const xp = !!j.exped, inst = !!j.instance, alone = g.canTake(j, 1), pt = g.parties, size = SIZES[j.size ?? 'medium'], wx = weatherWord(j);
  const rows = labelRows([
    // (The expedition's title says where; a boss named in the title isn't said twice.)
    [BOARDW.where, xp ? '' : `${esc(j.place.name)}, ${esc(j.place.region)}. ${RUIN[j.place.ruin]}`],
    xp ? [BOARDW.map, boardWords(j).rooms] : [BOARDW.rooms, inst ? boardWords(j).rooms : `${j.rooms}, ${size.minutes}`],
    [BOARDW.time, TIME_WORD[timeOf(j)]],
    [BOARDW.weather, weatherRow(j)],
    [BOARDW.boss, j.boss && !j.title.includes(j.boss) ? esc(j.boss) : ''],
    [BOARDW.danger, pips(danger(j))],
    [BOARDW.needs, alone ? '' : BOARDW.party(STORY_PARTY)],
    [BOARDW.pays, xp || inst ? boardWords(j).pays(pay) : `${coinsHtml(pay)} and ${treasureWord(j)}`],
  ], 'jrows');
  const go = `<button class="primary" data-job="${i}"${alone ? '' : ' disabled'}>${pt ? BOARDW.alone : BOARDW.take}</button>`;
  const gather = pt ? `<button class="${alone ? '' : 'primary'}" data-gather="${i}">${BOARDW.gather}</button>` : '';
  return `<div class="jpop" data-back><div class="jcard stone k-${kindOf(j)}"><div class="jtags">${chips(j)}</div><h4>${esc(display(j.title))}</h4>` +
    `<p class="jtext">${esc(j.text)}</p>${rows}<div class="jbtns">${go}${gather}<button data-back>${BOARDW.back}</button></div></div></div>`;
}

/** The long trips (the expeditions and the Instances) are at the town hall's map table, the rest on the square's board (Kyle, 2026-11-12). */
const far = (j: Job) => !!(j.exped || j.instance);

export function openBoard(g: Game, panel: Panel, at: 'board' | 'map' = 'board'): void {
  const w = g.world, map = at === 'map', jobs = g.jobs().filter((j) => far(j) === map), pt = g.parties;
  const title = map ? BOARDW.mapTitle : 'JOB BOARD';
  const showing = () => panel.open && !!document.querySelector('#panel h2')?.textContent?.toUpperCase().startsWith(title);
  // A fresh visit starts at the list; a redraw (a party changed, a button pressed) keeps the card open.
  if (!showing()) open = '';
  const again = () => openBoard(g, panel, at);
  if (pt) pt.onChange = () => showing() && again();
  const { html: partyHtml, parties } = partyList(g);
  // Jobs done lately, by whoever did them (the shared world's, online), and the town hit while it's news.
  const deeds = (w.deeds ?? []).slice(0, 5), raid = w.raids?.[0];
  const raidHtml = raid && !deeds.some((d) => d.day > raid.day) ? `<div class="m">${esc(MEND_UI.board(raid.day, lossText(raid)))}</div>` : '';
  const doneHtml = deeds.length || raidHtml ? `<h3>${BOARDW.done}</h3><div class="jdone">` + raidHtml + deeds.map((d) => `<div class="m">Day ${Number(d.day) || 1}: ${esc(d.title)}, by ${d.party.map(esc).join(', ')}.</div>`).join('') + '</div>' : '';
  const pay = (j: Job) => Math.round(j.reward * rewardMult(w));
  const sel = jobs.findIndex((j) => j.id === open);
  // At the map table the clerk's word first; under the board's list, where the long trips went.
  // (Only the long trips this hero has opened are named, or none: hero quests, shared/heroquests.ts.)
  const trips = g.jobs().filter(far), none = map && !jobs.length;
  const lead = map ? `<p class="jlead">${esc(none ? QUESTW.noTrips : BOARDW.clerk)}</p>` : '', foot = map || !trips.length ? '' : `<p class="jlead">${esc(QUESTW.toMap(trips))}</p>`;
  const html = lead + partyHtml + doneHtml + (partyHtml || doneHtml ? `<h3>${BOARDW.jobs}</h3>` : '') +
    `<div class="jlist">${jobs.map((j, i) => row(j, i, pay(j))).join('')}</div>` + foot + (sel >= 0 ? card(g, jobs[sel], sel, pay(jobs[sel])) : '');
  panel.show(`${title}, DAY ${w.day}`, html);
  const on = (sel: string, f: (b: HTMLElement, e: Event) => void) => document.querySelectorAll<HTMLElement>(`#panel ${sel}`).forEach((b) => b.addEventListener('click', (e) => f(b, e)));
  on('[data-open]', (b) => ((open = jobs[Number(b.dataset.open)].id), again()));
  // BACK, or a tap on the dark round the card: back to the list.
  on('[data-back]', (b, e) => (e.target === b ? ((open = ''), again()) : undefined));
  on('[data-job]', (b) => g.canTake(jobs[Number(b.dataset.job)], 1) && ((open = ''), panel.hide(), pt?.quit(), g.startJob(jobs[Number(b.dataset.job)])));
  // A party posted, the panel closes: walk where you like while it gathers (the HUD card: partycard.ts).
  on('[data-gather]', (b) => (pt?.gather(jobs[Number(b.dataset.gather)]), (open = ''), panel.hide(), postedToast()));
  wireParties(g, panel, parties, again);
}
