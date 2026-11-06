/**
 * The boss plate in the HUD's #boss (sim/bossplate.ts says what's on it): the name with its phase pips,
 * a health bar for each (side by side for a pair, its name under each), and a thin POISE bar under each
 * bar that flashes gold while it's STAGGERED. Built again only when its shape changes; the bars' widths
 * every frame. Only draws.
 */
import type { Plate } from '../sim/bossplate';

let key = '';

export function showPlate(el: HTMLElement, p: Plate | null): void {
  el.hidden = !p;
  if (!p) return;
  const k = p.name + '|' + p.bars.map((b) => b.name).join(',') + '|' + p.pips + ':' + p.lit;
  if (k !== key || !el.querySelector('.bars')) {
    key = k;
    const pips = p.pips ? `<span class="pips">${Array.from({ length: p.pips }, (_, i) => `<i class="${i < p.lit ? 'on' : ''}"></i>`).join('')}</span>` : '';
    const bar = (n: string, poise: boolean) => `<div class="pb">${n ? `<em>${n}</em>` : ''}<div class="bar"><i></i></div>${poise ? '<div class="poise"><i></i></div>' : ''}</div>`;
    el.innerHTML = `<b>${p.name}${pips}</b><div class="bars">${p.bars.map((b) => bar(b.name, b.poiseMax > 0)).join('')}</div>`;
  }
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
