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
import { wantOpen, wantTalked } from '../shared/wanterrands';
import { WANTQW } from './wanterrandwords';

const dim = (s: string) => `<p class="dim">${s}</p>`;
const nameOf = (it: Item) => { const id = vowedOf(it); return id ? VOWED[id].name : itemName(it); };

/** The sewer grate's button for the room, if this hero finds it. */
export function archButton(g: Game, panel: Panel, back: () => void): Button[] {
  // A hero on the quest from their first hungry piece home is let in even before they're corrupt (shared/wanterrands.ts).
  return findsRoom(g.profile) || wantOpen(g.profile, 'under') ? [{ label: KEEPW.arch, act: () => room(g, panel, back, true) }] : [];
}

function room(g: Game, panel: Panel, back: () => void, first = false): void {
  const again = () => room(g, panel, back), p = g.profile;
  // The quest's talk, once: the other road (shared/wanterrands.ts). Talking to her is the quest.
  const talk = wantOpen(p, 'under') ? WANTQW.dorcas.map((l) => says('Dorcas', l)).join('') : '';
  if (talk && wantTalked(p, 'under')) (g.hero.wantSeen = true), g.keep();
  // Feeding and giving are for the corrupt only; a clean hero on the quest has come to listen.
  const deals = findsRoom(p) ? [{ label: KEEPW.feedButton, primary: true, act: () => feed(g, panel, again) }, { label: KEEPW.giveButton, act: () => give(g, panel, again) }] : [];
  panel.show(KEEPW.title, (first ? dim(KEEPW.door) : '') + dim(KEEPW.scene) + (talk || says('Dorcas', KEEPW.greet)), [...deals, { label: 'BACK', act: back }]);
}

function feed(g: Game, panel: Panel, again: () => void): void {
  const p = g.profile, pieces = packVowed(p), relics = p.relics.filter(canFeed);
  const why = !pieces.length ? dim(KEEPW.noPieces) : !relics.length ? dim(KEEPW.noRelic) : '';
  panel.show(KEEPW.title, dim(KEEPW.feedRule) + why, [
    ...(pieces.length ? relics : []).map((r) => ({ label: KEEPW.feedPick(relicName(r), piecesToFill(p, r)), act: () => {
      const n = feedRelic(p, r.id);
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
      if (giveToDorcas(p, it)) g.keep();
      panel.show(KEEPW.title, says('Dorcas', KEEPW.given), [{ label: 'BACK', primary: true, act: more }]);
    } })),
    { label: 'BACK', act: again },
  ]);
}
