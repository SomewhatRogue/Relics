/**
 * The board of bests in Lantern Square (Kyle, 2026-11-06: "a separate board for mini-game high scores, separate
 * from jobs"): the town's best at Abel's butts, the card sharp's knives and Halvard's forge, side by side, each
 * read from the shared world the way its own keeper's panel reads it (pastimeui.ts, ratui.ts, shiftui.ts), and
 * your own best under each. Offline, only your own heroes. Only shows.
 */
import { CLASS_NAME } from '../shared/classes';
import { speciesOf, weighs } from '../shared/fishtune';
import type { FishLine } from '../shared/fishboard';
import type { RangeLine } from '../shared/rangeboard';
import type { Game } from './game';
import type { Panel } from './panels';
import { FISHW, RANGEW, KNIFEW } from './pastimewords';
import { SHIFTW } from './shiftwords';
import { BESTW } from './bestwords';
import { deepBlocks } from './deepbest';

const p = (s: string) => `<p>${s}</p>`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** One game's top names (the first BEST_ROWS), and your best under them if you have one. */
export function block(title: string, board: RangeLine[] | undefined, me: string, best: string, says: (l: RangeLine) => string = (l) => String(l.n)): string {
  const rows = (board ?? []).slice(0, BEST_ROWS).map((l, i) =>
    `<li${l.id === me ? ' class="me"' : ''}><span>${i + 1}</span>${esc(l.name)} <small>${CLASS_NAME[l.cls]}</small><em>${says(l)}</em></li>`).join('');
  return `<section class="best"><h4>${title}</h4>${rows ? `<ol class="rangeboard">${rows}</ol>` : p(BESTW.empty)}${best ? `<p class="dim">${best}</p>` : ''}</section>`;
}

/** How many names each game shows here (its keeper's panel shows the whole ten). */
export const BEST_ROWS = 5;

export function openBest(g: Game, panel: Panel): void {
  const pr = g.profile, w = g.world, me = pr.id;
  const fish = (l: RangeLine) => `${speciesOf((l as FishLine).sp).name.toLowerCase()}, ${weighs(l.n)}`, mine = pr.fishing?.best;
  const html = p(BESTW.about) +
    block(BESTW.pond, w.fish, me, mine ? FISHW.best(speciesOf(mine.sp).name, mine.oz) : '', fish) +
    block(BESTW.butts, w.range, me, pr.range?.best ? RANGEW.yourBest(pr.range.best) : '') +
    block(BESTW.knives, w.knives, me, pr.knives?.best ? KNIFEW.yourBest(pr.knives.best) : '') +
    block(BESTW.forge, w.shift, me, pr.shift?.best ? SHIFTW.yourBest(pr.shift.best) : '') +
    deepBlocks(w, me) +
    (g.link?.online ? '' : `<p class="dim">${BESTW.offline}</p>`);
  panel.show(BESTW.title, html);
}
