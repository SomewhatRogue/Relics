/**
 * Corporal Brisk, by the stair up to the wall at the back of the barracks: at night (Wickhold's shared
 * clock, townclock.ts) he offers a shift on the wall; in the day, his usual grumble and come back after
 * dark. Your best on the wall, if you've stood a shift.
 */
import { watchOpen } from '../shared/watchpay';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';
import { townPhase } from './townclock';
import { openWatch } from './watchmode';
import { WATCHW } from './watchwords';

const p = (s: string) => `<p>${s}</p>`;
const say = (s: string) => p(`<b>Brisk:</b> ${line(`"${s}"`, 'Brisk')}`);

/** `usual`: what he says when there's no shift to offer (his chat line). */
export function openWatchPost(g: Game, panel: Panel, usual: string): void {
  const best = g.profile.watch?.best ? p(WATCHW.best(g.profile.watch.best)) : '';
  if (!watchOpen(townPhase())) return panel.show(WATCHW.who, say(usual) + say(WATCHW.day) + best);
  panel.show(WATCHW.who, say(WATCHW.night) + best, [{ label: WATCHW.take, primary: true, act: () => (panel.hide(), void openWatch(g, panel)) }]);
}
