/**
 * The Haulier's working once a tick, before the goblins move (docs/design/deep-bosses.md; numbers
 * shared/haultune.ts, the kit's shared/bosstune.ts): the fight begins when it sees you; the rest it takes
 * between blows (HAULIER.pauseBetween, quicker in phase 2); a shove whose wind-up is out sends its cart
 * (sim/haulcarts.ts); the carts and the gear; and below HAULIER.phase2 of its health, phase 2: a roar
 * (nothing landing either way), the plate off for good (`bare`), and HAULIER.adds.n small ones out of the
 * adit every HAULIER.adds.every s.
 */
import { BOSS, HAULIER as H, TICK } from '../shared/tuning';
import { currentMap } from '../shared/arena';
import { isDead } from './damage';
import { forget, type BossBook } from './bosskit';
import { haulState, nearestCart, sendCart, standing, stepCarts, type HaulState } from './haulcarts';
import { hitHero, downIfDead } from './combat';
import { OWN_KIT } from './enemies';
import { slickId } from './oil';
import { inSparks } from './sparkshape';
import type { World } from './elements';
import type { Enemy } from './types';

export function stepHaulBook(bk: BossBook, w: World, spawn: (x: number, y: number) => Enemy): void {
  const now = w.now, e = w.enemies.find((x) => x.boss?.who === 'haulier');
  if (!e || isDead(e)) return;
  const b = e.boss!, st = haulState(bk);
  st.props = w.props;
  forget(bk, now);
  if (bk.started < 0 && e.alert) {
    bk.started = now;
    b.rotAt = now;
    // (Its first blow when it's seen you, not a goblin's slow start.)
    e.cooldown = Math.min(e.cooldown, 0.6);
  }
  // Its rest between blows is its own (the kit's pause is the Doorkeepers').
  if (e.attack) st.was = true;
  // Phase 2: straight on after a leap or an overhead (the chain: shared/haultune.ts).
  else if (st.was) (st.was = false), (e.cooldown = b.phase === 2 && b.move && H.chain.includes(b.move) ? H.chainPause : H.pauseBetween / (b.phase === 2 ? H.faster : 1));
  // Below the line: phase 2 (not through a stagger, a knock down, nor as a blow lands).
  if (b.phase === 1 && e.hp <= e.maxHp * H.phase2 && b.stagUntil <= now && b.downUntil <= now && !(e.attack && e.attack.t >= e.attack.windup)) {
    bk.phase = 2;
    Object.assign(e, { attack: null, act: 'chase', actT: 0, kvx: 0, kvy: 0, crackUntil: -9, cracked: false });
    Object.assign(b, { phase: 2, rot: 0, rotAt: now + BOSS.roar, roarUntil: now + BOSS.roar, bare: true, move: undefined });
    w.ev.push({ k: 'roar', x: e.x, y: e.y });
    w.ev.push({ k: 'bare', x: e.x, y: e.y });
    adds(st, w, spawn, now);
  }
  if (b.phase === 2 && now >= st.nextAdds) adds(st, w, spawn, now);
  shoveGo(st, e, w);
  leapLand(e, w);
  sparksFall(e, w);
  stepCarts(st, e, w);
}

/** The leap's wind-up about to end: it comes down where the circle is (the blow lands there as usual). */
function leapLand(e: Enemy, w: World): void {
  const a = e.attack;
  if (!a || (a.boss as string | undefined) !== 'leap' || a.t + TICK * 1.5 < a.windup) return;
  if (Math.hypot(e.x - a.cx, e.y - a.cy) < 0.05) return;
  Object.assign(e, { x: a.cx, y: a.cy, kvx: 0, kvy: 0 });
  w.ev.push({ k: 'haulleap', x: e.x, y: e.y });
}

/** The crank's wind-up about to end: the sparks come down on each spot, and each goes on burning a while. */
function sparksFall(e: Enemy, w: World): void {
  const a = e.attack, b = e.boss!, spots = b.sparks;
  if (!a || (a.boss as string | undefined) !== 'crank' || !spots?.length || a.t + TICK * 1.5 < a.windup) return;
  b.sparks = undefined;
  const dmg = Math.round(H.sparks.dmg * (e.harm ?? 1));
  for (const p of spots) {
    for (const h of w.heroes) {
      if (h.act === 'down' || h.out || (h.z ?? 0) !== 0 || !inSparks(p, h)) continue;
      const blow = { ...a, kind: 'slam' as const, aimed: h.id, dmg, knock: H.sparks.knock, unblockable: true, ox: p.x, oy: p.y, cx: p.x, cy: p.y, radius: H.sparks.r, hit: [], done: true };
      hitHero(e, blow, h, w.now, w.ev, w.heroes);
      downIfDead(h, w.ev);
    }
    OWN_KIT.slicks.push({ id: slickId(), x: p.x, y: p.y, r: H.sparks.r, until: w.now + H.sparks.burn + 0.5, lit: w.now, burn: H.sparks.burn });
    w.ev.push({ k: 'sparks', x: p.x, y: p.y });
  }
}

/** A shove whose wind-up is about to end: the cart goes (and the blow itself does nothing, no run, no hit). */
function shoveGo(st: HaulState, e: Enemy, w: World): void {
  const a = e.attack;
  if (!a || (a.boss as string | undefined) !== 'shove') return;
  if (a.kind !== 'charge' || a.hit?.includes('sent') || a.t + TICK * 1.5 < a.windup) return;
  a.hit = ['sent', ...w.heroes.map((h) => h.id)];
  a.range = 0;
  a.radius = 0;
  const own = w.props.find((p) => p.id === st.shove);
  const cart = own && standing(own) ? own : nearestCart(w.props, e.x, e.y, H.shoveReach);
  if (cart) sendCart(st, cart, 'haulier', w.ev);
}

/** HAULIER.adds.n small ones out of the adit, and the next batch HAULIER.adds.every s on. */
function adds(st: HaulState, w: World, spawn: (x: number, y: number) => Enemy, now: number): void {
  st.nextAdds = now + H.adds.every;
  const adits = currentMap().adits ?? [];
  if (!adits.length) return;
  for (let i = 0; i < H.adds.n; i++) {
    const a = adits[i % adits.length], s = spawn(a.x + 0.8, a.y + (i - (H.adds.n - 1) / 2) * 0.8);
    s.alert = true;
  }
}
