/**
 * Walking off one roaming land into the next (shared/landlinks.ts; docs/design/the-fen.md): at the north fields' far end
 * the leader (or a lone hero) is asked to go on into the fen; at the fen's way in, back to the north fields. Where the
 * land has no such link, the way in is the plain way home (main.ts goBack). A friend following a leader is not asked:
 * the leader's choice moves the party.
 */
import { BACKWARD, ONWARD } from '../shared/landlinks';
import { FENW } from './fenroamwords';
import type { Game } from './game';
import type { Panel } from './panels';

export function walkOff(game: Game, panel: Panel, kind: 'in' | 'on', home: () => void): void {
  const land = game.run?.job.land;
  if (game.mode !== 'run' || !land || panel.open) return;
  const on = kind === 'on' ? ONWARD[land] : undefined, back = kind === 'in' ? BACKWARD[land] : undefined;
  if (!on && !back) return kind === 'in' ? home() : undefined;
  if (game.remote) return;
  panel.show(on ? FENW.onAsk : FENW.backAsk, '', [
    { label: on ? FENW.onGo : FENW.backGo, act: () => (panel.hide(), on ? game.crossLand(on.to) : game.crossLand(back!.to, back!.at)) },
    { label: FENW.stay, primary: true, act: () => panel.hide() },
  ]);
}
