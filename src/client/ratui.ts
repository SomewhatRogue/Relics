/**
 * The ways into the Drowned Rat's two pastimes: the arm-wrestling table by the door, where one of the
 * watch off duty sits and says who'll take you on (each regular with what they'll bet), and the knife
 * board on the back wall, kept by the card sharp (your best, the town's board from the shared world, and
 * the bets). The bets are the dice's own: 10, 25 or 50, never more than you have (shared/stakes.ts), and
 * there's always a way to play for nothing. CLOSE, or walking off, is the way out.
 */
import { ARM_FOES, armFoe } from '../shared/armtune';
import { BETS } from '../shared/stakes';
import { CLASS_NAME } from '../shared/classes';
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { line } from './speech';
import { openArm } from './armmode';
import { openKnives } from './knifemode';
import { ARMW, KNIFEW } from './pastimewords';

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** The table: the watchman's word, your record, and who to take on. */
export function openArmTable(g: Game, panel: Panel): void {
  const rec = g.profile.arm, again = () => openArmTable(g, panel);
  const how = rec?.bouts ? p(ARMW.record(rec.bouts, rec.wins)) : p(ARMW.never);
  panel.show(ARMW.who, say('Watchman', ARMW.greet) + how + p(ARMW.pick),
    ARM_FOES.map((f) => ({ label: f.name, act: () => openFoe(g, panel, f.id, again) })));
}

/** One regular: what the watchman says of them, and the bets they'll take. */
function openFoe(g: Game, panel: Panel, id: string, back: () => void): void {
  const f = armFoe(id), pr = g.profile, beat = pr.arm?.beat.includes(f.id);
  const go = (bet: number) => (panel.hide(), openArm(g, panel, f, bet, back));
  const bets: Button[] = BETS.filter((n) => n <= f.cap).map((n) => ({ label: ARMW.bet(n), disabled: pr.gold < n, act: () => go(n) }));
  panel.show(f.name, say('Watchman', ARMW.about[f.id]) + (beat ? p(ARMW.beaten) : '') + p(ARMW.gold(pr.gold)),
    [...bets, { label: ARMW.free, act: () => go(0) }, { label: ARMW.back, act: back }]);
}

/** The knife board: the card sharp, your best, the town's board, and the bets. */
export function openKnifeBoard(g: Game, panel: Panel): void {
  const pr = g.profile, best = pr.knives?.best ?? 0, board = g.world.knives ?? [];
  const rows = board.map((l, i) => `<li${l.id === pr.id ? ' class="me"' : ''}><span>${i + 1}</span>${esc(l.name)} <small>${CLASS_NAME[l.cls]}</small><em>${l.n}</em></li>`).join('');
  const html = say('Card sharp', KNIFEW.greet) + (pr.cls === 'ROGUE' ? say('Card sharp', KNIFEW.rogue) : '') + (best ? p(KNIFEW.yourBest(best)) : '') +
    `<h4>${KNIFEW.board}</h4>` + (rows ? `<ol class="rangeboard">${rows}</ol>` : p(KNIFEW.empty)) + (g.link?.online ? '' : `<p class="dim">${KNIFEW.offline}</p>`) + p(KNIFEW.gold(pr.gold));
  const go = (bet: number) => (panel.hide(), openKnives(g, panel, bet));
  panel.show(KNIFEW.who, html, [...BETS.map((n) => ({ label: KNIFEW.bet(n), disabled: pr.gold < n, act: () => go(n) })), { label: KNIFEW.free, primary: true, act: () => go(0) }]);
}
