/**
 * Drawing goblins and dummies, with wind-ups that match their telegraphs: the butcher hauls his
 * cleaver back and chops, or leaps and comes down on the slam; scrappers pull the knife back and stab.
 */
import { GUARD } from '../shared/tuning';
import type { Enemy, EnemyAttack } from '../sim/types';
import { blit, ease, line, ring, shadow, smear, spin, stars, type Ctx } from './draw';
import { drawText } from './pixfont';
import { SPRITES, type Sprite } from './sprites';
import { OX, OY, PX } from './world';

function cleaver(c: Ctx, x: number, y: number, a: number): void {
  line(c.lit, x, y, a, 0, 4, '#4a3a2a');
  line(c.lit, x, y, a, 4, 11, '#9a968c', 3);
  line(c.lit, x + Math.cos(a + Math.PI / 2) * 1.5, y + Math.sin(a + Math.PI / 2) * 1.5, a, 5, 11, '#e0dcd0');
}

function butcher(c: Ctx, e: Enemy, x: number, y: number, flash: number): void {
  const fa = Math.atan2(e.fy, e.fx), side = e.fx >= -0.2 ? 1 : -1, a = e.attack;
  let ox = 0, oy = 0, squash = 1, arm = fa + side * 1.25, rise = 0;
  let trail: [number, number] | null = null;
  if (e.moving) oy = Math.floor(c.now * 5) % 2 ? -1 : 0;
  if (a && a.kind === 'cleave') {
    const half = ((a.arc / 2) * Math.PI) / 180, back = fa - side * (half + 1.5), end = fa + side * half;
    if (a.t < a.windup) {
      const p = ease(a.t / (a.windup * 0.8));
      arm = arm + (back - arm) * p;
      ox = -Math.round(e.fx * 2 * p);
      oy = -Math.round(1 + e.fy * 2 * p);
      if (a.t > a.windup * 0.8) ox += Math.round(Math.sin(c.now * 70));
    } else if (a.t < a.windup + a.active + 0.06) {
      const k = Math.min(1, (a.t - a.windup) / a.active);
      arm = back + (end - back) * k;
      trail = [back, arm];
      ox = Math.round(e.fx * 3);
      oy = Math.round(e.fy * 3);
    } else {
      arm = end;
      oy = 1;
      ox = Math.round(e.fx * 2);
    }
  } else if (a && a.kind === 'slam') {
    if (a.t < a.windup) {
      const p = a.t / a.windup;
      rise = Math.round(9 * ease(Math.min(1, p / 0.7)));
      arm = -Math.PI / 2 + Math.sin(c.now * 18) * 0.15 * (p > 0.7 ? 1 : 0);
    } else if (a.t < a.windup + a.active + 0.1) {
      squash = 0.84;
      arm = fa + side * 0.4;
    } else (arm = fa + side * 0.6), (oy = 1);
  }
  if (e.act === 'stunned') (ox = Math.round(Math.sin(c.now * 4) * 1.5)), (oy = 2), (arm = Math.PI / 2 + side * 0.4);
  if (e.act === 'flinch') (ox = -Math.round(e.fx * 2)), (oy = -Math.round(e.fy * 2));
  shadow(c, x, y, Math.max(5, 10 - rise / 2));
  const bx = x + ox, by = y + oy - rise, up = e.fy < -0.55;
  const hx = bx + side * 7, hy = by - 13 * squash;
  if (up) cleaver(c, hx, hy, arm);
  blit(c, up ? SPRITES.butcherUp : SPRITES.butcherDown, bx, by, e.fx < -0.2, flash, squash);
  if (!up) cleaver(c, hx, hy, arm);
  if (trail) smear(c.glow, hx, hy, trail[0], trail[1], 8, 15, '#ffb0a0');
  if (e.act === 'stunned') stars(c, bx, by - 25, 5, 8);
  if (a && a.unblockable && a.t < a.windup) drawText(c.glow, '!', Math.round(bx - 1), Math.round(by - 33 - (Math.floor(c.now * 6) % 2)), '#ffd040');
}

function scrapper(c: Ctx, e: Enemy, x: number, y: number, flash: number): void {
  // Thrown: tumbling end over end through the air.
  if (Math.hypot(e.kvx, e.kvy) > 6 && e.act !== 'carried') return spin(c, SPRITES.scrapper, x, y - 9, c.now * 22);
  if (e.act === 'carried' || e.act === 'pinned') {
    const wig = e.act === 'pinned' ? Math.sin(c.now * 14) * 0.25 : c.now * 14;
    spin(c, SPRITES.scrapper, x, y - 7, Math.atan2(e.fy, e.fx) + wig);
    return;
  }
  const a = e.attack;
  let ox = 0, oy = e.moving ? (Math.floor(c.now * 9) % 2 ? -1 : 0) : 0, reach = 3;
  if (a && a.t < a.windup) (ox = -Math.round(e.fx * 2)), (oy -= Math.round(e.fy * 2)), (reach = 1);
  else if (a && a.t < a.windup + a.active + 0.08) (ox = Math.round(e.fx * 3)), (oy += Math.round(e.fy * 3)), (reach = 7);
  if (e.act === 'flinch') (ox = -Math.round(e.fx * 2)), (oy = -1);
  if (e.act === 'stunned') (ox = Math.round(Math.sin(c.now * 5))), (oy = 1);
  shadow(c, x, y, 5);
  const bx = x + ox, by = y + oy, up = e.fy < -0.55, fa = Math.atan2(e.fy, e.fx);
  const knife = () => (e.bow ? bow(c, e, bx, by, fa) : line(c.lit, bx + Math.cos(fa) * reach, by - 6 + Math.sin(fa) * reach, fa, 0, 4, '#cfd6dc'));
  if (up) knife();
  blit(c, up ? SPRITES.scrapperUp : SPRITES.scrapper, bx, by, e.fx < -0.2, flash);
  if (!up) knife();
  if (e.act === 'stunned') stars(c, bx, by - 15, 3, 5);
}

/** An archer's short bow, the string pulled back through the wind-up, an arrow nocked. */
function bow(c: Ctx, e: Enemy, x: number, y: number, fa: number): void {
  const a = e.attack, pull = a && a.kind === 'shot' && a.t < a.windup ? Math.min(1, a.t / a.windup) : 0;
  const px = Math.cos(fa), py = Math.sin(fa), cx = x + px * 4, cy = y - 6 + py * 4;
  c.lit.fillStyle = '#6b4a2b';
  for (let i = -3; i <= 3; i++) c.lit.fillRect(Math.round(cx - py * i + px * (1 - Math.abs(i) / 3) * 1.5), Math.round(cy + px * i + py * (1 - Math.abs(i) / 3) * 1.5), 1, 1);
  const sx = cx - px * (pull * 3), sy = cy - py * (pull * 3);
  c.lit.fillStyle = '#d8d0bc';
  c.lit.fillRect(Math.round(sx), Math.round(sy), 1, 1);
  if (pull) line(c.lit, sx, sy, fa, 0, 6, '#a08a6a');
}

/** A body cut in two at the waist, lying in its two pieces. */
function halves(c: Ctx, s: Sprite, x: number, y: number, alpha: number): void {
  const g = c.lit, half = Math.round(s.h / 2);
  g.save();
  g.globalAlpha = alpha;
  g.translate(Math.round(x), Math.round(y - 4));
  g.rotate(-Math.PI / 2);
  g.drawImage(s.c, 0, half, s.w, s.h - half, -Math.round(s.w / 2), 0, s.w, s.h - half);
  g.restore();
  g.save();
  g.globalAlpha = alpha;
  g.translate(Math.round(x - half - 4), Math.round(y - 2));
  g.rotate(-Math.PI / 2 - 0.35);
  g.drawImage(s.c, 0, 0, s.w, half, -Math.round(s.w / 2), -half, s.w, half);
  g.restore();
  g.fillStyle = '#7a1010';
  g.fillRect(Math.round(x - 3), Math.round(y - 4), 3, 2);
}

export function drawEnemy(c: Ctx, e: Enemy, x: number, y: number): void {
  if (e.act === 'dead') {
    // Burst or shattered: nothing left but the stains. Otherwise the body, headless or burned.
    if (e.death === 'burst' || e.death === 'shatter') return;
    const big = e.kind === 'butcher';
    const s = e.death === 'behead' ? (big ? SPRITES.butcherHeadless : SPRITES.scrapperHeadless) : e.death === 'burn' ? (big ? SPRITES.butcherBurnt : SPRITES.scrapperBurnt) : big ? SPRITES.butcherDown : SPRITES.scrapper;
    // A corpse on a javelin hangs where it was pinned until it fades, just before the respawn.
    if (e.corpse) return spin(c, s, x, y - 7, Math.atan2(e.fy, e.fx) + 0.2, Math.min(1, (e.actDur - e.actT) / 0.8));
    const fade = Math.max(0, 1 - e.actT / e.actDur);
    // In two: the legs where it stood, the top half a little way off where it went over.
    if (e.death === 'halve') return halves(c, s, x, y, fade);
    spin(c, s, x, y - 4, -Math.PI / 2, fade);
    // Cut down: the slash across the chest.
    if (e.death === 'opened') (c.lit.globalAlpha = fade), line(c.lit, x - 2, y - 7, -0.5, 0, big ? 9 : 6, '#8a1010', 1), (c.lit.globalAlpha = 1);
    return;
  }
  const flash = c.now - e.hitAt < 0.09 ? 0.9 : 0;
  const hurt = e.hp < e.maxHp && (c.now - e.hitAt < 3 || e.hp < e.maxHp * 0.5);
  if ((e.kind === 'butcher' || e.kind === 'scrapper') && hurt) ring(c, x, y, e.kind === 'butcher' ? 11 : 6, '#e24b4a', e.hp / e.maxHp);
  if (e.kind === 'butcher') return butcher(c, e, x, y, flash);
  if (e.kind === 'scrapper' && e.feeding) {
    // Crouched at the dead: it leans in, worries at it, tears a piece back and chews; red flicks off.
    const cyc = (c.now * 1.3 + e.id * 0.37) % 1, f = e.fx >= 0 ? 1 : -1;
    const lean = cyc < 0.45 ? 2 + (Math.floor(c.now * 14) % 2) : cyc < 0.6 ? 0 : 1, shove = cyc < 0.45 ? f : cyc < 0.6 ? -f : 0;
    scrapper(c, e, x + shove, y + lean, flash);
    if (cyc >= 0.45 && cyc < 0.75) {
      const k = (cyc - 0.45) / 0.3;
      c.lit.fillStyle = '#9a1414';
      for (let i = 0; i < 3; i++) c.lit.fillRect(Math.round(x + f * (3 + i * 2 * k)), Math.round(y - 7 - 6 * k + i * k * 3 + 8 * k * k), 1, 1);
      c.lit.fillStyle = '#6a2a1a';
      c.lit.fillRect(Math.round(x + f * 4), Math.round(y - 8), 2, 1);
    }
    return;
  }
  if (e.kind === 'scrapper') return scrapper(c, e, x, y, flash), kit(c, e, x, y);
  const a = e.attack;
  shadow(c, x, y, 5);
  const wob = c.now - e.hitAt < 0.3 ? Math.round(Math.sin(c.now * 60)) : 0;
  blit(c, e.kind === 'dummy' ? SPRITES.dummy : SPRITES.swingDummy, x + wob, y, false, flash);
  if (e.kind === 'swingDummy') {
    let ang = Math.atan2(e.fy, e.fx);
    if (a) ang += a.t < a.windup ? -1.4 * ease(a.t / a.windup) : -1.4 + 2.8 * Math.min(1, (a.t - a.windup) / a.active);
    line(c.lit, x + 5, y - 10, ang, 0, 11, '#6b4a2b', 2);
    line(c.lit, x + 5, y - 10, ang, 9, 12, '#3a2a1a', 3);
  }
  if (e.act === 'stunned') stars(c, x, y - 18);
}

/**
 * The telegraph on the floor: a red shape that fills before the attack lands. While a parry
 * would land (the last `parryWindow` of the wind-up, from the player's kit), its edge and fill flash white.
 */
export function drawTelegraph(c: Ctx, a: EnemyAttack, cx: number, cy: number, parryWindow: number): void {
  if (a.t >= a.windup + a.active) return;
  const prog = Math.min(1, a.t / a.windup), g = c.glow;
  const now = !a.unblockable && a.windup - a.t <= parryWindow && a.t < a.windup;
  const pulse = 0.85 + 0.15 * Math.sin(c.now * 20);
  const fill = now ? '#ffe8e0' : a.kind === 'slam' ? '#e8501f' : '#e23a30';
  if (a.kind === 'slam') {
    const R = a.radius * PX, ox = OX + a.cx * PX - cx, oy = OY + a.cy * PX - cy;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x, y);
      if (d > R) continue;
      if (d > R - 1.2) {
        g.fillStyle = Math.floor((Math.atan2(y, x) + Math.PI) * 6) % 2 ? '#ffd040' : '#2a1408';
        g.globalAlpha = 0.95;
      } else {
        g.fillStyle = fill;
        g.globalAlpha = d < R * prog ? 0.5 * pulse : 0.16;
      }
      g.fillRect(Math.round(ox + x), Math.round(oy + y), 1, 1);
    }
  } else if (a.kind === 'shot') {
    // An arrow's line: a thin dotted sightline that fills in from the archer as it draws.
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, wide = prog > 0.6 || now ? 1 : 0;
    for (let d = 6; d <= R; d += 1) {
      const on = d < R * prog, px = Math.round(ox + a.dx * d), py = Math.round(oy + a.dy * d);
      if (!on && d % 3) continue;
      g.fillStyle = now ? '#ffffff' : fill;
      g.globalAlpha = on ? 0.85 * pulse : 0.35;
      g.fillRect(px, py, 1 + wide, 1 + wide);
    }
  } else if (a.kind === 'charge') {
    // The Stoker's charge: a broad striped lane the length of its run, filling as it winds up. Get out of it.
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, nx = -a.dy, ny = a.dx, W = Math.round(a.radius * PX);
    for (let d = 4; d <= R; d += 1) for (let w = -W; w <= W; w++) {
      const edge = Math.abs(w) >= W - 1, on = d < R * prog;
      if (!edge && (d + w) % 2) continue;
      g.fillStyle = edge ? (Math.floor(d / 3) % 2 ? '#ffd040' : '#2a1408') : fill;
      g.globalAlpha = (on ? 0.85 : 0.25) * (edge ? 1 : 0.6) * pulse;
      g.fillRect(Math.round(ox + a.dx * d + nx * w), Math.round(oy + a.dy * d + ny * w), 1, 1);
    }
  } else if (a.kind === 'draw') {
    // The Stoker's rake: a striped line (can't be blocked) that fills as it winds up. Get off it.
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, nx = -a.dy, ny = a.dx;
    for (let d = 6; d <= R; d += 1) for (let w = -1; w <= 1; w++) {
      const on = d < R * prog, px = Math.round(ox + a.dx * d + nx * w), py = Math.round(oy + a.dy * d + ny * w);
      g.fillStyle = w ? (Math.floor(d / 3) % 2 ? '#ffd040' : '#2a1408') : fill;
      g.globalAlpha = on ? 0.9 * pulse : 0.3;
      g.fillRect(px, py, 1, 1);
    }
  } else {
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, cos = Math.cos(((a.arc / 2) * Math.PI) / 180);
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x, y);
      if (d > R || d < 4) continue;
      const k = (x * a.dx + y * a.dy) / d;
      if (k < cos) continue;
      const edge = d > R - 1.2 || k < cos + 0.012;
      g.fillStyle = edge && now ? '#ffffff' : edge && a.unblockable ? (Math.floor(d / 2) % 2 ? '#ffd040' : '#2a1408') : edge ? '#e23a30' : fill;
      g.globalAlpha = edge ? 0.95 : now ? 0.55 : d < R * prog ? 0.48 * pulse : 0.16;
      g.fillRect(Math.round(ox + x), Math.round(oy + y), 1, 1);
    }
  }
  g.globalAlpha = 1;
}

/**
 * A goblin held overhead (x, y: the carrier's feet), kicking. While slamming, it goes up and comes
 * down in front over `k` (0..1) of the wind-up.
 */
export function drawHeld(c: Ctx, e: Enemy, x: number, y: number, fx: number, fy: number, slam: number): void {
  const s = e.kind === 'butcher' ? SPRITES.butcherDown : SPRITES.scrapper;
  if (slam > 0) {
    const up = slam < 0.6 ? 24 + 8 * (slam / 0.6) : 32 * (1 - (slam - 0.6) / 0.4), ahead = slam < 0.6 ? 0 : 12 * ((slam - 0.6) / 0.4);
    return spin(c, s, x + fx * ahead, y - up + fy * ahead * 0.5, Math.PI + (slam < 0.6 ? 0 : (slam - 0.6) * 4));
  }
  spin(c, s, x, y - 27, Math.PI / 2 + Math.sin(c.now * 18) * 0.3);
}

/** What marks a run goblin's kind: a board on its arm, a long spear, a brute's club. */
function kit(c: Ctx, e: Enemy, x: number, y: number): void {
  const f = e.fx >= 0 ? 1 : -1, g = c.lit;
  if (e.variant === 'shield') {
    // A door-plank shield, held toward whatever it faces.
    g.fillStyle = '#5a3f28';
    g.fillRect(Math.round(x + f * 4 - (f < 0 ? 3 : 0)), Math.round(y - 11), 3, 8);
    g.fillStyle = '#7a5a38';
    g.fillRect(Math.round(x + f * 4 - (f < 0 ? 3 : 0)), Math.round(y - 11), 3, 1);
    g.fillStyle = '#8a8a90';
    g.fillRect(Math.round(x + f * 5 - (f < 0 ? 3 : 0)), Math.round(y - 8), 1, 1);
  } else if (e.variant === 'lunger') line(g, x + f * 2, y - 8, Math.atan2(e.fy, e.fx), 0, 12, '#6b4a2b', 1), line(g, x + f * 2, y - 8, Math.atan2(e.fy, e.fx), 11, 14, '#cfd6dc', 1);
  else if (e.variant === 'heavy') (g.fillStyle = '#3a2a1a'), g.fillRect(Math.round(x + f * 5), Math.round(y - 14), 2, 10), (g.fillStyle = '#4a3a2a'), g.fillRect(Math.round(x + f * 4), Math.round(y - 16), 4, 3);
}
