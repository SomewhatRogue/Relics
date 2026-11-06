/**
 * An expedition's map screen (Helldivers' map, Kyle 2026-11-04): MAP in the corner opens the whole of
 * the Barrowfields on parchment in a stone frame. The ground drawn once from the map (it's the seed's,
 * the same on every screen); dark where nobody's been yet; the pinned jobs (gold, crossed off when
 * done), the side jobs (pale), the camps you know of (red once their horn has gone), the way in, the
 * beacon once it's open, your friends by name and you. Phone first: it fills the width, CLOSE under it.
 * Drawing only: it reads the room (the leader's, or a friend's copy of it).
 */
import type { GameMap } from '../shared/arena';
import { goalWords, MAP_WORDS, EXTRACT_WORDS } from '../shared/expedjob';
import { WOOD_MAP } from '../shared/hangwords';
import { FEN_MAP } from '../shared/fenwords';
import type { Job } from '../shared/jobs';
import { seenAt } from '../sim/exped';
import type { ArenaRoom } from '../sim/room';

const S = 4;
let ground: { map: GameMap; c: HTMLCanvasElement } | null = null;

/** The map's ground at S pixels a tile, drawn once a map. */
function groundOf(m: GameMap): HTMLCanvasElement {
  if (ground?.map === m || (ground && ground.map.w === m.w && ground.map.name === m.name && ground.map.rounds.length === m.rounds.length)) return ground!.c;
  const c = document.createElement('canvas');
  (c.width = m.w * S), (c.height = m.h * S);
  const g = c.getContext('2d')!;
  g.fillStyle = '#b9a47a';
  g.fillRect(0, 0, c.width, c.height);
  for (const s of m.soil ?? []) {
    if (s.line === undefined) continue;
    (g.strokeStyle = '#8a6a44'), (g.lineWidth = S * 1.4), (g.lineCap = 'round');
    g.beginPath(), g.moveTo(s.x * S, s.y * S), g.lineTo((s.x + s.w) * S, (s.y + s.h) * S), g.stroke();
  }
  for (const w of m.water ?? []) (g.fillStyle = w.deep ? '#4a6a7a' : '#7a96a0'), g.fillRect(w.x * S, w.y * S, w.w * S + 0.5, w.h * S);
  for (const r of m.rounds) {
    g.fillStyle = r.kind === 'tree' || r.kind === 'pine' || r.kind === 'deadtree' ? '#5d6a3e' : r.kind === 'bush' ? '#7d8a52' : r.kind === 'reed' ? '#8a9a6a' : '#8d8070';
    g.fillRect(Math.round((r.x - r.r) * S), Math.round((r.y - r.r) * S), Math.max(2, Math.round(r.r * 2 * S)), Math.max(2, Math.round(r.r * 2 * S)));
  }
  for (const b of m.blocks) (g.fillStyle = b.kind === 'house' ? '#6a4a30' : b.kind === 'tent' || b.kind === 'shack' || b.kind === 'den' ? '#5a3a2a' : '#7a6a5a'), g.fillRect(b.x * S, b.y * S, b.w * S, b.h * S);
  ground = { map: m, c };
  return c;
}

export class ExpedMap {
  private el: HTMLDivElement;
  private cv: HTMLCanvasElement;
  open = false;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'expedmap';
    this.el.hidden = true;
    this.el.innerHTML = `<div class="stone em-card"><h2>${MAP_WORDS.title}</h2><canvas></canvas><div class="em-key"></div><button class="btn primary" data-close>${MAP_WORDS.close}</button></div>`;
    document.body.appendChild(this.el);
    this.cv = this.el.querySelector('canvas')!;
    this.el.querySelector('[data-close]')!.addEventListener('click', () => this.toggle(false));
    this.el.addEventListener('click', (e) => e.target === this.el && this.toggle(false));
  }

  toggle(on = !this.open): void {
    this.open = on;
    this.el.hidden = !on;
  }

  /** Each frame it's open: the room as it stands (`me`: your hero's id there; `names`: friends' names by id). */
  draw(room: ArenaRoom, me: string, now: number): void {
    const x = room.exped;
    if (!this.open || !x) return;
    const m = room.map, card = this.el.querySelector('.em-card') as HTMLElement, dpr = devicePixelRatio || 1;
    const w = Math.min(card.clientWidth - 8, 720), h = (w * m.h) / m.w;
    (this.cv.style.width = w + 'px'), (this.cv.style.height = h + 'px');
    (this.cv.width = Math.round(w * dpr)), (this.cv.height = Math.round(h * dpr));
    const g = this.cv.getContext('2d')!, k = this.cv.width / m.w, X = (v: number) => v * k;
    g.imageSmoothingEnabled = false;
    g.drawImage(groundOf(m), 0, 0, this.cv.width, this.cv.height);
    // Not yet seen: the ground darkened over.
    // (Seen ground is kept in cells of 6 tiles over a 96 by 72 grid; a smaller map, Hangman's Wood, uses the top-left of it.)
    const cs = k * 6;
    g.fillStyle = 'rgba(28, 22, 16, 0.62)';
    const at = (i: number) => Math.round(i * cs);
    for (let j = 0; j < Math.ceil(m.h / 6); j++) for (let i = 0; i < Math.ceil(m.w / 6); i++) if (!seenAt(x.seen, (i + 0.5) * 6, (j + 0.5) * 6)) g.fillRect(at(i), at(j), at(i + 1) - at(i), at(j + 1) - at(j));
    const font = Math.round(8 * Math.max(1, Math.round(dpr * 1.25)));
    g.font = `${font}px Tiny5, monospace`;
    g.textBaseline = 'middle';
    const label = (s: string, px: number, py: number, col: string) => {
      const tw = g.measureText(s).width, lx = Math.max(2, Math.min(this.cv.width - tw - 2, px - tw / 2));
      g.fillStyle = '#1a140e';
      g.fillRect(lx - 3, py - font * 0.6, tw + 6, font * 1.2);
      g.fillStyle = col;
      g.fillText(s, lx, py);
    };
    const pin = (px: number, py: number, col: string, r: number) => {
      g.fillStyle = '#1a140e';
      g.beginPath(), g.moveTo(px, py - r - 2), g.lineTo(px + r + 2, py), g.lineTo(px, py + r + 2), g.lineTo(px - r - 2, py), g.fill();
      g.fillStyle = col;
      g.beginPath(), g.moveTo(px, py - r), g.lineTo(px + r, py), g.lineTo(px, py + r), g.lineTo(px - r, py), g.fill();
    };
    const r = Math.max(5, k * 1.1), bob = Math.sin(now * 4) * 1.5;
    for (const c of x.camps) if (c.known || c.alerted) {
      g.fillStyle = c.alerted ? (Math.sin(now * 6) > 0 ? '#d8402a' : '#7a1d1d') : '#8a3a2a';
      g.fillRect(X(c.x) - r, X(c.y) - r * 0.7, r * 2, r * 1.4);
      // (A camp with a job pinned in it says so by the pin.)
      if (!x.goals.some((q) => Math.hypot(q.x - c.x, q.y - c.y) < 10)) label(MAP_WORDS.camp, X(c.x), X(c.y) + r * 1.8, '#e0b0a0');
    }
    pin(X(m.hero.x), X(m.hero.y), '#c8d0dc', r * 0.8);
    label(MAP_WORDS.start, X(m.hero.x), X(m.hero.y) - r * 1.8, '#c8d0dc');
    // Hangman's Wood's fire, the mid-point (sim/woodzone.ts): lit or still to light.
    if (x.wood) (pin(X(x.wood.check.x), X(x.wood.check.y), x.wood.check.lit ? '#ff9a3c' : '#a0782a', r * 0.7), label(WOOD_MAP.check, X(x.wood.check.x), X(x.wood.check.y) + r * 1.7, x.wood.check.lit ? '#ffb070' : '#c8b088'));
    const words = goalWords(room.map.hang ? ({ exped: 'hangmans' } as Job) : room.map.fen ? ({ exped: 'fen' } as Job) : ({} as Job));
    for (const s of x.sides) (pin(X(s.x), X(s.y), s.done ? '#6a6e78' : '#c8d0dc', r * 0.8), label(words[s.kind].pin, X(s.x), X(s.y) - r * 1.7, s.done ? '#8a8e98' : '#e8dcc0'));
    for (const q of x.goals) {
      pin(X(q.x), X(q.y) + (q.done ? 0 : bob), q.done ? '#6a6e78' : '#ffd27a', r);
      label((q.done ? 'DONE: ' : '') + words[q.kind].pin, X(q.x), X(q.y) - r * 2, q.done ? '#a8a090' : '#ffd27a');
    }
    if (x.phase !== 'shut' && !x.wood) {
      g.strokeStyle = '#ffd27a';
      g.lineWidth = Math.max(2, k * 0.4);
      g.beginPath(), g.arc(X(x.zone.x), X(x.zone.y), X(x.zone.r), 0, 7), g.stroke();
      label(EXTRACT_WORDS.pin, X(x.zone.x), X(x.zone.y) + X(x.zone.r) + font, '#ffd27a');
    }
    for (const hh of room.heroes) {
      if (hh.id === 'squire') continue;
      const mine = hh.id === me, col = mine ? '#ffffff' : '#7ad0ff';
      g.fillStyle = '#0b0c0f';
      g.fillRect(X(hh.x) - r * 0.7, X(hh.y) - r * 0.7, r * 1.4, r * 1.4);
      g.fillStyle = hh.act === 'down' ? '#d8402a' : col;
      g.fillRect(X(hh.x) - r * 0.5, X(hh.y) - r * 0.5, r, r);
      if (!mine && hh.tag) label(hh.tag.toUpperCase(), X(hh.x), X(hh.y) + r * 1.6, col);
    }
    // The title is the map's own (THE BARROWFIELDS, HANGMAN'S WOOD).
    const h2 = this.el.querySelector('h2');
    const title = room.map.fen ? FEN_MAP.title : x.wood ? WOOD_MAP.title : MAP_WORDS.title;
    if (h2 && h2.textContent !== title) h2.textContent = title;
    const key = this.el.querySelector('.em-key')!, left = x.goals.filter((q) => !q.done).length;
    key.textContent = `${left ? `${left} OF ${x.goals.length} JOBS LEFT` : EXTRACT_WORDS.open.toUpperCase()}   ${MAP_WORDS.level(x.level)}`;
  }
}
