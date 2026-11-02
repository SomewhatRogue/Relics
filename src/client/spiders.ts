/**
 * Drawing spiders, the brood mother, nests and puddles, from the room's state alone. Bodies pose in
 * parts like the goblins (foepose.ts, figure.ts): they crouch into the pounce and throw the front legs
 * at you. A nest's sacs swell and glow for the second before a wave hatches (NEST.swell, from its
 * `nextWave`). The pounce's lane and the glob's circle are drawn from the attack the room judges.
 */
import { NEST } from '../shared/tuning';
import type { Enemy, EnemyAttack, Puddle } from '../sim/types';
import { blit, ring, shadow, spin, stars, type Ctx } from './draw';
import { drawFigure, layout } from './figure';
import { scrapperPose } from './foepose';
import { jointed } from './joints';
import { BROOD_CUT, SPIDER_CUT, SPIDER_SPRITES as S } from './spidersprites';
import { OX, OY, PX } from './world';

/** A spider, the brood mother or a nest, at its feet (x, y) on screen; `t` the room's time. */
export function drawSpiderKind(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  if (e.kind === 'nest') return nest(c, e, x, y, t);
  const big = e.kind === 'brood';
  if (e.act === 'dead') {
    if (e.death === 'burst' || e.death === 'shatter') return;
    // On its back, legs curled, fading out.
    return spin(c, big ? S.broodA : S.spiderA, x, y - 3, Math.PI, Math.max(0, 1 - e.actT / e.actDur));
  }
  if (e.act === 'carried' || e.act === 'pinned') return spin(c, S.spiderA, x, y - 5, Math.atan2(e.fy, e.fx) + Math.sin(c.now * 14) * 0.4);
  const step = e.moving || (e.attack && e.attack.t >= e.attack.windup) ? Math.floor(c.now * (big ? 7 : 16) + e.id) % 2 : 0, up = e.fy < -0.55;
  const s = big ? (up ? S.broodUp : step ? S.broodB : S.broodA) : up ? (step ? S.spiderUpB : S.spiderUpA) : step ? S.spiderB : S.spiderA;
  const pz = scrapperPose(e, t, c.now);
  if (e.act === 'stunned') pz.oy += 1;
  shadow(c, x, y, big ? 10 : 4);
  if (big && e.hp < e.maxHp) ring(c, x, y, 11, '#e24b4a', e.hp / e.maxHp);
  const body = jointed(s, big ? BROOD_CUT : SPIDER_CUT), bx = x + pz.ox, by = y + pz.oy;
  layout(body, bx, by, e.fx < -0.2, pz);
  drawFigure(c, body, bx, by, pz);
  if (e.act === 'stunned') stars(c, bx, by - (big ? 16 : 9), 3, big ? 6 : 4);
}

function nest(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  if (e.act === 'dead') return blit(c, S.nestTorn, x, y + 2);
  const left = (e.nextWave ?? -1) - t, swell = e.nextWave! > 0 && left < NEST.swell ? 1 - left / NEST.swell : 0;
  const hit = t - e.hitAt < 0.09 ? 0.8 : 0, shake = swell > 0.5 ? Math.round(Math.sin(c.now * 50)) : 0;
  blit(c, S.nest, x + shake, y + 1, false, hit);
  if (e.hp < e.maxHp) ring(c, x, y, 12, '#e24b4a', e.hp / e.maxHp);
  // The sacs: a sickly glow in them as a wave comes, brighter till they split.
  if (!swell) return;
  const g = c.glow;
  g.fillStyle = '#9be040';
  for (const [sx, sy] of [[-5, -7], [4.5, -6.5], [-2, -9], [2.5, -9.5]]) {
    g.globalAlpha = 0.25 + 0.6 * swell * (0.7 + 0.3 * Math.sin(c.now * 18 + sx));
    g.fillRect(Math.round(x + sx + shake), Math.round(y + sy), 2, 1);
  }
  g.globalAlpha = 1;
}

/**
 * A spider's pounce: a short narrow lane the length of its leap, filling as it gathers itself. It can
 * be blocked, so no stripes; white while a parry would land.
 */
export function drawPounce(c: Ctx, a: EnemyAttack, cx: number, cy: number, now: boolean, pulse: number): void {
  const g = c.glow, prog = Math.min(1, a.t / a.windup), R = a.range * PX, W = Math.max(2, Math.round(a.radius * PX * 0.5));
  const ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, nx = -a.dy, ny = a.dx, dot = (d: number, w: number) => g.fillRect(Math.round(ox + a.dx * d + nx * w), Math.round(oy + a.dy * d + ny * w), 1, 1);
  // One colour and one alpha a pass (few state changes: a pack of these is on screen at once).
  g.fillStyle = now ? '#ffe8e0' : '#e23a30';
  g.globalAlpha = 0.9;
  for (let d = 3; d <= R; d++) dot(d, -W), dot(d, W);
  for (let w = -W; w <= W; w++) dot(R, w);
  g.globalAlpha = 0.5 * pulse;
  for (let d = 4; d < R * prog; d += 2) for (let w = -W + 1 + (d & 2 ? 1 : 0); w < W; w += 2) dot(d, w);
  g.globalAlpha = 1;
}

/** The glob's sign in its circle: drips falling into the middle, sickly green (the circle is foes.ts's). */
export function drawSpitSign(c: Ctx, a: EnemyAttack, cx: number, cy: number): void {
  const g = c.glow, k = Math.min(1, a.t / a.windup), ox = OX + a.cx * PX - cx, oy = OY + a.cy * PX - cy, R = a.radius * PX;
  g.fillStyle = '#9be040';
  g.globalAlpha = 0.4 + 0.5 * k;
  for (let i = 0; i < 8; i++) {
    const ang = i * 0.785 + a.t, r = R * 0.5 * (1 - k * 0.6);
    g.fillRect(Math.round(ox + Math.cos(ang) * r), Math.round(oy + Math.sin(ang) * r * 0.6), 1, 1);
  }
  // The glob coming down on it.
  g.fillRect(Math.round(ox), Math.round(oy - 40 * (1 - k)), 2, 2);
  g.globalAlpha = 1;
}

/** Poison on the floor: a dark green pool with a bright rim, bubbling, shrinking as it dries. */
export function drawPuddles(c: Ctx, puddles: Puddle[], cx: number, cy: number, t: number, now: number): void {
  for (const p of puddles) {
    const left = p.until - t, fade = Math.min(1, left / 1), R = p.r * PX * (0.7 + 0.3 * fade), ox = OX + p.x * PX - cx, oy = OY + p.y * PX - cy;
    for (let y = -Math.floor(R * 0.6); y <= R * 0.6; y++) {
      const half = Math.floor(R * Math.sqrt(Math.max(0, 1 - (y * y) / (R * R * 0.36))) + Math.sin(y * 1.7 + p.id) * 1.2);
      c.lit.fillStyle = '#1e3412';
      c.lit.fillRect(Math.round(ox - half), Math.round(oy + y), half * 2 + 1, 1);
      c.glow.fillStyle = '#6ab82a';
      c.glow.globalAlpha = 0.35 * fade;
      c.glow.fillRect(Math.round(ox - half), Math.round(oy + y), 1, 1);
      c.glow.fillRect(Math.round(ox + half), Math.round(oy + y), 1, 1);
    }
    c.glow.fillStyle = '#b8f060';
    for (let i = 0; i < 3; i++) {
      const b = (now * 0.9 + i * 0.37 + p.id * 0.13) % 1;
      c.glow.globalAlpha = (1 - b) * 0.8 * fade;
      c.glow.fillRect(Math.round(ox + Math.sin(i * 2.3 + p.id) * R * 0.5), Math.round(oy + Math.cos(i * 1.7) * R * 0.25 - b * 2), 1, 1);
    }
    c.glow.globalAlpha = 1;
  }
}
