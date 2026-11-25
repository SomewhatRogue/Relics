/**
 * The wilds' map screen (the North Fields, the Fen; Kyle 2026-11-25: "a map on these bigger wilds maps"): MAP in the corner opens the
 * whole land on parchment in the expedition's stone frame (expedmapui.ts: its ground, drawn once, its look). Dark where nobody in the
 * party has been this trip; zone names and shelters once seen (the found ones gilt); the way in, on and back; a mark where each held
 * bounty's pack lives; your friends by name and you. Drawing only: it reads the room you see, and the fight goes on under it.
 */
import { MAP_WORDS } from '../shared/expedjob';
import { LANDMAP_WORDS } from '../shared/landmapwords';
import type { Job } from '../shared/jobs';
import type { Profile } from '../shared/progress';
import type { ArenaRoom } from '../sim/room';
import { groundOf } from './expedmapui';
import { gateOf } from './gatewalk';
import { landMarks } from './landmarks';
import { CELL, SeenGrid } from './landseen';
import { territoryPlan } from '../shared/territory';

export class LandMap {
  private el: HTMLDivElement;
  private cv: HTMLCanvasElement;
  private seen: { room: ArenaRoom; grid: SeenGrid } | null = null;
  private zones: { key: string; z: ReturnType<typeof territoryPlan>['zones'] } | null = null;
  open = false;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'landmap';
    this.el.hidden = true;
    this.el.innerHTML = `<div class="stone em-card"><h2></h2><canvas></canvas><div class="em-key"></div><button class="btn primary" data-close>${MAP_WORDS.close}</button></div>`;
    document.body.appendChild(this.el);
    this.cv = this.el.querySelector('canvas')!;
    this.el.querySelector('[data-close]')!.addEventListener('click', () => this.toggle(false));
    this.el.addEventListener('click', (e) => e.target === this.el && this.toggle(false));
  }

  toggle(on = !this.open): void {
    this.open = on;
    this.el.hidden = !on;
  }

  /** Each frame on a wilds map: what the party has seen grows (open or not); drawn when open. */
  frame(room: ArenaRoom, job: Job, index: number, profile: Profile, me: string): void {
    if (this.seen?.room !== room) this.seen = { room, grid: new SeenGrid(room.map.w, room.map.h) };
    const grid = this.seen.grid;
    grid.look(room.heroes.filter((h) => h.id !== 'squire'));
    if (this.open) this.draw(room, job, index, profile, me, grid);
  }

  private draw(room: ArenaRoom, job: Job, index: number, profile: Profile, me: string, grid: SeenGrid): void {
    const m = room.map, card = this.el.querySelector('.em-card') as HTMLElement, dpr = devicePixelRatio || 1;
    // (A tall map: the width the height allows, with the title, key and CLOSE above and below.)
    const w = Math.min(card.clientWidth - 8, 720, ((innerHeight - 170) * m.w) / m.h), h = (w * m.h) / m.w;
    (this.cv.style.width = w + 'px'), (this.cv.style.height = h + 'px');
    (this.cv.width = Math.round(w * dpr)), (this.cv.height = Math.round(h * dpr));
    const g = this.cv.getContext('2d')!, k = this.cv.width / m.w, X = (v: number) => v * k;
    g.imageSmoothingEnabled = false;
    g.drawImage(groundOf(m), 0, 0, this.cv.width, this.cv.height);
    g.fillStyle = 'rgba(28, 22, 16, 0.62)';
    const at = (i: number) => Math.round(i * CELL * k);
    for (let j = 0; j < Math.ceil(m.h / CELL); j++) for (let i = 0; i < Math.ceil(m.w / CELL); i++) if (!grid.at((i + 0.5) * CELL, (j + 0.5) * CELL)) g.fillRect(at(i), at(j), at(i + 1) - at(i), at(j + 1) - at(j));
    const key = `${job.id}:${index}`;
    if (this.zones?.key !== key) this.zones = { key, z: territoryPlan(job, index).zones };
    const marks = landMarks({
      land: job.land!, zones: this.zones.z, stations: m.stations ?? [], foes: room.enemies, profile, gate: gateOf(job, index), seen: (x, y) => grid.at(x, y),
    });
    const font = Math.round(8 * Math.max(1, Math.round(dpr * 1.25)));
    g.font = `${font}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-body') || 'Tiny5, monospace'}`;
    g.textBaseline = 'middle';
    const label = (s: string, px: number, py: number, col: string, plate = true) => {
      const tw = g.measureText(s).width, lx = Math.max(2, Math.min(this.cv.width - tw - 2, px - tw / 2));
      if (plate) (g.fillStyle = '#1a140e'), g.fillRect(lx - 3, py - font * 0.6, tw + 6, font * 1.2);
      else (g.lineWidth = 3), (g.strokeStyle = '#e8dcc0cc'), g.strokeText(s, lx, py);
      g.fillStyle = col;
      g.fillText(s, lx, py);
    };
    const pin = (px: number, py: number, col: string, r: number) => {
      g.fillStyle = '#1a140e';
      g.beginPath(), g.moveTo(px, py - r - 2), g.lineTo(px + r + 2, py), g.lineTo(px, py + r + 2), g.lineTo(px - r - 2, py), g.fill();
      g.fillStyle = col;
      g.beginPath(), g.moveTo(px, py - r), g.lineTo(px + r, py), g.lineTo(px, py + r), g.lineTo(px - r, py), g.fill();
    };
    const r = Math.max(5, k * 1.1);
    // Zone names: small caps on the parchment, no plate.
    for (const z of marks.zones) label(z.name, X(z.x), X(z.y), '#3a2a18', false);
    for (const s of marks.shelters) (pin(X(s.x), X(s.y), s.found ? '#ffd27a' : '#c8d0dc', r * 0.9), label(s.name, X(s.x), X(s.y) + r * 1.8, s.found ? '#ffd27a' : '#e8dcc0'));
    for (const w of marks.ways) (pin(X(w.x), X(w.y), '#c8d0dc', r * 0.8), label(w.name, X(w.x), X(w.y) + (w.y > m.h / 2 ? -r * 1.8 : r * 1.8), '#c8d0dc'));
    const bob = Math.sin(performance.now() / 250) * 1.5;
    for (const b of marks.bounties) (pin(X(b.x), X(b.y) + bob, '#d8402a', r), label(b.name, X(b.x), X(b.y) - r * 2, '#ffb0a0'));
    for (const hh of room.heroes) {
      if (hh.id === 'squire') continue;
      const mine = hh.id === me, col = mine ? '#ffffff' : '#7ad0ff';
      g.fillStyle = '#0b0c0f';
      g.fillRect(X(hh.x) - r * 0.7, X(hh.y) - r * 0.7, r * 1.4, r * 1.4);
      g.fillStyle = hh.act === 'down' ? '#d8402a' : col;
      g.fillRect(X(hh.x) - r * 0.5, X(hh.y) - r * 0.5, r, r);
      if (!mine && hh.tag) label(hh.tag.toUpperCase(), X(hh.x), X(hh.y) + r * 1.6, col);
    }
    const h2 = this.el.querySelector('h2')!, title = (job.title || m.name).toUpperCase();
    if (h2.textContent !== title) h2.textContent = title;
    const total = (m.stations ?? []).length, found = marks.shelters.filter((s) => s.found).length, nb = (profile.bounties ?? []).length;
    this.el.querySelector('.em-key')!.textContent = [total ? LANDMAP_WORDS.shelters(found, total) : '', nb ? LANDMAP_WORDS.bounty(nb) : ''].filter(Boolean).join('  |  ');
  }
}
