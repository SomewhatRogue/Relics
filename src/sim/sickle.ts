/**
 * The chain sickle's spin (docs/design/chain-sickle.md; numbers shared/sickle.ts): while its hold is held the
 * chain whirls round the Rogue, and every SICKLE_SPIN.every s it cuts every goblin within reach for a little,
 * more as the spin builds, bleeding once it's full. Not yet full, the first cut that lands stops the spin
 * (start it at a distance and walk in). Up against a wall the chain catches and cuts nothing.
 * The throw on letting go is the hook's (sim/spearchain.ts, sim/hook.ts).
 */
import { rollDmg } from '../shared/dmgrange';
import { collide } from '../shared/arena';
import { CHARGE, SKEWER, WEAPONS } from '../shared/tuning';
import { SICKLE_SPIN } from '../shared/sickle';
import { damage, isDead } from './damage';
import type { World } from './elements';
import { chargeFull } from './hero';
import type { Hero } from './types';

/** Is this hero whirling a chain sickle now? */
export const spinning = (h: Hero) => h.act === 'charge' && !!WEAPONS[h.weapon]?.heavy.sickle;

/** How far the spin has built, 0 to 1. */
export const spinBuild = (h: Hero) => Math.min(1, (h.actT + CHARGE.start) / chargeFull(WEAPONS[h.weapon], h));

/** How far the chain reaches now: short as the spin starts, out to its full reach as it builds. */
export const spinReach = (h: Hero) => SICKLE_SPIN.r0 + (SICKLE_SPIN.r - SICKLE_SPIN.r0) * spinBuild(h);

/** A wall close by on any side catches the chain. */
export function caught(h: Hero): boolean {
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, want = { x: h.x + Math.cos(a) * SICKLE_SPIN.catch, y: h.y + Math.sin(a) * SICKLE_SPIN.catch }, p = { ...want };
    collide(p, 0.05);
    if (Math.hypot(p.x - want.x, p.y - want.y) > 1e-3) return true;
  }
  return false;
}

/** Each tick: every spinning chain cuts round its Rogue when its next cut is due. */
export function stepSpins(heroes: Hero[], w: World): void {
  for (const h of heroes) {
    if (!spinning(h)) {
      h.spinNext = undefined;
      continue;
    }
    if (h.spinNext === undefined) h.spinNext = w.now + SICKLE_SPIN.every;
    if (w.now < h.spinNext) continue;
    h.spinNext = w.now + SICKLE_SPIN.every;
    if (caught(h)) {
      w.ev.push({ k: 'chainsnag', x: h.x, y: h.y });
      continue;
    }
    const k = spinBuild(h), full = k >= 0.999, n = Math.round(SICKLE_SPIN.dmg + (SICKLE_SPIN.top - SICKLE_SPIN.dmg) * k);
    const reach = spinReach(h);
    w.ev.push({ k: 'chainspin', x: h.x, y: h.y, r: reach });
    let landed = false;
    for (const e of w.enemies) {
      if (isDead(e) || e.act === 'carried') continue;
      const d = Math.hypot(e.x - h.x, e.y - h.y);
      if (d > reach + e.radius) continue;
      e.lastBy = h.id;
      // The bleed only once the spin is fully going (Kyle, 2026-11-23: it was too strong).
      if (full && e.kind !== 'nest') {
        if ((e.bleedUntil ?? 0) <= w.now) e.bleedNext = w.now + SKEWER.every;
        e.bleedUntil = Math.max(e.bleedUntil ?? 0, w.now + SICKLE_SPIN.bleed);
      }
      // (No shove and no flinch: the spin cuts, it doesn't stagger. Kyle, 2026-11-23.)
      damage(e, Math.round(n * rollDmg(h)), w.now, w.ev, { src: 'sickle' });
      landed = true;
    }
    // Not yet up to speed, the chain stops on what it hits: one cut, and you start the spin again (Kyle,
    // 2026-11-23: "start it at a distance and come in").
    if (landed && !full) Object.assign(h, { act: 'idle', actT: 0, spinNext: undefined }), w.ev.push({ k: 'chainstop', x: h.x, y: h.y });
  }
}
