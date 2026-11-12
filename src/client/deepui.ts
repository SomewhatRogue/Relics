/**
 * The Deep's checkpoint (docs/design/the-deep.md): at a floor's end, what's been found below so far, and
 * LEAVE (up with all of it) or on down (all of it still at risk). Every tenth floor a blessing first, one of
 * three; every fifth the way on forks three ways and going deeper is taking one, its curse with it
 * (shared/deepmarks.ts, client/game.ts deepMark). LEAVE is always there.
 */
import { blessesAt, blessingsAt, cursesAt, forksAt, type MarkId } from '../shared/deepmarks';
import { foundSince, kitNow } from '../shared/deepkit';
import { DEEP_WORDS } from './deepwords';
import type { Game } from './game';
import type { Panel } from './panels';

const p = (s: string) => `<p>${s}</p>`;
const named = (id: string) => (DEEP_WORDS.curses[id] ?? DEEP_WORDS.blessings[id])?.name ?? id;

/** Asked once each time I walk into a floor's end (game.ts deepAsk); walk off and back to be asked again. */
export function showCheckpoint(g: Game, panel: Panel): void {
  g.deepAsk = false;
  const d = g.profile.deep, run = g.run;
  if (!d || !run) return;
  const fl = d.floor, items = foundSince(d.entry, kitNow(g.profile)).length;
  const leave = { label: DEEP_WORDS.leave, act: () => (panel.hide(), g.leaveDeep()) };
  const on = d.marks?.length ? p(`<small>${DEEP_WORDS.marksOn(d.marks.map(named).join(', '))}</small>`) : '';
  const head = p(DEEP_WORDS.haul(items, run.gold));
  // A blessing first, on a tenth floor; then the checkpoint again for the way on.
  if (blessesAt(fl) && !d.blessed?.includes(fl)) {
    const ids = blessingsAt(d.seed, fl), pick = (id: MarkId) => () => (g.deepMark(id), showCheckpoint(g, panel));
    panel.show(DEEP_WORDS.checkTitle(fl), p(DEEP_WORDS.blessScene) + ids.map((id) => p(`<b>${DEEP_WORDS.blessings[id].name}</b>: ${DEEP_WORDS.blessings[id].does}`)).join('') + p(DEEP_WORDS.marksRule) + head + on,
      [...ids.map((id) => ({ label: DEEP_WORDS.blessings[id].name, primary: true, act: pick(id) })), leave]);
    return;
  }
  // The fork: the three ways on, each with its curse; taking one is going deeper.
  if (forksAt(fl) && !d.forked?.includes(fl)) {
    const ids = cursesAt(d.seed, fl);
    panel.show(DEEP_WORDS.checkTitle(fl), p(DEEP_WORDS.forkScene) + ids.map((id) => p(`<b>${DEEP_WORDS.curses[id].name}</b>: ${DEEP_WORDS.curses[id].does}`)).join('') + p(DEEP_WORDS.marksRule) + head + on,
      [leave, ...ids.map((id) => ({ label: DEEP_WORDS.curses[id].name, primary: true, act: () => (panel.hide(), g.deepMark(id)) }))]);
    return;
  }
  panel.show(DEEP_WORDS.checkTitle(fl), p(DEEP_WORDS.checkScene) + head + p(DEEP_WORDS.checkRules) + on, [
    leave,
    { label: DEEP_WORDS.deeper, primary: true, act: () => (panel.hide(), g.deeper()) },
  ]);
}
