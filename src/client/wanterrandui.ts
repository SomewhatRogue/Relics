/** The red piece's whisper (shared/wanterrands.ts): back in town with the first one, before anything else, once. */
import type { Game } from './game';
import type { Panel } from './panels';
import { whisperDue, whisperHeard } from '../shared/wanterrands';
import { WANTQW } from './wanterrandwords';

/** Open the whisper if it's due. True if it was opened. */
export function openWhisper(game: Game, panel: Panel): boolean {
  const p = game.profile;
  if (!whisperDue(p)) return false;
  whisperHeard(p);
  game.keep();
  panel.show(WANTQW.whisperTitle, WANTQW.whisper.map((l) => `<p class="whisper"><i>${l}</i></p>`).join('') + `<p class="dim">${WANTQW.whisperRule}</p>`, [{ label: 'BACK', primary: true, act: () => panel.hide() }], true);
  return true;
}
