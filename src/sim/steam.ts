/**
 * Steam clouds (numbers: shared/worldfx.ts STEAM_CLOUD; Kyle, 2026-11-05). Fire on ice melts it to steam
 * (sim/worldfire.ts); fire landing on a goblin standing in water goes out on it and steams instead (the
 * water's answer to fire, as storm owns it), and a burning goblin wading in is put out the same way. The
 * cloud is one of the room's smokes with `steam` set, so it hides whoever is in it from goblins by the
 * smoke's own rules (sim/flasks.ts, sim/smokebomb.ts), and both views draw it white. It scalds a little:
 * goblins STEAM_CLOUD.dmg, friends STEAM_CLOUD.heroDmg, every STEAM_CLOUD.every s. Not the old STEAM, the
 * burst when fire meets frost on a goblin (sim/elements.ts): that stays as it was.
 */
import { STEAM_CLOUD } from '../shared/tuning';
import { downIfDead } from './combat';
import { damage, isDead } from './damage';
import type { World } from './elements';
import { meltAt, type WorldFx } from './ice';
import { waterOf } from './pools';
import type { Enemy, FightEvent } from './types';

/** A cloud rises at (x, y), `r` round (`by` whose fire): one near keeps going instead. */
export function steamAt(fx: WorldFx | undefined, x: number, y: number, r: number, by: string, now: number, ev: FightEvent[]): void {
  if (!fx) return;
  const near = fx.smokes.find((s) => s.steam && s.until > now && Math.hypot(s.x - x, s.y - y) <= (s.r ?? r) * STEAM_CLOUD.merge);
  if (near) return void (near.until = Math.max(near.until, now + STEAM_CLOUD.time));
  const mine = fx.smokes.filter((s) => s.steam);
  if (mine.length >= STEAM_CLOUD.max) fx.smokes.splice(fx.smokes.indexOf(mine[0]), 1);
  fx.smokes.push({ x, y, until: now + STEAM_CLOUD.time, r, steam: true, next: now + STEAM_CLOUD.every, by });
  ev.push({ k: 'steamup', x, y, r });
}

/** Fire landing on a goblin standing in water: it goes out as it lands, in a cloud. True if it did. */
export function douse(w: World, e: Enemy): boolean {
  if (!w.fx || waterOf(e) < 0) return false;
  e.burnUntil = 0;
  // (On ice, the ice under it goes too.)
  meltAt(w.fx, e.x, e.y, 0, w.now, w.ev);
  steamAt(w.fx, e.x, e.y, STEAM_CLOUD.r, e.lastBy, w.now, w.ev);
  return true;
}

/** Each tick: the clouds scald whoever is in them. */
export function stepSteam(w: World): void {
  const fx = w.fx;
  if (!fx) return;
  for (const s of fx.smokes) {
    if (!s.steam || s.until <= w.now || w.now < (s.next ?? 0)) continue;
    s.next = (s.next ?? w.now) + STEAM_CLOUD.every;
    const r = s.r ?? STEAM_CLOUD.r, inside = (b: { x: number; y: number }, pad = 0) => Math.hypot(b.x - s.x, b.y - s.y) <= r + pad;
    for (const e of w.enemies) {
      if (isDead(e) || e.act === 'carried' || e.under || !inside(e, e.radius)) continue;
      if (s.by) e.lastBy = s.by;
      damage(e, STEAM_CLOUD.dmg, w.now, w.ev, { tick: true, el: 'fire' });
    }
    for (const h of w.heroes) {
      if (h.act === 'down' || h.out || h.safeT || !inside(h)) continue;
      h.hp -= STEAM_CLOUD.heroDmg;
      w.ev.push({ k: 'hit', x: h.x, y: h.y, n: STEAM_CLOUD.heroDmg, heavy: false, on: 'hero', src: 'steam' });
      downIfDead(h, w.ev);
    }
  }
}
