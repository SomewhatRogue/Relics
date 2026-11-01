/**
 * The things to do in and around Lantern Square: the town works, the Roll of the Brave (and which
 * world you play in), the well, the bard, and down at the Drowned Rat: the barkeep, dice with Moll,
 * the sewer grate. Barred doors and rubble say what would open them.
 */
import { SHOP, STAT_NAME, STAT_ORDER } from '../shared/progress';
import { WORKS, WORK_ORDER, workDone, workProgress } from '../shared/works';
import type { SpotId } from '../shared/town';
import type { Game } from './game';
import type { Panel } from './panels';
import { RUMOURS } from './rumours';
import { SCORES, type Area } from './scores';
import { WorldLink } from './worldlink';

let link: WorldLink | null = null;
/** The page hands over its line to the world server. */
export const setLink = (l: WorldLink) => (link = l);

const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> "${s}"`);
const bar = (n: number, of: number) => `<span class="meter"><i style="width:${Math.min(100, (100 * n) / of)}%"></i></span>`;
const FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const LOCKED: Record<string, string> = {
  keep: "Barred from the inside since the siege broke. Eleven years. Some nights there's a light in the high window. Nobody on the watch will say who's carrying it.",
  chapel: 'Planks across the door, nailed from outside, and prayers chalked over the planks. Whatever the church put in there, it was keeping it in.',
  oldquarter: 'Siege rubble chokes the east lane, roof beams and somebody\'s bed. The Old Quarter is past it. The town can clear it together, coin by coin: TOWN WORKS, in the square.',
};

/** Returns true if it handled the spot. */
export function openSquare(id: SpotId, g: Game, panel: Panel, _arg: number, key: string): boolean {
  const pr = g.profile, w = g.world, again = () => openSquare(id, g, panel, _arg, key);
  if (id === 'works') {
    const html = say('Reeve Hollis', 'Everything this town builds, it builds out of what people give. I write down every coin. I write down every den you burn, too. Somebody should.') +
      WORK_ORDER.map((k) => {
        const wk = WORKS[k], n = workProgress(w, k), done = workDone(w, k);
        return `<div class="work"><b>${wk.name}</b> ${bar(n, wk.need)} ${Math.min(n, wk.need)} of ${wk.need} ${wk.by === 'gold' ? 'gold' : 'dens burned'}<br>${done ? `<span class="done">Done. ${wk.done}</span>` : wk.text}</div>`;
      }).join('') + p(`You have ${pr.gold} gold.`);
    const open = WORK_ORDER.filter((k) => WORKS[k].by === 'gold' && !workDone(w, k));
    panel.show('TOWN WORKS', html, open.flatMap((k) => [25, 100].map((n) => ({ label: `${WORKS[k].name.split(' ').slice(-1)[0].toUpperCase()}: GIVE ${n}`, disabled: pr.gold < n, act: () => (g.fund(k, n), again()) }))));
    return true;
  }
  if (id === 'roll') {
    const board = link?.online && link.board ? link.board : WorldLink.localBoard(g.save.heroes);
    const where = link?.online ? `World: <b>${link.group.toUpperCase()}</b>${link.group === 'wickhold' ? ' (everyone)' : ' (your group)'}.` : 'Off the shared world: this shows your own heroes. Online, every hero in your world is here.';
    const html = p(where) + STAT_ORDER.map((k) => `<div class="roll"><b>${STAT_NAME[k]}</b>${board[k].length ? `<ol>${board[k].map((r) => `<li${r.id === pr.id ? ' class="me"' : ''}>${esc(r.name)} <span>${r.cls}</span> <em>${r.n}</em></li>`).join('')}</ol>` : '<div class="dim">Nobody yet.</div>'}</div>`).join('') +
      (link ? `<label class="code">WORLD CODE <input id="wcode" maxlength="24" value="${esc(link.group)}" autocomplete="off" spellcheck="false"></label><p class="dim">Give your group a code of your own to build a town together, apart from everyone else. WICKHOLD is the world everyone shares.</p>` : '');
    panel.show('THE ROLL OF THE BRAVE', html, link ? [{ label: 'PLAY IN THIS WORLD', act: () => {
      const v = (document.getElementById('wcode') as HTMLInputElement | null)?.value ?? '';
      link!.join(v);
      setTimeout(again, 600);
    } }] : []);
    return true;
  }
  if (id === 'well') {
    panel.show('THE WELL', p('Old as the town, and the water\'s tasted of copper since the siege. People drop a coin in for luck. Father Odric says that\'s a coin kept, not given, and drops one in anyway.') +
      p(pr.wish ? 'Your coin is in. Your next job starts lucky.' : `A coin (${SHOP.wish} gold): your next job starts lucky.`),
      pr.wish ? [] : [{ label: `DROP A COIN (${SHOP.wish})`, primary: true, disabled: pr.gold < SHOP.wish, act: () => (g.wish(), again()) }]);
    return true;
  }
  if (id === 'bard') {
    const areas: Area[] = ['town', 'inside', 'church', 'village', 'farm', 'field', 'forest', 'mine', 'boss'];
    panel.show('ROWAN THE BARD', say('Rowan', 'A copper a song, and from a hero I\'ll take it on credit. Name a tune. Half of what I sing is even true.') + p('Songs from everywhere the heroes have been:'),
      [...areas.flatMap((a) => SCORES[a].map((sc) => ({ label: sc.name.toUpperCase(), act: () => (dispatchEvent(new CustomEvent('relic:tune', { detail: { area: a, name: sc.name } })), panel.hide()) }))),
        { label: 'WHATEVER YOU LIKE', act: () => (dispatchEvent(new CustomEvent('relic:tune', { detail: null })), panel.hide()) }]);
    return true;
  }
  if (id === 'dice') {
    const play = (bet: number) => {
      const r = g.dice(bet);
      if (!r) return again();
      panel.show('KNUCKLEBONES', `<div class="dice"><div><span>${FACES[r.you[0]]}${FACES[r.you[1]]}</span>YOU ${r.you[0] + r.you[1]}</div><div><span>${FACES[r.moll[0]]}${FACES[r.moll[1]]}</span>MOLL ${r.moll[0] + r.moll[1]}</div></div>` +
        say('Moll', r.won ? (r.you[0] + r.you[1] === r.moll[0] + r.moll[1] ? 'Tie goes to the house. Unless the house knows a fellow crook. Take it, take it.' : 'Well. The bones like you. They\'re fickle bones.') : r.you[0] + r.you[1] === r.moll[0] + r.moll[1] ? 'Tie goes to the house, love. Always has.' : 'Pay up, pet. Again?') + p(`You have ${pr.gold} gold.`),
        [10, 25, 50].map((n) => ({ label: `BET ${n}`, primary: n === bet, disabled: pr.gold < n, act: () => play(n) })));
    };
    panel.show('DICER MOLL', say('Moll', 'Two bones each, high roll takes the pot, ties go to the house. Yes, I cheat. So would you, if you were any good.') + p(`You have ${pr.gold} gold.`),
      [10, 25, 50].map((n) => ({ label: `BET ${n}`, disabled: pr.gold < n, act: () => play(n) })));
    return true;
  }
  if (id === 'tavern') {
    panel.show('BARKEEP GANNET', say('Gannet', RUMOURS[(w.day * 5 + pr.runs) % RUMOURS.length]) + p('The Drowned Rat: ale that tastes of the cellar, dice in the corner, and people who know things they shouldn\'t.'));
    return true;
  }
  if (id === 'sewer') {
    panel.show('THE SEWER GRATE', workDone(w, 'sewers')
      ? p('The grate is open. Jobs below the town are on the board in the square: The Wickhold Sewers.')
      : p(`Rusted shut. Something scratches below, and the air that comes up smells of wet fur and old pennies. The town works will open it once enough dens are burned out on jobs (${Math.min(w.dens, WORKS.sewers.need)} of ${WORKS.sewers.need}).`));
    return true;
  }
  if (id === 'locked') {
    panel.show('BARRED', p(LOCKED[key] ?? 'It will not open. Not yet.'));
    return true;
  }
  return false;
}
