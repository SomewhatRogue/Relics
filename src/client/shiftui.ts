/**
 * The way into a shift at Halvard's forge (from the forge's panel, stores.ts): his offer, your best, whether
 * the next shift pays or how long the rest has to run (shared/shiftpay.ts), and the town's board of best
 * shifts from the shared world. WORK A SHIFT starts one (shiftmode.ts); BACK is the forge again.
 */
import { CLASS_NAME } from '../shared/classes';
import { SHIFT_PAY } from '../shared/shifttune';
import { restLeft } from '../shared/shiftpay';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';
import { openShift } from './shiftmode';
import { SHIFTW } from './shiftwords';
import './pastime.css';

const p = (s: string) => `<p>${s}</p>`;
const say = (s: string) => p(`<b>Halvard:</b> ${line(`"${s}"`, 'Halvard')}`);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export function openShiftDesk(g: Game, panel: Panel, back: () => void): void {
  const pr = g.profile, rec = pr.shift, rest = restLeft(rec, Date.now()), board = g.world.shift ?? [];
  const rows = board.map((l, i) => `<li${l.id === pr.id ? ' class="me"' : ''}><span>${i + 1}</span>${esc(l.name)} <small>${CLASS_NAME[l.cls]}</small><em>${l.n}</em></li>`).join('');
  const html = (rest ? say(SHIFTW.resting(rest)) + p(`<span class="dim">${SHIFTW.unpaid}</span>`) : say(SHIFTW.offer) + p(SHIFTW.pays(SHIFT_PAY.cap))) +
    (rec?.best ? p(SHIFTW.yourBest(rec.best)) : '') + `<h4>${SHIFTW.board}</h4>` + (rows ? `<ol class="rangeboard">${rows}</ol>` : p(SHIFTW.empty)) +
    (g.link?.online ? '' : `<p class="dim">${SHIFTW.offline}</p>`);
  const again = () => openShiftDesk(g, panel, back);
  panel.show(SHIFTW.work, html, [{ label: SHIFTW.work, primary: true, act: () => (panel.hide(), openShift(g, panel, again)) }, { label: SHIFTW.back, act: back }]);
}
