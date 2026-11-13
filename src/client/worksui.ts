/**
 * The PUBLIC WORKS board in Lantern Square (internally `works`), kept short for a phone: Foreman Judd
 * (a line of his in turn each time it opens; he stands by it), your gold, a line of what's
 * done, and a button for each work that's open now (a staged work shows only its next stage). Tap one
 * for what it is and what it'll change, and give gold to it, or for the walls and the watch, gear.
 */
import { lastRaid, lossText, RAID_FRESH } from '../shared/raids';
import { FOREMAN, MEND_UI } from '../shared/mendlines';
import { giveValue, itemName } from '../shared/tuning';
import { MENDS, WORKS, WORK_ORDER, workDone, workOpen, workProgress, type WorkId } from '../shared/works';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';
import { openStatue } from './statueui';
import { STATUE_WORDS } from './statuewords';
import { coinsHtml } from '../shared/coins';

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const bar = (n: number, of: number) => `<span class="meter"><i style="width:${Math.min(100, (100 * n) / of)}%"></i></span>`;
const unit = (k: WorkId) => (WORKS[k].by === 'gold' ? 'gold' : 'dens burned');
const left = (g: Game, k: WorkId) => Math.max(0, WORKS[k].need - workProgress(g.world, k));
const TITLE = 'PUBLIC WORKS';
/** Which of Judd's lines is next. */
let said = 0;

export function openWorks(g: Game, panel: Panel, fresh = true): void {
  const pr = g.profile, w = g.world, again = () => openWorks(g, panel, false);
  if (fresh) said++;
  const done = WORK_ORDER.filter((k) => workDone(w, k)), open = [...MENDS, ...WORK_ORDER.filter((k) => !MENDS.includes(k))].filter((k) => workOpen(w, k)), raid = lastRaid(w);
  const html = say('Foreman Judd', FOREMAN.lines[(said - 1 + FOREMAN.lines.length) % FOREMAN.lines.length]) +
    (raid && w.day - raid.day <= RAID_FRESH ? p(MEND_UI.board(raid.day, lossText(raid))) : '') +
    (done.length ? p(`<span class="dim">${MEND_UI.done}: ${done.map((k) => WORKS[k].name).join(', ')}.</span>`) : '') +
    p(`You have ${coinsHtml(pr.gold)}.`);
  panel.show(TITLE, html, [...open.map((k) => ({
    label: `${WORKS[k].name.toUpperCase()} ${Math.min(workProgress(w, k), WORKS[k].need)}/${WORKS[k].need}`,
    act: () => detail(g, panel, k, again),
  })), { label: STATUE_WORDS.open, act: () => openStatue(g, panel, again) }]);
}

/** One work: what it is and what it changes, how far along, and the ways to give. */
function detail(g: Game, panel: Panel, k: WorkId, back: () => void): void {
  const pr = g.profile, wk = WORKS[k], n = workProgress(g.world, k), again = () => (workDone(g.world, k) ? back() : detail(g, panel, k, back));
  const gear = wk.arms ? pr.bag.filter((it) => giveValue(it) > 0) : [];
  const html = p(`<b>${wk.name}</b>`) + p(`${bar(n, wk.need)} ${Math.min(n, wk.need)} of ${wk.need} ${unit(k)}`) + p(wk.text) +
    (wk.arms ? p(`<span class="dim">${MEND_UI.gear}</span>`) : '') + (wk.by === 'gold' ? p(`You have ${coinsHtml(pr.gold)}.`) : '');
  const gifts = wk.by === 'gold' ? [...new Set([25, 100].map((x) => Math.min(x, left(g, k))))].map((x) => ({ label: `GIVE ${x}`, primary: true, disabled: pr.gold < x, act: () => (g.fund(k, x), again()) })) : [];
  panel.show(TITLE, html, [...gifts, ...(gear.length ? [{ label: 'GIVE GEAR', act: () => gearFor(g, panel, k, again) }] : []), { label: 'BACK', act: back }]);
}

/** A packed piece for the walls or the watch: it counts for more than Tobin would pay. */
function gearFor(g: Game, panel: Panel, k: WorkId, back: () => void): void {
  const can = g.profile.bag.filter((it) => giveValue(it) > 0);
  panel.show('GIVE GEAR', p(`<b>${WORKS[k].name}</b>`) + p(can.length ? MEND_UI.gear : 'Nothing in your pack the works can use.'), [
    ...can.map((it) => ({ label: `GIVE ${itemName(it)} (WORTH ${coinsHtml(giveValue(it))})`, act: () => (g.giveGear(it, k), workDone(g.world, k) ? back() : gearFor(g, panel, k, back)) })),
    { label: 'BACK', act: back },
  ]);
}
