/**
 * The tailor on the square (docs/design/cloak-choice.md): the cloth a hero has earned and what is still ahead, the
 * hero shown facing you and walking away in whatever is picked. An entry not yet earned wears a lock; it can still be
 * looked at, and under the rows a list says what earns each one and how far along you are. WEAR IT keeps only what is
 * earned (Game.chooseCloth). Looks only.
 */
import { ROWS, deedFor, earned, rowsFor, tally, wearable, wearsCloth, type ClothLook, type Deed, type Row } from '../shared/clothlook';
import { STAT_NAME } from '../shared/progress';
import type { Game } from './game';
import type { Panel } from './panels';
import { heroArt } from './heroart';
import { CLOTHW } from './clothwords';
import { line } from './speech';
import './hound.css';
import './cloth.css';

const say = (s: string) => `<p><b>${CLOTHW.who}:</b> ${line(`"${s}"`, CLOTHW.who)}</p>`;

/** One row of choices: the one picked lit, those not yet earned dimmed and locked.
 *  (`data-n`, never `data-i`: the panel reads `data-i` as one of its own buttons, panels.ts.) */
function row(g: Game, key: Row, pick: ClothLook): string {
  return `<div class="hd-row"><span class="hd-l">${CLOTHW.row[key]}</span><div class="hd-opts">` +
    ROWS[key].map((_, i) => {
      const got = earned(g.profile, key, i);
      return `<button class="hd-o${i === pick[key] ? ' on' : ''}${got ? '' : ' no'}" data-row="${key}" data-n="${i}">${got ? '' : '<i class="cl-lock"></i>'}${CLOTHW.name[key][i]}</button>`;
    }).join('') + '</div></div>';
}
const rows = (g: Game, pick: ClothLook) => rowsFor(g.profile.cls).map((k) => row(g, k, pick)).join('');

/** A deed and how far along the hero is in it: "BROUGHT HOME 9 OF 25". */
function deedText(g: Game, d: Deed): string {
  const have = Math.min(d.need, tally(g.profile, d.by));
  return d.by === 'deep' ? CLOTHW.deep(have, d.need) : CLOTHW.need(d.by === 'quests' ? CLOTHW.quests : STAT_NAME[d.by], have, d.need);
}

/** Everything still to earn, each with its deed: so nobody has to guess what a lock wants. */
function ahead(g: Game): string {
  const out: string[] = [];
  for (const k of rowsFor(g.profile.cls)) ROWS[k].forEach((_, i) => {
    const d = deedFor(k, i);
    if (d && !earned(g.profile, k, i)) out.push(`<li><b>${CLOTHW.name[k][i]}</b> ${deedText(g, d)}</li>`);
  });
  return out.length ? `<span class="hd-l">${CLOTHW.ahead}</span><ul class="cl-ahead">${out.join('')}</ul>` : `<p class="hd-note dim">${CLOTHW.all}</p>`;
}

/** Under the rows: that the picked cloth is locked, or the plain note. */
function note(g: Game, pick: ClothLook): string {
  for (const k of rowsFor(g.profile.cls)) if (!earned(g.profile, k, pick[k])) return CLOTHW.locked(CLOTHW.name[k][pick[k]]);
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
  const pick = wearable(pr, pr.cloth, pr.cls);
  const html = say(said) + `<div class="hd-stage cl-stage"><img class="cl-prev" alt=""><img class="cl-prev" alt=""></div>` +
    `<div class="hd-rows">${rows(g, pick)}</div><p class="hd-note cl-note">${note(g, pick)}</p>${ahead(g)}`;
  const root = document.getElementById('panel')!;
  panel.show(CLOTHW.title, html, [{ label: CLOTHW.wear, primary: true, act: () => void (g.chooseCloth({ ...pick }) && openTailor(g, panel, CLOTHW.kept)) }]);
  paint(root, g, pick);
  // Choices change the look in place (the panel isn't drawn again, so her line doesn't type out again).
  const wire = () => root.querySelectorAll<HTMLElement>('.hd-o').forEach((b) => b.addEventListener('click', () => {
    pick[b.dataset.row as Row] = Number(b.dataset.n);
    paint(root, g, pick);
    root.querySelector('.hd-rows')!.innerHTML = rows(g, pick);
    root.querySelector('.cl-note')!.textContent = note(g, pick);
    wire();
  }));
  wire();
}
