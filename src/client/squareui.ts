/**
 * The things to do in and around Lantern Square: the public works, the Roll of the Brave (and which
 * world you play in), the well, the bard, and down at the Drowned Rat: the barkeep, dice with Moll,
 * the sewer grate (Gannet's bar is shops.ts). Barred doors and rubble say what would open them.
 */
import { SHOP, STAT_NAME, STAT_ORDER } from '../shared/progress';
import { CLASS_NAME } from '../shared/classes';
import { BLESSING, type HeroClass } from '../shared/tuning';
import { WORKS, workDone } from '../shared/works';
import { openWorks } from './worksui';
import { rollHtml } from './rollui';
import { townSays } from '../shared/townsays';
import type { SpotId } from '../shared/town';
import type { Game } from './game';
import { line } from './speech';
import type { Panel } from './panels';
import { SCORES, type Area } from './scores';
import { WorldLink } from './worldlink';
import { throwDice } from './diceanim';

let link: WorldLink | null = null;
/** The page hands over its line to the world server. */
export const setLink = (l: WorldLink) => (link = l);

const p = (s: string) => `<p>${s}</p>`;
// The quote marks type in with the words, so the end of the line never shows before it's said.
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const LOCKED: Record<string, string> = {
  keep: "Barred from the inside since the siege broke. Eleven years. Some nights there's a light in the high window. Nobody on the watch will say who's carrying it.",
  chapel: 'Planks across the door, nailed from outside, and prayers chalked over the planks. Whatever the church put in there, it was keeping it in.',
  oldquarter: 'Siege rubble chokes the east lane, roof beams and somebody\'s bed. The Old Quarter is past it. The town can clear it together, coin by coin: PUBLIC WORKS, in the square.',
};

/** Returns true if it handled the spot. */
/** Which side of the Roll is showing. */
let rollSide: 'brave' | 'unlucky' = 'brave';

export function openSquare(id: SpotId, g: Game, panel: Panel, _arg: number, key: string): boolean {
  const pr = g.profile, w = g.world, again = () => openSquare(id, g, panel, _arg, key);
  if (id === 'works') return openWorks(g, panel), true;
  if (id === 'roll') {
    const board = link?.online && link.board ? link.board : WorldLink.localBoard(g.save.heroes);
    const where = link?.online ? `World: <b>${link.group.toUpperCase()}</b>.` : 'Your own heroes only, until you play online.';
    const tabs = `<div class="rtabs">${(['brave', 'unlucky'] as const).map((s) => `<button data-side="${s}" class="${s === rollSide ? 'on' : ''}">${s === 'brave' ? 'THE BRAVE' : 'THE UNLUCKY'}</button>`).join('')}</div>`;
    const html = tabs + p(where) + rollHtml(board, pr, rollSide) +
      (link ? `<label class="code">WORLD CODE <input id="wcode" maxlength="24" value="${esc(link.group)}" autocomplete="off" spellcheck="false"></label><p class="dim">Type your own code for a private town. WICKHOLD is the one everyone shares.</p>` : '');
    panel.show('THE ROLL OF THE BRAVE', html, [...(link ? [{ label: 'PLAY IN THIS WORLD', act: () => {
      const v = (document.getElementById('wcode') as HTMLInputElement | null)?.value ?? '';
      link!.join(v);
      setTimeout(again, 600);
    } }] : [])]);
    for (const b of document.querySelectorAll<HTMLButtonElement>('#panel .rtabs button')) b.onclick = () => ((rollSide = b.dataset.side as typeof rollSide), again());
    return true;
  }
  if (id === 'well') {
    panel.show('THE WELL', p('Old as the town, and the water\'s tasted of copper since the siege. People drop a coin in for luck, Father Odric too.') +
      p(pr.wish ? 'Your coin is in. Your next job starts lucky.' : `A coin (${SHOP.wish} gold) for luck: +${Math.round((BLESSING.dmgMult - 1) * 100)}% damage and ${Math.round((1 - BLESSING.taken) * 100)}% less damage taken for the first 20 s of your next job.`),
      pr.wish ? [] : [{ label: `DROP A COIN (${SHOP.wish})`, primary: true, disabled: pr.gold < SHOP.wish, act: () => (g.wish(), again()) }]);
    return true;
  }
  if (id === 'bard') {
    const areas: Area[] = ['town', 'inside', 'church', 'village', 'farm', 'field', 'forest', 'mine', 'boss'];
    panel.show('ROWAN THE BARD', say('Rowan', townSays(w, 'rowan') ?? 'A copper a song, and from a hero I\'ll take it on credit. Name a tune. Half of what I sing is even true.') + p('Songs from everywhere the heroes have been:'),
      [...areas.flatMap((a) => SCORES[a].map((sc) => ({ label: sc.name.toUpperCase(), act: () => (dispatchEvent(new CustomEvent('relic:tune', { detail: { area: a, name: sc.name } })), panel.hide()) }))),
        { label: 'WHATEVER YOU LIKE', act: () => (dispatchEvent(new CustomEvent('relic:tune', { detail: null })), panel.hide()) }]);
    return true;
  }
  if (id === 'dice') {
    const play = (bet: number) => {
      const r = g.dice(bet);
      if (!r) return again();
      throwDice(panel, 'KNUCKLEBONES', r.you, r.moll, (img) => panel.show('KNUCKLEBONES', img +
        say('Moll', r.won ? (r.you[0] + r.you[1] === r.moll[0] + r.moll[1] ? 'Tie goes to the house. Unless the house knows a fellow crook. Take it, take it.' : 'Well. The bones like you. They\'re fickle bones.') : r.you[0] + r.you[1] === r.moll[0] + r.moll[1] ? 'Tie goes to the house, love. Always has.' : 'Pay up, pet. Again?') + p(`You have ${pr.gold} gold.`),
        [10, 25, 50].map((n) => ({ label: `BET ${n}`, primary: n === bet, disabled: pr.gold < n, act: () => play(n) }))));
    };
    // Moll plays dice and nothing else (Kyle, 2026-11-02: smoke is Gannet's, over the bar).
    panel.show('DICER MOLL', say('Moll', 'Two bones each, high roll takes the pot, ties go to the house. Yes, I cheat. So would you, if you were any good.') + p(`You have ${pr.gold} gold.`),
      [10, 25, 50].map((n) => ({ label: `BET ${n}`, disabled: pr.gold < n, act: () => play(n) })));
    return true;
  }
  if (id === 'sewer') {
    panel.show('THE SEWER GRATE', workDone(w, 'sewers')
      ? p('The grate is open. Jobs below the town are on the board in the square: The Wickhold Sewers.')
      : p(`Rusted shut. Something scratches below, and the air that comes up smells of wet fur and old pennies. The public works will open it once enough dens are burned out on jobs (${Math.min(w.dens, WORKS.sewers.need)} of ${WORKS.sewers.need}).`));
    return true;
  }
  if (id === 'locked') {
    panel.show('BARRED', p(LOCKED[key] ?? 'It will not open. Not yet.'));
    return true;
  }
  return false;
}
