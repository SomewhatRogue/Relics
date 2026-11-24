/**
 * The Keeping Room (shared/keeping.ts), off the sewer grate (client/squareui.ts): for a corrupt hero only. Panels for
 * now; the walkable node in the Sewers is asked of the chats that own those maps.
 */
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { says } from './shopui';
import { coinsHtml } from '../shared/coins';
import { relicName } from '../shared/relicitems';
import { VOWED, vowedOf } from '../shared/vowed';
import { canFeed, dorcasPays, feedRelic, findsRoom, giveToDorcas, packVowed, piecesToFill } from '../shared/keeping';
import { itemName, type Item } from '../shared/tuning';
import { KEEPW } from './keepingwords';
import { KEEPING_DOOR } from '../shared/keepingroom';
import { deed } from '../shared/titles';
import { TITLEW } from './titlewords';
import { openTitles } from './titlesui';
import { SPOTS } from '../shared/town';

/** Where the grate is in town: the way back out of the room. */
const GRATE = SPOTS.find((s) => s.id === 'sewer') ?? { x: 23.5, y: 35.4 };
import { wantOpen, wantTalked } from '../shared/wanterrands';
import { WANTQW } from './wanterrandwords';

const dim = (s: string) => `<p class="dim">${s}</p>`;
const nameOf = (it: Item) => { const id = vowedOf(it); return id ? VOWED[id].name : itemName(it); };

/** The sewer grate's button for the room, if this hero finds it. */
export function archButton(g: Game, panel: Panel, _back: () => void): Button[] {
  // A hero on the quest from their first hungry piece home is let in even before they're corrupt (shared/wanterrands.ts).
  if (!findsRoom(g.profile) && !wantOpen(g.profile, 'under')) return [];
  // Through the arch as through a door: the walkable room (shared/keepingroom.ts); out at the bottom, back at the grate.
  return [{ label: KEEPW.arch, act: () => {
    panel.show(KEEPW.title, dim(KEEPW.door), [{ label: KEEPW.goIn, primary: true, act: () => (panel.hide(), g.enter({ kind: 'wall', x: GRATE.x - 0.5, y: GRATE.y - 0.5, w: 1, h: 1, door: KEEPING_DOOR })) }]);
  } }];
}

/** Dorcas, walked up to in the room. */
export function openKeeping(g: Game, panel: Panel): void {
  room(g, panel, () => panel.hide(), false);
}

function room(g: Game, panel: Panel, back: () => void, first = false): void {
  const again = () => room(g, panel, back), p = g.profile;
  // The quest's talk, once: the other road (shared/wanterrands.ts). Talking to her is the quest.
  const talk = wantOpen(p, 'under') ? WANTQW.dorcas.map((l) => says('Dorcas', l)).join('') : '';
  if (talk && wantTalked(p, 'under')) (g.hero.wantSeen = true), g.keep();
  // Feeding and giving are for the corrupt only; a clean hero on the quest has come to listen.
  const deals = findsRoom(p) ? [{ label: KEEPW.feedButton, primary: true, act: () => feed(g, panel, again) }, { label: KEEPW.giveButton, act: () => give(g, panel, again) }, { label: TITLEW.button, act: () => openTitles(g, panel, 'under', again) }] : [];
  panel.show('DORCAS', (first ? dim(KEEPW.scene) : '') + (talk || says('Dorcas', KEEPW.greet)), [...deals, { label: 'BACK', act: back }]);
}

function feed(g: Game, panel: Panel, again: () => void): void {
  const p = g.profile, pieces = packVowed(p), relics = p.relics.filter(canFeed);
  const why = !pieces.length ? dim(KEEPW.noPieces) : !relics.length ? dim(KEEPW.noRelic) : '';
  panel.show(KEEPW.title, dim(KEEPW.feedRule) + why, [
    ...(pieces.length ? relics : []).map((r) => ({ label: KEEPW.feedPick(relicName(r), piecesToFill(p, r)), act: () => {
      const n = feedRelic(p, r.id);
      deed(p, 'under', n);
      g.keep();
      panel.show(KEEPW.title, says('Dorcas', KEEPW.fed(n, !canFeed(r))), [{ label: 'BACK', primary: true, act: again }]);
    } })),
    { label: 'BACK', act: again },
  ]);
}

function give(g: Game, panel: Panel, again: () => void): void {
  const p = g.profile, pieces = packVowed(p), more = () => give(g, panel, again);
  panel.show(KEEPW.title, says('Dorcas', KEEPW.giveLine) + dim(KEEPW.giveRule) + (pieces.length ? '' : dim(KEEPW.noPieces)), [
    ...pieces.map((it) => ({ label: KEEPW.give(nameOf(it), coinsHtml(dorcasPays(it))), act: () => {
      if (giveToDorcas(p, it)) deed(p, 'under'), g.keep();
      panel.show(KEEPW.title, says('Dorcas', KEEPW.given), [{ label: 'BACK', primary: true, act: more }]);
    } })),
    { label: 'BACK', act: again },
  ]);
}
