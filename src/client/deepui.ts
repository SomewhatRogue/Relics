/**
 * The Deep's checkpoint (docs/design/the-deep.md): at a floor's end, what's been found below so far, what's
 * next, and the choices as cards, each with its good and its cost (Kyle, 2026-11-11: "show who has voted for
 * what and the pros and cons"): LEAVE (up with all of it) or on down (all of it still at risk). Every tenth
 * floor a blessing first, one of three; every fifth the way on forks three ways, each a curse and a boon
 * (shared/deepmarks.ts WAYS), and going deeper is taking one. In a party, who has chosen what shows live
 * under the cards (refreshVotes, each frame from main.ts), and after choosing you wait here, LEAVE still there.
 */
import { blessesAt, blessingsAt, cursesAt, forksAt, isBoon, isCurse, WAYS, type MarkId } from '../shared/deepmarks';
import { deepFloor } from '../shared/deep';
import { layerOf, LAYER_FLOORS } from '../shared/deeplayers';
import { barWords } from '../shared/barword';
import { foundSince, kitNow } from '../shared/deepkit';
import { DEEP_WORDS as W } from './deepwords';
import type { Game } from './game';
import type { Panel } from './panels';
import './deep.css';

const p = (s: string) => `<p>${s}</p>`;
const named = (id: string) => (W.curses[id] ?? W.blessings[id])?.name ?? id;
const card = (name: string, good: string, bad?: string) =>
  `<b>${name}</b><span class="good">+ ${good}</span>${bad ? `<span class="bad">− ${bad}</span>` : ''}`;

/** Asked once each time I walk into a floor's end (game.ts deepAsk); walk off and back to be asked again. */
export function showCheckpoint(g: Game, panel: Panel): void {
  g.deepAsk = false;
  const d = g.profile.deep, run = g.run;
  if (!d || !run) return;
  const fl = d.floor, items = foundSince(d.entry, kitNow(g.profile)).length, bar = (t: string) => barWords(t, g.profile.cls);
  const leave = { label: W.leave, act: () => (panel.hide(), g.leaveDeep()), card: card(W.leave, W.leaveCard.good, W.leaveCard.bad) };
  const on = d.marks?.some((m) => !isBoon(m)) ? p(`<small>${W.marksOn(d.marks.filter((m) => !isBoon(m)).map(named).join(', '))}</small>`) : '';
  const head = p(W.haul(items, run.gold)) + p(`<small>${nextLine(fl + 1, d.seed)}</small>`);
  const votes = `<div class="deep-votes" data-fl="${fl}">${voteRows(g)}</div>`;
  // Chosen already, in a party: waiting on the rest, who's chosen what, LEAVE still there.
  if (g.deepVote === fl) return panel.show(W.waitTitle(fl), p(W.waiting) + head + on + votes, [leave]);
  // A blessing first, on a tenth floor; then the checkpoint again for the way on.
  if (blessesAt(fl) && !d.blessed?.includes(fl)) {
    const pick = (id: MarkId) => () => (g.deepMark(id), showCheckpoint(g, panel));
    const ids = blessingsAt(d.seed, fl);
    return panel.show(W.checkTitle(fl), p(W.blessScene) + p(W.marksRule) + head + on + votes,
      [...ids.map((id) => ({ label: W.blessings[id].name, primary: true, act: pick(id), card: card(W.blessings[id].name, bar(W.blessings[id].does)) })), leave]);
  }
  // The fork: three ways on, each a boon and a curse; taking one is going deeper.
  const after = () => (g.deepVote === fl ? showCheckpoint(g, panel) : panel.hide());
  if (forksAt(fl) && !d.forked?.includes(fl)) {
    const ids = cursesAt(d.seed, fl);
    return panel.show(W.checkTitle(fl), p(W.forkScene) + p(W.marksRule) + head + on + votes, [
      leave,
      ...ids.map((id) => ({ label: W.curses[id].name, primary: true, act: () => (g.deepMark(id), after()), card: card(W.curses[id].name, bar(W.boons[WAYS[id]] ?? ''), bar(W.curses[id].does)) })),
    ]);
  }
  panel.show(W.checkTitle(fl), p(W.checkScene) + head + on + votes, [
    leave,
    { label: W.deeper, primary: true, act: () => (g.deeper(), after()), card: card(W.deeper, W.deeperCard.good, W.deeperCard.bad) },
  ]);
}

/** What the next floor holds: its number, a boss on it, and a new layer starting there. */
function nextLine(n: number, seed: number): string {
  const job = deepFloor(n, seed, ''), boss = job.arena ? job.boss : undefined;
  const layer = n > 1 && (n - 1) % LAYER_FLOORS === 0 ? W.layers[layerOf(n).id] : undefined;
  return W.next(n, boss, layer);
}

/** Who in the party has chosen what on this floor (empty alone). */
function voteRows(g: Game): string {
  const fl = g.profile.deep?.floor ?? 0, heroes = g.room.heroes.filter((h) => h.id !== 'squire' && !h.out);
  if (heroes.length < 2) return '';
  const rows = heroes.map((h) => {
    const way = [...(h.marks ?? [])].reverse().find(isCurse);
    const what = h.act === 'down' ? `<i>${W.chose.down}</i>` : (h.deepVote ?? 0) >= fl ? `<b>${forksAt(fl) && way ? W.curses[way].name : W.chose.deeper}</b>` : `<i>${W.chose.choosing}</i>`;
    return `<div><span>${g.heroName(h) || '?'}</span>${what}</div>`;
  });
  return `<h3>${W.party}</h3>` + rows.join('');
}

/** Each frame while the checkpoint is up: the party's choices as they come in. */
export function refreshVotes(g: Game, panel: Panel): void {
  const el = document.querySelector<HTMLElement>('#panel .deep-votes');
  if (!el) return;
  // Gone down (or out) since it was shown: it's over.
  if (el.dataset.fl !== String(g.profile.deep?.floor ?? '') || g.mode !== 'run') return panel.hide();
  const html = voteRows(g);
  if (el.innerHTML !== html) el.innerHTML = html;
}
