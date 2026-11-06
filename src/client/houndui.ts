/**
 * Your hound, with Maeve at the hunters' lodge (Kyle, 2026-11-05: "the choice lives with Maeve at the
 * hunters' lodge, and you can pick and name your dog"). From her trainer panel: the breed, its coat,
 * its markings, a live look at it, and its name (filtered as chat is: shared/houndlook.ts). DONE
 * saves it on the hero (Game.chooseHound). Looks only: the room's hound is the same whatever you pick.
 */
import { BREEDS, COATS, MARKS, HOUND_NAME, fitHound, nameTrouble, tidyName, type HoundLook } from '../shared/houndlook';
import type { Game } from './game';
import { HoundPreview } from './houndpreview';
import { BREED_NAME, COAT_NAME, HOUNDW, MARK_NAME } from './houndwords';
import type { Panel } from './panels';
import { line } from './speech';
import './hound.css';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** One row of choices: its label and a button for each, the chosen one lit. */
function row(key: string, label: string, opts: string[], on: number): string {
  return `<div class="hd-row"><span class="hd-l">${label}</span><div class="hd-opts">` +
    opts.map((o, i) => `<button class="hd-o${i === on ? ' on' : ''}" data-${key}="${i}">${o}</button>`).join('') + '</div></div>';
}

const rows = (p: HoundLook) =>
  row('breed', HOUNDW.breed, BREEDS.map((b) => BREED_NAME[b]), BREEDS.indexOf(p.breed)) +
  row('coat', HOUNDW.coat, COAT_NAME[p.breed], p.coat) +
  row('mark', HOUNDW.white, MARKS.map((m) => MARK_NAME[m]), MARKS.indexOf(p.mark));

/**
 * The panel. `back`: Maeve's trainer panel again. `said`: what Maeve says at the top (her offer, or
 * her word once it's kept).
 */
export function openHound(g: Game, panel: Panel, back: () => void, said: string = HOUNDW.offer): void {
  const pr = g.profile;
  if (pr.cls !== 'RANGER') return back();
  const pick = fitHound(pr.hound, pr.id), prev = new HoundPreview({ ...pick });
  const html = `<p><b>Maeve:</b> ${line(`"${said}"`, 'Maeve')}</p><div class="hd-stage"></div><div class="hd-rows">${rows(pick)}</div>` +
    `<label class="hd-name"><span class="hd-l">${HOUNDW.name}</span><input maxlength="${HOUND_NAME.max}" value="${esc(pick.name)}" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="${HOUNDW.name}"></label>` +
    `<p class="hd-msg dim">${HOUNDW.nameHint}</p><p class="hd-note dim">${HOUNDW.same}</p>`;
  const root = document.getElementById('panel')!;
  const keep = () => {
    const input = root.querySelector<HTMLInputElement>('.hd-name input'), name = input?.value ?? pick.name, why = nameTrouble(name);
    if (why) return void (msg(why === 'rude' ? HOUNDW.rude : HOUNDW.empty, true), input?.focus());
    if (g.chooseHound({ ...pick, name: tidyName(name) })) openHound(g, panel, back, HOUNDW.kept);
  };
  panel.show(HOUNDW.title, html, [{ label: HOUNDW.save, primary: true, act: keep }, { label: HOUNDW.back, act: () => (prev.stop(), back()) }]);
  root.querySelector('.hd-stage')!.appendChild(prev.el);
  prev.start();
  const msg = (s: string, bad = false) => {
    const el = root.querySelector<HTMLElement>('.hd-msg');
    if (el) (el.textContent = s), el.classList.toggle('bad', bad);
  };
  // Choices change the look in place (the panel isn't drawn again, so Maeve's line doesn't type out again).
  const wire = () => root.querySelectorAll<HTMLElement>('.hd-o').forEach((b) => b.addEventListener('click', () => {
    const d = b.dataset;
    if (d.breed !== undefined) Object.assign(pick, { breed: BREEDS[Number(d.breed)], coat: Math.min(pick.coat, COATS[BREEDS[Number(d.breed)]] - 1) });
    if (d.coat !== undefined) pick.coat = Number(d.coat);
    if (d.mark !== undefined) pick.mark = MARKS[Number(d.mark)];
    prev.look = { ...pick, name: prev.look.name };
    root.querySelector('.hd-rows')!.innerHTML = rows(pick);
    wire();
  }));
  wire();
  root.querySelector<HTMLInputElement>('.hd-name input')?.addEventListener('input', (e) => {
    const v = (e.target as HTMLInputElement).value, why = nameTrouble(v);
    prev.look = { ...prev.look, name: why ? '' : tidyName(v) };
    msg(why === 'rude' ? HOUNDW.rude : HOUNDW.nameHint, why === 'rude');
  });
}
