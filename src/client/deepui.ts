/**
 * The Deep's checkpoint (docs/design/the-deep.md): at a floor's end, what's been found below so far,
 * and LEAVE (up with all of it) or GO DEEPER (the next floor, all of it still at risk).
 */
import { foundSince, kitNow } from '../shared/deepkit';
import { DEEP_WORDS } from './deepwords';
import type { Game } from './game';
import type { Panel } from './panels';

const p = (s: string) => `<p>${s}</p>`;

/** Asked once each time the party walks into a floor's end (game.ts deepAsk); walk off and back to be asked again. */
export function showCheckpoint(g: Game, panel: Panel): void {
  g.deepAsk = false;
  const d = g.profile.deep, run = g.run;
  if (!d || !run) return;
  const items = foundSince(d.entry, kitNow(g.profile)).length;
  panel.show(DEEP_WORDS.checkTitle(d.floor), p(DEEP_WORDS.checkScene) + p(DEEP_WORDS.haul(items, run.gold)) + p(DEEP_WORDS.checkRules), [
    { label: DEEP_WORDS.leave, act: () => (panel.hide(), g.leaveDeep()) },
    { label: DEEP_WORDS.deeper, primary: true, act: () => (panel.hide(), g.deeper()) },
  ]);
}
