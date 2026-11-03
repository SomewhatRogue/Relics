/** The townsfolk under the town hall's vote boards, each arguing for their side of the open decision (words: councilwords.ts). */
import { CHAPTER_1 } from '../shared/story';
import { ADVOCATES, VOTE_AT } from './councilwords';
import type { Game } from './game';
import type { Panel } from './panels';
import { line } from './speech';

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);

/** Opens their case if they have one to make (the decision still open); false: talk as usual. */
export function openAdvocate(g: Game, panel: Panel, arg: number): boolean {
  const a = ADVOCATES[arg], d = CHAPTER_1.decision;
  if (!a || g.world.flags[d.id] || !d.choices.some((c) => c.id === a.choice)) return false;
  panel.show(a.title, a.lines.map((s) => say(a.who, s)).join('') + p(`<span class="dim">${VOTE_AT}</span>`));
  return true;
}
