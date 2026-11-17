/**
 * The tailor on the square (docs/design/cloak-choice.md): the cloth a hero has earned and what is still ahead, the
 * hero shown facing you and walking away in whatever is picked. An entry not yet earned can be looked at, and says
 * what earns it and how far along you are; WEAR IT keeps only what is earned (Game.chooseCloth). Looks only.
 */
import { ROWS, ROW_ORDER, deedFor, earned, tally, wearable, wearsCloth, type ClothLook, type Row } from '../shared/clothlook';
import { STAT_NAME } from '../shared/progress';
import type { Game } from './game';
import type { Panel } from './panels';
import { heroArt } from './heroart';
import { CLOTHW } from './clothwords';
import { line } from './speech';
import './hound.css';
import './cloth.css';

const say = (s: string) => `<p><b>${CLOTHW.who}:</b> ${line(`"${s}"`, CLOTHW.who)}</p>`;

/** One row of choices: the one picked lit, those not yet earned dimmed. */
function row(g: Game, key: Row, pick: ClothLook): string {
  return `<div class="hd-row"><span class="hd-l">${CLOTHW.row[key]}</span><div class="hd-opts">` +
    ROWS[key].map((_, i) => `<button class="hd-o${i === pick[key] ? ' on' : ''}${earned(g.profile, key, i) ? '' : ' no'}" data-row="${key}" data-i="${i}">${CLOTHW.name[key][i]}</button>`).join('') + '</div></div>';
}
const rows = (g: Game, pick: ClothLook) => ROW_ORDER.map((k) => row(g, k, pick)).join('');

/** What the picked cloth still wants earning (the first such row), or the plain note. */
function note(g: Game, pick: ClothLook): string {
  for (const k of ROW_ORDER) {
    const d = deedFor(k, pick[k]);
    if (!d || earned(g.profile, k, pick[k])) continue;
    const have = Math.min(d.need, tally(g.profile, d.by));
    return d.by === 'deep' ? CLOTHW.deep(have, d.need) : CLOTHW.need(d.by === 'quests' ? CLOTHW.quests : STAT_NAME[d.by], have, d.need);
  }
  return CLOTHW.note;
}

/** The hero as the game draws them, facing you and walking away, in the picked cloth. */
function paint(root: HTMLElement, g: Game, pick: ClothLook): void {
  const pr = g.profile, hero = { clothLook: { ...pick }, shieldLook: pr.shield };
  root.querySelectorAll<HTMLImageElement>('.cl-prev').forEach((im, i) => {
    im.src = heroArt({ cls: pr.cls, look: pr.look ?? 0, hero: { ...hero, fx: i ? 0.1 : 0.2, fy: i ? -1 : 1 } }, 44, 48);
  });
}

export function openTailor(g: Game, panel: Panel, said: string = CLOTHW.offer): void {
  const pr = g.profile;
  if (!wearsCloth(pr.cls)) return panel.show(CLOTHW.title, say(CLOTHW.none));
  const pick = wearable(pr, pr.cloth);
  const html = say(said) + `<div class="hd-stage cl-stage"><img class="cl-prev" alt=""><img class="cl-prev" alt=""></div>` +
    `<div class="hd-rows">${rows(g, pick)}</div><p class="hd-note dim">${note(g, pick)}</p>`;
  const root = document.getElementById('panel')!;
  panel.show(CLOTHW.title, html, [{ label: CLOTHW.wear, primary: true, act: () => void (g.chooseCloth({ ...pick }) && openTailor(g, panel, CLOTHW.kept)) }]);
  paint(root, g, pick);
  // Choices change the look in place (the panel isn't drawn again, so her line doesn't type out again).
  const wire = () => root.querySelectorAll<HTMLElement>('.hd-o').forEach((b) => b.addEventListener('click', () => {
    pick[b.dataset.row as Row] = Number(b.dataset.i);
    paint(root, g, pick);
    root.querySelector('.hd-rows')!.innerHTML = rows(g, pick);
    root.querySelector('.hd-note')!.textContent = note(g, pick);
    wire();
  }));
  wire();
}
