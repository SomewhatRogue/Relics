/**
 * The boss plate in the HUD's #boss (sim/bossplate.ts says what's on it): the name with its phase pips,
 * a health bar for each (side by side for a pair, its name under each), and a thin POISE bar under each
 * bar that flashes gold while it's STAGGERED. Built again only when its shape changes; the bars' widths
 * every frame. It sits at the top of the screen (centred in the top band on a laptop, just under the top
 * row on a phone); while it's up the page's `--boss-push` is its height, and the tracker, the tip and the
 * party card step down by that (hud.css). Only draws.
 */
import type { Plate } from '../sim/bossplate';
import { setTopPush } from './phoneband';

let key = '', push = -1;

export function showPlate(el: HTMLElement, p: Plate | null): void {
  el.hidden = !p;
  if (!p) return pushBy(0);
  const k = p.name + '|' + p.bars.map((b) => b.name).join(',') + '|' + p.pips + ':' + p.lit;
  if (k !== key || !el.querySelector('.bars')) {
    key = k;
    const pips = p.pips ? `<span class="pips">${Array.from({ length: p.pips }, (_, i) => `<i class="${i < p.lit ? 'on' : ''}"></i>`).join('')}</span>` : '';
    const bar = (n: string, poise: boolean) => `<div class="pb">${n ? `<em>${n}</em>` : ''}<div class="bar"><i></i></div>${poise ? '<div class="poise"><i></i></div>' : ''}</div>`;
    el.innerHTML = `<b>${p.name}${pips}</b><div class="bars">${p.bars.map((b) => bar(b.name, b.poiseMax > 0)).join('')}</div>`;
  }
  // (Read before the bars' widths are written, so it's last frame's layout, not a fresh one.)
  pushBy(el.offsetHeight + 10);
  el.querySelectorAll<HTMLElement>('.pb').forEach((d, i) => {
    const b = p.bars[i];
    if (!b) return;
    d.classList.toggle('dead', b.dead);
    d.classList.toggle('stag', b.staggered);
    (d.querySelector('.bar i') as HTMLElement).style.width = (100 * b.hp) / Math.max(1, b.max) + '%';
    const po = d.querySelector('.poise i') as HTMLElement | null;
    if (po) po.style.width = (b.staggered ? 100 : (100 * b.poise) / Math.max(1, b.poiseMax)) + '%';
  });
}

/** What under the plate steps down, and by how much (only set when it changes). */
function pushBy(h: number): void {
  if (h === push) return;
  push = h;
  document.documentElement.style.setProperty('--boss-push', h + 'px');
  document.body.classList.toggle('boss-up', h > 0);
  setTopPush(h);
}
