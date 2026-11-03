/**
 * Spiders' turns (numbers: shared/spiders.ts). A small one skitters in on a zigzag, circles while it
 * gathers itself, and pounces along the short line it shows you; the bite poisons (sim/combat.ts). The
 * brood mother lumbers after you, bites up close and, from further off, spits a glob at where you
 * stand (a striped circle on the floor: the glob lands there and leaves a puddle). Nests wake when a
 * hero comes near, then hatch a wave every few seconds until they're destroyed.
 */
import { BROOD, NEST, SPIDER, nestGap } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import { shove } from './bodies';
import { isDead } from './damage';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

/**
 * A spider or the brood mother, awake and facing (ux, uy) toward hero `t`, `d` away. `pace`: its speed
 * after chills, nets and the like; `level`: on the hero's level.
 */
export function hunt(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, pace: number, level: boolean, rng: Rng, now: number, dt: number, ev: FightEvent[]): void {
  if (e.kind === 'brood') return mother(e, t, d, ux, uy, facing, pace, level, rng, dt, ev);
  if (level && d <= SPIDER.reach && e.cooldown <= 0 && facing > 0.7 && e.snareUntil <= now) return begin(e, 'pounce', SPIDER.pounce, t, ev);
  // Close and still gathering itself: it circles you rather than piling in.
  const close = d < SPIDER.reach * 0.75 && e.cooldown > 0, dir = e.id % 2 ? 1 : -1;
  if (close) return walk(e, -uy * dir + ux * 0.15, ux * dir + uy * 0.15, pace * 0.8, dt);
  const side = Math.sin(now * SPIDER.zig * Math.PI * 2 + e.id * 1.7) * SPIDER.skitter;
  walk(e, ux - uy * side, uy + ux * side, pace * Math.max(0.3, facing), dt);
}

function mother(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, pace: number, level: boolean, rng: Rng, dt: number, ev: FightEvent[]): void {
  if (level && d <= BROOD.reach && e.cooldown <= 0 && facing > 0.75) return begin(e, 'bite', BROOD.bite, t, ev);
  if (d >= BROOD.spitFrom && d <= BROOD.spit.range! && e.cooldown <= 0 && facing > 0.8) {
    if (rng.next() >= BROOD.spitChance) return void (e.cooldown = 0.5);
    begin(e, 'spit', BROOD.spit, t, ev);
    // Lobbed at where you stand now: the circle on the floor is where it lands.
    if (e.attack) (e.attack.cx = t.x), (e.attack.cy = t.y);
    return;
  }
  // In spitting range and gathering the next glob: she keeps off and edges round you instead of closing.
  if (d > BROOD.spitFrom + 1 && d <= BROOD.spit.range! - 0.5) return walk(e, -uy, ux, pace * 0.35, dt);
  if (d > BROOD.reach * 0.8) walk(e, ux, uy, pace * Math.max(0.2, facing), dt);
}

/** A nest's spiders a wave in a party of `party` (shared/nests.ts places it with NEST.wave). */
export const waveFor = (party: number) => NEST.wave + Math.round(NEST.party * Math.max(0, party - 1));

/**
 * Nests: asleep until a hero comes within NEST.wake (or it's hit), then a wave NEST.first seconds later
 * and one every nestGap(party) after, while fewer than its cap of its own spiders are alive. When the
 * last of a wave dies, the next waits NEST.rest more at least. A nest alight (sim/torch.ts) hatches
 * nothing. `spawn` adds a spider to the room and hands it back.
 */
export function stepNests(enemies: Enemy[], heroes: Hero[], now: number, ev: FightEvent[], spawn: (x: number, y: number) => Enemy): void {
  const party = heroes.filter((h) => h.id !== 'squire').length;
  for (const n of enemies) {
    if (n.kind !== 'nest' || isDead(n) || n.ashAt) continue;
    if ((n.nextWave ?? -1) < 0) {
      const near = heroes.some((h) => h.act !== 'down' && h.id !== 'squire' && Math.hypot(h.x - n.x, h.y - n.y) <= NEST.wake);
      if (near || n.alert) (n.alert = true), (n.nextWave = now + NEST.first);
      continue;
    }
    const mine = enemies.filter((e) => e.nest === n.id && !isDead(e)).length;
    // The wave it sent is all dead: a breather before the next.
    if (!mine && n.had) n.nextWave = Math.max(n.nextWave!, now + NEST.rest);
    n.had = mine;
    if (now < n.nextWave!) continue;
    n.nextWave = now + nestGap(party);
    const wave = n.wave ?? NEST.wave, cap = NEST.cap + (wave - NEST.wave) * 2, k = Math.min(wave, cap - mine);
    if (k <= 0) continue;
    ev.push({ k: 'hatch', x: n.x, y: n.y });
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2 + now, r = n.radius + SPIDER.radius + 0.1;
      const s = spawn(n.x + Math.cos(a) * r, n.y + Math.sin(a) * r * 0.8);
      Object.assign(s, { nest: n.id, alert: true, cooldown: 0.6 + i * 0.15, fx: Math.cos(a), fy: Math.sin(a) });
      shove(s, Math.cos(a), Math.sin(a), 1.4, s.weight);
    }
    n.had = mine + k;
  }
}
