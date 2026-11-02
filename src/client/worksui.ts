/**
 * The TOWN WORKS board in Lantern Square, kept short for a phone: Hollis, your gold, a line of what's
 * done, and a button for each work that's open now (a staged work shows only its next stage). Tap one
 * for what it is and what it'll change, and give gold to it, or for the walls and the watch, gear.
 */
import { lastRaid, lossText, RAID_FRESH } from '../shared/raids';
import { MEND_UI } from '../shared/mendlines';
import { giveValue, itemName } from '../shared/tuning';
import { MENDS, WORKS, WORK_ORDER, workDone, workOpen, workProgress, type WorkId } from '../shared/works';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const bar = (n: number, of: number) => `<span class="meter"><i style="width:${Math.min(100, (100 * n) / of)}%"></i></span>`;
const unit = (k: WorkId) => (WORKS[k].by === 'gold' ? 'gold' : 'dens burned');
const left = (g: Game, k: WorkId) => Math.max(0, WORKS[k].need - workProgress(g.world, k));

export function openWorks(g: Game, panel: Panel): void {
  const pr = g.profile, w = g.world, again = () => openWorks(g, panel);
  const done = WORK_ORDER.filter((k) => workDone(w, k)), open = [...MENDS, ...WORK_ORDER.filter((k) => !MENDS.includes(k))].filter((k) => workOpen(w, k)), raid = lastRaid(w);
  const html = say('Reeve Hollis', MEND_UI.hollis) +
    (raid && w.day - raid.day <= RAID_FRESH ? p(MEND_UI.board(raid.day, lossText(raid))) : '') +
    (done.length ? p(`<span class="dim">${MEND_UI.done}: ${done.map((k) => WORKS[k].name).join(', ')}.</span>`) : '') +
    p(`You have ${pr.gold} gold.`);
  panel.show('TOWN WORKS', html, open.map((k) => ({
    label: `${WORKS[k].name.toUpperCase()} ${Math.min(workProgress(w, k), WORKS[k].need)}/${WORKS[k].need}`,
    act: () => detail(g, panel, k, again),
  })));
}

/** One work: what it is and what it changes, how far along, and the ways to give. */
function detail(g: Game, panel: Panel, k: WorkId, back: () => void): void {
  const pr = g.profile, wk = WORKS[k], n = workProgress(g.world, k), again = () => (workDone(g.world, k) ? back() : detail(g, panel, k, back));
  const gear = wk.arms ? pr.bag.filter((it) => giveValue(it) > 0) : [];
  const html = p(`<b>${wk.name}</b>`) + p(`${bar(n, wk.need)} ${Math.min(n, wk.need)} of ${wk.need} ${unit(k)}`) + p(wk.text) +
    (wk.arms ? p(`<span class="dim">${MEND_UI.gear}</span>`) : '') + (wk.by === 'gold' ? p(`You have ${pr.gold} gold.`) : '');
  const gifts = wk.by === 'gold' ? [...new Set([25, 100].map((x) => Math.min(x, left(g, k))))].map((x) => ({ label: `GIVE ${x}`, primary: true, disabled: pr.gold < x, act: () => (g.fund(k, x), again()) })) : [];
  panel.show('TOWN WORKS', html, [...gifts, ...(gear.length ? [{ label: 'GIVE GEAR', act: () => gearFor(g, panel, k, again) }] : []), { label: 'BACK', act: back }]);
}

/** A packed piece for the walls or the watch: it counts for more than Halvard would pay. */
function gearFor(g: Game, panel: Panel, k: WorkId, back: () => void): void {
  const can = g.profile.bag.filter((it) => giveValue(it) > 0);
  panel.show('GIVE GEAR', p(`<b>${WORKS[k].name}</b>`) + p(can.length ? 'Hollis writes it down at what Halvard would give for it, and half again.' : 'Nothing in your pack the works can use.'), [
    ...can.map((it) => ({ label: `GIVE ${itemName(it)} (WORTH ${giveValue(it)})`, act: () => (g.giveGear(it, k), workDone(g.world, k) ? back() : gearFor(g, panel, k, back)) })),
    { label: 'BACK', act: back },
  ]);
}
