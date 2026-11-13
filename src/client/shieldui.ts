/**
 * Your shield, with Master Cole at the barracks (Kyle, 2026-11-13: "let warriors customize their shield like
 * hunter dogs can"). From his trainer panel: the shape, the field's colour, the device and the trim, the shield
 * shown large as it's picked. DONE saves it on the hero (Game.chooseShield). Looks only.
 */
import { DEVICES, FIELDS, SHAPES, TRIMS, fitShield, type ShieldLook } from '../shared/shieldlook';
import type { Game } from './game';
import type { Panel } from './panels';
import { shieldSprite } from './shieldart';
import { DEVICE_NAME, FIELD_NAME, SHAPE_NAME, SHIELDW, TRIM_NAME } from './shieldwords';
import { line } from './speech';
import './hound.css';

/** One row of choices, the chosen one lit (the hound panel's look: hound.css). */
function row(key: string, label: string, opts: string[], on: number): string {
  return `<div class="hd-row"><span class="hd-l">${label}</span><div class="hd-opts">` +
    opts.map((o, i) => `<button class="hd-o${i === on ? ' on' : ''}" data-${key}="${i}">${o}</button>`).join('') + '</div></div>';
}

const rows = (s: ShieldLook) =>
  row('shape', SHIELDW.shape, SHAPES.map((k) => SHAPE_NAME[k]), SHAPES.indexOf(s.shape)) +
  row('field', SHIELDW.field, FIELD_NAME.slice(0, FIELDS), s.field) +
  row('device', SHIELDW.device, DEVICES.map((k) => DEVICE_NAME[k]), DEVICES.indexOf(s.device)) +
  row('trim', SHIELDW.trim, TRIMS.map((k) => TRIM_NAME[k]), TRIMS.indexOf(s.trim));

/** The shield large on its stand: its sprite, eight times over, on the panel's dark. */
function paint(cv: HTMLCanvasElement, s: ShieldLook): void {
  const g = cv.getContext('2d')!, sp = shieldSprite(s), k = 7;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, cv.width, cv.height);
  g.drawImage(sp.c, Math.round((cv.width - sp.c.width * k) / 2), Math.round((cv.height - sp.c.height * k) / 2), sp.c.width * k, sp.c.height * k);
}

export function openShield(g: Game, panel: Panel, back: () => void, said: string = SHIELDW.offer): void {
  const pr = g.profile;
  if (pr.cls !== 'WARRIOR') return back();
  const pick = fitShield(pr.shield);
  const html = `<p><b>Cole:</b> ${line(`"${said}"`, 'Cole')}</p><div class="hd-stage"><canvas class="hd-prev" width="256" height="160"></canvas></div>` +
    `<div class="hd-rows">${rows(pick)}</div><p class="hd-note dim">${SHIELDW.same}</p>`;
  const root = document.getElementById('panel')!;
  const keep = () => void (g.chooseShield({ ...pick }) && openShield(g, panel, back, SHIELDW.kept));
  panel.show(SHIELDW.title, html, [{ label: SHIELDW.save, primary: true, act: keep }, { label: SHIELDW.back, act: back }]);
  const cv = root.querySelector<HTMLCanvasElement>('.hd-prev')!;
  paint(cv, pick);
  // Choices change the look in place (the panel isn't drawn again, so Cole's line doesn't type out again).
  const wire = () => root.querySelectorAll<HTMLElement>('.hd-o').forEach((b) => b.addEventListener('click', () => {
    const d = b.dataset;
    if (d.shape !== undefined) pick.shape = SHAPES[Number(d.shape)];
    if (d.field !== undefined) pick.field = Number(d.field);
    if (d.device !== undefined) pick.device = DEVICES[Number(d.device)];
    if (d.trim !== undefined) pick.trim = TRIMS[Number(d.trim)];
    paint(cv, pick);
    root.querySelector('.hd-rows')!.innerHTML = rows(pick);
    wire();
  }));
  wire();
}
