/** Drawing relics and shots in the world: javelins, the hook on its chain, arrows, spells, flasks. */
import type { Bolt, Drop, Hero, Hook, Javelin } from '../sim/types';
import type { Coal } from '../sim/lantern';
import type { Pickup } from '../sim/pickups';
import { relicCol } from './relicicons';
import type { Smoke } from '../sim/flasks';
import type { Chest } from '../sim/chests';
import { POTIONS, TIERS, TIER_ORDER } from '../shared/tuning';
import { line, type Ctx } from './draw';
import { EL_COL } from './palette';

const runes = (c: Ctx, x: number, y: number, a: number, from: number, to: number) => {
  c.glow.globalAlpha = 0.6 + 0.4 * Math.sin(c.now * 6);
  c.glow.fillStyle = '#9fe8ff';
  for (let r = from; r <= to; r += 3) c.glow.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
  c.glow.globalAlpha = 1;
};

/** (x, y) is the javelin's point on the floor in screen pixels. */
export function drawJavelin(c: Ctx, j: Javelin, x: number, y: number): void {
  const a = Math.atan2(j.dy, j.dx), back = a + Math.PI;
  const fade = j.state === 'fly' ? 1 : Math.min(1, j.life / 1.5);
  c.lit.globalAlpha = c.glow.globalAlpha = fade;
  if (j.state === 'floor') {
    line(c.lit, x, y, back, 1, 14, '#a8945e');
    line(c.lit, x, y, back, 0, 1, '#dfe6ec');
    runes(c, x, y, back, 3, 12);
  } else {
    const h = j.state === 'body' ? 10 : 8, tx = x, ty = y - h;
    if (j.state === 'fly') {
      c.lit.fillStyle = 'rgba(8,6,12,0.5)';
      for (let r = 0; r < 12; r++) c.lit.fillRect(Math.round(x + Math.cos(back) * r), Math.round(y + 2 + Math.sin(back) * r * 0.4), 1, 1);
      c.glow.globalAlpha = 0.3;
      line(c.glow, tx, ty, back, 14, 26, '#9fe8ff');
      c.glow.globalAlpha = 1;
      line(c.lit, tx, ty, a, 0, 3, '#dfe6ec', 2);
    }
    const from = j.state === 'fly' ? 0 : 2;
    line(c.lit, tx, ty, back, from, 14, '#d8c48a');
    runes(c, tx, ty, back, from + 3, 13);
  }
  c.lit.globalAlpha = c.glow.globalAlpha = 1;
}

/** The hook and its chain, from the owner's hand. */
export function drawHook(c: Ctx, k: Hook, hx: number, hy: number, x: number, y: number): void {
  const sx = hx, sy = hy - 9, ex = x, ey = y - 8, d = Math.hypot(ex - sx, ey - sy), n = Math.max(1, Math.floor(d / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n, sag = Math.sin(t * Math.PI) * Math.min(4, d / 14) * (k.state === 'fly' ? 1 : 0.2);
    c.lit.fillStyle = i % 2 ? '#6a6470' : '#9aa3ad';
    c.lit.fillRect(Math.round(sx + (ex - sx) * t), Math.round(sy + (ey - sy) * t + sag), 1, 1);
  }
  const a = Math.atan2(k.dy, k.dx);
  line(c.lit, ex, ey, a + 2.4, 0, 3, '#cfd6dc');
  line(c.lit, ex, ey, a - 2.4, 0, 3, '#cfd6dc');
  c.glow.fillStyle = '#9fe8ff';
  c.glow.fillRect(Math.round(ex), Math.round(ey), 1, 1);
}

export type { Hero };

/** Shots, smites and thrown relics. (x, y) is the bolt's spot on the floor in screen pixels. */
export function drawBolt(c: Ctx, b: Bolt, x: number, y: number): void {
  const a = Math.atan2(b.dy, b.dx), back = a + Math.PI, col = EL_COL[b.el];
  if (b.kind === 'knife') {
    // A thrown dagger: it tumbles in flight, and sticks point first where it lands.
    const spin = b.state === 'fly' ? b.t * 40 : a, ty = y - (b.state === 'stuck' ? 5 : 8);
    c.lit.globalAlpha = b.state === 'stuck' ? Math.min(1, b.life / 0.8) : 1;
    line(c.lit, x, ty, spin, 0, 3, '#cfd6dc');
    line(c.lit, x, ty, spin + Math.PI, 0, 2, '#3a2a1a', 1);
    c.lit.globalAlpha = 1;
    return;
  }
  if (b.kind === 'dart') {
    // A blowgun's dart: a thin sliver with a green-wet tip, stuck a moment where it lands.
    const ty = y - (b.state === 'stuck' ? 5 : 8);
    c.lit.globalAlpha = b.state === 'stuck' ? Math.min(1, b.life / 0.8) : 1;
    line(c.lit, x, ty, back, 0, 3, '#c8b890');
    c.glow.fillStyle = '#9be040';
    c.glow.fillRect(Math.round(x), Math.round(ty), 1, 1);
    c.lit.globalAlpha = 1;
    return;
  }
  if (b.kind === 'arrow' || b.kind === 'bolt') {
    const bolt = b.kind === 'bolt', len = bolt ? 5 : 7;
    c.lit.globalAlpha = b.state === 'stuck' ? Math.min(1, b.life / 0.8) : 1;
    const ty = y - (b.state === 'stuck' ? 6 : 8);
    if (b.state === 'fly') (c.lit.fillStyle = 'rgba(8,6,12,0.5)'), c.lit.fillRect(Math.round(x), Math.round(y + 1), 1, 1);
    line(c.lit, x, ty, back, b.state === 'stuck' ? 0 : 1, len, bolt ? '#5a3d22' : '#8b6a3a', bolt ? 2 : 1);
    line(c.lit, x, ty, back, len - 1, len, bolt ? '#9aa3ad' : '#e8e0c8');
    if (b.state === 'fly') line(c.lit, x, ty, a, 0, 1, '#dfe6ec');
    c.lit.globalAlpha = 1;
    return;
  }
  if (b.kind === 'smite') {
    // A ring of gold closing on the spot, then the light comes down.
    const k = Math.min(1, b.t / b.flight), r = b.burst * 16 * (1.3 - 0.3 * k);
    c.glow.fillStyle = '#ffe9a8';
    c.glow.globalAlpha = 0.5 + 0.5 * k;
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      c.glow.fillRect(Math.round(x + Math.cos(t) * r), Math.round(y + Math.sin(t) * r * 0.6), 1, 1);
    }
    c.glow.globalAlpha = 0.25 * k;
    c.glow.fillRect(Math.round(x - 2), Math.round(y - 60), 5, 60);
    c.glow.globalAlpha = 1;
    return;
  }
  if (b.kind === 'lodestone') {
    if (b.state === 'well') {
      const r = 3.6 * 16;
      c.glow.fillStyle = b.el ? col : '#ffd27a';
      for (let i = 0; i < 24; i++) {
        const t = c.now * -3 + (i / 24) * Math.PI * 2, rr = r * (((c.now * 0.9 + i / 24) % 1) * 0.9 + 0.1);
        c.glow.globalAlpha = 0.25 + 0.5 * (1 - rr / r);
        c.glow.fillRect(Math.round(x + Math.cos(t) * rr), Math.round(y + Math.sin(t) * rr * 0.6), 1, 1);
      }
      c.glow.globalAlpha = 1;
      c.lit.fillStyle = '#2a2630';
      c.lit.fillRect(Math.round(x - 2), Math.round(y - 3), 5, 4);
      c.glow.fillStyle = '#d8c0ff';
      c.glow.fillRect(Math.round(x), Math.round(y - 2), 1, 1);
      return;
    }
    const k = b.t / b.flight, up = Math.sin(Math.PI * k) * 24;
    c.lit.fillStyle = 'rgba(8,6,12,0.55)';
    c.lit.fillRect(Math.round(x - 1), Math.round(y), 3, 1);
    c.lit.fillStyle = '#3a3440';
    c.lit.fillRect(Math.round(x - 1), Math.round(y - 5 - up), 3, 3);
    return;
  }
  if (b.kind === 'net') {
    const spin = c.now * 18;
    c.lit.fillStyle = '#8a7a5a';
    for (let i = 0; i < 6; i++) c.lit.fillRect(Math.round(x + Math.cos(spin + i) * 2), Math.round(y - 8 + Math.sin(spin + i) * 2), 1, 1);
    return;
  }
  const ty = y - 8;
  if (b.kind === 'lance') {
    c.glow.fillStyle = col;
    line(c.glow, x, ty, back, 0, 12, col, 2);
    line(c.glow, x, ty, back, 0, 12, '#ffffff');
    return;
  }
  const r = b.kind === 'orb' ? 2 + Math.round(Math.sin(c.now * 20)) * 0.5 : 1;
  c.glow.fillStyle = col;
  for (let i = 1; i <= 4; i++) {
    c.glow.globalAlpha = 0.5 - i * 0.1;
    c.glow.fillRect(Math.round(x + Math.cos(back) * i * 3), Math.round(ty + Math.sin(back) * i * 3), 1, 1);
  }
  c.glow.globalAlpha = 1;
  c.glow.fillRect(Math.round(x - r), Math.round(ty - r), r * 2 + 1, r * 2 + 1);
  c.glow.fillStyle = '#ffffff';
  c.glow.fillRect(Math.round(x), Math.round(ty), 1, 1);
}

const KIT_COL: Record<string, string> = { sword: '#dfe6ec', greatsword: '#eef2f5', spear: '#8b6a3a', daggers: '#e6ecf0', longbow: '#8b6a3a', shortbow: '#6b4a2b', crossbow: '#5a3d22', wand: '#6b4a2b', staff: '#6b4a2b', spellblade: '#cfd6e8', mace: '#9aa3ad' };
const FORGED: Record<string, string> = { ember: EL_COL.fire, rime: EL_COL.frost, storm: EL_COL.storm };

/** Gold on the floor (a few coins, glinting) or a potion bottle in its colour. */
export function drawPickup(c: Ctx, p: Pickup, x: number, y: number): void {
  const fade = Math.min(1, p.life / 4);
  c.lit.globalAlpha = c.glow.globalAlpha = fade;
  if (p.gold) {
    const n = Math.min(5, 1 + Math.floor(p.gold / 6));
    for (let i = 0; i < n; i++) {
      c.lit.fillStyle = i % 2 ? '#b08a3a' : '#d4a537';
      c.lit.fillRect(Math.round(x - 4 + ((i * 3) % 8)), Math.round(y - 1 - (i % 3)), 3, 2);
      c.glow.globalAlpha = 0.35 * fade;
      c.glow.fillStyle = '#d4a537';
      c.glow.fillRect(Math.round(x - 4 + ((i * 3) % 8)), Math.round(y - 1 - (i % 3)), 3, 1);
      c.glow.globalAlpha = fade;
    }
    if (Math.floor(c.now * 2 + p.id) % 3 === 0) (c.glow.fillStyle = '#fff1d0'), c.glow.fillRect(Math.round(x), Math.round(y - 3), 1, 1);
  } else if (p.relic) {
    // A relic: a small gold stone stood upright, glowing, with a ring of light under it.
    const col = relicCol(p.relic), bob = Math.round(Math.sin(c.now * 2.5 + p.id) * 1.5);
    c.lit.fillStyle = '#d9a13a';
    c.lit.fillRect(Math.round(x - 1), Math.round(y - 8 + bob), 3, 5);
    c.glow.fillStyle = col;
    c.glow.fillRect(Math.round(x), Math.round(y - 9 + bob), 1, 6);
    c.glow.globalAlpha = 0.5 * fade;
    for (let a = 0; a < Math.PI * 2; a += 0.5) c.glow.fillRect(Math.round(x + Math.cos(a + c.now) * 5), Math.round(y + Math.sin(a + c.now) * 2), 1, 1);
  } else if (p.potion) {
    const col = POTIONS[p.potion].col, bob = Math.round(Math.sin(c.now * 3 + p.id));
    c.lit.fillStyle = '#5a4a32';
    c.lit.fillRect(Math.round(x), Math.round(y - 7 + bob), 1, 1);
    c.lit.fillStyle = col;
    c.lit.fillRect(Math.round(x - 1), Math.round(y - 6 + bob), 3, 4);
    c.glow.fillStyle = col;
    c.glow.fillRect(Math.round(x), Math.round(y - 5 + bob), 1, 1);
  }
  c.lit.globalAlpha = c.glow.globalAlpha = 1;
}

/** A thrown flask, turning over in its arc. */
export function drawFlask(c: Ctx, b: Bolt, x: number, y: number): void {
  const k = b.t / b.flight, up = Math.sin(Math.PI * k) * 20, col = POTIONS[b.potion ?? 'oil'].col;
  c.lit.fillStyle = 'rgba(8,6,12,0.55)';
  c.lit.fillRect(Math.round(x - 1), Math.round(y), 3, 1);
  c.lit.fillStyle = col;
  c.lit.fillRect(Math.round(x - 1), Math.round(y - 5 - up), 2, 3);
  c.glow.fillStyle = col;
  c.glow.fillRect(Math.round(x), Math.round(y - 5 - up), 1, 1);
}

/** Smoke: soft grey puffs, drifting and thinning as it goes. */
export function drawSmoke(c: Ctx, s: Smoke, x: number, y: number, r: number, now: number): void {
  const left = Math.min(1, (s.until - now) / 1.5);
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4 + now * 0.35, d = r * (0.15 + ((i * 37) % 10) / 14), size = 4 + ((i * 7) % 4);
    const px = Math.round(x + Math.cos(a) * d), py = Math.round(y + Math.sin(a) * d * 0.55 - 6 - ((now * 3 + i) % 4));
    c.lit.globalAlpha = 0.35 * left;
    c.lit.fillStyle = i % 2 ? '#c8c2d4' : '#a8a2b4';
    c.lit.beginPath();
    c.lit.arc(px, py, size, 0, Math.PI * 2);
    c.lit.fill();
  }
  c.lit.globalAlpha = 1;
}

/** A butcher's coal on the floor: a coal that pulses and drifts sparks upward (a Healer can take it). */
export function drawCoal(c: Ctx, m: Coal, x: number, y: number): void {
  const fade = Math.min(1, m.life / 4), pulse = Math.floor(c.now * 6 + m.id) % 2;
  c.glow.globalAlpha = fade;
  c.glow.fillStyle = pulse ? '#ffd27a' : '#ff9a3c';
  c.glow.fillRect(Math.round(x - 1), Math.round(y - 3), 3, 2);
  c.glow.fillStyle = '#ffffff';
  c.glow.fillRect(Math.round(x), Math.round(y - 3), 1, 1);
  for (let i = 0; i < 3; i++) {
    const t = (c.now * 0.8 + i / 3 + m.id * 0.17) % 1;
    c.glow.globalAlpha = fade * (1 - t);
    c.glow.fillStyle = '#ffb35a';
    c.glow.fillRect(Math.round(x + Math.sin(t * 6 + i * 2) * 2), Math.round(y - 4 - t * 14), 1, 1);
  }
  c.glow.globalAlpha = 1;
}

/** A chest: wood and iron; rattling with light leaking from the seams while it opens; lid up after; chains on a chained one. */
export function drawChest(c: Ctx, ch: Chest, x: number, y: number): void {
  const opening = ch.state === 'opening', open = ch.state === 'open', col = TIERS[ch.tier].col;
  const jx = opening ? Math.round(Math.sin(c.now * 40) * (ch.t > 0.6 ? 1 : 0.5)) : 0, bx = Math.round(x - 7 + jx), by = Math.round(y - 9);
  c.lit.fillStyle = 'rgba(8,6,12,0.5)';
  c.lit.fillRect(bx, by + 9, 14, 2);
  c.lit.fillStyle = '#5a3d22';
  c.lit.fillRect(bx, by + 3, 14, 7);
  c.lit.fillStyle = '#3a2614';
  c.lit.fillRect(bx, by + 6, 14, 1);
  c.lit.fillStyle = '#7a828c';
  c.lit.fillRect(bx + 1, by + 3, 1, 7);
  c.lit.fillRect(bx + 12, by + 3, 1, 7);
  if (open) {
    c.lit.fillStyle = '#6b4a2b';
    c.lit.fillRect(bx, by - 3, 14, 3);
    c.glow.globalAlpha = 0.5;
    c.glow.fillStyle = col;
    c.glow.fillRect(bx + 2, by + 2, 10, 1);
    c.glow.globalAlpha = 1;
  } else {
    c.lit.fillStyle = '#6b4a2b';
    c.lit.fillRect(bx, by, 14, 3);
    c.lit.fillStyle = '#d4a537';
    c.lit.fillRect(bx + 6, by + 3, 2, 2);
  }
  if (opening) {
    // Light leaking from the seam, brighter as the lid gives; hungry light pulses dark.
    const k = ch.t / 1.2, pulse = ch.tier === 'hungry' ? 0.5 + 0.5 * Math.sin(c.now * 7) : 1;
    c.glow.globalAlpha = (0.4 + 0.6 * k) * pulse;
    c.glow.fillStyle = col;
    c.glow.fillRect(bx, by + 3, 14, 1);
    for (let i = 0; i < 3; i++) c.glow.fillRect(bx + 2 + i * 4 + jx, by + 2 - Math.round(((c.now * 20 + i * 7) % 6) * k), 1, 1);
    c.glow.globalAlpha = 1;
  }
  if (ch.chained && ch.state === 'shut') {
    c.lit.fillStyle = '#9aa3ad';
    for (let i = 0; i < 7; i++) c.lit.fillRect(bx + i * 2, by + 1 + i, 1, 1), c.lit.fillRect(bx + 13 - i * 2, by + 1 + i, 1, 1);
  }
}

/** Gear lying on the floor: a ring of its tier's colour round it, a shaft of light from blue up, and the thing itself. */
export function drawDrop(c: Ctx, d: Drop, x: number, y: number): void {
  const fade = Math.min(1, d.life / 5), col = TIERS[d.item.quality].col, step = TIER_ORDER.indexOf(d.item.quality), kind = d.item.slot ?? 'weapon';
  c.lit.globalAlpha = c.glow.globalAlpha = fade;
  const bob = Math.round(Math.sin(c.now * 3 + d.id) * 1);
  c.glow.fillStyle = col;
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    if ((i + Math.floor(c.now * 8)) % 4) c.glow.fillRect(Math.round(x + Math.cos(t) * 6), Math.round(y + Math.sin(t) * 2.5), 1, 1);
  }
  if (step >= 2) {
    c.glow.globalAlpha = fade * (0.2 + 0.08 * step + 0.1 * Math.sin(c.now * (d.item.quality === 'hungry' ? 2 : 5)));
    c.glow.fillRect(Math.round(x), Math.round(y - 20 - step * 4), 1, 18 + step * 4);
    c.glow.globalAlpha = fade;
  }
  if (kind === 'weapon') line(c.lit, x - 4, y - 3 + bob, -0.6, 0, 9, KIT_COL[d.item.kit ?? 'sword'] ?? '#dfe6ec', 2);
  else if (kind === 'armor') (c.lit.fillStyle = d.item.armor === 'heavy' ? '#9aa3ad' : d.item.armor === 'medium' ? '#7a828c' : '#6b4a2b'), c.lit.fillRect(Math.round(x - 3), Math.round(y - 6 + bob), 6, 5);
  else (c.glow.fillStyle = col), c.glow.fillRect(Math.round(x - 1), Math.round(y - 5 + bob), 3, 1), c.glow.fillRect(Math.round(x - 1), Math.round(y - 3 + bob), 3, 1), c.glow.fillRect(Math.round(x - 2), Math.round(y - 4 + bob), 1, 1), c.glow.fillRect(Math.round(x + 2), Math.round(y - 4 + bob), 1, 1);
  if (Math.floor(c.now * 2 + d.id) % 3 === 0) (c.glow.fillStyle = '#ffffff'), c.glow.fillRect(Math.round(x + 2), Math.round(y - 7 + bob), 1, 1);
  c.lit.globalAlpha = c.glow.globalAlpha = 1;
}
