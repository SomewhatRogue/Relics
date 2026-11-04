/**
 * This frame's lights from the room, the same sources the 2D scene lights (scene.ts), in tiles: houses
 * on fire, smouldering ruins, open chests in their tier's colour, coals, blessed ground, the heroes'
 * lanterns underground, a Cleric's censer, a Mage's hand, a telegraph's red as it winds up, javelins,
 * spells, burning or frozen goblins, and the flashes of big hits (fx.ts).
 */
import type { ArenaRoom } from '../../sim/room';
import { nestEmber } from '../nestfire';
import { burningAt } from '../../shared/blaze';
import { TIERS, WEAPONS } from '../../shared/tuning';
import { lightsHolder } from '../heldkits';
import { tapEl, tapGlow } from '../magetap';
import { EL_LIGHT, heldEl } from '../palette';
import { torchIn } from '../daytime';
import type { Fx } from '../fx';
import { OX, OY, PX } from '../world';
import type { Lerp } from './actors3d';
import type { L3 } from './lights3d';
import { skillLights3 } from './skills3d';
import { wallLights } from '../walldraw';

const tint = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
/** A 2D light's reach (pixels) as tiles in 3D (a little further, since 3D lights sit up off the floor). */
const R = (px: number) => (px / PX) * 1.15 + 0.6;

export function roomLights(room: ArenaRoom, fx: Fx, lerp: Lerp, out: L3[]): void {
  const map = room.map, tk = torchIn(map.theme), add = (x: number, y: number, z: number, r: number, i: number, c: [number, number, number], f = 0) => out.push({ x, y, z, r, i, c, f });
  for (const b of map.blocks) {
    const mx = b.x + b.w / 2, mz = b.y + b.h / 2;
    if (((b.burning ?? -1) >= 0 || b.smoulder || b.fate === 'burning') && !b.ruined) add(mx, 2.4, mz + 0.6, R(70 + b.w * 10), 1.2, [1, 0.55, 0.25], 13);
    if (b.ruined) add(mx, 0.8, mz, R(22 + b.w * 3), 0.35, [1, 0.35, 0.15], 7);
  }
  // A house on fire inside: each patch alight (shared/blaze.ts).
  if (map.blaze) for (const a of burningAt(map.blaze, room.time)) add(a.x + a.w / 2, 0.9, a.y + a.h / 2, R(50), 0.9, [1, 0.55, 0.25], 11);
  for (const c of room.chests) if (c.state !== 'shut') add(c.x, 0.8, c.y + 0.2, c.state === 'opening' ? R(16 + 30 * (c.t / 1.2)) : R(26), c.state === 'opening' ? 0.4 + 0.5 * (c.t / 1.2) : 0.35, tint(TIERS[c.tier].col));
  for (const m of room.coals) add(m.x, 0.6, m.y, R(26), 0.6 * Math.min(1, m.life / 4), [1, 0.6, 0.28], 7);
  for (const z of room.zones) if (!z.kind) add(z.x, 0.8, z.y, z.r * 1.5 + 0.5, 0.8 * Math.min(1, (z.until - room.time) / 1.2), [1, 0.85, 0.5]);
  for (const h of room.heroes) {
    const [x, y] = lerp('h:' + h.id, h.x, h.y), up = (h.z ?? 0) * 0.75;
    if (!map.theme.day) add(x, 1.6 + up, y + 0.3, map.theme.moon ? R(44) : R(90), (map.theme.moon ? 0.35 : 0.7) * tk, [0.95, 0.8, 0.6]);
    if (h.glow > 0 && WEAPONS[h.weapon].cls === 'HEALER') add(x, 0.8 + up, y, R(20 + h.glow * 3), 0.25 + h.glow * 0.04, [1, 0.62, 0.3], 9);
    // A Mage's quick cast lights the hand as it gathers and flashes as it goes (../magetap.ts).
    const tg = tapGlow(h);
    if (tg > 0) add(x + h.fx * 0.5, 1.1 + up, y + h.fy * 0.5 + 0.2, R(22 + 18 * tg), 0.9 * tg, EL_LIGHT[tapEl(h)]);
    if (lightsHolder(h.weapon)) add(x, 1.2 + up, y + 0.2, R(h.primed ? 30 : 22), h.primed ? 0.55 : 0.4, WEAPONS[h.weapon].cls === 'HEALER' ? [1, 0.75, 0.4] : EL_LIGHT[heldEl(h)]);
  }
  for (const e of room.enemies) {
    const a = e.attack;
    if (a && a.t < a.windup) {
      const k = a.t / a.windup, round = a.kind === 'slam' || a.kind === 'hex', ax = round ? a.cx : a.ox + a.dx * a.range * 0.5, ay = round ? a.cy : a.oy + a.dy * a.range * 0.5;
      add(ax, 0.6, ay, R(40), 0.35 * k, [1, 0.25, 0.15]);
      if (a.kind === 'hex') add(e.x, 1.3, e.y, R(18 + 22 * k), 0.3 + 0.5 * k, [0.55, 1, 0.3]);
    }
    const ember = nestEmber(e);
    if (ember) add(e.x, 0.5, e.y, R(24), ember, [1, 0.55, 0.25], 9);
    if (e.act === 'dead') continue;
    const [x, y] = lerp('e:' + e.id, e.x, e.y);
    if (e.burnUntil > room.time) add(x, 1, y, R(e.ashAt ? 70 : 44), e.ashAt ? 0.95 : 0.75, [1, 0.55, 0.25], 17);
    else if (e.frozenUntil > room.time) add(x, 1, y, R(26), 0.4, [0.6, 0.85, 1]);
    // Poisoned by a dart (sim/venom.ts): a sickly green about it.
    if ((e.venom ?? 0) > 0 && (e.venomUntil ?? 0) > room.time) add(x, 0.8, y, R(22 + 6 * e.venom!), 0.45, [0.55, 1, 0.3]);
  }
  for (const j of room.javelins) add(j.x, 0.9, j.y, j.state === 'fly' ? R(34) : R(14), j.state === 'fly' ? 0.6 : 0.3 * Math.min(1, j.life), [0.55, 0.85, 1]);
  for (const b of room.bolts) {
    if (b.kind === 'arrow' || b.kind === 'knife' || b.kind === 'dart' || b.kind === 'net' || b.kind === 'bolt' || b.kind === 'flask') continue;
    if (b.kind === 'smite') add(b.x, 0.8, b.y, R(40), 0.9 * Math.min(1, b.t / b.flight), [1, 0.9, 0.6]);
    else if (b.kind === 'lodestone') add(b.x, 0.8, b.y, b.state === 'well' ? R(50) : R(12), 0.5, b.el ? EL_LIGHT[b.el] : [1, 0.85, 0.55]);
    else add(b.x, 0.7, b.y, b.kind === 'orb' ? R(50) : R(30), 0.7, EL_LIGHT[b.el]);
  }
  skillLights3(room, out);
  out.push(...wallLights(room, (x, z, r, i, c) => ({ x, y: 0.8, z, r, i, c })));
  for (const f of fx.flashes) add((f.x - OX) / PX, 0.9, (f.y - OY) / PX + 0.4, R(f.r), f.i * (f.life / f.max), f.c);
}
