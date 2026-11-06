/**
 * The ways into the town's pastimes: Old Pennock on the millpond's bank lends you a rod, and Corin at
 * the archery butts runs the rounds and keeps the town's board (from the shared world, read with its
 * usual look; offline, only your own). Each panel says how you've done so far; CLOSE (or walking off)
 * is the way back out, and inside each game there's a button back to town.
 */
import { SPECIES, speciesOf } from '../shared/fishtune';
import { CLASS_NAME } from '../shared/classes';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';
import { openFishing } from './fishmode';
import { openRange } from './rangemode';
import { FISHW, RANGEW } from './pastimewords';

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Old Pennock at the millpond. */
export function openPond(g: Game, panel: Panel): void {
  const rec = g.profile.fishing, kinds = rec ? SPECIES.filter((s) => rec.bests[s.id]).length : 0;
  const how = rec?.best ? p(FISHW.best(speciesOf(rec.best.sp).name, rec.best.oz)) + p(FISHW.kinds(kinds)) : p(FISHW.none);
  panel.show(FISHW.who, say('Pennock', FISHW.greet) + how, [{ label: FISHW.take, primary: true, act: () => (panel.hide(), void openFishing(g, panel)) }]);
}

/** Corin at the butts: the round, your best, and the town's board. */
export function openButts(g: Game, panel: Panel): void {
  const pr = g.profile, best = pr.range?.best ?? 0, board = g.world.range ?? [];
  const rows = board.map((l, i) => `<li${l.id === pr.id ? ' class="me"' : ''}><span>${i + 1}</span>${esc(l.name)} <small>${CLASS_NAME[l.cls]}</small><em>${l.n}</em></li>`).join('');
  const html = say('Corin', RANGEW.greet) + (pr.cls === 'RANGER' ? say('Corin', RANGEW.ranger) : '') + (best ? p(RANGEW.yourBest(best)) : '') +
    `<h4>${RANGEW.board}</h4>` + (rows ? `<ol class="rangeboard">${rows}</ol>` : p(RANGEW.empty)) + (g.link?.online ? '' : `<p class="dim">${RANGEW.offline}</p>`);
  panel.show(RANGEW.who, html, [{ label: RANGEW.shoot, primary: true, act: () => (panel.hide(), void openRange(g, panel)) }]);
}
