/**
 * The frost holds, in the room (numbers: shared/spellbook.ts): the wand's cold blast (a cone from the
 * hand that freezes), the staff's frost nova (all round you, freezing), and the spellblade's shatter (a
 * blow that smashes the frozen and the chilled near you). Each is one shape, judged here and drawn from
 * the same numbers (client/fxspells.ts).
 */
import { COLD_BLAST, NOVA, SHATTER_BLOW, type Swing } from '../shared/tuning';
import { shove } from './bodies';
import { inArc } from './combat';
import { damage, frozen, isDead } from './damage';
import { afflict, chill, chilled, type World } from './elements';
import { interrupt } from './spells';
import type { Enemy, Hero } from './types';

/** Goblins this spell can reach: alive, not carried, on the hero's level. */
const open = (h: Hero, e: Enemy) => !isDead(e) && e.act !== 'carried' && (e.z ?? 0) === (h.z ?? 0);

/** Frost twice: frozen solid (fire on it is steam instead, as ever). */
function freezeSolid(w: World, e: Enemy, n: number): void {
  afflict(w, e, 'frost', n);
  if (!frozen(e, w.now) && chilled(e, w.now)) afflict(w, e, 'frost', n);
}

/** Struck by a freezing spell from (x, y): the damage, a shove away, broken off (on the flash), frozen. */
function freezeHit(w: World, h: Hero, e: Enemy, n: number, knock: number, x: number, y: number, breaks: boolean): void {
  const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1;
  e.lastBy = h.id;
  if (damage(e, n, w.now, w.ev, { heavy: true, flinch: 0.3, mult: true, el: 'frost', src: 'frost', dx: dx / d, dy: dy / d })) return;
  if (e.act !== 'pinned') shove(e, dx / d, dy / d, knock, e.weight);
  interrupt(e, false, breaks, h.id, w.now, w.ev);
  freezeSolid(w, e, n);
}

/** The wand's cold blast: a cone ahead, longer and wider on the flash. */
export function coldBlast(h: Hero, s: Swing, mult: number, w: World, wide: number): void {
  const big = h.perfect, range = (big ? COLD_BLAST.bigRange : COLD_BLAST.range) * wide, arc = big ? COLD_BLAST.bigArc : COLD_BLAST.arc;
  const n = Math.max(1, Math.round(s.dmg * COLD_BLAST.dmg * mult));
  w.ev.push({ k: 'spell', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el: 'frost', what: 'coldblast', r: range, big });
  for (const e of w.enemies) if (open(h, e) && inArc(h.x, h.y, h.fx, h.fy, e.x, e.y, range, arc, e.radius)) freezeHit(w, h, e, n, COLD_BLAST.knock, h.x, h.y, big);
}

/** The staff's frost nova: everything within `r` of you. */
export function nova(h: Hero, s: Swing, mult: number, w: World, r: number): void {
  const n = Math.max(1, Math.round(s.dmg * NOVA.dmg * mult));
  w.ev.push({ k: 'spell', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el: 'frost', what: 'nova', r, big: h.perfect });
  for (const e of w.enemies) if (open(h, e) && Math.hypot(e.x - h.x, e.y - h.y) <= r + e.radius) freezeHit(w, h, e, n, NOVA.knock, h.x, h.y, false);
}

/** The spellblade's shatter: a frozen goblin near you breaks for a lot, a chilled one for less, anything else is hurt and chilled. */
export function shatterBlow(h: Hero, s: Swing, mult: number, w: World, wide: number): void {
  const big = h.perfect, r = (big ? SHATTER_BLOW.bigR : SHATTER_BLOW.r) * wide;
  w.ev.push({ k: 'spell', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el: 'frost', what: 'shatter', r, big });
  for (const e of w.enemies) {
    if (!open(h, e) || Math.hypot(e.x - h.x, e.y - h.y) > r + e.radius) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1, ice = frozen(e, w.now), cold = chilled(e, w.now);
    e.lastBy = h.id;
    if (ice || cold) {
      // Brittle: it breaks, and the ice and the cold are gone.
      Object.assign(e, { frozenUntil: 0, chillUntil: 0 });
      w.ev.push({ k: 'shatter', x: e.x, y: e.y });
      if (damage(e, Math.round((ice ? SHATTER_BLOW.frozen : SHATTER_BLOW.chilled) * mult), w.now, w.ev, { heavy: true, how: 'shatter', el: 'frost', dx: dx / d, dy: dy / d })) continue;
    } else if (damage(e, Math.max(1, Math.round(s.dmg * SHATTER_BLOW.dmg * mult)), w.now, w.ev, { heavy: true, flinch: 0.3, mult: true, el: 'frost', dx: dx / d, dy: dy / d })) continue;
    if (e.act !== 'pinned') shove(e, dx / d, dy / d, SHATTER_BLOW.knock, e.weight);
    if (!ice && !cold) chill(w, e);
  }
}
